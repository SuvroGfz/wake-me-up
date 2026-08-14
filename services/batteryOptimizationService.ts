import { Platform } from 'react-native';
import * as Battery from 'expo-battery';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BATTERY_SETUP_COMPLETE_KEY } from '../constants/values';

export const isBatteryOptimized = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    return await Battery.isBatteryOptimizationEnabledAsync();
  } catch (error) {
    console.warn('Error checking battery optimization:', error);
    return false;
  }
};

export const requestBatteryOptimizationExemption = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
  } catch (error) {
    console.warn('Could not open battery settings:', error);
  }
};

export const openOEMBatterySettings = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  
  const manufacturer = Device.manufacturer?.toLowerCase();
  
  try {
    if (manufacturer === 'xiaomi' || manufacturer === 'redmi' || manufacturer === 'poco') {
      await IntentLauncher.startActivityAsync('miui.intent.action.OP_AUTO_START', {
        className: 'com.miui.securitycenter.permission.AutoStartManagementActivity',
        packageName: 'com.miui.securitycenter'
      });
      return true;
    }
    
    if (manufacturer === 'samsung') {
      await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
        // Fallback to app details for Samsung
        data: 'package:com.wakemeup' // Assuming a default, though dynamic is better
      });
      return true;
    }

    if (manufacturer === 'huawei' || manufacturer === 'honor') {
      await IntentLauncher.startActivityAsync('huawei.intent.action.HSM_BOOTAPP_MANAGER', {
        className: 'com.huawei.systemmanager.optimize.process.ProtectActivity',
        packageName: 'com.huawei.systemmanager'
      });
      return true;
    }

    if (manufacturer === 'oppo') {
      await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
        className: 'com.coloros.safecenter.permission.startup.StartupAppListActivity',
        packageName: 'com.coloros.safecenter'
      });
      return true;
    }

    if (manufacturer === 'vivo') {
      await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
        className: 'com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity',
        packageName: 'com.iqoo.secure'
      });
      return true;
    }

    if (manufacturer === 'oneplus') {
      await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
        className: 'com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity',
        packageName: 'com.oneplus.security'
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Could not open OEM specific settings:', error);
    return false;
  }
};

export const hasBatterySetupCompleted = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(BATTERY_SETUP_COMPLETE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading battery setup flag:', error);
    return false;
  }
};

export const markBatterySetupComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(BATTERY_SETUP_COMPLETE_KEY, 'true');
  } catch (error) {
    console.error('Error setting battery setup flag:', error);
  }
};
