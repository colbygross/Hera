import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BoardData } from '../../src/types';

// Mock react-dnd to avoid HTML5Backend issues in jsdom (no DataTransfer API)
vi.mock('react-dnd', () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDrag: () => [{ isDragging: false }, vi.fn()],
  useDrop: () => [{ isOver: false }, vi.fn()],
}));

vi.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}));

// Mock board data matching the real schema
const mockBoardData: BoardData = {
  columns: [
    { id: 1, board_id: 1, title: 'TODO', position: 0 },
    { id: 2, board_id: 1, title: 'IN PROGRESS', position: 1 },
    { id: 3, board_id: 1, title: 'DONE', position: 2 },
  ],
  tasks: [
    {
      id: 1,
      column_id: 1,
      title: 'Test Task',
      description: 'A test task description',
      due_date: '2026-12-31',
      priority: 'High',
      created_at: '2026-01-01T00:00:00',
      archived: false,
    },
  ],
  subtasks: [],
  tags: [],
  taskTags: [],
};

// Mock window.electronAPI — this is what the app actually uses (via preload)
const mockElectronAPI = {
  getBoardData: vi.fn().mockResolvedValue(mockBoardData),
  createTask: vi.fn().mockResolvedValue(1),
  updateTaskColumn: vi.fn().mockResolvedValue(true),
  updateTaskDetails: vi.fn().mockResolvedValue(true),
  deleteTask: vi.fn().mockResolvedValue(true),
  createSubtask: vi.fn().mockResolvedValue(true),
  updateSubtask: vi.fn().mockResolvedValue(true),
  createTag: vi.fn().mockResolvedValue(true),
  updateTag: vi.fn().mockResolvedValue(true),
  deleteTag: vi.fn().mockResolvedValue(true),
  setTaskTag: vi.fn().mockResolvedValue(true),
};

// Set up window.electronAPI before any imports that use it
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
  configurable: true,
});

// Now import App — the vi.mock calls above are hoisted before this
import App from '../../src/App';

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementation for each test
    mockElectronAPI.getBoardData.mockResolvedValue(mockBoardData);
  });

  it('renders without crashing', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(document.body).toBeInTheDocument();
  });

  it('fetches board data on mount', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(mockElectronAPI.getBoardData).toHaveBeenCalled();
  });

  it('renders the HERA header', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('HERA')).toBeInTheDocument();
  });

  it('renders the search input', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
  });

  it('renders board columns after data loads', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('TODO')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('DONE')).toBeInTheDocument();
  });

  it('renders task cards after data loads', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('A test task description')).toBeInTheDocument();
  });

  it('renders task priority badge', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('shows empty column text when a column has no tasks', async () => {
    await act(async () => {
      render(<App />);
    });

    const emptyLabels = screen.getAllByText('Empty Column');
    // IN PROGRESS and DONE have no tasks in the mock data
    expect(emptyLabels.length).toBe(2);
  });

  it('search input updates on typing', async () => {
    await act(async () => {
      render(<App />);
    });

    const searchInput = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(searchInput, { target: { value: 'hello' } });
    expect(searchInput).toHaveValue('hello');
  });

  it('opens task modal when plus button is clicked', async () => {
    await act(async () => {
      render(<App />);
    });

    // Click the "+" add button in the header
    const addButton = screen.getByRole('button');
    await act(async () => {
      fireEvent.click(addButton);
    });

    expect(screen.getByText('New Task')).toBeInTheDocument();
  });
});
