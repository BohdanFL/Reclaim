import { MMKV } from 'react-native-mmkv';
import { NativeModules } from 'react-native';
import { achievementChecker } from './achievementChecker';
import UsageStatsService from './UsageStatsService';

const { UsageStatsModule } = NativeModules;
const storage = new MMKV();
const CHALLENGES_KEY = 'user_challenges';
const BASELINE_DATA_KEY = '@reclaim_baseline_data';

const DEFAULT_CHALLENGES = [
  {
    id: 'digital-detox-1',
    type: 'digitalDetox',
    title: 'Цифровий детокс',
    description: 'Зменшіть час використання екрану на 20% протягом тижня',
    status: 'available',
    durationDays: 7,
    targetReduction: 20,
    baselineRequired: true,
  },
  {
    id: 'app-limit-1',
    type: 'appUsageLimit',
    title: 'Контроль соціальних мереж',
    description: 'Обмежте використання соціальних мереж до 1 години на день',
    status: 'available',
    durationDays: 3,
    dailyLimitMinutes: 60,
    targetApps: ['com.instagram.android', 'com.facebook.katana', 'com.twitter.android', 'com.tiktok.android', 'org.telegram.messenger'],
    requireAllDaysSuccess: true,
  },
  {
    id: 'digital-detox-2',
    type: 'digitalDetox',
    title: 'Вечірній режим',
    description: 'Не використовуйте телефон за 1 годину до сну',
    status: 'available',
    durationDays: 5,
    targetReduction: 100,
    timeWindow: { start: '22:00', end: '23:00' },
    baselineRequired: false,
  },
  {
    id: 'app-limit-2',
    type: 'appUsageLimit',
    title: 'Продуктивний ранок',
    description: 'Не відкривайте соціальні мережі в першу годину після пробудження',
    status: 'available',
    durationDays: 4,
    timeWindow: { start: '06:00', end: '07:00' },
    targetApps: ['com.instagram.android', 'com.facebook.katana', 'com.twitter.android', 'com.tiktok.android'],
    requireAllDaysSuccess: true,
  },
  {
    id: 'digital-detox-3',
    type: 'digitalDetox',
    title: 'Вихідний від гаджетів',
    description: 'Зменшіть використання телефону на 50% у вихідні',
    status: 'available',
    durationDays: 2,
    targetReduction: 50,
    baselineRequired: true,
    weekendOnly: true,
  }
];

class ChallengeService {
  static instance = null;
  listeners = [];
  availableChallenges = [];

  constructor() {
    // Initialize with default challenges
    this.initializeDefaultChallenges();
  }

  static getInstance() {
    if (!ChallengeService.instance) {
      ChallengeService.instance = new ChallengeService();
    }
    return ChallengeService.instance;
  }

