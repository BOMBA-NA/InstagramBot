/**
 * User data and economy management for Instagram Bot
 */

const fs = require('fs');
const path = require('path');
const { log } = require('./logger');

// File paths
const USERS_FILE = path.join(__dirname, '../data/users.json');
const ECONOMY_FILE = path.join(__dirname, '../data/economy.json');

// Make sure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default loan settings
const LOAN_SETTINGS = {
  maxLoanAmount: 5000,
  maxOutstandingLoans: 1,
  loanDuration: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  interestRate: 0.10 // 10% interest
};

// Daily reward settings
const DAILY_REWARD = {
  amount: 500,
  cooldown: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

// Cache for users and economy data
let usersCache = null;
let economyCache = null;

/**
 * Load users data from file
 * @returns {object} Users data
 */
function loadUsers() {
  if (usersCache) return usersCache;
  
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      usersCache = data;
      return data;
    }
    
    // Initialize with empty data if file doesn't exist
    usersCache = {
      users: {}
    };
    
    // Save the empty data
    saveUsers(usersCache);
    
    return usersCache;
  } catch (error) {
    log(`Error loading users data: ${error.message}`, 'error');
    
    // Return empty data as fallback
    usersCache = {
      users: {}
    };
    
    return usersCache;
  }
}

/**
 * Save users data to file
 * @param {object} data - Users data to save
 * @returns {boolean} True if saved successfully
 */
