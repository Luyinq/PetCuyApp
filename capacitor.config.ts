import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'PetCuy',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      iconColor: "#488AFF",
      smallIcon: 'res://drawable/petcuyicon',
    },
    Config: {
      screenOrientation: 'portrait',
      keyboardResize: false
    },
    Keyboard: {
      resize: KeyboardResize.None
    },
    android: {
      path: 'android',
      appId: 'io.ionic.starter',
    },
  },
};

export default config;
