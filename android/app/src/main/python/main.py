from flask import Flask, request, jsonify
from utils import transcribe_audio, store_keywords, get_keywords
import os

app = Flask(__name__)

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    data = request.json
    text = data.get('text', '')
    keywords = transcribe_audio(text)
    store_keywords(keywords)
    return jsonify({'keywords': keywords})

@app.route('/api/keywords', methods=['GET'])
def get_stored_keywords():
    keywords = get_keywords()
    return jsonify({'keywords': keywords})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
