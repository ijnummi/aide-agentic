import { create } from 'zustand';
import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  add: (type: ToastType, message: string) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (type, message) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  remove: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

export function toast(type: ToastType, message: string) {
  useToastStore.getState().add(type, message);
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: 'var(--success)',
  error: 'var(--error)',
  info: 'var(--accent)',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] shadow-lg text-xs animate-in slide-in-from-right"
          >
            <Icon size={14} style={{ color: colors[t.type] }} className="flex-shrink-0" />
            <span className="flex-1 text-[var(--text-primary)]">{t.message}</span>
            <button
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              onClick={() => remove(t.id)}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
