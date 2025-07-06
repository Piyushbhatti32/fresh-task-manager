const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
const { DefinePlugin } = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Customize the config before returning it
  config.plugins = config.plugins.map(plugin => {
    if (plugin.constructor.name === 'DefinePlugin') {
      // Merge our environment variables with the existing ones
      return new DefinePlugin({
        ...plugin.definitions,
        'process.env': {
          ...plugin.definitions['process.env'],
          EXPO_PUBLIC_FIREBASE_API_KEY: JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
          EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
          EXPO_PUBLIC_FIREBASE_PROJECT_ID: JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
          EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
          EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
          EXPO_PUBLIC_FIREBASE_WEB_APP_ID: JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_WEB_APP_ID),
          EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID: JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID),
          EXPO_PUBLIC_FIREBASE_IOS_APP_ID: JSON.stringify(process.env.EXPO_PUBLIC_FIREBASE_IOS_APP_ID)
        }
      });
    }
    return plugin;
  });

  // Update devServer configuration to use stop instead of close
  if (config.devServer) {
    config.devServer.onBeforeSetupMiddleware = (devServer) => {
      if (!devServer) {
        return;
      }
      const originalClose = devServer.close;
      devServer.close = (callback) => {
        devServer.stop().then(() => {
          if (callback) {
            callback();
          }
        });
      };
    };
  }

  return config;
}; 