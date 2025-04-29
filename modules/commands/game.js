/**
 * Game command - Play various games to earn coins
 */

const { getUserEconomy } = require('../../utils/userManager');
const { playRPS, playSlots, coinFlip, rollDice } = require('../../utils/gameManager');

module.exports = {
  name: 'game',
  description: 'Play various games to earn coins',
  usage: 'game <rps|slots|coinflip|dice> [options]',
  examples: [
    'game rps rock 100',
    'game slots 50',
    'game coinflip heads 200',
    'game dice 4 150'
  ],
  category: 'games',
  adminOnly: false,
  
  /**
   * Execute the game command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    if (params.length === 0) {
      return this.showGames();
    }
    
    const gameType = params[0].toLowerCase();
    
    switch (gameType) {
      case 'rps':
        return this.playRockPaperScissors(user, params);
      
      case 'slots':
        return this.playSlotMachine(user, params);
      
      case 'coinflip':
      case 'coin':
        return this.playCoinFlip(user, params);
      
      case 'dice':
        return this.playDiceGame(user, params);
      
      default:
        return {
          success: false,
          message: `⚠️ Unknown game type '${gameType}'. Available games: rps, slots, coinflip, dice.`
        };
    }
  },
  
  /**
   * Show available games
   */
  showGames() {
    let message = `🎮 **Available Games**\n\n`;
    
    message += `**Rock Paper Scissors**\n`;
    message += `Command: game rps <rock|paper|scissors> <bet>\n`;
    message += `Example: game rps rock 100\n\n`;
    
    message += `**Slot Machine**\n`;
    message += `Command: game slots <bet>\n`;
    message += `Example: game slots 50\n\n`;
    
    message += `**Coin Flip**\n`;
    message += `Command: game coinflip <heads|tails> <bet>\n`;
    message += `Example: game coinflip heads 200\n\n`;
    
    message += `**Dice Roll**\n`;
    message += `Command: game dice <number|even|odd|high|low> <bet>\n`;
    message += `Example: game dice 4 150\n`;
    message += `Example: game dice even 100\n`;
    
    return {
      success: true,
      message
    };
  },
  
  /**
   * Play Rock Paper Scissors
   */
  playRockPaperScissors(user, params) {
    if (params.length < 3) {
      return {
        success: false,
        message: `⚠️ Missing parameters. Usage: game rps <rock|paper|scissors> <bet>\nExample: game rps rock 100`
      };
    }
    
    const choice = params[1].toLowerCase();
    const betAmount = parseInt(params[2]);
    
    // Validate bet amount
    if (isNaN(betAmount) || betAmount <= 0) {
      return {
        success: false,
        message: `⚠️ Please enter a valid bet amount.`
      };
    }
    
    // Check if user has enough money
    const economy = getUserEconomy(user);
    if (economy.balance < betAmount) {
      return {
        success: false,
        message: `⚠️ You don't have enough coins for this bet. Your balance: ${economy.balance} coins.`
      };
    }
    
    // Play the game
    const result = playRPS(user, choice, betAmount);
    
    if (result.success) {
      // Get updated balance
      const updatedEconomy = getUserEconomy(user);
      
      // Add balance to message
      let message = result.message;
      message += `\n\n💵 Your balance: ${updatedEconomy.balance} coins`;
      
      return {
        success: true,
        message
      };
    } else {
      return {
        success: false,
        message: result.message
      };
    }
  },
  
  /**
   * Play Slot Machine
   */
  playSlotMachine(user, params) {
    if (params.length < 2) {
      return {
        success: false,
        message: `⚠️ Missing parameters. Usage: game slots <bet>\nExample: game slots 50`
      };
    }
    
    const betAmount = parseInt(params[1]);
    
    // Validate bet amount
    if (isNaN(betAmount) || betAmount <= 0) {
      return {
        success: false,
        message: `⚠️ Please enter a valid bet amount.`
      };
    }
    
    // Check if user has enough money
    const economy = getUserEconomy(user);
    if (economy.balance < betAmount) {
      return {
        success: false,
        message: `⚠️ You don't have enough coins for this bet. Your balance: ${economy.balance} coins.`
      };
    }
    
    // Play the game
    const result = playSlots(user, betAmount);
    
    if (result.success) {
      // Get updated balance
      const updatedEconomy = getUserEconomy(user);
      
      // Add balance to message
      let message = result.message;
      message += `\n\n💵 Your balance: ${updatedEconomy.balance} coins`;
      
      return {
        success: true,
        message
      };
    } else {
      return {
        success: false,
        message: result.message
      };
    }
  },
  
  /**
   * Play Coin Flip
   */
  playCoinFlip(user, params) {
    if (params.length < 3) {
      return {
        success: false,
        message: `⚠️ Missing parameters. Usage: game coinflip <heads|tails> <bet>\nExample: game coinflip heads 100`
      };
    }
    
    const choice = params[1].toLowerCase();
    const betAmount = parseInt(params[2]);
    
    // Validate choice
    if (choice !== 'heads' && choice !== 'tails') {
      return {
        success: false,
        message: `⚠️ Invalid choice. Please choose either 'heads' or 'tails'.`
      };
    }
    
    // Validate bet amount
    if (isNaN(betAmount) || betAmount <= 0) {
      return {
        success: false,
        message: `⚠️ Please enter a valid bet amount.`
      };
    }
    
    // Check if user has enough money
    const economy = getUserEconomy(user);
    if (economy.balance < betAmount) {
      return {
        success: false,
        message: `⚠️ You don't have enough coins for this bet. Your balance: ${economy.balance} coins.`
      };
    }
    
    // Play the game
    const result = coinFlip(user, choice, betAmount);
    
    if (result.success) {
      // Get updated balance
      const updatedEconomy = getUserEconomy(user);
      
      // Add balance to message
      let message = result.message;
      message += `\n\n💵 Your balance: ${updatedEconomy.balance} coins`;
      
      return {
        success: true,
        message
      };
    } else {
      return {
        success: false,
        message: result.message
      };
    }
  },
  
  /**
   * Play Dice Game
   */
  playDiceGame(user, params) {
    if (params.length < 3) {
      return {
        success: false,
        message: `⚠️ Missing parameters. Usage: game dice <number|even|odd|high|low> <bet>\nExample: game dice 4 100`
      };
    }
    
    const predictionInput = params[1].toLowerCase();
    const betAmount = parseInt(params[2]);
    
    // Validate bet amount
    if (isNaN(betAmount) || betAmount <= 0) {
      return {
        success: false,
        message: `⚠️ Please enter a valid bet amount.`
      };
    }
    
    // Check if user has enough money
    const economy = getUserEconomy(user);
    if (economy.balance < betAmount) {
      return {
        success: false,
        message: `⚠️ You don't have enough coins for this bet. Your balance: ${economy.balance} coins.`
      };
    }
    
    // Parse prediction
    let prediction = { type: null, value: null };
    
    if (['even', 'odd', 'high', 'low'].includes(predictionInput)) {
      prediction.type = predictionInput;
    } else {
      // Try to parse as a number (1-6)
      const num = parseInt(predictionInput);
      if (!isNaN(num) && num >= 1 && num <= 6) {
        prediction.type = 'exact';
        prediction.value = num;
      } else {
        return {
          success: false,
          message: `⚠️ Invalid prediction. Choose a number from 1-6, or 'even', 'odd', 'high', or 'low'.`
        };
      }
    }
    
    // Play the game
    const result = rollDice(user, betAmount, prediction);
    
    if (result.success) {
      // Get updated balance
      const updatedEconomy = getUserEconomy(user);
      
      // Add balance to message
      let message = result.message;
      message += `\n\n💵 Your balance: ${updatedEconomy.balance} coins`;
      
      return {
        success: true,
        message
      };
    } else {
      return {
        success: false,
        message: result.message
      };
    }
  }
};