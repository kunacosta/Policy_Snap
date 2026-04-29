import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.onyxxtech.policysnap',
  appName: 'PolicySnap',
  webDir: 'out',
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
  },
};

export default config;