  async initializeDefaultChallenges() {
    try {
      const existingChallenges = storage.getString(CHALLENGES_KEY);
      if (!existingChallenges) {
        // If no challenges exist, initialize with defaults
        await this.saveChallenges(DEFAULT_CHALLENGES);
        console.log('Default challenges initialized');
      }
    } catch (error) {
      console.error('Error initializing default challenges:', error);
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  resetChallenges() {
    storage.delete(CHALLENGES_KEY);
    this.initializeDefaultChallenges(); // Re-initialize with defaults after reset
    this.notifyListeners();
  }

  async getChallenges(status = 'all') {
    try {
      const challengesData = storage.getString(CHALLENGES_KEY);
      let challenges = challengesData ? JSON.parse(challengesData) : [];
      
      // If no challenges exist, initialize with defaults
      if (challenges.length === 0) {
        challenges = DEFAULT_CHALLENGES;
        await this.saveChallenges(challenges);
      }
      
      if (status === 'all') return challenges;
      return challenges.filter(c => c.status === status);
    } catch (error) {
      console.error('Error getting challenges:', error);
      return DEFAULT_CHALLENGES; // Return defaults as fallback
    }
  }

  async checkChallengeProgress(challengeId) {
    try {
      const challenges = await this.getChallenges();
      const challenge = challenges.find(c => c.id === challengeId);
      
      if (!challenge || challenge.status !== 'active') return;

      const now = new Date();
      const startDate = new Date(challenge.startDate);
      const endDate = new Date(challenge.endDate);

      if (now > endDate) {
        await this.updateChallengeStatus(challengeId, 'failed');
        return;
      }

      if (challenge.type === 'digitalDetox') {
        // Convert timestamps to strings
        const usageStats = await UsageStatsModule.getUsageStats(
          startDate.getTime().toString(),
          now.getTime().toString()
        );
        
        // Calculate total usage by summing up all app usages
        const totalUsageMs = Object.values(usageStats).reduce((sum, app) => sum + (app.totalTimeInForeground || 0), 0);
        const currentUsageMinutes = Math.floor(totalUsageMs / (1000 * 60));
        const baselineMinutes = challenge.progress.baselineMinutes;
        
        // Calculate reduction percentage
        const reduction = ((baselineMinutes - currentUsageMinutes) / baselineMinutes) * 100;
        
        const challengeUpdates = {
          currentValue: Math.max(0, reduction), // Ensure we don't go below 0%
          dailyUsage: [
            ...challenge.progress.dailyUsage,
            {
              date: now.toISOString(),
              minutes: currentUsageMinutes,
              baselineMinutes: baselineMinutes
            }
          ]
        };

        if (reduction >= challenge.targetReduction) {
          await this.updateChallengeStatus(challengeId, 'completed');
          achievementChecker.checkChallengeAchievements(
            challenges.filter(c => c.status === 'completed').length + 1
          );
        } else {
          const updatedChallenges = challenges.map(c =>
            c.id === challengeId ? {
              ...c,
              progress: {
                ...c.progress,
                ...challengeUpdates,
                lastUpdated: now.toISOString()
              }
            } : c
          );
          await this.saveChallenges(updatedChallenges);
        }
      } else if (challenge.type === 'appUsageLimit') {
        const usageStats = await Promise.all(
          challenge.targetApps.map(async (packageName) => {
            const usage = await UsageStatsModule.getAppUsageStatsForPeriod(
              startDate.getTime().toString(),
              now.getTime().toString(),
              packageName
            );
            return { packageName, usage: usage || 0 };
          })
        );

        const totalUsage = usageStats.reduce((sum, stat) => sum + stat.usage, 0);
        const totalUsageMinutes = Math.floor(totalUsage / (1000 * 60));

        const withinLimit = totalUsageMinutes <= challenge.dailyLimitMinutes;
        const successfulDays = withinLimit ? 
          (challenge.progress.successfulDays || 0) + 1 : 
          challenge.progress.successfulDays || 0;

        const challengeUpdates = {
          currentValue: totalUsageMinutes,
          successfulDays,
          dailyUsage: [
            ...challenge.progress.dailyUsage,
            {
              date: now.toISOString(),
              minutes: totalUsageMinutes,
              withinLimit
            }
          ]
        };

        if (successfulDays >= challenge.durationDays) {
          await this.updateChallengeStatus(challengeId, 'completed');
          achievementChecker.checkChallengeAchievements(
            challenges.filter(c => c.status === 'completed').length + 1
          );
        } else {
          const updatedChallenges = challenges.map(c =>
            c.id === challengeId ? {
              ...c,
              progress: {
                ...c.progress,
                ...challengeUpdates,
                lastUpdated: now.toISOString()
              }
            } : c
          );
          await this.saveChallenges(updatedChallenges);
        }
      }
    } catch (error) {
      console.error('Error checking challenge progress:', error);
    }
  }

  async updateChallengeStatus(challengeId, newStatus) {
    try {
      const challenges = await this.getChallenges();
      const updatedChallenges = challenges.map(c =>
        c.id === challengeId ? { ...c, status: newStatus } : c
      );
      storage.set(CHALLENGES_KEY, JSON.stringify(updatedChallenges));
    } catch (error) {
      console.error('Error updating challenge status:', error);
    }
  }

  async addChallenge(challenge) {
    try {
      const challenges = await this.getChallenges();
      const newChallenge = {
        ...challenge,
        id: Date.now().toString(),
        status: 'active',
        progress: 0,
        startDate: new Date().toISOString(),
      };
      
      challenges.push(newChallenge);
      storage.set(CHALLENGES_KEY, JSON.stringify(challenges));
      return newChallenge;
    } catch (error) {
      console.error('Error adding challenge:', error);
      return null;
    }
  }

  async startChallenge(challengeId) {
    const challenges = await this.getChallenges();
    const challengeIndex = challenges.findIndex(c => c.id === challengeId);
    
    if (challengeIndex === -1) return null;

    const challenge = challenges[challengeIndex];
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + challenge.durationDays);

    // Initialize challenge-specific data
    let progress = {
      currentValue: 0,
      targetValue: 100,
      unit: '%',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      lastUpdated: now.toISOString(),
    };

    // Set up challenge-specific initial data
    if (challenge.type === 'digitalDetox') {
      const baselineData = await this.calculateBaselineScreenTime();
      progress = {
        ...progress,
        baselineMinutes: baselineData.averageDaily,
        targetValue: challenge.targetReduction,
        unit: '% reduction',
        successfulDays: 0,
        dailyUsage: [],
      };
    } else if (challenge.type === 'appUsageLimit') {
      progress = {
        ...progress,
        targetValue: challenge.dailyLimitMinutes,
        unit: 'minutes',
        successfulDays: 0,
        dailyUsage: [],
        targetApps: challenge.targetApps,
      };
    }

    challenges[challengeIndex] = {
      ...challenge,
      status: 'active',
      progress,
      daysLeft: challenge.durationDays,
    };

    await this.saveChallenges(challenges);
    return challenges[challengeIndex];
  }

  async calculateBaselineScreenTime() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      // Get usage stats for the last 7 days
      const usageStats = await UsageStatsModule.getUsageStats(
        sevenDaysAgo.getTime().toString(),
        now.getTime().toString()
      );

      // Calculate total screen time by summing up all app usages
      const totalScreenTimeMs = Object.values(usageStats).reduce(
        (sum, app) => sum + (app.totalTimeInForeground || 0),
        0
      );

      // Convert to minutes and calculate daily average
      const totalMinutes = Math.floor(totalScreenTimeMs / (1000 * 60));
      const averageDaily = Math.round(totalMinutes / 7);

      // Get daily breakdown
      const dailyUsage = [];
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dayStats = await UsageStatsModule.getUsageStats(
          dayStart.getTime().toString(),
          dayEnd.getTime().toString()
        );

        const dayTotalMs = Object.values(dayStats).reduce(
          (sum, app) => sum + (app.totalTimeInForeground || 0),
          0
        );

        dailyUsage.push({
          date: dayStart.toISOString(),
          minutes: Math.floor(dayTotalMs / (1000 * 60))
        });
      }

