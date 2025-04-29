/**
 * BotInfo command - shows information about the bot
 */

module.exports = {
  name: 'botinfo',
  description: 'Shows information about the bot',
  usage: 'botinfo',
  adminOnly: false,
  
  /**
   * Execute the botinfo command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    try {
      // Check if bot is running
      if (!bot.isRunning) {
        return { success: false, message: 'Bot is not running.' };
      }
      
      // Emit command execution event
      bot.emit('commandExecuted', {
        command: 'botinfo',
        params: params,
        user: user,
        timestamp: new Date()
      });
      
      // Get bot status
      const status = bot.getStatus();
      
      // Format the response
      let response = `🤖 Instagram Bot Information\n\n`;
      
      response += `⚙️ Status:\n`;
      response += `- Running: ${status.isRunning ? '✅ Yes' : '❌ No'}\n`;
      response += `- Instagram: ${status.loginStatus}\n`;
      response += `- Uptime: ${status.uptime}\n`;
      
      // Get command info
      const commandHandler = bot.commandHandler;
      const commands = commandHandler.getAllCommands();
      
      // Filter commands based on user permissions
      const accessibleCommands = commands.filter(cmd => isAdmin || !cmd.adminOnly);
      
      response += `\n📋 Commands: ${accessibleCommands.length} available\n`;
      
      // Show automation info
      response += `\n⚡ Automation:\n`;
      response += `- Active tasks: ${status.automationCount}\n`;
      
      if (status.automationCount > 0) {
        response += `- Targets: ${status.activeAutomations.join(', ')}\n`;
      }
      
      // Add additional admin info
      if (isAdmin) {
        response += `\n👑 Admin Information:\n`;
        response += `- Last Login Attempt: ${status.lastLoginAttempt}\n`;
        response += `- Last Activity: ${status.lastActivity}\n`;
        response += `- Login Attempts: ${status.loginAttempts}\n`;
        
        // Show version information
        const packageInfo = require('../../package.json');
        if (packageInfo && packageInfo.version) {
          response += `- Version: ${packageInfo.version}\n`;
        }
        
        // Show API information
        try {
          const apiStatus = await bot.client.testConnection();
          if (apiStatus.success && apiStatus.user) {
            response += `- API User: ${apiStatus.user.username}\n`;
            response += `- Followers: ${apiStatus.user.followerCount}\n`;
            response += `- Following: ${apiStatus.user.followingCount}\n`;
          }
        } catch (apiError) {
          // If API info fails, just skip it
        }
      }
      
      // Add a footer message
      response += `\nType *help to see available commands.`;
      
      return { success: true, message: response };
    } catch (error) {
      return { 
        success: false, 
        message: `Error getting bot information: ${error.message}` 
      };
    }
  }
};