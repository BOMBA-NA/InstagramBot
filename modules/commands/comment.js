/**
 * Comment command - comments on content from a specified user
 */

module.exports = {
  name: 'comment',
  description: 'Comments on content from a specified Instagram user',
  usage: 'comment <username> <text>',
  adminOnly: false,
  
  /**
   * Execute the comment command
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
        message: 'Missing parameters. Usage: comment <username> <text>' 
      };
    }
    
    const targetUsername = params[0];
    
    // Get the comment text (everything after the username)
    let commentText = null;
    if (params.length > 1) {
      commentText = params.slice(1).join(' ');
    }
    
    try {
      // Check if bot is running and logged in to Instagram
      if (!bot.isRunning || !bot.instagramClient || !bot.instagramClient.isLoggedIn) {
        return { success: false, message: 'Bot is not running or not logged in to Instagram.' };
      }
      
      // Emit command execution event
      bot.emit('commandExecuted', {
        command: 'comment',
        params: params,
        user: user,
        timestamp: new Date()
      });
      
      // Execute the comment operation
      const result = await bot.instagramClient.commentOnContent(targetUsername, commentText);
      return result;
    } catch (error) {
      return { 
        success: false, 
        message: `Error commenting on content: ${error.message}` 
      };
    }
  }
};