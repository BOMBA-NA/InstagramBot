# 🤖 InstaBot - Instagram Automation Bot

A powerful, modular Instagram bot built with Node.js that responds to direct message commands, provides an economy system, games, and powerful admin controls.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen)

## ✨ Features

- 📱 Responds to Instagram DM commands using a prefix system (e.g., "*help")
- 💰 Full economy system with daily rewards, bank accounts, and loans
- 🎮 Mini-games with betting (RPS, slots, coinflip, dice)
- 📊 Analytics system for tracking usage and performance
- 👑 Admin control system for bot management
- 📷 Post creation capabilities for photos and videos
- 🔄 Event-based architecture for extensibility
- 📝 Modern logging system with console and file output
- 🌐 Modular command structure for easy customization

## 📋 Requirements

- Node.js 14.0.0 or higher
- An Instagram account for the bot
- Basic knowledge of JavaScript

## 🚀 Getting Started

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/instabot.git
   cd instabot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `config.json` file based on the default template (or run the bot once to generate it):
   ```json
   {
     "instagram": {
       "username": "your_bot_instagram_username",
       "password": "your_bot_instagram_password"
     },
     "bot": {
       "prefix": "*",
       "owner": "your_instagram_username",
       "admins": []
     }
   }
   ```

4. Start the bot:
   ```bash
   npm start
   ```

## 🛠️ Configuration

The configuration file (`config.json`) contains all settings for the bot. Here are the key sections:

### Instagram Credentials

```json
"instagram": {
  "username": "your_bot_instagram_username",
  "password": "your_bot_instagram_password"
}
```

### Bot Settings

```json
"bot": {
  "prefix": "*",
  "owner": "your_instagram_username",
  "admins": ["admin1", "admin2"],
  "version": "1.0.0",
  "cooldowns": {
    "default": 3,
    "commands": {
      "work": 1800,
      "daily": 86400,
      "game": 30
    }
  },
  "autoReconnect": true,
  "dmPollingInterval": 30000,
  "maxRetries": 3
}
```

### Economy Settings

```json
"economy": {
  "startingBalance": 1000,
  "dailyReward": 500,
  "interestRate": 0.05,
  "maxLoanAmount": 5000
}
```

### Feature Toggles

```json
"features": {
  "economy": true,
  "games": true,
  "adminCommands": true,
  "eventLogging": true,
  "autoResponder": false
}
```

## 💬 Available Commands

The bot comes with a variety of built-in commands:

### General Commands
- `*help` - Shows help information and available commands
- `*botinfo` - Displays information about the bot

### Economy Commands
- `*daily` - Collect daily rewards
- `*balance` - Check your balance
- `*bank` - Manage your bank account (deposit, withdraw, loan)
- `*work` - Earn coins by working
- `*send` - Send coins to another user

### Game Commands
- `*game rps <rock|paper|scissors> <bet>` - Play Rock Paper Scissors
- `*game slots <bet>` - Play the slot machine
- `*game coinflip <heads|tails> <bet>` - Flip a coin
- `*game dice <number|even|odd|high|low> <bet>` - Roll a dice

### Admin Commands
- `*admin list` - List all admins
- `*admin add <username>` - Add a new admin
- `*admin remove <username>` - Remove an admin
- `*analytics` - View bot analytics and statistics
- `*post <photo|video> <caption> <url>` - Create an Instagram post

## 🧩 Creating Custom Commands

The bot uses a modular command system that makes it easy to add new commands. Create a new file in the `modules/commands` directory following this template:

```javascript
/**
 * Example command - Description of what your command does
 */

module.exports = {
  name: 'example',                    // Command name (required)
  aliases: ['ex', 'sample'],          // Command aliases (optional)
  description: 'An example command',  // Command description
  usage: 'example [parameter]',       // Usage information
  examples: [                         // Example usages
    'example',
    'example parameter'
  ],
  category: 'utility',                // Command category for help menu
  adminOnly: false,                   // Whether only admins can use this command
  cooldown: 5,                        // Cooldown in seconds (optional)
  
  /**
   * Execute the command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - Username who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result with success status and message
   */
  async execute(bot, params, user, isAdmin) {
    // Your command logic here
    
    return {
      success: true,  // Whether the command executed successfully
      message: `Hello, @${user}! This is an example command.`
    };
  }
};
```

## 📁 Project Structure

```
instabot/
├── data/                 # Data storage
│   ├── economy.json      # Economy data
│   ├── events.json       # Event logs
│   └── users.json        # User data
├── handlers/             # Command and event handlers
│   ├── commandHandler.js # Command processing
│   └── eventHandler.js   # Event management
├── logs/                 # Log files
├── modules/              # Bot modules
│   └── commands/         # Command implementations
├── utils/                # Utility functions
│   ├── configManager.js  # Configuration management
│   ├── gameManager.js    # Game logic
│   ├── helpers.js        # Helper functions
│   ├── logger.js         # Logging system
│   ├── sendMessage.js    # Message sending utilities
│   └── userManager.js    # User data management
├── config.json           # Bot configuration
├── index.js              # Main entry point
├── instagramClient.js    # Instagram API client
├── package.json          # Project dependencies
└── README.md             # This file
```

## 🧪 Testing

You can use the `test-bot.js` script to test the bot without connecting to Instagram:

```bash
node test-bot.js
```

This will simulate command execution and help you debug new features.

## 🔒 Security

Never share your `config.json` file as it contains your Instagram credentials. If you're contributing to this project, make sure to exclude this file from your commits.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## ⚠️ Disclaimer

This bot is for educational purposes only. Using automation tools with Instagram may violate their Terms of Service. Use at your own risk.

---

Made with ❤️ using Node.js and Instagram Private API