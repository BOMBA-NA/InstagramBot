const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const InstagramClient = require('./instagramClient');
const { loadConfig, saveConfig } = require('./utils/configManager');
const { log, logSection } = require('./utils/logger');
const { formatTime } = require('./utils/helpers');
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');

class InstagramBot extends EventEmitter {
  constructor() {
    super();
    this.config = loadConfig();
    this.client = new InstagramClient(this.config.instagram, this);
    this.isRunning = false;
    this.startTime = null;
    this.automationTasks = new Map();
    
    // Initialize handlers
    this.commandHandler = new CommandHandler(this);
    this.eventHandler = new EventHandler(this);
    
    // Load commands
    this.loadCommands();
    
    log('Bot initialized successfully', 'info');
  }
  
  async loadCommands() {
    try {
      logSection('LOADING COMMANDS');
      
      // Create commands directory if it doesn't exist
      const commandsDir = path.join(__dirname, 'modules/commands');
      if (!fs.existsSync(commandsDir)) {
        fs.mkdirSync(commandsDir, { recursive: true });
        log('Created commands directory', 'info');
      }
      
      const commandFiles = fs.readdirSync(commandsDir)
        .filter(file => file.endsWith('.js'));
        
      if (commandFiles.length === 0) {
        log('No command modules found. Create some in the modules/commands directory.', 'warning');
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const file of commandFiles) {
        try {
          const command = require(path.join(commandsDir, file));
          const registered = this.commandHandler.registerCommand(command);
          
          if (registered) {
            successCount++;
            log(`Loaded command: ${command.name}`, 'debug');
          } else {
            errorCount++;
            log(`Failed to register command from ${file}`, 'warning');
          }
        } catch (err) {
          errorCount++;
          log(`Error loading command file ${file}: ${err.message}`, 'error');
        }
      }
      
      log(`Successfully loaded ${successCount} commands ${errorCount > 0 ? `(${errorCount} failed)` : ''}`, 'success');
    } catch (error) {
      log(`Error loading commands: ${error.message}`, 'error');
    }
  }
  
  async start() {
    try {
      logSection('STARTING BOT');
      log('Initializing Instagram bot...', 'info');
      
      // Connect to Instagram
      log('Connecting to Instagram...', 'info');
      await this.client.connect();
      
      this.isRunning = true;
      this.startTime = new Date();
      
      // Start listening for direct messages
      log('Starting direct message listener...', 'info');
      const dmListenerStarted = await this.client.listenForDirectMessages('*', this.commandHandler);
      
      if (dmListenerStarted) {
        log('Direct message listener started successfully', 'success');
      } else {
        log('Failed to start direct message listener', 'warning');
      }
      
      log('Bot started successfully', 'success');
      this.emit('started', { time: formatTime(this.startTime) });
      
      return { success: true, message: 'Bot started successfully and is now listening for direct message commands' };
    } catch (error) {
      log(`Failed to start bot: ${error.message}`, 'error');
      return { success: false, message: `Failed to start bot: ${error.message}` };
    }
  }
  
  async stop() {
    try {
      logSection('STOPPING BOT');
      log('Shutting down Instagram bot...', 'info');
      
      // Stop DM listener
      log('Stopping direct message listener...', 'info');
      this.client.stopListeningForDirectMessages();
      
      // Stop all automation
      log('Stopping automation tasks...', 'info');
      this.stopAllAutomation();
      
      // Stop all scheduled tasks if any
      log('Stopping scheduled tasks...', 'info');
      this.stopAllScheduledTasks();
      
      // Disconnect from Instagram
      log('Disconnecting from Instagram...', 'info');
      await this.client.disconnect();
      
      this.isRunning = false;
      
      log('Bot stopped successfully', 'success');
      this.emit('stopped', { time: new Date() });
      
      return { success: true, message: 'Bot stopped successfully' };
    } catch (error) {
      log(`Failed to stop bot: ${error.message}`, 'error');
      return { success: false, message: `Failed to stop bot: ${error.message}` };
    }
  }
  
