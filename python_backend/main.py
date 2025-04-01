from flask import Flask, request, jsonify
from utils import transcribe_audio, store_conversation, get_keywords, search_conversations_by_keyword, filter_logs_by_date_and_keyword
from db import initialize_db
import os
import base64
import threading
import time

app = Flask(__name__)

# Initialize the database when the app starts
initialize_db()

@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    try:
        data = request.json
        
        # Check if we're receiving audio data
        if 'audio' in data:
            # Decode base64 audio data
            audio_data = base64.b64decode(data['audio'])
            
            # Log information about the incoming audio
            print(f"Received audio data: {len(audio_data)} bytes")
            print(f"Format: {data.get('format', 'unknown')}")
            print(f"Sample Rate: {data.get('sampleRate', 'unknown')}")
            
            # Process with Whisper - only transcription, no keyword extraction
            transcribed_text = transcribe_audio(audio_data)
            
            # If keywords are sent from the frontend, store them too
            keywords = data.get('keywords', None)
            conversation_id = store_conversation(transcribed_text, keywords)
            
            return jsonify({
                'success': conversation_id is not None,
                'id': conversation_id,
                'text': transcribed_text
            })
        else:
            return jsonify({'error': 'No audio data provided'}), 400
            
    except Exception as e:
        print(f"Error in transcribe endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/store-keywords', methods=['POST'])
def store_keywords():
    """
    Store keywords for an existing conversation.
    This endpoint receives keywords extracted by TensorFlow.js
    """
    try:
        data = request.json
        conversation_id = data.get('conversation_id')
        keywords = data.get('keywords', [])
        
        if not conversation_id:
            return jsonify({'error': 'No conversation_id provided'}), 400
            
        # Update the conversation with keywords
        from utils import store_conversation_keywords
        success = store_conversation_keywords(conversation_id, keywords)
        
        return jsonify({'success': success})
    except Exception as e:
        print(f"Error in store-keywords endpoint: {e}")
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