/**
 * Status command - shows the current status of the bot
 */

const { calculateUptime } = require('../../utils/helpers');

module.exports = {
  name: 'status',
  description: 'Shows the current status of the bot',
  usage: '!status',
  examples: '!status',
  category: 'general',
  adminOnly: false,
  
  /**
   * Execute the status command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    const status = bot.getStatus();
    
    let message = '';
    
    message += `Status: ${status.isRunning ? 'Running' : 'Stopped'}\n`;
    
    if (status.isRunning) {
      const uptime = calculateUptime(bot.startTime);
      message += `Uptime: ${uptime}\n`;
    }
    
    message += `Prefix: ${bot.config.bot.prefix}\n`;
    message += `Admin mode: ${bot.config.bot.adminOnly ? 'Enabled' : 'Disabled'}\n`;
    
    if (isAdmin || !bot.config.bot.adminOnly) {
      message += `Rate limits:\n`;
      message += `  - Likes: ${bot.config.bot.rateLimits.likes} per hour\n`;
      message += `  - Follows: ${bot.config.bot.rateLimits.follows} per hour\n`;
      message += `  - Comments: ${bot.config.bot.rateLimits.comments} per hour\n`;
      
      message += `Active automations: ${status.automationCount}\n`;
      
      if (status.automationCount > 0) {
        message += 'Automated usernames:\n';
        status.activeAutomations.forEach(username => {
          message += `  - ${username}\n`;
        });
      }
    }
    
    return { success: true, message };
  }
};