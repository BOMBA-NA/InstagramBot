/**
 * Template command - Use this as a starting point for your own commands
 * 
 * To create a new command:
 * 1. Copy this file
 * 2. Rename it to yourcommandname.js
 * 3. Modify the properties and execute function as needed
 * 4. Place it in the modules/commands directory
 */

module.exports = {
  // COMMAND PROPERTIES (Change these for your command)
  
  // Command name (required) - This is what users will type after the prefix
  name: 'template',
  
  // Command aliases (optional) - Alternative names for the command
  aliases: ['sample', 'example'],
  
  // Command description - Explain what your command does
  description: 'A template command to use as a starting point',
  
  // Usage information - Format: 'commandname <required_param> [optional_param]'
  usage: 'template [parameter]',
  
  // Example usages - Provide working examples
  examples: [
    'template',
    'template hello'
  ],
  
  // Command category - For organization in help menu (e.g., 'general', 'economy', 'games', 'admin', 'utility')
  category: 'utility',
  
  // Admin only flag - Set to true if only admins should use this command
  adminOnly: false,
  
  // Cooldown in seconds (optional) - Minimum time between command uses per user
  cooldown: 5,
  
  // COMMAND EXECUTION FUNCTION (Required)
  
  /**
   * Execute the command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - Username who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result with success status and message
   */
  async execute(bot, params, user, isAdmin) {
    // Get parameters (if any)
    const parameter = params.length > 0 ? params.join(' ') : 'no parameter provided';
    
    // Log command execution (optional but recommended)
    // This will appear in the console and log files
    // const { log } = require('../../utils/logger');
    // log(`Template command executed by ${user} with parameter: ${parameter}`, 'info');
    
    // Access bot configuration if needed
    // const prefix = bot.config.bot.prefix;
    
    // Access user economy data if needed
    // const { getUserEconomy } = require('../../utils/userManager');
    // const economy = getUserEconomy(user);
    
    // Example: Update user balance (for economy commands)
    // const { updateBalance } = require('../../utils/userManager');
    // updateBalance(user, 100, 'Template command reward');
    
    // Example: Use helper functions
    // const { randomItem } = require('../../utils/helpers');
    // const items = ['apple', 'banana', 'orange'];
    // const randomFruit = randomItem(items);
    
    // Create a response message
    let message = `✨ **Template Command**\n\n`;
    message += `Hello, @${user}!\n`;
    message += `You ran the template command with: ${parameter}\n\n`;
    
    if (isAdmin) {
      message += `You have admin privileges for this bot.\n`;
    }
    
    message += `This is where your command's main output would go.`;
    
    // Return the result
    // success: true/false - Whether the command executed successfully
    // message: string - The response message to send back to the user
    return {
      success: true,
      message: message
      
      // You can include additional data in the result if needed
      // This won't be sent to the user but can be used internally
      // data: {
      //   someValue: 123,
      //   someOtherValue: 'abc'
      // }
    };
    
    // Example error response:
    // return {
    //   success: false,
    //   message: '⚠️ Something went wrong: [error details]'
    // };
  }
};