import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler, Alert, ImageBackground, NativeEventEmitter, PermissionsAndroid } from 'react-native';
import { Text, Surface, Button, ProgressBar, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { NativeModules } from 'react-native';
import FocusSessionManager from '../services/FocusSessionManager';

const { AppBlockerModule, OverlayModule, UsageStatsModule, FocusTimerModule } = NativeModules;

// Створюємо емітер для FocusTimerModule
const timerEventEmitter = new NativeEventEmitter(FocusTimerModule);

// Масив мотиваційних цитат
const MOTIVATIONAL_QUOTES = [
  "Focus on being productive instead of busy.",
  "The successful warrior is the average person, with laser-like focus.",
  "Concentrate all your thoughts upon the work at hand.",
  "Where focus goes, energy flows.",
  "Stay focused, go after your dreams, and keep moving toward your goals."
];

const FocusSessionScreen = ({ route, navigation }) => {
  const { duration, strictMode, blockedApps, sessionName } = route.params;
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isActive, setIsActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(1);
  const [quote] = useState(() => 
    MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
  );

  // Перевірка необхідних дозволів
  const checkPermissions = async () => {
    try {
      // Перевірка дозволу на показ оверлеїв
      const hasOverlayPermission = await OverlayModule.canDrawOverlays();
      if (!hasOverlayPermission) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to show overlays for blocking apps.',
          [
            {
              text: 'Open Settings',
              onPress: () => OverlayModule.openOverlaySettings()
            }
          ]
        );
        return false;
      }

      // Перевірка дозволу на доступ до статистики використання
      const hasUsagePermission = await UsageStatsModule.checkUsageStatsPermission();
      if (!hasUsagePermission) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access app usage statistics.',
          [
            {
              text: 'Open Settings',
              onPress: () => UsageStatsModule.openUsageSettings()
            }
          ]
        );
        return false;
      }

      // Перевірка дозволу на показ нотифікацій
      const hasNotificationPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (!hasNotificationPermission) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Required',
            'Please grant permission to show notifications for the timer.'
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Запуск таймера
  const startFocusTimer = async () => {
    const hasPermissions = await checkPermissions();
    if (!hasPermissions) {
      navigation.goBack();
      return;
    }

    try {
      console.log('Starting timer:', { duration, sessionName });
      
      // Зберігаємо дані сесії
      FocusSessionManager.saveSession({
        duration,
        sessionName,
        strictMode,
        blockedApps,
        isPaused: false
      });

      // Запускаємо сервіс
      await FocusTimerModule.startTimer(duration, sessionName);
      setIsActive(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  };

  // Пауза/відновлення таймера
  const togglePause = async () => {
    if (strictMode) return;

    try {
      if (isPaused) {
        // Відновлюємо таймер
        await FocusTimerModule.resumeTimer();
        setIsPaused(false);
        
        // Оновлюємо стан сесії
        const session = FocusSessionManager.getActiveSession();
        if (session) {
          FocusSessionManager.saveSession({
            ...session,
            isPaused: false
          });
        }
      } else {
        // Ставимо на паузу
        await FocusTimerModule.pauseTimer();
        setIsPaused(true);
        
        // Оновлюємо стан сесії
        const session = FocusSessionManager.getActiveSession();
        if (session) {
          FocusSessionManager.saveSession({
            ...session,
            isPaused: true
          });
        }
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  };

  // Підписка на події таймера
  useEffect(() => {
    const tickSubscription = timerEventEmitter.addListener(
      FocusTimerModule.TIMER_TICK_EVENT,
      (event) => {
        console.log('Timer tick:', event);
        if (event && typeof event.timeLeft === 'number') {
          const seconds = Math.floor(event.timeLeft);
          setTimeLeft(seconds);
          setProgress(seconds / (duration * 60));
        }
      }
    );

    const finishSubscription = timerEventEmitter.addListener(
      FocusTimerModule.TIMER_FINISH_EVENT,
      () => {
        console.log('Timer finished');
        endSession();
      }
    );

    const stateSubscription = timerEventEmitter.addListener(
      FocusTimerModule.TIMER_STATE_EVENT,
      (event) => {
        console.log('Timer state changed:', event);
        if (event && typeof event.isPaused === 'boolean') {
          setIsPaused(event.isPaused);
        }
      }
    );

    // Запускаємо таймер при монтуванні компонента
    startFocusTimer().catch(error => {
      console.error('Error starting timer:', error);
      Alert.alert(
        'Error',
        'Failed to start focus session. Please try again.'
      );
      navigation.goBack();
    });

    return () => {
      tickSubscription.remove();
      finishSubscription.remove();
      stateSubscription.remove();
    };
  }, []);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (strictMode) {
          Alert.alert(
            'Strict Mode Active',
            'You cannot end the session early in strict mode.'
          );
          return true;
        }

        Alert.alert(
          'End Session',
          'Are you sure you want to end the focus session early?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'End Session',
              style: 'destructive',
              onPress: endSession
            }
          ]
        );
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [strictMode])
  );

  const endSession = async () => {
    try {
      // Зупиняємо сервіс
      await FocusTimerModule.stopTimer();
      
      // Очищаємо дані сесії
      FocusSessionManager.clearSession();
      
      navigation.navigate('FocusSetup');
    } catch (error) {
      console.error('Error ending session:', error);
      navigation.navigate('FocusSetup');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/focus-bg.jpg')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        {/* Session Name */}
        {sessionName && (
          <Text style={styles.sessionName}>{sessionName}</Text>
        )}

        {/* Timer Card */}
        <Surface style={styles.timerCard} elevation={0}>
          <Text style={styles.timerLabel}>
            {isPaused ? 'Session Paused' : 'Focus Session Active'}
          </Text>
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          <ProgressBar
            progress={progress}
            style={styles.progressBar}
            color="#6366f1"
          />
        </Surface>

        {/* Quote Card */}
        <Surface style={styles.quoteCard} elevation={0}>
          <Text style={styles.quote}>"{quote}"</Text>
        </Surface>

        {/* Status Info */}
        <Surface style={styles.statusCard} elevation={0}>
          <Text style={styles.statusText}>
            Focus Mode {isPaused ? 'Paused' : 'Active'} • {blockedApps.length} Apps Blocked
          </Text>
        </Surface>

        {/* Controls */}
        {!strictMode && (
          <View style={styles.controls}>
            <IconButton
              icon={isPaused ? "play" : "pause"}
              size={32}
              mode="contained"
              onPress={togglePause}
              style={styles.controlButton}
            />
            <IconButton
              icon="stop"
              size={32}
              mode="contained"
              onPress={() => {
                Alert.alert(
                  'End Session',
                  'Are you sure you want to end the focus session early?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'End Session',
                      style: 'destructive',
                      onPress: endSession
                    }
                  ]
                );
              }}
              style={styles.controlButton}
            />
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    justifyContent: 'center',
  },
  sessionName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 24,
  },
  timerCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    marginBottom: 24,
  },
  timerLabel: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 16,
    fontWeight: '500',
  },
  timer: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  progressBar: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  quoteCard: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    marginBottom: 24,
  },
  quote: {
    fontSize: 16,
    color: '#334155',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
  },
  controlButton: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
  },
});

export default FocusSessionScreen; 