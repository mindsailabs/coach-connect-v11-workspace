import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Loader2, ArrowLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Session, Contact } from '@/components/api/entities';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicInput from '@/components/ui/NeumorphicInput';
import NeumorphicTextarea from '@/components/ui/NeumorphicTextarea';
import NeumorphicSelect from '@/components/ui/NeumorphicSelect';
import NeumorphicDatePicker from '@/components/ui/NeumorphicDatePicker';
import NeumorphicTimePicker from '@/components/ui/NeumorphicTimePicker';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import { getInitials, getAvatarColor } from '@/components/utils/entityHelpers';
import { base44 } from '@/api/base44Client';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

const MEETING_TYPE_OPTIONS = [
  { value: 'Face to Face', label: 'Face to Face' },
  { value: 'Video Call', label: 'Video Call' },
  { value: 'Phone Call', label: 'Phone Call' },
  { value: 'Chat', label: 'Chat' },
];

const getPlatformOptions = (isGoogleConnected, isZoomConnected) => [
  { value: 'Skype', label: 'Skype' },
  { value: 'Microsoft Teams', label: 'Microsoft Teams' },
  { value: 'WhatsApp Video', label: 'WhatsApp Video' },
  { value: 'Google Meet', label: isGoogleConnected ? 'Google Meet' : 'Google Meet (not connected)', disabled: !isGoogleConnected },
  { value: 'Zoom', label: isZoomConnected ? 'Zoom' : 'Zoom (not connected)', disabled: !isZoomConnected },
  { value: 'Phone', label: 'Phone' },
  { value: 'In Person', label: 'In Person' },
  { value: 'Other', label: 'Other' },
];

