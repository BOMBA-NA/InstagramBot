/**
 * Profile command - gets information about an Instagram user profile
 */

module.exports = {
  name: 'profile',
  description: 'Gets information about an Instagram user profile',
  usage: 'profile <username>',
  adminOnly: false,
  
  /**
   * Execute the profile command
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
        message: 'Missing parameters. Usage: profile <username>' 
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
        command: 'profile',
        params: params,
        user: user,
        timestamp: new Date()
      });
      
      // Clean up username (remove @ if present)
      let username = targetUsername;
      if (username.startsWith('@')) {
        username = username.substring(1);
      }
      
      // Get the Instagram client
      const instagramClient = bot.instagramClient;
      
      // First check if profile exists
      const profileExists = await instagramClient.checkProfile(username);
      if (!profileExists) {
        return { success: false, message: `Profile ${username} does not exist` };
      }
      
      // Get user ID from cache
      const userId = instagramClient.userIdCache[username];
      if (!userId) {
        return { success: false, message: `Could not retrieve user ID for ${username}` };
      }
      
      // Get user info
      const userInfo = await instagramClient.ig.user.info(userId);
      
      // Format the response
      let response = `📱 Instagram Profile: @${userInfo.username}\n\n`;
      response += `👤 Name: ${userInfo.full_name || 'Not available'}\n`;
      response += `✍️ Bio: ${userInfo.biography ? userInfo.biography.slice(0, 100) + (userInfo.biography.length > 100 ? '...' : '') : 'No bio'}\n\n`;
      response += `📊 Stats:\n`;
      response += `- Posts: ${userInfo.media_count}\n`;
      response += `- Followers: ${userInfo.follower_count}\n`;
      response += `- Following: ${userInfo.following_count}\n\n`;
      response += `🔒 Private Account: ${userInfo.is_private ? 'Yes' : 'No'}\n`;
      response += `✓ Verified: ${userInfo.is_verified ? 'Yes' : 'No'}\n`;
      
      // Add extra details for admins
      if (isAdmin) {
        response += `\n👑 Admin details:\n`;
        response += `- User ID: ${userInfo.pk}\n`;
        response += `- Business Account: ${userInfo.is_business ? 'Yes' : 'No'}\n`;
        
        if (userInfo.is_business && userInfo.category) {
          response += `- Category: ${userInfo.category}\n`;
        }
      }
      
      return { success: true, message: response };
    } catch (error) {
      return { 
        success: false, 
        message: `Error getting profile information: ${error.message}` 
      };
    }
  }
};