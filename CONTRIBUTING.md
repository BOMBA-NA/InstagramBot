# 🤝 Contributing to InstaBot

Thank you for considering contributing to InstaBot! This document provides guidelines and instructions for contributing to this project.

## 📋 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please be kind and considerate to others, and avoid any form of harassment or discrimination.

## 🚀 How Can I Contribute?

### 🐛 Reporting Bugs

If you find a bug, please create an issue with the following information:

- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Any relevant logs or screenshots
- Your environment (Node.js version, OS, etc.)

### 💡 Suggesting Features

Have an idea for a new feature? Create an issue with:

- A clear, descriptive title
- A detailed description of the feature
- How this feature would benefit the project
- Any relevant examples or mockups

### 🛠️ Pull Requests

We welcome pull requests! Here's how to submit one:

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes
4. Test your changes thoroughly
5. Submit a pull request with a clear description of your changes

## 📝 Development Guidelines

### Code Style

- Use consistent indentation (2 spaces)
- Follow JavaScript best practices
- Write clear, descriptive variable and function names
- Include JSDoc comments for functions and classes

### Command Development

When creating new commands:

1. Place command files in the `modules/commands` directory
2. Follow the existing command structure
3. Include proper documentation (description, usage, examples)
4. Ensure commands return proper success/failure objects
5. Add appropriate error handling

Example command structure:

```javascript
/**
 * Command name - Brief description
 */

module.exports = {
  name: 'commandname',
  aliases: ['alias1', 'alias2'],
  description: 'Detailed description',
  usage: 'commandname <required_param> [optional_param]',
  examples: [
    'commandname required',
    'commandname required optional'
  ],
  category: 'category',
  adminOnly: false,
  cooldown: 5, // in seconds
  
  async execute(bot, params, user, isAdmin) {
    // Command logic here
    
    return {
      success: true,
      message: 'Response message'
    };
  }
};
```

### Testing

Before submitting your changes:

1. Test your code using the `test-bot.js` script
2. Ensure all existing functionality still works
3. Add appropriate error handling
4. Make sure your code doesn't introduce any performance issues

## 📂 Project Structure

Understanding the project structure will help you contribute effectively:

```
instabot/
├── data/                 # Data storage
├── handlers/             # Command and event handlers
├── logs/                 # Log files
├── modules/
│   └── commands/         # Command implementations
├── utils/                # Utility functions
├── config.json           # Bot configuration
├── index.js              # Main entry point
└── instagramClient.js    # Instagram API client
```

## 🔐 Security Best Practices

When contributing, please follow these security practices:

- Never commit sensitive information (API keys, passwords, etc.)
- Use environment variables for sensitive data
- Sanitize user input
- Implement proper error handling
- Be cautious with third-party libraries

## 🧪 Testing Your Changes

You can test your changes using the test script:

```bash
node test-bot.js
```

This allows you to simulate command execution without connecting to Instagram.

## 📚 Documentation

Good documentation is essential. When contributing:

- Update relevant documentation for your changes
- Document new features, commands, or utilities
- Use JSDoc comments for functions and classes
- Include examples where appropriate

## 🎯 Focus Areas

We're especially interested in contributions in these areas:

- Enhanced security features
- Performance optimizations
- Additional game modules
- More social media integrations
- Improved error handling
- Better logging and analytics

## ❓ Questions?

If you have any questions about contributing, feel free to open an issue asking for clarification.

Thank you for helping improve InstaBot!