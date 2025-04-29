/**
 * Modern and clean logging utility for Instagram Bot
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Log level configuration
const logLevels = {
  debug: { 
    color: colors.dim + colors.white, 
    icon: '🔍',
    file: true, 
    console: true 
  },
  info: { 
    color: colors.blue, 
    icon: 'ℹ️',
    file: true, 
    console: true 
  },
  success: { 
    color: colors.green, 
    icon: '✅',
    file: true, 
    console: true 
  },
  warning: { 
    color: colors.yellow, 
    icon: '⚠️',
    file: true, 
    console: true 
  },
  error: { 
    color: colors.red, 
    icon: '❌',
    file: true, 
    console: true 
  },
  section: { 
    color: colors.bright + colors.magenta, 
    icon: '📌',
    file: true, 
    console: true 
  }
};

// Logger configuration
const config = {
  logToFile: true,
  logToConsole: true,
  logDirectory: path.join(__dirname, '../logs'),
  maxLogFiles: 7, // Keep logs for one week (rotated daily)
  fileName: 'instagram-bot'
};

// Make sure log directory exists
if (config.logToFile && !fs.existsSync(config.logDirectory)) {
  fs.mkdirSync(config.logDirectory, { recursive: true });
}

/**
 * Log a message to console and file
 * 
 * @param {string} message - The message to log
 * @param {string} level - Log level (debug, info, success, warning, error, section)
 * @param {object} options - Additional logging options
 */
function log(message, level = 'info', options = {}) {
  // Get current time
  const now = new Date();
  const timestamp = now.toISOString();
  const timeStr = timestamp.replace('T', ' ').slice(0, -5);
  
  // Get log level settings
  const logLevel = logLevels[level] || logLevels.info;
  
  // Convert objects and arrays to strings
  if (typeof message !== 'string') {
    message = util.inspect(message, { depth: null, colors: false });
  }
  
  // Add prefix for file log
  const fileLog = `[${timeStr}] [${level.toUpperCase()}] ${message}`;
  
  // Add prefix for console log (with colors)
  const icon = logLevel.icon || '';
  const consoleLog = `${logLevel.color}${icon} [${timeStr}] ${message}${colors.reset}`;
  
  // Log to console if enabled
  if (config.logToConsole && logLevel.console) {
    console.log(consoleLog);
  }
  
  // Log to file if enabled
  if (config.logToFile && logLevel.file) {
    // Generate log file name with date
    const dateStr = now.toISOString().split('T')[0];
    const logFile = path.join(config.logDirectory, `${config.fileName}-${dateStr}.log`);
    
    // Append to log file
    fs.appendFileSync(logFile, fileLog + '\n');
    
    // Rotate logs if needed
    rotateLogFiles();
  }
}

/**
 * Rotate log files, keeping only the most recent ones
 */
function rotateLogFiles() {
  // Only rotate occasionally to avoid excessive disk I/O
  if (Math.random() < 0.01) { // ~1% chance of rotating on each log call
    try {
      const files = fs.readdirSync(config.logDirectory)
        .filter(file => file.startsWith(config.fileName))
        .map(file => {
          const filePath = path.join(config.logDirectory, file);
          const stats = fs.statSync(filePath);
          return { name: file, path: filePath, time: stats.mtime.getTime() };
        })
        .sort((a, b) => b.time - a.time); // Sort newest first
      
      // Delete old files
      if (files.length > config.maxLogFiles) {
        files.slice(config.maxLogFiles).forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (err) {
      // Don't log the error here to avoid recursion
      console.error(`Error rotating log files: ${err.message}`);
    }
  }
}

/**
 * Create a section header in the logs
 * 
 * @param {string} sectionName - The name of the section
 */
function logSection(sectionName) {
  const separator = '═'.repeat(Math.max(0, 50 - sectionName.length - 2));
  log(`╔══ ${sectionName} ${separator}╗`, 'section');
}

module.exports = {
  log,
  logSection
};