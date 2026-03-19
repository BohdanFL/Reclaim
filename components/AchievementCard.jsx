import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AchievementCard = ({ title, description, icon, unlocked }) => {
  return (
    <Surface 
      style={[
        styles.card, 
        unlocked && styles.unlockedCard
      ]} 
      elevation={unlocked ? 3 : 1}
    >
      <View style={[
        styles.iconContainer,
        unlocked && styles.unlockedIconContainer
      ]}>
        <Icon 
          name={icon} 
          size={unlocked ? 32 : 24} 
          color={unlocked ? '#2196F3' : '#9E9E9E'} 
        />
        {unlocked && (
          <View style={styles.unlockedBadge}>
            <Icon 
              name="check-circle" 
              size={16} 
              color="#4CAF50" 
              style={styles.badgeIcon}
            />
          </View>
        )}
      </View>
      <Text style={[
        styles.title, 
        !unlocked && styles.lockedText,
        unlocked && styles.unlockedTitle
      ]}>
        {title}
      </Text>
      <Text style={[
        styles.description, 
        !unlocked && styles.lockedText,
        unlocked && styles.unlockedDescription
      ]}>
        {description}
      </Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    margin: 6,
    alignItems: 'center',
  },
  unlockedCard: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  unlockedIconContainer: {
    backgroundColor: '#BBDEFB',
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unlockedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  badgeIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  unlockedTitle: {
    color: '#1976D2',
    fontSize: 17,
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    lineHeight: 16,
  },
  unlockedDescription: {
    color: '#2196F3',
  },
  lockedText: {
    color: '#9E9E9E',
  },
});

export default AchievementCard; 