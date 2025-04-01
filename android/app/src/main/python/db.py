import sqlite3
import os

DB_FILE = 'db.sqlite'

def initialize_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Create a table for storing full conversations
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create table for keywords with reference to conversations
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recognized_keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            keyword TEXT NOT NULL,
            confidence REAL NOT NULL,
            conversation_id INTEGER,
            recognized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully")

def get_db_path():
    # Get absolute path for database to ensure it's accessible
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(current_dir, DB_FILE)

if __name__ == '__main__':
    initialize_db()
