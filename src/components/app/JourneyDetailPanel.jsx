import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';

export default function JourneyDetailPanel({ journey, sourceContact, onClose, onBackToContact }) {
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      {!!journey && (
        <>
          <motion.div
            className="absolute inset-0 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed md:absolute left-0 right-0 bottom-0 z-[90] flex flex-col"
            style={{
              top: '65px',
              borderRadius: '0',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-main)',
            }}
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-6">
                <NeumorphicCard>
                  <div className="flex items-center gap-4">
                    <div
                      className="neumorphic-icon-badge lg variant-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-normal relative z-10">{journey.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <NeumorphicBadge variant="success" solid size="sm">
                          {journey.status}
                        </NeumorphicBadge>
                        <span className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>
                          {journey.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </NeumorphicCard>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}