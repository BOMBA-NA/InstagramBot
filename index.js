const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const InstagramClient = require('./instagramClient');
const { loadConfig, saveConfig } = require('./utils/configManager');
const { log } = require('./utils/logger');
const { formatTime } = require('./utils/helpers');
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');

class InstagramBot extends EventEmitter {
  constructor() {
    super();
    this.config = loadConfig();
    this.client = new InstagramClient(this.config.instagram);
    this.isRunning = false;
    this.startTime = null;
    this.automationTasks = new Map();
    
    // Initialize handlers
    this.commandHandler = new CommandHandler(this);
    this.eventHandler = new EventHandler(this);
    
    // Load commands
    this.loadCommands();
    
    // Initialize event listeners
    this.setupEventListeners();
    
    log('Bot initialized successfully', 'info');
  }
  
  loadCommands() {
    const commandFiles = fs.readdirSync(path.join(__dirname, 'modules/commands'))
      .filter(file => file.endsWith('.js'));
      
    for (const file of commandFiles) {
      const command = require(`./modules/commands/${file}`);
      this.commandHandler.registerCommand(command);
    }
    
    log(`Loaded ${commandFiles.length} commands`, 'info');
  }
  
  setupEventListeners() {
    const eventFiles = fs.readdirSync(path.join(__dirname, 'modules/events'))
      .filter(file => file.endsWith('.js'));
      
    for (const file of eventFiles) {
      const event = require(`./modules/events/${file}`);
      event.init(this);
    }
    
    log('Event listeners registered', 'info');
  }
  
  async start() {
    try {
      log('Starting Instagram bot...', 'info');
      
      // Connect to Instagram
      await this.client.connect();
      
      this.isRunning = true;
      this.startTime = new Date();
      
      log('Bot started successfully', 'success');
      this.emit('started', { time: formatTime(this.startTime) });
      
      return { success: true, message: 'Bot started successfully' };
    } catch (error) {
      log(`Failed to start bot: ${error.message}`, 'error');
      return { success: false, message: `Failed to start bot: ${error.message}` };
    }
  }
  
  async stop() {
    try {
      log('Stopping Instagram bot...', 'info');
      
      // Disconnect from Instagram
      await this.client.disconnect();
      
      this.isRunning = false;
      this.stopAllAutomation();
      
      log('Bot stopped successfully', 'info');
      this.emit('stopped', { time: new Date() });
      
      return { success: true, message: 'Bot stopped successfully' };
    } catch (error) {
      log(`Failed to stop bot: ${error.message}`, 'error');
      return { success: false, message: `Failed to stop bot: ${error.message}` };
    }
  }
  
  async executeCommand(command, params = [], user, isAdmin = false) {
    if (!this.isRunning && command !== 'start') {
      return { success: false, message: 'Bot is not running. Start the bot first using the !start command.' };
    }
    
    // Check if command requires admin and user is not admin
    const cmdObject = this.commandHandler.getCommand(command);
    if (!cmdObject) {
      return { success: false, message: `Unknown command: ${command}` };
    }
    
    if (cmdObject.adminOnly && !this.isAdmin(user) && this.config.bot.adminOnly) {
      return { success: false, message: 'This command requires admin privileges.' };
    }
    
    log(`Executing command: ${command} by user: ${user}`, 'info');
    
    try {
      const result = await this.commandHandler.execute(command, params, user, isAdmin);
      
      const eventData = {
        type: 'command',
        target: command,
        user,
        status: result.success ? 'success' : 'failed',
        details: result.message,
        timestamp: new Date()
      };
      
      this.emit('commandExecuted', eventData);
      
      return result;
    } catch (error) {
      log(`Command execution error: ${error.message}`, 'error');
      return { success: false, message: `Error executing command: ${error.message}` };
    }
  }
  
  isAdmin(username) {
    return this.config.adminUsers.includes(username);
  }
  
