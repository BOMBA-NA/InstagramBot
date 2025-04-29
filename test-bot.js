/**
 * Simple test script for the Instagram bot
 */

const bot = require('./index');
const { formatTime } = require('./utils/helpers');

// Start the bot
bot.start().then(result => {
  console.log(result.message);
  
  // Test basic status
  setTimeout(async () => {
    console.log('\nTesting bot status:');
    const status = bot.getStatus();
    console.log(`- Running: ${status.isRunning}`);
    console.log(`- Login status: ${status.loginStatus}`);
    console.log(`- Uptime: ${status.uptime}`);
    
    // Test login history 
    console.log('\nLogin history:');
    const history = bot.getLoginHistory();
    if (history.length === 0) {
      console.log('No login events recorded yet.');
    } else {
      history.forEach((event, index) => {
        console.log(`${index + 1}. [${formatTime(event.timestamp)}] ${event.status}: ${event.details || event.username}`);
      });
    }
    
    // Test a user interaction
    console.log('\nTesting Instagram profile check:');
    try {
      const profileExists = await bot.client.checkProfile('example_user');
      console.log(`Profile check result: ${profileExists ? 'Exists' : 'Does not exist'}`);
    } catch (error) {
      console.log(`Profile check error: ${error.message}`);
    }
    
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