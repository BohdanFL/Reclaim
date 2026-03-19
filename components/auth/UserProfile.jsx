import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../contexts/AuthContext';

// Компонент профілю користувача
export const UserProfile = () => {
  const { user, signOut, loading } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <View style={styles.profileContainer}>
      {user.photoURL && (
        <Image
          source={{ uri: user.photoURL }}
          style={styles.avatar}
        />
      )}
      <Text style={styles.name}>{user.displayName}</Text>
      <Text style={styles.email}>{user.email}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Стилі для AuthError
  errorContainer: {
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

  // Стилі для GoogleSignInButton
  signInContainer: {
    width: '100%',
    alignItems: 'center',
  },
  googleButton: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContent: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#757575',
    marginLeft: 8,
  },
  signInError: {
    width: '100%',
    maxWidth: 280,
    marginTop: 16,
  },

  // Стилі для UserProfile
  profileContainer: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  signOutButton: {
    marginTop: 16,
  },
}); 