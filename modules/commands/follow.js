/**
 * Follow command - follows a specified Instagram user
 */

module.exports = {
  name: 'follow',
  description: 'Follows a specified Instagram user',
  usage: 'follow <username>',
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
    if (params.length < 1) {
      return { 
        success: false, 
        message: 'Missing parameters. Usage: follow <username>' 
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
        command: 'follow',
        params: params,
        user: user,
        timestamp: new Date()
      });
      
      // Execute the follow
      const result = await bot.instagramClient.followUser(targetUsername);
      return result;
    } catch (error) {
      return { 
        success: false, 
        message: `Error following user: ${error.message}` 
      };
    }
  }
};