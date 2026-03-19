import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import ChallengeService from '../services/ChallengeService';

export const useFocusUpdate = (challengeId = null, onUpdate = null) => {
  const isFocused = useIsFocused();

  useEffect(() => {
    let intervalId;

    const updateData = async () => {
      if (challengeId) {
        // Update specific challenge
        await ChallengeService.getInstance().checkChallengeProgress(challengeId);
      } else {
        // Update all active challenges
        const challenges = await ChallengeService.getInstance().getChallenges('active');
        for (const challenge of challenges) {
          await ChallengeService.getInstance().checkChallengeProgress(challenge.id);
        }
      }
      
      if (onUpdate) {
        onUpdate();
      }
    };

    if (isFocused) {
      // Update immediately when screen comes into focus
      updateData();
      
      // Set up interval for periodic updates while focused
      intervalId = setInterval(updateData, 5 * 60 * 1000); // Update every 5 minutes
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isFocused, challengeId, onUpdate]);
}; 