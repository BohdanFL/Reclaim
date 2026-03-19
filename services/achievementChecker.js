import { achievementService } from './AchievementService';
import { showAchievementUnlock } from './notificationService';

export const achievementChecker = {
  // Check achievements related to focus sessions
  checkFocusSessionAchievements(totalSessions) {
    if (totalSessions === 1) {
      this.tryUnlockAchievement('FIRST_FOCUS');
    }
    if (totalSessions >= 5) {
      this.tryUnlockAchievement('FOCUS_MASTER');
    }
  },

  // Check achievements related to daily app usage limits
  checkDailyLimitAchievements(withinLimit) {
    if (withinLimit) {
      this.tryUnlockAchievement('DAILY_LIMIT_KEEPER');
    }
  },

  // Check achievements related to weekly streaks
  checkWeeklyStreakAchievements(weeklyStreak) {
    if (weeklyStreak >= 1) {
      this.tryUnlockAchievement('WEEKLY_SPRINTER');
    }
  },

  // Check goal-related achievements
  checkGoalAchievements(totalGoals) {
    console.log('Checking goals achievements. Total goals:', totalGoals);
    
    if (totalGoals === 1) {
      this.tryUnlockAchievement('FIRST_GOAL');
    }
    
    if (totalGoals >= 3) {
      this.tryUnlockAchievement('THREE_GOALS');
    }
  },

  // Helper method to try unlocking an achievement
  tryUnlockAchievement(achievementId) {
    const wasUnlocked = achievementService.unlockAchievement(achievementId);
    if (wasUnlocked) {
      showAchievementUnlock(achievementId);
      console.log(`Achievement ${achievementId} unlocked`);
    }
  }
}; 