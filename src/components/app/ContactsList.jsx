import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Mail, Phone, ChevronRight, Plus, UserPlus } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicAvatar from '@/components/ui/NeumorphicAvatar';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import ContactFormPanel from '@/components/app/ContactFormPanel';
import { Contact, ContactJourney } from '@/components/api/entities';
import { useQuery } from '@tanstack/react-query';
import { getInitials, getAvatarColor, getContactTypeVariant, parseTags } from '@/components/utils/entityHelpers';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import { NeumorphicListSkeleton } from '@/components/ui/NeumorphicSkeleton';

const CONTACT_TYPE_COLORS = {
  'Client': 'primary',
  'Practitioner': 'info',
  'Prospect': 'warning',
  'Other': 'default'
};

const CONTACT_TYPE_BADGE_VARIANTS = {
  'Client': 'primary',
  'Practitioner': 'info',
  'Prospect': 'warning',
  'Other': 'default'
};

export default function ContactsList({ returnToContact, onReturnToContactClear, selectedContact, onContactSelect, showAddForm, onAddFormClose, onAddFormUnsavedChange, onAddFormSaveRequest, contactTypeFilter = 'All', searchValue = '', onCountChange }) {
  const { data: contactsData, isLoading, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => Contact.list()
  });

  const { data: activeJourneysData = [] } = useQuery({
    queryKey: ['activeJourneys'],
    queryFn: () => ContactJourney.filter({ status: 'Active' })
  });

  // Transform database contacts to match UX expectations
  let contacts = (contactsData || []).map((contact) => ({
    id: contact.id,
    name: contact.full_name,
    initials: getInitials(contact.full_name),
    avatarColor: contact.avatar_color || getAvatarColor(contact.full_name),
    role: contact.contact_type,
    roleVariant: getContactTypeVariant(contact.contact_type),
    tags: parseTags(contact.health_goals),
    extraTags: Math.max(0, parseTags(contact.health_goals).length - 2),
    email: contact.email,
    phone: contact.phone || '',
    status: contact.status,
    hasActiveJourney: activeJourneysData.some(j => j.contact_id === contact.id),
    // Keep original data for detail panel
    _raw: contact
  }));

  // Filter contacts by type
  if (contactTypeFilter !== 'All') {
    contacts = contacts.filter((contact) => contact.role === contactTypeFilter);
  }

  // Filter contacts by search value
  if (searchValue.trim()) {
    const search = searchValue.toLowerCase();
    contacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(search) ||
    contact.email.toLowerCase().includes(search) ||
    contact.phone && contact.phone.toLowerCase().includes(search) ||
    contact.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  }

  React.useEffect(() => {
    onCountChange?.(contacts.length);
  }, [contacts.length]);

  const [selectedContactCard, setSelectedContactCard] = useState(null);
  const isFormOpen = showAddForm !== undefined ? showAddForm : false;
  const handleFormClose = () => {
    if (onAddFormClose) {
      onAddFormClose();
    }
  };

  React.useEffect(() => {
    if (returnToContact && contacts.length > 0) {
      const match = contacts.find((c) => c.name === returnToContact.name);
      if (match) onContactSelect?.(match);
      onReturnToContactClear?.();
    }
  }, [returnToContact, contacts, onContactSelect, onReturnToContactClear]);

  // Update selected contact when data changes (e.g., after save)
  React.useEffect(() => {
    if (selectedContact && contacts.length > 0) {
      const updated = contacts.find((c) => c.id === selectedContact.id);
      if (updated && JSON.stringify(updated._raw) !== JSON.stringify(selectedContact._raw)) {
        onContactSelect?.(updated);
      }
    }
  }, [contacts, selectedContact, onContactSelect]);

  if (isLoading) {
    return <NeumorphicListSkeleton itemCount={3} />;
  }

  if (error) {
    return (
      <NeumorphicCard className="p-8 text-center">
        <p style={{ color: 'var(--nm-badge-default-color)' }}>Error loading contacts. Please try again.</p>
      </NeumorphicCard>);

  }

  if (contacts.length === 0) {
    return (
      <>
        <NeumorphicCard className="p-8 text-center">
          <p style={{ color: 'var(--nm-badge-default-color)' }}>No contacts yet. Add your first contact to get started.</p>
        </NeumorphicCard>
        <ContactFormPanel
          open={isFormOpen}
          onClose={handleFormClose}
          onUnsavedChange={onAddFormUnsavedChange}
          onSaveRequest={onAddFormSaveRequest}
          onSuccess={(createdContact) => {
            if (createdContact && createdContact.id) {
              const formattedContact = {
                id: createdContact.id,
                name: createdContact.full_name,
                initials: getInitials(createdContact.full_name),
                avatarColor: createdContact.avatar_color || getAvatarColor(createdContact.full_name),
                role: createdContact.contact_type,
                roleVariant: getContactTypeVariant(createdContact.contact_type),
                tags: parseTags(createdContact.health_goals),
                extraTags: Math.max(0, parseTags(createdContact.health_goals).length - 2),
                email: createdContact.email,
                phone: createdContact.phone || '',
                status: createdContact.status,
                _raw: createdContact
              };
              onContactSelect?.(formattedContact);
            }
          }} />

      </>);

  }

  return (
    <>
    <NeumorphicCard className="!p-0 overflow-hidden">
      <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
        {contacts.map((contact) =>
          <div
            key={contact.id}
            className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            onClick={() => onContactSelect?.(contact)}
          >
            <div className="relative flex-shrink-0">
              <div
                className="neumorphic-avatar md"
                style={{ backgroundColor: contact.avatarColor, color: '#fff' }}
              >
                <span style={{ transform: 'translateY(-1px)' }}>{contact.initials.toUpperCase()}</span>
              </div>
              {contact.hasActiveJourney && (
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-[--nm-background]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-base font-normal truncate">{contact.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <span
                  className="flex-shrink-0"
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    backgroundColor: `var(--nm-badge-${CONTACT_TYPE_BADGE_VARIANTS[contact.role] || 'default'}-color)`,
                    color: '#fff',
                    fontWeight: '500',
                  }}
                >
                  {contact.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }} />
            </div>
          </div>
        )}
      </div>
      </NeumorphicCard>

    <ContactFormPanel
        open={isFormOpen}
        onClose={handleFormClose}
        onUnsavedChange={onAddFormUnsavedChange}
        onSaveRequest={onAddFormSaveRequest}
        onSuccess={(createdContact) => {
          if (createdContact && createdContact.id) {
            const formattedContact = {
              id: createdContact.id,
              name: createdContact.full_name,
              initials: getInitials(createdContact.full_name),
              avatarColor: createdContact.avatar_color || getAvatarColor(createdContact.full_name),
              role: createdContact.contact_type,
              roleVariant: getContactTypeVariant(createdContact.contact_type),
              tags: parseTags(createdContact.health_goals),
              extraTags: Math.max(0, parseTags(createdContact.health_goals).length - 2),
              email: createdContact.email,
              phone: createdContact.phone || '',
              status: createdContact.status,
              _raw: createdContact
            };
            onContactSelect?.(formattedContact);
          }
        }} />
    </>);}