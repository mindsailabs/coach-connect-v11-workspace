import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, Shield, FileVideo, Video, Flag, Clock, Trash2, Download, Share2, Loader2 } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import ViewHeader from '@/components/ui/ViewHeader';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import { formatDate, formatTime } from '@/components/utils/entityHelpers';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

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
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [loadingRecording, setLoadingRecording] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Stream recording via backend proxy — no Google sign-in needed
  useEffect(() => {
    let blobUrl = null;

    if (!session?.id) return;

    // If there's a direct recording URL (non-Drive), use it
    if (session?.recording_url) {
      setRecordingUrl(session.recording_url);
      return;
    }

    // If there's a Drive file ID, stream it through our backend proxy
    if (session?.recording_file_id) {
      setLoadingRecording(true);
      setLoadError(null);

      // Build the function URL and call with fetch to get binary response
      const { serverUrl, appId, functionsVersion } = appParams;
      const token = localStorage.getItem('base44_access_token') || appParams.token;
      const version = functionsVersion || 'latest';
      const functionUrl = `${serverUrl}/api/apps/${appId}/functions/${version}/streamRecording`;

      fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ sessionId: session.id })
      })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server error: ${res.status}`);
          }
          const contentType = res.headers.get('content-type') || '';
          if (contentType.startsWith('video/') || contentType.startsWith('application/octet-stream')) {
            const blob = await res.blob();
            blobUrl = URL.createObjectURL(blob);
            setRecordingUrl(blobUrl);
          } else {
            // Unexpected JSON response (maybe error)
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Unexpected response type');
          }
        })
        .catch((err) => {
          console.error('Failed to stream recording:', err);
          setLoadError(err.message || 'Failed to load recording. Please try again.');
        })
        .finally(() => setLoadingRecording(false));
    }

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [session?.id, session?.recording_url, session?.recording_file_id]);

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
              {loadingRecording ? (
                <div className="text-white opacity-70 flex flex-col items-center gap-4 p-6 text-center">
                  <Loader2 className="w-10 h-10 animate-spin opacity-50" />
                  <p>Loading recording...</p>
                </div>
              ) : loadError ? (
                <div className="text-white opacity-70 flex flex-col items-center gap-4 p-6 text-center">
                  <FileVideo className="w-12 h-12 mb-2 opacity-50" />
                  <p>{loadError}</p>
                </div>
              ) : recordingUrl ? (
                <video
                  src={recordingUrl}
                  controls
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
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