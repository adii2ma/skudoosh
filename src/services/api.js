import axios from 'axios';

// Use localhost with Android's special loopback address for the emulator
// In real device, this will point to the Flask server running within the app
const BASE_URL = 'http://10.0.2.2:5000/api';

export const sendAudioForTranscription = async (audioData) => {
  try {
    // Send the base64 encoded audio data
    const response = await axios.post(`${BASE_URL}/transcribe`, {
      audio: audioData, // This is already base64 encoded
      format: 'wav',
      sampleRate: 16000,
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

export const getFilteredLogs = async (startDate, endDate, keyword) => {
  try {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (keyword) params.keyword = keyword;
    
    const response = await axios.get(`${BASE_URL}/logs`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching filtered logs:', error);
    throw error;
  }
};
