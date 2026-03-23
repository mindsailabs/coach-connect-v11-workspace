import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Video, User, Edit2,
  Brain, Lightbulb, Target, Heart, AlertTriangle, 
  CheckSquare, MessageSquare, Sparkles, ExternalLink,
  ChevronDown, Trash2, RefreshCw, FileText, FileVideo,
  CheckCircle2, AlertCircle, Phone, Users, MapPin, ChevronRight, Link, LayoutGrid, Plus
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Contact, Session, Task } from '@/components/api/entities';
import { base44 } from '@/api/base44Client';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import NeumorphicAvatar from '@/components/ui/NeumorphicAvatar';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import ViewHeader from '@/components/ui/ViewHeader';
import { formatDate, formatTime, formatMinutes, getSessionStatusVariant, getInitials } from '@/components/utils/entityHelpers';
import SessionFormPanel from '@/components/app/SessionFormPanel';
import SessionAnalysisDisplay from '@/components/app/SessionAnalysisDisplay';
import SessionTranscriptPanel from '@/components/app/SessionTranscriptPanel.jsx';
import SessionRecordingPanel from '@/components/app/SessionRecordingPanel.jsx';

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

const getPlatformIcon = (platform, linkStr = "", className = "w-3.5 h-3.5") => {
  const info = getPlatformInfo(platform, linkStr);
  if (info) {
    return <img src={info.icon} alt={info.name} className={`h-4 w-4 object-contain ${info.iconClass || ''}`} />;
  }
  const p = (platform || '').toLowerCase();
  if (p.includes('phone')) return <Phone className={className} />;
  if (p.includes('person') || p.includes('face')) return <Users className={className} />;
  if (p) return <Video className={className} />;
  return null;
};

