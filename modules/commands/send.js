/**
 * Send command - Send coins to another user
 */

const { getUserEconomy, sendMoney } = require('../../utils/userManager');

module.exports = {
  name: 'send',
  description: 'Send coins to another user',
  usage: 'send <username> <amount>',
  examples: ['send johndoe 500'],
  category: 'economy',
  adminOnly: false,
  
  /**
   * Execute the send command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    if (params.length < 2) {
      return {
        success: false,
        message: `⚠️ Missing parameters. Usage: ${bot.config.bot.prefix}${this.usage}`
      };
    }
    
    // Get recipient username and amount
    const recipient = params[0].replace(/^@/, ''); // Remove @ if present
    const amount = parseInt(params[1]);
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: `⚠️ Please enter a valid amount to send.`
      };
    }
    
    // Check if user is trying to send to themselves
    if (recipient.toLowerCase() === user.toLowerCase()) {
      return {
        success: false,
        message: `⚠️ You cannot send coins to yourself.`
      };
    }
    
    // Check if user has enough coins
    const senderEconomy = getUserEconomy(user);
    if (senderEconomy.balance < amount) {
      return {
        success: false,
        message: `⚠️ You don't have enough coins. Your balance: ${senderEconomy.balance} coins.`
      };
    }
    
    // Send the coins
    const result = sendMoney(user, recipient, amount);
    
    if (result.success) {
      // Get updated balances
      const updatedSenderEconomy = getUserEconomy(user);
      const recipientEconomy = getUserEconomy(recipient);
      
      let message = `💸 **Money Transfer Successful**\n\n`;
      message += `You sent ${amount} coins to @${recipient}.\n\n`;
      message += `💵 Your new balance: ${updatedSenderEconomy.balance} coins\n`;
      message += `💰 @${recipient}'s balance: ${recipientEconomy.balance} coins`;
      
      return {
        success: true,
        message
      };
    } else {
      return {
        success: false,
        message: `❌ **Transfer Failed**\n\n${result.message}`
      };
    }
  }
};