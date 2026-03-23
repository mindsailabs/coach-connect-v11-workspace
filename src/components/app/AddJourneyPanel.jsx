import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Journey, ContactJourney, Contact } from '@/components/api/entities';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicSelect from '@/components/ui/NeumorphicSelect';
import NeumorphicTextarea from '@/components/ui/NeumorphicTextarea';
import NeumorphicDatePicker from '@/components/ui/NeumorphicDatePicker';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import { getInitials, getAvatarColor } from '@/components/utils/entityHelpers';
import { ChevronRight, RefreshCw, ArrowLeft } from 'lucide-react';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Paused', label: 'Paused' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

// contact prop is optional — if not provided, a contact picker step is shown
export default function AddJourneyPanel({ open, onClose, onSuccess, contact, onBackToContact }) {
  const queryClient = useQueryClient();

  const { data: journeysData = [] } = useQuery({
    queryKey: ['journeys'],
    queryFn: () => Journey.list(),
    enabled: open,
  });

  const { data: contactsData = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => Contact.list(),
    enabled: open,
  });

  const journeyOptions = journeysData
    .filter(j => j.is_template !== false)
    .map(j => ({ value: j.id, label: j.title }));

  // step: 'select_contact' | 'assign'
  const [step, setStep] = useState(contact ? 'assign' : 'select_contact');
  const [selectedContact, setSelectedContact] = useState(contact || null);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [journeyId, setJourneyId] = useState('');
  const [status, setStatus] = useState('Active');
  const [startedAt, setStartedAt] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    if (open) {
      setStep(contact ? 'assign' : 'select_contact');
      setSelectedContact(contact || null);
      setJourneyId('');
      setStatus('Active');
      setStartedAt(new Date());
      setNotes('');
      setErrors({});
      setContactSearch('');
      setShowContactPicker(false);
    }
  }, [open, contact]);

  const createMutation = useMutation({
    mutationFn: (data) => ContactJourney.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactJourneys', selectedContact?.id] });
      queryClient.invalidateQueries({ queryKey: ['contactJourneys'] });
      onSuccess?.();
      onClose();
    },
  });

  const validate = () => {
    const errs = {};
    if (!journeyId) errs.journeyId = 'Please select a journey';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createMutation.mutate({
      contact_id: selectedContact?.id,
      journey_id: journeyId,
      status,
      started_at: startedAt ? startedAt.toISOString() : new Date().toISOString(),
      notes: notes.trim() || null,
      assigned_by: 'coach',
      progress_percentage: 0,
      current_step_number: 1,
    });
  };

  const filteredContacts = contactsData.filter(c =>
    (c.full_name || '').toLowerCase().includes(contactSearch.toLowerCase())
  );

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
            style={{ top: '65px', background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-main)' }}
          >
            <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-24 md:pb-8" style={{ paddingTop: '24px', scrollbarWidth: 'none' }}>
              {step === 'select_contact' ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-normal">Assign Journey</h2>
                  <p className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>Select a contact to assign a journey to</p>
                  <div style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)', borderRadius: '12px', padding: '8px 12px' }}>
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--nm-text-color)', fontSize: '0.875rem', boxShadow: 'none' }}
                    />
                  </div>
                  <NeumorphicCard className="!p-0 overflow-hidden">
                    <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                      {filteredContacts.map((c) => {
                        const initials = getInitials(c.full_name);
                        const color = c.avatar_color || getAvatarColor(c.full_name);
                        return (
                          <div
                            key={c.id}
                            className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                            onClick={() => { setSelectedContact(c); setStep('assign'); }}
                          >
                            <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: color, color: '#fff' }}>
                              <span style={{ transform: 'translateY(-1px)', fontSize: '0.65rem' }}>{initials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-base font-normal">{c.full_name}</span>
                              {c.contact_type && <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>{c.contact_type}</p>}
                            </div>
                            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }} />
                          </div>
                        );
                      })}
                    </div>
                  </NeumorphicCard>
                  <div className="flex justify-end">
                    <NeumorphicButton onClick={onClose}>Cancel</NeumorphicButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-normal">Assign Journey</h2>
                    {selectedContact && (
                      <button
                        onClick={() => setShowContactPicker(true)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      >
                        <NeumorphicBadge variant="primary" size="sm">
                          {selectedContact.full_name || selectedContact.name}
                          <RefreshCw className="w-3 h-3 ml-1.5 inline-block" style={{ color: 'var(--nm-badge-primary-color)' }} />
                        </NeumorphicBadge>
                      </button>
                    )}
                  </div>

                  <NeumorphicCard>
                    <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--nm-badge-default-color)' }}>Journey Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Journey *</label>
                        <NeumorphicSelect
                          value={journeyId}
                          onChange={setJourneyId}
                          options={journeyOptions}
                          placeholder="Select a journey..."
                        />
                        {errors.journeyId && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.journeyId}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Status</label>
                        <NeumorphicSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} />
                      </div>
                    </div>
                  </NeumorphicCard>

                  <NeumorphicCard>
                    <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--nm-badge-default-color)' }}>Start Date</h3>
                    <NeumorphicDatePicker value={startedAt} onChange={setStartedAt} placeholder="Select start date..." />
                  </NeumorphicCard>

                  <NeumorphicCard>
                    <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--nm-badge-default-color)' }}>Notes</h3>
                    <NeumorphicTextarea
                      placeholder="Any notes about this journey assignment..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </NeumorphicCard>

                  <div className="flex justify-end gap-3">
                    <NeumorphicButton onClick={onClose}>Cancel</NeumorphicButton>
                    <NeumorphicButton variant="primary" onClick={handleSubmit} loading={createMutation.isPending}>
                      Assign Journey
                    </NeumorphicButton>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Contact re-picker overlay */}
          <AnimatePresence>
            {showContactPicker && (
              <>
                <motion.div className="fixed inset-0 z-[110]" onClick={() => setShowContactPicker(false)} />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="fixed inset-0 bottom-[56px] md:bottom-0 z-[120] flex flex-col"
                  style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-main)' }}
                >
                  <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pb-24 md:pb-8" style={{ paddingTop: '32px', scrollbarWidth: 'none' }}>
                    <button
                      onClick={() => { setShowContactPicker(false); setContactSearch(''); }}
                      className="bottom-nav-btn flex items-center gap-1.5 text-sm font-normal transition-opacity hover:opacity-70 mb-8"
                      style={{ color: 'var(--nm-text-color)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Assign Journey
                    </button>
                    <h2 className="text-2xl font-normal mb-6">Contacts</h2>
                    <div style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)', borderRadius: '12px', padding: '8px 12px', marginBottom: '16px' }}>
                      <input
                        type="text"
                        placeholder="Search contacts..."
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--nm-text-color)', fontSize: '0.875rem', boxShadow: 'none' }}
                      />
                    </div>
                    <NeumorphicCard className="!p-0 overflow-hidden">
                      <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                        {filteredContacts.map((c) => {
                          const initials = getInitials(c.full_name);
                          const color = c.avatar_color || getAvatarColor(c.full_name);
                          const isCurrent = selectedContact?.id === c.id;
                          return (
                            <div
                              key={c.id}
                              className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                              onClick={() => { setSelectedContact(c); setShowContactPicker(false); setContactSearch(''); }}
                            >
                              <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: color, color: '#fff' }}>
                                <span style={{ transform: 'translateY(-1px)', fontSize: '0.65rem' }}>{initials}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-base font-normal">{c.full_name}</span>
                                {c.contact_type && <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>{c.contact_type}</p>}
                              </div>
                              {isCurrent && (
                                <span className="text-xs px-2 py-1 rounded-full flex-shrink-0" style={{ background: 'var(--nm-badge-primary-muted)', color: '#fff' }}>Current</span>
                              )}
                              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }} />
                            </div>
                          );
                        })}
                      </div>
                    </NeumorphicCard>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}