import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineX,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineXCircle,
} from 'react-icons/hi';

/*
 * Kingbolt-style global Snackbar/Toast (bottom-right), adapted from
 * public-charging-fe's <Snackbar><Alert/></Snackbar> pattern.
 * Usage: const { notify } = useToast(); notify('Saved', 'success', 'Done');
 */
const ToastContext = createContext(null);

const SEVERITY = {
  info: { icon: HiOutlineInformationCircle, bar: 'bg-status-info', text: 'text-status-info' },
  success: { icon: HiOutlineCheckCircle, bar: 'bg-status-success', text: 'text-status-success' },
  warning: { icon: HiOutlineExclamation, bar: 'bg-status-warning', text: 'text-status-warning' },
  error: { icon: HiOutlineXCircle, bar: 'bg-status-error', text: 'text-status-error' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, severity = 'info', title = '') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, severity, title }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => {
            const cfg = SEVERITY[t.severity] || SEVERITY.info;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={t.id}
                className="flex items-stretch bg-white rounded-lg shadow-menu overflow-hidden border border-grey-1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className={`w-1 ${cfg.bar}`} />
                <div className="flex items-start gap-3 px-4 py-3 flex-1">
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.text}`} />
                  <div className="flex-1 min-w-0">
                    {t.title && <p className="font-semibold text-brand-ink text-sm">{t.title}</p>}
                    <p className="text-sm text-brand-muted break-words">{t.message}</p>
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="p-1 rounded hover:bg-brand-hover text-brand-muted shrink-0"
                    aria-label="Dismiss"
                  >
                    <HiOutlineX className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful no-op if provider is missing, so callers never crash.
    return { notify: () => {} };
  }
  return ctx;
}
