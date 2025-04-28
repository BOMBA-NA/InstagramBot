/**
 * Event handler for the Instagram bot
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from '../utils/logger.mjs';
import { generateId } from '../utils/helpers.mjs';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EventHandler {
  constructor(bot) {
    this.bot = bot;
    this.events = [];
    this.maxEvents = 1000; // Maximum number of events to store
    
    // Create events directory if it doesn't exist
    const eventsDir = path.join(__dirname, '../data');
    if (!fs.existsSync(eventsDir)) {
      fs.mkdirSync(eventsDir, { recursive: true });
    }
    
    this.eventsFile = path.join(eventsDir, 'events.json');
    
    // Load events from storage
    this.loadEvents();
    
    // Set up event listeners
    this.setupEventListeners();
    
    log('Event handler initialized', 'info');
  }
  
  /**
   * Set up event listeners for the bot
   */
  setupEventListeners() {
    // Common event types to log
    const eventTypes = [
      'started', 'stopped', 'commandExecuted', 
      'actionPerformed', 'automationStarted', 'automationStopped',
      'configUpdated', 'error'
    ];
    
    // Set up listeners for all event types
    for (const type of eventTypes) {
      this.bot.on(type, (eventData) => {
        // Add event to storage
        this.addEvent({
          id: generateId(),
          type,
          ...eventData,
          timestamp: eventData.timestamp || new Date()
        });
      });
    }
    
    log('Event listeners set up', 'debug');
  }
  
  /**
   * Add a new event
   * 
   * @param {object} eventData - Event data to add
   * @returns {object} The added event
   */
  addEvent(eventData) {
    // Add event to start of array (newest first)
    this.events.unshift(eventData);
    
    // Trim events if there are too many
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
    
    // Save events to storage
    this.saveEvents();
    
    return eventData;
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
    let filteredEvents = this.events;
    
    // Filter by type if provided
    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }
    
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
        log(`Loaded ${this.events.length} events from storage`, 'debug');
      } else {
        this.events = [];
        log('No events file found, starting with empty events', 'debug');
      }
    } catch (error) {
      this.events = [];
      log(`Error loading events: ${error.message}`, 'error');
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

export default EventHandler;