import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Surface, Divider, List, Portal, Dialog, Button, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { UserProfile } from '../../components/auth/UserProfile';
// Екран привітання
export const WelcomeScreen = () => {
  const { loading } = useAuth();

  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo.png')}
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
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      )}
    </View>
  );
};

// Екран профілю
export const ProfileScreen = () => {
  const { signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Тут можна додати відображення помилки
    }
  };

  return (
    <ScrollView style={styles.profileScreen}>
      <UserProfile />
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Налаштування</Text>
        <List.Item
          title="Сповіщення"
          left={props => <List.Icon {...props} icon="bell-outline" />}
          onPress={() => {/* Navigate to notifications settings */}}
        />
        <List.Item
          title="Конфіденційність"
          left={props => <List.Icon {...props} icon="shield-outline" />}
          onPress={() => {/* Navigate to privacy settings */}}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Підтримка</Text>
        <List.Item
          title="Довідка"
          left={props => <List.Icon {...props} icon="help-circle-outline" />}
          onPress={() => {/* Navigate to help section */}}
        />
        <List.Item
          title="Зв'язатися з нами"
          left={props => <List.Icon {...props} icon="email-outline" />}
          onPress={() => {/* Navigate to contact form */}}
        />
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Юридична інформація</Text>
        <List.Item
          title="Умови використання"
          left={props => <List.Icon {...props} icon="file-document-outline" />}
          onPress={() => {/* Navigate to terms */}}
        />
        <List.Item
          title="Політика конфіденційності"
          left={props => <List.Icon {...props} icon="lock-outline" />}
          onPress={() => {/* Navigate to privacy policy */}}
        />
      </View>

      <View style={styles.logoutSection}>
        <Button
          mode="outlined"
          onPress={() => setShowLogoutDialog(true)}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          labelStyle={styles.logoutButtonLabel}
        >
          Вийти з облікового запису
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={showLogoutDialog}
          onDismiss={() => setShowLogoutDialog(false)}
        >
          <Dialog.Title>Вийти з облікового запису?</Dialog.Title>
          <Dialog.Content>
            <Text>Ви впевнені, що хочете вийти з облікового запису?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)}>Скасувати</Button>
            <Button onPress={handleLogout}>Вийти</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Стилі для WelcomeScreen
  welcomeContainer: {
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Стилі для ProfileScreen
  profileScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  logoutSection: {
    padding: 16,
    marginTop: 16,
  },
  logoutButton: {
    borderColor: '#FF5252',
  },
  logoutButtonContent: {
    height: 48,
  },
  logoutButtonLabel: {
    color: '#FF5252',
  },
}); 