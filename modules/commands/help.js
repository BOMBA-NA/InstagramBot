/**
 * Help command - shows list of available commands
 */

module.exports = {
  name: 'help',
  description: 'Shows a list of available commands',
  usage: '!help [command]',
  examples: '!help\n!help follow',
  category: 'general',
  adminOnly: false,
  
  /**
   * Execute the help command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    // If a command name is provided, show help for that command
    if (params.length > 0) {
      const commandName = params[0].toLowerCase();
      const command = bot.commandHandler.getCommand(commandName);
      
      if (!command) {
        return { success: false, message: `Unknown command: ${commandName}` };
      }
      
      // Check if user has permission to use this command
      if (command.adminOnly && !isAdmin && bot.config.bot.adminOnly) {
        return { 
          success: false, 
          message: `You do not have permission to use the ${commandName} command.` 
        };
      }
      
      // Build command help
      let helpText = `Command: ${bot.config.bot.prefix}${command.name}\n`;
      helpText += `Description: ${command.description}\n`;
      
      if (command.usage) {
        helpText += `Usage: ${command.usage}\n`;
      }
      
      if (command.examples) {
        helpText += `Examples:\n${command.examples}\n`;
      }
      
      if (command.adminOnly) {
        helpText += 'Admin only: Yes\n';
      }
      
      return { success: true, message: helpText };
    }
    
    // Otherwise, show list of all commands
    const allCommands = bot.commandHandler.getAllCommands();
    const availableCommands = allCommands.filter(cmd => {
      // Filter out admin commands if user is not an admin
      return !cmd.adminOnly || isAdmin || !bot.config.bot.adminOnly;
    });
    
    // Group commands by category
    const categories = {};
    availableCommands.forEach(cmd => {
      const category = cmd.category || 'uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(cmd);
    });
    
    // Build help message
    let helpText = 'Available commands:\n\n';
    
    for (const [category, commands] of Object.entries(categories)) {
      // Capitalize first letter of category
      const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
      helpText += `${categoryTitle} commands:\n`;
      
      commands.forEach(cmd => {
        helpText += `  ${bot.config.bot.prefix}${cmd.name}: ${cmd.description}`;
        if (cmd.adminOnly) {
          helpText += ' (admin only)';
        }
        helpText += '\n';
      });
      
      helpText += '\n';
    }
    
    helpText += `Use ${bot.config.bot.prefix}help [command] for more details about a specific command.`;
    
    return { success: true, message: helpText };
  }
};