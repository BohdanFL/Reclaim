import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Text, Switch, Divider, Button, Portal, Dialog } from 'react-native-paper';
import { achievementService } from '../services/AchievementService';
import ChallengeService from '../services/ChallengeService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const SettingsScreen = ({ navigation }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [resetAchievementsDialogVisible, setResetAchievementsDialogVisible] = useState(false);
  const [resetChallengesDialogVisible, setResetChallengesDialogVisible] = useState(false);
  const challengeService = ChallengeService.getInstance();

  const handleResetAchievements = () => {
    achievementService.clearAchievements();
    setResetAchievementsDialogVisible(false);
  };

  const handleResetChallenges = () => {
    challengeService.resetChallenges();
    setResetChallengesDialogVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Налаштування</Text>
      
      <List.Section>
        <List.Item
          title="Темна тема"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => <Switch value={darkMode} onValueChange={setDarkMode} />}
        />
        <Divider />
        <List.Item
          title="Сповіщення"
          left={props => <List.Icon {...props} icon="bell-outline" />}
          right={() => <Switch value={notifications} onValueChange={setNotifications} />}
        />
        <Divider />
        <List.Item
          title="Мова"
          description="Українська"
          left={props => <List.Icon {...props} icon="translate" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

      <Divider style={styles.sectionDivider} />

      <List.Section>
        <List.Subheader>Додаткові функції</List.Subheader>
        <List.Item
          title="Досягнення"
          left={props => <List.Icon {...props} icon="trophy-outline" />}
          onPress={() => navigation.navigate('Achievements')}
        />
        <Divider />
        <List.Item
          title="Цілі та обмеження"
          left={props => <List.Icon {...props} icon="target" />}
          onPress={() => navigation.navigate('Goals')}
        />
        <Divider />
        <List.Item
          title="Поради та підказки"
          left={props => <List.Icon {...props} icon="lightbulb-outline" />}
          onPress={() => navigation.navigate('Advice')}
        />
        <Divider />
        <List.Item
          title="Профіль"
          left={props => <List.Icon {...props} icon="account" />}
          onPress={() => navigation.navigate('Profile')}
        />
      </List.Section>

      <Divider style={styles.sectionDivider} />

      <List.Section>
        <List.Subheader>Скидання даних</List.Subheader>
        <View style={styles.resetButtons}>
          <Button 
            mode="contained-tonal" 
            onPress={() => setResetAchievementsDialogVisible(true)}
            style={styles.resetButton}
            icon="trophy-outline"
          >
            Скинути досягнення
          </Button>
          <Button 
            mode="contained-tonal" 
            onPress={() => setResetChallengesDialogVisible(true)}
            style={styles.resetButton}
            icon="flag-outline"
          >
            Скинути челенджі
          </Button>
        </View>
      </List.Section>

      <Divider style={styles.sectionDivider} />

      <List.Section>
        <List.Subheader>Про додаток</List.Subheader>
        <List.Item
          title="Умови використання"
          left={props => <List.Icon {...props} icon="file-document-outline" />}
          onPress={() => {/* Navigate to terms */}}
        />
        <List.Item
          title="Політика конфіденційності"
          left={props => <List.Icon {...props} icon="shield-check-outline" />}
          onPress={() => {/* Navigate to privacy policy */}}
        />
        <List.Item
          title="Версія додатку"
          description="1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
        />
      </List.Section>

      {/* Reset Achievements Dialog */}
      <Portal>
        <Dialog
          visible={resetAchievementsDialogVisible}
          onDismiss={() => setResetAchievementsDialogVisible(false)}
        >
          <Dialog.Title>Скинути досягнення?</Dialog.Title>
          <Dialog.Content>
            <Text>Ви впевнені, що хочете скинути всі досягнення? Цю дію неможливо скасувати.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetAchievementsDialogVisible(false)}>Скасувати</Button>
            <Button mode="contained" onPress={handleResetAchievements} textColor="white">
              Скинути
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Reset Challenges Dialog */}
      <Portal>
        <Dialog
          visible={resetChallengesDialogVisible}
          onDismiss={() => setResetChallengesDialogVisible(false)}
        >
          <Dialog.Title>Скинути челенджі?</Dialog.Title>
          <Dialog.Content>
            <Text>Ви впевнені, що хочете скинути всі челенджі? Цю дію неможливо скасувати.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetChallengesDialogVisible(false)}>Скасувати</Button>
            <Button mode="contained" onPress={handleResetChallenges} textColor="white">
              Скинути
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    margin: 16,
  },
  sectionDivider: {
    marginVertical: 8,
  },
  resetButtons: {
    padding: 16,
    gap: 12,
  },
  resetButton: {
    borderRadius: 8,
  }
});

export default SettingsScreen; 