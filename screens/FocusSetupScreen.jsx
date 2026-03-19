import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Button, Chip, TextInput, Switch, List, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { NativeModules } from 'react-native';
import FocusSessionManager from '../services/FocusSessionManager';

const { AppListModule, AppBlockerModule } = NativeModules;

const PRESET_DURATIONS = [
  { label: '25m', value: 25 },
  { label: '45m', value: 45 },
  { label: '60m', value: 60 },
  { label: '90m', value: 90 },
];

const FocusSetupScreen = ({ navigation }) => {
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [installedApps, setInstalledApps] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionName, setSessionName] = useState('');

  const loadInstalledApps = useCallback(async () => {
    try {
      setIsLoading(true);
      const apps = await AppListModule.getInstalledApps();
      setInstalledApps(apps);
      
      // Load previously blocked apps
      const blockedApps = await AppListModule.getBlockedAppsList();
      setSelectedApps(blockedApps.map(app => app.packageName));
    } catch (error) {
      console.error('Error loading apps:', error);
      Alert.alert('Error', 'Failed to load installed apps');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInstalledApps();
    }, [loadInstalledApps])
  );

  useEffect(() => {
    // Перевіряємо наявність активної сесії при монтуванні
    const activeSession = FocusSessionManager.getActiveSession();
    if (activeSession) {
      navigation.navigate('FocusSession', activeSession);
    }
  }, [navigation]);

  const handleDurationSelect = (value) => {
    setDuration(value);
    setIsCustomDuration(false);
    setCustomDuration('');
  };

  const handleCustomDurationChange = (text) => {
    const numValue = parseInt(text);
    if (text === '' || (numValue >= 1 && numValue <= 180)) {
      setCustomDuration(text);
      if (text !== '') {
        setDuration(numValue);
      }
    }
  };

  const toggleApp = async (packageName) => {
    try {
      if (selectedApps.includes(packageName)) {
        await AppListModule.unblockApp(packageName);
        setSelectedApps(prev => prev.filter(app => app !== packageName));
      } else {
        await AppListModule.blockApp(packageName);
        setSelectedApps(prev => [...prev, packageName]);
      }
    } catch (error) {
      console.error('Error toggling app:', error);
      Alert.alert('Error', 'Failed to update app blocking status');
    }
  };

  const checkPermissions = async () => {
    try {
      const hasAccessibility = await AppBlockerModule.checkAccessibilityPermission();
      if (!hasAccessibility) {
        Alert.alert(
          'Permission Required',
          'Please enable accessibility service for app blocking',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => AppBlockerModule.openAccessibilitySettings() }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  const startFocusSession = async () => {
    if (selectedApps.length === 0) {
      Alert.alert('No Apps Selected', 'Please select at least one app to block');
      return;
    }

    if (!(await checkPermissions())) {
      return;
    }

    const finalDuration = isCustomDuration ? parseInt(customDuration) : duration;
    if (!finalDuration || finalDuration < 1 || finalDuration > 180) {
      Alert.alert('Invalid Duration', 'Please select a duration between 10 and 180 minutes');
      return;
    }

    navigation.navigate('FocusSession', {
      duration: finalDuration,
      strictMode,
      blockedApps: selectedApps,
      sessionName: sessionName.trim() || undefined,
    });
  };

  const filteredApps = installedApps.filter(app => 
    app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text variant="headlineMedium" style={styles.title}>Focus Setup</Text>

        {/* Session Name */}
        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Session Name (Optional)</Text>
          <TextInput
            label="What are you focusing on?"
            value={sessionName}
            onChangeText={setSessionName}
            style={styles.sessionNameInput}
            placeholder="e.g., Study for Math Test"
          />
        </Surface>

        {/* Duration Selection */}
        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Session Duration</Text>
          <View style={styles.durationChips}>
            {PRESET_DURATIONS.map(({ label, value }) => (
              <Chip
                key={value}
                selected={!isCustomDuration && duration === value}
                onPress={() => handleDurationSelect(value)}
                style={styles.chip}
                mode="outlined"
              >
                {label}
              </Chip>
            ))}
          </View>
          
          <View style={styles.customDurationContainer}>
            <TextInput
              label="Custom Duration (10-180 min)"
              value={customDuration}
              onChangeText={handleCustomDurationChange}
              keyboardType="number-pad"
              style={styles.customDurationInput}
              onFocus={() => setIsCustomDuration(true)}
            />
          </View>
        </Surface>

        {/* Strict Mode Toggle */}
        <Surface style={styles.section} elevation={0}>
          <List.Item
            title="Strict Mode"
            description="Cannot end session early"
            right={() => (
              <Switch
                value={strictMode}
                onValueChange={setStrictMode}
              />
            )}
          />
        </Surface>

        {/* App Selection */}
        <Surface style={styles.section} elevation={0}>
          <Text style={styles.sectionTitle}>Select Apps to Block</Text>
          <Searchbar
            placeholder="Search apps"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          {filteredApps.map(app => (
            <List.Item
              key={app.packageName}
              title={app.appName}
              description={app.packageName}
              left={props => <List.Icon {...props} icon={app.icon ? { uri: app.icon } : 'android'} />}
              right={() => (
                <Switch
                  value={selectedApps.includes(app.packageName)}
                  onValueChange={() => toggleApp(app.packageName)}
                />
              )}
            />
          ))}
        </Surface>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={startFocusSession}
          style={styles.startButton}
          loading={isLoading}
          disabled={isLoading || selectedApps.length === 0}
        >
          Start Focus Session
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    margin: 16,
  },
  section: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 16,
  },
  sessionNameInput: {
    backgroundColor: 'transparent',
  },
  durationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  customDurationContainer: {
    marginTop: 16,
  },
  customDurationInput: {
    backgroundColor: 'transparent',
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  startButton: {
    borderRadius: 8,
  },
});

export default FocusSetupScreen; 