import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Task, BoardData } from '../types';

interface BoardContextType {
  boardData: BoardData | null;
  refreshBoard: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isTaskModalOpen: boolean;
  selectedTask: Task | null;
  openTaskModal: (task?: Task) => void;
  closeTaskModal: () => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider = ({ children }: { children: ReactNode }) => {
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const refreshBoard = async () => {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.getBoardData();
        setBoardData(data);
      } catch(err) {
        console.error("Board fetching failed:", err);
      }
    } else {
      console.error("electronAPI is not available");
    }
  };

  const openTaskModal = (task?: Task) => {
    setSelectedTask(task || null);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  useEffect(() => {
    refreshBoard();
  }, []);

  return (
    <BoardContext.Provider value={{
      boardData, refreshBoard, searchQuery, setSearchQuery,
      isTaskModalOpen, selectedTask, openTaskModal, closeTaskModal
    }}>
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) throw new Error('useBoard must be used within a BoardProvider');
  return context;
};
