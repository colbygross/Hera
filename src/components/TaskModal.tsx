import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export const TaskModal = () => {
  const { isTaskModalOpen, closeTaskModal, selectedTask, refreshBoard } = useBoard();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<number | ''>('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#818181');
  
  const { boardData } = useBoard();
  const taskSubtasks = selectedTask && boardData ? boardData.subtasks.filter((s: any) => s.task_id === selectedTask.id) : [];

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    await window.electronAPI.createSubtask({ task_id: selectedTask.id, title: newSubtaskTitle });
    setNewSubtaskTitle('');
    await refreshBoard();
  };

  const handleToggleSubtask = async (id: number, is_completed: boolean) => {
    await window.electronAPI.updateSubtask({ id, is_completed });
    await refreshBoard();
  };

  useEffect(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || '');
      setDueDate(selectedTask.due_date || '');
      setPriority(selectedTask.priority || '');
      const tTag = boardData?.taskTags.find(t => t.task_id === selectedTask.id);
      setSelectedTagId(tTag ? tTag.tag_id : '');
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('');
      setSelectedTagId('');
    }
  }, [selectedTask, isTaskModalOpen, boardData]);

  if (!isTaskModalOpen) return null;

  const handleAddCustomTag = async () => {
    if (newTagName.trim()) {
      await window.electronAPI.createTag({ name: newTagName.trim(), color: newTagColor });
      setNewTagName('');
      await refreshBoard();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    
    if (selectedTask) {
      await window.electronAPI.updateTaskDetails({
        id: selectedTask.id,
        title,
        description,
        due_date: dueDate,
        priority
      });
      await window.electronAPI.setTaskTag({ task_id: selectedTask.id, tag_id: selectedTagId || null });
      await refreshBoard();
      closeTaskModal();
    } else {
      const newTaskId = await window.electronAPI.createTask({
        column_id: 1, // Will fall into the first column usually. Real logic handles positioning later if needed.
        title,
        description,
        due_date: dueDate,
        priority
      });
      await window.electronAPI.setTaskTag({ task_id: newTaskId, tag_id: selectedTagId || null });
      await refreshBoard();
      closeTaskModal();
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    if (confirm('Are you sure you want to delete this task?')) {
        await window.electronAPI.deleteTask(selectedTask.id);
        await refreshBoard();
        closeTaskModal();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
      <div className="bg-[#2e2e2e] w-full max-w-2xl max-h-full rounded-xl border border-[#818181]/30 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#818181]/20 group">
          <h2 className="text-xl font-bold font-sans tracking-wide text-[#d2d2d2]">{selectedTask ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={closeTaskModal} className="text-[#818181] hover:text-[#d2d2d2] transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5 font-mono">
          <div>
            <label className="block text-xs uppercase text-[#818181] mb-1.5 font-bold tracking-wider">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#818181]/30 rounded-md p-2 text-[#d2d2d2] focus:outline-none focus:border-[#818181] transition-colors"
              placeholder="Task title..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-[#818181] mb-1.5 font-bold tracking-wider">Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#818181]/30 rounded-md p-2 text-[#d2d2d2] focus:outline-none focus:border-[#818181] transition-colors min-h-[120px] resize-y custom-scrollbar leading-relaxed"
              placeholder="Task details..."
            />
          </div>

          <div className="flex gap-6">
            <div className="flex-1">
              <label className="block text-xs uppercase text-[#818181] mb-1.5 font-bold tracking-wider">Due Date</label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#818181]/30 rounded-md p-2 text-[#d2d2d2] focus:outline-none focus:border-[#818181] transition-colors css-date-input"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs uppercase text-[#818181] mb-1.5 font-bold tracking-wider">Priority</label>
              <select 
                value={priority} 
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#818181]/30 rounded-md p-2 text-[#d2d2d2] focus:outline-none focus:border-[#818181] transition-colors"
              >
                <option value="">None</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="mt-2 text-[#d2d2d2]">
            <label className="block text-xs uppercase text-[#818181] mb-1.5 font-bold tracking-wider">Tag</label>
            <div className="flex gap-2 items-center">
              <select 
                value={selectedTagId} 
                onChange={e => setSelectedTagId(Number(e.target.value) || '')}
                className="w-1/2 bg-[#1e1e1e] border border-[#818181]/30 rounded-md p-2 text-[#d2d2d2] focus:outline-none focus:border-[#818181] transition-colors"
              >
                <option value="">No Tag</option>
                {boardData?.tags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
              
              <div className="w-1/2 flex items-center gap-2 border border-[#818181]/30 rounded-md p-1 bg-[#1e1e1e]">
                 <input 
                   type="text" 
                   value={newTagName} 
                   onChange={e => setNewTagName(e.target.value)} 
                   placeholder="New Tag Name..." 
                   className="w-full bg-transparent text-[#d2d2d2] focus:outline-none text-xs px-2"
                   onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomTag(); }}
                 />
                 <div className="relative w-6 h-6 rounded overflow-hidden shrink-0 border border-[#818181]/50 cursor-pointer">
                   <input 
                     type="color" 
                     value={newTagColor} 
                     onChange={e => setNewTagColor(e.target.value)} 
                     className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer bg-transparent border-0 p-0"
                   />
                 </div>
                 <button onClick={handleAddCustomTag} className="bg-[#2e2e2e] text-[#d2d2d2] px-2 py-1 rounded text-xs hover:bg-[#818181]/30 font-bold uppercase shrink-0 border border-[#818181]/30">+</button>
              </div>
            </div>
          </div>

          <div className="mt-2 text-[#d2d2d2]">
            <label className="block text-xs uppercase text-[#818181] mb-2 font-bold tracking-wider">Subtasks</label>
            <div className="flex flex-col gap-2">
              {taskSubtasks.map((st: any) => (
                <div key={st.id} className="flex items-center gap-3 bg-[#1e1e1e] p-2.5 rounded-md border border-[#818181]/20">
                  <input 
                    type="checkbox" 
                    checked={!!st.is_completed} 
                    onChange={(e) => handleToggleSubtask(st.id, e.target.checked)}
                    className="w-4 h-4 rounded border-[#818181] accent-[#818181] cursor-pointer"
                  />
                  <span className={`text-sm tracking-wide ${st.is_completed ? 'line-through text-[#818181]' : 'text-[#d2d2d2]'}`}>{st.title}</span>
                </div>
              ))}
              {selectedTask ? (
                <div className="flex items-center gap-3 mt-1">
                  <input 
                    type="text" 
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a new subtask..."
                    className="flex-1 bg-[#1e1e1e] border border-[#818181]/30 rounded-md p-2 text-sm text-[#d2d2d2] focus:outline-none focus:border-[#818181] transition-colors"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(); }}
                  />
                  <button onClick={handleAddSubtask} className="bg-[#2e2e2e] hover:bg-[#818181]/30 border border-[#818181]/30 text-[#818181] hover:text-[#d2d2d2] p-2 rounded-md transition-colors text-sm font-bold uppercase tracking-wider">
                     Add
                  </button>
                </div>
              ) : (
                <div className="text-xs text-[#818181] italic">Save the task first to add subtasks.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#818181]/20 flex justify-between gap-3 bg-[#1e1e1e]/50">
          <div>
            {selectedTask && (
              <button onClick={handleDelete} className="px-4 py-2 rounded-md font-sans border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm uppercase tracking-wider font-bold">
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={closeTaskModal} className="px-5 py-2 rounded-md font-sans border border-[#818181]/30 text-[#d2d2d2] hover:bg-[#818181]/10 transition-colors text-sm uppercase tracking-wider font-bold">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!title.trim()} className="px-5 py-2 font-sans rounded-md bg-[#d2d2d2] text-[#1e1e1e] hover:bg-white transition-colors text-sm uppercase tracking-wider font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              Save Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
