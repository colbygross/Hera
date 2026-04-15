import sqlite3 from 'sqlite3';
import { app, ipcMain } from 'electron';
import path from 'path';

let db;

export function initDatabase() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(app.getPath('userData'), 'hera.db');
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
      console.error('Error opening database', err.message);
    } else {
      console.log('Connected to the SQLite database.');
      db.serialize(() => {
        // Create Tables
        db.run(`CREATE TABLE IF NOT EXISTS boards (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`);
        db.run(`INSERT OR IGNORE INTO boards (id, name) VALUES (1, 'Main Board')`);

        db.run(`CREATE TABLE IF NOT EXISTS columns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          board_id INTEGER,
          title TEXT NOT NULL,
          position INTEGER,
          FOREIGN KEY (board_id) REFERENCES boards (id)
        )`);

        db.get('SELECT COUNT(*) as count FROM columns', (err, row) => {
             if (!err && row && row.count === 0) {
                 db.run(`INSERT INTO columns (board_id, title, position) VALUES (1, 'TODO', 0)`);
                 db.run(`INSERT INTO columns (board_id, title, position) VALUES (1, 'IN PROGRESS', 1)`);
                 db.run(`INSERT INTO columns (board_id, title, position) VALUES (1, 'DONE', 2)`);
             }
        });

        db.run(`CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          column_id INTEGER,
          title TEXT NOT NULL,
          description TEXT,
          due_date TEXT,
          priority TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          archived BOOLEAN DEFAULT 0,
          FOREIGN KEY (column_id) REFERENCES columns (id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS subtasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER,
          title TEXT NOT NULL,
          description TEXT,
          due_date TEXT,
          is_completed BOOLEAN DEFAULT 0,
          FOREIGN KEY (task_id) REFERENCES tasks (id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          UNIQUE(name)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS task_tags (
          task_id INTEGER,
          tag_id INTEGER,
          PRIMARY KEY (task_id, tag_id),
          FOREIGN KEY (task_id) REFERENCES tasks (id),
          FOREIGN KEY (tag_id) REFERENCES tags (id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER,
          file_name TEXT,
          file_path TEXT,
          FOREIGN KEY (task_id) REFERENCES tasks (id)
        )`, (err) => {
           if (err) reject(err);
           else resolve();
        });
      });
    }
  });
  });
}

function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err); else resolve(this);
    });
  });
}

function getAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

export function setupIpcHandlers() {
  ipcMain.handle('get-board-data', async () => {
    // Perform auto-archive logic
    await runQuery(`
      UPDATE tasks 
      SET archived = 1 
      WHERE column_id IN (SELECT id FROM columns WHERE title = 'DONE') 
      AND updated_at <= datetime('now', '-24 hours')
    `);

    const columns = await getAll('SELECT * FROM columns ORDER BY position ASC');
    const tasks = await getAll('SELECT * FROM tasks WHERE archived = 0');
    // For now we get subtasks and tags too
    const subtasks = await getAll('SELECT * FROM subtasks');
    const tags = await getAll('SELECT * FROM tags');
    const taskTags = await getAll('SELECT * FROM task_tags');
    return { columns, tasks, subtasks, tags, taskTags };
  });

  ipcMain.handle('create-task', async (event, { column_id, title, description, due_date, priority }) => {
    const info = await runQuery(
      'INSERT INTO tasks (column_id, title, description, due_date, priority) VALUES (?, ?, ?, ?, ?)',
      [column_id, title, description, due_date, priority]
    );
    return info.lastID;
  });

  ipcMain.handle('update-task-column', async (event, { task_id, column_id }) => {
    await runQuery('UPDATE tasks SET column_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [column_id, task_id]);
    return true;
  });

  ipcMain.handle('update-task-details', async (event, { id, title, description, due_date, priority }) => {
    await runQuery(
      'UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, due_date, priority, id]
    );
    return true;
  });
  
  ipcMain.handle('delete-task', async (event, task_id) => {
    await runQuery('DELETE FROM task_tags WHERE task_id = ?', [task_id]);
    await runQuery('DELETE FROM subtasks WHERE task_id = ?', [task_id]);
    await runQuery('DELETE FROM attachments WHERE task_id = ?', [task_id]);
    await runQuery('DELETE FROM tasks WHERE id = ?', [task_id]);
    return true;
  });

  ipcMain.handle('create-subtask', async (event, { task_id, title }) => {
    await runQuery('INSERT INTO subtasks (task_id, title) VALUES (?, ?)', [task_id, title]);
    return true;
  });

  ipcMain.handle('update-subtask', async (event, { id, is_completed }) => {
    await runQuery('UPDATE subtasks SET is_completed = ? WHERE id = ?', [is_completed ? 1 : 0, id]);
    return true;
  });

  ipcMain.handle('create-tag', async (event, { name, color }) => {
    try {
      await runQuery('INSERT INTO tags (name, color) VALUES (?, ?)', [name, color]);
      return true;
    } catch(e) { return false; }
  });

  ipcMain.handle('set-task-tag', async (event, { task_id, tag_id }) => {
    await runQuery('DELETE FROM task_tags WHERE task_id = ?', [task_id]);
    if (tag_id) {
       await runQuery('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)', [task_id, tag_id]);
    }
    return true;
  });

  ipcMain.handle('update-tag', async (event, { id, name, color }) => {
    try {
      await runQuery('UPDATE tags SET name = ?, color = ? WHERE id = ?', [name, color, id]);
      return true;
    } catch(e) { return false; }
  });

  ipcMain.handle('delete-tag', async (event, id) => {
    await runQuery('DELETE FROM task_tags WHERE tag_id = ?', [id]);
    await runQuery('DELETE FROM tags WHERE id = ?', [id]);
    return true;
  });
} 
