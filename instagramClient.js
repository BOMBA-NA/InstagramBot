const { log } = require('./utils/logger');
const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');
const path = require('path');

class InstagramClient {
  constructor(config, bot = null) {
    this.username = config.username;
    this.password = config.password;
    this.apiTimeout = config.apiTimeout || 30000;
    this.isLoggedIn = false;
    this.lastActivity = null;
    this.loginAttempts = 0;
    this.lastLoginAttempt = null;
    this.bot = bot; // Reference to the bot instance for event emitting
    this.ig = new IgApiClient(); // Instagram API client
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Path to store session data
    this.sessionFile = path.join(dataDir, `${this.username}_session.json`);
    
    log('Instagram client initialized', 'info');
  }
  
  async connect() {
    try {
      // Check if credentials are provided
      if (!this.username || this.username === 'your_instagram_username') {
        const errorMessage = 'Instagram username not configured';
        log('Login failed: Instagram username not configured in config.json', 'error');
        log('Please update your config.json with valid Instagram credentials', 'warning');
        
        // Emit login failed event for event handler
        if (this.bot) {
          this.bot.emit('loginFailed', {
            username: this.username || 'not_configured',
            errorMessage: errorMessage,
            timestamp: new Date()
          });
        }
        
        throw new Error(errorMessage);
      }
      
      if (!this.password || this.password === 'your_instagram_password') {
        const errorMessage = 'Instagram password not configured';
        log('Login failed: Instagram password not configured in config.json', 'error');
        log('Please update your config.json with valid Instagram credentials', 'warning');
        
        // Emit login failed event for event handler
        if (this.bot) {
          this.bot.emit('loginFailed', {
            username: this.username,
            errorMessage: errorMessage,
            timestamp: new Date()
          });
        }
        
        throw new Error(errorMessage);
      }
      
      this.loginAttempts++;
      this.lastLoginAttempt = new Date();
      log(`Attempting to connect to Instagram as ${this.username}... (Attempt #${this.loginAttempts})`, 'info');
      
      try {
        // Configure device for Instagram
        this.ig.state.generateDevice(this.username);
        
        // Try to load saved session if it exists
        try {
          if (fs.existsSync(this.sessionFile)) {
            log('Found saved session, attempting to restore...', 'info');
            const sessionData = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
            await this.ig.state.deserialize(sessionData);
            
            // Test if the session is still valid
            try {
              // Get basic profile information to test session
              await this.ig.account.currentUser();
              log('Session restored successfully', 'success');
              this.isLoggedIn = true;
            } catch (sessionError) {
              log('Saved session expired, will login with username/password', 'warning');
              // Session is no longer valid, proceed with normal login
            }
          }
        } catch (sessionLoadError) {
          log(`Could not restore session: ${sessionLoadError.message}`, 'warning');
          // Continue with normal login if session loading fails
        }
        
        // Only login with username/password if we're not already logged in
        if (!this.isLoggedIn) {
          log('Logging in with credentials...', 'info');
          
          // Login with username and password
          const loggedInUser = await this.ig.account.login(this.username, this.password);
          
          // Save session for future use
          const serialized = await this.ig.state.serialize();
          fs.writeFileSync(this.sessionFile, JSON.stringify(serialized));
          log('Session saved for future use', 'info');
          
          log(`Logged in as ${loggedInUser.username} (${loggedInUser.full_name})`, 'success');
          this.isLoggedIn = true;
        }
        
        // Set last activity timestamp
        this.lastActivity = new Date();
        log(`Successfully connected to Instagram as ${this.username}`, 'success');
        log(`Login timestamp: ${this.lastActivity.toISOString()}`, 'debug');
        
        // Emit login success event for event handler
        if (this.bot) {
          this.bot.emit('loginSuccess', {
            username: this.username,
            timestamp: this.lastActivity
          });
        }
        
        // Reset login attempts counter on successful login
        this.loginAttempts = 0;
        
        return true;
      } catch (authError) {
        // Handle specific authentication errors from the real Instagram API
        let errorMessage = authError.message;
        
        // Detect specific Instagram API error types
        if (errorMessage.includes('password') || errorMessage.includes('InvalidCredentials')) {
          log('Login failed: Invalid username or password', 'error');
          log('Please check your Instagram credentials in config.json', 'warning');
          errorMessage = 'Invalid username or password';
        } else if (errorMessage.includes('challenge') || errorMessage.includes('checkpoint')) {
          log('Login failed: Instagram security challenge required', 'error');
          log('You need to log in to Instagram website and complete the security challenge', 'warning');
          errorMessage = 'Security challenge required';
        } else if (errorMessage.includes('block') || errorMessage.includes('spam')) {
          log('Login failed: Account temporarily blocked', 'error');
          log('Your account has been temporarily blocked due to suspicious activity. Please wait or log in to Instagram website to resolve the issue.', 'warning');
          errorMessage = 'Account temporarily blocked';
        } else if (errorMessage.includes('limit') || errorMessage.includes('wait') || errorMessage.includes('try again')) {
          log('Login failed: API rate limit exceeded', 'error');
          log('Too many login attempts. Please wait before trying again.', 'warning');
          errorMessage = 'API rate limit exceeded';
        } else if (errorMessage.includes('sentry_block')) {
          log('Login failed: Account action blocked', 'error');
          log('Instagram has blocked this action. Your account may be flagged for suspicious activity.', 'warning');
          errorMessage = 'Account action blocked';
        } else {
          log(`Login failed: ${errorMessage}`, 'error');
        }
        
        // Emit login failed event for event handler
        if (this.bot) {
          this.bot.emit('loginFailed', {
            username: this.username,
            errorMessage: errorMessage,
            timestamp: new Date(),
            attempts: this.loginAttempts
          });
        }
        
        throw authError;
      }
    } catch (error) {
      // General connection errors
      log(`Instagram connection error: ${error.message}`, 'error');
      log(`Total login attempts: ${this.loginAttempts}`, 'debug');
      this.isLoggedIn = false;
      
      // Emit login failed event for event handler if not already emitted
      if (this.bot && !error.message.includes('not configured')) {
        this.bot.emit('loginFailed', {
          username: this.username || 'unknown',
          errorMessage: `Connection error: ${error.message}`,
          timestamp: new Date(),
          attempts: this.loginAttempts
        });
      }
      
      throw error;
    }
  }
  
