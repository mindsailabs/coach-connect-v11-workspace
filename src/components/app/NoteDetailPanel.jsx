import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Pencil } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import NeumorphicInput from '@/components/ui/NeumorphicInput';
import NeumorphicTextarea from '@/components/ui/NeumorphicTextarea';
import NeumorphicToggle from '@/components/ui/NeumorphicToggle';
import AssignNotePanel from '@/components/app/AssignNotePanel';
import ViewHeader from '@/components/ui/ViewHeader';
import { Note } from '@/components/api/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deriveNoteType, formatDate } from '@/components/utils/entityHelpers';

export default function NoteDetailPanel({ open, onClose, backLabel = 'Back', initialAssignment = null, note = null }) {
  const queryClient = useQueryClient();
  const isEditMode = !!note;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [assignmentLabel, setAssignmentLabel] = useState(null);
  const [currentAssignment, setCurrentAssignment] = useState(initialAssignment);

  const createNoteMutation = useMutation({
    mutationFn: (noteData) => Note.create(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      onClose();
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }) => Note.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsEditing(false);
    },
  });

  const isSubmitting = createNoteMutation.isPending || updateNoteMutation.isPending;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (open) {
      if (note) {
        // Populate fields from existing note
        setTitle(note.title || '');
        setBody(note.content || '');
        setIsPinned(note.isPinned || false);
        setIsEditing(false);
        setShowAssignPanel(false);
        // Reconstruct assignment label from note
        let label = null;
        let assignment = null;
        if (note.linkedContact) {
          label = note.linkedName || 'Contact';
          assignment = { id: note.linkedContact, type: 'contact', name: label };
        } else if (note.linkedSession) {
          label = note.linkedName || 'Session';
          assignment = { id: note.linkedSession, type: 'session', name: label };
        } else if (note.linkedJourney) {
          label = note.linkedName || 'Journey';
          assignment = { id: note.linkedJourney, type: 'journey', name: label };
        } else if (note.linkedTask) {
          label = note.linkedName || 'Task';
          assignment = { id: note.linkedTask, type: 'task', name: label };
        }
        setAssignmentLabel(label);
        setCurrentAssignment(assignment);
      } else {
        // New note
        setTitle('');
        setBody('');
        setIsPinned(false);
        setIsEditing(true);
        setShowAssignPanel(false);
        setAssignmentLabel(initialAssignment?.name || null);
        setCurrentAssignment(initialAssignment);
      }
    }
  }, [open, note]);

  const buildNoteData = () => {
    let linkedContact = null;
    let linkedSession = null;
    let linkedJourney = null;
    let linkedTask = null;

    if (currentAssignment) {
      if (currentAssignment.type === 'contact') linkedContact = currentAssignment.id;
      else if (currentAssignment.type === 'session') linkedSession = currentAssignment.id;
      else if (currentAssignment.type === 'journey') linkedJourney = currentAssignment.id;
      else if (currentAssignment.type === 'task') linkedTask = currentAssignment.id;
    }

    const noteType = deriveNoteType(linkedContact, linkedSession, linkedJourney, linkedTask);

    return {
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
  };

  const handleSave = () => {
    if (!title.trim()) return;
    if (isEditMode) {
      updateNoteMutation.mutate({ id: note.id, data: buildNoteData() });
    } else {
      createNoteMutation.mutate(buildNoteData());
    }
  };

  const panelTitle = isEditMode
    ? (isEditing ? 'Edit Note' : (note?.title || 'Note'))
    : 'Add Note';

  const headerIcons = [
    // Reassign button when editing
    assignmentLabel && isEditing ? (
      <button
        key="reassign"
        onClick={() => setShowAssignPanel(true)}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <NeumorphicBadge variant="primary" size="sm">
          {assignmentLabel}
          <RefreshCw className="w-3 h-3 ml-1.5 inline-block" style={{ color: 'var(--nm-badge-primary-color)' }} />
        </NeumorphicBadge>
      </button>
    ) : null,
    // Edit icon (view mode only)
    isEditMode && !isEditing ? {
      id: 'edit',
      icon: Pencil,
      color: 'var(--nm-badge-default-color)',
      onClick: () => setIsEditing(true),
    } : null,
  ].filter(Boolean);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[90]" onClick={onClose} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed left-0 right-0 bottom-[56px] md:bottom-0 z-[100] flex flex-col"
            style={{
              top: '65px',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-main)',
            }}
          >
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              <div className="space-y-6">
                <ViewHeader
                  title={panelTitle}
                  icons={headerIcons}
                />

                {/* View mode: read-only display */}
                {isEditMode && !isEditing ? (
                  <NeumorphicCard>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs mb-1" style={{ color: 'var(--nm-badge-default-color)' }}>
                          {note.noteType || 'My Note'} · {formatDate(note.created_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--nm-text-color)' }}>
                          {note.content || <span style={{ color: 'var(--nm-badge-default-color)' }}>No content</span>}
                        </p>
                      </div>
                      {note.isPinned && (
                        <p className="text-xs" style={{ color: '#2f949d' }}>📌 Pinned</p>
                      )}
                    </div>
                  </NeumorphicCard>
                ) : (
                  /* Edit / Create mode */
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
                        {!assignmentLabel && (
                          <button
                            onClick={() => setShowAssignPanel(true)}
                            className="text-sm px-4 py-2"
                            style={{
                              borderRadius: '12px',
                              background: 'var(--nm-background)',
                              boxShadow: 'var(--nm-shadow-main)',
                              border: 'none',
                              color: 'var(--nm-badge-default-color)',
                              cursor: 'pointer',
                            }}
                          >
                            Assign to...
                          </button>
                        )}
                      </div>
                    </div>
                  </NeumorphicCard>
                )}

                {(isEditing || !isEditMode) && (
                  <div className="flex justify-end gap-3">
                    {isEditMode && (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 text-sm font-normal"
                        style={{
                          borderRadius: '16px',
                          background: 'var(--nm-background)',
                          color: 'var(--nm-badge-default-color)',
                          boxShadow: 'var(--nm-shadow-main)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    )}
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
                      {isSubmitting ? 'Saving...' : isEditMode ? 'Update Note' : 'Save Note'}
                    </button>
                  </div>
                )}
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
              setShowAssignPanel(false);
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
}