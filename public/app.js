const createTaskForm = document.getElementById('create-task-form');
const taskTitle = document.getElementById('task-title');
const taskUser = document.getElementById('task-user');
const taskPriority = document.getElementById('task-priority');

const tasksList = document.getElementById('tasks-list');
const logsContainer = document.getElementById('logs-container');
const btnTriggerError = document.getElementById('btn-trigger-error');
const btnClearLogs = document.getElementById('btn-clear-logs');
const toast = document.getElementById('toast');

document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    fetchLogs();

    createTaskForm.addEventListener('submit', handleCreateTask);
    btnTriggerError.addEventListener('click', handleTriggerError);
    btnClearLogs.addEventListener('click', handleClearLogs);

    // Refresh logs every 1.5 seconds to capture async completions
    setInterval(fetchLogs, 1500);
});

function showToast(msg, type = 'info') {
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    setTimeout(() => {
        toast.className = 'toast hidden';
    }, 4000);
}

// Fetch Tasks
async function fetchTasks() {
    try {
        const res = await fetch('/tasks');
        const data = await res.json();
        renderTasks(data.tasks || []);
    } catch (err) {}
}

function renderTasks(tasks) {
    if (tasks.length === 0) {
        tasksList.innerHTML = '<li style="color: #888; text-align: center; padding: 12px;">No tasks available.</li>';
        return;
    }

    tasksList.innerHTML = tasks.map(t => `
        <li class="task-item" data-id="${t._id}">
            <div>
                <strong>${escapeHtml(t.title)}</strong>
                <div style="font-size: 0.75rem; color: #718096;">
                    Assigned: ${escapeHtml(t.assignedUser || 'student@charusat.edu.in')} &bull; ${t.priority || 'medium'}
                </div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteTask('${t._id}')">Delete</button>
        </li>
    `).join('');
}

// Create Task
async function handleCreateTask(e) {
    e.preventDefault();
    const title = taskTitle.value.trim();
    if (!title) return;

    try {
        const res = await fetch('/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                assignedUser: taskUser.value.trim(),
                priority: taskPriority.value
            })
        });

        const data = await res.json();
        if (data.success) {
            showToast(`API responded instantly at ${data.responseSentAt}! Background notification started (+2s delay).`, 'success');
            taskTitle.value = '';
            fetchTasks();
            fetchLogs();
        } else {
            showToast(data.message || 'Error creating task', 'error');
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// Delete Task (Emits task-deleted event)
async function deleteTask(id) {
    if (!confirm('Delete task and emit task-deleted event?')) return;
    try {
        const res = await fetch(`/tasks/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast('Task deleted! task-deleted event emitted.', 'info');
            fetchTasks();
            fetchLogs();
        }
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// Trigger Deliberate Error Event (Supplementary Problem 2)
async function handleTriggerError() {
    try {
        const res = await fetch('/api/events/trigger-error', { method: 'POST' });
        const data = await res.json();
        showToast(data.message, 'error');
        fetchLogs();
    } catch (err) {}
}

// Fetch & Render Real-time Logs
async function fetchLogs() {
    try {
        const res = await fetch('/api/events/logs');
        const data = await res.json();
        renderLogs(data.logs || []);
    } catch (err) {}
}

function renderLogs(logs) {
    if (logs.length === 0) {
        logsContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No event logs yet. Create a task to observe timestamps.</p>';
        return;
    }

    logsContainer.innerHTML = logs.map(log => {
        let typeClass = 'log-type-api';
        if (log.type === 'EVENT_START') typeClass = 'log-type-start';
        if (log.type === 'EVENT_COMPLETE') typeClass = 'log-type-complete';
        if (log.type === 'ERROR') typeClass = 'log-type-error';

        return `
            <div class="log-entry">
                <span class="log-time">${log.timestamp}</span>
                <span class="${typeClass}">${escapeHtml(log.message)}</span>
            </div>
        `;
    }).join('');
}

// Clear Logs
async function handleClearLogs() {
    try {
        await fetch('/api/events/clear-logs', { method: 'POST' });
        fetchLogs();
        showToast('Logs cleared', 'info');
    } catch (err) {}
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}
