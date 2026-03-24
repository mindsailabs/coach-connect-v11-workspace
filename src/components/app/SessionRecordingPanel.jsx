import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, Shield, FileVideo, Video, Flag, Clock, Trash2, Download, Share2, Loader2, Play } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import ViewHeader from '@/components/ui/ViewHeader';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import { formatDate, formatTime } from '@/components/utils/entityHelpers';
import { base44 } from '@/api/base44Client';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const videoRef = useRef(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Fetch recording: get token from backend, then download video blob in browser
  const fetchRecordingUrl = useCallback(() => {
    if (!session?.id) return;

    // Direct URL (e.g. Zoom) — use as-is
    if (session?.recording_url) {
      setRecordingUrl(session.recording_url);
      return;
    }

    // Google Drive file — download via blob with Authorization header
    if (session?.recording_file_id) {
      setLoadingRecording(true);
      setLoadError(null);
      setVideoReady(false);
      setDownloadProgress(0);

      base44.functions.invoke('streamRecording', { sessionId: session.id })
        .then(async (res) => {
          const data = res.data;
          if (!data?.success || !data?.downloadUrl || !data?.accessToken) {
            throw new Error(data?.error || 'Failed to get recording access');
          }

          const fileSize = data.fileSize || 0;

          // Download video binary from Google Drive API
          const videoRes = await fetch(data.downloadUrl, {
            headers: { 'Authorization': `Bearer ${data.accessToken}` }
          });

          if (!videoRes.ok) {
            throw new Error(`Download failed: HTTP ${videoRes.status}`);
          }

          // Read response with progress tracking
          const reader = videoRes.body.getReader();
          const chunks = [];
          let received = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            if (fileSize > 0) {
              setDownloadProgress(Math.round((received / fileSize) * 100));
            }
          }

          // Create blob URL
          const blob = new Blob(chunks, { type: data.mimeType || 'video/mp4' });
          const url = URL.createObjectURL(blob);

          // Clean up previous blob URL if any
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = url;
          setRecordingUrl(url);
        })
        .catch((err) => {
          console.error('Recording load failed:', err);
          setLoadError(err.message || 'Failed to load recording');
        })
        .finally(() => {
          setLoadingRecording(false);
        });
    }
  }, [session?.id, session?.recording_url, session?.recording_file_id]);

  useEffect(() => {
    fetchRecordingUrl();
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [fetchRecordingUrl]);

  // Play/pause toggle
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch((err) => {
        console.error('Play failed:', err);
        setVideoError('Unable to play video. The recording may still be loading.');
      });
    } else {
      video.pause();
    }
  }, []);

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
                  {downloadProgress > 0 ? (
                    <>
                      <p>Downloading recording... {downloadProgress}%</p>
                      <div className="w-48 h-1.5 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress}%`, background: '#2f949d' }}
                        />
                      </div>
                    </>
                  ) : (
                    <p>Preparing recording...</p>
                  )}
                </div>
              ) : loadError ? (
                <div className="text-white opacity-70 flex flex-col items-center gap-4 p-6 text-center">
                  <FileVideo className="w-12 h-12 mb-2 opacity-50" />
                  <p>{loadError}</p>
                  <button
                    className="mt-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                    onClick={() => {
                      setLoadError(null);
                      setRecordingUrl(null);
                      fetchRecordingUrl();
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : recordingUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={recordingUrl}
                    controls
                    preload="auto"
                    className="w-full h-full object-contain"
                    style={{ opacity: videoReady ? 1 : 0 }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onLoadedData={() => setVideoReady(true)}
                    onCanPlay={() => setVideoReady(true)}
                    onError={(e) => {
                      console.error('Video element error:', e.target.error);
                      setVideoError('Failed to load video. The recording may not be accessible.');
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>

                  {/* Video error state */}
                  {videoError && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black">
                      <div className="text-white opacity-70 flex flex-col items-center gap-4 p-6 text-center">
                        <FileVideo className="w-12 h-12 mb-2 opacity-50" />
                        <p>{videoError}</p>
                        <button
                          className="mt-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                          onClick={() => {
                            setVideoError(null);
                            setRecordingUrl(null);
                            setVideoReady(false);
                            fetchRecordingUrl();
                          }}
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Play overlay — solid black bg before video loads, semi-transparent after */}
                  {!isPlaying && !videoError && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                      onClick={handlePlayPause}
                      style={{ background: videoReady ? 'rgba(0, 0, 0, 0.35)' : '#000' }}
                    >
                      {!videoReady ? (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-8 h-8 animate-spin text-white opacity-50" />
                          <p className="text-white opacity-50 text-sm">Preparing video...</p>
                        </div>
                      ) : (
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                          style={{
                            background: '#2f949d',
                            boxShadow: '0 4px 24px rgba(47, 148, 157, 0.4)',
                          }}
                        >
                          <Play className="w-9 h-9 text-white ml-1" fill="white" />
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
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
