import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, ProgressBar, IconButton, useTheme } from 'react-native-paper';
import { NativeModules } from 'react-native';

const { UsageStatsModule, OverlayModule } = NativeModules;

const parseTimeLimit = (timeLimit) => {
  const [hours, minutes] = timeLimit.split('h ').map(part => 
    parseInt(part.replace('m', ''))
  );
  return (hours * 3600) + (minutes * 60); // Конвертуємо в секунди
};

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const GoalCard = ({ goal, onDelete, onToggle, onProgressUpdate }) => {
  const theme = useTheme();
  const progress = goal.progress || 0;
  let warningShown = false;

  const checkUsage = useCallback(async () => {
    try {
      const period = goal.type === 'daily' ? 'DAY' : 'WEEK';
      const stats = await UsageStatsModule.getUsageStats(period, null);
      const appStats = stats.find(stat => stat.packageName === goal.packageName);
      
      if (appStats) {
        const timeInSeconds = appStats.timeInSeconds;
        const limitInSeconds = parseTimeLimit(goal.timeLimit);
        const newProgress = timeInSeconds / limitInSeconds;
        
        // Update progress
        onProgressUpdate(goal.id, newProgress);

        // Handle warnings and blocking
        if (newProgress >= 1) {
          // Показуємо блокуюче вікно
          OverlayModule.showWarningOverlay(goal.packageName, true);
        } else if (newProgress >= 0.8 && !warningShown) {
          // Показуємо попередження тільки один раз
          OverlayModule.showWarningOverlay(goal.packageName, false);
          warningShown = true;
        }
      }
    } catch (error) {
      console.error('Error checking app usage:', error);
    }
  }, [goal.packageName, goal.timeLimit, goal.type]);

  useEffect(() => {
    let interval;
    if (goal.isActive) {
      // Check immediately when activated
      checkUsage();
      // Then check every 2 seconds for more responsive blocking
      interval = setInterval(checkUsage, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      OverlayModule.hideWarningOverlay();
    };
  }, [goal.isActive, checkUsage]);

  const timeUsed = progress * parseTimeLimit(goal.timeLimit);
  const timeLeft = parseTimeLimit(goal.timeLimit) - timeUsed;

  return (
    <Surface style={styles.card} elevation={1}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text variant="titleMedium">{goal.appName}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
            {goal.type === 'daily' ? 'Daily Limit' : 'Weekly Limit'}
          </Text>
        </View>
        <View style={styles.actions}>
          <IconButton
            icon={goal.isActive ? 'pause' : 'play'}
            size={20}
            onPress={() => onToggle(goal)}
          />
          <IconButton
            icon="delete-outline"
            size={20}
            onPress={() => onDelete(goal)}
          />
        </View>
      </View>

      <View style={styles.limitInfo}>
        <Text variant="bodyMedium">Time Limit: {goal.timeLimit}</Text>
        <Text variant="bodySmall">
          Time Left: {formatTime(Math.max(0, Math.round(timeLeft)))}
        </Text>
        <Text 
          variant="bodyMedium" 
          style={{ 
            color: progress >= 1 ? theme.colors.error : 
                   progress >= 0.8 ? theme.colors.warning : 
                   theme.colors.primary 
          }}
        >
          {Math.round(progress * 100)}%
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        color={
          progress >= 1 ? theme.colors.error :
          progress >= 0.8 ? theme.colors.warning :
          theme.colors.primary
        }
        style={styles.progressBar}
      />
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  limitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});

export default GoalCard; 