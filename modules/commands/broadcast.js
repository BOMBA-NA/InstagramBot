/**
 * Broadcast command - sends a message to multiple Instagram users
 */

module.exports = {
  name: 'broadcast',
  description: 'Sends a message to multiple Instagram users',
  usage: 'broadcast <username1,username2,...> <message>',
  adminOnly: true,
  
  /**
   * Execute the broadcast command
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
        message: 'Missing parameters. Usage: broadcast <username1,username2,...> <message>' 
      };
    }
    
    // Parse usernames (comma-separated)
    const usernamesInput = params[0];
    const usernames = usernamesInput.split(',').map(u => u.trim()).filter(u => u.length > 0);
    
    if (usernames.length === 0) {
      return { success: false, message: 'No valid usernames provided.' };
    }
    
    // Get message text (everything after the usernames parameter)
    const messageText = params.slice(1).join(' ');
    
    if (messageText.trim().length === 0) {
      return { success: false, message: 'Message text cannot be empty.' };
    }
    
    try {
      // Check if bot is running and logged in to Instagram
      if (!bot.isRunning || !bot.instagramClient || !bot.instagramClient.isLoggedIn) {
        return { success: false, message: 'Bot is not running or not logged in to Instagram.' };
      }
      
      // Emit command execution event
      bot.emit('commandExecuted', {
        command: 'broadcast',
        params: params,
        user: user,
        timestamp: new Date()
      });
      
      // Send messages with a delay between each to avoid rate limiting
      const results = [];
      let successCount = 0;
      
      for (const username of usernames) {
        try {
          // Send the message
          const result = await bot.instagramClient.sendDirectMessage(username, messageText);
          
          results.push({
            username,
            success: result.success,
            message: result.message
          });
          
          if (result.success) {
            successCount++;
          }
          
          // Add a delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (sendError) {
          results.push({
            username,
            success: false,
            message: sendError.message
          });
        }
      }
      
      // Format response message
      let response = `📣 Broadcast Results:\n\n`;
      response += `✅ Successfully sent to ${successCount} of ${usernames.length} users\n\n`;
      
      // List failures if any
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        response += `❌ Failed to send to:\n`;
        failures.forEach(f => {
          response += `- ${f.username}: ${f.message}\n`;
        });
      }
      
      return { success: successCount > 0, message: response };
    } catch (error) {
      return { 
        success: false, 
        message: `Error broadcasting message: ${error.message}` 
      };
    }
  }
};