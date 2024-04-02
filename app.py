from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS # Lägg till denna import

from transformers import pipeline
import whisper
import warnings
from werkzeug.utils import secure_filename
import os

warnings.simplefilter("ignore")

app = Flask(__name__, static_folder='html')
CORS(app) # Aktivera CORS för hela appen

# Ladda klassificeringspipeline en gång för att undvika att göra det för varje förfrågan
app.logger.info("Loading models...")

classifier = pipeline(task="text-classification", model="SamLowe/roberta-base-go_emotions", top_k=6)
app.logger.info("Loaded roberta-base-go_emotions")

model = whisper.load_model("small")
app.logger.info("Loaded whisper")

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    app.logger.info("Got data to transcribe...")

    if 'file' not in request.files:
        return "No file part", 400
    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400
    if file and file.filename.endswith('.wav'):
        app.logger.info("Everything ok with data.")
        app.logger.info("Saving it as local file.")
        filename = secure_filename(file.filename)
        file_path = os.path.join('/tmp', filename)
        file.save(file_path)
        app.logger.info("Done. Transcribing... ")
        # Använd Whisper-modellen för att transkribera ljudfilen
        result = model.transcribe(audio=file_path, task="translate")        
        app.logger.info(result["text"])
        # Ta bort den temporära filen efter transkription
        os.remove(file_path)
        
        # Returnera den transkriberade texten
        return jsonify(result["text"]), 200
    else:
        return "Invalid file type", 400

@app.route('/classify', methods=['POST'])
def classify_text():
    data = request.json
    text = data.get('text', '')
    
    app.logger.info("Got text")
    app.logger.info(text)
    
    model_outputs = classifier(text)

    # Returnera klassificeringsresultaten som JSON
    return jsonify(model_outputs)

if __name__ == '__main__':
    app.run(debug=True)