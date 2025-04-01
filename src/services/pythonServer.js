import { NativeModules } from 'react-native';

const { PythonServer } = NativeModules;

export const startPythonServer = async () => {
  try {
    const result = await PythonServer.startServer();
    console.log('Python server start result:', result);
    return result;
  } catch (error) {
    console.error('Failed to start Python server:', error);
    throw error;
  }
};

export const isServerRunning = async () => {
  try {
    return await PythonServer.isServerRunning();
  } catch (error) {
    console.error('Failed to check server status:', error);
    return false;
  }
};
