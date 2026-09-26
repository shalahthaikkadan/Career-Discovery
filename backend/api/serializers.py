from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Question, UserResponse, CareerSuggestion, RoadmapStep, ChatMessage

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=12, max_length=1024)
    email = serializers.EmailField(required=False, allow_blank=True, max_length=254)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

    def validate_password(self, value):
        validate_password(value)
        return value

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'order', 'choices']

class ChatMessageSerializer(serializers.ModelSerializer):
    text = serializers.CharField(max_length=4000)
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'text', 'created_at']

class RoadmapStepSerializer(serializers.ModelSerializer):
    chat_messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = RoadmapStep
        fields = ['id', 'order', 'title', 'description', 'duration', 'resources', 'deep_dive', 'chat_messages']

class CareerSuggestionSerializer(serializers.ModelSerializer):
    roadmap_steps = RoadmapStepSerializer(many=True, read_only=True)

    class Meta:
        model = CareerSuggestion
        fields = ['id', 'title', 'type', 'description', 'reasoning', 'roadmap_steps']

class UserResponseSerializer(serializers.ModelSerializer):
    suggestions = CareerSuggestionSerializer(many=True, read_only=True)
    answers = serializers.JSONField()

    class Meta:
        model = UserResponse
        fields = ['id', 'answers', 'suggestions', 'created_at']

    def validate_answers(self, value):
        if not isinstance(value, dict) or len(value) > 20:
            raise serializers.ValidationError('Answers must be an object with at most 20 entries.')

        for key, answer in value.items():
            if not isinstance(key, str) or len(key) > 255:
                raise serializers.ValidationError('Answer keys are invalid.')
            if not isinstance(answer, (str, int, float, bool)) or (isinstance(answer, str) and len(answer) > 2000):
                raise serializers.ValidationError('Answer values are invalid or too large.')

        return value