export default function SessionFormPanel({
  open,
  onClose,
  onSuccess,
  onNavigate,
  editSession = null,
  backLabel = 'Back to Sessions',
  initialContact = null,
}) {
  const queryClient = useQueryClient();
  const isEditMode = !!editSession;
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContactObj, setSelectedContactObj] = useState(initialContact || null);

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => Contact.list(),
  });

  const { data: googleStatus } = useQuery({
    queryKey: ['googleConnectionStatus'],
    queryFn: async () => {
      try {
        const result = await base44.functions.invoke('getGoogleConnectionStatus');
        return result.data;
      } catch (e) {
        return { connected: false };
      }
    },
  });
  const isGoogleConnected = googleStatus?.connected === true;

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  const isZoomConnected = !!currentUser?.zoom_connected;

  const contactOptions = (contactsData || [])
    .filter(c => c.full_name)
    .map(c => ({ value: String(c.id), label: c.full_name }));

  const [title, setTitle] = useState('');
  const [contactId, setContactId] = useState('');
  const [sessionDate, setSessionDate] = useState(null);
  const [sessionTime, setSessionTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [status, setStatus] = useState('scheduled');
  const [meetLink, setMeetLink] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [platform, setPlatform] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const [preSessionNotes, setPreSessionNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [creatingMeet, setCreatingMeet] = useState(false);
  const [meetError, setMeetError] = useState('');

  useEffect(() => {
    if (open) {
      if (editSession) {
        setTitle(editSession.title || '');
        setContactId(editSession.contact_id || '');
        setSessionDate(editSession.date_time ? new Date(editSession.date_time) : null);
        setSessionTime(editSession.date_time ? new Date(editSession.date_time).toTimeString().slice(0, 5) : '');
        setDuration(editSession.duration || 60);
        setStatus(editSession.status || 'scheduled');
        setMeetLink(editSession.meet_link || '');
        setMeetingType(editSession.meeting_type || '');
        setPlatform(editSession.platform || '');
        setMeetingLink(editSession.meeting_link || '');
        setLocation(editSession.location || '');
        setPreSessionNotes(editSession.preSessionNotes || '');
        setNotes(editSession.notes || '');
        setSelectedContactObj(null);
      } else {
        setTitle(''); setSessionDate(null); setSessionTime('');
        setDuration(60); setStatus('scheduled'); setMeetLink('');
        setMeetingType(''); setPlatform(''); setMeetingLink(''); setLocation('');
        setPreSessionNotes(''); setNotes('');
        if (initialContact) {
          setContactId(String(initialContact.id));
          setSelectedContactObj(initialContact);
        } else {
          setContactId('');
          setSelectedContactObj(null);
        }
      }
      setShowContactPicker(false);
      setContactSearch('');
      setErrors({});
    }
  }, [open, editSession]);

  const createMutation = useMutation({
    mutationFn: (data) => Session.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sessions'] }); onSuccess?.(); onClose(); },
    onError: (error) => { console.error('Error creating session:', error); setErrors({ submit: 'Failed to create session.' }); },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => Session.update(editSession.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sessions'] }); onSuccess?.(); onClose(); },
    onError: (error) => { console.error('Error updating session:', error); setErrors({ submit: 'Failed to update session.' }); },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const validate = () => {
    const newErrors = {};
    if (!contactId) newErrors.contactId = 'Please select a contact';
    if (!sessionDate) newErrors.sessionDate = 'Please select a date';
    if (!sessionTime) newErrors.sessionTime = 'Please select a time';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    let dateTime = null;
    if (sessionDate && sessionTime) {
      const [hours, minutes] = sessionTime.split(':');
      const combined = new Date(sessionDate);
      combined.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      dateTime = combined.toISOString();
    }
    let scheduledEndTime = null;
    if (dateTime && duration) {
      const endTime = new Date(dateTime);
      endTime.setMinutes(endTime.getMinutes() + duration);
      scheduledEndTime = endTime.toISOString();
    }

    // If platform is Google Meet or Zoom, create via their APIs (which also save the session)
    if (!isEditMode && platform === 'Google Meet' && isGoogleConnected) {
      setCreatingMeet(true);
      setMeetError('');
      try {
        const response = await base44.functions.invoke('createInstantSession', {
          contact_id: contactId,
          title: title.trim() || 'Coaching Session',
          date_time: dateTime,
          duration,
          notes: preSessionNotes.trim() || '',
        });
        const data = response.data;
        if (data.success && (data.meet_join_link || data.meet_link)) {
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
          onSuccess?.();
          onClose();
        } else {
          setMeetError(data.error || 'Failed to create Google Meet session');
        }
      } catch (error) {
        setMeetError('Failed to create Google Meet session. Please try again.');
      } finally {
        setCreatingMeet(false);
      }
      return;
    }

    if (!isEditMode && platform === 'Zoom' && isZoomConnected) {
      setCreatingMeet(true);
      setMeetError('');
      try {
        const response = await base44.functions.invoke('createZoomSession', {
          contact_id: contactId,
          title: title.trim() || 'Coaching Session',
          date_time: dateTime,
          duration,
          notes: preSessionNotes.trim() || '',
        });
        const data = response.data;
        if (data.success && data.join_url) {
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
          onSuccess?.();
          onClose();
        } else {
          setMeetError(data.error || 'Failed to create Zoom session');
        }
      } catch (error) {
        setMeetError('Failed to create Zoom session. Please try again.');
      } finally {
        setCreatingMeet(false);
      }
      return;
    }

    const sessionData = {
      title: title.trim() || 'Session', contact_id: contactId, date_time: dateTime,
      start_datetime: dateTime,
      end_datetime: scheduledEndTime,
      duration, scheduled_end_time: scheduledEndTime, status,
      meet_link: meetingLink.trim() || meetLink.trim() || null,
      meeting_link: meetingLink.trim() || meetLink.trim() || null,
      meeting_type: meetingType || null,
      platform: platform || null,
      location: location.trim() || null,
      preSessionNotes: preSessionNotes.trim() || null,
      notes: notes.trim() || null,
    };
    if (isEditMode) updateMutation.mutate(sessionData);
    else createMutation.mutate(sessionData);
  };



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
            style={{
              top: '65px',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-main)',
            }}
          >
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pb-24 md:pb-8"
              style={{ paddingTop: '24px', scrollbarWidth: 'none' }}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-normal">
                    {isEditMode ? 'Edit Session' : 'Schedule Session'}
                  </h2>
                  {selectedContactObj && (
                    <button onClick={() => setShowContactPicker(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      <NeumorphicBadge variant="primary" size="sm">
                        {selectedContactObj.full_name}
                        <RefreshCw className="w-3 h-3 ml-1.5 inline-block" style={{ color: 'var(--nm-badge-primary-color)' }} />
                      </NeumorphicBadge>
                    </button>
                  )}
                </div>

                {errors.submit && (
                  <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    {errors.submit}
                  </div>
                )}

                <NeumorphicCard>
                  <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--nm-badge-default-color)' }}>Session Details</h3>
                  <div className="space-y-4">
                    {!selectedContactObj && (
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Contact *</label>
                        <NeumorphicSelect value={contactId} onChange={(value) => {
                          setContactId(value);
                          const c = (contactsData || []).find(x => String(x.id) === String(value));
                          setSelectedContactObj(c || null);
                        }} options={contactOptions} placeholder="Select a contact..." />
                        {errors.contactId && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.contactId}</p>}
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Session Title</label>
                      <NeumorphicInput type="text" placeholder="e.g., Weekly Check-in, Initial Consultation..." value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                  </div>
                </NeumorphicCard>

                <NeumorphicCard>
                  <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--nm-badge-default-color)' }}>Date & Time</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Date *</label>
                        <NeumorphicDatePicker value={sessionDate} onChange={setSessionDate} placeholder="Select date..." />
                        {errors.sessionDate && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.sessionDate}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Time *</label>
                        <NeumorphicTimePicker value={sessionTime} onChange={setSessionTime} placeholder="Select time..." />
                        {errors.sessionTime && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.sessionTime}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Duration</label>
                        <NeumorphicSelect value={duration} onValueChange={(value) => setDuration(Number(value))} options={DURATION_OPTIONS} />
                      </div>
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Status</label>
                        <NeumorphicSelect value={status} onValueChange={(value) => setStatus(value)} options={STATUS_OPTIONS} />
                      </div>
                    </div>
                  </div>
                </NeumorphicCard>

                <NeumorphicCard>
                  <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--nm-badge-default-color)' }}>Meeting Logistics</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Meeting Type</label>
                        <NeumorphicSelect value={meetingType} onValueChange={(value) => setMeetingType(value)} options={MEETING_TYPE_OPTIONS} placeholder="Select type..." />
                      </div>
                      <div>
                        <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Platform</label>
                        <NeumorphicSelect value={platform} onValueChange={(value) => setPlatform(value)} options={getPlatformOptions(isGoogleConnected, isZoomConnected)} placeholder="Select platform..." />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Location</label>
                      <NeumorphicInput type="text" placeholder="Address or meeting place..." value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Meeting Link</label>
                      <NeumorphicInput type="url" placeholder="https://meet.google.com/... or Zoom link" value={meetingLink || meetLink} onChange={(e) => {
                        setMeetingLink(e.target.value);
                        setMeetLink(e.target.value);
                      }} />
                    </div>
                  </div>
                  {meetError && (
                    <p className="text-xs mt-3" style={{ color: '#ef4444' }}>{meetError}</p>
                  )}
                </NeumorphicCard>

                <NeumorphicCard>
                  <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--nm-badge-default-color)' }}>Notes</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Pre-Session Notes</label>
                      <NeumorphicTextarea placeholder="Things to discuss, goals for this session..." value={preSessionNotes} onChange={(e) => setPreSessionNotes(e.target.value)} rows={3} />
                    </div>
                    <div>
                      <label className="text-sm font-normal mb-2 block" style={{ color: 'var(--nm-badge-default-color)' }}>Session Notes</label>
                      <NeumorphicTextarea placeholder="Notes taken during or after the session..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                    </div>
                  </div>
                </NeumorphicCard>

                <div className="flex justify-end gap-3">
                  <NeumorphicButton onClick={onClose}>Cancel</NeumorphicButton>
                  <NeumorphicButton variant="primary" onClick={handleSubmit} loading={isSubmitting || creatingMeet}>
                    {isEditMode ? 'Update Session' : 'Schedule Session'}
                  </NeumorphicButton>
                </div>
              </div>
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
                      Back to Schedule Session
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
                        {(contactsData || [])
                          .filter(c => (c.full_name || '').toLowerCase().includes(contactSearch.toLowerCase()))
                          .map((c) => {
                            const initials = getInitials(c.full_name);
                            const color = c.avatar_color || getAvatarColor(c.full_name);
                            const isCurrent = selectedContactObj?.id === c.id;
                            return (
                              <div
                                key={c.id}
                                className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                                onClick={() => { setSelectedContactObj(c); setContactId(String(c.id)); setShowContactPicker(false); setContactSearch(''); }}
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