  async disconnect() {
    try {
      log('Disconnecting from Instagram...', 'info');
      
      if (this.isLoggedIn) {
        // In instagram-private-api, we don't actually need to call a logout method
        // But we can clear the state to ensure we're logged out
        this.ig.state.clearCookies();
        
        // For extra security, you could rename or delete the session file
        // But we'll keep it for future use to avoid login rate limits
      }
      
      this.isLoggedIn = false;
      log(`Successfully logged out from Instagram account: ${this.username}`, 'info');
      return true;
    } catch (error) {
      log(`Instagram logout failed: ${error.message}`, 'error');
      throw error;
    }
  }
  
  // Check if a profile exists
  async checkProfile(username) {
    if (!this.isLoggedIn) {
      log('Not logged in to Instagram. Cannot check profile.', 'warning');
      throw new Error('Not logged in to Instagram');
    }
    
    try {
      // Clean up username (remove @ if present)
      if (username.startsWith('@')) {
        username = username.substring(1);
      }
      
      log(`Checking profile: ${username}`, 'info');
      
      // Use Instagram API to search for the user
      const searchResult = await this.ig.user.searchExact(username);
      
      if (searchResult) {
        log(`Profile found: ${username} (ID: ${searchResult.pk})`, 'info');
        
        // Store user ID for potential future use
        this.userIdCache = this.userIdCache || {};
        this.userIdCache[username] = searchResult.pk;
        
        return true;
      } else {
        log(`Profile not found: ${username}`, 'warning');
        return false;
      }
    } catch (error) {
      // Handle specific Instagram API errors
      if (error.message.includes('not found') || error.message.includes('invalid username')) {
        log(`Profile does not exist: ${username}`, 'warning');
        return false;
      }
      
      log(`Failed to check profile ${username}: ${error.message}`, 'error');
      throw error;
    }
  }
  
