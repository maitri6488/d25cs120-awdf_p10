const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const { taskEvents, recordLog } = require('../events/events');

// In-memory fallback if MongoDB daemon is offline
let fallbackTasks = [
    { _id: '66fa01b123456789abcdef01', title: 'Setup Node.js EventEmitter', description: 'Create events.js module', priority: 'high', assignedUser: 'alice@charusat.edu.in', completed: true, createdAt: new Date() },
    { _id: '66fa01b123456789abcdef02', title: 'Register task-created Listener', description: 'Simulate background notification', priority: 'medium', assignedUser: 'bob@charusat.edu.in', completed: false, createdAt: new Date() }
];

// Helper: Fetch tasks from MongoDB or fallback
async function getTasksFromDatabase() {
    if (mongoose.connection.readyState === 1) {
        return await Task.find().sort({ createdAt: -1 });
    }
    return fallbackTasks;
}

// GET /tasks - Fetch all tasks
router.get('/', async (req, res, next) => {
    try {
        const tasks = await getTasksFromDatabase();
        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });
    } catch (error) {
        next(error);
    }
});

// POST /tasks - Step 3: Create task, send response immediately, then emit event
router.post('/', async (req, res, next) => {
    try {
        const { title, description, priority, assignedUser } = req.body || {};

        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required'
            });
        }

        let savedTask;
        if (mongoose.connection.readyState === 1) {
            const newTask = new Task({
                title: title.trim(),
                description: description || '',
                priority: priority || 'medium',
                assignedUser: assignedUser || 'student@charusat.edu.in'
            });
            savedTask = await newTask.save();
        } else {
            savedTask = {
                _id: 'temp_' + Date.now(),
                title: title.trim(),
                description: description || '',
                priority: priority || 'medium',
                assignedUser: assignedUser || 'student@charusat.edu.in',
                completed: false,
                createdAt: new Date()
            };
            fallbackTasks.unshift(savedTask);
        }

        const responseTimestamp = new Date().toISOString();
        console.log(`[API] Response sent at: ${responseTimestamp}`);
        
        recordLog('API', `[API Response 201] Response sent for "${savedTask.title}" at ${responseTimestamp}`, {
            taskTitle: savedTask.title,
            responseTimestamp
        });

        // Main response returns immediately to client (Step 3)
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task: savedTask,
            responseSentAt: responseTimestamp
        });

        // Emit 'task-created' event AFTER sending response (non-blocking side-effect)
        taskEvents.emit('task-created', savedTask);

    } catch (error) {
        next(error);
    }
});

// DELETE /tasks/:id - Supplementary Problem 1: Delete task & emit 'task-deleted' event
router.delete('/:id', async (req, res, next) => {
    try {
        let deletedTask;
        if (mongoose.connection.readyState === 1) {
            deletedTask = await Task.findByIdAndDelete(req.params.id);
        } else {
            const index = fallbackTasks.findIndex(t => t._id.toString() === req.params.id);
            if (index !== -1) {
                deletedTask = fallbackTasks.splice(index, 1)[0];
            }
        }

        if (!deletedTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const responseTimestamp = new Date().toISOString();
        console.log(`[API] Response sent for DELETE at: ${responseTimestamp}`);

        recordLog('API', `[API Response 200] Task deleted at ${responseTimestamp}`, {
            taskId: req.params.id,
            responseTimestamp
        });

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
            responseSentAt: responseTimestamp
        });

        // Emit 'task-deleted' event asynchronously
        taskEvents.emit('task-deleted', deletedTask);

    } catch (error) {
        next(error);
    }
});

module.exports = router;
