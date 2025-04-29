/**
 * Prefix command - Change bot command prefix
 * Special command that can be used without a prefix
 */

const { log } = require('../../utils/logger');

module.exports = {
  name: 'prefix',
  description: 'Change bot command prefix (can be used without a prefix)',
  usage: 'prefix <new_prefix>',
  examples: [
    'prefix !',
    'prefix .'
  ],
  category: 'admin',
  adminOnly: true,
  
  /**
   * Execute the prefix command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    if (params.length === 0) {
      return {
        success: false,
        message: `⚠️ Missing parameter. Usage: \`${bot.config.bot.prefix}${this.usage}\`` +
                 `\n\nCurrent prefix: \`${bot.config.bot.prefix}\``
      };
    }
    
    const newPrefix = params[0];
    
    // Validate prefix
    if (newPrefix.length > 3) {
      return {
        success: false,
        message: `⚠️ Prefix must be 1-3 characters long.`
      };
    }
    
    // Update config
    const oldPrefix = bot.config.bot.prefix;
    bot.config.bot.prefix = newPrefix;
    
    // Save configuration
    const result = bot.updateConfig(bot.config);
    
    if (result.success) {
      log(`Changed command prefix from '${oldPrefix}' to '${newPrefix}'`, 'info');
      return {
        success: true,
        message: `✅ Successfully changed command prefix to \`${newPrefix}\`\n\n` +
                 `Example: ${newPrefix}help`
      };
    } else {
      return {
        success: false,
        message: `❌ Failed to change prefix: ${result.message}`
      };
    }
  }
};