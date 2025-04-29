/**
 * Hashtag command - explores and interacts with posts from a hashtag
 */

module.exports = {
  name: 'hashtag',
  description: 'Explores posts from a specific hashtag',
  usage: 'hashtag <name> [action] [count]',
  adminOnly: false,
  
  /**
   * Execute the hashtag command
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
        message: 'Missing parameters. Usage: hashtag <name> [action] [count]\n' +
                 'Actions: explore (default), like, comment'
      };
    }
    
    // Get hashtag name (remove # if present)
    let hashtagName = params[0];
    if (hashtagName.startsWith('#')) {
      hashtagName = hashtagName.substring(1);
    }
    
    // Get action parameter (default to explore)
    let action = 'explore';
    if (params.length > 1) {
      const inputAction = params[1].toLowerCase();
      if (['explore', 'like', 'comment'].includes(inputAction)) {
        action = inputAction;
      }
    }
    
    // Get count parameter (default to 5, max 10)
    let count = 5;
    if (params.length > 2 && !isNaN(params[2])) {
      count = parseInt(params[2]);
      if (count > 10) count = 10;
      if (count < 1) count = 1;
    }
    
    try {
      // Check if bot is running and logged in to Instagram
      if (!bot.isRunning || !bot.instagramClient || !bot.instagramClient.isLoggedIn) {
        return { success: false, message: 'Bot is not running or not logged in to Instagram.' };
      }
      
      // Emit command execution event
      bot.emit('commandExecuted', {
        command: 'hashtag',
        params: params,
        user: user,
        timestamp: new Date()
      });
      
      // Get Instagram client
      const instagramClient = bot.instagramClient;
      
      // Get posts from hashtag
      const hashtagFeed = instagramClient.ig.feed.tag(hashtagName);
      const posts = await hashtagFeed.items();
      
      if (!posts || posts.length === 0) {
        return { success: true, message: `No posts found for hashtag #${hashtagName}.` };
      }
      
      // Keep only requested number of posts
      const selectedPosts = posts.slice(0, count);
      
      // Process based on action
      if (action === 'explore') {
        // Format response with hashtag info
        let response = `📊 Hashtag #${hashtagName}\n\n`;
        
        selectedPosts.forEach((post, index) => {
          response += `${index + 1}. Post by @${post.user.username}\n`;
          
          // Post type
          if (post.media_type === 1) {
            response += `   📷 Photo`;
          } else if (post.media_type === 2) {
            response += `   🎬 Video`;
          } else if (post.media_type === 8) {
            response += `   🖼️ Album (${post.carousel_media_count} items)`;
          }
          
          // Engagement stats
          response += `\n   ❤️ ${post.like_count || 0} likes`;
          
          if (post.comment_count) {
            response += ` | 💬 ${post.comment_count} comments`;
          }
          
          // Caption
          if (post.caption && post.caption.text) {
            const caption = post.caption.text.slice(0, 50) + (post.caption.text.length > 50 ? '...' : '');
            response += `\n   Caption: ${caption}`;
          }
          
          response += '\n\n';
        });
        
        // Add suggestion for interaction
        response += `To interact with these posts, use: hashtag ${hashtagName} like`;
        
        return { success: true, message: response };
      } 
      else if (action === 'like') {
        // Like each post
        let likedCount = 0;
        
        for (const post of selectedPosts) {
          try {
            // Like the post
            await instagramClient.ig.media.like({
              mediaId: post.id,
              moduleInfo: {
                module_name: 'feed_timeline',
              },
              d: 0 // Not a double-tap
            });
            
            likedCount++;
            
            // Small delay between likes to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (likeError) {
            // Continue with other posts if one fails
            console.error(`Error liking post: ${likeError.message}`);
          }
        }
        
        return { 
          success: true, 
          message: `Liked ${likedCount} posts with hashtag #${hashtagName}.`
        };
      }
      else if (action === 'comment') {
        // Only admins can comment on hashtag posts
        if (!isAdmin) {
          return { 
            success: false, 
            message: 'Only admins can comment on hashtag posts to avoid spam.' 
          };
        }
        
        if (params.length < 4) {
          return { 
            success: false, 
            message: 'Missing comment text. Usage: hashtag <name> comment <count> <text>' 
          };
        }
        
        // Get comment text (everything after the count parameter)
        const commentText = params.slice(3).join(' ');
        
        // Comment on posts
        let commentedCount = 0;
        
        for (const post of selectedPosts) {
          try {
            // Post the comment
            await instagramClient.ig.media.comment({
              mediaId: post.id,
              text: commentText
            });
            
            commentedCount++;
            
            // Longer delay between comments to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (commentError) {
            // Continue with other posts if one fails
            console.error(`Error commenting on post: ${commentError.message}`);
          }
        }
        
        return { 
          success: true, 
          message: `Commented on ${commentedCount} posts with hashtag #${hashtagName}.`
        };
      }
      
      return { success: false, message: `Unknown action: ${action}` };
    } catch (error) {
      return { 
        success: false, 
        message: `Error exploring hashtag: ${error.message}` 
      };
    }
  }
};