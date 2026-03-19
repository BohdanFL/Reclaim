import { MMKV } from 'react-native-mmkv';
import { ACHIEVEMENTS } from '../constants/achievements';

const storage = new MMKV();
const ACHIEVEMENTS_KEY = 'user_achievements';

export const achievementService = {
  // Get all unlocked achievements
  getUnlockedAchievements() {
    const achievementsData = storage.getString(ACHIEVEMENTS_KEY);
    return achievementsData ? JSON.parse(achievementsData) : {};
  },

  clearAchievements() {
    storage.delete(ACHIEVEMENTS_KEY);
  },

  // Check if achievement is unlocked
  isAchievementUnlocked(achievementId) {
    const unlockedAchievements = this.getUnlockedAchievements();
    return !!unlockedAchievements[achievementId];
  },

  // Unlock an achievement
  unlockAchievement(achievementId) {
    if (!ACHIEVEMENTS[achievementId]) return false;
    if (this.isAchievementUnlocked(achievementId)) return false;

    const unlockedAchievements = this.getUnlockedAchievements();
    unlockedAchievements[achievementId] = {
      unlockedAt: new Date().toISOString(),
      points: ACHIEVEMENTS[achievementId].points
    };

    storage.set(ACHIEVEMENTS_KEY, JSON.stringify(unlockedAchievements));
    return true;
  },

  // Get total achievement points
  getTotalPoints() {
    const unlockedAchievements = this.getUnlockedAchievements();
    return Object.values(unlockedAchievements).reduce((total, achievement) => 
      total + achievement.points, 0);
  },

  // Get all achievements with unlock status
  getAllAchievementsWithStatus() {
    const unlockedAchievements = this.getUnlockedAchievements();
    
    return Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: !!unlockedAchievements[achievement.id],
      unlockedAt: unlockedAchievements[achievement.id]?.unlockedAt
    }));
  }
}; 