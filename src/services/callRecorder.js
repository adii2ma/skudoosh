import { NativeModules, NativeEventEmitter } from 'react-native';
import RNFS from 'react-native-fs';
import { processCallRecording } from './api';

const { CallRecorderModule } = NativeModules;

class CallRecorderService {
  constructor() {
    this.isRecording = false;
    this.eventEmitter = new NativeEventEmitter(CallRecorderModule);
    this.onCallRecordingCallback = null;
  }

  async initialize() {
    try {
      await CallRecorderModule.initialize();
      this.setupEventListeners();
      console.log('Call recorder service initialized successfully');
    } catch (error) {
      console.error('Error initializing call recorder service:', error);
    }
  }

  setupEventListeners() {
    // Listen for call recording events
    this.eventEmitter.addListener('onCallRecordingStarted', this.handleCallRecordingStarted);
    this.eventEmitter.addListener('onCallRecordingStopped', this.handleCallRecordingStopped);
    this.eventEmitter.addListener('onCallRecordingError', this.handleCallRecordingError);
  }

  handleCallRecordingStarted = (data) => {
    console.log('Call recording started:', data);
    this.isRecording = true;
  };

  handleCallRecordingStopped = async (data) => {
    console.log('Call recording stopped:', data);
    this.isRecording = false;

    try {
      // Read the recorded file
      const audioData = await RNFS.readFile(data.filePath, 'base64');
      
      // Process the recording
      const result = await processCallRecording({
        transcript: data.transcript,
        audioData,
        timestamp: new Date().toISOString(),
        duration: data.duration,
        phoneNumber: data.phoneNumber
      });

      if (this.onCallRecordingCallback) {
        this.onCallRecordingCallback(result);
      }

      // Clean up the file
      await RNFS.unlink(data.filePath);
    } catch (error) {
      console.error('Error processing call recording:', error);
    }
  };

  handleCallRecordingError = (error) => {
    console.error('Call recording error:', error);
    this.isRecording = false;
  };

  startRecording = async () => {
    if (this.isRecording) return;
    
    try {
      await CallRecorderModule.startRecording();
      this.isRecording = true;
      console.log('Started call recording');
    } catch (error) {
      this.isRecording = false;
      console.error('Error starting call recording:', error);
    }
  };

  stopRecording = async () => {
    if (!this.isRecording) return;
    
    try {
      await CallRecorderModule.stopRecording();
      this.isRecording = false;
      console.log('Stopped call recording');
    } catch (error) {
      console.error('Error stopping call recording:', error);
    }
  };

  setOnCallRecordingCallback = (callback) => {
    this.onCallRecordingCallback = callback;
  };

  cleanup() {
    this.eventEmitter.removeAllListeners('onCallRecordingStarted');
    this.eventEmitter.removeAllListeners('onCallRecordingStopped');
    this.eventEmitter.removeAllListeners('onCallRecordingError');
  }
}

export default new CallRecorderService(); 