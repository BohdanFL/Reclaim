import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, TextInput, Button, SegmentedButtons, Text, List, Searchbar } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { NativeModules } from 'react-native';

const { UsageStatsModule } = NativeModules;

const AddGoalDialog = ({ visible, onDismiss, onSave }) => {
  const [selectedApp, setSelectedApp] = useState(null);
  const [timeLimit, setTimeLimit] = useState('');
  const [type, setType] = useState('daily');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [installedApps, setInstalledApps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAppList, setShowAppList] = useState(false);

  useEffect(() => {
    if (visible) {
      loadInstalledApps();
    }
  }, [visible]);

  const loadInstalledApps = async () => {
      try {
          const apps = await UsageStatsModule.getInstalledApps();
          console.log(apps);
      setInstalledApps(apps.sort((a, b) => a.appName.localeCompare(b.appName)));
    } catch (error) {
      console.error('Error loading installed apps:', error);
    }
  };

  const onConfirm = ({ hours, minutes }) => {
    setTimeLimit(`${hours}h ${minutes}m`);
    setTimePickerVisible(false);
  };

  const handleSave = () => {
    if (!selectedApp) return;
    
    onSave({
      appName: selectedApp.appName,
      packageName: selectedApp.packageName,
      timeLimit,
      type,
      isActive: true,
      progress: 0,
    });
    
    setSelectedApp(null);
    setTimeLimit('');
    setType('daily');
    setSearchQuery('');
    onDismiss();
  };

  const filteredApps = installedApps.filter(app => 
    app.appName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Add New Limit</Dialog.Title>
        <Dialog.Content>
          <Searchbar
            placeholder="Search apps"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            onFocus={() => setShowAppList(true)}
          />
          
          {showAppList && (
            <ScrollView style={styles.appList}>
              {filteredApps.map((app) => (
                <List.Item
                  key={app.packageName}
                  title={app.appName}
                  onPress={() => {
                    setSelectedApp(app);
                    setShowAppList(false);
                    setSearchQuery(app.appName);
                  }}
                />
              ))}
            </ScrollView>
          )}

          {selectedApp && (
            <>
              <TextInput
                label="Time Limit"
                value={timeLimit}
                onPressIn={() => setTimePickerVisible(true)}
                style={styles.input}
                right={<TextInput.Icon icon="clock" />}
              />
              
              <SegmentedButtons
                value={type}
                onValueChange={setType}
                buttons={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                ]}
                style={styles.segmentedButtons}
              />
            </>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button 
            onPress={handleSave} 
            mode="contained" 
            disabled={!selectedApp || !timeLimit}
          >
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>

      <TimePickerModal
        visible={timePickerVisible}
        onDismiss={() => setTimePickerVisible(false)}
        onConfirm={onConfirm}
        hours={0}
        minutes={0}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  input: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  searchbar: {
    marginBottom: 8,
  },
  appList: {
    maxHeight: 200,
    marginBottom: 16,
  },
});

export default AddGoalDialog; 