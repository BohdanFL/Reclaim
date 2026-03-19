import { NativeModules } from 'react-native';

const { AppListModule } = NativeModules;

export const getInstalledApps = async () => {
  try {
    const apps = await AppListModule.getInstalledApps();
    return apps.map(app => ({
      packageName: app.packageName,
      appName: app.appName,
      icon: app.icon
    }));
  } catch (error) {
    console.error('Error getting installed apps:', error);
    return [];
  }
};

export const blockApp = async (packageName) => {
  try {
    await AppListModule.blockApp(packageName);
    return true;
  } catch (error) {
    console.error('Error blocking app:', error);
    return false;
  }
};

export const unblockApp = async (packageName) => {
  try {
    await AppListModule.unblockApp(packageName);
    return true;
  } catch (error) {
    console.error('Error unblocking app:', error);
    return false;
  }
};

export const isAppBlocked = async (packageName) => {
  try {
    return await AppListModule.isAppBlocked(packageName);
  } catch (error) {
    console.error('Error checking app block status:', error);
    return false;
  }
}; 