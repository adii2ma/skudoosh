import sqlite3
import fast_whisper
import tensorflow as tf

DB_FILE = 'db.sqlite'
MODEL_FILE = 'model.tflite'

def transcribe_audio(text):
    model = fast_whisper.Whisper()
    transcription = model.transcribe(text)
    return detect_keywords(transcription)

def detect_keywords(text):
    interpreter = tf.lite.Interpreter(model_path=MODEL_FILE)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    interpreter.set_tensor(input_details[0]['index'], [text])
    interpreter.invoke()

    output_data = interpreter.get_tensor(output_details[0]['index'])
    return output_data

def store_keywords(keywords):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('INSERT INTO recognized_keywords (keyword, confidence) VALUES (?, ?)', (keywords, 1.0))
    conn.commit()
    conn.close()

def get_keywords():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT keyword FROM recognized_keywords')
    results = cursor.fetchall()
    conn.close()
    return [result[0] for result in results]
