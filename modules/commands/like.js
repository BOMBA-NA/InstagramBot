/**
 * Like command - likes content from a specified user
 */

module.exports = {
  name: 'like',
  description: 'Likes content from a specified Instagram user',
  usage: 'like <username>',
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
    if (params.length < 1) {
      return { 
        success: false, 
        message: 'Missing parameters. Usage: like <username>' 
      };
    }
    
    const targetUsername = params[0];
    
    try {
      // Check if bot is running and logged in to Instagram
      if (!bot.isRunning || !bot.instagramClient || !bot.instagramClient.isLoggedIn) {
        return { success: false, message: 'Bot is not running or not logged in to Instagram.' };
      }
      
      // Emit command execution event
      bot.emit('commandExecuted', {
        command: 'like',
        params: params,
        user: user,
        timestamp: new Date()
      });
      
      // Execute the like operation
      const result = await bot.instagramClient.likeContent(targetUsername);
      return result;
    } catch (error) {
      return { 
        success: false, 
        message: `Error liking content: ${error.message}` 
      };
    }
  }
};