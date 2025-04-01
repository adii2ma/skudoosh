import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

export const sendAudioForTranscription = async (text) => {
  try {
    const response = await axios.post(`${BASE_URL}/transcribe`, {
      text: text,
    });
    console.log('Transcription Result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending audio for transcription:', error);
  }
};

export const getKeywordsFromDB = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/keywords`);
    return response.data;
  } catch (error) {
    console.error('Error fetching keywords:', error);
  }
};
