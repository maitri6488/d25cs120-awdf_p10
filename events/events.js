const EventEmitter = require('events');

// Step 1: Dedicated EventEmitter subclass and singleton instance
class TaskEvents extends EventEmitter {}

const taskEvents = new TaskEvents();

// Shared log buffer to record timestamp evidence for live UI inspection
const eventLogs = [];

function recordLog(type, message, details = {}) {
    const entry = {
        id: Date.now() + Math.random(),
        type, // 'API' | 'EVENT_START' | 'EVENT_COMPLETE' | 'ERROR'
        timestamp: new Date().toISOString(),
        message,
        details
    };
    eventLogs.unshift(entry);
    if (eventLogs.length > 50) eventLogs.pop(); // Keep last 50 logs
    return entry;
}

module.exports = {
    taskEvents,
    eventLogs,
    recordLog
};
