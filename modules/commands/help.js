/**
 * Help command - Show available commands and usage information
 */

module.exports = {
  name: 'help',
  aliases: ['commands', 'menu'],
  description: 'Shows help information and available commands',
  usage: 'help [command|category]',
  examples: [
    'help',
    'help daily',
    'help economy'
  ],
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
    const prefix = bot.config.bot.prefix || '*';
    const allCommands = bot.commands.getAllCommands();
    
    // If a specific command or category is requested
    if (params.length > 0) {
      const query = params[0].toLowerCase();
      
      // First, check if it's a command
      const command = bot.commands.getCommand(query);
      
      if (command) {
        return this.showCommandHelp(command, prefix);
      }
      
      // If not a command, check if it's a category
      return this.showCategoryHelp(query, allCommands, prefix, isAdmin);
    }
    
    // Otherwise, show general help
    return this.showGeneralHelp(allCommands, prefix, isAdmin);
  },
  
  /**
   * Show help for a specific command
   * 
   * @param {object} command - Command object
   * @param {string} prefix - Command prefix
   * @returns {object} Command result
   */
  showCommandHelp(command, prefix) {
    let message = `📖 **Command Help: ${command.name}**\n\n`;
    
    // Description
    message += `**Description:**\n${command.description || 'No description available.'}\n\n`;
    
    // Usage
    message += `**Usage:**\n${prefix}${command.usage || command.name}\n\n`;
    
    // Examples
    if (command.examples && command.examples.length > 0) {
      message += `**Examples:**\n`;
      command.examples.forEach(example => {
        message += `• ${prefix}${example}\n`;
      });
      message += '\n';
    }
    
    // Aliases
    if (command.aliases && command.aliases.length > 0) {
      message += `**Aliases:**\n${command.aliases.map(a => `${prefix}${a}`).join(', ')}\n\n`;
    }
    
    // Cooldown
    if (command.cooldown) {
      message += `**Cooldown:** ${command.cooldown} seconds\n\n`;
    }
    
    // Admin only
    if (command.adminOnly) {
      message += `⚠️ This command can only be used by bot administrators.\n`;
    }
    
    return {
      success: true,
      message
    };
  },
  
  /**
   * Show help for a specific category
   * 
   * @param {string} category - Category name
   * @param {Map} allCommands - Map of all commands
   * @param {string} prefix - Command prefix
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  showCategoryHelp(category, allCommands, prefix, isAdmin) {
    // Filter commands by category
    const commands = Array.from(allCommands.values())
      .filter(cmd => {
        // Show admin commands only to admins
        if (cmd.adminOnly && !isAdmin) {
          return false;
        }
        
        // Match category
        return (cmd.category || 'general').toLowerCase() === category.toLowerCase();
      });
    
    if (commands.length === 0) {
      return {
        success: false,
        message: `⚠️ No commands found in category '${category}'.`
      };
    }
    
    // Get category emoji
    const emoji = this.getCategoryEmoji(category);
    
    let message = `${emoji} **${this.formatCategoryName(category)} Commands**\n\n`;
    
    // List commands
    commands.forEach(cmd => {
      message += `• **${prefix}${cmd.name}** - ${cmd.description || 'No description'}\n`;
    });
    
    message += `\nType \`${prefix}help <command>\` for detailed information about a specific command.`;
    
    return {
      success: true,
      message
    };
  },
  
  /**
   * Show general help with categories
   * 
   * @param {Map} allCommands - Map of all commands
   * @param {string} prefix - Command prefix
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  showGeneralHelp(allCommands, prefix, isAdmin) {
    // Group commands by category
    const categories = {};
    
    Array.from(allCommands.values()).forEach(cmd => {
      // Skip admin commands for non-admins
      if (cmd.adminOnly && !isAdmin) {
        return;
      }
      
      const category = cmd.category || 'general';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(cmd);
    });
    
    let message = `🤖 **Instagram Bot Help**\n\n`;
    
    // Categories overview
    message += `**Available Categories:**\n`;
    
    const sortedCategories = Object.keys(categories).sort((a, b) => {
      // Put 'general' category first
      if (a.toLowerCase() === 'general') return -1;
      if (b.toLowerCase() === 'general') return 1;
      return a.localeCompare(b);
    });
    
    sortedCategories.forEach(category => {
      const emoji = this.getCategoryEmoji(category);
      const formattedName = this.formatCategoryName(category);
      message += `• ${emoji} **${formattedName}** - ${categories[category].length} commands\n`;
    });
    
    message += `\nUse \`${prefix}help <category>\` to see commands in a specific category.`;
    message += `\nUse \`${prefix}help <command>\` for detailed information about a specific command.`;
    
    return {
      success: true,
      message
    };
  },
  
  /**
   * Get emoji for a command category
   * 
   * @param {string} category - Category name
   * @returns {string} Emoji for the category
   */
  getCategoryEmoji(category) {
    const categoryEmojis = {
      'general': '🔷',
      'economy': '💰',
      'games': '🎮',
      'social': '📱',
      'admin': '⚙️',
      'utility': '🔧'
    };
    
    return categoryEmojis[category.toLowerCase()] || '📋';
  },
  
  /**
   * Format category name for display
   * 
   * @param {string} category - Category name
   * @returns {string} Formatted category name
   */
  formatCategoryName(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
};