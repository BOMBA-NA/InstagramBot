/**
 * Event handler for the Instagram bot
 */

const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger');
const { generateId, formatTime } = require('../utils/helpers');

class EventHandler {
  constructor(bot) {
    this.bot = bot;
    this.events = [];
    
    // Set up event storage
    this.eventsDir = path.join(__dirname, '../data');
    this.eventsFile = path.join(this.eventsDir, 'events.json');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.eventsDir)) {
      fs.mkdirSync(this.eventsDir, { recursive: true });
    }
    
    // Load existing events
    this.loadEvents();
    
    // Set up event listeners
    this.setupEventListeners();
    
    log('Event handler initialized', 'info');
  }
  
  /**
   * Set up event listeners for the bot
   */
  setupEventListeners() {
    // Listen for bot events
    this.bot.on('actionPerformed', (eventData) => {
      this.addEvent(eventData);
    });
    
    this.bot.on('commandExecuted', (eventData) => {
      this.addEvent(eventData);
    });
    
    this.bot.on('automationStarted', (eventData) => {
      this.addEvent(eventData);
    });
    
    this.bot.on('automationStopped', (eventData) => {
      this.addEvent(eventData);
    });
    
    this.bot.on('configUpdated', (eventData) => {
      this.addEvent(eventData);
    });
    
    this.bot.on('started', (eventData) => {
      this.addEvent({
        type: 'system',
        target: 'bot',
        status: 'started',
        details: 'Bot started successfully',
        timestamp: eventData.time || new Date()
      });
    });
    
    this.bot.on('stopped', (eventData) => {
      this.addEvent({
        type: 'system',
        target: 'bot',
        status: 'stopped',
        details: 'Bot stopped',
        timestamp: eventData.time || new Date()
      });
    });
  }
  
  /**
   * Add a new event
   * 
   * @param {object} eventData - Event data to add
   * @returns {object} The added event
   */
  addEvent(eventData) {
    const event = {
      id: generateId(),
      type: eventData.type || 'unknown',
      target: eventData.target || '',
      status: eventData.status || 'unknown',
      details: eventData.details || '',
      timestamp: eventData.timestamp || new Date(),
      formattedTime: formatTime(eventData.timestamp || new Date())
    };
    
    // Add to in-memory events
    this.events.unshift(event);
    
    // Keep only the last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }
    
    // Save to disk periodically (not on every event to improve performance)
    this.saveEvents();
    
    log(`Event logged: [${event.type}] ${event.target} - ${event.status}`, 'debug');
    
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
    // Filter by type if provided
    let filteredEvents = type 
      ? this.events.filter(event => event.type === type)
      : this.events;
    
    // Apply pagination
    return filteredEvents.slice(offset, offset + limit);
  }
  
  /**
   * Load events from disk
   */
  loadEvents() {
    try {
      if (fs.existsSync(this.eventsFile)) {
        const data = fs.readFileSync(this.eventsFile, 'utf8');
        this.events = JSON.parse(data);
        log(`Loaded ${this.events.length} events from storage`, 'info');
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
      fs.writeFileSync(this.eventsFile, JSON.stringify(this.events, null, 2));
    } catch (error) {
      log(`Error saving events: ${error.message}`, 'error');
    }
  }
}

module.exports = EventHandler;