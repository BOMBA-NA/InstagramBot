/**
 * Automate command - sets up automation for a specified user
 */

module.exports = {
  name: 'automate',
  description: 'Sets up automation for a specified Instagram user',
  usage: 'automate <username> [like] [follow] [comment] [interval_minutes]',
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
    if (params.length < 1) {
      return { 
        success: false, 
        message: 'Missing parameters. Usage: automate <username> [like] [follow] [comment] [interval_minutes]' 
      };
    }
    
    // Extract parameters
    const targetUsername = params[0];
    const actions = [];
    let intervalMinutes = 60; // Default to 60 minutes
    
    // Parse actions and interval
    for (let i = 1; i < params.length; i++) {
      const param = params[i].toLowerCase();
      
      if (param === 'like' || param === 'follow' || param === 'comment') {
        actions.push(param);
      } else if (!isNaN(param)) {
        // If it's a number, treat it as the interval in minutes
        intervalMinutes = parseInt(param);
        if (intervalMinutes < 30) {
          return { 
            success: false, 
            message: 'Interval must be at least 30 minutes to avoid Instagram rate limits' 
          };
        }
      }
    }
    
    // If no actions specified, default to like
    if (actions.length === 0) {
      actions.push('like');
    }
    
    try {
      // First verify the username exists
      const instagramClient = bot.instagramClient;
      if (!instagramClient.isLoggedIn) {
        return { success: false, message: 'Bot is not logged in to Instagram. Start the bot first.' };
      }
      
      // Check if user exists
      const userExists = await instagramClient.checkProfile(targetUsername);
      if (!userExists) {
        return { success: false, message: `Instagram user ${targetUsername} not found` };
      }
      
      // Set up automation
      const result = await bot.startAutomation(targetUsername, {
        actions: actions,
        intervalMinutes: intervalMinutes,
        startedBy: user,
        startTime: new Date()
      });
      
      if (result.success) {
        return { 
          success: true, 
          message: `Automation set up for ${targetUsername}. Actions: ${actions.join(', ')}. Interval: ${intervalMinutes} minutes.`
        };
      } else {
        return {
          success: false,
          message: `Failed to set up automation: ${result.message}`
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error setting up automation: ${error.message}` 
      };
    }
  }
};