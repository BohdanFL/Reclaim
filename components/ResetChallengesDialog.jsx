import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Button, Text, Portal } from 'react-native-paper';

const ResetChallengesDialog = ({ visible, onDismiss, onReset }) => {
  return (
    <Portal>
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Reset All Challenges</Dialog.Title>
      <Dialog.Content>
        <Text>
          This will reset all challenges to their initial state. All progress will be lost. 
          Are you sure you want to continue?
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancel</Button>
        <Button onPress={onReset}>Reset</Button>
      </Dialog.Actions>
    </Dialog>
    </Portal>
  );
};

export default ResetChallengesDialog;

