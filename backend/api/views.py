import logging
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from .models import Question, UserResponse, CareerSuggestion, RoadmapStep, ChatMessage
from .serializers import QuestionSerializer, UserResponseSerializer, UserSerializer, RoadmapStepSerializer, ChatMessageSerializer
from .services import get_career_suggestion, get_step_deep_dive, get_step_chat

User = get_user_model()
logger = logging.getLogger(__name__)

# VERSION: 1.0.3 - Explicit get_user_model
print("--- STARTING CAREERSEA API VIEWS ---")

class AuthThrottle(AnonRateThrottle):
    scope = 'auth'

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthThrottle]

class UserHistoryView(generics.ListAPIView):
    serializer_class = UserResponseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserResponse.objects.filter(user=self.request.user).order_by('-created_at')[:50]

class AssessmentBurstThrottle(AnonRateThrottle):
    scope = 'assessment_burst'

class AssessmentSustainedThrottle(AnonRateThrottle):
    scope = 'assessment_sustained'

class AssessmentUserBurstThrottle(UserRateThrottle):
    scope = 'assessment_user_burst'

class AssessmentUserSustainedThrottle(UserRateThrottle):
    scope = 'assessment_user_sustained'

class StepAIThrottle(UserRateThrottle):
    scope = 'step_ai'

class QuestionListView(generics.ListAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer

class SubmitAssessmentView(APIView):
    throttle_classes = [AssessmentBurstThrottle, AssessmentSustainedThrottle, AssessmentUserBurstThrottle, AssessmentUserSustainedThrottle]
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserResponseSerializer(data=request.data)
        if serializer.is_valid():
            answers = serializer.validated_data['answers']
            
            try:
                # Link to user if authenticated
                user = request.user if request.user.is_authenticated else None
                user_response = serializer.save(user=user)
                
                suggestion_data_list = get_career_suggestion(answers)
                
                # Safety fallback
                if isinstance(suggestion_data_list, dict):
                    suggestion_data_list = [suggestion_data_list]
                
                for suggestion_data in suggestion_data_list:
                    # Save CareerSuggestion
                    career_data = suggestion_data.get('career', {})
                    roadmap_data = suggestion_data.get('roadmap', [])
                    path_type = suggestion_data.get('type', 'mainstream')
                    
                    suggestion = CareerSuggestion.objects.create(
                        user_response=user_response,
                        title=career_data.get('title', 'Unknown Career'),
                        type=path_type,
                        description=career_data.get('description', ''),
                        reasoning=career_data.get('reasoning', '')
                    )
                    
                    # Save RoadmapSteps
                    for i, step in enumerate(roadmap_data):
                        RoadmapStep.objects.create(
                            career=suggestion,
                            title=step.get('title', ''),
                            description=step.get('description', ''),
                            duration=step.get('duration', ''),
                            resources=step.get('resources', []),
                            order=i+1
                        )
                
                return Response(UserResponseSerializer(user_response).data, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.exception("Error in SubmitAssessmentView")
                return Response({"error": "Assessment processing failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoadmapStepDetailView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [StepAIThrottle]

    def get(self, request, step_id):
        try:
            step = RoadmapStep.objects.select_related('career__user_response').get(
                pk=step_id,
                career__user_response__user=request.user,
            )
        except RoadmapStep.DoesNotExist:
            return Response({"error": "RoadmapStep not found"}, status=status.HTTP_404_NOT_FOUND)

        # Generate deep dive on demand if it doesn't exist yet
        if not step.deep_dive:
            try:
                deep_dive_content = get_step_deep_dive(
                    career_title=step.career.title,
                    step_title=step.title,
                    step_description=step.description,
                    duration=step.duration,
                    resources=step.resources,
                    user_answers=step.career.user_response.answers
                )
                step.deep_dive = deep_dive_content
                step.save()
            except Exception as e:
                import traceback
                traceback.print_exc()
                logger.exception("Error generating deep dive during detail fetch")
                return Response({"error": "Failed to generate deep dive."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = RoadmapStepSerializer(step)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RoadmapStepChatView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [StepAIThrottle]

    def post(self, request, step_id):
        try:
            step = RoadmapStep.objects.select_related('career__user_response').get(
                pk=step_id,
                career__user_response__user=request.user,
            )
        except RoadmapStep.DoesNotExist:
            return Response({"error": "RoadmapStep not found"}, status=status.HTTP_404_NOT_FOUND)

        user_text = request.data.get('text', '')
        if not isinstance(user_text, str):
            user_text = ''
        user_text = user_text.strip()
        if not user_text or len(user_text) > 4000:
            return Response({"error": "Message text is required"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Get existing chat history (before saving the new message)
        history = list(step.chat_messages.all()[:50])

        # 2. Call AI mentor
        try:
            ai_response = get_step_chat(
                career_title=step.career.title,
                step_title=step.title,
                step_description=step.description,
                deep_dive=step.deep_dive or "No study guide available.",
                chat_history=history,
                new_message=user_text,
                user_answers=step.career.user_response.answers
            )

            # 3. Save both user message and AI response
            ChatMessage.objects.create(
                step=step,
                sender='user',
                text=user_text
            )
            ChatMessage.objects.create(
                step=step,
                sender='ai',
                text=ai_response
            )

            # 4. Return updated chat history
            updated_history = step.chat_messages.all()[:100]
            serializer = ChatMessageSerializer(updated_history, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.exception("Error generating mentor chat response")
            return Response({"error": "Failed to get mentor response."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
