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
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toISOString().replace('T', ' ').substr(0, 19);
}

/**
 * Calculate uptime in a human-readable format
 * 
 * @param {Date|string} startTime - The start time
 * @returns {string} Formatted uptime string (e.g., "2d 5h 30m")
 */
function calculateUptime(startTime) {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${days}d ${hours}h ${minutes}m`;
}

/**
 * Generate a random ID
 * 
 * @returns {string} Random ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Format an Instagram username (ensure it starts with @)
 * 
 * @param {string} username - Instagram username
 * @returns {string} Formatted username
 */
function formatUsername(username) {
  if (!username) return '';
  return username.startsWith('@') ? username : `@${username}`;
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
  if (!text || !keywords || !keywords.length) return false;
  
  text = text.toLowerCase();
  return keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

/**
 * Pick a random item from an array
 * 
 * @param {Array} array - Array to pick from
 * @returns {*} Random item from the array
 */
function randomItem(array) {
  if (!array || !array.length) return null;
  return array[Math.floor(Math.random() * array.length)];
}

module.exports = {
  formatTime,
  calculateUptime,
  generateId,
  formatUsername,
  delay,
  containsKeywords,
  randomItem
};