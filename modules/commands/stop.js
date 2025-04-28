/**
 * Stop command - stops the Instagram bot
 */

module.exports = {
  name: 'stop',
  description: 'Stops the Instagram bot',
  usage: '!stop',
  examples: '!stop',
  category: 'admin',
  adminOnly: true,
  
  /**
   * Execute the stop command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    if (!bot.isRunning) {
      return { success: false, message: 'Bot is not running' };
    }
    
    const result = await bot.stop();
    return result;
  }
};