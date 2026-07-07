import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dosia.one',
  appName: 'Dosia One',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
  },
};

export default config;
