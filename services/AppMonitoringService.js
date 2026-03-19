import { NativeModules, NativeEventEmitter } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import ChallengeService from './ChallengeService';

const { AppBlockerModule, UsageStatsModule } = NativeModules;
const storage = new MMKV();
const GOALS_STORAGE_KEY = 'app_goals';
const CHECK_INTERVAL = 10000; // Перевіряємо кожні 10 секунд

class AppMonitoringService {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.challengeService = ChallengeService.getInstance();
    this.lastCheckedApp = null;
  }

  async startMonitoring() {
    if (this.isMonitoring) return;

    try {
      // Перевіряємо необхідні дозволи
      const hasUsagePermission = await UsageStatsModule.checkUsageStatsPermission();
      if (!hasUsagePermission) {
        console.error('Usage stats permission not granted');
        return;
      }

      this.isMonitoring = true;
      this.monitoringInterval = setInterval(() => {
        this.checkAppUsage();
      }, CHECK_INTERVAL);

      console.log('App monitoring started');
    } catch (error) {
      console.error('Error starting app monitoring:', error);
    }
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.lastCheckedApp = null;
  }

  async checkAppUsage() {
    try {
      // Отримуємо поточний активний додаток
      const currentApp = await UsageStatsModule.getCurrentApp();
      if (!currentApp) return;

      // Перевіряємо чи змінився додаток
      if (this.lastCheckedApp?.packageName !== currentApp.packageName) {
        this.lastCheckedApp = currentApp;
        console.log('Current app:', currentApp.appName, currentApp.packageName);

        // Перевіряємо обмеження часу
        await this.checkTimeLimits(currentApp);

        // Оновлюємо прогрес челенджів
        await this.updateChallenges(currentApp);
      }
    } catch (error) {
      console.error('Error checking app usage:', error);
    }
  }

  async checkTimeLimits(currentApp) {
    try {
      const goalsData = storage.getString(GOALS_STORAGE_KEY);
      if (!goalsData) return;

      const goals = JSON.parse(goalsData);
      const appGoal = goals.find(g => g.packageName === currentApp.packageName && g.isActive);
      
      if (appGoal) {
        const todayUsage = await UsageStatsModule.getTodayUsageTime(currentApp.packageName);
        const usageMinutes = Math.floor(todayUsage / (1000 * 60));
        console.log(`App ${currentApp.appName} usage: ${usageMinutes}/${appGoal.timeLimit} minutes`);

        if (todayUsage >= appGoal.timeLimit * 60 * 1000) {
          console.log(`Blocking app ${currentApp.appName} - time limit reached`);
          // Блокуємо додаток
          await AppBlockerModule.blockApp(currentApp.packageName);
          // Показуємо оверлей з повідомленням
          await AppBlockerModule.showBlockingOverlay(
            currentApp.packageName,
            'Time Limit Reached',
            `You've reached your daily limit for ${currentApp.appName}`
          );
        }
      }
    } catch (error) {
      console.error('Error checking time limits:', error);
    }
  }

  async updateChallenges(currentApp) {
    try {
      const activeChallenges = await this.challengeService.getChallenges('active');
      
      for (const challenge of activeChallenges) {
        // Перевіряємо чи це челендж з обмеженням додатків
        if (challenge.type === 'appUsageLimit' && challenge.targetApps?.includes(currentApp.packageName)) {
          await this.challengeService.checkChallengeProgress(challenge.id);
        }
        // Для челенджів типу digitalDetox оновлюємо прогрес для будь-якого додатку
        else if (challenge.type === 'digitalDetox') {
          await this.challengeService.checkChallengeProgress(challenge.id);
        }
      }
    } catch (error) {
      console.error('Error updating challenges:', error);
    }
  }
}

export default new AppMonitoringService(); 