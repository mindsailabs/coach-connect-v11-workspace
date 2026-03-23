import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const NeumorphicModal = ({ isOpen, onClose, title, children, size = 'md' }) => {
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

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: 0, margin: 0 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--nm-modal-backdrop)' }}
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative w-full ${sizes[size]} max-h-[90vh] mx-4`}
          >
            <div 
              style={{
                borderRadius: '20px',
                background: 'var(--nm-background)',
                boxShadow: 'var(--nm-modal-shadow-main)',
              }}
              className="transition-all duration-300 hover:shadow-[var(--nm-modal-shadow-hover)] max-h-full flex flex-col overflow-hidden"
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
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NeumorphicModal;