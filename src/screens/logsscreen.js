import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFilteredLogs } from '../services/api';

const LogsScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Format date for display
  const formatDateForDisplay = (date) => {
    if (!date) return 'Select date';
    return date.toISOString().split('T')[0];
  };

  // Format date for API
  const formatDateForAPI = (date) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  // Load logs initially
  useEffect(() => {
    fetchLogs();
  }, []);

  // Handle date changes
  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Fetch logs with filters
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await getFilteredLogs(
        formatDateForAPI(startDate),
        formatDateForAPI(endDate),
        keyword
      );
      setLogs(response.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setKeyword('');
    setStartDate(null);
    setEndDate(null);
    fetchLogs();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Recording Logs</Text>
      
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search by keyword"
          value={keyword}
          onChangeText={setKeyword}
        />
        
        <View style={styles.dateContainer}>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowStartPicker(true)}
          >
            <Text>{formatDateForDisplay(startDate)}</Text>
          </TouchableOpacity>
          
          <Text style={styles.dateToText}>to</Text>
          
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowEndPicker(true)}
          >
            <Text>{formatDateForDisplay(endDate)}</Text>
          </TouchableOpacity>
        </View>
        
        {showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={onStartDateChange}
          />
        )}
        
        {showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={onEndDateChange}
          />
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.applyButton} onPress={fetchLogs}>
            <Text style={styles.buttonText}>Apply Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Logs list */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <>
          <Text style={styles.resultCount}>
            {logs.length} {logs.length === 1 ? 'result' : 'results'} found
          </Text>
          
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.logItem}>
                <Text style={styles.logText}>{item.text}</Text>
                <Text style={styles.logTimestamp}>{item.timestamp}</Text>
                <View style={styles.keywordsContainer}>
                  {item.keywords.map((keyword, index) => (
                    <View key={index} style={styles.keywordBadge}>
                      <Text style={styles.keywordText}>{keyword}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No logs found</Text>
            }
          />
        </>
      )}
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
    marginBottom: 16,
    textAlign: 'center',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  dateToText: {
    marginHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#9E9E9E',
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
  resultCount: {
    marginBottom: 8,
    fontStyle: 'italic',
  },
  logItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  logText: {
    fontSize: 16,
    marginBottom: 8,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keywordBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    margin: 2,
  },
  keywordText: {
    fontSize: 12,
    color: '#1976D2',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});

export default LogsScreen;
