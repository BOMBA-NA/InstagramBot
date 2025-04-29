/**
 * Daily command - Collect daily coins reward
 */

const { 
  getUserEconomy,
  canCollectDaily,
  collectDaily
} = require('../../utils/userManager');

module.exports = {
  name: 'daily',
  description: 'Collect your daily coins reward (once per 24 hours)',
  usage: 'daily',
  examples: ['daily'],
  category: 'economy',
  adminOnly: false,
  
  /**
   * Execute the daily command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    // Check if user can collect daily reward
    const checkResult = canCollectDaily(user);
    
    if (!checkResult.canCollect) {
      // User already collected today
      const hoursLeft = checkResult.hoursLeft;
      const minutesLeft = checkResult.minutesLeft;
      
      let timeMessage = '';
      if (hoursLeft > 0) {
        timeMessage += `${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'}`;
      }
      
      if (minutesLeft > 0) {
        if (timeMessage) timeMessage += ' and ';
        timeMessage += `${minutesLeft} ${minutesLeft === 1 ? 'minute' : 'minutes'}`;
      }
      
      return {
        success: false,
        message: `⏱️ **Daily Reward Cooldown**\n\nYou've already collected your daily reward. Come back in ${timeMessage}.`
      };
    }
    
    // User can collect the reward
    const result = collectDaily(user);
    
    if (result.success) {
      // Get updated balance
      const economy = getUserEconomy(user);
      
      // Calculate streak bonus
      const streakBonus = result.streak > 1 ? result.amount * 0.1 * (result.streak - 1) : 0;
      const totalReward = result.amount + Math.floor(streakBonus);
      
      // Create response message
      let message = `🎁 **Daily Reward Collected!**\n\n`;
      message += `You received **${result.amount} coins**!\n`;
      
      if (result.streak > 1) {
        message += `🔥 **${result.streak} day streak!** Bonus: ${Math.floor(streakBonus)} coins\n`;
        message += `Total: ${totalReward} coins\n\n`;
      } else {
        message += '\n';
      }
      
      message += `💵 Your balance: ${economy.balance} coins\n`;
      message += `📆 Come back tomorrow for another reward!`;
      
      if (result.streak === 7 || result.streak === 14 || result.streak === 30) {
        message += `\n\n🏆 **Achievement unlocked!** ${result.streak} day streak!`;
      }
      
      return {
        success: true,
        message,
        amount: totalReward,
        streak: result.streak
      };
    } else {
      return {
        success: false,
        message: `❌ Error collecting daily reward: ${result.message}`
      };
    }
  }
};