import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, Shield, FileVideo, Video, Flag, Clock, Trash2, Download, Share2 } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import ViewHeader from '@/components/ui/ViewHeader';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import { formatDate, formatTime } from '@/components/utils/entityHelpers';

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

export default function SessionRecordingPanel({ session, contact, onClose }) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const { effectiveStart, effectiveDuration } = React.useMemo(() => {
    let start = session?.start_datetime || session?.date_time;
    let duration = session?.duration;

    if (session?.start_datetime && session?.ended_at) {
      duration = Math.max(1, Math.round((new Date(session.ended_at) - new Date(session.start_datetime)) / 60000));
    }

    return { 
      effectiveStart: start, 
      effectiveDuration: duration
    };
  }, [session]);

  const meetUrl = session?.meet_link || session?.meeting_link || '';
  const platformInfo = getPlatformInfo(session?.platform, meetUrl);
  const isVideoCall = !!meetUrl || !!platformInfo || session?.meeting_type === 'Video Call';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed md:absolute left-0 right-0 bottom-0 z-[100] flex flex-col"
      style={{
        top: '65px',
        background: 'var(--nm-background)',
        boxShadow: 'var(--nm-shadow-main)',
      }}
    >
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8 flex flex-col" 
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <ViewHeader 
          title="Recording"
          icons={[
            {
              id: 'delete',
              icon: Trash2,
              color: 'var(--nm-badge-default-color)',
              onClick: () => {}
            },
            {
              id: 'download',
              icon: Download,
              color: 'var(--nm-badge-default-color)',
              onClick: () => {}
            },
            {
              id: 'share',
              icon: Share2,
              color: 'var(--nm-badge-default-color)',
              onClick: () => {}
            }
          ]}
        />
        
        <div className="flex flex-col gap-6 flex-1">
          <NeumorphicCard className="!px-6 !py-4 flex-1 flex flex-col">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="neumorphic-icon-badge md">
                  <FileVideo style={{ color: 'var(--nm-badge-default-color)' }} />
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
                  <span className="text-base font-normal truncate">{session?.title || 'Session'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-nowrap text-xs" style={{ transform: 'translateY(-3px)', color: 'var(--nm-badge-default-color)' }}>
                  {(effectiveStart || effectiveDuration) && (
                    <>
                      {effectiveStart && (
                        <div className="flex items-center gap-1.5">
                          <Flag className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{formatDate(effectiveStart)} at {formatTime(effectiveStart)}</span>
                        </div>
                      )}
                      {(effectiveStart && effectiveDuration) && <span className="mx-1 opacity-50">•</span>}
                      {effectiveDuration && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{effectiveDuration} min</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>


            
            <div className="flex-1 bg-black self-stretch min-h-[300px] md:min-h-[500px] -mx-6 mt-4 overflow-hidden flex items-center justify-center relative mb-4">
              {session?.recording_url ? (
                session.recording_url.toLowerCase().endsWith('.mp4') ? (
                  <video 
                    src={session.recording_url} 
                    controls 
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <iframe 
                    src={session.recording_url} 
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen"
                  />
                )
              ) : session?.recording_file_id ? (
                <iframe 
                  src={`https://drive.google.com/file/d/${session.recording_file_id}/preview`} 
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen"
                />
              ) : (
                <div className="text-white opacity-70 flex flex-col items-center gap-4 p-6 text-center">
                  <FileVideo className="w-12 h-12 mb-2 opacity-50" />
                  <p>Video recording not available</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between w-full text-sm min-h-[20px]" style={{ color: 'var(--nm-badge-default-color)' }}>
              {/* Placeholder for future content */}
            </div>
          </NeumorphicCard>
        </div>
      </div>
    </motion.div>
  );
}