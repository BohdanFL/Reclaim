import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { DigitalDetoxIcon, AppUsageLimitIcon, FocusModeIcon } from './ChallengeIcon';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ChallengeCard = ({ challenge, onView, onRetry }) => {
  const getIcon = () => {
    switch (challenge.type) {
      case 'digitalDetox':
        return <DigitalDetoxIcon />;
      case 'appUsageLimit':
        return <AppUsageLimitIcon />;
      case 'focusMode':
        return <FocusModeIcon />;
      default:
        return <DigitalDetoxIcon />;
    }
  };

  const getStatusColor = () => {
    switch (challenge.status) {
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#9C27B0';
      case 'failed':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  const getStatusIcon = () => {
    switch (challenge.status) {
      case 'active':
        return 'play-circle';
      case 'completed':
        return 'check-circle';
      case 'failed':
        return 'refresh';
      default:
        return 'clock-outline';
    }
  };

  return (
    <Surface style={[styles.card, challenge.status === 'failed' && styles.failedCard]} elevation={1}>
      <View style={styles.content}>
        <View style={styles.info}>
          <View style={styles.statusContainer}>
            <Icon 
              name={getStatusIcon()} 
              size={20} 
              color={getStatusColor()} 
              style={styles.statusIcon}
            />
            <Text style={[styles.status, { color: getStatusColor() }]}>
              {challenge.status.toUpperCase()}
            </Text>
          </View>

          {challenge.daysLeft && (
            <Text style={styles.daysLeft}>{challenge.daysLeft} days left</Text>
          )}

          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.description}>{challenge.description}</Text>

          {challenge.status === 'failed' ? (
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => onView(challenge)}
                style={styles.viewButton}
                labelStyle={styles.viewButtonLabel}
              >
                <Text>View Details</Text>
              </Button>
              <Button
                mode="contained"
                onPress={() => onRetry(challenge)}
                style={styles.retryButton}
                labelStyle={styles.retryButtonLabel}
                icon="refresh"
              >
                <Text style={styles.retryButtonLabel}>Try Again</Text>
              </Button>
            </View>
          ) : (
            <Button
              mode="text"
              onPress={() => onView(challenge)}
              style={styles.viewButton}
              labelStyle={styles.viewButtonLabel}
            >
              <Text>View</Text>
            </Button>
          )}
        </View>
        <View style={styles.iconContainer}>
          <Text>{getIcon()}</Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  failedCard: {
    borderWidth: 1,
    borderColor: '#ffebee',
    backgroundColor: '#fff5f5',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  info: {
    flex: 1,
    marginRight: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusIcon: {
    marginRight: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  daysLeft: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  viewButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  viewButtonLabel: {
    fontSize: 14,
    letterSpacing: 0,
  },
  retryButton: {
    marginLeft: 8,
    backgroundColor: '#F44336',
  },
  retryButtonLabel: {
    fontSize: 14,
    color: '#fff',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default ChallengeCard; 