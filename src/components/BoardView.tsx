import { useBoard } from '../context/BoardContext';
import { TaskCard } from './TaskCard';
import { useDrop } from 'react-dnd';
import type { Column, Task } from '../types';

const BoardColumn = ({ column, tasks }: { column: Column, tasks: Task[] }) => {
  const { refreshBoard } = useBoard();

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: 'TASK',
    drop: async (item: { id: number, column_id: number }) => {
      if (item.column_id !== column.id) {
        await window.electronAPI.updateTaskColumn({ task_id: item.id, column_id: column.id });
        await refreshBoard();
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  return (
    <div ref={dropRef as any} className={`flex-1 min-w-[280px] h-full flex flex-col bg-[#2e2e2e]/30 rounded-lg border transition-colors ${isOver ? 'border-[#818181]/50 bg-[#2e2e2e]/50' : 'border-[#2e2e2e]'}`}>
       <div className="p-4 border-b border-[#2e2e2e]">
         <h2 className="font-sans font-bold text-lg text-[#d2d2d2] tracking-wider select-none">{column.title}</h2>
       </div>
       <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3">
         {tasks.length > 0 ? (
           tasks.map(task => <TaskCard key={task.id} task={task} />)
         ) : (
           <div className="text-xs text-[#818181]/50 text-center mt-4 italic select-none">Empty Column</div>
         )}
       </div>
    </div>
  );
};

const BoardView = () => {
  const { boardData, searchQuery } = useBoard();

  if (!boardData) {
    return <div className="h-full flex items-center justify-center animate-pulse text-[#818181]">Loading Board...</div>;
  }

  return (
    <div className="flex gap-6 h-full items-start w-full">
      {boardData.columns.map((column) => {
        const columnTasks = boardData.tasks.filter(t => {
          if (t.column_id !== column.id) return false;
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          const targetStr = `${t.title} ${t.description || ''} ${t.due_date || ''} ${t.priority || ''}`.toLowerCase();
          return targetStr.includes(query);
        });
        return <BoardColumn key={column.id} column={column} tasks={columnTasks} />;
      })}
    </div>
  );
};

export default BoardView;
