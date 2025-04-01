/*
import Voice from '@react-native-voice/voice';
import {sendAudioForTranscription} from './api';

class VoiceService {
  constructor() {
    this.isListening = false;
    this.continuousMode = false;
    this.results = [];
    this.onKeywordsDetectedCallback = null;

    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechVolumeChanged = this.onSpeechVolumeChanged;
  }

  onSpeechStart = (e) => {
    console.log('Speech started:', e);
    this.isListening = true;
  };

  onSpeechEnd = (e) => {
    console.log('Speech ended:', e);
    // If in continuous mode, restart listening immediately
    if (this.continuousMode) {
      setTimeout(() => {
        this.startListening().catch(error => {
          console.error('Error restarting voice service:', error);
        });
      }, 1000); // Small delay before restarting
    } else {
      this.isListening = false;
    }
  };

  onSpeechResults = async (e) => {
    console.log('Speech results:', e.value);
    if (e.value && e.value.length > 0) {
      try {
        const result = await sendAudioForTranscription(e.value[0]);
        this.results.push(result);
        
        if (this.onKeywordsDetectedCallback && result.keywords) {
          this.onKeywordsDetectedCallback(result);
        }
      } catch (error) {
        console.error('Error processing speech results:', error);
      }
    }
  };

  onSpeechError = (e) => {
    console.error('Speech error:', e.error);
    // If in continuous mode, try to restart listening despite error
    if (this.continuousMode) {
      setTimeout(() => {
        this.startListening().catch(error => {
          console.error('Error restarting voice service after error:', error);
        });
      }, 2000); // Longer delay after error
    } else {
      this.isListening = false;
    }
  };

  onSpeechVolumeChanged = (e) => {
    // Used for VAD (Voice Activity Detection)
    // console.log('Speech volume changed:', e.value);
  };

  startListening = async () => {
    try {
      await Voice.start('en-US');
      this.isListening = true;
      console.log('Listening...');
    } catch (error) {
      this.isListening = false;
      console.error('Error starting voice service:', error);
      throw error;
    }
  };

  stopListening = async () => {
    try {
      await Voice.stop();
      this.isListening = false;
      console.log('Stopped listening.');
    } catch (error) {
      console.error('Error stopping voice service:', error);
      throw error;
    }
  };

  toggleContinuousMode = (enable) => {
    this.continuousMode = enable;
    console.log(`Continuous mode ${enable ? 'enabled' : 'disabled'}`);
    
    // If enabling continuous mode and not already listening, start listening
    if (enable && !this.isListening) {
      this.startListening().catch(error => {
        console.error('Error starting continuous listening:', error);
      });
    }
  };

  getResults = () => {
    return this.results;
  };

  clearResults = () => {
    this.results = [];
  };

  setOnKeywordsDetectedCallback = (callback) => {
    this.onKeywordsDetectedCallback = callback;
  };
}

export default new VoiceService();
*/
