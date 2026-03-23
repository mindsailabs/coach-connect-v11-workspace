import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import { Save, AlertCircle } from 'lucide-react';

export default function UnsavedChangesWarningModal({ isOpen, onSave, onDiscard, onCancel }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{ background: 'var(--nm-modal-backdrop)' }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm p-6"
            style={{
              borderRadius: 'var(--nm-radius)',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-modal-shadow-main)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--nm-badge-warning-color)' }} />
              <h3 className="text-base font-normal" style={{ color: 'var(--nm-text-color)' }}>Unsaved Changes</h3>
            </div>

            <p className="text-sm mb-6" style={{ color: 'var(--nm-badge-default-color)' }}>
              You have unsaved edits. Would you like to save before leaving?
            </p>

            <div className="flex flex-col gap-3">
              <NeumorphicButton variant="primary" icon={Save} onClick={onSave} className="w-full">
                Save & Continue
              </NeumorphicButton>
              <NeumorphicButton variant="default" onClick={onDiscard} className="w-full">
                Discard Changes
              </NeumorphicButton>
              <button
                onClick={onCancel}
                className="text-sm py-2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--nm-badge-default-color)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}