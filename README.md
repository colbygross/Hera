# Hera

**An offline desktop kanban board for everyday tasks.** Hera runs locally as an Electron app and keeps every task, subtask, tag and attachment in a local SQLite database, so nothing leaves your machine.

![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)

## Features

- One persistent board with **TODO**, **IN PROGRESS** and **DONE** columns
- Drag and drop tasks between columns
- Tasks with descriptions, due dates, priorities, checklists of subtasks, and attachments
- Color-coded tags that are reusable across tasks
- Search that filters the board instantly
- Optional voice input ([`scripts/voice_to_task.py`](scripts/voice_to_task.py)): speak a task, transcribe it locally with whisper.cpp, and have a local LLM (Ollama) turn it into a task on the board

## How it was built

Hera was built spec-first with AI coding agents. [`HERA.md`](HERA.md) is the written spec the agents worked from: the columns, task fields and features above all come from it. Unit tests (Vitest + Testing Library) and end-to-end tests (Playwright) check the result.

## Getting started

Requires Node.js 20+.

```bash
git clone https://github.com/colbygross/Hera.git
cd Hera
npm install
npm run dev      # start Vite and the Electron app
npm test         # unit + end-to-end tests
npm run build    # package a desktop build into release/
```

---

# Codebase Architecture

An Electron-based Kanban board application built with React, TypeScript, and Vite, utilizing an SQLite database for local data storage.

## Architecture Overview

Hera is split into two main processes typical of an Electron application:
1. **Main Process (Node.js & Electron API)**: Handles system integration, window creation, and direct database access.
2. **Renderer Process (React & UI)**: Handles the user interface, state management, and user interactions.

These processes communicate via Inter-Process Communication (IPC) facilitated securely by a preload script.

---

## 1. Main Process (Electron)

### `electron/main.js`
The entry point for the Electron application.
- **`createWindow()`**: Initializes the main `BrowserWindow`, sets up the preload script, and conditionally loads either the Vite dev server URL (in dev) or the built React static files (in production).
- **`app.whenReady()`**: Bootstraps the application by initializing the database (`initDatabase()`), setting up IPC listeners (`setupIpcHandlers()`), and finally launching the UI window.

### `electron/database.js`
Manages the SQLite database (`hera.db`) and acts as the backend service.
- **`initDatabase()`**: Resolves a Promise to connect to the database. It executes table creation queries (`CREATE TABLE IF NOT EXISTS`) for `boards`, `columns`, `tasks`, `subtasks`, `tags`, `task_tags`, and `attachments`. Seeds initial default columns.
- **`setupIpcHandlers()`**: Registers all `ipcMain.handle` endpoints. Each handler receives IPC calls from the frontend and performs specific SQLite queries (`runQuery`, `getAll`). 
  - *Data structures relational mapping*: `tasks` belong to `columns`, `subtasks` belong to `tasks`, and `task_tags` map many-to-many `tasks` and `tags`.

### `electron/preload.js`
Acts as a secure context bridge.
- Uses `contextBridge.exposeInMainWorld('electronAPI', {...})` to safely expose `ipcRenderer.invoke` calls to the frontend sandbox. The React app interacts exclusively with this `window.electronAPI` object.

---

## 2. Renderer Process (React & Vite)

### `src/App.tsx` & `src/main.tsx`
The root of the React application context tree.
- Uses standard React DOM to render the `App` component.
- **`App`**: Wraps the application with `DndProvider` (enabling HTML5 drag-and-drop interactions) and `BoardProvider` (global state). Renders the layout and main views natively.

### Context Management

#### `src/context/BoardContext.tsx`
Provides global state management and database synchronization methods.
- **`BoardProvider` component**: Maintains states such as `boardData` (all fetched DB records including columns, tasks, subtasks, tags), `searchQuery`, and the modal view states.
- **`refreshBoard()` function**: An async method that queries `window.electronAPI.getBoardData()`. It hydrates the `boardData` state variable, causing the entire UI to rerender with fresh database data.
- Exposes states and functions safely via the custom `useBoard()` React hook.

### Core Components

#### `src/components/Layout.tsx`
- The application navigation shell containing the top bar and search input. 
- Interacts with `useBoard()` to set the global search query, causing downstream components to filter their tasks instantly.

#### `src/components/BoardView.tsx`
- The central workflow component that parses `boardData`.
- **`BoardColumn`**: Represents logical column constraints (TODO, IN PROGRESS). Implements React-DnD's `useDrop` hook to detect dropped tasks. When a task is dropped, it triggers `window.electronAPI.updateTaskColumn()` and `refreshBoard()`.

#### `src/components/TaskCard.tsx`
- UI component for an individual actionable item.
- Connects task relationships locally by filtering `subtasks` and `tags` using the task's primary key (`task.id`).
- Implements `useDrag` to serialize the task identity into the DnD system.
- Clicking opens a detail view modal via `openTaskModal(task)` from context.

#### `src/components/TaskModal.tsx` & `src/components/TagManager.tsx`
- Interactive forms controlling data mutations. 
- Handles the UI constraints of title inputs, descriptions, tag linking, and task deletions. 
- Submits data via `window.electronAPI` CRUD endpoints (e.g., `createTask`, `updateTaskDetails`, `deleteTask`) before immediately firing `refreshBoard()` to re-sync.

---

## Data Flow Lifecycle
The holistic data flow follows a Uni-directional cycle via IPC:
1. **User Action**: The User interacts with a React component (e.g., checking a subtask, dragging a card).
2. **IPC Invoke**: The React component proxies a function on `window.electronAPI` (e.g., `updateSubtask`).
3. **Bridge Communication**: `electron/preload.js` forwards the command via IPC over to `electron/main.js`.
4. **Database Execution**: `electron/database.js` runs `UPDATE / INSERT` SQLite queries.
5. **State Invalidation**: The invoking React component runs `refreshBoard()` under `BoardContext`.
6. **Rehydration**: Front-end re-queries the full state, updates context, and React reactively re-renders the UI to mirror the database accurate state.
