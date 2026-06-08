import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.constituencyos.capture',
  appName: 'Mobile Capture',
  webDir: 'dist',
  server: {
    url: 'https://ais-pre-jhbmotevnfmbp5knvxiwem-465097020990.europe-west2.run.app/capture',
    cleartext: true
  }
};

export default config;
