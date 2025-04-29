/**
 * Stop-automate command - stops automation for a specified user
 */

module.exports = {
  name: 'stop-automate',
  description: 'Stops automation for a specified Instagram user',
  usage: 'stop-automate <username>',
  adminOnly: true,
  
  /**
   * Execute the stop-automate command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    // Check if username parameter is provided
    if (params.length < 1) {
      // If no username is provided, show a list of active automations
      const activeAutomations = bot.getActiveAutomations();
      
      if (activeAutomations.length === 0) {
        return { success: true, message: 'No active automations.' };
      }
      
      let message = 'Active automations:\n';
      activeAutomations.forEach((automation, index) => {
        message += `${index + 1}. @${automation.username} - Actions: ${automation.actions.join(', ')} - Interval: ${automation.intervalMinutes} minutes\n`;
      });
      
      message += '\nTo stop an automation, use: stop-automate <username>';
      
      return { success: true, message };
    }
    
    const targetUsername = params[0];
    
    try {
      // Stop the automation for the specified user
      const result = bot.stopAutomation(targetUsername);
      
      if (result.success) {
        return { 
          success: true, 
          message: `Automation stopped for ${targetUsername}.`
        };
      } else {
        return {
          success: false,
          message: `No active automation found for ${targetUsername}.`
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error stopping automation: ${error.message}` 
      };
    }
  }
};