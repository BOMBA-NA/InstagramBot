/**
 * Message command - sends a direct message to a user
 */

module.exports = {
  name: 'message',
  description: 'Sends a direct message to an Instagram user',
  usage: 'message <username> <text>',
  adminOnly: true, // Only admins can send messages through the bot
  
  /**
   * Execute the message command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    // Check parameters
    if (params.length < 2) {
      return { 
        success: false, 
        message: 'Missing parameters. Usage: message <username> <text>' 
      };
    }
    
    const targetUsername = params[0];
    const messageText = params.slice(1).join(' ');
    
    try {
      // Check if bot is running and logged in to Instagram
      if (!bot.isRunning || !bot.instagramClient || !bot.instagramClient.isLoggedIn) {
        return { success: false, message: 'Bot is not running or not logged in to Instagram.' };
      }
      
      // Emit command execution event
      bot.emit('commandExecuted', {
        command: 'message',
        params: params,
        user: user,
        timestamp: new Date()
      });
      
      // Send the message
      const result = await bot.instagramClient.sendDirectMessage(targetUsername, messageText);
      
      if (result.success) {
        return { success: true, message: `Message sent to ${targetUsername}` };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error sending message: ${error.message}` 
      };
    }
  }
};