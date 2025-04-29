/**
 * Analytics command - shows statistics and insights about bot activities
 */

const { getUser } = require('../../utils/userManager');
const { calculateUptime, formatTime } = require('../../utils/helpers');

module.exports = {
  name: 'analytics',
  aliases: ['stats', 'info'],
  description: 'Shows statistics and insights about bot activities',
  usage: 'analytics [user|commands|economy|events]',
  examples: [
    'analytics',
    'analytics user johndoe',
    'analytics commands',
    'analytics economy'
  ],
  category: 'admin',
  adminOnly: true,
  
  /**
   * Execute the analytics command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    // Define the analytics type
    let type = 'general';
    
    if (params.length > 0) {
      type = params[0].toLowerCase();
    }
    
    switch (type) {
      case 'user':
        // User-specific stats
        if (params.length < 2) {
          return {
            success: false,
            message: '⚠️ Please provide a username to view user analytics.'
          };
        }
        
        const targetUser = params[1].replace(/^@/, '');
        return this.getUserAnalytics(bot, targetUser);
      
      case 'commands':
        // Command usage stats
        return this.getCommandAnalytics(bot);
      
      case 'economy':
        // Economy system stats
        return this.getEconomyAnalytics(bot);
      
      case 'events':
        // Event stats
        return this.getEventAnalytics(bot);
        
      default:
        // General bot stats
        return this.getGeneralAnalytics(bot);
    }
  },
  
  /**
   * Get general bot analytics
   * 
   * @param {object} bot - The bot instance
   * @returns {object} Command result with general analytics
   */
  getGeneralAnalytics(bot) {
    const status = bot.getStatus();
    const uptime = calculateUptime(status.startTime);
    
    // Get event stats
    const eventCount = bot.events?.events?.length || 0;
    const recentEvents = bot.events?.events?.slice(-5) || [];
    
    // Get user counts
    const totalUsers = Object.keys(bot.userManager?.loadUsers()?.users || {}).length;
    const totalEconomyUsers = Object.keys(bot.userManager?.loadEconomy()?.users || {}).length;
    
    // Build message
    let message = `📊 **Bot Analytics**\n\n`;
    
    // Bot status
    message += `**Bot Status:**\n`;
    message += `• Status: ${status.connected ? '🟢 Connected' : '🔴 Disconnected'}\n`;
    message += `• Uptime: ${uptime}\n`;
    message += `• Version: ${bot.config.bot.version || '1.0.0'}\n`;
    message += `• Started: ${formatTime(status.startTime)}\n\n`;
    
    // User stats
    message += `**User Stats:**\n`;
    message += `• Total Users: ${totalUsers}\n`;
    message += `• Economy Users: ${totalEconomyUsers}\n\n`;
    
    // Command stats
    message += `**Command Stats:**\n`;
    message += `• Total Commands: ${Object.keys(bot.commands || {}).length}\n`;
    message += `• Command Executions: ${status.commandExecutions || 0}\n\n`;
    
    // Event stats
    message += `**Event Stats:**\n`;
    message += `• Total Events: ${eventCount}\n`;
    
    if (recentEvents.length > 0) {
      message += `• Recent Events:\n`;
      recentEvents.forEach(event => {
        const time = formatTime(event.timestamp);
        message += `  - [${time}] ${event.type}: ${event.description || 'No description'}\n`;
      });
    }
    
    return {
      success: true,
      message
    };
  },
  
  /**
   * Get user-specific analytics
   * 
   * @param {object} bot - The bot instance
   * @param {string} username - Username to get analytics for
   * @returns {object} Command result with user analytics
   */
  getUserAnalytics(bot, username) {
    // Get user data
    const userData = getUser(username);
    
    if (!userData) {
      return {
        success: false,
        message: `⚠️ User @${username} not found.`
      };
    }
    
    // Get economy data
    const economyData = bot.userManager?.getUserEconomy(username);
    
    // Build message
    let message = `👤 **User Analytics: @${username}**\n\n`;
    
    // User info
    message += `**User Info:**\n`;
    message += `• First Seen: ${formatTime(userData.createdAt)}\n`;
    message += `• Last Seen: ${formatTime(userData.lastSeen)}\n`;
    
    // Command usage
    if (userData.commandUsage) {
      message += `• Commands Used: ${userData.commandUsage.count || 0}\n`;
      if (userData.commandUsage.lastCommand) {
        message += `• Last Command: ${formatTime(userData.commandUsage.lastCommand)}\n`;
      }
    }
    
    message += '\n';
    
    // Economy data
    if (economyData) {
      message += `**Economy Stats:**\n`;
      message += `• Wallet: ${economyData.balance || 0} coins\n`;
      message += `• Bank: ${economyData.bank || 0} coins\n`;
      message += `• Total Wealth: ${(economyData.balance || 0) + (economyData.bank || 0)} coins\n`;
      
      if (economyData.loan && economyData.loan > 0) {
        message += `• Outstanding Loan: ${economyData.loan} coins\n`;
        message += `• Loan Due: ${formatTime(economyData.loanDue)}\n`;
      }
      
      if (economyData.dailyStreak && economyData.dailyStreak > 0) {
        message += `• Daily Streak: ${economyData.dailyStreak} days\n`;
        message += `• Last Daily: ${formatTime(economyData.lastDaily)}\n`;
      }
      
      // Transaction history
      if (economyData.transactions && economyData.transactions.length > 0) {
        message += `\n**Recent Transactions:**\n`;
        
        // Show last 5 transactions
        const recentTransactions = economyData.transactions.slice(-5).reverse();
        
        recentTransactions.forEach(tx => {
          const time = formatTime(tx.timestamp);
          const sign = ['credit', 'receive', 'daily', 'loan', 'withdraw'].includes(tx.type) ? '+' : '-';
          message += `• [${time}] ${sign}${tx.amount} - ${tx.description}\n`;
        });
      }
    }
    
    return {
      success: true,
      message
    };
  },
  
  /**
   * Get command usage analytics
   * 
   * @param {object} bot - The bot instance
   * @returns {object} Command result with command analytics
   */
  getCommandAnalytics(bot) {
    // Get command stats
    const commandStats = bot.commandStats || {};
    
    // Build message
    let message = `🔍 **Command Analytics**\n\n`;
    
    // Top commands
    const topCommands = Object.entries(commandStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    if (topCommands.length > 0) {
      message += `**Top Commands:**\n`;
      
      topCommands.forEach(([cmd, count], index) => {
        message += `${index + 1}. ${cmd}: ${count} uses\n`;
      });
    } else {
      message += `No command usage data available.\n`;
    }
    
    // Command categories
    message += `\n**Command Categories:**\n`;
    
    const categories = {};
    
    for (const [name, command] of Object.entries(bot.commands || {})) {
      const category = command.category || 'Uncategorized';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(name);
    }
    
    for (const [category, commands] of Object.entries(categories)) {
      message += `• ${category}: ${commands.length} commands\n`;
    }
    
    return {
      success: true,
      message
    };
  },
  
  /**
   * Get economy system analytics
   * 
   * @param {object} bot - The bot instance
   * @returns {object} Command result with economy analytics
   */
  getEconomyAnalytics(bot) {
    // Get economy data
    const economyData = bot.userManager?.loadEconomy();
    
    if (!economyData || !economyData.users) {
      return {
        success: false,
        message: `⚠️ No economy data available.`
      };
    }
    
    // Calculate statistics
    const userCount = Object.keys(economyData.users).length;
    let totalCoins = 0;
    let totalBank = 0;
    let totalLoans = 0;
    let activeLoanCount = 0;
    let highestBalance = { username: 'None', amount: 0 };
    let highestBank = { username: 'None', amount: 0 };
    let highestLoan = { username: 'None', amount: 0 };
    
    for (const [username, data] of Object.entries(economyData.users)) {
      const balance = data.balance || 0;
      const bank = data.bank || 0;
      const loan = data.loan || 0;
      
      totalCoins += balance;
      totalBank += bank;
      totalLoans += loan;
      
      if (loan > 0) {
        activeLoanCount++;
      }
      
      if (balance > highestBalance.amount) {
        highestBalance = { username, amount: balance };
      }
      
      if (bank > highestBank.amount) {
        highestBank = { username, amount: bank };
      }
      
      if (loan > highestLoan.amount) {
        highestLoan = { username, amount: loan };
      }
    }
    
    // Top users by wealth
    const topUsers = bot.userManager?.getTopUsers(5) || [];
    
    // Build message
    let message = `💰 **Economy Analytics**\n\n`;
    
    // Overall stats
    message += `**Overall Stats:**\n`;
    message += `• Total Users: ${userCount}\n`;
    message += `• Total Coins in Circulation: ${totalCoins + totalBank} coins\n`;
    message += `• Total Wallet Balance: ${totalCoins} coins\n`;
    message += `• Total Bank Deposits: ${totalBank} coins\n`;
    message += `• Total Outstanding Loans: ${totalLoans} coins\n`;
    message += `• Active Loans: ${activeLoanCount}\n\n`;
    
    // Records
    message += `**Records:**\n`;
    message += `• Highest Wallet: @${highestBalance.username} (${highestBalance.amount} coins)\n`;
    message += `• Highest Bank: @${highestBank.username} (${highestBank.amount} coins)\n`;
    
    if (highestLoan.amount > 0) {
      message += `• Highest Loan: @${highestLoan.username} (${highestLoan.amount} coins)\n`;
    }
    
    message += '\n';
    
    // Top users
    if (topUsers.length > 0) {
      message += `**Wealthiest Users:**\n`;
      
      topUsers.forEach((user, index) => {
        message += `${index + 1}. @${user.username}: ${user.wealth} coins\n`;
      });
    }
    
    return {
      success: true,
      message
    };
  },
  
  /**
   * Get event analytics
   * 
   * @param {object} bot - The bot instance
   * @returns {object} Command result with event analytics
   */
  getEventAnalytics(bot) {
    // Get recent events
    const events = bot.events?.events || [];
    
    if (events.length === 0) {
      return {
        success: false,
        message: `⚠️ No event data available.`
      };
    }
    
    // Count events by type
    const eventCounts = {};
    
    events.forEach(event => {
      const type = event.type || 'unknown';
      
      if (!eventCounts[type]) {
        eventCounts[type] = 0;
      }
      
      eventCounts[type]++;
    });
    
    // Get recent events
    const recentEvents = events.slice(-10).reverse();
    
    // Build message
    let message = `📋 **Event Analytics**\n\n`;
    
    // Event counts
    message += `**Event Types:**\n`;
    
    for (const [type, count] of Object.entries(eventCounts)) {
      message += `• ${type}: ${count} events\n`;
    }
    
    message += `\n**Recent Events:**\n`;
    
    recentEvents.forEach(event => {
      const time = formatTime(event.timestamp);
      message += `• [${time}] ${event.type}: ${event.description || 'No description'}\n`;
    });
    
    return {
      success: true,
      message
    };
  }
};