import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2 } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';

export default function SettingsDetailSlider({ open, onClose, title, icon: Icon, iconColor, children, onEdit, isEditing, customIcon }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed md:absolute left-0 right-0 bottom-0 z-[90] flex flex-col"
            style={{
              top: '65px',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-main)',
            }}
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pb-24 md:pb-8" style={{ paddingTop: '24px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-6">
                {/* Header */}
                <NeumorphicCard>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {customIcon ? customIcon : Icon ? (
                        <div
                          className="neumorphic-avatar sm flex-shrink-0"
                          style={{ backgroundColor: iconColor || '#2f949d', color: '#fff' }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      ) : null}
                      <h3 className="text-xl font-normal">{title}</h3>
                    </div>
                    {onEdit && (
                      <button
                        onClick={onEdit}
                        className="p-2 rounded-full transition-all duration-200 hover:scale-105"
                        style={{
                          background: 'var(--nm-background)',
                          boxShadow: isEditing ? 'var(--nm-shadow-inset)' : 'var(--nm-shadow-main)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit2 className="w-4 h-4 pointer-events-none" style={{ color: isEditing ? 'var(--nm-badge-primary-color)' : 'var(--nm-badge-default-color)' }} />
                      </button>
                    )}
                  </div>
                </NeumorphicCard>

                {/* Content */}
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}