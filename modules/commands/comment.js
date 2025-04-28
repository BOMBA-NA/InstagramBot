/**
 * Comment command - comments on content from a specified user
 */

const { sendComment } = require('../../utils/sendMessage');

module.exports = {
  name: 'comment',
  description: 'Comments on recent content from a specified Instagram user',
  usage: '!comment <username> <text>',
  examples: '!comment photography_daily Great photo!',
  category: 'action',
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
    if (!bot.isRunning) {
      return { success: false, message: 'Bot is not running. Start the bot first using the !start command.' };
    }
    
    if (params.length < 2) {
      return {
        success: false,
        message: 'Please specify a username and comment text. Usage: !comment <username> <text>'
      };
    }
    
    const username = params[0].replace('@', '');
    const commentText = params.slice(1).join(' ');
    
    try {
      // Check if the profile exists
      const profileExists = await bot.client.checkProfile(username);
      
      if (!profileExists) {
        return { success: false, message: `Profile ${username} does not exist` };
      }
      
      // Send comment using the sendMessage utility
      const result = await sendComment(bot.client, username, commentText);
      
      return result;
    } catch (error) {
      return { success: false, message: `Error commenting: ${error.message}` };
    }
  }
};