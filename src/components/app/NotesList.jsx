import React, { useState } from 'react';
import { StickyNote, Pin, User, Calendar, Map, CheckSquare, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Note, Contact, Session, Journey, Task } from '@/components/api/entities';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import { formatDate } from '@/components/utils/entityHelpers';
import NoteDetailPanel from '@/components/app/NoteDetailPanel';
import { NeumorphicListSkeleton } from '@/components/ui/NeumorphicSkeleton';
import ListToolbar from '@/components/app/ListToolbar';
import ContactSelectionPanel from '@/components/app/ContactSelectionPanel';

const NOTE_TYPE_ICONS = {
  'My Note': StickyNote,
  'Contact Note': User,
  'Session Note': Calendar,
  'Journey Note': Map,
  'Task Note': CheckSquare,
};

const NOTE_TYPE_VARIANTS = {
  'My Note': 'checkin',
  'Contact Note': 'primary',
  'Session Note': 'warning',
  'Journey Note': 'learning',
  'Task Note': 'info',
};

export default function NotesList({ selectedNote: externalSelectedNote, onNoteSelect }) {
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [internalSelectedNote, setInternalSelectedNote] = useState(null);

  const selectedNote = externalSelectedNote !== undefined ? externalSelectedNote : internalSelectedNote;
  const setSelectedNote = (note) => {
    if (onNoteSelect) onNoteSelect(note);
    else setInternalSelectedNote(note);
  };
  const [selectedNoteType, setSelectedNoteType] = useState('All');
  const [searchValue, setSearchValue] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [contactFilter, setContactFilter] = useState(null);
  const [showContactFilterPanel, setShowContactFilterPanel] = useState(false);

  // Fetch notes
  const { data: notesData, isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: () => Note.list(),
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => Contact.list(),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => Session.list(),
  });

  const { data: journeysData } = useQuery({
    queryKey: ['journeys'],
    queryFn: () => Journey.list(),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => Task.list(),
  });

  // Process notes with linked entity info
  const notes = (notesData || []).map(note => {
    let linkedName = null;
    let linkedContactId = null;

    if (note.linkedContact) {
      const contact = (contactsData || []).find(c => c.id === note.linkedContact);
      linkedName = contact?.full_name;
      linkedContactId = note.linkedContact;
    } else if (note.linkedSession) {
      const session = (sessionsData || []).find(s => s.id === note.linkedSession);
      linkedName = session?.title || 'Session';
      // Also get the contact from the session for contact filtering
      if (session?.contact_id) linkedContactId = session.contact_id;
    } else if (note.linkedJourney) {
      const journey = (journeysData || []).find(j => j.id === note.linkedJourney);
      linkedName = journey?.title;
    } else if (note.linkedTask) {
      const task = (tasksData || []).find(t => t.id === note.linkedTask);
      linkedName = task?.title;
    }

    return {
      ...note,
      linkedName,
      linkedContactId,
    };
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });

  // Filter by type
  let filteredNotes = selectedNoteType === 'All'
    ? notes
    : notes.filter(n => n.noteType === selectedNoteType);

  // Contact filter
  if (contactFilter) {
    filteredNotes = filteredNotes.filter(n => n.linkedContactId === contactFilter.id);
  }

  // Search filter
  if (searchValue.trim()) {
    const q = searchValue.toLowerCase();
    filteredNotes = filteredNotes.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q) ||
      (n.linkedName || '').toLowerCase().includes(q)
    );
  }

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  const filterStates = ['All', 'My Note', 'Contact Note', 'Session Note', 'Journey Note', 'Task Note'];
  const filterColors = ['default', 'checkin', 'primary', 'warning', 'learning', 'info'];

  if (isLoading) return <NeumorphicListSkeleton itemCount={5} />;

  if (error) {
    return (
      <NeumorphicCard className="p-8 text-center">
        <p style={{ color: 'var(--nm-badge-default-color)' }}>Error loading notes. Please try again.</p>
      </NeumorphicCard>
    );
  }

  const renderNote = (note) => {
    const Icon = NOTE_TYPE_ICONS[note.noteType] || StickyNote;
    const typeVariant = NOTE_TYPE_VARIANTS[note.noteType] || 'checkin';

    const dateObj = note.created_date ? new Date(note.created_date) : null;
    const dayStr = dateObj ? dateObj.getDate() : '--';
    const monthStr = dateObj ? dateObj.toLocaleDateString('en-GB', { month: 'short' }) : '---';

    return (
      <NeumorphicCard
        key={note.id}
        className="!px-6 !py-4 transition-all duration-200"
        clickable
        onClick={() => setSelectedNote(note)}
      >
        <div className="flex items-center gap-4">
          {/* Date badge — mirrors sessions day/month icon */}
          <div className="relative flex-shrink-0">
            <div className="neumorphic-icon-badge md flex-col gap-0">
              <span className="text-lg font-bold leading-none" style={{ color: 'var(--nm-text-color)' }}>{dayStr}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none" style={{ color: 'var(--nm-badge-primary-color)', marginTop: '2px' }}>{monthStr}</span>
            </div>
            {/* Note type icon overlay */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--nm-background)] shadow-[var(--nm-shadow-main)] flex items-center justify-center z-10">
              <Icon className="w-2.5 h-2.5" style={{ color: 'var(--nm-badge-primary-color)' }} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {note.isPinned && (
                <Pin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#2f949d' }} />
              )}
              <span className="text-base font-normal truncate">{note.title || 'Untitled'}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap" style={{ transform: 'translateY(-3px)' }}>
              <NeumorphicBadge variant={typeVariant} size="sm">
                {note.noteType || 'My Note'}
              </NeumorphicBadge>
              {note.linkedName && (
                <NeumorphicBadge variant="primary" size="sm">
                  {note.linkedName}
                </NeumorphicBadge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--nm-badge-default-color)' }} />
          </div>
        </div>
      </NeumorphicCard>
    );
  };

  return (
    <>
      <ListToolbar
        onAdd={() => setShowCreateNote(true)}
        searchPlaceholder="Search notes..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filterStates={filterStates}
        filterColors={filterColors}
        onFilterChange={setSelectedNoteType}
        showFilter={showFilter}
        onFilterToggle={() => {
          setShowFilter(prev => !prev);
          if (showFilter) setSelectedNoteType('All');
        }}
        extraFilters={
          <div className="flex items-center gap-2">
            {contactFilter ? (
              <button
                onClick={() => setContactFilter(null)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-shadow-inset)',
                  color: 'var(--nm-badge-primary-color)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {contactFilter.full_name} ×
              </button>
            ) : (
              <button
                onClick={() => setShowContactFilterPanel(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-shadow-main)',
                  color: 'var(--nm-badge-default-color)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Filter by contact
              </button>
            )}
          </div>
        }
      />

      {filteredNotes.length === 0 ? (
        <NeumorphicCard className="p-8 text-center">
          <p style={{ color: 'var(--nm-badge-default-color)' }}>
            {selectedNoteType === 'All'
              ? 'No notes yet. Create your first note to get started.'
              : `No ${selectedNoteType.toLowerCase()} notes found.`}
          </p>
        </NeumorphicCard>
      ) : (
        <div className="space-y-6">
          {pinnedNotes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 px-1" style={{ color: 'var(--nm-badge-default-color)' }}>
                Pinned ({pinnedNotes.length})
              </h3>
              <div className="flex flex-col gap-4">
                {pinnedNotes.map(renderNote)}
              </div>
            </div>
          )}

          {otherNotes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 px-1" style={{ color: 'var(--nm-badge-default-color)' }}>
                {pinnedNotes.length > 0 ? `All Notes (${otherNotes.length})` : `Notes (${otherNotes.length})`}
              </h3>
              <div className="flex flex-col gap-4">
                {otherNotes.map(renderNote)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note Detail / Edit Panel */}
      <NoteDetailPanel
        open={showCreateNote || !!selectedNote}
        note={selectedNote}
        onClose={() => {
          setShowCreateNote(false);
          setSelectedNote(null);
        }}
        backLabel="Back to Notebook"

      />

      {/* Contact Filter Panel */}
      <ContactSelectionPanel
        open={showContactFilterPanel}
        onClose={() => setShowContactFilterPanel(false)}
        currentContactId={contactFilter?.id}
        onSelect={(contact) => {
          setContactFilter(contact);
          setShowContactFilterPanel(false);
        }}
      />
    </>
  );
}