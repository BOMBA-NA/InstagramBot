/**
 * Command event handler
 */

const { log } = require('../../utils/logger');

module.exports = {
  name: 'command',
  description: 'Handles command-related events',
  
  /**
   * Initialize this event handler
   * 
   * @param {object} bot - The bot instance
   */
  init(bot) {
    // Set up event listeners for this event category
    
    bot.on('commandExecuted', (eventData) => {
      log(`Command executed: ${eventData.target} by ${eventData.user} (${eventData.status})`, 'debug');
      
      // You could add command-specific logic here
      if (eventData.status === 'failed') {
        // Handle failed commands, maybe log them or alert an admin
        log(`Command failed: ${eventData.target} - ${eventData.details}`, 'warning');
      }
    });
    
    log('Command event handler initialized', 'debug');
  }
};