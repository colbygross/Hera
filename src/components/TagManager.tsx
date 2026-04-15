import { useState } from 'react';
import { X, Trash2, Save, Plus } from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export const TagManager = ({ onClose }: { onClose: () => void }) => {
  const { boardData, refreshBoard } = useBoard();
  
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#818181');
  
  const [editingTags, setEditingTags] = useState<Record<number, { name: string, color: string }>>({});

  const handleEditChange = (id: number, key: 'name' | 'color', value: string) => {
    setEditingTags(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { name: boardData?.tags.find(t => t.id === id)?.name || '', color: boardData?.tags.find(t => t.id === id)?.color || '' }),
        [key]: value
      }
    }));
  };

  const handleAddTag = async () => {
    if (newTagName.trim()) {
      await window.electronAPI.createTag({ name: newTagName.trim(), color: newTagColor });
      setNewTagName('');
      await refreshBoard();
    }
  };

  const handleUpdateTag = async (id: number) => {
    const data = editingTags[id];
    if (data && data.name.trim()) {
      await window.electronAPI.updateTag({ id, name: data.name.trim(), color: data.color });
      setEditingTags(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await refreshBoard();
    }
  };

  const handleDeleteTag = async (id: number) => {
    if (confirm('Are you sure you want to delete this tag? Tasks using it will lose this tag.')) {
      await window.electronAPI.deleteTag(id);
      await refreshBoard();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-6 backdrop-blur-sm">
      <div className="bg-[#2e2e2e] w-full max-w-md max-h-full rounded-xl border border-[#818181]/30 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#818181]/20 group">
          <h2 className="text-xl font-bold font-sans tracking-wide text-[#d2d2d2]">Manage Tags</h2>
          <button onClick={onClose} className="text-[#818181] hover:text-[#d2d2d2] transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 font-mono">
          
          {/* Create New Tag */}
          <div>
            <label className="block text-xs uppercase text-[#818181] mb-2 font-bold tracking-wider">Create New Tag</label>
            <div className="flex items-center gap-2 border border-[#818181]/30 rounded-md p-1 bg-[#1e1e1e]">
              <input 
                 type="text" 
                 value={newTagName} 
                 onChange={e => setNewTagName(e.target.value)} 
                 placeholder="New Tag Name..." 
                 className="flex-1 bg-transparent text-[#d2d2d2] focus:outline-none text-sm px-2 py-1"
                 onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
              />
              <div className="relative w-7 h-7 rounded overflow-hidden shrink-0 border border-[#818181]/50 cursor-pointer">
                 <input 
                   type="color" 
                   value={newTagColor} 
                   onChange={e => setNewTagColor(e.target.value)} 
                   className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer bg-transparent border-0 p-0"
                 />
              </div>
              <button onClick={handleAddTag} className="bg-[#2e2e2e] hover:bg-[#818181]/30 text-[#d2d2d2] p-1.5 rounded transition-colors border border-[#818181]/30 flex items-center justify-center">
                 <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <hr className="border-[#818181]/20" />

          {/* Existing Tags */}
          <div>
            <label className="block text-xs uppercase text-[#818181] mb-3 font-bold tracking-wider">Existing Tags</label>
            <div className="flex flex-col gap-3">
              {boardData?.tags.length === 0 && (
                 <div className="text-xs text-[#818181] italic">No tags created yet.</div>
              )}
              {boardData?.tags.map(tag => {
                const isEditing = editingTags[tag.id] !== undefined;
                const nameVal = isEditing ? editingTags[tag.id].name : tag.name;
                const colorVal = isEditing ? editingTags[tag.id].color : tag.color;
                
                return (
                  <div key={tag.id} className="flex items-center gap-2 bg-[#1e1e1e] p-2 rounded-md border border-[#818181]/20">
                    <input 
                      type="text"
                      className="flex-1 bg-transparent text-[#d2d2d2] focus:outline-none focus:border-b focus:border-[#818181]/50 text-sm px-1 py-1 transition-colors"
                      value={nameVal}
                      onChange={e => handleEditChange(tag.id, 'name', e.target.value)}
                    />
                    <div className="relative w-6 h-6 rounded overflow-hidden shrink-0 border border-[#818181]/50 cursor-pointer">
                       <input 
                         type="color" 
                         value={colorVal} 
                         onChange={e => handleEditChange(tag.id, 'color', e.target.value)} 
                         className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer bg-transparent border-0 p-0"
                       />
                    </div>
                    {isEditing && (
                      <button onClick={() => handleUpdateTag(tag.id)} className="text-green-500 hover:bg-green-500/20 p-1.5 rounded transition-colors" title="Save Changes">
                        <Save className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDeleteTag(tag.id)} className="text-red-500 hover:bg-red-500/20 p-1.5 rounded transition-colors" title="Delete Tag">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
