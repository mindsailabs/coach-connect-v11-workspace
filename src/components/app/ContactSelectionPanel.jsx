import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import { Contact, Session, ContactJourney } from '@/components/api/entities';
import { useQuery } from '@tanstack/react-query';
import { getInitials, getAvatarColor } from '@/components/utils/entityHelpers';

export default function ContactSelectionPanel({ open, onClose, onSelect, currentContactId }) {
  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => Contact.list(),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => Session.list(),
  });

  const { data: contactJourneysData } = useQuery({
    queryKey: ['contactJourneys'],
    queryFn: () => ContactJourney.list(),
  });

  const contacts = (contactsData || []).map(contact => {
    const contactSessions = (sessionsData || []).filter(s => s.contact_id === contact.id);
    const contactJourneys = (contactJourneysData || []).filter(cj => cj.contact_id === contact.id);
    
    return {
      id: contact.id,
      name: contact.full_name,
      initials: getInitials(contact.full_name),
      color: contact.avatar_color || getAvatarColor(contact.full_name),
      journeysCount: contactJourneys.length,
      sessionsCount: contactSessions.length,
      originalContact: contact
    };
  });

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
                onClick={onClose}
                className="bottom-nav-btn flex items-center gap-1.5 text-sm font-normal transition-opacity hover:opacity-70 mb-8"
                style={{ color: 'var(--nm-text-color)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>

              <h2 className="text-2xl font-normal mb-6">Filter by Contact</h2>

              <div className="space-y-3">
                <NeumorphicCard className="!p-0 overflow-hidden">
                  <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                    {contacts.map((contact) => {
                      const isCurrent = currentContactId === contact.id;
                      return (
                        <div
                          key={contact.id}
                          className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                          onClick={() => { onSelect(contact.originalContact); onClose(); }}
                        >
                          <div
                            className="neumorphic-avatar sm flex-shrink-0"
                            style={{ backgroundColor: contact.color, color: '#fff' }}
                          >
                            <span style={{ transform: 'translateY(-1px)', fontSize: '0.65rem' }}>{contact.initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-base font-normal">{contact.name}</span>
                            <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>
                              {contact.journeysCount} journeys · {contact.sessionsCount} sessions
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}