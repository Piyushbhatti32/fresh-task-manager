import { create } from 'zustand';
import { Task } from '../types/Task';
import { useDatabase } from '../hooks/useDatabase';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,
  refreshTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { tasks } = useDatabase.getState();
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to refresh tasks', isLoading: false });
    }
  },
})); 