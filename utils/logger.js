/**
 * Simple logging utility
 */

const fs = require('fs');
const path = require('path');
const { formatTime } = require('./helpers');

// Define log levels
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  success: 2,
  warning: 3,
  error: 4
};

// Log colors for console
const LOG_COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[37m',  // White
  success: '\x1b[32m', // Green
  warning: '\x1b[33m', // Yellow
  error: '\x1b[31m',   // Red
  reset: '\x1b[0m'     // Reset
};

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Current log file
const logFilePath = path.join(logsDir, `bot_${new Date().toISOString().split('T')[0]}.log`);

/**
 * Log a message to console and file
 * 
 * @param {string} message - The message to log
 * @param {string} level - Log level (debug, info, success, warning, error)
 */
function log(message, level = 'info') {
  // Get config to check log level
  let config = { loggingLevel: 'info' };
  try {
    config = require('../config.json');
  } catch (err) {
    // Config file may not exist yet, use default
  }
  
  // Only log if the level is high enough
  const configLevelValue = LOG_LEVELS[config.loggingLevel] || LOG_LEVELS.info;
  const messageLevelValue = LOG_LEVELS[level] || LOG_LEVELS.info;
  
  if (messageLevelValue >= configLevelValue) {
    const timestamp = formatTime(new Date());
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // Log to console with color
    console.log(`${LOG_COLORS[level] || LOG_COLORS.info}${logMessage}${LOG_COLORS.reset}`);
    
    // Log to file
    fs.appendFileSync(logFilePath, logMessage + '\n');
    
    // Emit event (if we had an event system)
    // eventEmitter.emit('log', { level, message, timestamp });
  }
}

module.exports = {
  log
};