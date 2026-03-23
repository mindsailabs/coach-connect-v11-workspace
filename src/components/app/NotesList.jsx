import React, { useState } from 'react';
import { StickyNote, Pin, Plus, User, Calendar, Map, CheckSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Note, Contact, Session, ContactJourney, Journey, Task } from '@/components/api/entities';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import { formatDate } from '@/components/utils/entityHelpers';
import NoteDetailPanel from '@/components/app/NoteDetailPanel';
import NeumorphicSkeleton from '@/components/ui/NeumorphicSkeleton';
import ListToolbar from '@/components/app/ListToolbar';

const NOTE_TYPE_ICONS = {
  'My Note': StickyNote,
  'Contact Note': User,
  'Session Note': Calendar,
  'Journey Note': Map,
  'Task Note': CheckSquare,
};

const NOTE_TYPE_COLORS = {
  'My Note': '#8b5cf6',
  'Contact Note': '#2f949d',
  'Session Note': '#ed8936',
  'Journey Note': '#ec4899',
  'Task Note': '#4299e1',
};

export default function NotesList() {
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [selectedNoteType, setSelectedNoteType] = useState('All');
  const [searchValue, setSearchValue] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // Fetch notes
  const { data: notesData, isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: () => Note.list(),
  });

  // Fetch related entities for display
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

  // Process notes with linked entity names
  const notes = (notesData || []).map(note => {
    let linkedName = null;
    
    if (note.linkedContact) {
      const contact = (contactsData || []).find(c => c.id === note.linkedContact);
      linkedName = contact?.full_name;
    } else if (note.linkedSession) {
      const session = (sessionsData || []).find(s => s.id === note.linkedSession);
      linkedName = session?.title || 'Session';
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
    };
  }).sort((a, b) => {
    // Pinned first, then by creation date
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });

  // Filter by type
  let filteredNotes = selectedNoteType === 'All' 
    ? notes 
    : notes.filter(n => n.noteType === selectedNoteType);

  // Search filter
  if (searchValue.trim()) {
    const q = searchValue.toLowerCase();
    filteredNotes = filteredNotes.filter(n => 
      (n.title || '').toLowerCase().includes(q) || 
      (n.content || '').toLowerCase().includes(q) || 
      (n.linkedName || '').toLowerCase().includes(q)
    );
  }

  const filterStates = ['All', 'My Note', 'Contact Note', 'Session Note', 'Journey Note', 'Task Note'];
  const filterColors = ['default', 'checkin', 'primary', 'warning', 'learning', 'info'];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <NeumorphicCard key={i} className="space-y-3">
            <div className="flex items-center gap-2">
              <NeumorphicSkeleton width="w-8" height="h-8" />
              <NeumorphicSkeleton width="w-24" height="h-4" />
            </div>
            <NeumorphicSkeleton width="w-full" height="h-4" />
            <NeumorphicSkeleton width="w-3/4" height="h-3" />
            <NeumorphicSkeleton width="w-full" height="h-3" />
          </NeumorphicCard>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <NeumorphicCard className="p-8 text-center">
        <p style={{ color: 'var(--nm-badge-default-color)' }}>Error loading notes. Please try again.</p>
      </NeumorphicCard>
    );
  }

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
      />

      {filteredNotes.length === 0 ? (
        <NeumorphicCard className="p-8 text-center">
          <p style={{ color: 'var(--nm-badge-default-color)' }}>
            {selectedNoteType === 'All' 
              ? 'No notes yet. Create your first note to get started.'
              : `No ${selectedNoteType.toLowerCase()} notes found.`
            }
          </p>
        </NeumorphicCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => {
            const Icon = NOTE_TYPE_ICONS[note.noteType] || StickyNote;
            const color = NOTE_TYPE_COLORS[note.noteType] || '#8b5cf6';

            return (
              <NeumorphicCard key={note.id} className="relative transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                {/* Pin indicator */}
                {note.isPinned && (
                  <div className="absolute top-3 right-3">
                    <Pin className="w-4 h-4" style={{ color: '#2f949d' }} />
                  </div>
                )}

                {/* Type icon and badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ 
                      background: `${color}15`,
                      boxShadow: 'var(--nm-shadow-main)'
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <NeumorphicBadge variant="default" size="sm">
                    {note.noteType || 'My Note'}
                  </NeumorphicBadge>
                </div>

                {/* Title */}
                <h4 className="text-base font-medium mb-1 line-clamp-1">
                  {note.title || 'Untitled'}
                </h4>

                {/* Content preview */}
                <p 
                  className="text-sm line-clamp-2 mb-3"
                  style={{ color: 'var(--nm-badge-default-color)' }}
                >
                  {note.content || 'No content'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>
                  <span>{note.linkedName || ''}</span>
                  <span>{formatDate(note.created_date)}</span>
                </div>
              </NeumorphicCard>
            );
          })}
        </div>
      )}

      <NoteDetailPanel
        open={showCreateNote}
        onClose={() => setShowCreateNote(false)}
        backLabel="Back to Notebook"
      />
    </>
  );
}