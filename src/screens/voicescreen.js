import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Switch, NativeEventEmitter, NativeModules} from 'react-native';
import {getKeywordsFromDB, searchConversationsByKeyword, processCallRecording} from '../services/api';
import {startPythonServer, isServerRunning} from '../services/pythonServer';
import callRecorderService from '../services/callRecorder';

const VoiceScreen = ({ navigation }) => {
  const [serverStatus, setServerStatus] = useState('checking...');
  const [keywords, setKeywords] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Check and start Python server
    const initServer = async () => {
      try {
        const running = await isServerRunning();
        if (!running) {
          setServerStatus('starting...');
          const result = await startPythonServer();
          setServerStatus('running');
        } else {
          setServerStatus('running');
        }
      } catch (error) {
        console.error('Server initialization error:', error);
        setServerStatus('error: ' + error.message);
      }
    };

    // Initialize call recorder
    const initCallRecorder = async () => {
      try {
        await callRecorderService.initialize();
        console.log('Call recorder initialized');
      } catch (error) {
        console.error('Error initializing call recorder:', error);
      }
    };

    // Fetch initial keywords
    const fetchKeywords = async () => {
      try {
        const response = await getKeywordsFromDB();
        if (response && response.keywords) {
          setKeywords(response.keywords);
        }
      } catch (error) {
        console.error('Error fetching keywords:', error);
      }
    };

    initServer();
    initCallRecorder();
    fetchKeywords();

    // Set up call recording event listeners
    const eventEmitter = new NativeEventEmitter(NativeModules.CallRecorderModule);
    const startRecordingSubscription = eventEmitter.addListener('startCallRecording', () => {
      setIsRecording(true);
    });
    const stopRecordingSubscription = eventEmitter.addListener('stopCallRecording', () => {
      setIsRecording(false);
    });

    // Set callback for call recording results
    callRecorderService.setOnCallRecordingCallback((result) => {
      setResults(prev => [...prev, result]);
      fetchKeywords(); // Refresh keywords after new detection
    });

    return () => {
      // Clean up
      startRecordingSubscription.remove();
      stopRecordingSubscription.remove();
      callRecorderService.cleanup();
    };
  }, []);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    
    try {
      const response = await searchConversationsByKeyword(searchKeyword);
      if (response && response.conversations) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error('Error searching conversations:', error);
    }
  };

  const handleKeywordPress = (keyword) => {
    setSearchKeyword(keyword);
    handleSearch();
  };

  // Add navigation to logs screen
  const navigateToLogs = () => {
    navigation.navigate('Logs');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Call Recording</Text>
      <Text style={styles.serverStatus}>Server Status: {serverStatus}</Text>
      <Text style={styles.recordingStatus}>
        Recording Status: {isRecording ? 'Active' : 'Inactive'}
      </Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by keyword"
          value={searchKeyword}
          onChangeText={setSearchKeyword}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Recently Detected Keywords:</Text>
      <View style={styles.keywordsContainer}>
        {keywords.map((keyword, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.keywordBadge}
            onPress={() => handleKeywordPress(keyword)}
          >
            <Text style={styles.keywordText}>{keyword}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.sectionTitle}>
        {conversations.length > 0 ? 'Search Results:' : 'Recent Recordings:'}
      </Text>
      <FlatList
        data={conversations.length > 0 ? conversations : results}
        keyExtractor={(item, index) => index.toString()}
        style={styles.resultsList}
        renderItem={({item}) => (
          <View style={styles.resultItem}>
            <Text style={styles.resultText}>{item.text || item.keywords.join(', ')}</Text>
            <Text style={styles.timestampText}>
              {item.timestamp || new Date().toLocaleString()}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  serverStatus: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  recordingStatus: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: 'white',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  keywordBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  keywordText: {
    color: '#333',
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  resultText: {
    fontSize: 14,
  },
  timestampText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
});

export default VoiceScreen;
