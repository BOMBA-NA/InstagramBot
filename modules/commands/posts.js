/**
 * Posts command - shows recent posts from a user
 */

const { formatTime } = require('../../utils/helpers');

module.exports = {
  name: 'posts',
  description: 'Shows recent posts from an Instagram user',
  usage: 'posts <username> [count]',
  adminOnly: false,
  
  /**
   * Execute the posts command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    if (params.length < 1) {
      return { 
        success: false, 
        message: 'Missing parameters. Usage: posts <username> [count]' 
      };
    }
    
    const targetUsername = params[0];
    let count = 3; // Default to 3 posts
    
    // Check if count parameter is provided
    if (params.length > 1 && !isNaN(params[1])) {
      count = parseInt(params[1]);
      // Limit to reasonable number to avoid too long messages
      if (count > 5) count = 5;
      if (count < 1) count = 1;
    }
    
    try {
      // Check if bot is running and logged in to Instagram
      if (!bot.isRunning || !bot.instagramClient || !bot.instagramClient.isLoggedIn) {
        return { success: false, message: 'Bot is not running or not logged in to Instagram.' };
      }
      
      // Emit command execution event
      bot.emit('commandExecuted', {
        command: 'posts',
        params: params,
        user: user,
        timestamp: new Date()
      });
      
      // Clean up username (remove @ if present)
      let username = targetUsername;
      if (username.startsWith('@')) {
        username = username.substring(1);
      }
      
      // Get the Instagram client
      const instagramClient = bot.instagramClient;
      
      // First check if profile exists
      const profileExists = await instagramClient.checkProfile(username);
      if (!profileExists) {
        return { success: false, message: `Profile ${username} does not exist` };
      }
      
      // Get user ID from cache
      const userId = instagramClient.userIdCache[username];
      if (!userId) {
        return { success: false, message: `Could not retrieve user ID for ${username}` };
      }
      
      // Get user's feed
      const userFeed = instagramClient.ig.feed.user(userId);
      const posts = await userFeed.items();
      
      if (!posts || posts.length === 0) {
        return { success: true, message: `@${username} has no posts.` };
      }
      
      // Format the response
      let response = `📱 Recent posts from @${username}:\n\n`;
      
      // Get the requested number of posts (or all if less than requested)
      const recentPosts = posts.slice(0, count);
      
      recentPosts.forEach((post, index) => {
        const postDate = new Date(post.taken_at * 1000);
        const formattedDate = formatTime(postDate);
        
        response += `${index + 1}. Posted on ${formattedDate}\n`;
        
        // Post type
        if (post.media_type === 1) {
          response += `   📷 Photo`;
        } else if (post.media_type === 2) {
          response += `   🎬 Video`;
        } else if (post.media_type === 8) {
          response += `   🖼️ Album (${post.carousel_media_count} items)`;
        } else {
          response += `   📱 Post`;
        }
        
        // Caption
        if (post.caption && post.caption.text) {
          const caption = post.caption.text.slice(0, 100) + (post.caption.text.length > 100 ? '...' : '');
          response += `\n   Caption: ${caption}`;
        }
        
        // Engagement stats
        response += `\n   ❤️ ${post.like_count || 0} likes`;
        
        if (post.comment_count) {
          response += ` | 💬 ${post.comment_count} comments`;
        }
        
        // Add post ID for admins
        if (isAdmin) {
          response += `\n   ID: ${post.id}`;
        }
        
        response += '\n\n';
      });
      
      // Add a tip on how to interact with these posts
      response += `Tip: You can use the "like" command to like posts from this user.`;
      
      return { success: true, message: response };
    } catch (error) {
      return { 
        success: false, 
        message: `Error getting posts: ${error.message}` 
      };
    }
  }
};