/**
 * Search command - searches for Instagram users
 */

module.exports = {
  name: 'search',
  description: 'Searches for Instagram users',
  usage: 'search <query>',
  adminOnly: false,
  
  /**
   * Execute the search command
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
        message: 'Missing parameters. Usage: search <query>' 
      };
    }
    
    const query = params.join(' ');
    
    try {
      // Check if bot is running and logged in to Instagram
      if (!bot.isRunning || !bot.instagramClient || !bot.instagramClient.isLoggedIn) {
        return { success: false, message: 'Bot is not running or not logged in to Instagram.' };
      }
      
      // Emit command execution event
      bot.emit('commandExecuted', {
        command: 'search',
        params: params,
        user: user,
        timestamp: new Date()
      });
      
      // Get the Instagram client
      const instagramClient = bot.instagramClient;
      
      // Perform the search
      const results = await instagramClient.ig.user.search(query);
      
      if (!results || results.length === 0) {
        return { success: true, message: `No users found matching "${query}".` };
      }
      
      // Format the response
      let response = `🔍 Search results for "${query}":\n\n`;
      
      // Limit to top 5 results to avoid too long messages
      const topResults = results.slice(0, 5);
      
      topResults.forEach((result, index) => {
        response += `${index + 1}. @${result.username} - ${result.full_name || 'No name'}\n`;
        
        if (isAdmin) {
          response += `   ID: ${result.pk}\n`;
        }
        
        response += `   Followers: ${result.follower_count}\n`;
        response += `   ${result.is_private ? '🔒 Private' : '🌐 Public'}`;
        response += result.is_verified ? ' ✓ Verified' : '';
        response += '\n\n';
      });
      
      // Add suggestion to get more info
      response += `To get more details about a user, use: profile <username>`;
      
      return { success: true, message: response };
    } catch (error) {
      return { 
        success: false, 
        message: `Error searching for users: ${error.message}` 
      };
    }
  }
};