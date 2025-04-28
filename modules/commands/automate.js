/**
 * Automate command - sets up automation for a specified user
 */

module.exports = {
  name: 'automate',
  description: 'Sets up automation tasks for a specified Instagram user',
  usage: '!automate <username> <actions>',
  examples: '!automate photography_daily like,follow\n!automate travel_pics like,comment',
  category: 'automation',
  adminOnly: true,
  
  /**
   * Execute the automate command
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
        message: 'Please specify a username and actions to automate. Usage: !automate <username> <actions>\nAvailable actions: like, follow, comment'
      };
    }
    
    const username = params[0].replace('@', '');
    const actionsParam = params[1].toLowerCase();
    
    // Parse actions
    const actions = actionsParam.split(',').map(action => action.trim());
    
    // Validate actions
    const validActions = ['like', 'follow', 'comment'];
    const invalidActions = actions.filter(action => !validActions.includes(action));
    
    if (invalidActions.length > 0) {
      return {
        success: false,
        message: `Invalid actions: ${invalidActions.join(', ')}. Available actions: ${validActions.join(', ')}`
      };
    }
    
    try {
      // Check if the profile exists
      const profileExists = await bot.client.checkProfile(username);
      
      if (!profileExists) {
        return { success: false, message: `Profile ${username} does not exist` };
      }
      
      // Start automation
      const result = await bot.startAutomation(username, actions);
      
      return result;
    } catch (error) {
      return { success: false, message: `Error setting up automation: ${error.message}` };
    }
  }
};