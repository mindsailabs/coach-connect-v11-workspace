import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, User, ChevronRight, Plus, Play, CheckCircle, AlertCircle, Loader, X, RefreshCw, Phone, Users, MessageSquare, LayoutGrid } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Session, Contact } from '@/components/api/entities';
import { base44 } from '@/api/base44Client';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import { formatDate, formatTime, formatRelativeDate, getSessionStatusVariant, formatMinutes } from '@/components/utils/entityHelpers';
import SessionDetailPanel from '@/components/app/SessionDetailPanel';
import SessionFormPanel from '@/components/app/SessionFormPanel';
import { NeumorphicListSkeleton } from '@/components/ui/NeumorphicSkeleton';
import ListToolbar from '@/components/app/ListToolbar';
import ContactSelectionPanel from '@/components/app/ContactSelectionPanel';

const getPlatformInfo = (platformStr, linkStr = '') => {
  const p = (platformStr || '').toLowerCase();
  const l = (linkStr || '').toLowerCase();
  
  if (p.includes('meet') || p.includes('google') || l.includes('meet.google')) {
    return { name: 'Google Meet', icon: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg' };
  }
  if (p.includes('zoom') || l.includes('zoom.us')) {
    return { name: 'Zoom', icon: 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos/zoom-icon.svg' };
  }
  if (p.includes('teams') || l.includes('teams.microsoft')) {
    return { name: 'Microsoft Teams', icon: 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos/microsoft-teams.svg' };
  }
  if (p.includes('whatsapp') || l.includes('wa.me')) {
    return { name: 'WhatsApp', icon: 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos/whatsapp-icon.svg', iconClass: 'scale-[1.3]' };
  }
  if (p.includes('skype') || l.includes('skype.com')) {
    return { name: 'Skype', icon: 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos/skype.svg' };
  }
  return null;
};

const STATUS_ICONS = {
  scheduled: Calendar,
  upcoming: Calendar,
  live: Play,
  processing: Loader,
  summary_ready: CheckCircle,
  completed: CheckCircle,
  cancelled: AlertCircle,
  failed: AlertCircle,
};

export default function SessionsList({ 
  initialContactFilter, 
  onContactFilterClear, 
  selectedSession, 
  onSessionSelect,
  activeSessionSubPanel,
  onSessionSubPanelChange,
  showAddForm,
  onAddFormClose,
  sessionStatusFilter,
  searchValue,
  showContactFilterPanel,
  onContactFilterPanelClose,
  onContactFilterSelect
}) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [localSelectedSession, setLocalSelectedSession] = useState(null);
  const [bulkRefreshing, setBulkRefreshing] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const handleBulkBackfill = async () => {
    setBulkRefreshing(true);
    setBulkResult(null);
    try {
      const res = await base44.functions.invoke('bulkBackfillArtifacts', {});
      setBulkResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } catch (e) {
      console.error('Bulk backfill error:', e);
    } finally {
      setBulkRefreshing(false);
    }
  };
  const currentSession = selectedSession !== undefined ? selectedSession : localSelectedSession;
  const handleSessionSelect = onSessionSelect || setLocalSelectedSession;
  
  const showCreateForm = showAddForm || false;
  const filterStatus = sessionStatusFilter || 'All';
  const querySearchValue = searchValue || '';

  const [contactFilter, setContactFilter] = useState(initialContactFilter || null);

  // Apply contact filter from prop
  useEffect(() => {
    setContactFilter(initialContactFilter || null);
  }, [initialContactFilter]);

  // Fetch sessions
  const { data: sessionsData, isLoading, error } = useQuery({
    queryKey: ['sessions', contactFilter?.id],
    queryFn: () => {
      if (contactFilter?.id) {
        return Session.list().then(sessions => sessions.filter(s => s.contact_id === contactFilter.id));
      }
      return Session.list();
    },
  });

  // Fetch contacts for display names
  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => Contact.list(),
  });

  // Process sessions with contact info
  const sessions = (sessionsData || []).map(session => {
    const contact = (contactsData || []).find(c => c.id === session.contact_id);
    return {
      ...session,
      contactName: contact?.full_name || 'Unknown Contact',
      contactInitials: contact?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?',
      contactColor: contact?.avatar_color || '#a0aec0',
    };
  }).sort((a, b) => {
    // Sort by date, upcoming first
    const dateA = new Date(a.date_time || 0);
    const dateB = new Date(b.date_time || 0);
    const now = new Date();
    
    // Upcoming sessions first (future dates)
    const aIsUpcoming = dateA > now;
    const bIsUpcoming = dateB > now;
    
    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (!aIsUpcoming && bIsUpcoming) return 1;
    
    // For upcoming, sort ascending (soonest first)
    // For past, sort descending (most recent first)
    if (aIsUpcoming) return dateA - dateB;
    return dateB - dateA;
  });

  // Filter sessions
  let filteredSessions = filterStatus === 'All' 
    ? sessions 
    : sessions.filter(s => s.status === filterStatus.toLowerCase());

  // Contact filter
  if (contactFilter) {
    filteredSessions = filteredSessions.filter(s => s.contact_id === contactFilter.id);
  }

  // Search filter
  if (querySearchValue.trim()) {
    const q = querySearchValue.toLowerCase();
    filteredSessions = filteredSessions.filter(s => 
      (s.title || '').toLowerCase().includes(q) || 
      (s.contactName || '').toLowerCase().includes(q)
    );
  }

  // Group sessions
  const now = new Date();
  const upcomingSessions = filteredSessions.filter(s => new Date(s.date_time) > now);
  const pastSessions = filteredSessions.filter(s => new Date(s.date_time) <= now);

  const filterStates = ['All', 'Scheduled', 'Completed', 'Cancelled'];
  const filterColors = ['default', 'info', 'success', 'error'];

  if (isLoading) {
    return <NeumorphicListSkeleton itemCount={5} />;
  }

  if (error) {
    return (
      <NeumorphicCard className="p-8 text-center">
        <p style={{ color: 'var(--nm-badge-default-color)' }}>Error loading sessions. Please try again.</p>
      </NeumorphicCard>
    );
  }

  const renderSession = (session) => {
    const hasAISummary = session.aiSessionSummary || session.summary;
    const statusBadge = session.status || 'scheduled';
    const statusColor = statusBadge === 'scheduled' || statusBadge === 'upcoming' ? '#ed8936' :
                        statusBadge === 'live' ? '#48bb78' :
                        statusBadge === 'completed' ? '#48bb78' :
                        statusBadge === 'processing' || statusBadge === 'summary_ready' ? '#ed8936' :
                        statusBadge === 'failed' || statusBadge === 'cancelled' ? '#f56565' :
                        '#718096';

    const dateObj = session.date_time ? new Date(session.date_time) : null;
    const dayStr = dateObj ? dateObj.getDate() : '--';
    const monthStr = dateObj ? dateObj.toLocaleDateString('en-GB', { month: 'short' }) : '---';
    const fullDateStr = dateObj ? dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const timeStr = dateObj ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
    const duration = session.duration ? `${session.duration}m` : null;
    const dateTimeStr = session.date_time ? `${fullDateStr} ${timeStr}${duration ? ` • ${duration}` : ''}` : null;

    const meetUrl = session.meet_link || session.meet_join_link || session.meeting_link || '';
    const platformInfo = getPlatformInfo(session.platform, meetUrl);
    const isVideoCall = !!meetUrl || !!platformInfo || session.meeting_type === 'Video Call';
    
    let MainIcon = Calendar;
    const lowerTitle = (session.title || '').toLowerCase();
    
    if (session.meeting_type === 'Face to Face') {
      MainIcon = Users;
    } else if (session.meeting_type === 'Video Call') {
      MainIcon = Video;
    } else if (session.meeting_type === 'Phone Call') {
      MainIcon = Phone;
    } else if (session.meeting_type === 'Chat') {
      MainIcon = MessageSquare;
    } else if (isVideoCall) {
      MainIcon = Video;
    } else if (lowerTitle.includes('phone') || lowerTitle.includes('call')) {
      MainIcon = Phone;
    }

    return (
      <NeumorphicCard
        key={session.id}
        className="!px-6 !py-4 transition-all duration-200"
        clickable
        onClick={() => handleSessionSelect(session)}
      >
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="neumorphic-icon-badge md flex-col gap-0">
              <span className="text-lg font-bold leading-none" style={{ color: 'var(--nm-text-color)' }}>{dayStr}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none" style={{ color: 'var(--nm-badge-primary-color)', marginTop: '2px' }}>{monthStr}</span>
            </div>
            {isVideoCall && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--nm-background)] shadow-[var(--nm-shadow-main)] flex items-center justify-center overflow-hidden z-10 p-0.5">
                {platformInfo ? (
                  <img src={platformInfo.icon} alt={platformInfo.name} className={`w-full h-full object-contain ${platformInfo.iconClass || ''}`} />
                ) : (
                  <Video className="w-2.5 h-2.5 text-blue-500" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 relative z-10">
              <span className="text-base font-normal truncate">{session.title || `Session with ${session.contactName}`}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap" style={{ transform: 'translateY(-3px)' }}>
              {timeStr && (
                <span className="text-sm font-medium text-[var(--nm-badge-default-color)]">
                  {timeStr}{duration ? ` • ${duration}` : ''}
                </span>
              )}
              <NeumorphicBadge variant="primary" size="sm">
                {session.contactName}
              </NeumorphicBadge>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }} />
          </div>
        </div>
        

      </NeumorphicCard>
    );
  };

  return (
    <>
      {filteredSessions.length === 0 ? (
        <NeumorphicCard className="p-8 text-center">
          <p style={{ color: 'var(--nm-badge-default-color)' }}>
            {filterStatus === 'All' 
              ? 'No sessions yet. Schedule your first session to get started.'
              : `No ${filterStatus.toLowerCase()} sessions found.`
            }
          </p>
        </NeumorphicCard>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 px-1" style={{ color: 'var(--nm-badge-default-color)' }}>
                Upcoming ({upcomingSessions.length})
              </h3>
              <div className="flex flex-col gap-4">
                {upcomingSessions.map(renderSession)}
              </div>
            </div>
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-medium" style={{ color: 'var(--nm-badge-default-color)' }}>
                  Past ({pastSessions.length})
                </h3>
                <button
                  onClick={handleBulkBackfill}
                  disabled={bulkRefreshing}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: 'var(--nm-background)',
                    boxShadow: 'var(--nm-shadow-main)',
                    color: bulkRefreshing ? 'var(--nm-badge-default-color)' : 'var(--nm-badge-primary-color)',
                    border: 'none',
                    cursor: bulkRefreshing ? 'default' : 'pointer'
                  }}
                  title="Refresh artifacts for all past meetings"
                >
                  <RefreshCw className={`w-3 h-3 ${bulkRefreshing ? 'animate-spin' : ''}`} />
                  {bulkRefreshing ? 'Refreshing...' : bulkResult ? `${bulkResult.artifactsFound} updated` : 'Refresh all'}
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {pastSessions.map(renderSession)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Detail Panel */}
      <SessionDetailPanel
        session={currentSession}
        onClose={() => handleSessionSelect(null)}
        activeSubPanel={activeSessionSubPanel}
        onSubPanelChange={onSessionSubPanelChange}
      />

      {/* Session Form Panel */}
      <SessionFormPanel
        open={showCreateForm}
        onClose={() => {
          if (onAddFormClose) onAddFormClose();
        }}
        onSuccess={() => {}}
      />

      <ContactSelectionPanel
        open={showContactFilterPanel}
        onClose={() => {
          if (onContactFilterPanelClose) onContactFilterPanelClose();
        }}
        currentContactId={contactFilter?.id}
        onSelect={(contact) => {
          if (onContactFilterSelect) {
            onContactFilterSelect(contact);
          } else {
            setContactFilter(contact);
          }
        }}
      />
    </>
  );
}