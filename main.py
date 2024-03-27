from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# Ladda klassificeringspipeline en gång för att undvika att göra det för varje förfrågan
classifier = pipeline(task="text-classification", model="SamLowe/roberta-base-go_emotions")

@app.route('/classify', methods=['POST'])
def classify_text():
    data = request.json
    text = data.get('text', '')

    # Dela upp texten i meningar baserat på punkt.
    sentences = text.split('. ')
    
    # Filter tomma strängar efter split
    sentences = [sentence for sentence in sentences if sentence]

    if not sentences:
        return jsonify({"error": "No sentences provided."}), 400

    # Kör modellen på meningarna
    model_outputs = classifier(sentences)

    # Returnera klassificeringsresultaten som JSON
    return jsonify(model_outputs)

if __name__ == '__main__':
    app.run(debug=True)
