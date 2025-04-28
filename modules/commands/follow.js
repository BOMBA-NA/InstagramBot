/**
 * Follow command - follows a specified Instagram user
 */

module.exports = {
  name: 'follow',
  description: 'Follows a specified Instagram user',
  usage: '!follow <username>',
  examples: '!follow photography_daily',
  category: 'action',
  adminOnly: false,
  
  /**
   * Execute the follow command
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
        message: 'Please specify an Instagram username to follow. Usage: !follow <username>'
      };
    }
    
    const username = params[0].replace('@', '');
    
    try {
      // Check if the profile exists
      const profileExists = await bot.client.checkProfile(username);
      
      if (!profileExists) {
        return { success: false, message: `Profile ${username} does not exist` };
      }
      
      // Follow user
      const result = await bot.client.followUser(username);
      
      return result;
    } catch (error) {
      return { success: false, message: `Error following user: ${error.message}` };
    }
  }
};