export default function SessionDetailPanel({ session: sessionProp, onClose, activeSubPanel, onSubPanelChange }) {
  const [expandedSections, setExpandedSections] = useState(['summary']);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [localActiveSubPanel, setLocalActiveSubPanel] = useState(null);
  const queryClient = useQueryClient();

  const currentSubPanel = activeSubPanel !== undefined ? activeSubPanel : localActiveSubPanel;
  const handleSubPanelChange = onSubPanelChange || setLocalActiveSubPanel;

  const showEditForm = currentSubPanel === 'edit';
  const showTranscriptPanel = currentSubPanel === 'transcript';
  const showRecordingPanel = currentSubPanel === 'recording';

  React.useEffect(() => {
    if (sessionProp) {
      handleSubPanelChange(null);
      setShowDeleteWarning(false);
      setExpandedSections(['summary']);
    }
  }, [sessionProp?.id]);

  // Always read the live session from cache so UI updates after refresh
  const { data: liveSession } = useQuery({
    queryKey: ['sessions'],
    select: (sessions) => sessions?.find(s => s.id === sessionProp?.id),
    enabled: !!sessionProp?.id,
  });
  const session = liveSession || sessionProp;

  const handleRefreshArtifacts = async () => {
    if (!session?.id || refreshing) return;
    setRefreshing(true);
    try {
      await base44.functions.invoke('backfillArtifacts', { sessionId: session.id });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    } catch (e) {
      console.error('Refresh artifacts error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const { data: contact } = useQuery({
    queryKey: ['contact', session?.contact_id],
    queryFn: () => Contact.get(session.contact_id),
    enabled: !!session?.contact_id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'session', session?.id],
    queryFn: () => Task.filter({ session_id: session?.id }),
    enabled: !!session?.id,
  });

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const hasAIContent = session?.aiSessionSummary || session?.summary || 
                       session?.keyDiscussionPoints || session?.progressAssessment ||
                       session?.breakthroughMoments || session?.concernsRaised ||
                       session?.clientCommitments || session?.recommendedFollowups;

  const aiSections = [
    { key: 'summary', title: 'Session Summary', icon: Brain, color: '#8b5cf6', content: session?.aiSessionSummary || session?.summary },
    { key: 'keyPoints', title: 'Key Discussion Points', icon: MessageSquare, color: '#4299e1', content: session?.keyDiscussionPoints },
    { key: 'progress', title: 'Progress Assessment', icon: Target, color: '#10b981', content: session?.progressAssessment },
    { key: 'emotional', title: 'Emotional State', icon: Heart, color: '#ec4899', content: session?.emotionalState },
    { key: 'breakthroughs', title: 'Breakthrough Moments', icon: Sparkles, color: '#f59e0b', content: session?.breakthroughMoments },
    { key: 'concerns', title: 'Concerns Raised', icon: AlertTriangle, color: '#ef4444', content: session?.concernsRaised },
    { key: 'commitments', title: 'Client Commitments', icon: CheckSquare, color: '#2f949d', content: session?.clientCommitments },
    { key: 'followups', title: 'Recommended Follow-ups', icon: Lightbulb, color: '#8b5cf6', content: session?.recommendedFollowups },
  ].filter(s => s.content);

  const meetUrl = session?.meet_link || session?.meeting_link || '';
  const platformInfo = getPlatformInfo(session?.platform, meetUrl);
  const isVideoCall = !!meetUrl || !!platformInfo || session?.meeting_type === 'Video Call';
  
  let MainIcon = Calendar;
  const lowerTitle = (session?.title || '').toLowerCase();
  
  if (session?.meeting_type === 'Face to Face') {
    MainIcon = Users;
  } else if (session?.meeting_type === 'Video Call') {
    MainIcon = Video;
  } else if (session?.meeting_type === 'Phone Call') {
    MainIcon = Phone;
  } else if (session?.meeting_type === 'Chat') {
    MainIcon = MessageSquare;
  } else if (isVideoCall) {
    MainIcon = Video;
  } else if (lowerTitle.includes('phone') || lowerTitle.includes('call')) {
    MainIcon = Phone;
  }

  const hasRecording = !!(session?.recording_url || session?.recording_file_id);
  const hasTranscript = !!(session?.transcript_url || session?.transcript_doc_id || session?.edited_transcript);

  return (
    <AnimatePresence>
      {!!session && (
        <>
          <motion.div
            className="absolute inset-0 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed md:absolute left-0 right-0 bottom-0 z-[90] flex flex-col"
            style={{
              top: '65px',
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-main)',
            }}
          >
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8" 
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              <ViewHeader
                icons={[
                  {
                    id: 'refresh',
                    icon: RefreshCw,
                    color: '#2f949d',
                    iconClassName: refreshing ? 'animate-spin' : '',
                    onClick: handleRefreshArtifacts
                  },
                  {
                    id: 'edit',
                    icon: Edit2,
                    onClick: () => handleSubPanelChange('edit')
                  }
                ]}
              />
              <div className="space-y-6">
                {/* Header Card */}
                <NeumorphicCard>
                  <div className="flex flex-col w-full">
                    <div className="flex items-center gap-4 w-full">
                      <div className="relative flex-shrink-0">
                        <div className="neumorphic-icon-badge md">
                          <MainIcon style={{ color: 'var(--nm-badge-default-color)' }} />
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
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-xl font-normal relative z-10">
                          {session.title || 'Session'}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap pl-16" style={{ transform: 'translateY(-4px)' }}>
                      {contact && (
                        <NeumorphicBadge variant="primary" size="sm">
                          {contact.full_name}
                        </NeumorphicBadge>
                      )}
                      {session.session_type && (
                        <NeumorphicBadge variant="default" size="sm">
                          {session.session_type}
                        </NeumorphicBadge>
                      )}
                    </div>
                  </div>

                  <div className="border-t w-full mt-4 mb-3" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }} />
                  <div className="text-sm flex flex-col gap-2" style={{ color: 'var(--nm-badge-default-color)' }}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {(session.date_time || session.duration) && (
                          <>
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>
                                {session.date_time ? formatDate(session.date_time) : ''}
                                {session.date_time ? ` at ${formatTime(session.date_time)}` : ''}
                                {session.date_time && session.duration ? ' • ' : ''}
                                {session.duration ? formatMinutes(session.duration) : ''}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <span
                        className="flex-shrink-0"
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          backgroundColor: 
                            (session.status === 'scheduled' || session.status === 'upcoming') ? '#ed8936' :
                            session.status === 'live' ? '#48bb78' :
                            session.status === 'completed' ? '#48bb78' :
                            (session.status === 'processing' || session.status === 'summary_ready') ? '#ed8936' :
                            (session.status === 'failed' || session.status === 'cancelled') ? '#f56565' :
                            '#718096',
                          color: '#fff',
                          fontWeight: '500',
                        }}
                      >
                        {session.status === 'processing' ? 'Processing...' : 
                         session.status === 'summary_ready' ? 'Completed' : 
                         session.status === 'live' ? 'Live' : 
                         (session.status || 'scheduled').charAt(0).toUpperCase() + (session.status || 'scheduled').slice(1).replace('_', ' ')}
                      </span>
                    </div>
                    {session.location && session.location.toLowerCase() !== 'virtual' && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{session.location}</span>
                      </div>
                    )}
                    
                    <div className="border-t w-full my-2" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }} />
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-start gap-2">
                        <Link className="w-3.5 h-3.5 flex-shrink-0" />
                        <div className="cursor-pointer hover:opacity-80 transition-opacity">
                          <NeumorphicBadge variant="primary" size="sm">
                            Weight Loss Journey (Demo)
                          </NeumorphicBadge>
                        </div>
                      </div>
                    </div>
                  </div>




                </NeumorphicCard>

                {(session.meeting_link || session.meet_link) && (
                  <NeumorphicCard className="!py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-sm font-medium" style={{ color: 'var(--nm-text-color)' }}>Video Call</h3>
                      </div>
                      <NeumorphicButton
                        variant="default"
                        onClick={() => window.open(session.meeting_link || session.meet_link, '_blank', 'noopener,noreferrer')}
                      >
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(session.platform, session.meeting_link || session.meet_link, "w-4 h-4") || <Video className="w-4 h-4" />}
                          <span>Join Meeting</span>
                        </div>
                      </NeumorphicButton>
                    </div>
                  </NeumorphicCard>
                )}

                <NeumorphicCard className="!p-0 overflow-visible">
                  <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                    
                    {/* Session Notes */}
                    <div>
                      <div
                        className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200"
                        onClick={() => toggleSection('sessionNotes')}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="neumorphic-avatar md" style={{ backgroundColor: '#2f949d', color: '#fff' }}>
                            <FileText className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-normal">Session Notes</span>
                          </div>
                          <p className="text-xs truncate" style={{ color: 'var(--nm-badge-default-color)' }}>
                            {(session.preSessionNotes || session.notes) ? "Notes added for the session" : "No notes assigned yet"}
                          </p>
                        </div>
                        {(session.preSessionNotes || session.notes) ? (
                          <ChevronDown
                            className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                            style={{
                              color: 'var(--nm-badge-default-color)',
                              transform: expandedSections.includes('sessionNotes') ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                          />
                        ) : (
                          <button
                            className="flex-shrink-0 flex items-center justify-center transition-all duration-200 hover:scale-105"
                            style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: 'var(--nm-background)',
                              boxShadow: 'var(--nm-shadow-main)',
                              border: 'none', cursor: 'pointer'
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" style={{ color: 'var(--nm-badge-primary-color)' }} />
                          </button>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {expandedSections.includes('sessionNotes') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="px-6 pb-6 pt-2 text-sm" style={{ color: 'var(--nm-text-color)' }}>
                              {session.preSessionNotes || session.notes || "No session notes available."}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Session Tasks */}
                    <div>
                      <div
                        className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200"
                        onClick={() => toggleSection('tasks')}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="neumorphic-avatar md" style={{ backgroundColor: '#f6ad55', color: '#fff' }}>
                            <CheckSquare className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-normal">Session Tasks</span>
                            {tasks.length > 0 && (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2">
                                {tasks.length}
                              </span>
                            )}
                          </div>
                          <p className="text-xs truncate" style={{ color: 'var(--nm-badge-default-color)' }}>
                            {tasks.length > 0 ? "Tasks related to this session" : "No tasks assigned yet"}
                          </p>
                        </div>
                        {tasks.length > 0 ? (
                          <ChevronDown
                            className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                            style={{
                              color: 'var(--nm-badge-default-color)',
                              transform: expandedSections.includes('tasks') ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                          />
                        ) : (
                          <button
                            className="flex-shrink-0 flex items-center justify-center transition-all duration-200 hover:scale-105"
                            style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: 'var(--nm-background)',
                              boxShadow: 'var(--nm-shadow-main)',
                              border: 'none', cursor: 'pointer'
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" style={{ color: 'var(--nm-badge-primary-color)' }} />
                          </button>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {expandedSections.includes('tasks') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="px-6 pb-6 pt-2 text-sm" style={{ color: 'var(--nm-text-color)' }}>
                              {tasks.length > 0 ? (
                                <ul className="space-y-2">
                                  {tasks.map(task => (
                                    <li key={task.id} className="flex items-center gap-2">
                                      <CheckSquare className="w-4 h-4 text-gray-400" />
                                      <span className={task.status === 'done' ? 'line-through text-gray-400' : ''}>{task.title}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                "No tasks for this session."
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {['completed', 'summary_ready', 'processing'].includes(session.status) && (
                      <>
                        {/* Recording */}
                        <div
                          className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 ${hasRecording ? 'cursor-pointer' : ''}`}
                          onClick={() => hasRecording && handleSubPanelChange('recording')}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="neumorphic-avatar md" style={{ backgroundColor: '#ef4444', color: '#fff' }}>
                              <FileVideo className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-normal">Recording</span>
                            </div>
                            <p className="text-xs truncate" style={{ color: 'var(--nm-badge-default-color)' }}>
                              {hasRecording
                                ? 'Video recording available'
                                : session.video_provider === 'zoom'
                                  ? 'Waiting for Zoom to process...'
                                  : 'Waiting for Google to process...'}
                            </p>
                          </div>
                          {hasRecording && (
                            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }} />
                          )}
                        </div>

                        {/* Transcript */}
                        <div
                          className={`flex items-center gap-4 px-6 py-4 transition-all duration-200 ${hasTranscript ? 'cursor-pointer' : ''}`}
                          onClick={() => hasTranscript && handleSubPanelChange('transcript')}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="neumorphic-avatar md" style={{ backgroundColor: '#4299e1', color: '#fff' }}>
                              <FileText className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-normal">Transcript</span>
                            </div>
                            <p className="text-xs truncate" style={{ color: 'var(--nm-badge-default-color)' }}>
                              {hasTranscript
                                ? 'Text transcript available'
                                : session.video_provider === 'zoom'
                                  ? 'Waiting for Zoom to process...'
                                  : 'Waiting for Google to process...'}
                            </p>
                          </div>
                          {hasTranscript && (
                            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--nm-badge-default-color)' }} />
                          )}
                        </div>

                        {/* Meeting Summary */}
                        <div>
                          <div
                            className="flex items-center gap-4 px-6 py-4 cursor-pointer transition-all duration-200"
                            onClick={() => toggleSection('summary')}
                          >
                            <div className="relative flex-shrink-0">
                              <div className="neumorphic-avatar md" style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>
                                <Brain className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-normal">Meeting Summary</span>
                              </div>
                              <p className="text-xs truncate" style={{ color: 'var(--nm-badge-default-color)' }}>
                                AI-generated meeting summary
                              </p>
                            </div>
                            <ChevronDown
                              className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                              style={{
                                color: 'var(--nm-badge-default-color)',
                                transform: expandedSections.includes('summary') ? 'rotate(180deg)' : 'rotate(0deg)'
                              }}
                            />
                          </div>
                          <AnimatePresence initial={false}>
                            {expandedSections.includes('summary') && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div className="px-6 pb-6 pt-2 text-sm" style={{ color: 'var(--nm-text-color)' }}>
                                  {(session.aiSessionSummary || session.summary) ? (
                                    <SessionAnalysisDisplay summaryJson={session.aiSessionSummary || session.summary} />
                                  ) : (
                                    "No summary available yet."
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </>
                    )}

                  </div>
                </NeumorphicCard>

                <div className="mt-6 mb-4">
                  <NeumorphicCard 
                    className="!p-0 overflow-visible"
                    clickable
                    onClick={() => setShowDeleteWarning(true)}
                  >
                    <div className="flex items-center gap-4 px-6 py-4">
                      <div className="neumorphic-avatar md flex-shrink-0" style={{ background: 'var(--nm-background)' }}>
                        <Trash2 className="w-4 h-4" style={{ color: 'var(--nm-badge-error-color)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-normal" style={{ color: 'var(--nm-badge-error-color)' }}>Delete Session</span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>This action cannot be undone.</p>
                      </div>
                    </div>
                  </NeumorphicCard>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delete Warning Modal */}
          {showDeleteWarning &&
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-6"
              style={{ background: 'var(--nm-modal-backdrop)' }}
              onClick={() => setShowDeleteWarning(false)}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 30 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full max-w-sm p-6"
                style={{
                  borderRadius: 'var(--nm-radius)',
                  background: 'var(--nm-background)',
                  boxShadow: 'var(--nm-modal-shadow-main)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--nm-badge-error-color)' }} />
                  <h3 className="text-base font-normal" style={{ color: 'var(--nm-text-color)' }}>Delete Session</h3>
                </div>

                <p className="text-sm mb-6" style={{ color: 'var(--nm-badge-default-color)' }}>
                  Once deleted, this action cannot be reversed. Are you sure you want to continue?
                </p>

                <div className="flex flex-col gap-3">
                  <NeumorphicButton 
                    variant="default" 
                    onClick={async () => {
                      try {
                        await Session.delete(session.id);
                        queryClient.invalidateQueries({ queryKey: ['sessions'] });
                        setShowDeleteWarning(false);
                        onClose();
                      } catch (e) {
                        console.error('Delete failed:', e);
                        alert('Failed to delete session.');
                      }
                    }} 
                    className="w-full !bg-[#f56565] !text-white"
                  >
                    Continue
                  </NeumorphicButton>
                  <NeumorphicButton variant="default" onClick={() => setShowDeleteWarning(false)} className="w-full">
                    Cancel
                  </NeumorphicButton>
                </div>
              </motion.div>
            </motion.div>
          }

          <SessionFormPanel
            open={showEditForm}
            onClose={() => handleSubPanelChange(null)}
            editSession={session}
            backLabel={`Back to ${session.title || 'Session'}`}
            onSuccess={() => {
              handleSubPanelChange(null);
              onClose();
            }}
          />
          
          <AnimatePresence>
            {showTranscriptPanel && (
              <SessionTranscriptPanel
                session={session}
                contact={contact}
                onClose={() => handleSubPanelChange(null)}
              />
            )}
            {showRecordingPanel && (
              <SessionRecordingPanel
                session={session}
                contact={contact}
                onClose={() => handleSubPanelChange(null)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}