/*
import { AudioRecorder, AudioUtils } from 'react-native-audio';
import RNFS from 'react-native-fs';
import { sendAudioForTranscription } from './api';

class AudioService {
  constructor() {
    this.isRecording = false;
    this.currentFilePath = null;
    this.chunkDuration = 5000; // 5 seconds per chunk
    this.onTranscriptionCallback = null;
    this.timerId = null;
  }

  async initialize() {
    try {
      await AudioRecorder.requestAuthorization();
      AudioRecorder.onFinished = this.onFinishRecording;
      console.log('Audio service initialized successfully');
    } catch (error) {
      console.error('Error initializing audio service:', error);
    }
  }

  onFinishRecording = async (data) => {
    if (data.status === "OK" && data.audioFileURL) {
      try {
        // Read the file as base64
        const audioData = await RNFS.readFile(data.audioFileURL, 'base64');
        
        // Send to API for transcription
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
      
      await AudioRecorder.prepareRecordingAtPath(this.currentFilePath, {
        SampleRate: 16000,
        Channels: 1,
        AudioQuality: "High",
        AudioEncoding: "wav",
        OutputFormat: "wav",
      });
      
      await AudioRecorder.startRecording();
      
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
      console.log('Started continuous audio recording');
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
*/