  async startAutomation(username, actions) {
    if (this.automationTasks.has(username)) {
      return { success: false, message: `Automation already running for ${username}` };
    }
    
    log(`Starting automation for ${username}`, 'info');
    
    const interval = setInterval(async () => {
      for (const action of actions) {
        try {
          let success = false;
          let message = '';
          
          switch (action) {
            case 'like':
              ({ success, message } = await this.client.likeContent(username));
              break;
            case 'follow':
              ({ success, message } = await this.client.followUser(username));
              break;
            case 'comment':
              ({ success, message } = await this.client.commentOnContent(username));
              break;
          }
          
          const eventData = {
            type: action,
            target: username,
            status: success ? 'success' : 'failed',
            details: message,
            timestamp: new Date()
          };
          
          this.emit('actionPerformed', eventData);
          
        } catch (error) {
          log(`Automation error for ${username}: ${error.message}`, 'error');
          
          this.emit('actionPerformed', {
            type: action,
            target: username,
            status: 'failed',
            details: error.message,
            timestamp: new Date()
          });
        }
      }
    }, 10 * 60 * 1000); // Every 10 minutes
    
    this.automationTasks.set(username, interval);
    
    const eventData = {
      type: 'automation',
      target: username,
      status: 'started',
      details: `Started automation with actions: ${actions.join(', ')}`,
      timestamp: new Date()
    };
    
    this.emit('automationStarted', eventData);
    
    return { success: true, message: `Started automation for ${username} with actions: ${actions.join(', ')}` };
  }
  
  stopAutomation(username) {
    if (!this.automationTasks.has(username)) {
      return { success: false, message: `No automation running for ${username}` };
    }
    
    clearInterval(this.automationTasks.get(username));
    this.automationTasks.delete(username);
    
    log(`Stopped automation for ${username}`, 'info');
    
    const eventData = {
      type: 'automation',
      target: username,
      status: 'stopped',
      details: `Stopped automation for ${username}`,
      timestamp: new Date()
    };
    
    this.emit('automationStopped', eventData);
    
    return { success: true, message: `Stopped automation for ${username}` };
  }
  
  stopAllAutomation() {
    for (const [username, interval] of this.automationTasks.entries()) {
      clearInterval(interval);
      
      const eventData = {
        type: 'automation',
        target: username,
        status: 'stopped',
        details: `Stopped automation for ${username} (bot shutdown)`,
        timestamp: new Date()
      };
      
      this.emit('automationStopped', eventData);
    }
    
    this.automationTasks.clear();
    log('All automation tasks stopped', 'info');
  }
  
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    saveConfig(this.config);
    log('Configuration updated', 'info');
    
    this.emit('configUpdated', {
      type: 'config',
      target: 'system',
      status: 'success',
      timestamp: new Date()
    });
    
    return { success: true, message: 'Configuration updated successfully' };
  }
  
  getStatus() {
    const uptime = this.isRunning ? formatTime(this.startTime) : 'Not running';
    
    return {
      isRunning: this.isRunning,
      uptime,
      automationCount: this.automationTasks.size,
      activeAutomations: Array.from(this.automationTasks.keys()),
      config: this.config
    };
  }
  
  async testConnection() {
    try {
      const result = await this.client.testConnection();
      return { success: result, message: result ? 'Connection test successful' : 'Connection test failed' };
    } catch (error) {
      return { success: false, message: `Connection test error: ${error.message}` };
    }
  }
}

// Create bot instance
const bot = new InstagramBot();

// Start the bot automatically (can be commented out if you want to start manually)
// bot.start();

module.exports = bot;

// If this file is run directly
if (require.main === module) {
  // Set up basic CLI interface
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('Instagram Bot CLI');
  console.log('Type "exit" to quit, or "help" for a list of commands');
  
  // Start the bot
  bot.start().then(result => {
    console.log(result.message);
    
    rl.setPrompt('> ');
    rl.prompt();
    
    rl.on('line', async (line) => {
      const input = line.trim();
      
      if (input === 'exit') {
        await bot.stop();
        rl.close();
        return;
      }
      
      if (input === 'help') {
        console.log('Available commands:');
        console.log('- start: Start the bot');
        console.log('- stop: Stop the bot');
        console.log('- status: Show bot status');
        console.log('- command [command] [params...]: Execute a bot command');
        console.log('- exit: Quit the application');
        rl.prompt();
        return;
      }
      
      if (input.startsWith('command ')) {
        const [_, command, ...params] = input.split(' ');
        const result = await bot.executeCommand(command, params, 'admin123', true);
        console.log(result.message);
      } else if (input === 'start') {
        const result = await bot.start();
        console.log(result.message);
      } else if (input === 'stop') {
        const result = await bot.stop();
        console.log(result.message);
      } else if (input === 'status') {
        const status = bot.getStatus();
        console.log('Bot status:');
        console.log(`- Running: ${status.isRunning}`);
        console.log(`- Uptime: ${status.uptime}`);
        console.log(`- Active automations: ${status.automationCount}`);
      } else {
        console.log(`Unknown command: ${input}`);
      }
      
      rl.prompt();
    });
  });
}