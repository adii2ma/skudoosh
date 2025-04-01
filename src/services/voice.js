import Voice from '@react-native-voice/voice';
import {sendAudioForTranscription} from './api';

class VoiceService {
  constructor() {
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechError = this.onSpeechError;
  }

  onSpeechStart = (e) => {
    console.log('Speech started:', e);
  };

  onSpeechEnd = (e) => {
    console.log('Speech ended:', e);
  };

  onSpeechResults = async (e) => {
    console.log('Speech results:', e.value);
    if (e.value && e.value.length > 0) {
      await sendAudioForTranscription(e.value[0]);
    }
  };

  onSpeechError = (e) => {
    console.error('Speech error:', e.error);
  };

  startListening = async () => {
    try {
      await Voice.start('en-US');
      console.log('Listening...');
    } catch (error) {
      console.error('Error starting voice service:', error);
    }
  };

  stopListening = async () => {
    try {
      await Voice.stop();
      console.log('Stopped listening.');
    } catch (error) {
      console.error('Error stopping voice service:', error);
    }
  };
}

export default new VoiceService();