      return {
        averageDaily,
        dailyUsage,
        calculatedAt: now.toISOString()
      };
    } catch (error) {
      console.error('Error calculating baseline screen time:', error);
      // Return a reasonable default if we can't get the actual data
      return {
        averageDaily: 180, // 3 hours as default
        dailyUsage: [],
        calculatedAt: new Date().toISOString()
      };
    }
  }

  async evaluateChallengeCompletion(challenge) {
    let succeeded = false;

    if (challenge.type === 'digitalDetox') {
      const averageReduction = challenge.progress.currentValue;
      succeeded = averageReduction >= challenge.targetReduction;
    } 
    else if (challenge.type === 'appUsageLimit') {
      succeeded = challenge.progress.successfulDays >= challenge.durationDays;
    }

    await this.completeChallenge(challenge.id, succeeded);
  }

  async updateChallengeProgress(challengeId, newProgress) {
    const challenges = await this.getChallenges();
    const challengeIndex = challenges.findIndex(c => c.id === challengeId);
    
    if (challengeIndex === -1) return;

    const challenge = challenges[challengeIndex];
    if (challenge.progress) {
      challenges[challengeIndex].progress = {
        ...challenge.progress,
        ...newProgress,
        lastUpdated: new Date().toISOString(),
      };

      // Update days left
      const now = new Date();
      const endDate = new Date(challenge.progress.endDate);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      challenges[challengeIndex].daysLeft = Math.max(0, daysLeft);

      await this.saveChallenges(challenges);
    }
  }

  async completeChallenge(challengeId, succeeded) {
    try {
      const challenges = await this.getChallenges();
      const challengeIndex = challenges.findIndex(c => c.id === challengeId);
      
      if (challengeIndex === -1) return;

      // Store completion data
      const completionData = {
        completedAt: new Date().toISOString(),
        finalProgress: challenges[challengeIndex].progress,
      };

      challenges[challengeIndex] = {
        ...challenges[challengeIndex],
        status: succeeded ? 'completed' : 'failed',
        completionData
      };

      await this.saveChallenges(challenges);
      return challenges[challengeIndex];
    } catch (error) {
      console.error('Error completing challenge:', error);
      throw error;
    }
  }

  // Add new method to revert all challenges
  async revertAllChallenges() {
    try {
      // Reset to initial challenges
      await this.resetChallenges();
      
      // Clear baseline data
      storage.delete(BASELINE_DATA_KEY);
      
      return this.availableChallenges;
    } catch (error) {
      console.error('Error reverting challenges:', error);
      throw error;
    }
  }

  async retryChallenge(challengeId) {
    try {
      const challenges = await this.getChallenges();
      const challengeIndex = challenges.findIndex(c => c.id === challengeId);
      
      if (challengeIndex === -1) {
        throw new Error('Challenge not found');
      }

      const challenge = challenges[challengeIndex];
      
      // Reset the challenge to available state
      challenges[challengeIndex] = {
        ...challenge,
        status: 'available',
        progress: null,
        daysLeft: null
      };

      await this.saveChallenges(challenges);
      return challenges[challengeIndex];
    } catch (error) {
      console.error('Error retrying challenge:', error);
      throw error;
    }
  }

  async saveChallenges(challenges) {
    try {
      storage.set(CHALLENGES_KEY, JSON.stringify(challenges));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving challenges:', error);
    }
  }
}

export default ChallengeService; 