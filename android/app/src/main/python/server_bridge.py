"""
This module serves as a bridge for the React Native app to start the Flask server.
It will be called by the Chaquopy Python service when the app starts.
"""

from main import start_server
from db import initialize_db

def start_python_server():
    """
    Initialize the database and start the Flask server.
    This function will be called from Java when the app launches.
    """
    print("Initializing database...")
    initialize_db()
    
    print("Starting Flask server...")
    server_thread = start_server()
    
    return "Server started successfully"

# This allows the function to be called directly when imported
if __name__ == "__main__":
    start_python_server()
