import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // Log the environment variables to verify they're being loaded
  console.log('Environment variables:', {
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    googleRedirectUri: process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI,
  });

  return {
    ...config,
    name: config.name ?? 'fresh-task-manager',
    slug: config.slug ?? 'fresh-task-manager',
    version: config.version ?? '1.0.0',
    scheme: 'freshtaskmanager',
    extra: {
      ...config.extra,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      googleRedirectUri: process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI,
    },
  };
}; 