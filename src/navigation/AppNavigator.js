import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import VoiceScreen from '../screens/voicescreen';
import LogsScreen from '../screens/logsscreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Voice">
        <Stack.Screen 
          name="Voice" 
          component={VoiceScreen} 
          options={{ title: 'Voice Monitor' }}
        />
        <Stack.Screen 
          name="Logs" 
          component={LogsScreen} 
          options={{ title: 'Voice Logs' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
