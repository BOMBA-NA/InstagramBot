/**
 * Work command - Earn coins by working
 */

const { updateBalance, getUserEconomy } = require('../../utils/userManager');

module.exports = {
  name: 'work',
  description: 'Earn coins by working (has cooldown)',
  usage: 'work',
  examples: ['work'],
  category: 'economy',
  adminOnly: false,
  
  // Store cooldowns by username 
  cooldowns: new Map(),
  
  // Work cooldown in minutes
  cooldownTime: 30,
  
  // Min and max work rewards
  minReward: 50,
  maxReward: 200,
  
  // Work scenarios with custom messages
  workScenarios: [
    {
      job: 'photographer',
      messages: [
        'You took stunning photos for a local event',
        'You did a photoshoot for an upcoming influencer',
        'Your photography skills impressed a magazine editor'
      ]
    },
    {
      job: "social media manager",
      messages: [
        "You managed a successful ad campaign",
        "You increased engagement for a brand's Instagram",
        "You created viral content for a business"
      ]
    },
    {
      job: 'content creator',
      messages: [
        'Your latest video went viral gaining thousands of views',
        'You created sponsored content for a big brand',
        'Your creative post got featured on Explore page'
      ]
    },
    {
      job: 'influencer',
      messages: [
        'You promoted a new product on your story',
        'Your fashion recommendations earned you a commission',
        'Your lifestyle post attracted new sponsorship offers'
      ]
    },
    {
      job: 'moderator',
      messages: [
        'You moderated comments for a celebrity account',
        'You helped manage a large community page',
        'You filtered spam for a growing business account'
      ]
    }
  ],
  
  /**
   * Execute the work command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    // Check if user is on cooldown
    if (this.cooldowns.has(user)) {
      const cooldownEnd = this.cooldowns.get(user);
      const now = Date.now();
      
      if (now < cooldownEnd) {
        // User is still on cooldown
        const timeLeft = Math.ceil((cooldownEnd - now) / (1000 * 60)); // in minutes
        
        return {
          success: false,
          message: `⏱️ **Work Cooldown**\n\nYou're still tired from your last job. You can work again in ${timeLeft} ${timeLeft === 1 ? 'minute' : 'minutes'}.`
        };
      }
    }
    
    // Generate reward
    const reward = Math.floor(Math.random() * (this.maxReward - this.minReward + 1)) + this.minReward;
    
    // Select random work scenario
    const scenario = this.workScenarios[Math.floor(Math.random() * this.workScenarios.length)];
    const message = scenario.messages[Math.floor(Math.random() * scenario.messages.length)];
    
    // Update user balance
    updateBalance(user, reward, `Work: ${scenario.job}`);
    
    // Set cooldown
    const cooldownEnd = Date.now() + (this.cooldownTime * 60 * 1000);
    this.cooldowns.set(user, cooldownEnd);
    
    // Get updated balance
    const economy = getUserEconomy(user);
    
    // Build response message
    let responseMessage = `💼 **Work Completed**\n\n`;
    responseMessage += `You worked as a **${scenario.job}**.\n`;
    responseMessage += `${message} and earned **${reward} coins**!\n\n`;
    responseMessage += `💵 Your balance: ${economy.balance} coins\n`;
    responseMessage += `⏱️ You can work again in ${this.cooldownTime} minutes.`;
    
    return {
      success: true,
      message: responseMessage,
      reward,
      job: scenario.job
    };
  }
};