import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { ACHIEVEMENTS } from '../constants/achievements';

export const showAchievementUnlock = (achievementId) => {
  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement) return;

  Toast.show({
    type: 'success',
    position: 'top',
    text1: '🏆 Нове Досягнення!',
    text2: achievement.title,
    visibilityTime: 3000,
    autoHide: true,
    topOffset: Platform.OS === 'ios' ? 50 : 30,
  });
};

export const showError = (message) => {
  Toast.show({
    type: 'error',
    position: 'top',
    text1: 'Помилка',
    text2: message,
    visibilityTime: 3000,
    autoHide: true,
    topOffset: Platform.OS === 'ios' ? 50 : 30,
  });
}; 