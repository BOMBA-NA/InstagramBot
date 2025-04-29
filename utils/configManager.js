/**
 * Configuration manager for the Instagram bot
 */

const fs = require('fs');
const path = require('path');
const { log } = require('./logger');

// Path to config file
const CONFIG_FILE = path.join(__dirname, '../config.json');

// Default configuration
const DEFAULT_CONFIG = {
  instagram: {
    username: '',
    password: ''
  },
  bot: {
    prefix: '*',
    owner: '',
    admins: [],
    version: '1.0.0',
    cooldowns: {
      default: 3, // Default cooldown in seconds
      commands: {
        // Command-specific cooldowns
        work: 1800, // 30 minutes
        daily: 86400, // 24 hours
        game: 30
      }
    },
    autoReconnect: true,
    dmPollingInterval: 30000, // 30 seconds
    maxRetries: 3
  },
  economy: {
    startingBalance: 1000,
    dailyReward: 500,
    interestRate: 0.05, // 5% daily interest on bank deposits
    maxLoanAmount: 5000
  },
  features: {
    economy: true,
    games: true,
    adminCommands: true,
    eventLogging: true,
    autoResponder: false
  }
};

/**
 * Load configuration from file, or create default if it doesn't exist
 * 
 * @returns {object} The loaded configuration
 */
function loadConfig() {
  try {
    // Check if config file exists
    if (fs.existsSync(CONFIG_FILE)) {
      // Read config file
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      const userConfig = JSON.parse(configData);
      
      // Merge with default config to ensure all properties exist
      const config = mergeConfig(DEFAULT_CONFIG, userConfig);
      
      log('Configuration loaded successfully', 'success');
      return config;
    } else {
      // Create default config
      log('No configuration file found, creating default', 'warning');
      saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    log(`Error loading configuration: ${error.message}`, 'error');
    
    // Return default config as fallback
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
    // Create config directory if it doesn't exist
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write config to file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    
    log('Configuration saved successfully', 'success');
    return true;
  } catch (error) {
    log(`Error saving configuration: ${error.message}`, 'error');
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
  
  for (const key in userConfig) {
    if (typeof userConfig[key] === 'object' && userConfig[key] !== null && 
        typeof defaultConfig[key] === 'object' && defaultConfig[key] !== null) {
      // Recursively merge nested objects
      result[key] = mergeConfig(defaultConfig[key], userConfig[key]);
    } else {
      // Use user value
      result[key] = userConfig[key];
    }
  }
  
  return result;
}

/**
 * Update specific configuration values
 * 
 * @param {object} newValues - New configuration values
 * @returns {object} Updated configuration
 */
function updateConfig(newValues) {
  // Load current config
  const config = loadConfig();
  
  // Merge new values
  const updatedConfig = mergeConfig(config, newValues);
  
  // Save updated config
  saveConfig(updatedConfig);
  
  return updatedConfig;
}

/**
 * Set a specific configuration value
 * 
 * @param {string} key - Configuration key (dot notation)
 * @param {*} value - New value
 * @returns {object} Updated configuration
 */
function setConfigValue(key, value) {
  // Load current config
  const config = loadConfig();
  
  // Split key path
  const keyPath = key.split('.');
  
  // Set value
  let current = config;
  for (let i = 0; i < keyPath.length - 1; i++) {
    const k = keyPath[i];
    
    if (!current[k]) {
      current[k] = {};
    }
    
    current = current[k];
  }
  
  current[keyPath[keyPath.length - 1]] = value;
  
  // Save updated config
  saveConfig(config);
  
  return config;
}

/**
 * Get a specific configuration value
 * 
 * @param {string} key - Configuration key (dot notation)
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Configuration value
 */
function getConfigValue(key, defaultValue = null) {
  // Load current config
  const config = loadConfig();
  
  // Split key path
  const keyPath = key.split('.');
  
  // Get value
  let current = config;
  for (let i = 0; i < keyPath.length; i++) {
    const k = keyPath[i];
    
    if (!current || !current[k]) {
      return defaultValue;
    }
    
    current = current[k];
  }
  
  return current;
}

/**
 * Get bot prefix from config
 * 
 * @returns {string} Bot command prefix
 */
function getPrefix() {
  return getConfigValue('bot.prefix', '*');
}

/**
 * Get bot owner from config
 * 
 * @returns {string} Bot owner username
 */
function getOwner() {
  return getConfigValue('bot.owner', '');
}

/**
 * Get admin list from config
 * 
 * @returns {Array<string>} List of admin usernames
 */
function getAdmins() {
  return getConfigValue('bot.admins', []);
}

/**
 * Check if a user is a bot admin
 * 
 * @param {string} username - Username to check
 * @returns {boolean} True if user is an admin
 */
function isAdmin(username) {
  if (!username) return false;
  
  // Normalize username
  const normalizedUsername = username.replace(/^@/, '').toLowerCase();
  
  // Check if user is owner
  const owner = getOwner().toLowerCase();
  if (normalizedUsername === owner) {
    return true;
  }
  
  // Check if user is in admin list
  const admins = getAdmins().map(admin => admin.toLowerCase());
  return admins.includes(normalizedUsername);
}

/**
 * Add a user to admin list
 * 
 * @param {string} username - Username to add
 * @returns {boolean} True if added successfully
 */
function addAdmin(username) {
  if (!username) return false;
  
  // Normalize username
  const normalizedUsername = username.replace(/^@/, '');
  
  // Get current admins
  let admins = getAdmins();
  
  // Check if already admin
  if (admins.includes(normalizedUsername)) {
    return false;
  }
  
  // Add to admins
  admins.push(normalizedUsername);
  
  // Update config
  setConfigValue('bot.admins', admins);
  
  return true;
}

/**
 * Remove a user from admin list
 * 
 * @param {string} username - Username to remove
 * @returns {boolean} True if removed successfully
 */
function removeAdmin(username) {
  if (!username) return false;
  
  // Normalize username
  const normalizedUsername = username.replace(/^@/, '');
  
  // Get current admins
  let admins = getAdmins();
  
  // Check if user is in admin list
  if (!admins.includes(normalizedUsername)) {
    return false;
  }
  
  // Remove from admins
  admins = admins.filter(admin => admin !== normalizedUsername);
  
  // Update config
  setConfigValue('bot.admins', admins);
  
  return true;
}

module.exports = {
  loadConfig,
  saveConfig,
  mergeConfig,
  updateConfig,
  setConfigValue,
  getConfigValue,
  getPrefix,
  getOwner,
  getAdmins,
  isAdmin,
  addAdmin,
  removeAdmin
};