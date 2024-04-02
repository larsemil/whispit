# Använd ett officiellt Python runtime som förälderbild
FROM python:3.8-slim

# Sätt arbetskatalogen i containern
WORKDIR /app

# Kopiera över filerna som behövs för att köra appen
COPY requirements.txt ./
# Anta att din Flask-app finns i app.py
COPY app.py ./ 

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Installera alla dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Göra port 5000 tillgänglig utanför containern
EXPOSE 5000

# Kör flask appen när containern startar
CMD ["flask", "--debug", "run", "--host=0.0.0.0"]
