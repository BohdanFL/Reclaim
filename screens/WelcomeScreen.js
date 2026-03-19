import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import { useAuth } from '../contexts/AuthContext';

const WelcomeScreen = ({ navigation }) => {
  const { loading } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Reclaim</Text>
      </View>

      <Text style={styles.tagline}>
        Поверніть контроль над своїм часом
      </Text>

      <Surface style={styles.featuresCard} elevation={1}>
        <Text style={styles.featuresTitle}>Основні можливості:</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Відстежуйте використання додатків</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Встановлюйте цілі та обмеження</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>• Покращуйте цифрові звички</Text>
        </View>
      </Surface>

      <View style={styles.actionContainer}>
        <GoogleSignInButton />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 32,
  },
  featuresCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  featureItem: {
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
  },
  actionContainer: {
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WelcomeScreen; 