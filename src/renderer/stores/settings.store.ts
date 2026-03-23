import { create } from 'zustand';
import { DEFAULT_SETTINGS, type AideSettings } from '../../shared/settings';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val) && typeof target[key] === 'object') {
      result[key] = deepMerge(target[key], val);
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

interface SettingsStore {
  settings: AideSettings;
  update: (partial: DeepPartial<AideSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  update: (partial) => {
    set((state) => ({
      settings: deepMerge(state.settings, partial) as AideSettings,
    }));
  },
}));

/** Quick access — use outside React or in callbacks */
export function getSettings(): AideSettings {
  return useSettingsStore.getState().settings;
}
