import axios from 'axios';

// Use localhost with Android's special loopback address for the emulator
// In real device, this will point to the Flask server running within the app
const BASE_URL = 'http://10.0.2.2:5000/api';

export const sendAudioForTranscription = async (text) => {
  try {
    const response = await axios.post(`${BASE_URL}/transcribe`, {
      text: text,
    });
    console.log('Transcription Result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending audio for transcription:', error);
    throw error;
  }
};

export const getKeywordsFromDB = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/keywords`);
    return response.data;
  } catch (error) {
    console.error('Error fetching keywords:', error);
    throw error;
  }
};

export const searchConversationsByKeyword = async (keyword) => {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: { keyword }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching conversations:', error);
    throw error;
  }
};
