import sqlite3
import os
import json
import tempfile
import subprocess
from datetime import datetime
import tensorflow as tf
import numpy as np

# Import the db module to use the get_db_path function
from db import get_db_path

MODEL_FILE = 'model.tflite'

def save_audio_to_temp_file(audio_data):
    """
    Save audio data to a temporary file for processing with Whisper.
    
    Args:
        audio_data (bytes): Raw audio data
        
    Returns:
        str: Path to the temporary file
    """
    temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    temp_file.write(audio_data)
    temp_file.close()
    return temp_file.name

def transcribe_audio_with_whisper(audio_file_path):
    """
    Use Insanely Fast Whisper to transcribe audio.
    
    Args:
        audio_file_path (str): Path to the audio file
        
    Returns:
        str: Transcribed text
    """
    try:
        # Run insanely-fast-whisper as a subprocess
        cmd = [
            "insanely-fast-whisper",
            "--file-name", audio_file_path,
            "--model-name", "distil-whisper/large-v2",  # Using a smaller model for mobile
            "--batch-size", "4",
            "--device-id", "cpu",
            "--transcript-path", "temp_transcript.json"
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        # Read the transcript from the output file
        with open("temp_transcript.json", "r") as f:
            transcript_data = json.load(f)
        
        # Extract text from the transcript
        transcribed_text = transcript_data.get("text", "")
        
        # Clean up the temporary transcript file
        if os.path.exists("temp_transcript.json"):
            os.remove("temp_transcript.json")
            
        return transcribed_text
    except Exception as e:
        print(f"Error in Whisper transcription: {e}")
        return f"Transcription error: {str(e)}"

def transcribe_audio(audio_data):
    """
    Transcribe audio using Insanely Fast Whisper.
    
    Args:
        audio_data: Raw audio data (base64 decoded)
        
    Returns:
        tuple: (transcribed_text, keywords)
    """
    try:
        # Save audio to a temporary file
        audio_file = save_audio_to_temp_file(audio_data)
        
        # Transcribe using Whisper
        transcribed_text = transcribe_audio_with_whisper(audio_file)
        
        # Clean up temporary file
        if os.path.exists(audio_file):
            os.remove(audio_file)
        
        # Extract keywords from transcribed text
        keywords = detect_keywords(transcribed_text)
        
        return transcribed_text, keywords
    except Exception as e:
        print(f"Error in transcription: {e}")
        return f"Transcription error: {str(e)}", []

def detect_keywords(text):
    try:
        # Get the absolute path to the model file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, MODEL_FILE)
        
        # Check if model exists, if not return dummy keywords for testing
        if not os.path.exists(model_path):
            print(f"Model file not found at {model_path}, returning sample keywords")
            # Extract simple keywords based on word frequency
            words = text.lower().split()
            # Remove common words and punctuation
            common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'is', 'am', 'are'}
            keywords = [word for word in words if word not in common_words and len(word) > 3]
            # Return top 5 keywords or fewer if not enough
            return list(set(keywords))[:5]
        
        # In real implementation, this would use TensorFlow Lite to detect keywords
        interpreter = tf.lite.Interpreter(model_path=model_path)
        interpreter.allocate_tensors()

        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        
        # Process text for input to model
        input_text = np.array([text], dtype=np.string_)
        interpreter.set_tensor(input_details[0]['index'], input_text)
        interpreter.invoke()

        output_data = interpreter.get_tensor(output_details[0]['index'])
        return json.loads(output_data[0])
    except Exception as e:
        print(f"Error in keyword detection: {e}")
        # Fallback to simple keyword extraction
        words = text.lower().split()
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'is', 'am', 'are'}
        keywords = [word for word in words if word not in common_words and len(word) > 3]
        return list(set(keywords))[:5]

def store_conversation_and_keywords(text, keywords):
    try:
        db_path = get_db_path()
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Store the full conversation text
        cursor.execute('INSERT INTO conversations (text) VALUES (?)', (text,))
        conversation_id = cursor.lastrowid
        
        # Store each keyword with reference to the conversation
        for keyword in keywords:
            cursor.execute(
                'INSERT INTO recognized_keywords (keyword, confidence, conversation_id) VALUES (?, ?, ?)',
                (keyword, 1.0, conversation_id)
            )
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error storing data: {e}")
        return False

def get_keywords():
    try:
        db_path = get_db_path()
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT DISTINCT keyword FROM recognized_keywords ORDER BY recognized_at DESC')
        results = cursor.fetchall()
        conn.close()
        return [result[0] for result in results]
    except Exception as e:
        print(f"Error getting keywords: {e}")
        return []

def search_conversations_by_keyword(keyword):
    try:
        db_path = get_db_path()
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = '''
        SELECT c.id, c.text, c.timestamp, GROUP_CONCAT(rk.keyword) as keywords
        FROM conversations c
        JOIN recognized_keywords rk ON c.id = rk.conversation_id
        WHERE rk.keyword LIKE ?
        GROUP BY c.id
        ORDER BY c.timestamp DESC
        '''
        
        cursor.execute(query, (f"%{keyword}%",))
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            results.append({
                'id': row['id'],
                'text': row['text'],
                'timestamp': row['timestamp'],
                'keywords': row['keywords'].split(',') if row['keywords'] else []
            })
            
        conn.close()
        return results
    except Exception as e:
        print(f"Error searching conversations: {e}")
        return []

def filter_logs_by_date_and_keyword(start_date=None, end_date=None, keyword=None):
    """
    Filter conversation logs by date range and/or keyword.
    
    Args:
        start_date (str): Start date in ISO format (YYYY-MM-DD)
        end_date (str): End date in ISO format (YYYY-MM-DD)
        keyword (str): Keyword to search for
        
    Returns:
        list: Filtered conversation records
    """
    try:
        db_path = get_db_path()
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Base query
        query = """
            SELECT c.id, c.text, c.timestamp, GROUP_CONCAT(rk.keyword) as keywords
            FROM conversations c
            LEFT JOIN recognized_keywords rk ON c.id = rk.conversation_id
        """
        
        conditions = []
        params = []
        
        # Add date filters if provided
        if start_date:
            conditions.append("DATE(c.timestamp) >= DATE(?)")
            params.append(start_date)
        
        if end_date:
            conditions.append("DATE(c.timestamp) <= DATE(?)")
            params.append(end_date)
        
        # Add keyword filter if provided
        if keyword:
            conditions.append("""
                EXISTS (
                    SELECT 1 FROM recognized_keywords k 
                    WHERE k.conversation_id = c.id AND k.keyword LIKE ?
                )
            """)
            params.append(f"%{keyword}%")
        
        # Add conditions to query
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        # Group and order
        query += " GROUP BY c.id ORDER BY c.timestamp DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            results.append({
                'id': row['id'],
                'text': row['text'],
                'timestamp': row['timestamp'],
                'keywords': row['keywords'].split(',') if row['keywords'] else []
            })
            
        conn.close()
        return results
    except Exception as e:
        print(f"Error filtering logs: {e}")
        return []
