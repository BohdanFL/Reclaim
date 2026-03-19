import React, { useEffect } from 'react';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { NativeModules } from 'react-native';

const { UsageStatsModule, OverlayModule } = NativeModules;

const PermissionsManager = () => {
  useEffect(() => {
    checkAndRequestPermissions();
  }, []);

  const checkAndRequestPermissions = async () => {
    try {
      // Перевірка дозволу на показ поверх інших вікон
      const hasOverlayPermission = await OverlayModule.canDrawOverlays();
      if (!hasOverlayPermission) {
        Alert.alert(
          "Permission Required",
          "Reclaim needs permission to display warnings over other apps. Please enable it in the next screen.",
          [
            {
              text: "OK",
              onPress: () => OverlayModule.openOverlaySettings()
            }
          ]
        );
      }

      // Перевірка дозволу на доступ до статистики використання
      const hasUsagePermission = await UsageStatsModule.checkUsageStatsPermission();
      if (!hasUsagePermission) {
        Alert.alert(
          "Permission Required",
          "Reclaim needs access to usage statistics to track app usage. Please enable it in the next screen.",
          [
            {
              text: "OK",
              onPress: () => UsageStatsModule.openUsageSettings()
            }
          ]
        );
      }

    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  return null; // Цей компонент не рендерить UI
};

export default PermissionsManager; 