import { NativeModules } from 'react-native';

const { UsageStatsModule } = NativeModules;

class UsageStatsService {
  static instance = null;

  static getInstance() {
    if (!UsageStatsService.instance) {
      UsageStatsService.instance = new UsageStatsService();
    }
    return UsageStatsService.instance;
  }

  async checkPermission() {
    try {
      const hasPermission = await UsageStatsModule.checkUsageStatsPermission();
      return hasPermission;
    } catch (error) {
      console.error('Error checking usage stats permission:', error);
      return false;
    }
  }

  async requestPermission() {
    try {
      await UsageStatsModule.requestUsageStatsPermission();
    } catch (error) {
      console.error('Error requesting usage stats permission:', error);
      throw error;
    }
  }

  async getDailyScreenTime(startDate, endDate) {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        throw new Error('Usage stats permission not granted');
      }

      const usage = await UsageStatsModule.getDailyScreenTime(
        startDate.getTime(),
        endDate.getTime()
      );

      return usage.map(day => ({
        date: new Date(day.date).toISOString().split('T')[0],
        minutes: Math.round(day.timeInForeground / 60000), // Convert ms to minutes
      }));
    } catch (error) {
      console.error('Error getting daily screen time:', error);
      throw error;
    }
  }

  async getAppsUsageTime(packageNames, startDate, endDate) {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        throw new Error('Usage stats permission not granted');
      }

      const usage = await UsageStatsModule.getAppsUsageTime(
        packageNames,
        startDate.getTime(),
        endDate.getTime()
      );

      return usage.map(app => ({
        packageName: app.packageName,
        minutes: Math.round(app.timeInForeground / 60000), // Convert ms to minutes
      }));
    } catch (error) {
      console.error('Error getting apps usage time:', error);
      throw error;
    }
  }

  async getTotalScreenTime(startDate, endDate) {
    try {
      const dailyUsage = await this.getDailyScreenTime(startDate, endDate);
      return dailyUsage.reduce((total, day) => total + day.minutes, 0);
    } catch (error) {
      console.error('Error getting total screen time:', error);
      throw error;
    }
  }
}

export default UsageStatsService;

// Returns total usage time for today in seconds
export async function getCurrentDailyTotalTimeInSeconds() {
  try {
    // 'DAY' period returns today's usage for all apps
    const stats = await UsageStatsModule.getUsageStats('DAY', null);
    // stats: [{ packageName, appName, timeInSeconds, ... }]
    const total = stats.reduce((sum, app) => sum + (app.timeInSeconds || 0), 0);
    return total;
  } catch (e) {
    console.error('Error getting daily usage stats:', e);
    return 0;
  }
}

// Returns top used apps for today
export async function getTopApps(limit = 5) {
  try {
    const stats = await UsageStatsModule.getUsageStats('DAY', null);
    return stats
      .sort((a, b) => (b.timeInSeconds || 0) - (a.timeInSeconds || 0))
      .slice(0, limit)
      .map(app => ({
        name: app.appName || app.packageName,
        usage: formatUsageTime(app.timeInSeconds || 0),
        usageMin: Math.floor((app.timeInSeconds || 0) / 60),
        icon: getAppIcon(app.packageName)
      }));
  } catch (e) {
    console.error('Error getting top apps:', e);
    return [];
  }
}

// Returns average daily usage for the specified period (7 or 30 days)
export async function getAverageDailyUsage(days = 7) {
  try {
    const dailyTotals = [];
    const today = new Date();
    
    // Get stats for each day
    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Format date as yyyy-MM-dd
      const formattedDate = date.toISOString().split('T')[0];
      
      // Get stats for this specific day
      const stats = await UsageStatsModule.getUsageStats('CUSTOM', formattedDate);
      const dailyTotal = stats.reduce((sum, app) => sum + (app.timeInSeconds || 0), 0);
      
      if (dailyTotal > 0) {
        dailyTotals.push(dailyTotal);
      }
    }

    // Calculate average
    if (dailyTotals.length === 0) {
      return { average: 0, days };
    }

    const average = Math.floor((dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length) / 60);
    return { average, days };
  } catch (e) {
    console.error('Error getting average daily usage:', e);
    return { average: 0, days };
  }
}

// Helper function to format time
function formatUsageTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Helper function to get app icon (you might want to customize this based on your needs)
function getAppIcon(packageName) {
  // This is a simple mapping, you might want to expand it or use a different approach
  const iconMap = {
    'com.whatsapp': 'whatsapp',
    'com.facebook.katana': 'facebook',
    'com.instagram.android': 'instagram',
    'com.google.android.youtube': 'youtube',
    'com.android.chrome': 'web',
    'com.google.android.gm': 'email',
  };
  
  return iconMap[packageName] || 'application';
} 