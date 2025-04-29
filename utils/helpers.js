/**
 * Common utility helpers
 */

/**
 * Format a timestamp in a human-readable format
 * 
 * @param {Date|string} timestamp - Date object or ISO string 
 * @returns {string} Formatted time string
 */
function formatTime(timestamp) {
  if (!timestamp) return 'Never';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Format: YYYY-MM-DD HH:MM:SS
  return date.toISOString().replace('T', ' ').slice(0, -5);
}

/**
 * Calculate uptime in a human-readable format
 * 
 * @param {Date|string} startTime - The start time
 * @returns {string} Formatted uptime string (e.g., "2d 5h 30m")
 */
function calculateUptime(startTime) {
  if (!startTime) return 'Unknown';
  
  const start = startTime instanceof Date ? startTime : new Date(startTime);
  
  // Check if date is valid
  if (isNaN(start.getTime())) return 'Invalid start time';
  
  const now = new Date();
  const uptimeMs = now.getTime() - start.getTime();
  
  // Calculate days, hours, minutes, seconds
  const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);
  
  // Build the uptime string
  let uptime = '';
  
  if (days > 0) uptime += `${days}d `;
  if (hours > 0 || days > 0) uptime += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) uptime += `${minutes}m `;
  uptime += `${seconds}s`;
  
  return uptime.trim();
}

/**
 * Generate a random ID
 * 
 * @returns {string} Random ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Format an Instagram username (ensure it starts with @)
 * 
 * @param {string} username - Instagram username
 * @returns {string} Formatted username
 */
function formatUsername(username) {
  if (!username) return '';
  
  // Remove @ if present, then add it back
  return '@' + username.replace(/^@/, '');
}

/**
 * Delay execution for a specified time
 * 
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after the delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a string contains any of the keywords
 * 
 * @param {string} text - Text to check
 * @param {string[]} keywords - Keywords to check for
 * @returns {boolean} True if text contains any of the keywords
 */
function containsKeywords(text, keywords) {
  if (!text || !keywords || keywords.length === 0) return false;
  
  text = text.toLowerCase();
  
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Pick a random item from an array
 * 
 * @param {Array} array - Array to pick from
 * @returns {*} Random item from the array
 */
function randomItem(array) {
  if (!array || !Array.isArray(array) || array.length === 0) {
    return null;
  }
  
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Truncate a string to a specified length
 * 
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add after truncation
 * @returns {string} Truncated string
 */
function truncateString(str, maxLength = 100, suffix = '...') {
  if (!str || str.length <= maxLength) return str;
  
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Check if a string is a valid URL
 * 
 * @param {string} str - String to check
 * @returns {boolean} True if string is a valid URL
 */
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Format a number with commas as thousands separators
 * 
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format a date in a human-readable format
 * 
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
function formatDate(date, includeTime = false) {
  if (!date) return 'Never';
  
  const d = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) return 'Invalid date';
  
  // Format date
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return d.toLocaleDateString('en-US', options);
}

/**
 * Sanitize a string for safe display (remove HTML tags, etc.)
 * 
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (!str) return '';
  
  // Replace HTML tags with their entities
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parse command arguments, respecting quoted strings
 * 
 * @param {string} input - Input string to parse
 * @returns {string[]} Array of parsed arguments
 */
function parseArguments(input) {
  if (!input) return [];
  
  const args = [];
  let current = '';
  let inQuotes = false;
  let escapeNext = false;
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    
    if (char === ' ' && !inQuotes) {
      if (current) {
        args.push(current);
        current = '';
      }
      continue;
    }
    
    current += char;
  }
  
  if (current) {
    args.push(current);
  }
  
  return args;
}

module.exports = {
  formatTime,
  calculateUptime,
  generateId,
  formatUsername,
  delay,
  containsKeywords,
  randomItem,
  truncateString,
  isValidUrl,
  formatNumber,
  formatDate,
  sanitizeString,
  parseArguments
};