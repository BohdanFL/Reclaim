import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, ProgressBar, Surface, List } from 'react-native-paper';
import ChallengeService from '../services/ChallengeService';
import { DigitalDetoxIcon, AppUsageLimitIcon } from '../components/ChallengeIcon';
import { useFocusUpdate } from '../hooks/useFocusUpdate';
import ChallengeCompletionDialog from '../components/ChallengeCompletionDialog';
import { useFocusEffect } from '@react-navigation/native';

const ChallengeDetailScreen = ({ route, navigation }) => {
  const [challenge, setChallenge] = useState(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const { challengeId } = route.params;
  const challengeService = ChallengeService.getInstance();

  const loadChallenge = async () => {
    try {
      const challenges = await challengeService.getChallenges();
      const found = challenges.find(c => c.id === challengeId);
      if (found) {
        setChallenge(found);
        // Show completion dialog if the challenge was just completed or failed
        if (found.status === 'completed' || found.status === 'failed') {
          const lastUpdate = new Date(found.completionData?.completedAt);
          const now = new Date();
          // Show dialog if completed within the last minute
          if (now.getTime() - lastUpdate.getTime() < 60000) {
            setShowCompletionDialog(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChallenge();
      
      // Set up periodic updates
      const intervalId = setInterval(() => {
        if (challenge?.status === 'active') {
          loadChallenge();
        }
      }, 60000); // Update every minute for active challenges
      
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [challengeId, challenge?.status])
  );

  const handleRetry = async () => {
    try {
      await challengeService.retryChallenge(challengeId);
      await loadChallenge();
      setShowCompletionDialog(false);
    } catch (error) {
      console.error('Error retrying challenge:', error);
    }
  };

  const handleDismissDialog = () => {
    setShowCompletionDialog(false);
    if (challenge?.status === 'completed' || challenge?.status === 'failed') {
      navigation.goBack();
    }
  };

  const getIcon = () => {
    if (!challenge) return null;
    switch (challenge.type) {
      case 'digitalDetox':
        return <DigitalDetoxIcon />;
      case 'appUsageLimit':
        return <AppUsageLimitIcon />;
      default:
        return <DigitalDetoxIcon />;
    }
  };

  const handleStartChallenge = async () => {
    try {
      if (!challenge) return;
      const started = await challengeService.startChallenge(challengeId);
      if (started) {
        setChallenge(started);
      }
    } catch (error) {
      console.error('Error starting challenge:', error);
    }
  };

  const getProgressPercentage = () => {
    if (!challenge?.progress) return 0;
    
    if (challenge.type === 'digitalDetox') {
      return challenge.progress.currentValue / challenge.progress.targetValue;
    } else if (challenge.type === 'appUsageLimit') {
      return Math.min(challenge.progress.currentValue / challenge.progress.targetValue, 1);
    }
    return 0;
  };

  const renderProgressDetails = () => {
    if (!challenge?.progress) return null;

    switch (challenge.type) {
      case 'digitalDetox':
        return (
          <View>
            <Text style={styles.progressText}>
              Current reduction: {challenge.progress.currentValue}%
            </Text>
            <Text style={styles.progressText}>
              Target reduction: {challenge.progress.targetValue}%
            </Text>
            <Text style={styles.progressText}>
              Baseline daily usage: {challenge.progress.baselineMinutes} minutes
            </Text>
          </View>
        );
      
      case 'appUsageLimit':
        return (
          <View>
            <Text style={styles.progressText}>
              Today's usage: {challenge.progress.currentValue} minutes
            </Text>
            <Text style={styles.progressText}>
              Daily limit: {challenge.progress.targetValue} minutes
            </Text>
            <Text style={styles.progressText}>
              Successful days: {challenge.progress.successfulDays} / {challenge.durationDays}
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  const renderDailyUsage = () => {
    if (!challenge?.progress?.dailyUsage?.length) return null;

    return (
      <Surface style={styles.usageCard}>
        <Text style={styles.sectionTitle}>Daily Usage</Text>
        {challenge.progress.dailyUsage.map((day, index) => (
          <List.Item
            key={day.date}
            title={new Date(day.date).toLocaleDateString()}
            description={`${day.minutes} minutes`}
            left={props => (
              <List.Icon
                {...props}
                icon={day.minutes <= (challenge.type === 'appUsageLimit' ? challenge.progress.targetValue : challenge.progress.baselineMinutes)
                  ? 'check-circle'
                  : 'alert-circle'}
              />
            )}
          />
        ))}
      </Surface>
    );
  };

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <Surface style={styles.header}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.description}>{challenge.description}</Text>
        </Surface>

        <Surface style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Challenge Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Duration:</Text>
            <Text style={styles.value}>{challenge.durationDays} days</Text>
          </View>
          {challenge.daysLeft !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Days Left:</Text>
              <Text style={styles.value}>{challenge.daysLeft} days</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, styles.status]}>{challenge.status}</Text>
          </View>
        </Surface>

        {challenge.progress && (
          <Surface style={styles.progressCard}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <ProgressBar
              progress={getProgressPercentage()}
              color={getProgressPercentage() >= 1 ? '#4CAF50' : '#2196F3'}
              style={styles.progressBar}
            />
            {renderProgressDetails()}
          </Surface>
        )}

        {renderDailyUsage()}

        {challenge.status === 'available' && (
          <Button
            mode="contained"
            onPress={handleStartChallenge}
            style={styles.button}
          >
            Start Challenge
          </Button>
        )}
      </ScrollView>

      <ChallengeCompletionDialog
        visible={showCompletionDialog}
        onDismiss={handleDismissDialog}
        onRetry={handleRetry}
        challenge={challenge}
        isSuccess={challenge?.status === 'completed'}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  header: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
  },
  iconContainer: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  progressCard: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  usageCard: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  status: {
    textTransform: 'capitalize',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  button: {
    margin: 16,
  },
});

export default ChallengeDetailScreen; 