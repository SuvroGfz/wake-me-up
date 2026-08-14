// constants/values.ts

// AsyncStorage Keys
export const ALARMS_KEY = '@location_alarms';
export const ALARM_TRIGGERED_KEY = '@alarm_triggered_map';
export const LOCATION_LOGS_KEY = '@location_logs';
export const ACTIVE_ALARM_KEY = '@active_alarm_id'; // Currently ringing alarm

// Background Task Names
export const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TRACKING';

// Alarm Settings
export const PROXIMITY_THRESHOLD_METERS = 30; // Trigger alarm within 20 meters
export const MIN_DISTANCE_INTERVAL = 10; // Update location every 10 meters
export const LOCATION_UPDATE_INTERVAL = 5000; // Check location every 5 seconds

// Audio Settings
export const DEFAULT_ALARM_TONE = 'alarm1';
export const ALARM_VOLUME = 1.0;

// Notification Settings
export const ALARM_NOTIFICATION_CHANNEL = 'location-alarms';
export const STOP_ALARM_ACTION = 'STOP_ALARM';

export const LOCATION_TRACKING_INTERVAL_MS = 5000;
export const BATTERY_SETUP_COMPLETE_KEY = '@battery_setup_complete';