import React, { useEffect, useState } from 'react';
import { NavigationContainer, getFocusedRouteName } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { ProfileScreen, WelcomeScreen } from '../screens/auth/AuthScreens';
import HomeScreen from '../screens/HomeScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FocusSetupScreen from '../screens/FocusSetupScreen';
import FocusSessionScreen from '../screens/FocusSessionScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import AdviceScreen from '../screens/AdviceScreen';
import GoalsScreen from '../screens/GoalsScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';
import FocusSessionManager from '../services/FocusSessionManager';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator();
const FocusStack = createNativeStackNavigator();
const ChallengesStack = createNativeStackNavigator();

// Навігатор для режиму фокусування
const FocusNavigator = () => {
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    // Перевіряємо наявність активної сесії при монтуванні
    const session = FocusSessionManager.getActiveSession();
    setActiveSession(session);

    // Встановлюємо інтервал для періодичної перевірки
    const intervalId = setInterval(() => {
      const currentSession = FocusSessionManager.getActiveSession();
      setActiveSession(currentSession);
    }, 1000); // Перевіряємо кожну секунду

    return () => clearInterval(intervalId);
  }, []);

  return (
    <FocusStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={activeSession ? 'FocusSession' : 'FocusSetup'}
    >
      <FocusStack.Screen 
        name="FocusSetup" 
        component={FocusSetupScreen}
      />
      <FocusStack.Screen 
        name="FocusSession" 
        component={FocusSessionScreen}
        initialParams={activeSession}
        options={{ 
          gestureEnabled: false,
          headerLeft: null,
          headerShown: true,
          headerTitle: "Фокус режим",
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerBackVisible: false,
        }}
      />
    </FocusStack.Navigator>
  );
};

// Навігатор для челенджів
const ChallengesNavigator = () => {
  return (
    <ChallengesStack.Navigator>
      <ChallengesStack.Screen 
        name="ChallengesList" 
        component={ChallengesScreen}
        options={{ headerShown: false }}
      />
      <ChallengesStack.Screen 
        name="ChallengeDetail" 
        component={ChallengeDetailScreen}
        options={({ route }) => ({ 
          title: route.params?.title || 'Челендж',
          headerBackTitle: 'Назад'
        })}
      />
    </ChallengesStack.Navigator>
  );
};

// Навігатор для налаштувань
const SettingsNavigator = () => {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen 
        name="SettingsMain" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Профіль' }}
      />
      <SettingsStack.Screen 
        name="Achievements" 
        component={AchievementsScreen}
        options={{ title: 'Досягнення' }}
      />
      <SettingsStack.Screen 
        name="Advice" 
        component={AdviceScreen}
        options={{ title: 'Поради та підказки' }}
      />
      <SettingsStack.Screen 
        name="Goals" 
        component={GoalsScreen}
        options={{ title: 'Цілі та обмеження' }}
      />
    </SettingsStack.Navigator>
  );
};

// Головний навігатор з табами
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          paddingBottom: 16,
          paddingTop: 8,
          height: 64,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Головна',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatisticsScreen}
        options={{
          title: 'Статистика',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Focus"
        component={FocusNavigator}
        options={({ navigation }) => ({
          // title: 'Фокус',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="timer" color={color} size={size} />
          ),
        })}
      />
      <Tab.Screen
        name="Challenges"
        component={ChallengesNavigator}
        options={{
          title: 'Челенджі',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          title: 'Меню',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="menu" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // або показати SplashScreen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 