  // Helper method to stop all scheduled tasks
  stopAllScheduledTasks() {
    if (this.scheduledTasks && this.scheduledTasks.size > 0) {
      log(`Stopping ${this.scheduledTasks.size} scheduled tasks...`, 'info');
      
      for (const [taskId, task] of this.scheduledTasks.entries()) {
        clearInterval(task.intervalId);
        
        this.emit('scheduledTaskStopped', {
          taskId,
          action: task.action,
          target: task.target,
          reason: 'Bot shutdown',
          timestamp: new Date()
        });
      }
      
      this.scheduledTasks.clear();
      log('All scheduled tasks stopped', 'info');
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
      log(`User ${user} attempted to use admin command: ${command}`, 'warning');
      return { success: false, message: 'This command requires admin privileges.' };
    }
    
    logSection(`EXECUTING COMMAND: ${command.toUpperCase()}`);
    log(`Command received from user: ${user}`, 'info');
    log(`Parameters: ${params.length > 0 ? params.join(', ') : 'None'}`, 'debug');
    
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
      
      if (result.success) {
        log(`Command '${command}' executed successfully`, 'success');
      } else {
        log(`Command '${command}' failed: ${result.message}`, 'warning');
      }
      
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
    
    logSection(`STARTING AUTOMATION FOR @${username}`);
    log(`Configuring automation with actions: ${actions.join(', ')}`, 'info');
    
    const interval = setInterval(async () => {
      logSection(`RUNNING AUTOMATED ACTIONS FOR @${username}`);
      
      for (const action of actions) {
        try {
          let success = false;
          let message = '';
          
          log(`Performing automated ${action} for @${username}`, 'info');
          
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
          
          if (success) {
            log(`${action.charAt(0).toUpperCase() + action.slice(1)} action completed successfully`, 'success');
          } else {
            log(`${action.charAt(0).toUpperCase() + action.slice(1)} action failed: ${message}`, 'warning');
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
          log(`Automation error for ${action} on ${username}: ${error.message}`, 'error');
          
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
    
    log(`Automation started successfully for @${username}`, 'success');
    return { success: true, message: `Started automation for ${username} with actions: ${actions.join(', ')}` };
  }
  
  stopAutomation(username) {
    if (!this.automationTasks.has(username)) {
      return { success: false, message: `No automation running for ${username}` };
    }
    
    logSection(`STOPPING AUTOMATION FOR @${username}`);
    
    clearInterval(this.automationTasks.get(username));
    this.automationTasks.delete(username);
    
    log(`Removing scheduled automation tasks...`, 'info');
    
    const eventData = {
      type: 'automation',
      target: username,
      status: 'stopped',
      details: `Stopped automation for ${username}`,
      timestamp: new Date()
    };
    
    this.emit('automationStopped', eventData);
    
    log(`Automation stopped successfully for @${username}`, 'success');
    return { success: true, message: `Stopped automation for ${username}` };
  }
  
  stopAllAutomation() {
    const automationCount = this.automationTasks.size;
    
    if (automationCount === 0) {
      log('No active automation tasks to stop', 'info');
      return;
    }
    
    logSection('STOPPING ALL AUTOMATION TASKS');
    log(`Found ${automationCount} active automation tasks to stop`, 'info');
    
    let stoppedCount = 0;
    for (const [username, interval] of this.automationTasks.entries()) {
      clearInterval(interval);
      stoppedCount++;
      
      log(`Stopping automation for @${username} (${stoppedCount}/${automationCount})`, 'info');
      
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
    log(`Successfully stopped ${stoppedCount} automation tasks`, 'success');
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
    
    // Get scheduled tasks info if any
    let scheduledTasksCount = 0;
    let activeScheduledTasks = [];
    
    if (this.scheduledTasks && this.scheduledTasks.size > 0) {
      scheduledTasksCount = this.scheduledTasks.size;
      activeScheduledTasks = Array.from(this.scheduledTasks.entries()).map(([id, task]) => ({
        id,
        action: task.action,
        target: task.target,
        interval: task.intervalHours
      }));
    }
    
    return {
      isRunning: this.isRunning,
      uptime,
      automationCount: this.automationTasks.size,
      activeAutomations: Array.from(this.automationTasks.keys()),
      scheduledTasksCount,
      activeScheduledTasks,
      loginStatus: this.client.isLoggedIn ? 'Logged in' : 'Not logged in',
      lastLoginAttempt: this.client.lastLoginAttempt ? formatTime(this.client.lastLoginAttempt) : 'Never',
      lastActivity: this.client.lastActivity ? formatTime(this.client.lastActivity) : 'Never',
      loginAttempts: this.client.loginAttempts,
      config: this.config
    };
  }
  
  getLoginHistory(limit = 10) {
    return this.eventHandler.getLoginHistory(limit);
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

// Export the bot instance
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
        console.log('- login_history: Show login history');
        console.log('- command [command] [params...]: Execute a bot command');
        console.log('- exit: Quit the application');
        rl.prompt();
        return;
      }
      
      if (input === 'status') {
        const status = bot.getStatus();
        console.log('Bot status:');
        console.log(`- Running: ${status.isRunning}`);
        console.log(`- Login status: ${status.loginStatus}`);
        console.log(`- Uptime: ${status.uptime}`);
        console.log(`- Last login attempt: ${status.lastLoginAttempt}`);
        console.log(`- Last activity: ${status.lastActivity}`);
        console.log(`- Login attempts: ${status.loginAttempts}`);
        console.log(`- Active automations: ${status.automationCount}`);
        rl.prompt();
        return;
      }
      
      if (input === 'login_history') {
        const history = bot.getLoginHistory();
        console.log('Login history:');
        
        if (history.length === 0) {
          console.log('No login events recorded yet.');
        } else {
          history.forEach((event, index) => {
            console.log(`${index + 1}. [${formatTime(event.timestamp)}] ${event.status}: ${event.details || event.username}`);
          });
        }
        
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
      } else {
        console.log(`Unknown command: ${input}`);
      }
      
      rl.prompt();
    });
  });
}