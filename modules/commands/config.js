/**
 * Config command - manages bot configuration
 */

module.exports = {
  name: 'config',
  description: 'Views or updates bot configuration',
  usage: 'config [get/set] [key] [value]',
  adminOnly: true,
  
  /**
   * Execute the config command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    // This command is admin-only
    if (!isAdmin) {
      return { success: false, message: 'This command requires admin privileges.' };
    }
    
    // No parameters - show help
    if (params.length === 0) {
      return { 
        success: true, 
        message: `Configuration command usage:
- config get: View all configuration
- config get [key]: View specific configuration
- config set [key] [value]: Update configuration
- config add_admin [username]: Add a new admin user
- config remove_admin [username]: Remove an admin user`
      };
    }
    
    const action = params[0].toLowerCase();
    
    try {
      // Get configuration
      if (action === 'get') {
        const key = params.length > 1 ? params[1] : null;
        
        if (key) {
          // Get specific key
          const value = this.getConfigValue(bot.config, key);
          
          if (value === undefined) {
            return { success: false, message: `Configuration key "${key}" not found.` };
          }
          
          const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value.toString();
          return { success: true, message: `${key}: ${stringValue}` };
        } else {
          // Get all configuration (format as a readable string)
          let response = '📝 Bot Configuration:\n\n';
          
          // Format important config sections
          if (bot.config.instagram) {
            response += '📱 Instagram:\n';
            response += `- Username: ${bot.config.instagram.username}\n`;
            response += `- Password: ${'*'.repeat(8)}\n`;
          }
          
          if (bot.config.bot) {
            response += '\n🤖 Bot Settings:\n';
            response += `- Prefix: ${bot.config.bot.commandPrefix}\n`;
            response += `- Admin-Only Mode: ${bot.config.bot.adminOnly ? 'Enabled' : 'Disabled'}\n`;
          }
          
          if (bot.config.adminUsers && Array.isArray(bot.config.adminUsers)) {
            response += '\n👑 Admin Users:\n';
            if (bot.config.adminUsers.length === 0) {
              response += '- None\n';
            } else {
              bot.config.adminUsers.forEach(admin => {
                response += `- ${admin}\n`;
              });
            }
          }
          
          return { success: true, message: response };
        }
      }
      
      // Set configuration
      else if (action === 'set') {
        if (params.length < 3) {
          return { success: false, message: 'Missing parameters. Usage: config set [key] [value]' };
        }
        
        const key = params[1];
        const value = params.slice(2).join(' ');
        
        // Parse the value to the appropriate type
        let parsedValue;
        if (value.toLowerCase() === 'true') {
          parsedValue = true;
        } else if (value.toLowerCase() === 'false') {
          parsedValue = false;
        } else if (!isNaN(value) && value.trim() !== '') {
          parsedValue = Number(value);
        } else {
          parsedValue = value;
        }
        
        // Update the configuration
        const result = this.setConfigValue(bot.config, key, parsedValue);
        
        if (!result.success) {
          return { success: false, message: result.message };
        }
        
        // Save the updated configuration
        bot.updateConfig(bot.config);
        
        return { success: true, message: `Configuration updated: ${key} = ${parsedValue}` };
      }
      
      // Add admin user
      else if (action === 'add_admin') {
        if (params.length < 2) {
          return { success: false, message: 'Missing username. Usage: config add_admin [username]' };
        }
        
        const username = params[1];
        
        // Ensure adminUsers array exists
        if (!bot.config.adminUsers) {
          bot.config.adminUsers = [];
        }
        
        // Check if user is already an admin
        if (bot.config.adminUsers.includes(username)) {
          return { success: true, message: `${username} is already an admin.` };
        }
        
        // Add the user
        bot.config.adminUsers.push(username);
        
        // Save the updated configuration
        bot.updateConfig(bot.config);
        
        return { success: true, message: `Added ${username} as an admin.` };
      }
      
      // Remove admin user
      else if (action === 'remove_admin') {
        if (params.length < 2) {
          return { success: false, message: 'Missing username. Usage: config remove_admin [username]' };
        }
        
        const username = params[1];
        
        // Ensure adminUsers array exists
        if (!bot.config.adminUsers || !Array.isArray(bot.config.adminUsers)) {
          return { success: false, message: 'No admin users are configured.' };
        }
        
        // Check if user is an admin
        if (!bot.config.adminUsers.includes(username)) {
          return { success: false, message: `${username} is not an admin.` };
        }
        
        // Remove the user
        bot.config.adminUsers = bot.config.adminUsers.filter(admin => admin !== username);
        
        // Save the updated configuration
        bot.updateConfig(bot.config);
        
        return { success: true, message: `Removed ${username} from admins.` };
      }
      
      // Unknown action
      else {
        return { success: false, message: `Unknown action: ${action}` };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error managing configuration: ${error.message}` 
      };
    }
  },
  
  // Helper to get a nested configuration value by key path
  getConfigValue(config, keyPath) {
    const keys = keyPath.split('.');
    let current = config;
    
    for (const key of keys) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  },
  
  // Helper to set a nested configuration value by key path
  setConfigValue(config, keyPath, value) {
    const keys = keyPath.split('.');
    let current = config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      
      if (current[key] === undefined) {
        current[key] = {};
      } else if (typeof current[key] !== 'object') {
        return { success: false, message: `Cannot set property of non-object: ${keys.slice(0, i + 1).join('.')}` };
      }
      
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    
    return { success: true };
  }
};