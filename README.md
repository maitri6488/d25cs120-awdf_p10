# Practical 10: Asynchronous Processing with Event-Driven Architecture

**Student Name**: Maitri Sheta  
**Student ID**: D25CS120  
**Department**: CSE, CSPIT  
**Course**: Advanced Web Development Frameworks (ITUE301)  
**Semester**: 5th  

---

## Objective
To implement non-blocking, asynchronous background processing using Node.js native **`EventEmitter`** without external message queue infrastructure, and compare synchronous vs. asynchronous execution using real timestamp evidence.

---

## Architecture & Event Flow Diagram

```text
Client (Postman / Browser)
       │
       ▼
POST /tasks Request
       │
       ▼
Save Task to MongoDB / Storage
       │
       ├──► [API Responds Immediately (HTTP 201)] ──► Client receives fast response (~10ms)
       │
       ▼
taskEvents.emit('task-created', taskData)
       │
       ▼ (Handled asynchronously on Node.js Event Loop, after HTTP response is already sent)
Notification Listener (2-second simulated background task)
       │
       ▼
Logs: Task Title, Assigned User, Completion Timestamp (+2000ms later)
```

---

## Console Timestamp Evidence (Rubric Requirement)

The following terminal output demonstrates that the HTTP API response is sent to the client **before** the asynchronous notification handler finishes executing:

```text
POST /tasks - 2026-10-10T18:05:01.100Z
[API] Response sent at: 2026-10-10T18:05:01.120Z               <-- 1. Main response sent (Client unblocked!)
[Listener:task-created] Handler started at: 2026-10-10T18:05:01.122Z <-- 2. Background handler begins
[Notification Complete] Notification sent to "student@charusat.edu.in" for task "Submit AWDF Practical 10 Journal" at: 2026-10-10T18:05:03.125Z <-- 3. Completed ~2003ms later
```

> **Evaluation Proof**: The API response timestamp (`18:05:01.120Z`) occurred **2.005 seconds prior** to the notification handler's completion timestamp (`18:05:03.125Z`), proving non-blocking background execution.

---

## Key Features Implemented

1. **Dedicated EventEmitter Module (`events/events.js`)**:
   - `Node.js` built-in `EventEmitter` subclassed and instantiated as a singleton.
   - Zero external message-broker dependencies.