function saveUsers(data) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
    usersCache = data;
    return true;
  } catch (error) {
    log(`Error saving users data: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Load economy data from file
 * @returns {object} Economy data
 */
function loadEconomy() {
  if (economyCache) return economyCache;
  
  try {
    if (fs.existsSync(ECONOMY_FILE)) {
      const data = JSON.parse(fs.readFileSync(ECONOMY_FILE, 'utf8'));
      economyCache = data;
      return data;
    }
    
    // Initialize with empty data if file doesn't exist
    economyCache = {
      users: {}
    };
    
    // Save the empty data
    saveEconomy(economyCache);
    
    return economyCache;
  } catch (error) {
    log(`Error loading economy data: ${error.message}`, 'error');
    
    // Return empty data as fallback
    economyCache = {
      users: {}
    };
    
    return economyCache;
  }
}

/**
 * Save economy data to file
 * @param {object} data - Economy data to save
 * @returns {boolean} True if saved successfully
 */
function saveEconomy(data) {
  try {
    fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2), 'utf8');
    economyCache = data;
    return true;
  } catch (error) {
    log(`Error saving economy data: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Get a user by username
 * @param {string} username - Username to get
 * @returns {object|null} User object or null if not found
 */
function getUser(username) {
  // Normalize username
  username = username.toLowerCase();
  
  const users = loadUsers();
  
  if (users.users[username]) {
    return users.users[username];
  }
  
  // Create user if it doesn't exist
  const newUser = {
    username: username,
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    commandUsage: {
      count: 0,
      lastCommand: null
    }
  };
  
  // Add to users
  users.users[username] = newUser;
  saveUsers(users);
  
  // Initialize economy for new user
  initializeUserEconomy(username);
  
  return newUser;
}

/**
 * Initialize economy data for a user
 * @param {string} username - Username to initialize
 * @returns {object} User economy data
 */
function initializeUserEconomy(username) {
  // Normalize username
  username = username.toLowerCase();
  
  const economy = loadEconomy();
  
  if (!economy.users[username]) {
    // Create new economy entry for user
    economy.users[username] = {
      balance: 1000, // Starting balance
      bank: 0,
      loan: 0,
      loanDue: null,
      lastDaily: null,
      dailyStreak: 0,
      transactions: []
    };
    
    saveEconomy(economy);
    
    // Log the initialization
    log(`Initialized economy for user ${username}`, 'info');
  }
  
  return economy.users[username];
}

/**
 * Get economy data for a user
 * @param {string} username - Username to get economy data for
 * @returns {object} User economy data
 */
function getUserEconomy(username) {
  // Normalize username
  username = username.toLowerCase();
  
  const economy = loadEconomy();
  
  if (!economy.users[username]) {
    return initializeUserEconomy(username);
  }
  
  return economy.users[username];
}

/**
 * Check if user can collect daily reward
 * @param {string} username - Username to check
 * @returns {object} Result with canCollect status and time left
 */
function canCollectDaily(username) {
  // Normalize username
  username = username.toLowerCase();
  
  const economy = getUserEconomy(username);
  
  // If never collected, they can collect
  if (!economy.lastDaily) {
    return {
      canCollect: true,
      hoursLeft: 0,
      minutesLeft: 0
    };
  }
  
  const now = Date.now();
  const lastDaily = new Date(economy.lastDaily).getTime();
  const timeDiff = now - lastDaily;
  
  // If cooldown has passed, they can collect
  if (timeDiff >= DAILY_REWARD.cooldown) {
    return {
      canCollect: true,
      hoursLeft: 0,
      minutesLeft: 0
    };
  }
  
  // Calculate time left
  const timeLeft = DAILY_REWARD.cooldown - timeDiff;
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    canCollect: false,
    hoursLeft,
    minutesLeft
  };
}

/**
 * Collect daily reward for a user
 * @param {string} username - Username to collect for
 * @returns {object} Result with success status and reward info
 */
function collectDaily(username) {
  // Normalize username
  username = username.toLowerCase();
  
  const economy = getUserEconomy(username);
  const now = new Date();
  
  // Calculate streak
  let streak = economy.dailyStreak || 0;
  const lastDaily = economy.lastDaily ? new Date(economy.lastDaily) : null;
  
  // If last daily was collected more than 48 hours ago, reset streak
  if (lastDaily && (now.getTime() - lastDaily.getTime()) > (48 * 60 * 60 * 1000)) {
    streak = 0;
  }
  
  // Increment streak
  streak++;
  
  // Update economy data
  economy.balance += DAILY_REWARD.amount;
  economy.lastDaily = now.toISOString();
  economy.dailyStreak = streak;
  
  // Add transaction record
  if (!economy.transactions) {
    economy.transactions = [];
  }
  
  economy.transactions.push({
    type: 'daily',
    amount: DAILY_REWARD.amount,
    description: `Daily reward (streak: ${streak})`,
    timestamp: now.toISOString()
  });
  
  // Save changes
  const economyData = loadEconomy();
  economyData.users[username] = economy;
  saveEconomy(economyData);
  
  // Log the reward
  log(`User ${username} collected daily reward: ${DAILY_REWARD.amount} coins (streak: ${streak})`, 'info');
  
  return {
    success: true,
    amount: DAILY_REWARD.amount,
    streak
  };
}

/**
 * Update a user's balance
 * @param {string} username - Username to update
 * @param {number} amount - Amount to add (positive) or subtract (negative)
 * @param {string} description - Description of the transaction
 * @returns {object} Result with success status and new balance
 */
function updateBalance(username, amount, description) {
  // Normalize username
  username = username.toLowerCase();
  
  const economy = getUserEconomy(username);
  
  // Determine transaction type
  const type = amount >= 0 ? 'credit' : 'debit';
  
  // Update balance
  economy.balance += amount;
  
  // Ensure balance is not negative
  if (economy.balance < 0) {
    economy.balance = 0;
  }
  
  // Add transaction record
  if (!economy.transactions) {
    economy.transactions = [];
  }
  
  economy.transactions.push({
    type,
    amount: Math.abs(amount),
    description,
    timestamp: new Date().toISOString()
  });
  
  // Limit transaction history to 50 items
  if (economy.transactions.length > 50) {
    economy.transactions = economy.transactions.slice(-50);
  }
  
  // Save changes
  const economyData = loadEconomy();
  economyData.users[username] = economy;
  saveEconomy(economyData);
  
  return {
    success: true,
    balance: economy.balance
  };
}

/**
 * Deposit money to bank
 * @param {string} username - Username to deposit for
 * @param {number} amount - Amount to deposit
 * @returns {object} Result with success status and new balances
 */
function bankDeposit(username, amount) {
  // Normalize username
  username = username.toLowerCase();
  
  const economy = getUserEconomy(username);
  
  // Check if user has enough money
  if (economy.balance < amount) {
    return {
      success: false,
      message: `You don't have enough coins to deposit. Your balance: ${economy.balance} coins.`
    };
  }
  
  // Transfer money to bank
  economy.balance -= amount;
  economy.bank += amount;
  
  // Add transaction record
  if (!economy.transactions) {
    economy.transactions = [];
  }
  
  economy.transactions.push({
    type: 'deposit',
    amount,
    description: 'Bank deposit',
    timestamp: new Date().toISOString()
  });
  
  // Save changes
  const economyData = loadEconomy();
  economyData.users[username] = economy;
  saveEconomy(economyData);
  
  return {
    success: true,
    message: `Successfully deposited ${amount} coins to your bank account.`,
    walletBalance: economy.balance,
    bankBalance: economy.bank
  };
}

/**
 * Withdraw money from bank
 * @param {string} username - Username to withdraw for
 * @param {number} amount - Amount to withdraw
 * @returns {object} Result with success status and new balances
 */
function bankWithdraw(username, amount) {
  // Normalize username
  username = username.toLowerCase();
  
  const economy = getUserEconomy(username);
  
  // Check if user has enough in bank
  if (economy.bank < amount) {
    return {
      success: false,
      message: `You don't have enough coins in your bank account. Bank balance: ${economy.bank} coins.`
    };
  }
  
  // Transfer money from bank
  economy.bank -= amount;
  economy.balance += amount;
  
  // Add transaction record
  if (!economy.transactions) {
    economy.transactions = [];
  }
  
  economy.transactions.push({
    type: 'withdraw',
    amount,
    description: 'Bank withdrawal',
    timestamp: new Date().toISOString()
  });
  
  // Save changes
  const economyData = loadEconomy();
  economyData.users[username] = economy;
  saveEconomy(economyData);
  
  return {
    success: true,
    message: `Successfully withdrew ${amount} coins from your bank account.`,
    walletBalance: economy.balance,
    bankBalance: economy.bank
  };
}

/**
 * Take a loan from the bank
 * @param {string} username - Username to give loan to
 * @param {number} amount - Loan amount
 * @returns {object} Result with success status and loan details
 */
function bankLoan(username, amount) {
  // Normalize username
  username = username.toLowerCase();
  
  const economy = getUserEconomy(username);
  
  // Check if user already has an outstanding loan
  if (economy.loan > 0) {
    return {
      success: false,
      message: `You already have an outstanding loan of ${economy.loan} coins. Please repay it before taking another loan.`
    };
  }
  
  // Check if loan amount is valid
  if (amount > LOAN_SETTINGS.maxLoanAmount) {
    return {
      success: false,
      message: `The maximum loan amount is ${LOAN_SETTINGS.maxLoanAmount} coins.`
    };
  }
  
  // Calculate loan due date
  const dueDate = new Date(Date.now() + LOAN_SETTINGS.loanDuration);
  
  // Update economy data
  economy.loan = amount;
  economy.loanDue = dueDate.toISOString();
  economy.balance += amount;
  
  // Add transaction record
  if (!economy.transactions) {
    economy.transactions = [];
  }
  
  economy.transactions.push({
    type: 'loan',
    amount,
    description: `Bank loan (due: ${dueDate.toDateString()})`,
    timestamp: new Date().toISOString()
  });
  
  // Save changes
  const economyData = loadEconomy();
  economyData.users[username] = economy;
  saveEconomy(economyData);
  
  return {
    success: true,
    message: `You've been approved for a loan of ${amount} coins. Please repay it by ${dueDate.toDateString()}.`,
    walletBalance: economy.balance,
    loanAmount: amount,
    dueDate: dueDate.toISOString()
  };
}

/**
 * Repay loan
 * @param {string} username - Username to repay loan for
 * @param {number} amount - Amount to repay
 * @returns {object} Result with success status and loan details
 */
function repayLoan(username, amount) {
  // Normalize username
  username = username.toLowerCase();
  
  const economy = getUserEconomy(username);
  
  // Check if user has an outstanding loan
  if (economy.loan <= 0) {
    return {
      success: false,
      message: `You don't have any outstanding loans to repay.`
    };
  }
  
  // Check if user has enough money
  if (economy.balance < amount) {
    return {
      success: false,
      message: `You don't have enough coins to repay this amount. Your balance: ${economy.balance} coins.`
    };
  }
  
  // Check if repayment amount is more than loan
  if (amount > economy.loan) {
    amount = economy.loan;
  }
  
  // Update economy data
  economy.loan -= amount;
  economy.balance -= amount;
  
  // Clear loan due date if fully repaid
  if (economy.loan <= 0) {
    economy.loanDue = null;
  }
  
  // Add transaction record
  if (!economy.transactions) {
    economy.transactions = [];
  }
  
  economy.transactions.push({
    type: 'repayment',
    amount,
    description: 'Loan repayment',
    timestamp: new Date().toISOString()
  });
  
  // Save changes
  const economyData = loadEconomy();
  economyData.users[username] = economy;
  saveEconomy(economyData);
  
  // Create response message
  let message = '';
  if (economy.loan <= 0) {
    message = `You've fully repaid your loan! Thank you for your business.`;
  } else {
    message = `You've repaid ${amount} coins of your loan. Remaining loan: ${economy.loan} coins.`;
  }
  
  return {
    success: true,
    message,
    walletBalance: economy.balance,
    remainingLoan: economy.loan
  };
}

/**
 * Send money to another user
 * @param {string} senderUsername - Username of sender
 * @param {string} receiverUsername - Username of receiver
 * @param {number} amount - Amount to send
 * @returns {object} Result with success status
 */
function sendMoney(senderUsername, receiverUsername, amount) {
  // Normalize usernames
  senderUsername = senderUsername.toLowerCase();
  receiverUsername = receiverUsername.toLowerCase();
  
  // Get sender economy data
  const senderEconomy = getUserEconomy(senderUsername);
  
  // Check if sender has enough money
  if (senderEconomy.balance < amount) {
    return {
      success: false,
      message: `You don't have enough coins to send. Your balance: ${senderEconomy.balance} coins.`
    };
  }
  
  // Get/create receiver economy data
  const receiverEconomy = getUserEconomy(receiverUsername);
  
  // Perform transfer
  senderEconomy.balance -= amount;
  receiverEconomy.balance += amount;
  
  // Add transaction records
  const timestamp = new Date().toISOString();
  
  // Sender transaction
  if (!senderEconomy.transactions) {
    senderEconomy.transactions = [];
  }
  
  senderEconomy.transactions.push({
    type: 'send',
    amount,
    description: `Sent to @${receiverUsername}`,
    timestamp
  });
  
  // Receiver transaction
  if (!receiverEconomy.transactions) {
    receiverEconomy.transactions = [];
  }
  
  receiverEconomy.transactions.push({
    type: 'receive',
    amount,
    description: `Received from @${senderUsername}`,
    timestamp
  });
  
  // Save changes
  const economyData = loadEconomy();
  economyData.users[senderUsername] = senderEconomy;
  economyData.users[receiverUsername] = receiverEconomy;
  saveEconomy(economyData);
  
  return {
    success: true,
    message: `Successfully sent ${amount} coins to @${receiverUsername}.`
  };
}

/**
 * Get top users by wealth
 * @param {number} limit - Maximum number of users to return
 * @returns {array} Array of top users with wealth info
 */
function getTopUsers(limit = 10) {
  const economy = loadEconomy();
  
  // Create array of users with wealth
  const users = Object.entries(economy.users).map(([username, data]) => ({
    username,
    balance: data.balance || 0,
    bank: data.bank || 0,
    wealth: (data.balance || 0) + (data.bank || 0)
  }));
  
  // Sort by total wealth (descending)
  users.sort((a, b) => b.wealth - a.wealth);
  
  // Return top users
  return users.slice(0, limit);
}

/**
 * Increment command usage for a user
 * @param {string} username - Username to increment for
 * @returns {object} Updated command usage info
 */
function incrementCommandUsage(username) {
  // Normalize username
  username = username.toLowerCase();
  
  // Get user data
  const userData = getUser(username);
  
  // Ensure command usage object exists
  if (!userData.commandUsage) {
    userData.commandUsage = {
      count: 0,
      lastCommand: null
    };
  }
  
  // Increment count
  userData.commandUsage.count++;
  userData.commandUsage.lastCommand = new Date().toISOString();
  
  // Update last seen
  userData.lastSeen = new Date().toISOString();
  
  // Save changes
  const users = loadUsers();
  users.users[username] = userData;
  saveUsers(users);
  
  return userData.commandUsage;
}

module.exports = {
  loadUsers,
  saveUsers,
  loadEconomy,
  saveEconomy,
  getUser,
  initializeUserEconomy,
  getUserEconomy,
  canCollectDaily,
  collectDaily,
  updateBalance,
  bankDeposit,
  bankWithdraw,
  bankLoan,
  repayLoan,
  sendMoney,
  getTopUsers,
  incrementCommandUsage
};