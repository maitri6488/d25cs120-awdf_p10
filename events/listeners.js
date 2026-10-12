const { taskEvents, recordLog } = require('./events');

const NOTIFICATION_DELAY = parseInt(process.env.NOTIFICATION_DELAY_MS, 10) || 2000;

// 1. Task Created Listener (Step 2 & Supplementary 3: 2-second async simulation)
taskEvents.on('task-created', (task) => {
    const startIso = new Date().toISOString();
    console.log(`[Listener:task-created] Handler started at: ${startIso} for task "${task.title}"`);
    recordLog('EVENT_START', `[Async Handler Started] Processing notification for "${task.title}"`, {
        taskTitle: task.title,
        assignedUser: task.assignedUser || 'admin@charusat.edu.in'
    });

    // Simulate slow asynchronous task (e.g. external email service / webhook)
    setTimeout(() => {
        try {
            // Simulated error case for demonstration
            if (task.title.toLowerCase().includes('fail_trigger')) {
                throw new Error('Simulated notification dispatch failure (SMTP Timeout)');
            }

            const completeIso = new Date().toISOString();
            console.log(`[Notification Complete] Notification sent to "${task.assignedUser || 'admin@charusat.edu.in'}" for task "${task.title}" at: ${completeIso}`);
            
            recordLog('EVENT_COMPLETE', `[Notification Completed] Email sent for "${task.title}" (+${NOTIFICATION_DELAY}ms later)`, {
                taskTitle: task.title,
                completedAt: completeIso
            });
        } catch (error) {
            // Forward error to dedicated error event listener
            taskEvents.emit('error', error);
        }
    }, NOTIFICATION_DELAY);
});

// 2. Task Deleted Listener (Supplementary Problem 1)
taskEvents.on('task-deleted', (task) => {
    const iso = new Date().toISOString();
    console.log(`[Listener:task-deleted] Task deletion recorded at: ${iso} (ID: ${task._id || task.id})`);
    
    recordLog('EVENT_COMPLETE', `[Task Deleted] Notification logged for deleted task (ID: ${task._id || task.id})`, {
        taskId: task._id || task.id
    });
});

// 3. Error Event Listener (Supplementary Problem 2: Catches errors thrown in handlers)
taskEvents.on('error', (err) => {
    const errorIso = new Date().toISOString();
    console.error(`[Listener:error] Background error caught safely at ${errorIso}: ${err.message}`);
    
    recordLog('ERROR', `[Error Event Caught] ${err.message}`, {
        error: err.message
    });
});

console.log('✓ EventEmitter listeners registered successfully');

module.exports = taskEvents;
