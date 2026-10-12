const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Critical: Require listeners at server startup so taskEvents.on(...) is registered
require('./events/listeners');

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/taskRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Serve static frontend UI
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/tasks', taskRoutes);
app.use('/api/events', eventRoutes);

// Root fallback
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

// Database & Server Startup
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskdb_events';

if (require.main === module) {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log('MongoDB connected successfully');
            app.listen(PORT, () => {
                console.log(`Practical 10 Server running at http://localhost:${PORT}`);
            });
        })
        .catch((err) => {
            console.error('MongoDB connection error:', err.message);
            console.log('Starting server in fallback mode (MongoDB disconnected)...');
            app.listen(PORT, () => {
                console.log(`Practical 10 Server running at http://localhost:${PORT}`);
            });
        });
}

module.exports = app;
