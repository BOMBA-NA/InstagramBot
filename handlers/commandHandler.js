/**
 * Command handler for the Instagram bot
 */

const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger');
const { parseArguments } = require('../utils/helpers');
const { incrementCommandUsage } = require('../utils/userManager');

class CommandHandler {
  constructor(bot) {
    this.bot = bot;
    this.commands = new Map();
    this.aliases = new Map();
    this.cooldowns = new Map();
    this.commandStats = {};
  }
  
  /**
   * Load all commands from the modules/commands directory
   */
  loadCommands() {
    // Clear existing commands
    this.commands.clear();
    this.aliases.clear();
    
    // Get command directory path
    const commandsPath = path.join(__dirname, '../modules/commands');
    
    // Check if directory exists
    if (!fs.existsSync(commandsPath)) {
      log(`Commands directory not found: ${commandsPath}`, 'error');
      return;
    }
    
    // Get all command files
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    if (commandFiles.length === 0) {
      log('No command files found', 'warning');
      return;
    }
    
    log(`Loading ${commandFiles.length} commands...`, 'section');
    
    for (const file of commandFiles) {
      try {
        // Clear require cache
        delete require.cache[require.resolve(`../modules/commands/${file}`)];
        
        // Load command module
        const command = require(`../modules/commands/${file}`);
        
        if (!command.name || !command.execute) {
          log(`Invalid command file (missing name or execute): ${file}`, 'warning');
          continue;
        }
        
        // Register command
        this.registerCommand(command);
        
        log(`Loaded command: ${command.name}`, 'info');
      } catch (error) {
        log(`Error loading command file ${file}: ${error.message}`, 'error');
      }
    }
    
    log(`Loaded ${this.commands.size} commands with ${this.aliases.size} aliases`, 'success');
  }
  
  /**
   * Register a command
   * 
   * @param {object} command - Command object to register
   * @returns {boolean} True if registered successfully
   */
  registerCommand(command) {
    if (!command.name || !command.execute) {
      return false;
    }
    
    // Add to commands map
    this.commands.set(command.name, command);
    
    // Register aliases if available
    if (command.aliases && Array.isArray(command.aliases)) {
      for (const alias of command.aliases) {
        this.aliases.set(alias, command.name);
      }
    }
    
    return true;
  }
  
  /**
   * Get a command by name
   * 
   * @param {string} name - Command name
   * @returns {object|null} The command object or null if not found
   */
  getCommand(name) {
    // Direct lookup
    if (this.commands.has(name)) {
      return this.commands.get(name);
    }
    
    // Alias lookup
    if (this.aliases.has(name)) {
      const commandName = this.aliases.get(name);
      return this.commands.get(commandName);
    }
    
    return null;
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
    
    // Command not found
    if (!command) {
      return {
        success: false,
        message: `Command not found: ${name}`
      };
    }
    
    // Check for admin-only commands
    if (command.adminOnly && !isAdmin) {
      return {
        success: false,
        message: `⛔ You do not have permission to use this command.`
      };
    }
    
    // Check cooldown
    const cooldownResult = this.checkCooldown(command, user);
    if (!cooldownResult.success) {
      return cooldownResult;
    }
    
    try {
      // Track command usage
      this.trackCommandUsage(name);
      incrementCommandUsage(user);
      
      log(`Executing command "${name}" for user "${user}"`, 'info');
      
      // Execute command
      const result = await command.execute(this.bot, params, user, isAdmin);
      
      // Apply cooldown if command was successful
      if (result.success && command.cooldown) {
        this.applyCooldown(command, user);
      }
      
      return result;
    } catch (error) {
      log(`Error executing command "${name}": ${error.message}`, 'error');
      
      return {
        success: false,
        message: `⚠️ An error occurred while executing the command.\n\nError: ${error.message}`
      };
    }
  }
  
  /**
   * Check if command is on cooldown for user
   * 
   * @param {object} command - Command object
   * @param {string} user - Username
   * @returns {object} Success status and message if on cooldown
   */
  checkCooldown(command, user) {
    if (!command.cooldown) {
      return { success: true };
    }
    
    const cooldownKey = `${command.name}-${user}`;
    
    if (this.cooldowns.has(cooldownKey)) {
      const cooldownEnd = this.cooldowns.get(cooldownKey);
      const now = Date.now();
      
      if (now < cooldownEnd) {
        // Still on cooldown
        const timeLeft = Math.ceil((cooldownEnd - now) / 1000);
        
        let timeMessage;
        if (timeLeft < 60) {
          timeMessage = `${timeLeft} second${timeLeft === 1 ? '' : 's'}`;
        } else {
          const minutes = Math.ceil(timeLeft / 60);
          timeMessage = `${minutes} minute${minutes === 1 ? '' : 's'}`;
        }
        
        return {
          success: false,
          message: `⏱️ This command is on cooldown. Please wait ${timeMessage} before using it again.`
        };
      }
    }
    
    return { success: true };
  }
  
  /**
   * Apply cooldown to a command for a user
   * 
   * @param {object} command - Command object
   * @param {string} user - Username
   */
  applyCooldown(command, user) {
    if (!command.cooldown) return;
    
    const cooldownKey = `${command.name}-${user}`;
    const cooldownTime = command.cooldown * 1000; // Convert to milliseconds
    
    this.cooldowns.set(cooldownKey, Date.now() + cooldownTime);
    
    // Set timeout to automatically remove cooldown
    setTimeout(() => {
      this.cooldowns.delete(cooldownKey);
    }, cooldownTime);
  }
  
  /**
   * Track command usage for analytics
   * 
   * @param {string} commandName - Name of the command
   */
  trackCommandUsage(commandName) {
    if (!this.commandStats[commandName]) {
      this.commandStats[commandName] = 0;
    }
    
    this.commandStats[commandName]++;
  }
  
  /**
   * Get command usage statistics
   * 
   * @returns {object} Command usage stats
   */
  getCommandStats() {
    return { ...this.commandStats };
  }
  
  /**
   * Get all registered commands
   * 
   * @returns {Map} Map of command objects
   */
  getAllCommands() {
    return this.commands;
  }
  
  /**
   * Get all registered aliases
   * 
   * @returns {Map} Map of command aliases
   */
  getAllAliases() {
    return this.aliases;
  }
  
  /**
   * Parse a command string
   * 
   * @param {string} message - The message to parse
   * @param {boolean} prefixed - Whether the message still has the command prefix
   * @returns {object|null} Parsed command or null if not a command
   */
  parseCommand(message, prefixed = true) {
    if (!message) return null;
    
    try {
      // Remove prefix if needed
      let commandString = message;
      if (prefixed) {
        const prefix = this.bot.config.bot.prefix;
        
        if (!message.startsWith(prefix)) {
          return null;
        }
        
        commandString = message.slice(prefix.length);
      }
      
      // Handle empty command
      if (!commandString.trim()) {
        return null;
      }
      
      // Parse arguments
      const args = parseArguments(commandString.trim());
      if (args.length === 0) {
        return null;
      }
      
      const commandName = args.shift().toLowerCase();
      
      return {
        name: commandName,
        params: args
      };
    } catch (error) {
      log(`Error parsing command: ${error.message}`, 'error');
      return null;
    }
  }
}

module.exports = CommandHandler;