import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { achievementService } from '../services/AchievementService';
import AchievementCard from '../components/AchievementCard';
import { ACHIEVEMENT_TYPES } from '../constants/achievements';
import { achievementChecker } from '../services/achievementChecker';
import { showAchievementUnlock } from '../services/notificationService';
import { useFocusUpdate } from '../hooks/useFocusUpdate';
import { useFocusEffect } from '@react-navigation/native';

const AchievementsScreen = () => {
  const [achievements, setAchievements] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

    // Refresh data when screen comes into focus
    useFocusEffect(
      useCallback(() => {
        loadAchievements();
      }, [loadAchievements])
    );

  const loadAchievements = () => {
    const allAchievements = achievementService.getAllAchievementsWithStatus();
    setAchievements(allAchievements);
    setTotalPoints(achievementService.getTotalPoints());
  };

  const renderAchievementSection = (type) => {
    const filteredAchievements = achievements.filter(a => a.type === type);
    if (filteredAchievements.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {getSectionTitle(type)}
        </Text>
        <View style={styles.cardContainer}>
          {filteredAchievements.map(achievement => (
            <AchievementCard
              key={achievement.id}
              title={achievement.title}
              description={achievement.description}
              icon={achievement.icon}
              unlocked={achievement.unlocked}
            />
          ))}
        </View>
      </View>
    );
  };

  const getSectionTitle = (type) => {
    const titles = {
      [ACHIEVEMENT_TYPES.STREAK]: 'Серії та Послідовності',
      [ACHIEVEMENT_TYPES.FOCUS]: 'Фокус та Концентрація',
      [ACHIEVEMENT_TYPES.USAGE]: 'Використання Додатку',
      [ACHIEVEMENT_TYPES.CHALLENGE]: 'Челенджі',
      [ACHIEVEMENT_TYPES.ONBOARDING]: 'Початкові Кроки'
    };
    return titles[type] || type;
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Text style={styles.title}>Досягнення</Text>
        <Text style={styles.points}>{totalPoints} балів</Text>
      </Surface>

      <FlatList
        style={styles.content}
        data={Object.values(ACHIEVEMENT_TYPES)}
        renderItem={({ item }) => renderAchievementSection(item)}
        keyExtractor={item => item}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a'
  },
  points: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: 16
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  }
});

export default AchievementsScreen; 