import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import NeumorphicInput from '@/components/ui/NeumorphicInput';
import NeumorphicTextarea from '@/components/ui/NeumorphicTextarea';
import NeumorphicDatePicker from '@/components/ui/NeumorphicDatePicker';
import NeumorphicTimePicker from '@/components/ui/NeumorphicTimePicker';
import AssignTaskPanel from '@/components/app/AssignTaskPanel';
import ViewHeader from '@/components/ui/ViewHeader';
import { Task } from '@/components/api/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function TaskDetailPanel({ open, onClose, onBack, backLabel = 'Back', initialAssignment = null }) {
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    },
  });

  const isSubmitting = createTaskMutation.isPending;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState('medium');
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
      setDescription('');
      setDueDate(null);
      setDueTime('');
      setPriority('medium');
      setAssignmentLabel(initialAssignment?.name || null);
      setShowAssignPanel(false);
      setCurrentAssignment(initialAssignment);
      setCurrentBackLabel(backLabel);
    }
  }, [open, initialAssignment]);

  const handleSave = () => {
    if (!title.trim()) return;

    let taskContext = 'personal';
    let contact_id = null;
    let session_id = null;
    let journey_id = null;

    if (currentAssignment) {
      if (currentAssignment.type === 'contact') {
        taskContext = 'contact';
        contact_id = currentAssignment.id;
      } else if (currentAssignment.type === 'session') {
        taskContext = 'session';
        session_id = currentAssignment.id;
        contact_id = currentAssignment.contactId || null;
      } else if (currentAssignment.type === 'journey') {
        taskContext = 'journey';
        journey_id = currentAssignment.id;
        contact_id = currentAssignment.contactId || null;
      }
    }

    let due_date = null;
    if (dueDate) {
      const dateObj = new Date(dueDate);
      if (dueTime) {
        const [hours, minutes] = dueTime.split(':');
        dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      }
      due_date = dateObj.toISOString().split('T')[0];
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || null,
      due_date,
      status: 'open',
      priority,
      taskContext,
      contact_id,
      session_id,
      journey_id,
    };

    createTaskMutation.mutate(taskData);
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
                  title="Create Task" 
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
                        placeholder="Task title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Description</label>
                      <NeumorphicTextarea
                        placeholder="Describe the task..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Due Date</label>
                        <NeumorphicDatePicker
                          value={dueDate}
                          onChange={setDueDate}
                          placeholder="Select date..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Due Time</label>
                        <NeumorphicTimePicker
                          value={dueTime}
                          onChange={setDueTime}
                          placeholder="Select time..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Priority</label>
                        <div className="flex gap-2">
                          {['low', 'medium', 'high'].map((p) => {
                            const priorityColors = {
                              low: '#10b981',
                              medium: '#f59e0b', 
                              high: '#ef4444'
                            };
                            const isSelected = priority === p;
                            
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className="flex-1 py-2 px-3 text-sm capitalize transition-all duration-200"
                                style={{
                                  borderRadius: 'var(--nm-radius)',
                                  background: isSelected ? priorityColors[p] : 'var(--nm-background)',
                                  color: isSelected ? '#fff' : 'var(--nm-badge-default-color)',
                                  boxShadow: isSelected ? 'var(--nm-shadow-inset)' : 'var(--nm-shadow-main)',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                {p}
                              </button>
                            );
                          })}
                        </div>
                      </div>
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
                    {isSubmitting ? 'Saving...' : 'Save Task'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <AssignTaskPanel
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