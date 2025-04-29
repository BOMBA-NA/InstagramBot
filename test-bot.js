/**
 * Simple test script for the Instagram bot
 * 
 * This script allows testing commands without connecting to Instagram
 */

const readline = require('readline');
const { EventEmitter } = require('events');
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');
const { log, logSection } = require('./utils/logger');
const { loadConfig } = require('./utils/configManager');
const { getUserEconomy } = require('./utils/userManager');

class TestBot extends EventEmitter {
  constructor() {
    super();
    
    log('Starting bot in test mode...', 'info');
    
    // Load configuration
    this.config = loadConfig();
    
    // Set up command handler
    this.commands = new CommandHandler(this);
    this.commands.loadCommands();
    
    // Set up event handler
    this.events = new EventHandler(this);
    
    // Set up console interface
    this.setupConsoleInterface();
    
    // Set test username
    this.testUser = this.config.bot.owner || 'test_user';
    
    log(`Test bot started. Using test user: @${this.testUser}`, 'success');
    log(`Type "${this.config.bot.prefix}help" to get started.`, 'info');
    logSection('Test Console');
  }
  
  /**
   * Set up console interface for testing
   */
  setupConsoleInterface() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });
    
    this.rl.prompt();
    
    this.rl.on('line', async (line) => {
      const input = line.trim();
      
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        log('Exiting test mode...', 'info');
        this.rl.close();
        process.exit(0);
        return;
      }
      
      if (input.toLowerCase() === 'status') {
        console.log(JSON.stringify(this.getStatus(), null, 2));
        this.rl.prompt();
        return;
      }
      
      if (input.toLowerCase() === 'economy') {
        const economy = getUserEconomy(this.testUser);
        console.log(JSON.stringify(economy, null, 2));
        this.rl.prompt();
        return;
      }
      
      // Check if input is a bot command
      if (input.startsWith(this.config.bot.prefix)) {
        await this.processCommand(input);
      } else {
        log(`Not a command. Use ${this.config.bot.prefix} prefix or type 'exit' to quit.`, 'info');
      }
      
      this.rl.prompt();
    });
    
    this.rl.on('close', () => {
      log('Test bot shutting down.', 'info');
      process.exit(0);
    });
  }
  
  /**
   * Process a command from console input
   * 
   * @param {string} input - Console input
   */
  async processCommand(input) {
    try {
      // Parse command
      const parsed = this.commands.parseCommand(input, true);
      
      if (!parsed) {
        log('Invalid command format.', 'warning');
        return;
      }
      
      const { name, params } = parsed;
      
      // Check if user is admin
      const isAdmin = true; // In test mode, always admin
      
      log(`Executing command: ${name} ${params.join(' ')}`, 'info');
      
      // Execute command
      const result = await this.commands.execute(name, params, this.testUser, isAdmin);
      
      // Emit command executed event
      this.emit('command:executed', name, this.testUser, result.success);
      
      // Show result
      if (result.success) {
        log('Command executed successfully', 'success');
        console.log('\nResponse:');
        console.log('-------------------');
        console.log(result.message);
        console.log('-------------------\n');
      } else {
        log(`Command execution failed: ${result.message}`, 'error');
      }
    } catch (error) {
      log(`Error processing command: ${error.message}`, 'error');
    }
  }
  
  /**
   * Get bot status
   * 
   * @returns {object} Bot status information
   */
  getStatus() {
    return {
      connected: true,
      testMode: true,
      startTime: new Date().toISOString(),
      commandExecutions: this.commands.getCommandStats(),
      eventsLogged: this.events.events.length,
      testUser: this.testUser
    };
  }
  
  /**
   * Check if a user is an admin
   * 
   * @param {string} username - Username to check
   * @returns {boolean} True if the user is an admin
   */
  isAdmin(username) {
    // In test mode, test user is always admin
    return username === this.testUser || 
      this.config.bot.owner === username ||
      (this.config.bot.admins && this.config.bot.admins.includes(username));
  }
  
  /**
   * Update configuration
   * 
   * @param {object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    log('Configuration updated in test mode.', 'success');
  }
}

// Create and start test bot
const testBot = new TestBot();

// For use in global context
global.bot = testBot;