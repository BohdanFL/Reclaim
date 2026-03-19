import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Portal, Dialog, Text, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ChallengeCompletionDialog = ({ 
  visible, 
  onDismiss, 
  onRetry,
  challenge, 
  isSuccess 
}) => {
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={styles.dialog}
      >
        <View style={styles.iconContainer}>
          <Icon
            name={isSuccess ? 'trophy' : 'refresh'}
            size={50}
            color={isSuccess ? '#FFD700' : '#2196F3'}
          />
        </View>
        
        <Dialog.Title style={styles.title}>
          {isSuccess ? 'Challenge Completed!' : 'Challenge Failed'}
        </Dialog.Title>
        
        <Dialog.Content>
          <Text style={styles.challengeTitle}>
            {challenge?.title}
          </Text>
          
          {isSuccess ? (
            <Text style={styles.message}>
              Congratulations! You've successfully completed this challenge.
              Keep up the great work on building better digital habits!
            </Text>
          ) : (
            <Text style={styles.message}>
              Don't worry! Building new habits takes time.
              Would you like to try this challenge again?
            </Text>
          )}
          
          {challenge?.type === 'digitalDetox' && isSuccess && (
            <Text style={styles.stats}>
              You reduced your screen time by {Math.round(challenge.progress?.currentValue)}%!
            </Text>
          )}
          
          {challenge?.type === 'appUsageLimit' && isSuccess && (
            <Text style={styles.stats}>
              You maintained your app usage limit for {challenge.progress?.successfulDays} days!
            </Text>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          {isSuccess ? (
            <Button onPress={onDismiss}>Close</Button>
          ) : (
            <>
              <Button onPress={onDismiss}>Not Now</Button>
              <Button mode="contained" onPress={onRetry}>Try Again</Button>
            </>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    marginTop: 8,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#666',
  },
  stats: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: '#2196F3',
    marginTop: 8,
  },
});

export default ChallengeCompletionDialog; 