  // Like content from a user
  async likeContent(username) {
    if (!this.isLoggedIn) {
      log('Not logged in to Instagram. Cannot like content.', 'warning');
      return { success: false, message: 'Not logged in to Instagram' };
    }
    
    try {
      log(`Attempting to like content from ${username}`, 'info');
      
      // Clean up username (remove @ if present)
      if (username.startsWith('@')) {
        username = username.substring(1);
      }
      
      // Check if profile exists first and get user ID
      const profileExists = await this.checkProfile(username);
      if (!profileExists) {
        return { success: false, message: `Profile ${username} does not exist` };
      }
      
      // Get the user ID from our cache
      const userId = this.userIdCache[username];
      if (!userId) {
        return { success: false, message: `Could not retrieve user ID for ${username}` };
      }
      
      // Get user's feed
      log(`Fetching recent posts from ${username}...`, 'info');
      const userFeed = this.ig.feed.user(userId);
      const posts = await userFeed.items();
      
      if (!posts || posts.length === 0) {
        return { success: false, message: `${username} has no posts to like` };
      }
      
      // Like the most recent post
      const recentPost = posts[0];
      log(`Liking post with ID: ${recentPost.id}`, 'info');
      
      await this.ig.media.like({
        mediaId: recentPost.id,
        moduleInfo: {
          module_name: 'profile',
          user_id: userId,
          username: username
        },
        d: 1  // d=1 indicates it was a double-tap like
      });
      
      this.lastActivity = new Date();
      
      log(`Successfully liked post from ${username}`, 'success');
      return { 
        success: true, 
        message: `Liked post from ${username}`,
        details: {
          mediaId: recentPost.id,
          mediaType: recentPost.media_type,
          timestamp: recentPost.taken_at
        }
      };
    } catch (error) {
      // Handle specific errors
      if (error.message.includes('not authorized')) {
        log(`Failed to like content from ${username}: Account is private`, 'warning');
        return { success: false, message: `Cannot like content from ${username}: Account is private` };
      }
      
      if (error.message.includes('Blocked')) {
        log(`Failed to like content from ${username}: Action blocked`, 'error');
        return { success: false, message: `Cannot like content: Action blocked by Instagram. Try again later.` };
      }
      
      log(`Failed to like content from ${username}: ${error.message}`, 'error');
      return { success: false, message: `Failed to like content: ${error.message}` };
    }
  }
  
  // Follow a user
  async followUser(username) {
    if (!this.isLoggedIn) {
      log('Not logged in to Instagram. Cannot follow user.', 'warning');
      return { success: false, message: 'Not logged in to Instagram' };
    }
    
    try {
      log(`Attempting to follow user ${username}`, 'info');
      
      // Clean up username (remove @ if present)
      if (username.startsWith('@')) {
        username = username.substring(1);
      }
      
      // Check if profile exists first and get user ID
      const profileExists = await this.checkProfile(username);
      if (!profileExists) {
        return { success: false, message: `Profile ${username} does not exist` };
      }
      
      // Get the user ID from our cache
      const userId = this.userIdCache[username];
      if (!userId) {
        return { success: false, message: `Could not retrieve user ID for ${username}` };
      }
      
      // Get user info
      log(`Getting user info for ${username} (ID: ${userId})`, 'info');
      const userInfo = await this.ig.user.info(userId);
      
      // Check if user is private and not followed
      if (userInfo.is_private && !userInfo.friendship_status.following) {
        log(`Cannot automatically view content for ${username}: Account is private`, 'warning');
        // We can still follow private accounts, but just log a warning
      }
      
      // Follow the user
      log(`Following user ${username}...`, 'info');
      await this.ig.friendship.create(userId);
      
      this.lastActivity = new Date();
      
      log(`Successfully followed ${username}`, 'success');
      return { 
        success: true, 
        message: `Followed ${username}`,
        details: {
          userId: userId,
          isPrivate: userInfo.is_private,
          followedBy: userInfo.friendship_status.followed_by
        }
      };
    } catch (error) {
      // Handle specific errors
      if (error.message.includes('Blocked')) {
        log(`Failed to follow ${username}: Action blocked`, 'error');
        return { success: false, message: `Cannot follow ${username}: Action blocked by Instagram. Try again later.` };
      }
      
      if (error.message.includes('spam') || error.message.includes('limit')) {
        log(`Failed to follow ${username}: Rate limited`, 'error');
        return { success: false, message: `Cannot follow ${username}: You've reached Instagram's follow rate limit. Try again later.` };
      }
      
      log(`Failed to follow ${username}: ${error.message}`, 'error');
      return { success: false, message: `Failed to follow user: ${error.message}` };
    }
  }
  
