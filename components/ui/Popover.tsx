import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { overlaySpring } from '@/lib/motion';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  panelClassName?: string;
}

// Anchored popover on desktop, full-width bottom sheet on mobile. Unlike
// Modal, this has no full-screen backdrop on desktop — the page behind it
// (the floor plan) stays visible and usable while it's open.
export default function Popover({
  open,
  onClose,
  trigger,
  children,
  align = 'left',
  panelClassName,
}: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div ref={containerRef} className="relative">
      {trigger}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — mobile only; desktop keeps the page interactive behind the popover */}
            <motion.div
              className="fixed inset-0 z-40 bg-gray-950/20 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              className={clsx(
                'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-6 shadow-modal ring-1 ring-gray-900/5',
                'sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:mt-2 sm:w-[420px] sm:max-h-[70vh] sm:rounded-2xl sm:shadow-card',
                align === 'right' ? 'sm:right-0' : 'sm:left-0',
                panelClassName
              )}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={overlaySpring}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
