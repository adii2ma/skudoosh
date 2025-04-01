import React, {useState} from 'react';
import {View, Text, Button} from 'react-native';
import VoiceService from '../services/VoiceService';

const VoiceScreen = () => {
  const [isListening, setIsListening] = useState(false);

  const handleStart = async () => {
    setIsListening(true);
    await VoiceService.startListening();
  };

  const handleStop = async () => {
    setIsListening(false);
    await VoiceService.stopListening();
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Voice Interface</Text>
      <Button title={isListening ? 'Stop Listening' : 'Start Listening'} onPress={isListening ? handleStop : handleStart} />
    </View>
  );
};

export default VoiceScreen;
