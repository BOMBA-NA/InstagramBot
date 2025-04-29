/**
 * Status command - shows the current status of the bot
 */

const { formatTime } = require('../../utils/helpers');

module.exports = {
  name: 'status',
  description: 'Shows the current status of the bot',
  usage: 'status',
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
    
    // Basic status info available to all users
    let message = `
Bot status: ${status.isRunning ? 'Running' : 'Stopped'}
Login status: ${status.loginStatus}
${status.isRunning ? `Uptime: ${status.uptime}` : ''}
    `.trim();
    
    // More detailed info for admins
    if (isAdmin) {
      message += `\n\nDetailed information (admin only):
- Last login attempt: ${status.lastLoginAttempt}
- Last activity: ${status.lastActivity}
- Login attempts: ${status.loginAttempts}
- Active automations: ${status.automationCount}
${status.automationCount > 0 ? `- Automated users: ${status.activeAutomations.join(', ')}` : ''}
      `.trim();
      
      // Recent login history
      const history = bot.getLoginHistory(5);
      if (history && history.length > 0) {
        message += '\n\nRecent login events:';
        history.forEach((event, index) => {
          message += `\n${index + 1}. [${formatTime(event.timestamp)}] ${event.status}: ${event.details || event.username}`;
        });
      }
    }
    
    return { success: true, message };
  }
};