export default {
  expo: {
    name: 'Agent OnBoard',
    slug: 'agent-onboard',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0a1628',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.auwiretech.agentonboard',
      infoPlist: {
        NSCameraUsageDescription:
          'Agent OnBoard needs camera access to scan boarding pass QR codes at the gate.',
        NSPhotoLibraryUsageDescription:
          'Agent OnBoard needs photo library access to save your boarding pass.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0a1628',
      },
      permissions: ['CAMERA', 'NOTIFICATIONS'],
      package: 'com.auwiretech.agentonboard',
    },
    plugins: [
      [
        'expo-camera',
        {
          cameraPermission:
            'Agent OnBoard needs camera access to scan boarding pass QR codes at the gate.',
        },
      ],
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#0a1628',
        },
      ],
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      appUrl: process.env.EXPO_PUBLIC_APP_URL,
      eas: {
        projectId: '1a807623-738a-45bb-af9a-c115a5ecd38b',
      },
    },
  },
};
