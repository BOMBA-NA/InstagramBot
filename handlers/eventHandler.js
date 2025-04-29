/**
 * Event handler for the Instagram bot
 */

const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger');
const { generateId } = require('../utils/helpers');

class EventHandler {
  constructor(bot) {
    this.bot = bot;
    this.events = [];
    this.maxEvents = 500; // Maximum number of events to store
    this.eventFile = path.join(__dirname, '../data/events.json');
    
    // Make sure data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Load events from disk
    this.loadEvents();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up event listeners for the bot
   */
  setupEventListeners() {
    // Listen for bot connection
    this.bot.on('connected', () => {
      this.addEvent({
        type: 'connection',
        description: 'Bot connected to Instagram'
      });
    });
    
    // Listen for bot disconnection
    this.bot.on('disconnected', () => {
      this.addEvent({
        type: 'connection',
        description: 'Bot disconnected from Instagram'
      });
    });
    
    // Listen for login
    this.bot.on('login', (username) => {
      this.addEvent({
        type: 'login',
        description: `Logged in as ${username}`,
        data: { username }
      });
    });
    
    // Listen for logout
    this.bot.on('logout', () => {
      this.addEvent({
        type: 'logout',
        description: 'Logged out from Instagram'
      });
    });
    
    // Listen for DM received
    this.bot.on('dm:received', (message) => {
      this.addEvent({
        type: 'dm',
        description: `DM received from ${message.user}`,
        data: {
          user: message.user,
          thread: message.threadId
        }
      });
    });
    
    // Listen for command executed
    this.bot.on('command:executed', (command, user, success) => {
      this.addEvent({
        type: 'command',
        description: `Command "${command}" ${success ? 'executed' : 'failed'} for ${user}`,
        data: {
          command,
          user,
          success
        }
      });
    });
    
    // Listen for errors
    this.bot.on('error', (error) => {
      this.addEvent({
        type: 'error',
        description: `Error: ${error.message}`,
        data: {
          error: error.message,
          stack: error.stack
        }
      });
    });
    
    log('Event listeners set up', 'info');
  }
  
  /**
   * Add a new event
   * 
   * @param {object} eventData - Event data to add
   * @returns {object} The added event
   */
  addEvent(eventData) {
    // Create event object
    const event = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      ...eventData
    };
    
    // Add to events array
    this.events.push(event);
    
    // Trim events if needed
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Save events to disk
    this.saveEvents();
    
    return event;
  }
  
  /**
   * Get recent events
   * 
   * @param {number} limit - Maximum number of events to return
   * @param {number} offset - Offset for pagination
   * @param {string} type - Optional filter by event type
   * @returns {array} Array of events
   */
  getEvents(limit = 10, offset = 0, type = null) {
    // Filter events if type is provided
    let filteredEvents = this.events;
    
    if (type) {
      filteredEvents = this.events.filter(event => event.type === type);
    }
    
    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Apply pagination
    return filteredEvents.slice(offset, offset + limit);
  }
  
  /**
   * Load events from disk
   */
  loadEvents() {
    try {
      if (fs.existsSync(this.eventFile)) {
        const data = JSON.parse(fs.readFileSync(this.eventFile, 'utf8'));
        
        if (Array.isArray(data)) {
          this.events = data;
          log(`Loaded ${this.events.length} events from disk`, 'info');
        } else {
          log('Invalid events data format, initializing empty events array', 'warning');
          this.events = [];
        }
      } else {
        log('No events file found, initializing empty events array', 'info');
        this.events = [];
      }
    } catch (error) {
      log(`Error loading events: ${error.message}`, 'error');
      this.events = [];
    }
  }
  
  /**
   * Save events to disk
   */
  saveEvents() {
    try {
      fs.writeFileSync(this.eventFile, JSON.stringify(this.events, null, 2), 'utf8');
    } catch (error) {
      log(`Error saving events: ${error.message}`, 'error');
    }
  }
  
  /**
   * Get login history
   * 
   * @param {number} limit - Maximum number of login events to return
   * @returns {array} Array of login events
   */
  getLoginHistory(limit = 10) {
    return this.getEvents(limit, 0, 'login');
  }
  
  /**
   * Get command history
   * 
   * @param {number} limit - Maximum number of command events to return
   * @returns {array} Array of command events
   */
  getCommandHistory(limit = 10) {
    return this.getEvents(limit, 0, 'command');
  }
  
  /**
   * Clear all events
   */
  clearEvents() {
    this.events = [];
    this.saveEvents();
    log('All events cleared', 'info');
  }
  
  /**
   * Get event statistics
   * 
   * @returns {object} Event statistics
   */
  getEventStats() {
    // Count events by type
    const typeStats = {};
    
    this.events.forEach(event => {
      const type = event.type || 'unknown';
      
      if (!typeStats[type]) {
        typeStats[type] = 0;
      }
      
      typeStats[type]++;
    });
    
    // Count events by time period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - (24 * 60 * 60 * 1000);
    const thisWeek = today - (7 * 24 * 60 * 60 * 1000);
    
    let todayCount = 0;
    let yesterdayCount = 0;
    let thisWeekCount = 0;
    
    this.events.forEach(event => {
      const eventTime = new Date(event.timestamp).getTime();
      
      if (eventTime >= today) {
        todayCount++;
      } else if (eventTime >= yesterday) {
        yesterdayCount++;
      }
      
      if (eventTime >= thisWeek) {
        thisWeekCount++;
      }
    });
    
    return {
      total: this.events.length,
      byType: typeStats,
      today: todayCount,
      yesterday: yesterdayCount,
      thisWeek: thisWeekCount
    };
  }
}

module.exports = EventHandler;