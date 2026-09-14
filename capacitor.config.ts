import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moviemania.app',
  appName: '영화방랑자',
  webDir: 'public',
  server: {
    url: 'https://moviemania-olive.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#000000',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
      overlaysWebView: false,
    },
  },
};

export default config;
