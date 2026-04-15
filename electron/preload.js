const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBoardData: () => ipcRenderer.invoke('get-board-data'),
  createTask: (data) => ipcRenderer.invoke('create-task', data),
  updateTaskColumn: (data) => ipcRenderer.invoke('update-task-column', data),
  updateTaskDetails: (data) => ipcRenderer.invoke('update-task-details', data),
  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
  createSubtask: (data) => ipcRenderer.invoke('create-subtask', data),
  updateSubtask: (data) => ipcRenderer.invoke('update-subtask', data),
  createTag: (data) => ipcRenderer.invoke('create-tag', data),
  updateTag: (data) => ipcRenderer.invoke('update-tag', data),
  deleteTag: (id) => ipcRenderer.invoke('delete-tag', id),
  setTaskTag: (data) => ipcRenderer.invoke('set-task-tag', data),
});
