import axios from 'axios';
import keywordExtractor from './keywordExtractor';
import databaseService from './database';

// AssemblyAI API configuration
const ASSEMBLY_AI_API_KEY = 'YOUR_ASSEMBLY_AI_API_KEY';
const ASSEMBLY_AI_UPLOAD_URL = 'https://api.assemblyai.com/v2/upload';
const ASSEMBLY_AI_TRANSCRIPT_URL = 'https://api.assemblyai.com/v2/transcript';

// Commented out audio-related code as we're switching to call records
/*
export const sendAudioForTranscription = async (audioData) => {
  try {
    // First, upload the audio file
    const uploadResponse = await axios.post(ASSEMBLY_AI_UPLOAD_URL, audioData, {
      headers: {
        'Authorization': ASSEMBLY_AI_API_KEY,
        'Content-Type': 'audio/wav'
      }
    });

    const audioUrl = uploadResponse.data.upload_url;

    // Start transcription
    const transcriptResponse = await axios.post(ASSEMBLY_AI_TRANSCRIPT_URL, {
      audio_url: audioUrl,
      language_code: 'en',
      punctuate: true
    }, {
      headers: {
        'Authorization': ASSEMBLY_AI_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const transcriptId = transcriptResponse.data.id;

    // Poll for transcription completion
    let transcript = null;
    while (!transcript) {
      const pollingResponse = await axios.get(`${ASSEMBLY_AI_TRANSCRIPT_URL}/${transcriptId}`, {
        headers: {
          'Authorization': ASSEMBLY_AI_API_KEY
        }
      });

      if (pollingResponse.data.status === 'completed') {
        transcript = pollingResponse.data;
        break;
      } else if (pollingResponse.data.status === 'error') {
        throw new Error('Transcription failed');
      }

      // Wait 1 second before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get the transcribed text
    const text = transcript.text;
    
    // Extract keywords using TensorFlow.js
    const keywords = await keywordExtractor.extractKeywords(text);
    
    // Store in local SQLite database
    const conversationId = await databaseService.storeConversation(text, keywords);
    
    // Return the complete result
    const result = {
      id: conversationId,
      text,
      keywords: keywords.map(k => k.word)
    };
    
    console.log('Transcription Result:', result);
    return result;
  } catch (error) {
    console.error('Error sending audio for transcription:', error);
    throw error;
  }
};
*/

// New function to handle call recording transcription
export const processCallRecording = async (callData) => {
  try {
    // Process the call recording data
    const text = callData.transcript; // Assuming the call recording service provides transcript
    
    // Extract keywords using TensorFlow.js
    const keywords = await keywordExtractor.extractKeywords(text);
    
    // Store in local SQLite database
    const conversationId = await databaseService.storeConversation(text, keywords);
    
    // Return the complete result
    const result = {
      id: conversationId,
      text,
      keywords: keywords.map(k => k.word)
    };
    
    console.log('Call Recording Result:', result);
    return result;
  } catch (error) {
    console.error('Error processing call recording:', error);
    throw error;
  }
};

export const getKeywordsFromDB = async () => {
  try {
    return await databaseService.getKeywords();
  } catch (error) {
    console.error('Error fetching keywords:', error);
    throw error;
  }
};

export const searchConversationsByKeyword = async (keyword) => {
  try {
    return await databaseService.searchConversations(keyword);
  } catch (error) {
    console.error('Error searching conversations:', error);
    throw error;
  }
};

export const getFilteredLogs = async (startDate, endDate, keyword) => {
  try {
    return await databaseService.getFilteredLogs(startDate, endDate, keyword);
  } catch (error) {
    console.error('Error fetching filtered logs:', error);
    throw error;
  }
};
