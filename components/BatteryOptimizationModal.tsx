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
              <Text style={styles.title}>⚡ Important Setup</Text>
              <Text style={styles.text}>
                WakeMeUp needs to run in the background to track your location and ring alarms. Without this, Android may kill the app and your alarms won't work.
              </Text>
              <Text style={styles.stepLabel}>We'll guide you through 2 quick steps:</Text>
              <View style={styles.stepList}>
                <Text style={styles.stepItem}>1️⃣  Turn off battery optimization</Text>
                <Text style={styles.stepItem}>2️⃣  Allow background activity</Text>
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.title}>Step 1: Battery Optimization</Text>
              <Text style={styles.text}>
                A system dialog will appear. Follow these steps:
              </Text>
              <View style={styles.instructionBox}>
                <Text style={styles.instructionStep}>👆 Tap <Text style={styles.bold}>"Allow"</Text></Text>
                <Text style={styles.instructionNote}>
                  This lets WakeMeUp run without Android killing it to save battery.
                </Text>
              </View>
              <Text style={styles.warningText}>
                ⚠️ If you see "Not optimized" or "Unrestricted" — that's already correct, just close the dialog.
              </Text>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.title}>Step 2: Allow Background Activity</Text>
              <Text style={styles.text}>
                Your {Device.manufacturer} phone has extra battery restrictions. A settings page will open.
              </Text>
              <View style={styles.instructionBox}>
                <Text style={styles.instructionStep}>
                  📱 Look for and <Text style={styles.bold}>enable</Text> any of these:
                </Text>
                <Text style={styles.instructionBullet}>• "Allow background activity" → Turn <Text style={styles.bold}>ON</Text></Text>
                <Text style={styles.instructionBullet}>• "Auto-launch" / "Autostart" → Turn <Text style={styles.bold}>ON</Text></Text>
                <Text style={styles.instructionBullet}>• Battery usage → Select <Text style={styles.bold}>"Don't optimize"</Text> or <Text style={styles.bold}>"No restrictions"</Text></Text>
              </View>
              <Text style={styles.warningText}>
                ⚠️ After changing settings, come back to WakeMeUp and tap "Done".
              </Text>
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.title}>⚙️ Manual Setup Required</Text>
              <Text style={styles.text}>
                We couldn't open the settings automatically. Please do this manually:
              </Text>
              <View style={styles.instructionBox}>
                <Text style={styles.instructionStep}>1. Open your phone's <Text style={styles.bold}>Settings</Text> app</Text>
                <Text style={styles.instructionStep}>2. Go to <Text style={styles.bold}>Apps → WakeMeUp</Text></Text>
                <Text style={styles.instructionStep}>3. Tap <Text style={styles.bold}>Battery</Text></Text>
                <Text style={styles.instructionStep}>4. Select <Text style={styles.bold}>"Unrestricted"</Text> or <Text style={styles.bold}>"Don't optimize"</Text></Text>
              </View>
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
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  stepList: {
    marginBottom: 8,
  },
  stepItem: {
    fontSize: 15,
    color: '#1f2937',
    paddingVertical: 4,
    fontWeight: '500',
  },
  instructionBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  instructionStep: {
    fontSize: 15,
    color: '#1e40af',
    marginBottom: 6,
    lineHeight: 22,
  },
  instructionNote: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },
  instructionBullet: {
    fontSize: 14,
    color: '#334155',
    paddingLeft: 8,
    marginBottom: 4,
    lineHeight: 20,
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    lineHeight: 18,
    marginBottom: 16,
  },
  bold: {
    fontWeight: '800',
    color: '#0f172a',
  },
});
