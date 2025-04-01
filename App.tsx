import React from 'react';
import {SafeAreaView} from 'react-native';
import VoiceScreen from './src/screens/VoiceScreen';

const App = () => {
  return (
    <SafeAreaView style={{flex: 1}}>
      <VoiceScreen />
    </SafeAreaView>
  );
};

export default App;
