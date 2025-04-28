/**
 * Command handler for the Instagram bot
 */

const { log } = require('../utils/logger');

class CommandHandler {
  constructor(bot) {
    this.bot = bot;
    this.commands = new Map();
    
    log('Command handler initialized', 'info');
  }
  
  /**
   * Register a command
   * 
   * @param {object} command - Command object to register
   * @returns {boolean} True if registered successfully
   */
  registerCommand(command) {
    if (!command || !command.name) {
      log('Cannot register command: missing name', 'error');
      return false;
    }
    
    this.commands.set(command.name, command);
    log(`Command registered: ${command.name}`, 'debug');
    return true;
  }
  
  /**
   * Get a command by name
   * 
   * @param {string} name - Command name
   * @returns {object|null} The command object or null if not found
   */
  getCommand(name) {
    return this.commands.get(name) || null;
  }
  
  /**
   * Execute a command
   * 
   * @param {string} name - Command name
   * @param {string[]} params - Command parameters
   * @param {string} user - Username of the user executing the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {Promise<object>} Result of the command execution
   */
  async execute(name, params = [], user, isAdmin = false) {
    const command = this.getCommand(name);
    
    if (!command) {
      return { success: false, message: `Unknown command: ${name}` };
    }
    
    if (command.adminOnly && !isAdmin && this.bot.config.bot.adminOnly) {
      return { success: false, message: 'This command requires admin privileges' };
    }
    
    try {
      log(`Executing command: ${name} with params: ${params.join(', ')}`, 'debug');
      
      const result = await command.execute(this.bot, params, user, isAdmin);
      return result || { success: true, message: `Command ${name} executed` };
    } catch (error) {
      log(`Error executing command ${name}: ${error.message}`, 'error');
      return { success: false, message: `Error executing command: ${error.message}` };
    }
  }
  
  /**
   * Get all registered commands
   * 
   * @returns {array} Array of command objects
   */
  getAllCommands() {
    return Array.from(this.commands.values());
  }
  
  /**
   * Parse a command string
   * 
   * @param {string} message - The message to parse
   * @returns {object|null} Parsed command or null if not a command
   */
  parseCommand(message) {
    if (!message || typeof message !== 'string') {
      return null;
    }
    
    const prefix = this.bot.config.bot.prefix;
    
    if (!message.startsWith(prefix)) {
      return null;
    }
    
    // Remove prefix and split into command and parameters
    const parts = message.substring(prefix.length).trim().split(/\s+/);
    const name = parts[0]?.toLowerCase();
    const params = parts.slice(1);
    
    if (!name) {
      return null;
    }
    
    return { name, params };
  }
}

module.exports = CommandHandler;