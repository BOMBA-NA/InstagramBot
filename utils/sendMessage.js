/**
 * Message sending utilities for the Instagram bot
 */

const { log } = require('./logger');
const { randomItem, delay } = require('./helpers');

/**
 * Send a direct message to an Instagram user
 * 
 * @param {object} client - Instagram client instance
 * @param {string} username - Username to send message to
 * @param {string} message - Message content
 * @returns {Promise<object>} Result of the operation
 */
async function sendDirectMessage(client, username, message) {
  try {
    log(`Sending DM to @${username}`, 'info');
    
    // Check if client is logged in
    if (!client || !client.isLoggedIn) {
      throw new Error('Instagram client not logged in');
    }
    
    // Format username (remove @ if present)
    const formattedUsername = username.replace(/^@/, '');
    
    // Find the user by username
    const user = await client.ig.user.searchExact(formattedUsername);
    
    if (!user || !user.pk) {
      throw new Error(`User not found: ${formattedUsername}`);
    }
    
    // Create direct thread with user if none exists
    const thread = await client.ig.direct.createThread([user.pk.toString()]);
    
    // Simulate typing delay for more human-like behavior
    await simulateDelay(500 + Math.random() * 1500);
    
    // Send the message
    const result = await client.ig.direct.sendText({
      threadIds: [thread.thread_id],
      text: message
    });
    
    if (result.status !== 'ok') {
      throw new Error(`Failed to send message: ${result.status}`);
    }
    
    log(`DM sent successfully to @${formattedUsername}`, 'success');
    
    return {
      success: true,
      message: `Message sent to @${formattedUsername}`,
      threadId: thread.thread_id,
      recipient: formattedUsername
    };
  } catch (error) {
    log(`Error sending DM to @${username}: ${error.message}`, 'error');
    
    return {
      success: false,
      message: `Failed to send message: ${error.message}`,
      recipient: username
    };
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
  try {
    log(`Preparing to comment on @${username}'s content`, 'info');
    
    // Check if client is logged in
    if (!client || !client.isLoggedIn) {
      throw new Error('Instagram client not logged in');
    }
    
    // Format username (remove @ if present)
    const formattedUsername = username.replace(/^@/, '');
    
    // Find the user
    const user = await client.ig.user.searchExact(formattedUsername);
    
    if (!user || !user.pk) {
      throw new Error(`User not found: ${formattedUsername}`);
    }
    
    // Get user feed (recent posts)
    const userFeed = client.ig.feed.user(user.pk);
    const posts = await userFeed.items();
    
    if (!posts || posts.length === 0) {
      throw new Error(`No posts found for user: ${formattedUsername}`);
    }
    
    // Select the most recent post
    const post = posts[0];
    const mediaId = post.id;
    
    // Determine comment text (randomly select if array is provided)
    const commentText = Array.isArray(comment) ? randomItem(comment) : comment;
    
    if (!commentText) {
      throw new Error('Comment text is empty');
    }
    
    // Simulate delay before commenting
    await simulateDelay(1000 + Math.random() * 3000);
    
    // Post the comment
    const result = await client.ig.media.comment({
      mediaId,
      text: commentText
    });
    
    if (!result || !result.id) {
      throw new Error('Failed to post comment');
    }
    
    log(`Comment posted successfully on @${formattedUsername}'s post`, 'success');
    
    return {
      success: true,
      message: `Comment posted on @${formattedUsername}'s post`,
      mediaId,
      commentId: result.id,
      commentText
    };
  } catch (error) {
    log(`Error posting comment on @${username}'s content: ${error.message}`, 'error');
    
    return {
      success: false,
      message: `Failed to post comment: ${error.message}`,
      username
    };
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
  try {
    log(`Preparing to reply to @${username}'s comment`, 'info');
    
    // Check if client is logged in
    if (!client || !client.isLoggedIn) {
      throw new Error('Instagram client not logged in');
    }
    
    // Ensure we have the required parameters
    if (!mediaId || !commentId || !reply) {
      throw new Error('Missing required parameters for comment reply');
    }
    
    // Format the reply to ensure it mentions the user
    const formattedReply = reply.startsWith(`@${username}`) 
      ? reply 
      : `@${username} ${reply}`;
    
    // Simulate delay before replying
    await simulateDelay(800 + Math.random() * 2000);
    
    // Post the reply
    const result = await client.ig.media.comment({
      mediaId,
      text: formattedReply,
      replyToCommentId: commentId
    });
    
    if (!result || !result.id) {
      throw new Error('Failed to post comment reply');
    }
    
    log(`Reply posted successfully to @${username}'s comment`, 'success');
    
    return {
      success: true,
      message: `Reply posted to @${username}'s comment`,
      mediaId,
      replyCommentId: result.id,
      originalCommentId: commentId,
      replyText: formattedReply
    };
  } catch (error) {
    log(`Error posting reply to @${username}'s comment: ${error.message}`, 'error');
    
    return {
      success: false,
      message: `Failed to post reply: ${error.message}`,
      username
    };
  }
}

/**
 * Helper method to simulate network delays
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after the delay
 */
async function simulateDelay(ms) {
  return delay(ms);
}

module.exports = {
  sendDirectMessage,
  sendComment,
  sendCommentReply,
  simulateDelay
};