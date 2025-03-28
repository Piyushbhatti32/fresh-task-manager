// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add file extensions for databases
config.resolver.assetExts.push('db', 'sqlite');

module.exports = config; 