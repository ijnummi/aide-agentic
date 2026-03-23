import { create } from 'zustand';

interface WorkspaceStore {
  projectPath: string;
  projectName: string;

  setProjectPath: (path: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  projectPath: '',
  projectName: '',

  setProjectPath: (path: string) => {
    const name = path.split('/').pop() || path;
    set({ projectPath: path, projectName: name });
  },
}));
