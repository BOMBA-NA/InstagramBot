/**
 * Game utilities for Instagram Bot
 */

const { updateBalance, getUserEconomy } = require('./userManager');

/**
 * Play Rock Paper Scissors game
 * 
 * @param {string} username - Username of the player
 * @param {string} userChoice - User's choice (rock, paper, scissors)
 * @param {number} betAmount - Amount of coins bet
 * @returns {object} Game result
 */
function playRPS(username, userChoice, betAmount) {
  // Normalize user choice
  userChoice = userChoice.toLowerCase();
  
  // Validate user choice
  if (!['rock', 'paper', 'scissors'].includes(userChoice)) {
    return {
      success: false,
      message: `Invalid choice. Please choose rock, paper, or scissors.`
    };
  }
  
  // Get bot's random choice
  const choices = ['rock', 'paper', 'scissors'];
  const botChoice = choices[Math.floor(Math.random() * choices.length)];
  
  // Determine winner
  let result;
  
  if (userChoice === botChoice) {
    result = 'tie';
  } else if (
    (userChoice === 'rock' && botChoice === 'scissors') ||
    (userChoice === 'paper' && botChoice === 'rock') ||
    (userChoice === 'scissors' && botChoice === 'paper')
  ) {
    result = 'win';
  } else {
    result = 'lose';
  }
  
  // Calculate payout
  let payout = 0;
  let message = '';
  
  // Add emojis for choices
  const choiceEmojis = {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️'
  };
  
  if (result === 'win') {
    payout = betAmount;
    updateBalance(username, payout, 'RPS win');
    message = `🎮 **Rock Paper Scissors**\n\n`;
    message += `You chose: ${choiceEmojis[userChoice]} ${userChoice}\n`;
    message += `Bot chose: ${choiceEmojis[botChoice]} ${botChoice}\n\n`;
    message += `🎉 **You win!** +${payout} coins`;
  } else if (result === 'lose') {
    payout = -betAmount;
    updateBalance(username, payout, 'RPS loss');
    message = `🎮 **Rock Paper Scissors**\n\n`;
    message += `You chose: ${choiceEmojis[userChoice]} ${userChoice}\n`;
    message += `Bot chose: ${choiceEmojis[botChoice]} ${botChoice}\n\n`;
    message += `😔 **You lose!** -${Math.abs(payout)} coins`;
  } else {
    message = `🎮 **Rock Paper Scissors**\n\n`;
    message += `You chose: ${choiceEmojis[userChoice]} ${userChoice}\n`;
    message += `Bot chose: ${choiceEmojis[botChoice]} ${botChoice}\n\n`;
    message += `🤝 **It's a tie!** Your coins have been returned.`;
  }
  
  return {
    success: true,
    message,
    result,
    userChoice,
    botChoice,
    payout
  };
}

/**
 * Play slot machine game
 * 
 * @param {string} username - Username of the player
 * @param {number} betAmount - Amount of coins bet
 * @returns {object} Game result
 */
function playSlots(username, betAmount) {
  // Define slot symbols and their values
  const symbols = ['🍒', '🍊', '🍋', '🍇', '🍉', '💎', '7️⃣'];
  const symbolValues = {
    '🍒': 1,   // Common
    '🍊': 1,   // Common
    '🍋': 1,   // Common
    '🍇': 2,   // Uncommon
    '🍉': 2,   // Uncommon
    '💎': 5,   // Rare
    '7️⃣': 10   // Very rare
  };
  
  // Function to select a random symbol with weighted probability
  function selectSymbol() {
    // Weight distribution (higher number = more common)
    const weights = [20, 20, 20, 10, 10, 5, 2];
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return symbols[i];
      }
      random -= weights[i];
    }
    
    // Fallback
    return symbols[0];
  }
  
  // Generate slot results (3 symbols)
  const slots = [
    selectSymbol(),
    selectSymbol(),
    selectSymbol()
  ];
  
  // Calculate winnings
  let winnings = 0;
  let message = '';
  
  // Check for matches
  if (slots[0] === slots[1] && slots[1] === slots[2]) {
    // Jackpot - all three match
    const multiplier = symbolValues[slots[0]] * 5;
    winnings = betAmount * multiplier;
    
    updateBalance(username, winnings, `Slot jackpot (${slots[0]})`);
    
    message = `🎰 **Slot Machine**\n\n`;
    message += `[ ${slots[0]} | ${slots[1]} | ${slots[2]} ]\n\n`;
    message += `🎉 **JACKPOT!** All symbols match!\n`;
    message += `You won ${winnings} coins! (${multiplier}x multiplier)`;
  } else if (slots[0] === slots[1] || slots[1] === slots[2] || slots[0] === slots[2]) {
    // Two matching symbols
    let matchedSymbol;
    if (slots[0] === slots[1]) matchedSymbol = slots[0];
    else if (slots[1] === slots[2]) matchedSymbol = slots[1];
    else matchedSymbol = slots[0];
    
    const multiplier = symbolValues[matchedSymbol] * 2;
    winnings = betAmount * multiplier;
    
    updateBalance(username, winnings, `Slot win (${matchedSymbol})`);
    
    message = `🎰 **Slot Machine**\n\n`;
    message += `[ ${slots[0]} | ${slots[1]} | ${slots[2]} ]\n\n`;
    message += `🎉 **Winner!** Two ${matchedSymbol} symbols!\n`;
    message += `You won ${winnings} coins! (${multiplier}x multiplier)`;
  } else {
    // No matches
    winnings = -betAmount;
    
    updateBalance(username, winnings, 'Slot loss');
    
    message = `🎰 **Slot Machine**\n\n`;
    message += `[ ${slots[0]} | ${slots[1]} | ${slots[2]} ]\n\n`;
    message += `😔 **No matches!** Better luck next time.\n`;
    message += `You lost ${Math.abs(winnings)} coins.`;
  }
  
  return {
    success: true,
    message,
    slots,
    winnings: winnings > 0 ? winnings : 0,
    net: winnings
  };
}

