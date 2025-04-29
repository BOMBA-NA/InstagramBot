/**
 * Followers command - gets and interacts with followers
 */

module.exports = {
  name: 'followers',
  description: 'Gets and interacts with your Instagram followers',
  usage: 'followers [count] [recent/action]',
  adminOnly: true,
  
  /**
   * Execute the followers command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    try {
      // Check if bot is running and logged in to Instagram
      if (!bot.isRunning || !bot.instagramClient || !bot.instagramClient.isLoggedIn) {
        return { success: false, message: 'Bot is not running or not logged in to Instagram.' };
      }
      
      // Emit command execution event
      bot.emit('commandExecuted', {
        command: 'followers',
        params: params,
        user: user,
        timestamp: new Date()
      });
      
      // Default to showing recent 10 followers
      let count = 10;
      let action = 'recent';
      
      // Parse parameters
      if (params.length > 0) {
        // First parameter could be count or action
        if (!isNaN(params[0])) {
          count = parseInt(params[0]);
          if (count < 1) count = 1;
          if (count > 50) count = 50; // Limit to 50 to avoid too long messages
          
          // Second parameter would be action if present
          if (params.length > 1) {
            action = params[1].toLowerCase();
          }
        } else {
          // First parameter is action
          action = params[0].toLowerCase();
        }
      }
      
      // Get the Instagram client
      const instagramClient = bot.instagramClient;
      
      // Get current account info
      const currentUser = await instagramClient.ig.account.currentUser();
      
      // Get followers
      const followersFeed = instagramClient.ig.feed.accountFollowers(currentUser.pk);
      let followers = [];
      
      // Get the requested number of followers
      // We need to do batched retrieval since the API might return them in chunks
      let page = 0;
      do {
        const items = await followersFeed.items();
        followers = followers.concat(items);
        page++;
      } while (followersFeed.isMoreAvailable() && followers.length < count);
      
      // Limit to requested count
      followers = followers.slice(0, count);
      
      if (followers.length === 0) {
        return { success: true, message: 'No followers found.' };
      }
      
      // Handle different actions
      switch (action) {
        case 'recent':
          return this.showRecentFollowers(followers);
          
        case 'follow':
          return this.followFollowers(bot, instagramClient, followers, user);
          
        case 'message':
          if (params.length < 3) {
            return { 
              success: false, 
              message: 'Missing message text. Usage: followers [count] message <text>' 
            };
          }
          
          // Get message text (everything after the action parameter)
          const startIndex = !isNaN(params[0]) ? 2 : 1;
          const messageText = params.slice(startIndex).join(' ');
          
          return this.messageFollowers(bot, instagramClient, followers, messageText, user);
          
        default:
          return { 
            success: false, 
            message: `Unknown action: ${action}. Available actions: recent, follow, message.` 
          };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error getting followers: ${error.message}` 
      };
    }
  },
  
  // Show recent followers
  async showRecentFollowers(followers) {
    let response = `👥 Recent Followers (${followers.length}):\n\n`;
    
    followers.forEach((follower, index) => {
      response += `${index + 1}. @${follower.username}`;
      
      if (follower.full_name) {
        response += ` - ${follower.full_name}`;
      }
      
      if (follower.is_private) {
        response += ` 🔒`;
      }
      
      if (follower.is_verified) {
        response += ` ✓`;
      }
      
      response += `\n`;
    });
    
    // Add suggestion for interaction
    response += `\nTo interact with these followers, use: followers [count] follow`;
    
    return { success: true, message: response };
  },
  
  // Follow back followers
  async followFollowers(bot, instagramClient, followers, user) {
    // For following back, we need to get who the user is already following
    const currentUser = await instagramClient.ig.account.currentUser();
    const followingFeed = instagramClient.ig.feed.accountFollowing(currentUser.pk);
    const following = await followingFeed.items();
    
    // Create a set of following user IDs for quick lookup
    const followingIds = new Set();
    following.forEach(followedUser => {
      followingIds.add(followedUser.pk);
    });
    
    // Find followers that aren't being followed back
    const notFollowingBack = followers.filter(follower => !followingIds.has(follower.pk));
    
    if (notFollowingBack.length === 0) {
      return { 
        success: true, 
        message: 'You are already following back all these followers.' 
      };
    }
    
    // Follow them back
    let followedCount = 0;
    const results = [];
    
    for (const follower of notFollowingBack) {
      try {
        // Follow the user
        await instagramClient.ig.friendship.create(follower.pk);
        followedCount++;
        
        // Add result
        results.push({
          username: follower.username,
          success: true
        });
        
        // Add a delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Emit event
        bot.emit('actionPerformed', {
          type: 'follow',
          target: follower.username,
          status: 'success',
          details: 'Follow back',
          timestamp: new Date(),
          user
        });
      } catch (followError) {
        // Add failed result
        results.push({
          username: follower.username,
          success: false,
          error: followError.message
        });
        
        // Emit event
        bot.emit('actionPerformed', {
          type: 'follow',
          target: follower.username,
          status: 'failed',
          details: followError.message,
          timestamp: new Date(),
          user
        });
      }
    }
    
    // Format response
    let response = `🔄 Follow Back Results:\n\n`;
    response += `✅ Successfully followed ${followedCount} of ${notFollowingBack.length} users\n\n`;
    
    // List failures if any
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      response += `❌ Failed to follow:\n`;
      failures.forEach(f => {
        response += `- @${f.username}: ${f.error}\n`;
      });
    }
    
    return { success: followedCount > 0, message: response };
  },
  
  // Message followers
  async messageFollowers(bot, instagramClient, followers, messageText, user) {
    if (messageText.trim().length === 0) {
      return { success: false, message: 'Message text cannot be empty.' };
    }
    
    // Send message to each follower
    let sentCount = 0;
    const results = [];
    
    for (const follower of followers) {
      try {
        // Send the message
        const result = await instagramClient.sendDirectMessage(follower.username, messageText);
        
        // Track result
        results.push({
          username: follower.username,
          success: result.success,
          message: result.message
        });
        
        if (result.success) {
          sentCount++;
        }
        
        // Add a delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Emit event
        bot.emit('actionPerformed', {
          type: 'message',
          target: follower.username,
          status: result.success ? 'success' : 'failed',
          details: result.message,
          timestamp: new Date(),
          user
        });
      } catch (sendError) {
        // Track failure
        results.push({
          username: follower.username,
          success: false,
          message: sendError.message
        });
        
        // Emit event
        bot.emit('actionPerformed', {
          type: 'message',
          target: follower.username,
          status: 'failed',
          details: sendError.message,
          timestamp: new Date(),
          user
        });
      }
    }
    
    // Format response
    let response = `📨 Message Results:\n\n`;
    response += `✅ Successfully sent to ${sentCount} of ${followers.length} followers\n\n`;
    
    // List failures if any
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      response += `❌ Failed to send to:\n`;
      failures.forEach(f => {
        response += `- @${f.username}: ${f.message}\n`;
      });
    }
    
    return { success: sentCount > 0, message: response };
  }
};