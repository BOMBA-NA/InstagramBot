/**
 * Balance command - Check your account balance
 */

const { getUserEconomy } = require('../../utils/userManager');

module.exports = {
  name: 'balance',
  description: 'Check your account balance',
  usage: 'balance [username]',
  examples: ['balance', 'balance johndoe'],
  category: 'economy',
  adminOnly: false,
  
  /**
   * Execute the balance command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    // Determine which user's balance to check
    let targetUser = user;
    let isCheckingOther = false;
    
    if (params.length > 0 && isAdmin) {
      // Admin can check balance of other users
      targetUser = params[0].replace(/^@/, ''); // Remove @ if present
      isCheckingOther = true;
    }
    
    // Get economy data
    const economy = getUserEconomy(targetUser);
    
    // Calculate total wealth
    const totalWealth = economy.balance + economy.bank;
    
    // Build message
    let message = isCheckingOther 
      ? `💰 **${targetUser}'s Balance**\n\n`
      : `💰 **Your Balance**\n\n`;
    
    message += `💵 Wallet: ${economy.balance} coins\n`;
    message += `🏦 Bank: ${economy.bank} coins\n`;
    message += `📊 Total: ${totalWealth} coins\n\n`;
    
    // Add loan information if applicable
    if (economy.loan > 0) {
      const dueDate = new Date(economy.loanDue);
      message += `⚠️ Outstanding loan: ${economy.loan} coins\n`;
      message += `📅 Due date: ${dueDate.toDateString()}\n\n`;
    }
    
    // Add transaction history
    message += `📝 **Recent Transactions:**\n`;
    
    if (economy.transactions && economy.transactions.length > 0) {
      // Get the 5 most recent transactions
      const recentTransactions = economy.transactions.slice(-5).reverse();
      
      recentTransactions.forEach(transaction => {
        const date = new Date(transaction.timestamp);
        const formattedDate = `${date.getMonth()+1}/${date.getDate()}`;
        
        let transactionEmoji = '📝';
        if (transaction.type === 'credit' || transaction.type === 'receive') transactionEmoji = '💹';
        if (transaction.type === 'debit' || transaction.type === 'send') transactionEmoji = '📉';
        if (transaction.type === 'daily') transactionEmoji = '🎁';
        if (transaction.type === 'loan') transactionEmoji = '💸';
        if (transaction.type === 'repayment') transactionEmoji = '🔄';
        if (transaction.type === 'deposit') transactionEmoji = '💰';
        if (transaction.type === 'withdraw') transactionEmoji = '💵';
        
        message += `${transactionEmoji} ${formattedDate}: ${transaction.description} `;
        
        // Add amount with appropriate sign
        if (['credit', 'receive', 'daily', 'loan', 'withdraw'].includes(transaction.type)) {
          message += `(+${transaction.amount})`;
        } else if (['debit', 'send', 'repayment', 'deposit'].includes(transaction.type)) {
          message += `(-${transaction.amount})`;
        }
        
        message += '\n';
      });
    } else {
      message += 'No recent transactions.\n';
    }
    
    return {
      success: true,
      message
    };
  }
};