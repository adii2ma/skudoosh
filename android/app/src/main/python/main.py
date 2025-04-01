from flask import Flask, request, jsonify
from utils import transcribe_audio, store_conversation_and_keywords, get_keywords, search_conversations_by_keyword, filter_logs_by_date_and_keyword
from db import initialize_db
import os
import threading
import time

app = Flask(__name__)

# Initialize the database when the app starts
initialize_db()

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
            
        full_text, keywords = transcribe_audio(text)
        success = store_conversation_and_keywords(full_text, keywords)
        
        return jsonify({
            'success': success,
            'text': full_text,
            'keywords': keywords
        })
    except Exception as e:
        print(f"Error in transcribe endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/keywords', methods=['GET'])
def get_stored_keywords():
    try:
        keywords = get_keywords()
        return jsonify({'keywords': keywords})
    except Exception as e:
        print(f"Error in keywords endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search():
    try:
        keyword = request.args.get('keyword', '')
        if not keyword:
            return jsonify({'error': 'No keyword provided'}), 400
            
        conversations = search_conversations_by_keyword(keyword)
        return jsonify({'conversations': conversations})
    except Exception as e:
        print(f"Error in search endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        start_date = request.args.get('start_date', None)
        end_date = request.args.get('end_date', None)
        keyword = request.args.get('keyword', None)
        
        logs = filter_logs_by_date_and_keyword(start_date, end_date, keyword)
        return jsonify({'logs': logs})
    except Exception as e:
        print(f"Error in logs endpoint: {e}")
        return jsonify({'error': str(e)}), 500

# Function to start Flask server in a thread
def run_server():
    app.run(host='0.0.0.0', port=5000)

def start_server():
    server_thread = threading.Thread(target=run_server)
    server_thread.daemon = True
    server_thread.start()
    print("Flask server started in background thread")
    return server_thread

if __name__ == '__main__':
    start_server()
    # Keep main thread alive (only needed when running this script directly)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Server shutting down...")
