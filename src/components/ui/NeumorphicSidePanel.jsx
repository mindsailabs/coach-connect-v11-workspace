import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const NeumorphicSidePanel = ({ isOpen, onClose, title, children, side = 'right' }) => {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const slideVariants = {
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' }
    },
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' }
    }
  };

  const panelStyle = {
    borderRadius: side === 'right' ? 'var(--nm-radius) 0 0 var(--nm-radius)' : '0 var(--nm-radius) var(--nm-radius) 0',
    background: 'var(--nm-background)',
    boxShadow: side === 'right' ? 'var(--nm-panel-shadow-right)' : 'var(--nm-panel-shadow-left)',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50" style={{ padding: 0, margin: 0 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--nm-modal-backdrop)' }}
            onClick={onClose}
          />

          {/* Side Panel */}
          <motion.div
            initial={slideVariants[side].initial}
            animate={slideVariants[side].animate}
            exit={slideVariants[side].exit}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`absolute ${side === 'right' ? 'right-0' : 'left-0'} top-0 h-full w-full md:w-96 lg:w-[500px] flex flex-col`}
            style={panelStyle}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-6 flex-shrink-0"
              style={{
                borderBottom: '1px solid rgba(209, 217, 230, 0.3)',
                background: 'var(--nm-background)'
              }}
            >
              <h3 className="text-xl font-normal" style={{ color: 'var(--nm-text-color)' }}>{title}</h3>
              <button
                onClick={onClose}
                className="p-2 transition-all duration-200"
                style={{
                  borderRadius: '20px',
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-modal-close-shadow)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--nm-modal-close-shadow-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--nm-modal-close-shadow)'}
              >
                <X className="w-5 h-5" style={{ color: 'var(--nm-text-color)' }} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--nm-background)' }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NeumorphicSidePanel;