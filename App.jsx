import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import { AppNavigator } from './navigation/AppNavigator';
import { theme } from './config/theme';
import AppMonitoringService from './services/AppMonitoringService';
import './services/AuthService'; // Import for side effects only

const App = () => {
  useEffect(() => {
    // Start app monitoring
    AppMonitoringService.startMonitoring();

    return () => {
      // Stop monitoring when app closes
      AppMonitoringService.stopMonitoring();
    };
  }, []);

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
};

export default App; 