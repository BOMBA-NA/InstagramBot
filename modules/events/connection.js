/**
 * Connection event handler
 */

const { log } = require('../../utils/logger');

module.exports = {
  name: 'connection',
  description: 'Handles connection-related events',
  
  /**
   * Initialize this event handler
   * 
   * @param {object} bot - The bot instance
   */
  init(bot) {
    // Set up event listeners for this event category
    
    bot.on('started', (eventData) => {
      log('Bot started event received', 'debug');
    });
    
    bot.on('stopped', (eventData) => {
      log('Bot stopped event received', 'debug');
    });
    
    log('Connection event handler initialized', 'debug');
  }
};