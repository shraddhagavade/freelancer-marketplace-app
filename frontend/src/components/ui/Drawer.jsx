import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineX } from 'react-icons/hi';

/*
 * Kingbolt-style right-side Drawer (adapted from public-charging-fe).
 * Structure: Header (title + close) / Body (scroll) / Footer (actions).
 */
export default function Drawer({ open, onClose, title, children, footer, width = 'max-w-md' }) {
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
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`fixed right-0 top-0 z-50 h-full w-full ${width} bg-white shadow-drawer flex flex-col`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.25 }}
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
            <div className="flex-1 overflow-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-divider">
                {footer}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
