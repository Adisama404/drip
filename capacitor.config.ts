import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.drip.app',
  appName: 'Drip',
  webDir: 'dist',
  android: { allowMixedContent: false },
  plugins: {
    CapacitorSQLite: { androidIsEncryption: false }
  }
};
export default config;
