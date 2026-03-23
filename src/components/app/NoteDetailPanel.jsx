import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import NeumorphicInput from '@/components/ui/NeumorphicInput';
import NeumorphicTextarea from '@/components/ui/NeumorphicTextarea';
import NeumorphicToggle from '@/components/ui/NeumorphicToggle';
import AssignNotePanel from '@/components/app/AssignNotePanel';
import ViewHeader from '@/components/ui/ViewHeader';
import { Note } from '@/components/api/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deriveNoteType } from '@/components/utils/entityHelpers';

export default function NoteDetailPanel({ open, onClose, onBack, backLabel = 'Back', noteTitle = 'Add Note', initialAssignment = null }) {
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: (noteData) => Note.create(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating note:', error);
      alert('Failed to save note. Please try again.');
    },
  });

  const isSubmitting = createNoteMutation.isPending;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [assignmentLabel, setAssignmentLabel] = useState(null);

  const [currentAssignment, setCurrentAssignment] = useState(initialAssignment);
  const [currentBackLabel, setCurrentBackLabel] = useState(backLabel);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  React.useEffect(() => {
    if (open) {
      setTitle('');
      setBody('');
      setIsPinned(false);
      setAssignmentLabel(initialAssignment?.name || null);
      setShowAssignPanel(false);
      setCurrentAssignment(initialAssignment);
      setCurrentBackLabel(backLabel);
    }
  }, [open, noteTitle, initialAssignment]);

  const handleSave = () => {
    if (!title.trim()) return;

    let linkedContact = null;
    let linkedSession = null;
    let linkedJourney = null;
    let linkedTask = null;

    if (currentAssignment) {
      if (currentAssignment.type === 'contact') {
        linkedContact = currentAssignment.id;
      } else if (currentAssignment.type === 'session') {
        linkedSession = currentAssignment.id;
      } else if (currentAssignment.type === 'journey') {
        linkedJourney = currentAssignment.id;
      } else if (currentAssignment.type === 'task') {
        linkedTask = currentAssignment.id;
      }
    }

    const noteType = deriveNoteType(linkedContact, linkedSession, linkedJourney, linkedTask);

    const noteData = {
      title: title.trim(),
      content: body.trim() || '',
      noteType,
      createdByRole: 'coach',
      linkedContact,
      linkedSession,
      linkedJourney,
      linkedTask,
      isPinned,
    };

    createNoteMutation.mutate(noteData);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90]"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed left-0 right-0 bottom-[56px] md:bottom-0 z-[100] flex flex-col"
            style={{
              top: '65px',
              borderRadius: '0',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-main)',
            }}
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-6">
                <ViewHeader 
                  title="Add Note" 
                  icons={[
                    assignmentLabel && (
                      <button
                        key="assign"
                        onClick={() => setShowAssignPanel(true)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      >
                        <NeumorphicBadge variant="primary" size="sm">
                          {assignmentLabel}
                          <RefreshCw className="w-3 h-3 ml-1.5 inline-block" style={{ color: 'var(--nm-badge-primary-color)' }} />
                        </NeumorphicBadge>
                      </button>
                    )
                  ].filter(Boolean)} 
                />

                <NeumorphicCard>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Title</label>
                      <NeumorphicInput
                        type="text"
                        placeholder="Note title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Content</label>
                      <NeumorphicTextarea
                        placeholder="Write your note..."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <NeumorphicToggle
                        label="Pin this note"
                        checked={isPinned}
                        onChange={setIsPinned}
                      />
                    </div>
                  </div>
                </NeumorphicCard>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={!title.trim() || isSubmitting}
                    className="px-6 py-3 text-sm font-normal"
                    style={{
                      borderRadius: '16px',
                      background: (title.trim() && !isSubmitting) ? '#2f949d' : 'var(--nm-background)',
                      color: (title.trim() && !isSubmitting) ? '#fff' : 'var(--nm-badge-default-color)',
                      boxShadow: 'var(--nm-shadow-main)',
                      border: 'none',
                      cursor: (title.trim() && !isSubmitting) ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <AssignNotePanel
            open={showAssignPanel}
            onClose={() => setShowAssignPanel(false)}
            currentAssignment={currentAssignment}
            onAssign={(groupLabel, itemName, newAssignment) => {
              setAssignmentLabel(itemName === 'General' ? null : itemName);
              setCurrentAssignment(newAssignment);
              setCurrentBackLabel(itemName === 'General' ? backLabel : `Back To ${itemName}`);
              setShowAssignPanel(false);
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}