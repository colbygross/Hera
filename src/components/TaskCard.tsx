import type { Task } from '../types';
import { useBoard } from '../context/BoardContext';
import { useDrag } from 'react-dnd';

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const { openTaskModal, boardData, refreshBoard } = useBoard();

  const taskTagMapping = boardData?.taskTags.find(tt => tt.task_id === task.id);
  const tag = taskTagMapping ? boardData?.tags.find(t => t.id === taskTagMapping.tag_id) : null;
  const taskSubtasks = boardData?.subtasks.filter(s => s.task_id === task.id) || [];

  const handleToggleSubtask = async (e: React.ChangeEvent<HTMLInputElement>, id: number, currentCompleted: boolean) => {
    e.stopPropagation();
    await window.electronAPI.updateSubtask({ id, is_completed: !currentCompleted });
    refreshBoard();
  };

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, column_id: task.column_id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    })
  }));

  return (
    <div ref={dragRef as any} onClick={() => openTaskModal(task)} 
      className={`bg-white p-3 rounded shadow-sm hover:shadow-md cursor-pointer transition-all shrink-0 group select-none border border-[#e0e0e0] ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{
        borderColor: tag ? tag.color : undefined,
        borderLeftWidth: tag ? '4px' : '1px'
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-sans font-bold text-black text-sm">{task.title}</h3>
        <div className="flex gap-1.5 items-center">
          {tag && (
             <span className="text-[10px] px-1.5 py-0.5 rounded font-sans font-bold tracking-wider" style={{ backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}40` }}>{tag.name}</span>
          )}
          {task.priority && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 uppercase font-sans font-bold tracking-wider">
              {task.priority}
            </span>
          )}
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
      )}
      {taskSubtasks.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-gray-100 pt-3">
          {taskSubtasks.map((st: any) => (
            <div key={st.id} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input 
                type="checkbox" 
                checked={!!st.is_completed} 
                onChange={(e) => handleToggleSubtask(e, st.id, !!st.is_completed)}
                className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer accent-gray-500"
              />
              <span className={`text-xs font-sans ${st.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {st.title}
              </span>
            </div>
          ))}
        </div>
      )}
      {task.due_date && (
        <div className="text-[10px] text-gray-500 mt-3 border-t border-gray-100 pt-2 font-mono font-bold">
          Due: {new Date(task.due_date.length === 10 ? `${task.due_date}T12:00:00` : task.due_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};
