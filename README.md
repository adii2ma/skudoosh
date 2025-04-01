# SKUDOOSH - Voice Monitoring and Analysis System

A React Native application that continuously monitors speech, transcribes it using Insanely Fast Whisper, extracts keywords, and provides searchable logs with timestamps.

## Project Overview

This application runs a Python-based transcription server within an Android app, continuously listens to speech, processes it through Whisper for accurate transcription, and stores the results in a local database for later analysis.

## Core Features

- Real-time speech monitoring
- High-accuracy transcription using Insanely Fast Whisper
- Keyword extraction
- Searchable conversation logs
- Date-based filtering
- Continuous recording mode
- Built-in Python server using Chaquopy

## Project Structure

### React Native Components

- `App.js` - Root component, sets up navigation and global styles
- `/src/screens/`
  - `voicescreen.js` - Main recording interface
  - `logsscreen.js` - Search and view conversation history

### Services

- `/src/services/`
  - `audio.js` - Handles audio recording and chunking
  - `api.js` - API client for communicating with Python backend
  - `voice.js` - Voice recognition service
  - `pythonServer.js` - Interface for Python server management

### Python Backend

- `/android/app/src/main/python/`
  - `main.py` - Flask server implementation
  - `utils.py` - Core functionality (transcription, keyword extraction)
  - `db.py` - Database schema and operations
  - `server_bridge.py` - Bridge between React Native and Python

### Native Modules

- `/android/app/src/main/java/com/myvoiceapp/`
  - `PythonServerModule.java` - Native module for Python integration
  - `PythonServerPackage.java` - Package registration
  - `MainApplication.java` - Application setup

## Setup and Installation

### Prerequisites

1. Node.js and npm
2. React Native development environment
3. Android Studio
4. Python 3.8 or higher

### Dependencies Installation

```bash
# Install Node dependencies
npm install

# Install Python dependencies (handled by Chaquopy in build.gradle)
cd android
./gradlew installDebug
```

### Build Configuration

1. Update Android build files:
   - `android/build.gradle`
   - `android/app/build.gradle`

2. Configure Python packages in `android/app/build.gradle`:
```gradle
python {
    pip {
        install "flask"
        install "numpy"
        install "insanely-fast-whisper==0.0.15"
        install "torch==2.0.1"
        install "transformers>=4.35.0"
        install "optimum>=1.12.0"
        install "accelerate>=0.20.3"
    }
}
```

### Building the APK

1. Generate debug APK:
```bash
cd android
./gradlew assembleDebug
```

2. Generate release APK:
```bash
cd android
./gradlew assembleRelease
```

The APK will be located at:
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## Technical Details

### Speech Processing Flow

1. Audio Recording:
   - Captures audio in 5-second chunks
   - Uses VAD for silence detection
   - Saves as WAV files (16kHz, mono)

2. Transcription:
   - Processes audio through Insanely Fast Whisper
   - Uses distil-whisper/large-v2 model for mobile optimization
   - Returns text and confidence scores

3. Storage:
   - SQLite database for conversation storage
   - Timestamps and keyword indexing
   - Full-text search capabilities

### Database Schema

```sql
-- Conversations table
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Keywords table
CREATE TABLE recognized_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    confidence REAL NOT NULL,
    conversation_id INTEGER,
    recognized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations (id)
);
```

## Performance Considerations

- Audio is processed in chunks to manage memory usage
- Uses a smaller Whisper model optimized for mobile
- Database indices for efficient searching
- Background thread for Python server

## Known Limitations

- High battery usage in continuous mode
- Large APK size due to included models
- CPU-intensive transcription process
- Android-only (iOS not supported)

## Future Improvements

- Implement VAD optimization
- Add cloud backup option
- Reduce model size
- Add speaker diarization
- Implement iOS support

## License

MIT License - See LICENSE file for details
