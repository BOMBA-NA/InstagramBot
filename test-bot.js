/**
 * Simple test script for the Instagram bot
 */

const bot = require('./index');

// Start the bot
bot.start().then(result => {
  console.log(result.message);
  
  // Test some commands
  setTimeout(async () => {
    console.log('\nTesting help command:');
    const helpResult = await bot.executeCommand('help', [], 'admin123', true);
    console.log(helpResult.message);
    
    console.log('\nTesting status command:');
    const statusResult = await bot.executeCommand('status', [], 'admin123', true);
    console.log(statusResult.message);
    
    // Test a user interaction
    console.log('\nTesting like command:');
    const likeResult = await bot.executeCommand('like', ['photography_daily'], 'admin123', true);
    console.log(likeResult.message);
    
    // Stop the bot after tests
    setTimeout(async () => {
      console.log('\nStopping bot:');
      const stopResult = await bot.stop();
      console.log(stopResult.message);
      
      // Exit process after all tests
      setTimeout(() => {
        console.log('\nTests completed. Exiting.');
        process.exit(0);
      }, 1000);
    }, 2000);
  }, 2000);
}).catch(error => {
  console.error('Error starting bot:', error);
});