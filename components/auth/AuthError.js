import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

const AuthError = ({ error, onRetry, style }) => {
  const getErrorMessage = (error) => {
    if (!error) return '';

    // Якщо помилка - це рядок, повертаємо його
    if (typeof error === 'string') return error;

    // Якщо помилка - це об'єкт з повідомленням, використовуємо його
    if (error.message) return error.message;

    // Якщо є код помилки, обробляємо його
    if (error.code) {
      switch (error.code) {
        case 'auth/network-request-failed':
          return 'Помилка підключення до мережі. Перевірте з\'єднання та спробуйте ще раз.';
        case 'auth/cancelled-popup-request':
          return 'Процес входу було скасовано. Спробуйте ще раз.';
        case 'auth/popup-blocked':
          return 'Спливаюче вікно було заблоковано. Дозвольте спливаючі вікна для цього сайту та спробуйте ще раз.';
        case 'auth/popup-closed-by-user':
          return 'Вікно входу було закрито. Спробуйте ще раз.';
        default:
          return `Помилка авторизації: ${error.code}`;
      }
    }

    // Якщо нічого підходящого не знайдено, повертаємо загальне повідомлення
    return 'Сталася помилка під час входу. Спробуйте ще раз.';
  };

  if (!error) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
      {onRetry && (
        <Button
          mode="text"
          onPress={onRetry}
          style={styles.retryButton}
        >
          Спробувати ще раз
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
});

export default AuthError; 