  // Comment on user's content
  async commentOnContent(username, comment = null) {
    if (!this.isLoggedIn) {
      log('Not logged in to Instagram. Cannot comment on content.', 'warning');
      return { success: false, message: 'Not logged in to Instagram' };
    }
    
    try {
      log(`Attempting to comment on content from ${username}`, 'info');
      
      // Clean up username (remove @ if present)
      if (username.startsWith('@')) {
        username = username.substring(1);
      }
      
      // Check if profile exists first and get user ID
      const profileExists = await this.checkProfile(username);
      if (!profileExists) {
        return { success: false, message: `Profile ${username} does not exist` };
      }
      
      // Get the user ID from our cache
      const userId = this.userIdCache[username];
      if (!userId) {
        return { success: false, message: `Could not retrieve user ID for ${username}` };
      }
      
      // Get user's feed
      log(`Fetching recent posts from ${username}...`, 'info');
      const userFeed = this.ig.feed.user(userId);
      const posts = await userFeed.items();
      
      if (!posts || posts.length === 0) {
        return { success: false, message: `${username} has no posts to comment on` };
      }
      
      // Select the most recent post
      const recentPost = posts[0];
      log(`Commenting on post with ID: ${recentPost.id}`, 'info');
      
      // If no comment is provided, use a default
      const commentText = comment || "Great post! 👍";
      log(`Comment text: ${commentText}`, 'debug');
      
      // Post the comment
      const result = await this.ig.media.comment({
        mediaId: recentPost.id,
        text: commentText
      });
      
      this.lastActivity = new Date();
      
      log(`Successfully commented on post from ${username}`, 'success');
      return { 
        success: true, 
        message: `Commented on post from ${username}`,
        details: {
          mediaId: recentPost.id,
          commentId: result.id,
          commentText: commentText,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      // Handle specific errors
      if (error.message.includes('CommentsDisabled')) {
        log(`Failed to comment on ${username}'s content: Comments are disabled`, 'warning');
        return { success: false, message: `Cannot comment on ${username}'s content: Comments are disabled` };
      }
      
      if (error.message.includes('Blocked')) {
        log(`Failed to comment on ${username}'s content: Action blocked`, 'error');
        return { success: false, message: `Cannot comment: Action blocked by Instagram. Try again later.` };
      }
      
      if (error.message.includes('spam') || error.message.includes('limit')) {
        log(`Failed to comment on ${username}'s content: Rate limited`, 'error');
        return { success: false, message: `Cannot comment: You've reached Instagram's comment rate limit. Try again later.` };
      }
      
      if (error.message.includes('not authorized')) {
        log(`Failed to comment on ${username}'s content: Account is private`, 'warning');
        return { success: false, message: `Cannot comment on ${username}'s content: Account is private` };
      }
      
      log(`Failed to comment on ${username}'s content: ${error.message}`, 'error');
      return { success: false, message: `Failed to comment: ${error.message}` };
    }
  }
  
  // Test the Instagram connection
  async testConnection() {
    try {
      log('Testing Instagram API connection...', 'info');
      
      if (!this.isLoggedIn) {
        log('Not currently logged in. Attempting to connect...', 'warning');
        await this.connect();
      }
      
      // Fetch the current user's profile to test the connection
      log('Fetching current user profile...', 'info');
      const userInfo = await this.ig.account.currentUser();
      
      // Fetch account status
      const accountInfo = await this.ig.user.info(userInfo.pk);
      
      log(`API connection successful - Logged in as ${userInfo.username}`, 'success');
      log(`Account Status - Following: ${accountInfo.following_count}, Followers: ${accountInfo.follower_count}`, 'info');
      
      return {
        success: true, 
        message: 'Instagram API connection successful',
        user: {
          username: userInfo.username,
          fullName: userInfo.full_name,
          profilePic: userInfo.profile_pic_url,
          followingCount: accountInfo.following_count,
          followerCount: accountInfo.follower_count,
          mediaCount: accountInfo.media_count
        }
      };
    } catch (error) {
      log(`Instagram API connection test failed: ${error.message}`, 'error');
      return {
        success: false,
        message: `Instagram API connection test failed: ${error.message}`
      };
    }
  }
  
  // Helper method to simulate network delays
  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Send a direct message to a user
  async sendDirectMessage(username, message) {
    if (!this.isLoggedIn) {
      log('Not logged in to Instagram. Cannot send direct message.', 'warning');
      return { success: false, message: 'Not logged in to Instagram' };
    }
    
    try {
      log(`Attempting to send direct message to ${username}`, 'info');
      
      // Clean up username (remove @ if present)
      if (username.startsWith('@')) {
        username = username.substring(1);
      }
      
      // Find the user ID first
      let userId;
      
      // Check if we already have the user ID cached
      if (this.userIdCache && this.userIdCache[username]) {
        userId = this.userIdCache[username];
      } else {
        // Search for the user ID
        const userInfo = await this.ig.user.searchExact(username);
        if (!userInfo) {
          return { success: false, message: `User ${username} not found` };
        }
        userId = userInfo.pk;
        
        // Cache the user ID for future use
        this.userIdCache = this.userIdCache || {};
        this.userIdCache[username] = userId;
      }
      
      // Create a direct thread with the user
      const thread = this.ig.entity.directThread([userId.toString()]);
      
      // Send the message
      await thread.broadcastText(message);
      
      this.lastActivity = new Date();
      
      log(`Successfully sent direct message to ${username}`, 'success');
      return { success: true, message: `Message sent to ${username}` };
    } catch (error) {
      log(`Failed to send direct message to ${username}: ${error.message}`, 'error');
      return { success: false, message: `Failed to send message: ${error.message}` };
    }
  }
  
  // Listen for and process direct messages
  async listenForDirectMessages(commandPrefix = '*', commandHandler = null) {
    if (!this.isLoggedIn) {
      log('Not logged in to Instagram. Cannot listen for direct messages.', 'warning');
      return false;
    }
    
    try {
      log('Starting to listen for direct messages...', 'info');
      
      // Initialize inbox feed
      const inboxFeed = this.ig.feed.directInbox();
      let lastThreads = [];
      let lastCheck = new Date();
      
      // Set up listening at intervals
      this.dmPollingInterval = setInterval(async () => {
        try {
          if (!this.isLoggedIn) {
            log('No longer logged in. Stopping DM listener.', 'warning');
            clearInterval(this.dmPollingInterval);
            return;
          }
          
          // Get inbox threads
          const inbox = await inboxFeed.items();
          
          // Process each thread
          for (const thread of inbox) {
            // Skip threads with no items
            if (!thread.items || thread.items.length === 0) continue;
            
            // Get the latest message
            const latestMessage = thread.items[0];
            
            // Skip if we've already processed this message
            if (new Date(latestMessage.timestamp / 1000) <= lastCheck) continue;
            
            // Skip messages sent by us
            if (latestMessage.user_id === this.ig.state.cookieUserId) continue;
            
            // Only process text messages
            if (latestMessage.item_type !== 'text') continue;
            
            // Extract message text and sender
            const messageText = latestMessage.text;
            const senderId = latestMessage.user_id;
            
            // Get sender username
            let senderUsername = '';
            for (const user of thread.users) {
              if (user.pk === senderId) {
                senderUsername = user.username;
                break;
              }
            }
            
            log(`Received message from ${senderUsername}: ${messageText}`, 'info');
            
            // Check if it's a command
            if (messageText.startsWith(commandPrefix) && commandHandler) {
              const commandText = messageText.substring(commandPrefix.length).trim();
              
              // Execute the command
              log(`Processing command from ${senderUsername}: ${commandText}`, 'info');
              
              // Handle special case for "help" command directly
              if (commandText.toLowerCase() === 'help') {
                try {
                  // Get all commands from command handler
                  const commands = commandHandler.getAllCommands();
                  const isAdmin = commandHandler.bot.isAdmin(senderUsername);
                  
                  // Filter commands based on user permissions
                  const accessibleCommands = commands.filter(cmd => isAdmin || !cmd.adminOnly);
                  
                  if (accessibleCommands.length === 0) {
                    await this.sendDirectMessage(senderUsername, 'No commands available.');
                    return;
                  }
                  
                  let message = '📱 Available Commands:\n\n';
                  
                  // Regular commands first
                  const regularCommands = accessibleCommands.filter(cmd => !cmd.adminOnly);
                  if (regularCommands.length > 0) {
                    message += '🔹 Regular Commands:\n';
                    regularCommands.forEach(cmd => {
                      message += `• ${cmd.name}: ${cmd.description}\n`;
                    });
                    message += '\n';
                  }
                  
                  // Admin commands next, if the user is an admin
                  const adminCommands = accessibleCommands.filter(cmd => cmd.adminOnly);
                  if (adminCommands.length > 0 && isAdmin) {
                    message += '👑 Admin Commands:\n';
                    adminCommands.forEach(cmd => {
                      message += `• ${cmd.name}: ${cmd.description}\n`;
                    });
                    message += '\n';
                  }
                  
                  message += `For more information on a specific command, type: ${commandPrefix}help [command]`;
                  
                  await this.sendDirectMessage(senderUsername, message);
                  return;
                } catch (helpError) {
                  await this.sendDirectMessage(
                    senderUsername, 
                    `Error generating help: ${helpError.message}`
                  );
                  return;
                }
              }
              
              // For all other commands, use the command handler 
              // Note: false means the prefix is already removed
              const parsed = commandHandler.parseCommand(commandText, false);
              
              if (parsed) {
                const { name, params } = parsed;
                
                // Check if the sender is an admin
                const isAdmin = commandHandler.bot.isAdmin(senderUsername);
                
                // Check if command requires admin privileges
                const command = commandHandler.getCommand(name);
                if (command && command.adminOnly && !isAdmin) {
                  await this.sendDirectMessage(
                    senderUsername, 
                    `Command "${name}" requires admin privileges.`
                  );
                  return;
                }
                
                // Execute the command
                let response;
                try {
                  log(`Executing command "${name}" from user ${senderUsername}`, 'info');
                  response = await commandHandler.execute(name, params, senderUsername, isAdmin);
                } catch (cmdError) {
                  response = { 
                    success: false, 
                    message: `Error executing command: ${cmdError.message}` 
                  };
                }
                
                // Send the response back to the user
                const responseText = response.message || 
                  (response.success ? 'Command executed successfully.' : 'Command failed.');
                
                await this.sendDirectMessage(senderUsername, responseText);
              } else {
                // Unknown command
                await this.sendDirectMessage(
                  senderUsername, 
                  `Command not recognized. Type ${commandPrefix}help to see available commands.`
                );
              }
            }
          }
          
          // Update last check time
          lastCheck = new Date();
        } catch (pollingError) {
          log(`Error polling for direct messages: ${pollingError.message}`, 'error');
        }
      }, 10000); // Check every 10 seconds
      
      return true;
    } catch (error) {
      log(`Failed to set up direct message listener: ${error.message}`, 'error');
      return false;
    }
  }
  
  // Stop listening for direct messages
  stopListeningForDirectMessages() {
    if (this.dmPollingInterval) {
      clearInterval(this.dmPollingInterval);
      this.dmPollingInterval = null;
      log('Stopped listening for direct messages', 'info');
    }
  }
  
  /**
   * Upload a photo to Instagram
   * 
   * @param {string} filePath - Path to the photo file
   * @param {string} caption - Caption for the photo
   * @returns {Promise<object>} Result of the operation
   */
  async uploadPhoto(filePath, caption) {
    if (!this.ig || !this.isLoggedIn) {
      throw new Error('Not logged in to Instagram');
    }
    
    try {
      log(`Uploading photo to Instagram: ${filePath}`, 'info');
      
      // Upload the photo
      const publishResult = await this.ig.publish.photo({
        file: await this.ig.util.pathToBuffer(filePath),
        caption: caption
      });
      
      if (publishResult.status === 'ok') {
        log(`Photo uploaded successfully! Media ID: ${publishResult.media.id}`, 'success');
        
        return {
          success: true,
          mediaId: publishResult.media.id,
          message: 'Photo uploaded successfully'
        };
      } else {
        log(`Failed to upload photo: ${JSON.stringify(publishResult)}`, 'error');
        
        return {
          success: false,
          message: `Upload failed with status: ${publishResult.status}`
        };
      }
    } catch (error) {
      log(`Error uploading photo: ${error.message}`, 'error');
      
      return {
        success: false,
        message: `Error uploading photo: ${error.message}`
      };
    }
  }
  
  /**
   * Upload a video to Instagram
   * 
   * @param {string} filePath - Path to the video file
   * @param {string} caption - Caption for the video
   * @returns {Promise<object>} Result of the operation
   */
  async uploadVideo(filePath, caption) {
    if (!this.ig || !this.isLoggedIn) {
      throw new Error('Not logged in to Instagram');
    }
    
    try {
      log(`Uploading video to Instagram: ${filePath}`, 'info');
      
      // Upload the video
      const publishResult = await this.ig.publish.video({
        video: await this.ig.util.pathToBuffer(filePath),
        caption: caption
      });
      
      if (publishResult.status === 'ok') {
        log(`Video uploaded successfully! Media ID: ${publishResult.media.id}`, 'success');
        
        return {
          success: true,
          mediaId: publishResult.media.id,
          message: 'Video uploaded successfully'
        };
      } else {
        log(`Failed to upload video: ${JSON.stringify(publishResult)}`, 'error');
        
        return {
          success: false,
          message: `Upload failed with status: ${publishResult.status}`
        };
      }
    } catch (error) {
      log(`Error uploading video: ${error.message}`, 'error');
      
      return {
        success: false,
        message: `Error uploading video: ${error.message}`
      };
    }
  }
}

module.exports = InstagramClient;