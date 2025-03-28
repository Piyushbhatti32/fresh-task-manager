import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TaskCategory } from '../types/Task';

interface CategoryState {
  categories: TaskCategory[];
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (id: string) => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      categories: [
        { id: '1', name: 'Work', color: '#FF5733' },
        { id: '2', name: 'Personal', color: '#33A1FF' },
        { id: '3', name: 'Health', color: '#33FF57' },
        { id: '4', name: 'Learning', color: '#B533FF' },
      ],
      
      addCategory: (name, color) => set((state) => ({
        categories: [
          ...state.categories,
          {
            id: Date.now().toString(),
            name,
            color,
          },
        ],
      })),
      
      updateCategory: (id, name, color) => set((state) => ({
        categories: state.categories.map((category) =>
          category.id === id
            ? { ...category, name, color }
            : category
        ),
      })),
      
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
      })),
    }),
    {
      name: 'category-storage',
    }
  )
); 