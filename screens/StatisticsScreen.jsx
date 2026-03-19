// StatisticsScreen.js

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  PermissionsAndroid,
  Linking,
  Alert,
  NativeModules,
  Dimensions,
} from 'react-native';
import {BarChart} from 'react-native-gifted-charts';
import {format, startOfDay, startOfWeek, startOfMonth, subDays, addDays} from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

const {UsageStatsModule} = NativeModules;

const PERIODS = ['CUSTOM', 'DAY', 'WEEK', 'MONTH'];

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const getDateRange = (period, selectedDate = new Date()) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'CUSTOM':
      startDate = startOfDay(selectedDate);
      return {
        start: format(startDate, 'dd.MM.yyyy HH:mm'),
        end: format(new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1), 'dd.MM.yyyy HH:mm'),
      };
    case 'DAY':
      startDate = startOfDay(now);
      break;
    case 'WEEK':
      startDate = startOfWeek(now, {weekStartsOn: 1});
      break;
    case 'MONTH':
      startDate = startOfMonth(now);
      break;
    default:
      startDate = startOfDay(now);
  }

  return {
    start: format(startDate, 'dd.MM.yyyy HH:mm'),
    end: format(now, 'dd.MM.yyyy HH:mm'),
  };
};

const StatisticsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('DAY');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [usageData, setUsageData] = useState([]);
  const [totalTime, setTotalTime] = useState(0);
  const [dateRange, setDateRange] = useState({start: '', end: ''});

  useEffect(() => {
    requestUsagePermission();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const range = getDateRange(selectedPeriod, selectedDate);
      setDateRange(range);
      console.log('Fetching stats for period:', selectedPeriod);
      console.log('Date range:', range);
      
      const customDate = selectedPeriod === 'CUSTOM' 
        ? format(selectedDate, 'yyyy-MM-dd')
        : null;
      
      fetchUsageStats(selectedPeriod, customDate);
    }
  }, [selectedPeriod, selectedDate]);

  const requestUsagePermission = async () => {
    if (Platform.OS !== 'android') return;

    try {
      const granted = await UsageStatsModule.checkUsagePermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'To view your app usage, please grant "Usage Access" in Settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => UsageStatsModule.openUsageSettings(),
            },
          ],
        );
      }
    } catch (err) {
      console.warn('Usage permission check error:', err);
    }
  };

  const fetchUsageStats = async (period, customDate = null) => {
    try {
      console.log('Fetching usage stats for period:', period, 'customDate:', customDate);
      const rawData = await UsageStatsModule.getUsageStats(period, customDate);
      processUsageData(rawData);
    } catch (err) {
      console.warn('Failed to fetch usage stats:', err);
      setUsageData([]);
      setTotalTime(0);
    }
  };

  const processUsageData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) {
      console.warn('Invalid usage data received');
      setUsageData([]);
      setTotalTime(0);
      return;
    }

    console.log('Received data count:', rawData.length);
    
    const processed = rawData.map(item => ({
      packageName: item.packageName,
      appName: item.appName || item.packageName.split('.').pop(),
      timeInSeconds: item.timeInSeconds,
      minutes: Math.floor(item.timeInSeconds / 60),
    }));
    
    const sorted = processed.sort((a, b) => b.timeInSeconds - a.timeInSeconds);
    const totalSeconds = sorted.reduce((sum, it) => sum + it.timeInSeconds, 0);
    
    console.log('Total apps with usage:', sorted.length);
    console.log('Total time:', formatTime(totalSeconds));
    
    setUsageData(sorted);
    setTotalTime(totalSeconds);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const navigateDate = (direction) => {
    const newDate = direction === 'next' 
      ? addDays(selectedDate, 1)
      : subDays(selectedDate, 1);
    setSelectedDate(newDate);
  };

  const renderDateSelector = () => {
    if (selectedPeriod !== 'CUSTOM') return null;

    return (
      <View style={styles.dateSelector}>
        <TouchableOpacity 
          style={styles.dateNavButton}
          onPress={() => navigateDate('prev')}>
          <Text style={styles.dateNavButtonText}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateButtonText}>
            {format(selectedDate, 'dd.MM.yyyy')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.dateNavButton}
          onPress={() => navigateDate('next')}>
          <Text style={styles.dateNavButtonText}>→</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
    );
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodContainer}>
      {PERIODS.map(p => (
        <TouchableOpacity
          key={p}
          style={[
            styles.periodButton,
            selectedPeriod === p && styles.periodButtonActive,
          ]}
          onPress={() => {
            setSelectedPeriod(p);
            if (p === 'CUSTOM') {
              setSelectedDate(new Date());
            }
          }}>
          <Text
            style={[
              styles.periodText,
              selectedPeriod === p && styles.periodTextActive,
            ]}>
            {p === 'CUSTOM' ? 'Custom'
              : p === 'DAY' ? 'Today'
              : p === 'WEEK' ? 'Week'
              : 'Month'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDateRange = () => (
    <View style={styles.dateRangeContainer}>
      <Text style={styles.dateRangeText}>
        From: {dateRange.start}
      </Text>
      <Text style={styles.dateRangeText}>
        To: {dateRange.end}
      </Text>
    </View>
  );

  const renderUsageChart = () => {
    const top5 = usageData.slice(0, 5);
    const barData = top5.map(item => ({
      value: item.minutes,
      label: item.appName.slice(0, 6),
      frontColor: '#4caf50',
    }));

    return (
      <View style={styles.chartContainer}>
        <BarChart
          data={barData}
          width={Dimensions.get('window').width - 60}
          height={200}
          barWidth={30}
          spacing={20}
          hideRules
          xAxisThickness={1}
          yAxisThickness={1}
          yAxisTextStyle={{color: 'gray'}}
          xAxisLabelTextStyle={{color: 'gray', fontSize: 10}}
          noOfSections={5}
          yAxisLabelSuffix="m"
        />
      </View>
    );
  };

  const renderAppItem = ({item}) => (
    <View style={styles.appRow}>
      <Text style={styles.appName}>
        {item.appName && item.appName !== item.packageName 
          ? item.appName 
          : item.packageName.split('.').pop()}
      </Text>
      <Text style={styles.appTime}>{formatTime(item.timeInSeconds)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Usage Statistics</Text>
      {renderPeriodSelector()}
      {renderDateSelector()}
      {renderDateRange()}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {selectedPeriod === 'CUSTOM'
            ? `Total for ${format(selectedDate, 'dd.MM.yyyy')}: ${formatTime(totalTime)}`
            : selectedPeriod === 'DAY'
            ? `Total Today: ${formatTime(totalTime)}`
            : selectedPeriod === 'WEEK'
            ? `Total This Week: ${formatTime(totalTime)}`
            : `Total This Month: ${formatTime(totalTime)}`}
        </Text>
      </View>
      {usageData.length > 0 && renderUsageChart()}
      <Text style={styles.sectionHeader}>All Apps</Text>
      <FlatList
        data={usageData}
        keyExtractor={item => item.packageName}
        renderItem={renderAppItem}
        contentContainerStyle={{paddingBottom: 100}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16, backgroundColor: '#fff'},
  header: {fontSize: 24, fontWeight: 'bold', marginBottom: 12},
  periodContainer: {flexDirection: 'row', marginBottom: 16},
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    marginHorizontal: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#555',
  },
  dateNavButton: {
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
  },
  dateNavButtonText: {
    fontSize: 18,
    color: '#555',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  periodButtonActive: {backgroundColor: '#4caf50'},
  periodText: {textAlign: 'center', color: '#555'},
  periodTextActive: {color: '#fff'},
  summaryContainer: {marginBottom: 16},
  summaryText: {fontSize: 16, fontWeight: '600'},
  chartContainer: {
    height: 220,
    marginBottom: 24,
    alignItems: 'center',
    paddingRight: 16,
  },
  sectionHeader: {fontSize: 18, fontWeight: '600', marginBottom: 8},
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  appName: {fontSize: 16},
  appTime: {fontSize: 16, color: '#555'},
  dateRangeContainer: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  dateRangeText: {
    fontSize: 12,
    color: '#666',
  },
});

export default StatisticsScreen;
