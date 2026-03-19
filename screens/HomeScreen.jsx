import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Linking } from 'react-native';
import { Text, Surface, Button, IconButton, SegmentedButtons } from 'react-native-paper';
import { storage } from './GoalsScreen';
import { getCurrentDailyTotalTimeInSeconds, getTopApps, getAverageDailyUsage } from '../services/UsageStatsService';
import { useFocusEffect } from '@react-navigation/native';
import { getDailyTip } from '../services/DailyTipService';

const HomeScreen = ({ navigation }) => {
  const [dailyUsage, setDailyUsage] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(0);
  const [topApps, setTopApps] = useState([]);
  const [dailyTip, setDailyTip] = useState('');
  const [avgUsageData, setAvgUsageData] = useState({ average: 0, days: 7 });
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [isLoading, setIsLoading] = useState(true);

  const loadUsageData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load daily goal from storage
      const savedGoal = storage.getNumber('@daily_goal');
      if (savedGoal) {
        setDailyGoal(savedGoal);
      }

      // Get current usage in minutes
      const seconds = await getCurrentDailyTotalTimeInSeconds();
      setDailyUsage(Math.floor(seconds / 60));

      // Get top apps
      const topAppsData = await getTopApps(3);
      setTopApps(topAppsData);

      // Get average usage
      const avgData = await getAverageDailyUsage(parseInt(selectedPeriod));
      setAvgUsageData(avgData);

      // Get daily tip
      const tip = getDailyTip();
      setDailyTip(tip);
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUsageData();
    }, [loadUsageData])
  );

  const handleStartFocus = () => {
    navigation.navigate('Focus');
  };

  const handlePeriodChange = async (period) => {
    setSelectedPeriod(period);
    try {
      const avgData = await getAverageDailyUsage(parseInt(period));
      setAvgUsageData(avgData);
    } catch (error) {
      console.error('Error updating average usage:', error);
    }
  };

  const usagePercent = Math.min(dailyUsage / dailyGoal, 1);
  const usageTimeStr = `${Math.floor(dailyUsage / 60)}h ${dailyUsage % 60}m`;
  const goalTimeStr = `${Math.floor(dailyGoal / 60)}h ${dailyGoal % 60}m`;

  // Usage vs. Average calculation
  const percentDiff = avgUsageData.average > 0 
    ? Math.round(((dailyUsage - avgUsageData.average) / avgUsageData.average) * 100) 
    : 0;
  const isAbove = percentDiff > 0;
  const usageVsAvgText = isAbove
    ? `+${percentDiff}% above average`
    : percentDiff < 0
      ? `${percentDiff}% below average`
      : 'At average';
  const usageVsAvgColor = isAbove ? '#ef4444' : percentDiff < 0 ? '#22c55e' : '#888';
  const usageVsAvgIcon = isAbove ? 'arrow-up-bold' : percentDiff < 0 ? 'arrow-down-bold' : 'minus';

  // Format average time
  const avgTimeStr = `${Math.floor(avgUsageData.average / 60)}h ${avgUsageData.average % 60}m`;

  // Most Used App
  const mostUsedApp = topApps.length > 0 ? topApps[0] : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{paddingBottom: 120}} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Reclaim</Text>
        </View>

        {/* Daily Goal Progress Bar */}
        <Surface style={styles.progressCard} elevation={0}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Daily Goal</Text>
            <Text style={styles.progressPercent}>{Math.round(usagePercent * 100)}%</Text>
          </View>
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFg, {width: `${usagePercent * 100}%`}]} />
            </View>
          </View>
          <Text style={styles.progressTime}>{usageTimeStr} / {goalTimeStr}</Text>
        </Surface>

        {/* Usage Cards Row */}
        <View style={styles.usageRow}>
          {/* Usage vs. Average */}
          <Surface style={styles.usageCard} elevation={0}>
            <Text style={styles.usageCardLabel}>Usage vs. Average</Text>
            <SegmentedButtons
              value={selectedPeriod}
              onValueChange={handlePeriodChange}
              buttons={[
                { value: '7', label: '7d' },
                { value: '30', label: '30d' }
              ]}
              style={styles.periodButtons}
              density="small"
            />
            {isLoading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : (
              <>
                <View style={styles.usageVsAvgRow}>
                  <IconButton 
                    icon={usageVsAvgIcon} 
                    size={22} 
                    style={{...styles.usageVsAvgIcon, backgroundColor: 'transparent'}} 
                    iconColor={usageVsAvgColor} 
                  />
                  <Text style={[styles.usageVsAvgText, {color: usageVsAvgColor}]}>
                    {usageVsAvgText}
                  </Text>
                </View>
                <Text style={styles.avgTimeText}>
                  Average: {avgTimeStr}
                </Text>
              </>
            )}
          </Surface>
          {/* Most Used App */}
          <Surface style={styles.usageCard} elevation={0}>
            <Text style={styles.usageCardLabel}>Most Used App</Text>
            {mostUsedApp ? (
              <View style={styles.mostUsedAppRow}>
                <IconButton icon={mostUsedApp.icon} size={22} style={styles.mostUsedAppIcon} />
                <View>
                  <Text style={styles.mostUsedAppName}>{mostUsedApp.name}</Text>
                  <Text style={styles.mostUsedAppUsage}>{mostUsedApp.usage}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.mostUsedAppName}>-</Text>
            )}
          </Surface>
        </View>

        {/* Top Apps */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Top Apps</Text>
          <Surface style={styles.topAppsCard} elevation={0}>
            {topApps.map((app, idx) => (
              <View key={idx} style={styles.appRow}>
                <IconButton icon={app.icon} size={28} style={styles.appIcon} />
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.appUsage}>{app.usage}</Text>
                </View>
              </View>
            ))}
          </Surface>
        </View>

        {/* Tip of the Day */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Порада дня</Text>
          <Surface style={styles.tipCard} elevation={0}>
            <View style={styles.tipRow}>
              <IconButton icon="lightbulb" size={24} style={styles.tipIcon} />
              <View style={styles.tipContent}>
                <Text style={styles.tipText}>{dailyTip.text}</Text>
                <TouchableOpacity 
                  style={styles.sourceButton}
                  onPress={() => {
                    if (dailyTip.sourceUrl) {
                      Linking.openURL(dailyTip.sourceUrl).catch(err => 
                        console.error("Помилка при відкритті посилання:", err)
                      );
                    }
                  }}
                >
                  <Text style={styles.sourceText}>Джерело: {dailyTip.sourceName}</Text>
                  <IconButton
                    icon="open-in-new"
                    size={16}
                    iconColor="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Surface>
        </View>
      </ScrollView>

      {/* Start Focus Session Button */}
      <View style={styles.focusButtonWrapper}>
        <Button
          mode="contained"
          onPress={handleStartFocus}
          style={styles.focusButton}
          contentStyle={{height: 52}}
          labelStyle={{fontSize: 18, fontWeight: 'bold'}}
          buttonColor="#2563eb"
          icon="timer"
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
    backgroundColor: '#f7f8fa',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#222',
  },
  progressCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 18,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  progressPercent: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  progressBarWrapper: {
    marginBottom: 8,
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFg: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  progressTime: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
    fontWeight: '500',
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 18,
  },
  usageCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: 0,
  },
  usageCardLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  usageVsAvgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageVsAvgIcon: {
    marginRight: 2,
    marginLeft: -8,
  },
  usageVsAvgText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  mostUsedAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mostUsedAppIcon: {
    marginRight: 2,
    marginLeft: -8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  mostUsedAppName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  mostUsedAppUsage: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  topAppsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  appIcon: {
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  appInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  appUsage: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginLeft: 12,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    marginTop: 2,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  tipContent: {
    flex: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    fontWeight: '400',
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexShrink: 1,
  },
  sourceText: {
    fontSize: 14,
    color: '#666',
    flexShrink: 1,
  },
  focusButtonWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    padding: 16,
    paddingBottom: 24,
  },
  focusButton: {
    borderRadius: 12,
    elevation: 2,
  },
  periodButtons: {
    marginVertical: 8,
  },
  avgTimeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  avgPeriodText: {
    fontSize: 12,
    color: '#888',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 8,
  },
});

export { HomeScreen };
export default HomeScreen; 