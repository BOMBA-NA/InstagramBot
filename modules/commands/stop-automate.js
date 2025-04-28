/**
 * Stop-automate command - stops automation for a specified user
 */

module.exports = {
  name: 'stop-automate',
  description: 'Stops automation tasks for a specified Instagram user',
  usage: '!stop-automate <username>',
  examples: '!stop-automate photography_daily',
  category: 'automation',
  adminOnly: true,
  
  /**
   * Execute the stop-automate command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    if (!bot.isRunning) {
      return { success: false, message: 'Bot is not running. Start the bot first using the !start command.' };
    }
    
    if (params.length === 0) {
      return {
        success: false,
        message: 'Please specify an Instagram username to stop automation for. Usage: !stop-automate <username>'
      };
    }
    
    const username = params[0].replace('@', '');
    
    try {
      // Stop automation
      const result = bot.stopAutomation(username);
      
      return result;
    } catch (error) {
      return { success: false, message: `Error stopping automation: ${error.message}` };
    }
  }
};