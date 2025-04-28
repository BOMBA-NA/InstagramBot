/**
 * Message sending utilities for the Instagram bot
 */

const { log } = require('./logger');
const { formatUsername, randomItem } = require('./helpers');

/**
 * Send a direct message to an Instagram user
 * 
 * @param {object} client - Instagram client instance
 * @param {string} username - Username to send message to
 * @param {string} message - Message content
 * @returns {Promise<object>} Result of the operation
 */
async function sendDirectMessage(client, username, message) {
  if (!client || !client.isLoggedIn) {
    return { success: false, message: 'Not logged in to Instagram' };
  }
  
  if (!username || !message) {
    return { success: false, message: 'Username and message are required' };
  }
  
  try {
    const formattedUsername = formatUsername(username);
    
    log(`Sending direct message to ${formattedUsername}`, 'info');
    
    // In a real implementation, use the Instagram Private API
    // Example:
    // const thread = await client.ig.directThread.create([userId]);
    // await thread.broadcastText(message);
    
    // For our simulation:
    await simulateDelay(1500);
    
    // Randomly simulate some failures (for demonstration)
    if (username.includes('blocked_')) {
      return { success: false, message: `Cannot send message to ${formattedUsername}: This user has blocked you` };
    }
    
    log(`Successfully sent message to ${formattedUsername}`, 'success');
    return { success: true, message: `Message sent to ${formattedUsername}` };
  } catch (error) {
    log(`Failed to send message to ${username}: ${error.message}`, 'error');
    return { success: false, message: `Failed to send message: ${error.message}` };
  }
}

/**
 * Send a comment on a user's content
 * 
 * @param {object} client - Instagram client instance
 * @param {string} username - Username to comment on
 * @param {string|Array<string>} comment - Comment text or array of possible comments
 * @returns {Promise<object>} Result of the operation
 */
async function sendComment(client, username, comment) {
  if (!client || !client.isLoggedIn) {
    return { success: false, message: 'Not logged in to Instagram' };
  }
  
  if (!username || !comment) {
    return { success: false, message: 'Username and comment are required' };
  }
  
  try {
    const formattedUsername = formatUsername(username);
    
    // If an array of comments is provided, pick a random one
    const commentText = Array.isArray(comment) ? randomItem(comment) : comment;
    
    log(`Commenting on ${formattedUsername}'s content: "${commentText}"`, 'info');
    
    // In a real implementation, use the Instagram Private API
    // Example:
    // const userFeed = await client.ig.feed.user(userId);
    // const posts = await userFeed.items();
    // await client.ig.media.comment({ mediaId: posts[0].id, text: commentText });
    
    // For our simulation:
    await simulateDelay(1500);
    
    // Randomly simulate some failures (for demonstration)
    if (username.includes('restricted_')) {
      return { success: false, message: `Cannot comment on ${formattedUsername}'s content: Comments are restricted` };
    }
    
    log(`Successfully commented on ${formattedUsername}'s content`, 'success');
    return { success: true, message: `Comment posted on ${formattedUsername}'s content` };
  } catch (error) {
    log(`Failed to comment on ${username}'s content: ${error.message}`, 'error');
    return { success: false, message: `Failed to post comment: ${error.message}` };
  }
}

/**
 * Send a reply to a comment
 * 
 * @param {object} client - Instagram client instance
 * @param {string} username - Username who posted the original comment
 * @param {string} mediaId - Media ID of the post
 * @param {string} commentId - Comment ID to reply to
 * @param {string} reply - Reply text
 * @returns {Promise<object>} Result of the operation
 */
async function sendCommentReply(client, username, mediaId, commentId, reply) {
  if (!client || !client.isLoggedIn) {
    return { success: false, message: 'Not logged in to Instagram' };
  }
  
  if (!username || !mediaId || !commentId || !reply) {
    return { success: false, message: 'Username, mediaId, commentId, and reply are required' };
  }
  
  try {
    const formattedUsername = formatUsername(username);
    
    log(`Replying to ${formattedUsername}'s comment: "${reply}"`, 'info');
    
    // In a real implementation, use the Instagram Private API
    // Example:
    // await client.ig.media.comment({
    //   mediaId,
    //   text: reply,
    //   replyToCommentId: commentId
    // });
    
    // For our simulation:
    await simulateDelay(1000);
    
    log(`Successfully replied to ${formattedUsername}'s comment`, 'success');
    return { success: true, message: `Reply posted to ${formattedUsername}'s comment` };
  } catch (error) {
    log(`Failed to reply to ${username}'s comment: ${error.message}`, 'error');
    return { success: false, message: `Failed to post reply: ${error.message}` };
  }
}

/**
 * Helper method to simulate network delays
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after the delay
 */
async function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  sendDirectMessage,
  sendComment,
  sendCommentReply
};