import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Map, Calendar, ChevronRight, User, FileText } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import { Contact, Session, ContactJourney, Journey } from '@/components/api/entities';
import { useQuery } from '@tanstack/react-query';
import { getInitials, getAvatarColor, formatDate } from '@/components/utils/entityHelpers';

export default function AssignTaskPanel({ open, onClose, onAssign, currentAssignment }) {
  // Fetch contacts
  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => Contact.list(),
  });

  // Fetch sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => Session.list(),
  });

  // Fetch contact journeys with journey details
  const { data: contactJourneysData } = useQuery({
    queryKey: ['contactJourneys'],
    queryFn: () => ContactJourney.list(),
  });

  const { data: journeysData } = useQuery({
    queryKey: ['journeys'],
    queryFn: () => Journey.list(),
  });

  // Transform data to match expected format
  const contacts = (contactsData || []).map(contact => {
    // Get sessions for this contact
    const contactSessions = (sessionsData || [])
      .filter(s => s.contact_id === contact.id)
      .map(session => ({
        id: session.id,
        name: session.title || `Session – ${formatDate(session.date_time)}`,
        initials: 'S',
        color: '#ed8936',
      }));
    
    // Get journeys for this contact
    const contactJourneyEnrollments = (contactJourneysData || [])
      .filter(cj => cj.contact_id === contact.id);
    
    const contactJourneys = contactJourneyEnrollments.map(enrollment => {
      const journey = (journeysData || []).find(j => j.id === enrollment.journey_id);
      return {
        id: enrollment.id,
        journeyId: enrollment.journey_id,
        name: journey?.title || 'Journey',
        initials: (journey?.title || 'J').substring(0, 2).toUpperCase(),
        color: '#8b5cf6',
      };
    });
    
    return {
      id: contact.id,
      name: contact.full_name,
      initials: getInitials(contact.full_name),
      color: contact.avatar_color || getAvatarColor(contact.full_name),
      journeys: contactJourneys,
      sessions: contactSessions,
    };
  });
  const [selectedContact, setSelectedContact] = useState(null);
  const [viewMode, setViewMode] = useState(null);
  const [cameFromContacts, setCameFromContacts] = useState(false);

  React.useEffect(() => {
    if (open) {
      setSelectedContact(null);
      setViewMode(null);
      setCameFromContacts(false);
    }
  }, [open]);

  React.useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAssign = (name, type, id, contactId = null, contactName = null) => {
    const newAssignment = type === 'general' ? null : { type, id, contactId, name, contactName: contactName || name };
    onAssign?.('', name, newAssignment);
  };

  const currentContact = currentAssignment?.type === 'contact' 
    ? contacts.find(c => c.id === currentAssignment.id)
    : currentAssignment?.contactId 
      ? contacts.find(c => c.id === currentAssignment.contactId)
      : null;

  const title = viewMode === 'allContacts' ? 'Contacts' : viewMode === 'allSessions' ? 'Sessions' : viewMode === 'allJourneys' ? 'Journeys' : selectedContact ? selectedContact.name : 'Reassign Task To';
  const backLabel = (viewMode || selectedContact) ? 'Back to Reassign Task' : 'Back to Task';

  const onBackHandler = viewMode ? () => setViewMode(null) : selectedContact ? () => { setSelectedContact(null); if (cameFromContacts) { setViewMode('allContacts'); setCameFromContacts(false); } } : onClose;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[110]" onClick={onClose} />
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
                onClick={onBackHandler}
                className="bottom-nav-btn flex items-center gap-1.5 text-sm font-normal transition-opacity hover:opacity-70 mb-8"
                style={{ color: 'var(--nm-text-color)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {backLabel}
              </button>

              <h2 className="text-2xl font-normal mb-6">{title}</h2>

              {viewMode === 'allContacts' ? (
                <div className="space-y-3">
                  <NeumorphicCard className="!p-0 overflow-hidden">
                    <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                      {contacts.map((contact) => {
                        const isCurrent = currentAssignment?.type === 'contact' && currentAssignment?.id === contact.id;
                        return (
                          <div
                            key={contact.id}
                            className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                            onClick={() => { setSelectedContact(contact); setViewMode(null); setCameFromContacts(true); }}
                          >
                            <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: contact.color, color: '#fff' }}>
                              <span style={{ transform: 'translateY(-1px)', fontSize: '0.65rem' }}>{contact.initials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-base font-normal">{contact.name}</span>
                              <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>
                                {contact.journeys.length} journeys · {contact.sessions.length} sessions
                              </p>
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
              ) : viewMode === 'allSessions' ? (
                <div className="space-y-3">
                  {contacts.filter(c => c.sessions.length > 0).map((contact) => (
                    <div key={contact.id}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: contact.color, color: '#fff', width: '1.25rem', height: '1.25rem', fontSize: '0.5rem' }}>
                          <span style={{ transform: 'translateY(-1px)' }}>{contact.initials}</span>
                        </div>
                        <span className="text-sm font-normal" style={{ color: 'var(--nm-badge-default-color)' }}>{contact.name}</span>
                      </div>
                      <NeumorphicCard className="!p-0 overflow-hidden">
                        <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                          {contact.sessions.map((session) => {
                            const isCurrent = currentAssignment?.type === 'session' && currentAssignment?.id === session.id;
                            return (
                              <div
                                key={session.id}
                                className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                                style={isCurrent ? { background: 'rgba(47, 148, 157, 0.08)' } : {}}
                                onClick={() => handleAssign(session.name, 'session', session.id, contact.id, contact.name)}
                              >
                                <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: session.color, color: '#fff' }}>
                                  <span style={{ transform: 'translateY(-1px)', fontSize: '0.65rem' }}>{session.initials}</span>
                                </div>
                                <span className="text-base font-normal flex-1">{session.name}</span>
                                {isCurrent && (
                                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--nm-badge-primary-muted)', color: '#fff' }}>Current</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </NeumorphicCard>
                    </div>
                  ))}
                </div>
              ) : viewMode === 'allJourneys' ? (
                <div className="space-y-3">
                  {contacts.filter(c => c.journeys.length > 0).map((contact) => (
                    <div key={contact.id}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: contact.color, color: '#fff', width: '1.25rem', height: '1.25rem', fontSize: '0.5rem' }}>
                          <span style={{ transform: 'translateY(-1px)' }}>{contact.initials}</span>
                        </div>
                        <span className="text-sm font-normal" style={{ color: 'var(--nm-badge-default-color)' }}>{contact.name}</span>
                      </div>
                      <NeumorphicCard className="!p-0 overflow-hidden">
                        <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                          {contact.journeys.map((journey) => {
                            const isCurrent = currentAssignment?.type === 'journey' && currentAssignment?.id === journey.id;
                            return (
                              <div
                                key={journey.id}
                                className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                                style={isCurrent ? { background: 'rgba(47, 148, 157, 0.08)' } : {}}
                                onClick={() => handleAssign(journey.name, 'journey', journey.id, contact.id, contact.name)}
                              >
                                <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: journey.color, color: '#fff' }}>
                                  <span style={{ transform: 'translateY(-1px)', fontSize: '0.6rem' }}>{journey.initials}</span>
                                </div>
                                <span className="text-base font-normal flex-1">{journey.name}</span>
                                {isCurrent && (
                                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--nm-badge-primary-muted)', color: '#fff' }}>Current</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </NeumorphicCard>
                    </div>
                  ))}
                </div>
              ) : !selectedContact ? (
                <div className="space-y-3">
                  <NeumorphicCard className="!p-0 overflow-hidden">
                    <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                      {currentContact && (
                        <div
                          className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                          onClick={() => setSelectedContact(currentContact)}
                        >
                          <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: currentContact.color, color: '#fff' }}>
                            <span style={{ transform: 'translateY(-1px)', fontSize: '0.65rem' }}>{currentContact.initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-base font-normal">{currentContact.name}</span>
                            <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>
                              {currentContact.journeys.length} journeys · {currentContact.sessions.length} sessions
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full flex-shrink-0" style={{ background: 'var(--nm-badge-primary-muted)', color: '#fff' }}>Current</span>
                          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }} />
                        </div>
                      )}

                      <div
                        className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                        onClick={() => handleAssign('General', 'general', null)}
                      >
                        <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: 'var(--nm-badge-default-color)', color: '#fff' }}>
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-base font-normal">General Task</span>
                          <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>Not linked to any contact</p>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }} />
                      </div>

                      <div
                        className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                        onClick={() => setViewMode('allContacts')}
                      >
                        <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: '#2f949d', color: '#fff' }}>
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-base font-normal">Contact</span>
                          <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>Linked to a contact</p>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }} />
                      </div>

                      <div
                        className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                        onClick={() => setViewMode('allSessions')}
                      >
                        <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: '#ed8936', color: '#fff' }}>
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-base font-normal">Session</span>
                          <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>Linked to a session</p>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }} />
                      </div>

                      <div
                        className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                        onClick={() => setViewMode('allJourneys')}
                      >
                        <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>
                          <Map className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-base font-normal">Journey</span>
                          <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>Linked to a journey</p>
                        </div>
                        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }} />
                      </div>
                    </div>
                  </NeumorphicCard>
                </div>
              ) : (
                <div className="space-y-4">
                  <NeumorphicCard 
                    clickable 
                    onClick={() => handleAssign(selectedContact.name, 'contact', selectedContact.id)}
                    className={currentAssignment?.type === 'contact' && currentAssignment?.id === selectedContact.id ? '!shadow-[var(--nm-shadow-inset)]' : ''}
                  >
                    <div className="flex items-center gap-4">
                      <div className="neumorphic-avatar smPlus flex-shrink-0" style={{ backgroundColor: selectedContact.color, color: '#fff' }}>
                        <span style={{ transform: 'translateY(-1px)' }}>{selectedContact.initials}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-normal">{selectedContact.name}</h4>
                        <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>Directly to this contact</p>
                      </div>
                      {currentAssignment?.type === 'contact' && currentAssignment?.id === selectedContact.id && (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--nm-badge-primary-muted)', color: '#fff' }}>Current</span>
                      )}
                    </div>
                  </NeumorphicCard>

                  {selectedContact.journeys.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Map className="w-4 h-4" style={{ color: 'var(--nm-badge-default-color)' }} />
                        <span className="text-sm font-normal" style={{ color: 'var(--nm-badge-default-color)' }}>Journeys</span>
                      </div>
                      <NeumorphicCard className="!p-0 overflow-hidden">
                        <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                          {selectedContact.journeys.map((journey) => {
                            const isCurrent = currentAssignment?.type === 'journey' && currentAssignment?.id === journey.id;
                            return (
                              <div
                                key={journey.id}
                                className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                                style={isCurrent ? { background: 'rgba(47, 148, 157, 0.08)' } : {}}
                                onClick={() => handleAssign(journey.name, 'journey', journey.id, selectedContact.id, selectedContact.name)}
                              >
                                <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: journey.color, color: '#fff' }}>
                                  <span style={{ transform: 'translateY(-1px)', fontSize: '0.6rem' }}>{journey.initials}</span>
                                </div>
                                <span className="text-base font-normal flex-1">{journey.name}</span>
                                {isCurrent && (
                                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--nm-badge-primary-muted)', color: '#fff' }}>Current</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </NeumorphicCard>
                    </div>
                  )}

                  {selectedContact.sessions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Calendar className="w-4 h-4" style={{ color: 'var(--nm-badge-default-color)' }} />
                        <span className="text-sm font-normal" style={{ color: 'var(--nm-badge-default-color)' }}>Sessions</span>
                      </div>
                      <NeumorphicCard className="!p-0 overflow-hidden">
                        <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                          {selectedContact.sessions.map((session) => {
                            const isCurrent = currentAssignment?.type === 'session' && currentAssignment?.id === session.id;
                            return (
                              <div
                                key={session.id}
                                className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                                style={isCurrent ? { background: 'rgba(47, 148, 157, 0.08)' } : {}}
                                onClick={() => handleAssign(session.name, 'session', session.id, selectedContact.id, selectedContact.name)}
                              >
                                <div className="neumorphic-avatar sm flex-shrink-0" style={{ backgroundColor: session.color, color: '#fff' }}>
                                  <span style={{ transform: 'translateY(-1px)', fontSize: '0.65rem' }}>{session.initials}</span>
                                </div>
                                <span className="text-base font-normal flex-1">{session.name}</span>
                                {isCurrent && (
                                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--nm-badge-primary-muted)', color: '#fff' }}>Current</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </NeumorphicCard>
                    </div>
                  )}

                  {selectedContact.journeys.length === 0 && selectedContact.sessions.length === 0 && (
                    <div className="text-center py-8" style={{ color: 'var(--nm-badge-default-color)' }}>
                      <p className="text-sm">No journeys or sessions for this contact yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}