/**
 * Start command - starts the Instagram bot
 */

module.exports = {
  name: 'start',
  description: 'Starts the Instagram bot',
  usage: 'start',
  adminOnly: true,
  
  /**
   * Execute the start command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    if (bot.isRunning) {
      return { success: false, message: 'Bot is already running.' };
    }
    
    try {
      const result = await bot.start();
      return result;
    } catch (error) {
      return { success: false, message: `Failed to start bot: ${error.message}` };
    }
  }
};