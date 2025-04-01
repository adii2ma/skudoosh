import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Switch} from 'react-native';
import VoiceService from '../services/voice';
import {getKeywordsFromDB, searchConversationsByKeyword} from '../services/api';
import {startPythonServer, isServerRunning} from '../services/pythonServer';

const VoiceScreen = ({ navigation }) => {
  const [isListening, setIsListening] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking...');
  const [keywords, setKeywords] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [results, setResults] = useState([]);

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
    fetchKeywords();

    // Set callback for keyword detection
    VoiceService.setOnKeywordsDetectedCallback((result) => {
      setResults(prev => [...prev, result]);
      fetchKeywords(); // Refresh keywords after new detection
    });

    return () => {
      // Cleanup
      VoiceService.setOnKeywordsDetectedCallback(null);
    };
  }, []);

  const handleToggleListen = async () => {
    try {
      if (isListening) {
        await VoiceService.stopListening();
      } else {
        await VoiceService.startListening();
      }
      setIsListening(!isListening);
    } catch (error) {
      console.error('Error toggling voice service:', error);
    }
  };

  const handleToggleContinuous = (value) => {
    setContinuousMode(value);
    VoiceService.toggleContinuousMode(value);
    if (value && !isListening) {
      setIsListening(true);
    }
  };

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
      <Text style={styles.title}>Voice Monitoring</Text>
      <Text style={styles.serverStatus}>Server Status: {serverStatus}</Text>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.button, isListening ? styles.stopButton : styles.startButton]} 
          onPress={handleToggleListen}
        >
          <Text style={styles.buttonText}>
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.continuousContainer}>
          <Text>Continuous Mode:</Text>
          <Switch value={continuousMode} onValueChange={handleToggleContinuous} />
        </View>
      </View>
      
      {/* Add Logs button */}
      <TouchableOpacity 
        style={styles.logsButton} 
        onPress={navigateToLogs}
      >
        <Text style={styles.buttonText}>View Logs</Text>
      </TouchableOpacity>
      
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
    marginBottom: 16,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  continuousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  // Add logs button style
  logsButton: {
    backgroundColor: '#673AB7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default VoiceScreen;
