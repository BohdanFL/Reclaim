import {NativeModules, Button, FlatList, Text, View, Alert} from 'react-native';
import React, {useEffect, useState} from 'react';

const {UsageStatsModule} = NativeModules;

export default function App() {
  const [usageStats, setUsageStats] = useState([]);

  const loadStats = async () => {
    try {
      const stats = await UsageStatsModule.getUsageStats();
      setUsageStats(stats);
    } catch (e) {
      Alert.alert('Помилка', e.message);
    }
  };

  const openSettings = () => {
    UsageStatsModule.openUsageAccessSettings();
  };

  return (
    <View style={{padding: 20, flex: 1}}>
      <Button title="Відкрити дозвіл доступу" onPress={openSettings} />
      <Button title="Завантажити статистику" onPress={loadStats} />
      <FlatList
        data={usageStats}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => (
          <Text>
            {item.packageName} —{' '}
            {(item.totalTimeInForeground / 1000).toFixed(1)} сек.
          </Text>
        )}
      />
    </View>
  );
}
