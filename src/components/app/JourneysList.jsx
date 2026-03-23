import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import { Users, ChevronRight, X } from 'lucide-react';
import JourneyDetailPanel from '@/components/app/JourneyDetailPanel';
import ListToolbar from '@/components/app/ListToolbar';
import NeumorphicListSkeleton from '@/components/ui/NeumorphicSkeleton';
import AddJourneyPanel from '@/components/app/AddJourneyPanel';

export default function JourneysList({ pendingJourney, pendingSourceContact, onPendingJourneyClear, onBackToContact, selectedJourney, onJourneySelect, onSourceContactClear, onAssignJourneyOpen }) {
  const [addJourneyOpen, setAddJourneyOpen] = useState(false);
  const { data: journeys = [], isLoading } = useQuery({
    queryKey: ['journeys', pendingSourceContact?.id],
    queryFn: async () => {
      const [journeyData, contactJourneyData] = await Promise.all([
        base44.entities.Journey.list(),
        base44.entities.ContactJourney.list(),
      ]);
      
      let filtered = journeyData || [];
      if (pendingSourceContact?.id) {
        const contactJourneyIds = contactJourneyData
          .filter(cj => cj.contact_id === pendingSourceContact.id)
          .map(cj => cj.journey_id);
        filtered = filtered.filter(j => contactJourneyIds.includes(j.id));
      }
      
      return filtered.map(j => ({
        id: j.id,
        title: j.title,
        duration: j.duration_weeks ? `${j.duration_weeks} Weeks` : 'N/A',
        status: j.is_active ? 'Active' : 'Inactive',
        contactsCount: 0,
        progress: 0,
        milestones: [],
      }));
    },
  });
  const setSelectedJourney = (journey) => {
    onJourneySelect?.(journey);
  };
  const [sourceContact, setSourceContact] = useState(pendingSourceContact || null);
  const [searchValue, setSearchValue] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  React.useEffect(() => {
    if (pendingJourney) {
      setSelectedJourney(pendingJourney);
      setSourceContact(pendingSourceContact || null);
      onPendingJourneyClear?.();
    }
  }, [pendingJourney]);

  React.useEffect(() => {
    if (pendingSourceContact) {
      setSourceContact(pendingSourceContact);
    }
  }, [pendingSourceContact]);

  let filtered = journeys;
  if (filterStatus !== 'All') {
    filtered = filtered.filter(j => j.status === filterStatus);
  }
  if (searchValue.trim()) {
    const q = searchValue.toLowerCase();
    filtered = filtered.filter(j => 
      (j.title || '').toLowerCase().includes(q)
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4 px-1">
        <ListToolbar
          onAdd={() => { setAddJourneyOpen(true); onAssignJourneyOpen?.(); }}
          searchPlaceholder="Search journeys..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filterStates={['All', 'Active', 'Inactive']}
          filterColors={['default', 'success', 'primary']}
          onFilterChange={setFilterStatus}
          showFilter={showFilter}
          onFilterToggle={() => {
            setShowFilter(prev => !prev);
          }}
        />
        {sourceContact && (
          <div className="flex items-center gap-2 bg-[var(--nm-background)] rounded-full px-3 py-1.5" style={{ boxShadow: 'var(--nm-shadow-main)' }}>
            <span className="text-sm">{sourceContact.name}</span>
            <button 
              onClick={() => {
                setSourceContact(null);
                onSourceContactClear?.();
              }}
              className="p-0.5 hover:opacity-70 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {isLoading ? (
        <NeumorphicListSkeleton itemCount={3} />
      ) : (
        <NeumorphicCard className="!p-0 overflow-hidden">
          <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
            {filtered.map((j) => (
            <div
              key={j.id}
              className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              onClick={() => { setSelectedJourney(j); }}
            >
              {/* Two-line info block */}
              <div className="flex-1 min-w-0">
                <h5 className="text-lg font-normal truncate">{j.title}</h5>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>{j.duration}</span>
                  <span className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>•</span>
                  <Users className="w-3.5 h-3.5" style={{ color: 'var(--nm-badge-default-color)' }} />
                  <span className="text-sm" style={{ color: 'var(--nm-badge-default-color)' }}>{j.contactsCount}</span>
                </div>
              </div>

              {/* Chevron */}
              <div className="flex-shrink-0">
                <ChevronRight className="w-5 h-5" style={{ color: 'var(--nm-badge-default-color)' }} />
              </div>
            </div>
            ))}
          </div>
        </NeumorphicCard>
      )}

      {selectedJourney && (
        <JourneyDetailPanel
        journey={selectedJourney}
        sourceContact={sourceContact}
        onClose={() => { setSelectedJourney(null); }}
        onBackToContact={() => {
          if (sourceContact && onBackToContact) {
            setSelectedJourney(null);
            onBackToContact(sourceContact);
          } else {
            setSelectedJourney(null);
          }
        }}
        />
      )}

      <AddJourneyPanel
        open={addJourneyOpen}
        onClose={() => setAddJourneyOpen(false)}
        onSuccess={() => setAddJourneyOpen(false)}
      />
    </>
  );
}