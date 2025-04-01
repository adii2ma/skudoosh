import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import keywordExtractor from './src/services/keywordExtractor';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

const App = () => {
  const [tfReady, setTfReady] = useState(false);

  useEffect(() => {
    // Initialize TensorFlow.js
    const initializeTensorFlow = async () => {
      try {
        // Initialize TensorFlow
        await tf.ready();
        console.log('TensorFlow.js ready');
        
        // Initialize the keyword extractor
        await keywordExtractor.initialize();
        
        setTfReady(true);
      } catch (error) {
        console.error('Error initializing TensorFlow:', error);
      }
    };

    initializeTensorFlow();
  }, []);

  if (!tfReady) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading TensorFlow.js...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  }
});

export default App;
