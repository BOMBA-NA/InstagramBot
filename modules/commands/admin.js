/**
 * Admin commands - Manage bot admin users
 */

module.exports = {
  name: 'admin',
  description: 'Manage bot admin users (add, remove, list)',
  usage: 'admin <list|add|remove> [username]',
  examples: [
    'admin list',
    'admin add johndoe',
    'admin remove johndoe'
  ],
  category: 'admin',
  adminOnly: true, // Only admins can use this command (except owner can add first admin)
  
  /**
   * Execute the admin command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    // Allow non-admin owner to add first admin 
    if (!isAdmin && user !== bot.config.bot.owner) {
      return {
        success: false,
        message: '⛔ You do not have permission to use this command.'
      };
    }
    
    // Check for missing parameters
    if (params.length === 0) {
      return {
        success: false,
        message: `⚠️ Missing parameters. Usage: ${bot.config.bot.prefix}${this.usage}`
      };
    }
    
    const action = params[0].toLowerCase();
    
    // Handle different admin actions
    switch (action) {
      case 'list':
        return this.listAdmins(bot);
        
      case 'add':
        if (params.length < 2) {
          return {
            success: false,
            message: '⚠️ Please specify a username to add as admin.'
          };
        }
        
        // Format username (remove @ if present)
        const usernameToAdd = params[1].replace(/^@/, '');
        return this.addAdmin(bot, usernameToAdd);
        
      case 'remove':
        if (params.length < 2) {
          return {
            success: false,
            message: '⚠️ Please specify a username to remove from admins.'
          };
        }
        
        // Format username (remove @ if present)
        const usernameToRemove = params[1].replace(/^@/, '');
        return this.removeAdmin(bot, usernameToRemove, user);
        
      default:
        return {
          success: false,
          message: `⚠️ Unknown admin action '${action}'. Use 'list', 'add', or 'remove'.`
        };
    }
  },
  
  /**
   * List all admin users
   */
  listAdmins(bot) {
    // Get admin list from config
    const admins = bot.config.bot.admins || [];
    const owner = bot.config.bot.owner;
    
    // Build message
    let message = `👑 **Bot Administrators**\n\n`;
    
    // Add owner first
    message += `**Owner:**\n• @${owner}\n\n`;
    
    // Add admins
    message += `**Admins:**\n`;
    
    if (admins.length > 0) {
      admins.forEach(admin => {
        message += `• @${admin}\n`;
      });
    } else {
      message += 'No additional admins configured.\n';
    }
    
    return {
      success: true,
      message
    };
  },
  
  /**
   * Add a new admin user
   */
  addAdmin(bot, username) {
    // Get current admins
    if (!bot.config.bot.admins) {
      bot.config.bot.admins = [];
    }
    
    const admins = bot.config.bot.admins;
    
    // Check if user is already an admin
    if (username === bot.config.bot.owner) {
      return {
        success: false,
        message: `⚠️ @${username} is already the bot owner.`
      };
    }
    
    if (admins.includes(username)) {
      return {
        success: false,
        message: `⚠️ @${username} is already an admin.`
      };
    }
    
    // Add user to admins
    admins.push(username);
    
    // Save config
    bot.updateConfig({
      bot: {
        ...bot.config.bot,
        admins
      }
    });
    
    return {
      success: true,
      message: `✅ @${username} has been added as an admin.`
    };
  },
  
  /**
   * Remove an admin user
   */
  removeAdmin(bot, username, currentUser) {
    // Get current admins
    if (!bot.config.bot.admins) {
      bot.config.bot.admins = [];
    }
    
    const admins = bot.config.bot.admins;
    
    // Check if user is the owner (can't be removed)
    if (username === bot.config.bot.owner) {
      return {
        success: false,
        message: `⚠️ Cannot remove the bot owner.`
      };
    }
    
    // Check if user is trying to remove themselves
    if (username === currentUser && currentUser !== bot.config.bot.owner) {
      return {
        success: false,
        message: `⚠️ You cannot remove yourself as an admin.`
      };
    }
    
    // Check if user is an admin
    if (!admins.includes(username)) {
      return {
        success: false,
        message: `⚠️ @${username} is not an admin.`
      };
    }
    
    // Remove user from admins
    const newAdmins = admins.filter(admin => admin !== username);
    
    // Save config
    bot.updateConfig({
      bot: {
        ...bot.config.bot,
        admins: newAdmins
      }
    });
    
    return {
      success: true,
      message: `✅ @${username} has been removed as an admin.`
    };
  }
};