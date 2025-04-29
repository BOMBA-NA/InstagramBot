/**
 * Post command - Create Instagram posts using the bot account
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { log } = require('../../utils/logger');

module.exports = {
  name: 'post',
  description: 'Create Instagram posts using the bot account',
  usage: 'post <photo|video> <caption> [url]',
  examples: [
    'post photo Enjoying a beautiful day! https://example.com/image.jpg',
    'post video Check out this amazing sunset! https://example.com/video.mp4'
  ],
  category: 'social',
  adminOnly: true,
  
  /**
   * Execute the post command
   * 
   * @param {object} bot - The bot instance
   * @param {Array<string>} params - Command parameters
   * @param {string} user - User who executed the command
   * @param {boolean} isAdmin - Whether the user is an admin
   * @returns {object} Command result
   */
  async execute(bot, params, user, isAdmin) {
    // Check if parameters are valid
    if (params.length < 3) {
      return {
        success: false,
        message: `⚠️ Missing parameters. Usage: ${bot.config.bot.prefix}${this.usage}`
      };
    }
    
    const postType = params[0].toLowerCase();
    const mediaUrl = params[params.length - 1];
    
    // Extract caption (everything between post type and URL)
    const caption = params.slice(1, params.length - 1).join(' ');
    
    // Validate post type
    if (postType !== 'photo' && postType !== 'video') {
      return {
        success: false,
        message: `⚠️ Invalid post type. Please use 'photo' or 'video'.`
      };
    }
    
    // Validate URL
    if (!this.isValidUrl(mediaUrl)) {
      return {
        success: false,
        message: `⚠️ Invalid media URL. Please provide a valid URL to a photo or video.`
      };
    }
    
    try {
      // First, download the media
      const tempDir = path.join(os.tmpdir(), 'instagram-bot');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const fileExtension = path.extname(mediaUrl) || (postType === 'photo' ? '.jpg' : '.mp4');
      const tempFilePath = path.join(tempDir, `post_${Date.now()}${fileExtension}`);
      
      // Start uploading process
      const result = await this.uploadPost(bot, postType, tempFilePath, caption, mediaUrl);
      
      // Return the result
      if (result.success) {
        return {
          success: true,
          message: `✅ **Post Successfully Created**\n\n${result.message}`
        };
      } else {
        return {
          success: false,
          message: `❌ **Post Creation Failed**\n\n${result.message}`
        };
      }
    } catch (error) {
      log(`Error creating post: ${error.message}`, 'error');
      return {
        success: false,
        message: `❌ Post creation failed: ${error.message}`
      };
    }
  },
  
  /**
   * Validate if a string is a valid URL
   */
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },
  
  /**
   * Upload a post to Instagram
   */
  async uploadPost(bot, postType, filePath, caption, mediaUrl) {
    try {
      // Download the media file
      const downloadResult = await this.downloadMedia(mediaUrl, filePath);
      
      if (!downloadResult.success) {
        return downloadResult;
      }
      
      // Upload to Instagram based on post type
      if (postType === 'photo') {
        return await this.uploadPhoto(bot, filePath, caption);
      } else {
        return await this.uploadVideo(bot, filePath, caption);
      }
    } catch (error) {
      log(`Error uploading post: ${error.message}`, 'error');
      return {
        success: false,
        message: `Failed to upload post: ${error.message}`
      };
    } finally {
      // Cleanup: Delete the temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
  
  /**
   * Download media from URL to a local file
   */
  async downloadMedia(url, filePath) {
    try {
      log(`Downloading media from ${url}`, 'info');
      
      // Create a write stream to save the file
      const fileStream = fs.createWriteStream(filePath);
      
      // Use node-fetch or similar to download the file
      const response = await fetch(url);
      
      if (!response.ok) {
        return {
          success: false,
          message: `Failed to download media: HTTP ${response.status} ${response.statusText}`
        };
      }
      
      // Check content type to validate it's really a media file
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/') && !contentType.startsWith('video/')) {
        return {
          success: false,
          message: `The URL does not point to a valid media file. Content type: ${contentType}`
        };
      }
      
      // Pipe the response body to the file
      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
      
      log(`Media downloaded successfully to ${filePath}`, 'success');
      
      return {
        success: true,
        message: 'Media downloaded successfully',
        filePath
      };
    } catch (error) {
      log(`Error downloading media: ${error.message}`, 'error');
      return {
        success: false,
        message: `Failed to download media: ${error.message}`
      };
    }
  },
  
  /**
   * Upload a photo to Instagram
   */
  async uploadPhoto(bot, filePath, caption) {
    try {
      log(`Uploading photo to Instagram: ${filePath}`, 'info');
      
      // Use the Instagram client to upload the photo
      const result = await bot.client.uploadPhoto(filePath, caption);
      
      log(`Photo uploaded successfully`, 'success');
      
      return {
        success: true,
        message: `🖼️ Photo uploaded successfully!\n\nCaption: ${caption}`,
        mediaId: result.mediaId
      };
    } catch (error) {
      log(`Error uploading photo: ${error.message}`, 'error');
      return {
        success: false,
        message: `Failed to upload photo: ${error.message}`
      };
    }
  },
  
  /**
   * Upload a video to Instagram
   */
  async uploadVideo(bot, filePath, caption) {
    try {
      log(`Uploading video to Instagram: ${filePath}`, 'info');
      
      // Use the Instagram client to upload the video
      const result = await bot.client.uploadVideo(filePath, caption);
      
      log(`Video uploaded successfully`, 'success');
      
      return {
        success: true,
        message: `🎬 Video uploaded successfully!\n\nCaption: ${caption}`,
        mediaId: result.mediaId
      };
    } catch (error) {
      log(`Error uploading video: ${error.message}`, 'error');
      return {
        success: false,
        message: `Failed to upload video: ${error.message}`
      };
    }
  }
};