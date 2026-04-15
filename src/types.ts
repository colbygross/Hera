export interface Task {
  id: number;
  column_id: number;
  title: string;
  description: string;
  due_date: string;
  priority: string;
  created_at: string;
  archived: boolean;
}

export interface Column {
  id: number;
  board_id: number;
  title: string;
  position: number;
}

export interface BoardData {
  columns: Column[];
  tasks: Task[];
  subtasks: any[];
  tags: any[];
  taskTags: any[];
}

declare global {
  interface Window {
    electronAPI: {
      getBoardData: () => Promise<BoardData>;
      createTask: (data: any) => Promise<number>;
      updateTaskColumn: (data: any) => Promise<boolean>;
      updateTaskDetails: (data: any) => Promise<boolean>;
      deleteTask: (taskId: number) => Promise<boolean>;
      createSubtask: (data: any) => Promise<boolean>;
      updateSubtask: (data: any) => Promise<boolean>;
      createTag: (data: any) => Promise<boolean>;
      updateTag: (data: any) => Promise<boolean>;
      deleteTag: (id: number) => Promise<boolean>;
      setTaskTag: (data: any) => Promise<boolean>;
    };
  }
}
