const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Custom Expo Config Plugin to enable full-screen alarm intents.
 * Sets showWhenLocked and turnScreenOn on MainActivity so the alarm UI
 * can appear over the lock screen when a full-screen notification fires.
 */
module.exports = function withFullScreenIntent(config) {
    return withAndroidManifest(config, (config) => {
        const androidManifest = config.modResults.manifest;
        const mainActivity = androidManifest.application[0].activity.find(
            (a) => a.$['android:name'] === '.MainActivity'
        );
        if (mainActivity) {
            mainActivity.$['android:showWhenLocked'] = 'true';
            mainActivity.$['android:turnScreenOn'] = 'true';
        }
        return config;
    });
};
