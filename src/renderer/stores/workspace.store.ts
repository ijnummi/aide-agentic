import { create } from 'zustand';
import { baseName } from '../lib/path';

interface WorkspaceStore {
  projectPath: string;
  projectName: string;

  setProjectPath: (path: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  projectPath: '',
  projectName: '',

  setProjectPath: (path: string) => {
    const name = baseName(path);
    set({ projectPath: path, projectName: name });
  },
}));
