import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import ChallengeService from '../services/ChallengeService';
import ChallengeCard from '../components/ChallengeCard';

const ChallengesScreen = ({ navigation }) => {
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [failedChallenges, setFailedChallenges] = useState([]);
  const [availableChallenges, setAvailableChallenges] = useState([]);
  const challengeService = ChallengeService.getInstance();

  useEffect(() => {
    loadChallenges();
    
    // Subscribe to changes
    const unsubscribe = challengeService.addListener(loadChallenges);
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const loadChallenges = async () => {
    try {
      const allChallenges = await challengeService.getChallenges();
      console.log('Loaded challenges:', allChallenges); // Debugging log
      
      // Categorize challenges by status
      setActiveChallenges(allChallenges.filter(c => c.status === 'active'));
      setCompletedChallenges(allChallenges.filter(c => c.status === 'completed'));
      setFailedChallenges(allChallenges.filter(c => c.status === 'failed'));
      setAvailableChallenges(allChallenges.filter(c => c.status === 'available' || !c.status));
    } catch (error) {
      console.error('Error loading challenges:', error);
      // Set empty arrays in case of error
      setActiveChallenges([]);
      setCompletedChallenges([]);
      setFailedChallenges([]);
      setAvailableChallenges([]);
    }
  };

  const handleViewChallenge = (challenge) => {
    navigation.navigate('ChallengeDetail', { challengeId: challenge.id });
  };

  const handleRetryChallenge = async (challenge) => {
    try {
      await challengeService.retryChallenge(challenge.id);
      loadChallenges();
    } catch (error) {
      console.error('Error retrying challenge:', error);
    }
  };

  const renderChallengeSection = (title, challenges, emptyMessage) => (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {title}
      </Text>
      {challenges.length > 0 ? (
        challenges.map(challenge => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onView={() => handleViewChallenge(challenge)}
            onRetry={
              challenge.status === 'failed' ? 
              () => handleRetryChallenge(challenge) : 
              undefined
            }
          />
        ))
      ) : (
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Челенджі</Text>
      </View>

      {/* Available Challenges Section */}
      {renderChallengeSection(
        'Доступні челенджі',
        availableChallenges,
        'Немає доступних челенджів'
      )}

      {/* Active Challenges Section */}
      {renderChallengeSection(
        'Активні челенджі',
        activeChallenges,
        'Немає активних челенджів'
      )}

      {/* Completed Challenges Section */}
      {renderChallengeSection(
        'Завершені челенджі',
        completedChallenges,
        'Немає завершених челенджів'
      )}

      {/* Failed Challenges Section */}
      {renderChallengeSection(
        'Невдалі челенджі',
        failedChallenges,
        'Немає невдалих челенджів'
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
  },
  section: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#757575',
    fontStyle: 'italic',
    marginVertical: 12,
  },
});

export default ChallengesScreen; 