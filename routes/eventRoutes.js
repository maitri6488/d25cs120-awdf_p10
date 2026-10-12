const express = require('express');
const router = express.Router();
const { eventLogs, taskEvents, recordLog } = require('../events/events');

// GET /api/events/logs - Fetch real-time event logs and timestamp comparisons
router.get('/logs', (req, res) => {
    res.status(200).json({
        success: true,
        count: eventLogs.length,
        logs: eventLogs
    });
});

// POST /api/events/trigger-error - Supplementary Problem 2: Demonstrate error event listener
router.post('/trigger-error', (req, res) => {
    const errorMsg = 'Deliberate test error emitted to taskEvents';
    
    // Respond to client first
    res.status(200).json({
        success: true,
        message: 'Emitting test error to EventEmitter error listener...'
    });

    // Emit error event asynchronously
    taskEvents.emit('error', new Error(errorMsg));
});

// POST /api/events/clear-logs - Clear log buffer
router.post('/clear-logs', (req, res) => {
    eventLogs.length = 0;
    res.status(200).json({
        success: true,
        message: 'Event logs cleared'
    });
});

module.exports = router;
