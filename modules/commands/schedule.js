/**
 * Schedule command - schedules automated interactions
 */

module.exports = {
  name: 'schedule',
  description: 'Schedules automated interactions at specified intervals',
  usage: 'schedule <action> <target> <interval_hours> [stop]',
  adminOnly: true,
  
  /**
   * Execute the schedule command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    // Only admin users can schedule
    if (!isAdmin) {
      return { success: false, message: 'This command requires admin privileges.' };
    }
    
    // Initialize schedules in the bot if not already there
    if (!bot.scheduledTasks) {
      bot.scheduledTasks = new Map();
    }
    
    // If no parameters, list all scheduled tasks
    if (params.length === 0) {
      return this.listScheduledTasks(bot);
    }
    
    // Check for the 'stop' command variation
    if (params[0].toLowerCase() === 'stop') {
      if (params.length < 2) {
        return { 
          success: false, 
          message: 'Missing task ID. Usage: schedule stop <id>' 
        };
      }
      
      const taskId = params[1];
      return this.stopScheduledTask(bot, taskId);
    }
    
    // Check parameters for scheduling a new task
    if (params.length < 3) {
      return { 
        success: false, 
        message: 'Missing parameters. Usage: schedule <action> <target> <interval_hours>' 
      };
    }
    
    const action = params[0].toLowerCase();
    const target = params[1];
    const intervalHours = parseFloat(params[2]);
    
    // Validate action
    if (!['like', 'follow', 'comment', 'message'].includes(action)) {
      return { 
        success: false, 
        message: `Invalid action: ${action}. Supported actions: like, follow, comment, message.` 
      };
    }
    
    // Validate interval
    if (isNaN(intervalHours) || intervalHours < 1) {
      return { 
        success: false, 
        message: 'Interval must be a number greater than or equal to 1 hour.' 
      };
    }
    
    // Special case for 'message' action - needs message text
    let messageText = null;
    if (action === 'message' && params.length < 4) {
      return { 
        success: false, 
        message: 'Missing message text. Usage: schedule message <username> <interval_hours> <text>' 
      };
    } else if (action === 'message') {
      messageText = params.slice(3).join(' ');
    }
    
    // Schedule the task
    return this.scheduleNewTask(bot, action, target, intervalHours, messageText, user);
  },
  
  // List all scheduled tasks
  listScheduledTasks(bot) {
    const tasks = bot.scheduledTasks;
    
    if (!tasks || tasks.size === 0) {
      return { success: true, message: 'No scheduled tasks.' };
    }
    
    let response = '⏰ Scheduled Tasks:\n\n';
    
    tasks.forEach((task, id) => {
      response += `ID: ${id}\n`;
      response += `- Action: ${task.action}\n`;
      response += `- Target: ${task.target}\n`;
      response += `- Interval: ${task.intervalHours} hours\n`;
      response += `- Next run: ${task.nextRun ? new Date(task.nextRun).toLocaleString() : 'Unknown'}\n`;
      response += `- Created by: ${task.createdBy}\n\n`;
    });
    
    response += 'To stop a task, use: schedule stop <id>';
    
    return { success: true, message: response };
  },
  
  // Stop a scheduled task
  stopScheduledTask(bot, taskId) {
    const tasks = bot.scheduledTasks;
    
    if (!tasks || !tasks.has(taskId)) {
      return { success: false, message: `No scheduled task with ID: ${taskId}` };
    }
    
    // Clear the interval
    clearInterval(tasks.get(taskId).intervalId);
    
    // Remove the task from the map
    tasks.delete(taskId);
    
    return { success: true, message: `Stopped scheduled task ${taskId}` };
  },
  
  // Schedule a new task
  scheduleNewTask(bot, action, target, intervalHours, messageText, user) {
    // Generate a unique ID for this task
    const taskId = `${action}_${Date.now()}`;
    
    // Calculate interval in milliseconds
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    // Function to execute the scheduled action
    const executeAction = async () => {
      try {
        // Update next run time
        const task = bot.scheduledTasks.get(taskId);
        task.nextRun = Date.now() + intervalMs;
        
        // Check if bot is running
        if (!bot.isRunning || !bot.instagramClient.isLoggedIn) {
          console.log(`Scheduled task ${taskId} skipped: Bot not running or not logged in`);
          return;
        }
        
        // Execute the appropriate action
        let result;
        switch (action) {
          case 'like':
            result = await bot.instagramClient.likeContent(target);
            break;
          case 'follow':
            result = await bot.instagramClient.followUser(target);
            break;
          case 'comment':
            result = await bot.instagramClient.commentOnContent(target);
            break;
          case 'message':
            result = await bot.instagramClient.sendDirectMessage(target, messageText);
            break;
        }
        
        // Log the result
        console.log(`Scheduled task ${taskId} executed: ${result.success ? 'Success' : 'Failed'}`);
        
        // Emit event
        bot.emit('scheduledTaskExecuted', {
          taskId,
          action,
          target,
          result,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Error executing scheduled task ${taskId}: ${error.message}`);
      }
    };
    
    // Execute once immediately
    executeAction();
    
    // Set up interval for future executions
    const intervalId = setInterval(executeAction, intervalMs);
    
    // Store the scheduled task
    bot.scheduledTasks.set(taskId, {
      action,
      target,
      intervalHours,
      messageText,
      createdBy: user,
      createdAt: new Date(),
      nextRun: Date.now() + intervalMs,
      intervalId
    });
    
    return { 
      success: true, 
      message: `Scheduled ${action} for ${target} every ${intervalHours} hours. Task ID: ${taskId}`
    };
  }
};