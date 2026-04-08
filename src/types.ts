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
    electronAPI: any;
  }
}
