import { AudioRecorder, AudioUtils } from 'react-native-audio';
import RNFS from 'react-native-fs';
import { sendAudioForTranscription } from './api';

class AudioService {
  constructor() {
    this.isRecording = false;
    this.currentFilePath = null;
    this.chunkDuration = 5000; // 5 seconds per chunk
    this.silenceThreshold = 0.2; // Silence threshold for VAD
    this.silenceDuration = 1000; // 1 second of silence to consider speech ended
    this.onTranscriptionCallback = null;
    this.timerId = null;
  }

  async initialize() {
    await AudioRecorder.requestAuthorization();
    AudioRecorder.onFinished = this.onFinishRecording;
  }

  onFinishRecording = async (data) => {
    if (data.status === "OK" && data.audioFileURL) {
      try {
        // Read the file as binary data
        const audioData = await RNFS.readFile(data.audioFileURL, 'base64');
        
        // Send to backend for processing
        const result = await sendAudioForTranscription(audioData);
        
        if (this.onTranscriptionCallback) {
          this.onTranscriptionCallback(result);
        }
        
        // Clean up file
        await RNFS.unlink(data.audioFileURL);
        
        // Start a new recording if we're still in recording mode
        if (this.isRecording) {
          this.startNewChunk();
        }
      } catch (error) {
        console.error('Error processing audio chunk:', error);
      }
    }
  };

  startNewChunk = async () => {
    try {
      this.currentFilePath = `${AudioUtils.DocumentDirectoryPath}/audio_chunk_${Date.now()}.wav`;
      
      // Configure audio recording
      await AudioRecorder.prepareRecordingAtPath(this.currentFilePath, {
        SampleRate: 16000, // Whisper works best with 16kHz
        Channels: 1, // Mono
        AudioQuality: "High",
        AudioEncoding: "wav",
        OutputFormat: "wav",
      });
      
      await AudioRecorder.startRecording();
      
      // Set a timer to finish this chunk after the specified duration
      this.timerId = setTimeout(() => {
        if (this.isRecording) {
          AudioRecorder.stopRecording();
        }
      }, this.chunkDuration);
    } catch (error) {
      console.error('Error starting new audio chunk:', error);
    }
  };

  startRecording = async () => {
    if (this.isRecording) return;
    
    try {
      this.isRecording = true;
      await this.startNewChunk();
      console.log('Started audio recording');
    } catch (error) {
      this.isRecording = false;
      console.error('Error starting recording:', error);
    }
  };

  stopRecording = async () => {
    if (!this.isRecording) return;
    
    try {
      this.isRecording = false;
      clearTimeout(this.timerId);
      await AudioRecorder.stopRecording();
      console.log('Stopped audio recording');
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  setOnTranscriptionCallback = (callback) => {
    this.onTranscriptionCallback = callback;
  };
}

export default new AudioService();
