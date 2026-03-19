import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet  } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthError from './AuthError';

// Компонент входу через Google
const GoogleSignInButton = () => {
  const { signIn, loading } = useAuth();
  const [error, setError] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signIn();
    } catch (error) {
      console.error('Error in handleGoogleSignIn:', error);
      setError(error);
    }
  };

  return (
    <View style={styles.container}>
    <TouchableOpacity
      style={styles.button}
      onPress={handleGoogleSignIn}
      disabled={loading}
    >
      <View style={styles.contentContainer}>
        <MaterialCommunityIcons 
          name="google" 
          size={24} 
          color="#DB4437"
        />
        <Text style={styles.text}>
          {loading ? 'Завантаження...' : 'Увійти з Google'}
        </Text>
      </View>
    </TouchableOpacity>

    <AuthError
      error={error}
      onRetry={handleGoogleSignIn}
      style={styles.errorContainer}
    />
  </View>
  );
};

export default GoogleSignInButton; 

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: '100%',
    maxWidth: 280,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    width: '100%',
    maxWidth: 280,
    marginTop: 16,
  },
});