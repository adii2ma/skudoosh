import axios from 'axios';
import keywordExtractor from './keywordExtractor';

// Use localhost with Android's special loopback address for the emulator
// In real device, this will point to the Flask server running within the app
const BASE_URL = 'http://10.0.2.2:5000/api';

export const sendAudioForTranscription = async (audioData) => {
  try {
    // First send the audio data for transcription
    const response = await axios.post(`${BASE_URL}/transcribe`, {
      audio: audioData, // This is already base64 encoded
      format: 'wav',
      sampleRate: 16000,
    });
    
    // Get the transcribed text and conversation ID
    const { text, id } = response.data;
    
    // Extract keywords using TensorFlow.js
    const keywords = await keywordExtractor.extractKeywords(text);
    
    // Send the keywords back to the server to be stored with the conversation
    await storeKeywords(id, keywords);
    
    // Return the complete result
    const result = {
      ...response.data,
      keywords: keywords.map(k => k.word) // Send just the words, not the scores
    };
    
    console.log('Transcription Result:', result);
    return result;
  } catch (error) {
    console.error('Error sending audio for transcription:', error);
    throw error;
  }
};

export const storeKeywords = async (conversationId, keywords) => {
  try {
    const response = await axios.post(`${BASE_URL}/store-keywords`, {
      conversation_id: conversationId,
      keywords: keywords
    });
    return response.data;
  } catch (error) {
    console.error('Error storing keywords:', error);
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
