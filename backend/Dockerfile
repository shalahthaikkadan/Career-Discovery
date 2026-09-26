# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Run collectstatic
RUN DJANGO_SECRET_KEY=build-dummy python manage.py collectstatic --noinput

# Run migrations, seed data (idempotent via get_or_create), and start server
CMD ["sh", "-c", "python manage.py migrate && python seed_data.py && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120"]
