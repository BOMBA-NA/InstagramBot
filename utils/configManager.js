/**
 * Configuration manager for the Instagram bot
 */

const fs = require('fs');
const path = require('path');

// Default configuration
const DEFAULT_CONFIG = {
  bot: {
    prefix: '!',
    adminOnly: true,
    rateLimits: {
      likes: 200,
      follows: 50,
      comments: 30
    }
  },
  instagram: {
    username: 'your_instagram_username',
    password: 'your_instagram_password',
    apiTimeout: 30000
  },
  adminUsers: ['admin123'],
  autoReconnect: true,
  loggingLevel: 'info'
};

// Config file path
const CONFIG_FILE_PATH = path.join(__dirname, '../config.json');

/**
 * Load configuration from file, or create default if it doesn't exist
 * 
 * @returns {object} The loaded configuration
 */
function loadConfig() {
  try {
    // Check if config file exists
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      // Create default config file
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
      console.log('Created default configuration file');
      return DEFAULT_CONFIG;
    }
    
    // Read and parse config file
    const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    const config = JSON.parse(configData);
    
    // Merge with default config to ensure all keys exist
    const mergedConfig = mergeConfig(DEFAULT_CONFIG, config);
    
    return mergedConfig;
  } catch (error) {
    console.error(`Error loading config: ${error.message}`);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save configuration to file
 * 
 * @param {object} config - Configuration to save
 * @returns {boolean} True if saved successfully
 */
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving config: ${error.message}`);
    return false;
  }
}

/**
 * Merge two configuration objects, ensuring all keys from default exist
 * 
 * @param {object} defaultConfig - Default configuration
 * @param {object} userConfig - User configuration
 * @returns {object} Merged configuration
 */
function mergeConfig(defaultConfig, userConfig) {
  const result = { ...defaultConfig };
  
  // Recursively merge properties
  for (const key in userConfig) {
    if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
      result[key] = mergeConfig(defaultConfig[key] || {}, userConfig[key]);
    } else {
      result[key] = userConfig[key];
    }
  }
  
  return result;
}

module.exports = {
  loadConfig,
  saveConfig,
  DEFAULT_CONFIG
};