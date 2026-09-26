import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Question

Question.objects.all().delete()
print("Cleared existing questions.")

questions = [
    {
        "text": "What is a topic, hobby, or project that you could talk about or work on for hours without getting bored?",
        "choices": []  # Open text
    },
    {
        "text": "If you could solve one big challenge in your community or the world, what would it be?",
        "choices": []  # Open text
    },
    {
        "text": "What kinds of activities make you feel most energized (e.g., building/creating things, writing/drawing, teaching/helping others, organizing/planning, researching/analyzing)?",
        "choices": []  # Open text
    },
    {
        "text": "Any age, experience level, or background context you want us to keep in mind? (Optional, e.g., '14 years old', 'mid-career switcher', 'no coding experience')",
        "choices": []  # Open text
    }
]

for i, q in enumerate(questions):
    obj, created = Question.objects.get_or_create(text=q["text"], defaults={"order": i+1, "choices": q["choices"]})
    print(f"Created question: {q['text']}")

print("Seeding complete.")
