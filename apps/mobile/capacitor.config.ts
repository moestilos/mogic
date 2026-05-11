import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'gg.mogic.app',
  appName: 'Mogic',
  webDir: 'www',
  ios: {
    contentInset: 'always',
    backgroundColor: '#0A0A0F',
  },
  android: {
    backgroundColor: '#0A0A0F',
  },
  plugins: {
    StatusBar: { style: 'DARK', backgroundColor: '#0A0A0F' },
    Keyboard: { resize: 'body' },
  },
};

export default config;
