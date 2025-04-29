/**
 * Bank command - Manage your bank account
 */

const { 
  getUserEconomy,
  bankDeposit,
  bankWithdraw,
  bankLoan,
  repayLoan,
  getTopUsers
} = require('../../utils/userManager');

module.exports = {
  name: 'bank',
  description: 'Manage your bank account (deposit, withdraw, loan, toplist)',
  usage: 'bank <deposit|withdraw|loan|repay|toplist> [amount]',
  examples: [
    'bank deposit 1000',
    'bank withdraw 500',
    'bank loan 5000',
    'bank repay 500',
    'bank toplist'
  ],
  category: 'economy',
  adminOnly: false,
  
  /**
   * Execute the bank command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    if (params.length === 0) {
      return this.showBankInfo(user);
    }
    
    const action = params[0].toLowerCase();
    
    switch (action) {
      case 'deposit':
        return this.handleDeposit(user, params);
      
      case 'withdraw':
        return this.handleWithdraw(user, params);
      
      case 'loan':
        return this.handleLoan(user, params);
      
      case 'repay':
        return this.handleRepay(user, params);
      
      case 'toplist':
        return this.handleToplist();
      
      default:
        return {
          success: false,
          message: `⚠️ Unknown bank action '${action}'. Use 'deposit', 'withdraw', 'loan', 'repay', or 'toplist'.`
        };
    }
  },
  
  /**
   * Show basic bank account information
   */
  showBankInfo(user) {
    const economy = getUserEconomy(user);
    
    let message = `🏦 **Bank Account Information**\n\n`;
    message += `💵 Wallet balance: ${economy.balance} coins\n`;
    message += `🏦 Bank balance: ${economy.bank} coins\n`;
    message += `📊 Total wealth: ${economy.balance + economy.bank} coins\n\n`;
    
    // Add loan information if applicable
    if (economy.loan > 0) {
      const dueDate = new Date(economy.loanDue);
      message += `⚠️ Outstanding loan: ${economy.loan} coins\n`;
      message += `📅 Due date: ${dueDate.toDateString()}\n\n`;
    }
    
    // Add bank instructions
    message += `**Available commands:**\n`;
    message += `• bank deposit [amount] - Deposit money to bank\n`;
    message += `• bank withdraw [amount] - Withdraw money from bank\n`;
    message += `• bank loan [amount] - Take a loan\n`;
    message += `• bank repay [amount] - Repay your loan\n`;
    message += `• bank toplist - Show wealthiest users\n`;
    
    return {
      success: true,
      message
    };
  },
  
  /**
   * Handle deposit action
   */
  handleDeposit(user, params) {
    if (params.length < 2) {
      return {
        success: false,
        message: `⚠️ Please specify an amount to deposit.`
      };
    }
    
    const amount = parseInt(params[1]);
    
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: `⚠️ Please enter a valid amount to deposit.`
      };
    }
    
    // Process deposit
    const result = bankDeposit(user, amount);
    
    if (result.success) {
      let message = `🏦 **Bank Deposit Successful**\n\n`;
      message += `${result.message}\n\n`;
      message += `💵 Wallet balance: ${result.walletBalance} coins\n`;
      message += `🏦 Bank balance: ${result.bankBalance} coins`;
      
      return {
        success: true,
        message
      };
    } else {
      return {
        success: false,
        message: `⚠️ **Deposit Failed**\n\n${result.message}`
      };
    }
  },
  
  /**
   * Handle withdraw action
   */
  handleWithdraw(user, params) {
    if (params.length < 2) {
      return {
        success: false,
        message: `⚠️ Please specify an amount to withdraw.`
      };
    }
    
    let amount = params[1].toLowerCase();
    
    // Handle 'all' keyword
    if (amount === 'all') {
      const economy = getUserEconomy(user);
      amount = economy.bank;
    } else {
      amount = parseInt(amount);
    }
    
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: `⚠️ Please enter a valid amount to withdraw.`
      };
    }
    
    // Process withdrawal
    const result = bankWithdraw(user, amount);
    
    if (result.success) {
      let message = `🏦 **Bank Withdrawal Successful**\n\n`;
      message += `${result.message}\n\n`;
      message += `💵 Wallet balance: ${result.walletBalance} coins\n`;
      message += `🏦 Bank balance: ${result.bankBalance} coins`;
      
      return {
        success: true,
        message
      };
    } else {
      return {
        success: false,
        message: `⚠️ **Withdrawal Failed**\n\n${result.message}`
      };
    }
  },
  
  /**
   * Handle loan action
   */
  handleLoan(user, params) {
    if (params.length < 2) {
      return {
        success: false,
        message: `⚠️ Please specify an amount to borrow.`
      };
    }
    
    const amount = parseInt(params[1]);
    
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: `⚠️ Please enter a valid amount to borrow.`
      };
    }
    
    // Process loan
    const result = bankLoan(user, amount);
    
    if (result.success) {
      let message = `💰 **Loan Approved**\n\n`;
      message += `${result.message}\n\n`;
      message += `💵 Wallet balance: ${result.walletBalance} coins\n`;
      message += `💸 Loan amount: ${result.loanAmount} coins\n`;
      message += `⚠️ Remember to repay your loan before the due date!`;
      
      return {
        success: true,
        message
      };
    } else {
      return {
        success: false,
        message: `⚠️ **Loan Request Declined**\n\n${result.message}`
      };
    }
  },
  
  /**
   * Handle repay action
   */
  handleRepay(user, params) {
    if (params.length < 2) {
      return {
        success: false,
        message: `⚠️ Please specify an amount to repay.`
      };
    }
    
    let amount = params[1].toLowerCase();
    
    // Handle 'all' keyword
    if (amount === 'all') {
      const economy = getUserEconomy(user);
      amount = Math.min(economy.loan, economy.balance);
    } else {
      amount = parseInt(amount);
    }
    
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: `⚠️ Please enter a valid amount to repay.`
      };
    }
    
    // Process repayment
    const result = repayLoan(user, amount);
    
    if (result.success) {
      let message = `💸 **Loan Repayment**\n\n`;
      message += `${result.message}\n\n`;
      message += `💵 Wallet balance: ${result.walletBalance} coins\n`;
      
      if (result.remainingLoan > 0) {
        message += `💸 Remaining loan: ${result.remainingLoan} coins`;
      }
      
      return {
        success: true,
        message
      };
    } else {
      return {
        success: false,
        message: `⚠️ **Repayment Failed**\n\n${result.message}`
      };
    }
  },
  
  /**
   * Handle toplist action
   */
  handleToplist() {
    const topUsers = getTopUsers(10);
    
    if (topUsers.length === 0) {
      return {
        success: true,
        message: `⚠️ No users with wealth found.`
      };
    }
    
    let message = `🏆 **Wealthiest Users**\n\n`;
    
    topUsers.forEach((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      message += `${medal} @${user.username} - ${user.wealth} coins`;
      
      // Add wallet/bank breakdown
      message += ` (💵 ${user.balance} | 🏦 ${user.bank})\n`;
    });
    
    return {
      success: true,
      message
    };
  }
};