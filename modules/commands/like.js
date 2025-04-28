/**
 * Like command - likes content from a specified user
 */

module.exports = {
  name: 'like',
  description: 'Likes recent content from a specified Instagram user',
  usage: '!like <username>',
  examples: '!like photography_daily',
  category: 'action',
  adminOnly: false,
  
  /**
   * Execute the like command
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
        message: 'Please specify an Instagram username to like content from. Usage: !like <username>'
      };
    }
    
    const username = params[0].replace('@', '');
    
    try {
      // Check if the profile exists
      const profileExists = await bot.client.checkProfile(username);
      
      if (!profileExists) {
        return { success: false, message: `Profile ${username} does not exist` };
      }
      
      // Like content
      const result = await bot.client.likeContent(username);
      
      return result;
    } catch (error) {
      return { success: false, message: `Error liking content: ${error.message}` };
    }
  }
};