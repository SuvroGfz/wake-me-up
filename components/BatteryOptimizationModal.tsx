import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Device from 'expo-device';
import { requestBatteryOptimizationExemption, openOEMBatterySettings, markBatterySetupComplete } from '../services/batteryOptimizationService';

interface BatteryOptimizationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BatteryOptimizationModal: React.FC<BatteryOptimizationModalProps> = ({ visible, onClose }) => {
  const [step, setStep] = useState(1);
  const [hasOEMSettings, setHasOEMSettings] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android' && Device.manufacturer) {
      const manufacturer = Device.manufacturer.toLowerCase();
      const oems = ['xiaomi', 'redmi', 'poco', 'samsung', 'huawei', 'honor', 'oppo', 'vivo', 'oneplus'];
      if (oems.includes(manufacturer)) {
        setHasOEMSettings(true);
      }
    }
  }, []);

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      await requestBatteryOptimizationExemption();
      if (hasOEMSettings) {
        setStep(3);
      } else {
        await finishSetup();
      }
    } else if (step === 3) {
      const success = await openOEMBatterySettings();
      if (!success) {
        setStep(4); // Fallback screen
      } else {
        await finishSetup();
      }
    } else if (step === 4) {
      await finishSetup();
    }
  };

  const finishSetup = async () => {
    await markBatterySetupComplete();
    setStep(1); // Reset for safety
    onClose();
  };

  const skipSetup = async () => {
    await finishSetup();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {step === 1 && (
            <View>
              <Text style={styles.title}>Keep Your Alarms Reliable</Text>
              <Text style={styles.text}>
                To ensure WakeMeUp can accurately track your location and ring the alarm in the background, we need to adjust some battery settings.
              </Text>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.title}>Disable Battery Restrictions</Text>
              <Text style={styles.text}>
                Please set the battery usage for WakeMeUp to "Unrestricted" or disable battery optimization for it in the settings screen that will open next.
              </Text>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.title}>Enable Autostart</Text>
              <Text style={styles.text}>
                Your device ({Device.manufacturer}) requires you to allow WakeMeUp to run in the background. Please enable "Autostart" or allow background activity in the next screen.
              </Text>
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.title}>Manual Setup Required</Text>
              <Text style={styles.text}>
                We couldn't open the settings automatically. Please open your phone's Settings app, find WakeMeUp, and enable background activity / autostart manually.
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity onPress={skipSetup} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {step === 4 ? 'Done' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  skipText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