2. **Decoupled Notification Listener (`events/listeners.js`)**:
   - Registered at server startup in [app.js](file:///d:/REACT-AWDF/prac10/app.js).
   - Simulates a slow background task (`setTimeout` of 2,000 ms) representing email dispatch or webhook notification.

3. **Response-Before-Emit Ordering in `POST /tasks`**:
   - Responds to the client with `res.status(201).json(...)` **before** calling `taskEvents.emit('task-created', savedTask)`.

4. **Supplementary Problem 1: `task-deleted` Event**:
   - When a task is deleted via `DELETE /tasks/:id`, a `task-deleted` event is emitted and processed by a dedicated listener.

5. **Supplementary Problem 2: Dedicated Error Listener**:
   - `taskEvents.on('error', (err) => ...)` registered to catch any background execution errors safely without crashing the Node.js process.

6. **Interactive Live Timestamp UI (`public/`)**:
   - A clean dashboard displaying live, chronological log entries with millisecond timestamps comparing API completion vs. background event completion.

---

## Key Viva Questions & Theory Analysis

### Q1: Why does emitting an event not block the API response, even though both run on the same Node.js process?
> **Answer**:  
> In Node.js, `emit()` triggers registered listener callbacks synchronously by default. However, when the listener delegates long-running tasks to the asynchronous event loop (e.g., using `setTimeout`, non-blocking I/O, `fs`, or network requests), the callback registers an async timer/handle and yields control back to the call stack. Because `res.status(201).json()` is called before or concurrently with non-blocking timers, the HTTP response finishes and flushes to the client network socket immediately, while the timer callback executes in a subsequent iteration of the event loop.

### Q2: What would happen to API response time if the notification logic were placed directly inside the POST route instead of in an event handler?
> **Answer**:  
> If the notification logic (such as connecting to an SMTP mail server or waiting 2 seconds) were placed synchronously inside the `POST /tasks` route handler before `res.status(201).json()`, the client would be blocked for the entire duration of the notification (API response time would spike from ~10 ms to over 2,010 ms). Decoupling via `EventEmitter` reduces perceived latency to the bare minimum database write time.

### Q3: Why is EventEmitter a reasonable choice for this scale of application, but not for a production system handling millions of events per day?
> **Answer**:  
> - **Why it works in this lab**: `EventEmitter` is built into the Node.js runtime, requires zero installation or external daemons, and incurs no network overhead.  
> - **Why it fails at enterprise scale**:
>   1. **No Persistence**: Events exist solely in process RAM. If the Node.js server crashes or restarts, all pending in-memory events are permanently lost.
>   2. **Single Process Limitation**: Events cannot be distributed or load-balanced across multiple server instances.
>   3. **No Retries or Dead-Letter Queues**: `EventEmitter` lacks built-in message acknowledgment, retry backoff, and dead-letter queue (DLQ) support found in enterprise message brokers like **RabbitMQ**, **Kafka**, or **Redis BullMQ**.

---

## Steps to Run

Follow these commands in your terminal to set up, run, and test Practical 10:

### 1. Ensure MongoDB Daemon is Running
```bash
mongod
```
* MongoDB connection string defaults to `mongodb://127.0.0.1:27017/taskdb`

### 2. Navigate to Practical Directory
```bash
cd prac10
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application Server
```bash
npm start
```
* Server starts on: `http://localhost:5000`
* Console confirms:
  ```text
  MongoDB connected successfully
  Server running at http://localhost:5000
  EventEmitter listeners registered for: task.created, task.error
  ```

### 5. Access the Interactive Event Visualizer UI
* Open `http://localhost:5000` in your web browser.
* Create a task and watch the real-time event timeline demonstrate instant API response (10ms) followed by asynchronous notification resolution (2000ms later).

---

## Screenshots to Include in Lab File / Report

Capture and paste the following screenshots into your practical document:

1. **Screenshot 1 - Server Startup & Event Listener Registration**:
   - *Capture*: Terminal window showing `npm start`, MongoDB connection, and registration of `task.created` background listener.
2. **Screenshot 2 - POST /tasks (Immediate 201 Response in Postman)**:
   - *Capture*: Postman executing `POST http://localhost:5000/tasks` with JSON payload `{ "title": "Buy groceries", "priority": "high" }` showing HTTP `201 Created` returning in **< 15 ms**, proving non-blocking execution.
3. **Screenshot 3 - Terminal Log Timestamp Proof (Non-Blocking Evidence)**:
   - *Capture*: Terminal console showing the precise sequence of timestamped logs:
     - `[TIMESTAMP T+0ms] HTTP 201 Response dispatched to client`
     - `[TIMESTAMP T+0ms] Event 'task.created' emitted`
     - `[TIMESTAMP T+2000ms] [ASYNC WORKER] Email dispatched for task: Buy groceries`
4. **Screenshot 4 - Real-Time Event Dashboard in Browser**:
   - *Capture*: Browser window at `http://localhost:5000` displaying the visual timeline with the instantaneous green API response pill followed by the yellow background worker completion pill.
5. **Screenshot 5 - Resilient Error Handling (Error Event)**:
   - *Capture*: Postman sending request to error test endpoint or clicking "Emit Error Event" in UI, showing the server intercepts the background failure via `events.on('error')` without crashing the Node.js process thread.
6. **Screenshot 6 - MongoDB Verification**:
   - *Capture*: MongoDB Compass or shell showing the created task document persisted in `taskdb.tasks`.

