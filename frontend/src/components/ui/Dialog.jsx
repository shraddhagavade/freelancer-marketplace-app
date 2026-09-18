import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineX } from 'react-icons/hi';

/*
 * Kingbolt-style Dialog / confirmation modal (adapted from public-charging-fe).
 */
export default function Dialog({ open, onClose, title, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative w-full ${width} bg-white rounded-lg shadow-menu flex flex-col`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-divider">
              <h2 className="text-section-title text-brand-ink">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-brand-hover text-brand-muted transition-colors"
                aria-label="Close"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-brand-ink">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-divider">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