/**
 * Play coin flip game
 * 
 * @param {string} username - Username of the player
 * @param {string} userChoice - User's choice (heads or tails)
 * @param {number} betAmount - Amount of coins bet
 * @returns {object} Game result
 */
function coinFlip(username, userChoice, betAmount) {
  // Normalize user choice
  userChoice = userChoice.toLowerCase();
  
  // Validate user choice
  if (!['heads', 'tails'].includes(userChoice)) {
    return {
      success: false,
      message: `Invalid choice. Please choose heads or tails.`
    };
  }
  
  // Flip the coin
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  
  // Determine if user won
  const isWin = userChoice === result;
  
  // Calculate payout
  let payout = isWin ? betAmount : -betAmount;
  
  // Update user balance
  updateBalance(username, payout, isWin ? 'Coin flip win' : 'Coin flip loss');
  
  // Build message
  let message = `🪙 **Coin Flip**\n\n`;
  message += `You chose: ${userChoice === 'heads' ? '🧑' : '🪙'} ${userChoice}\n`;
  message += `Coin landed on: ${result === 'heads' ? '🧑' : '🪙'} ${result}\n\n`;
  
  if (isWin) {
    message += `🎉 **You win!** +${payout} coins`;
  } else {
    message += `😔 **You lose!** -${Math.abs(payout)} coins`;
  }
  
  return {
    success: true,
    message,
    userChoice,
    result,
    isWin,
    payout
  };
}

/**
 * Play dice game
 * 
 * @param {string} username - Username of the player
 * @param {number} betAmount - Amount of coins bet
 * @param {object} prediction - Prediction info (type and value)
 * @returns {object} Game result
 */
function rollDice(username, betAmount, prediction) {
  // Roll the dice (1-6)
  const roll = Math.floor(Math.random() * 6) + 1;
  
  // Dice emoji mapping
  const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const diceEmoji = diceEmojis[roll - 1];
  
  // Determine if prediction was correct
  let isWin = false;
  let multiplier = 1;
  
  if (prediction.type === 'exact') {
    // Exact number prediction (6x payout)
    isWin = roll === prediction.value;
    multiplier = 6;
  } else if (prediction.type === 'even') {
    // Even number prediction (2x payout)
    isWin = roll % 2 === 0;
    multiplier = 2;
  } else if (prediction.type === 'odd') {
    // Odd number prediction (2x payout)
    isWin = roll % 2 !== 0;
    multiplier = 2;
  } else if (prediction.type === 'high') {
    // High number prediction 4-6 (2x payout)
    isWin = roll >= 4;
    multiplier = 2;
  } else if (prediction.type === 'low') {
    // Low number prediction 1-3 (2x payout)
    isWin = roll <= 3;
    multiplier = 2;
  }
  
  // Calculate payout
  let payout = isWin ? betAmount * multiplier : -betAmount;
  
  // Update user balance
  updateBalance(username, payout, isWin ? `Dice win (${prediction.type})` : 'Dice loss');
  
  // Build message
  let message = `🎲 **Dice Roll**\n\n`;
  message += `You predicted: `;
  
  if (prediction.type === 'exact') {
    message += `number ${prediction.value}`;
  } else {
    message += `${prediction.type} number`;
  }
  
  message += `\nDice rolled: ${diceEmoji} ${roll}\n\n`;
  
  if (isWin) {
    message += `🎉 **You win!** +${isWin ? payout : 0} coins (${multiplier}x multiplier)`;
  } else {
    message += `😔 **You lose!** -${Math.abs(payout)} coins`;
  }
  
  return {
    success: true,
    message,
    roll,
    prediction: prediction.type === 'exact' ? prediction.value : prediction.type,
    isWin,
    payout: isWin ? payout : 0,
    net: payout
  };
}

module.exports = {
  playRPS,
  playSlots,
  coinFlip,
  rollDice
};