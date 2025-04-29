# 🚀 Getting Started with InstaBot

This guide will walk you through the process of setting up and running your Instagram bot.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 14.0.0 or higher)
- npm (usually comes with Node.js)
- An Instagram account for your bot

## 📥 Installation

1. **Install necessary dependencies**

   The bot requires several dependencies to run properly. You can install them using npm:

   ```bash
   npm install instagram-private-api
   ```

2. **Setting up your configuration**

   Create a `config.json` file in the root directory of the project with the following structure:

   ```json
   {
     "instagram": {
       "username": "your_bot_instagram_username",
       "password": "your_bot_instagram_password"
     },
     "bot": {
       "prefix": "*",
       "owner": "your_personal_instagram_username",
       "admins": [],
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
     },
     "economy": {
       "startingBalance": 1000,
       "dailyReward": 500,
       "interestRate": 0.05,
       "maxLoanAmount": 5000
     },
     "features": {
       "economy": true,
       "games": true,
       "adminCommands": true,
       "eventLogging": true,
       "autoResponder": false
     }
   }
   ```

   Make sure to replace the placeholder values with your actual information.

## 📂 Directory Structure

Before starting the bot, make sure you have the following directory structure:

```
instabot/
├── data/                 # Data storage (will be created automatically)
├── handlers/
│   ├── commandHandler.js
│   └── eventHandler.js
├── logs/                 # Log files (will be created automatically)
├── modules/
│   └── commands/         # Command implementations
├── utils/
│   ├── configManager.js
│   ├── gameManager.js
│   ├── helpers.js
│   ├── logger.js
│   ├── sendMessage.js
│   └── userManager.js
├── config.json           # Your configuration file
├── index.js              # Main entry point
├── instagramClient.js    # Instagram API client
└── test-bot.js           # Test script
```

## 🏃‍♂️ Running the Bot

1. **Starting the bot**

   To start the bot, run:

   ```bash
   node index.js
   ```

2. **Testing without Instagram connection**

   For development and testing purposes, you can use the test script:

   ```bash
   node test-bot.js
   ```

   This allows you to test commands without connecting to Instagram.

## 🔍 Debugging

If you encounter issues:

1. Check the logs in the `logs` directory
2. Ensure your Instagram credentials are correct
3. Verify you have a stable internet connection
4. Check if the Instagram API has changed (may require updates)

## 🧩 Creating a Custom Command

Here's a step-by-step guide to creating your own command:

1. Create a new JavaScript file in the `modules/commands` directory, for example `mycommand.js`

2. Use this template:

   ```javascript
   /**
    * Mycommand - Description of what your command does
    */

   module.exports = {
     name: 'mycommand',
     aliases: ['mc', 'mycmd'],
     description: 'A custom command that does something awesome',
     usage: 'mycommand [parameter]',
     examples: [
       'mycommand',
       'mycommand parameter'
     ],
     category: 'utility',
     adminOnly: false,
     cooldown: 5,
     
     /**
      * Execute the command
      * 
      * @param {object} bot - The bot instance
      * @param {Array<string>} params - Command parameters
      * @param {string} user - Username who executed the command
      * @param {boolean} isAdmin - Whether the user is an admin
      * @returns {object} Command result
      */
     async execute(bot, params, user, isAdmin) {
       // Get the parameter, if provided
       const parameter = params.length > 0 ? params[0] : 'default';
       
       // Your command logic here
       const message = `Hello, @${user}! You executed the custom command with parameter: ${parameter}`;
       
       // Return the result
       return {
         success: true,
         message: message
       };
     }
   };
   ```

3. Customize the command logic

4. Save the file and restart the bot (or use the test script to test it)

## 📘 Using Bot Utilities

The bot provides several utility functions you can use in your custom commands:

### 1. **Send Direct Messages**

```javascript
const { sendDirectMessage } = require('../../utils/sendMessage');

// In your command's execute function:
const result = await sendDirectMessage(bot.client, 'username', 'Your message here');
```

### 2. **Managing User Economy**

```javascript
const { updateBalance, getUserEconomy } = require('../../utils/userManager');

// Get user's economy data
const economy = getUserEconomy(user);

// Update balance (add or subtract coins)
updateBalance(user, 100, 'Reward for using custom command');
```

### 3. **Logging**

```javascript
const { log } = require('../../utils/logger');

// Log different types of messages
log('Informational message', 'info');
log('Success message', 'success');
log('Warning message', 'warning');
log('Error message', 'error');
```

## 🔧 Adjusting Settings

To modify bot behavior:

1. Edit the `config.json` file manually to change settings
2. Create admin commands that use the `updateConfig` method:

```javascript
bot.updateConfig({
  bot: {
    prefix: '!', // Change command prefix
    dmPollingInterval: 15000 // Check DMs every 15 seconds
  }
});
```

## 🚪 Next Steps

Once you're comfortable with the basic setup:

1. Add more custom commands
2. Implement scheduled tasks
3. Customize the economy system
4. Create special commands for your community
5. Consider setting up a monitoring system for your bot

Remember to always comply with Instagram's terms of service and use your bot responsibly!

---

If you have any questions or need help, refer to the main README.md file or search online for more information about the specific Instagram API used by this bot.