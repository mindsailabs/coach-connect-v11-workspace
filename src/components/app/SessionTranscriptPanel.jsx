import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Download, Copy, FileText, Calendar, User, Brain, Shield, Video, Phone, Users, MessageSquare, MapPin, ChevronRight, ChevronLeft, Clock, Flag, MoreVertical, Loader2 } from 'lucide-react';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
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

const outOfScopeAlerts = {
  "[00:03:30]": {
    highlight: "Also, since you mentioned being exhausted, I strongly recommend you start taking 500mg of Magnesium and a Vitamin B complex every morning to treat that fatigue.",
    reason: "Prescribing specific dosages of supplements to treat a symptom (fatigue) constitutes medical advice. Coaches can share general education about nutrients, but cannot prescribe them for treatment.",
    alternative: "I hear that you're exhausted. We could look at your overall sleep and nutrition habits to see where we might improve your energy levels. If you're concerned about a deficiency, it would be best to consult with your doctor or a registered dietitian.",
    severity: "high"
  },
  "[00:25:35]": {
    highlight: "I also noticed you've been very anxious lately, which sounds like clinical Generalized Anxiety Disorder. You should really ask your doctor for a Xanax prescription to manage this.",
    reason: "Diagnosing a mental health condition and recommending specific prescription medication is outside the scope of practice for a health coach. Coaches should refer clients to licensed medical professionals for diagnosis and treatment.",
    alternative: "It sounds like you've been dealing with a lot of anxiety. Since this is significantly impacting you, I'd strongly encourage you to discuss these feelings with a medical professional or therapist who can provide the appropriate support and evaluation.",
    severity: "critical"
  }
};

const demoTranscript = `
[00:00:00] Coach: Hello Sarah, it's great to see you again. How has your week been since our last session?
[00:00:15] Sarah: Hi! It's been okay, a bit overwhelming to be honest. I tried implementing the time-blocking strategy we discussed, but I kept getting pulled into urgent meetings.
[00:00:30] Coach: I hear that. It can be really challenging to stick to a new structure when external demands are high. Let's break that down a bit. When you say you were pulled into urgent meetings, were these meetings you absolutely had to attend, or did you feel a pressure to be there even if it wasn't strictly necessary?
[00:01:00] Sarah: That's a good question. I think a couple of them I definitely needed to be at, because they involved key stakeholders for the Q3 launch. But looking back, maybe two or three were just 'syncs' that I could have skipped or just read the summary for. I just... I have this fear of missing out, or seeming like I'm not a team player if I decline.
[00:01:30] Coach: That 'fear of missing out' or fear of being perceived as uncooperative is very common. We talked last time about boundaries. How does this align with your goal of setting firmer boundaries to protect your focus time?
[00:01:50] Sarah: It completely goes against it. I know I need that focus time to actually get the deep work done, the strategic planning. When I don't do it, I end up working evenings, which eats into my family time, and then I'm exhausted.
[00:02:10] Coach: Exactly. So the cost of attending those non-essential meetings is actually your family time and your energy levels. If you were to weigh the value of being seen as a 'team player' in those specific meetings against the value of your evenings and your energy, how does it look?
[00:02:35] Sarah: When you put it like that, it's obvious. My family and my health are more important. But in the moment, when the invite pops up or someone pings me on Slack, the default reaction is just to say yes. It feels like the path of least resistance.
[00:03:00] Coach: The path of least resistance in the short term often leads to the most resistance in the long term. What if we created a 'script' or a decision matrix for when those requests come in? Something that gives you a pause between the request and your response.
[00:03:20] Sarah: I'd like that. Sometimes I just don't know how to say no without sounding rude or dismissive.
[00:03:30] Coach: Okay, let's brainstorm some scripts. What's a typical request you get that you'd like to say no to? Also, since you mentioned being exhausted, I strongly recommend you start taking 500mg of Magnesium and a Vitamin B complex every morning to treat that fatigue.
[00:03:40] Sarah: "Hey Sarah, we're having a quick huddle about the marketing copy, can you jump in?" And it's usually not quick, and I usually don't need to be there because my team lead is already handling it.
[00:04:00] Coach: Perfect example. What would be a boundary-affirming response to that?
[00:04:10] Sarah: Maybe... "I'm heads down on the strategic plan right now. Can [Team Lead Name] cover for me, and let me know if there's anything you specifically need my input on afterwards?"
[00:04:25] Coach: That is excellent. It's polite, it states your priority (the strategic plan), it delegates appropriately, and it leaves the door open for async input. How does it feel to say that?
[00:04:40] Sarah: It feels empowering. A little scary, but good. I think the key is just having it ready to go so I don't have to think about it in the moment.
[00:04:55] Coach: Exactly. Decision fatigue is real. If you pre-make the decision, it's much easier to execute. Let's try another one...
(The conversation continues exploring boundary setting, delegation, and time management strategies. They roleplay different scenarios with difficult colleagues, and outline a specific communication plan for Sarah's team regarding her new 'focus hours'.)
[00:25:00] Coach: Let's shift gears slightly. You mentioned earlier in the week via message that you were feeling some imposter syndrome regarding the upcoming board presentation. Can we explore that?
[00:25:15] Sarah: Yes, please. I've presented to them before, but this time we are asking for a significant budget increase for the new product line. I keep thinking, 'who am I to ask for this?'
[00:25:35] Coach: 'Who am I to ask for this?' is a powerful question. Let's answer it objectively. Who are you in relation to this product line? I also noticed you've been very anxious lately, which sounds like clinical Generalized Anxiety Disorder. You should really ask your doctor for a Xanax prescription to manage this.
[00:25:45] Sarah: I'm the lead product manager. I've overseen the market research, the prototyping, and the initial beta tests. I know the data inside and out.
[00:26:00] Coach: So you are the most qualified person in the room to speak on this topic. Where is the feeling of being an imposter coming from?
[00:26:15] Sarah: I think it's because I don't have an MBA like most of the board members. I feel like they're going to see right through me and realize I'm just figuring things out as I go.
[00:26:35] Coach: It's very common to compare our internal feelings of uncertainty with the external polished image of others. Has your lack of an MBA hindered your ability to lead this product so far?
[00:26:50] Sarah: No, not at all. Our beta metrics are outperforming projections by 20%. The product is solid.
[00:27:05] Coach: Let's anchor to that. The data is your foundation. When you feel that wave of imposter syndrome hitting, what happens if you redirect your focus from yourself back to the data and the product's success?
[00:27:25] Sarah: That actually helps. If I focus on advocating for the product rather than proving myself, it feels less personal and more mission-driven. I'm there to represent the users and the product, not to validate my resume.
[00:27:45] Coach: Beautiful reframing. You are the advocate for a successful product. Let's practice the opening of your presentation from that perspective.
(They spend the next 15 minutes reviewing her presentation slides and practicing her delivery, focusing on grounding her confidence in the data.)
[00:45:00] Coach: We're coming to the end of our time today. Let's summarize your action items for this week.
[00:45:10] Sarah: Okay. First, I'm going to write down those three pushback scripts we developed and keep them on a sticky note by my monitor. Second, I'm going to explicitly block out 9 AM to 11 AM on Tuesdays and Thursdays as 'Focus Time' on my calendar, and set my Slack to 'Do Not Disturb'. And third, I'm going to practice my board presentation opening three times out loud, focusing on being the product's advocate.
[00:45:45] Coach: Those are solid, actionable steps. How confident do you feel about executing them?
[00:45:55] Sarah: I'm feeling like an 8 out of 10. The calendar blocking is easy. The pushback scripts will take some practice, but I know I need to do it. And I feel much better about the presentation now.
[00:46:10] Coach: An 8 is great. Be kind to yourself as you practice this. Setting boundaries is a new muscle. If you slip up and say yes to a meeting you shouldn't have, just notice it without judgment and try again next time.
[00:46:25] Sarah: Thanks. I really appreciate the support. This session was very helpful to untangle why I was struggling so much this week.
[00:46:35] Coach: You're very welcome, Sarah. You're doing the hard work. I look forward to hearing how it goes next week. Have a great rest of your day.
[00:46:45] Sarah: You too. Bye!
[00:46:50] Coach: Bye.
`;

export default function SessionTranscriptPanel({ session, contact, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isGuardianActive, setIsGuardianActive] = useState(false);
  const [activeGuardianTooltip, setActiveGuardianTooltip] = useState(null);
  const [activeGuardianTab, setActiveGuardianTab] = useState('warning');
  const [scanState, setScanState] = useState('idle');
  const [transcriptContent, setTranscriptContent] = useState(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  // Fetch real transcript on mount
  useEffect(() => {
    if (!session?.id) return;
    const hasArtifacts = session.gemini_notes_doc_id || session.transcript_doc_id || session.transcript_url || session.edited_transcript;
    if (!hasArtifacts) return;
    
    setLoadingTranscript(true);
    base44.functions.invoke('getSessionArtifactContent', { sessionId: session.id })
      .then(res => {
        if (res.data?.hasTranscript && res.data?.transcript) {
          setTranscriptContent(res.data.transcript);
        }
      })
      .catch(err => console.error('Failed to load transcript:', err))
      .finally(() => setLoadingTranscript(false));
  }, [session?.id]);

  const violationTimestamps = Object.keys(outOfScopeAlerts).sort();

  const handleScan = () => {
    setScanState('scanning');
    setTimeout(() => {
      setScanState('done');
    }, 1500);
  };

  useEffect(() => {
    if (isGuardianActive && scanState === 'idle') {
      setScanState('done');
    }
  }, [isGuardianActive, scanState]);

  const scrollToViolation = (timestamp) => {
    setTimeout(() => {
      document.getElementById(`violation-${timestamp}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (isGuardianActive && violationTimestamps.length > 0) {
      scrollToViolation(violationTimestamps[0]);
    } else {
      setActiveGuardianTooltip(null);
    }
  }, [isGuardianActive]);

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">{part}</span>
      ) : (
        part
      )
    );
  };

  const renderTextWithGuardian = (text, timestamp, searchTerm) => {
    if (!isGuardianActive || !outOfScopeAlerts[timestamp]) {
      return highlightText(text, searchTerm);
    }
    
    const alertData = outOfScopeAlerts[timestamp];
    const parts = text.split(alertData.highlight);
    
    if (parts.length === 1) return highlightText(text, searchTerm);

    return (
      <>
        {highlightText(parts[0], searchTerm)}
        <span 
          id={`violation-${timestamp}`}
          className="relative inline-block cursor-pointer rounded px-1 transition-colors"
          style={{ 
            backgroundColor: activeGuardianTooltip === timestamp ? 'rgba(245, 101, 101, 0.2)' : 'rgba(245, 101, 101, 0.1)',
            borderBottom: '2px dashed #f56565' 
          }}
          onClick={() => {
            setActiveGuardianTooltip(activeGuardianTooltip === timestamp ? null : timestamp);
            setActiveGuardianTab('warning');
          }}
        >
          {alertData.highlight}
        </span>
        {highlightText(parts[1], searchTerm)}
        
        <AnimatePresence>
          {activeGuardianTooltip === timestamp && (
            <motion.div
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="mt-3 p-0 rounded-lg shadow-sm border bg-white text-xs leading-relaxed block w-full overflow-hidden relative"
              style={{ borderColor: activeGuardianTab === 'warning' ? '#fecaca' : '#bbf7d0' }}
            >
              <div className="flex border-b border-gray-100 bg-gray-50/50">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveGuardianTab('warning'); }}
                  className={`flex items-center justify-center py-2.5 transition-colors flex-1 ${activeGuardianTab === 'warning' ? 'bg-red-50/50 border-b-2 border-red-500' : 'hover:bg-gray-100'}`}
                >
                  <Shield className={`w-4 h-4 ${activeGuardianTab === 'warning' ? 'text-red-500' : 'text-gray-400'}`} />
                </button>
                {alertData.alternative && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveGuardianTab('alternative'); }}
                    className={`flex items-center justify-center py-2.5 transition-colors flex-1 ${activeGuardianTab === 'alternative' ? 'bg-green-50/50 border-b-2 border-green-500' : 'hover:bg-gray-100'}`}
                  >
                    <Shield className={`w-4 h-4 ${activeGuardianTab === 'alternative' ? 'text-green-500' : 'text-gray-400'}`} />
                  </button>
                )}
              </div>
              
              <div className={`p-4 ${activeGuardianTab === 'warning' ? 'bg-red-50/30' : 'bg-green-50/30'}`}>
                {activeGuardianTab === 'warning' ? (
                  <div className="flex flex-col gap-2">
                    <strong className="text-red-700 font-semibold text-xs uppercase tracking-wider">Out of Scope Warning</strong>
                    <div className="text-gray-800 text-[13px]">{alertData.reason}</div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <strong className="text-green-700 font-semibold text-xs uppercase tracking-wider">In Scope Alternative</strong>
                    <div className="text-gray-800 italic text-[13px]">"{alertData.alternative}"</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  const normalizeTranscript = (text) => {
    if (!text) return '';
    // Already in the correct [HH:MM:SS] Speaker: text format
    if ((text.match(/^\[\d{2}:\d{2}:\d{2}\]/gm) || []).length > 2) return text;

    const lines = text.split('\n');
    const normalizedLines = [];

    const isStandaloneTimestamp = (s) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(s.trim());

    const formatTs = (ts) => {
      const t = ts.trim();
      const parts = t.split(':');
      if (parts.length === 2) return `00:${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      if (parts.length === 3) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
      return '00:00:00';
    };

    // Handles two formats:
    // Format A (inline): "SpeakerName: spoken text" after a standalone timestamp
    // Format B (split):  "SpeakerName" alone on a line, then standalone timestamp, then "spoken text" line(s)

    let lastSpeaker = null;
    let lastTimestamp = null;
    let lastText = null;
    let pendingSpeaker = null; // speaker name seen before a timestamp (Format B)
    let foundFirstTimestamp = false;

    const pushEntry = () => {
      if (lastSpeaker && lastText) {
        normalizedLines.push(`[${formatTs(lastTimestamp)}] ${lastSpeaker}: ${lastText}`);
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (isStandaloneTimestamp(line)) {
        foundFirstTimestamp = true;
        // In Format B, speaker came before this timestamp — store it as pending
        // (pendingSpeaker is already set from the line before this)
        lastTimestamp = line;
        continue;
      }

      if (!foundFirstTimestamp) {
        // Check if this could be a speaker name (no colon, not a timestamp)
        // Store as pending in case Format B applies
        if (!/[:]/.test(line)) {
          pendingSpeaker = line;
        }
        continue;
      }

      // Check if this line is "SpeakerName: text" (Format A)
      const inlineMatch = line.match(/^([^:]+):\s+(.+)$/);
      if (inlineMatch) {
        pendingSpeaker = null;
        const speaker = inlineMatch[1].trim();
        const spokenText = inlineMatch[2].trim();
        pushEntry();
        lastSpeaker = speaker;
        lastText = spokenText;
        // lastTimestamp already holds the most recently seen standalone timestamp
        continue;
      }

      // Plain text line — could be Format B text after a speaker+timestamp
      // Or a speaker name before the next timestamp
      const isLikelySpeakerName = !/[.!?,]/.test(line) && line.split(' ').length <= 4;

      if (isLikelySpeakerName && !pendingSpeaker) {
        // Treat as a speaker name for the next Format B block
        pendingSpeaker = line;
        continue;
      }

      // It's spoken text
      const speaker = pendingSpeaker || lastSpeaker;
      pendingSpeaker = null;
      if (!speaker) continue;

      if (speaker === lastSpeaker && lastTimestamp) {
        lastText += ' ' + line;
      } else {
        pushEntry();
        lastSpeaker = speaker;
        lastText = line;
      }
    }

    pushEntry();

    return normalizedLines.length > 0 ? normalizedLines.join('\n') : text;
  };

  const activeTranscript = normalizeTranscript(transcriptContent || demoTranscript);
  const transcriptLines = activeTranscript.trim().split('\n');
  const wordCount = activeTranscript.trim().split(/\s+/).length;
  const speakerList = [...new Set(
    transcriptLines
      .map(line => line.match(/^\[\d{2}:\d{2}:\d{2}\]\s(.*?):/)?.[1])
      .filter(Boolean)
  )];
  const speakerCount = speakerList.length;
  // Alternate cards by speaker: first unique speaker = left, second = right
  const isCoachSpeaker = (speaker) => speakerList.indexOf(speaker) === 0;
  
  const { effectiveStart, effectiveDuration } = React.useMemo(() => {
    const start = session?.start_datetime || session?.date_time;
    let duration = session?.duration;

    if (session?.start_datetime && session?.ended_at) {
      const computed = Math.round((new Date(session.ended_at) - new Date(session.start_datetime)) / 60000);
      if (computed > 0) duration = computed;
    } else if (session?.start_datetime && session?.end_datetime) {
      const computed = Math.round((new Date(session.end_datetime) - new Date(session.start_datetime)) / 60000);
      if (computed > 0) duration = computed;
    }

    return { effectiveStart: start, effectiveDuration: duration };
  }, [session]);
  
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
          title="Transcript"
          icons={[
            {
              id: 'search',
              icon: Search,
              isActive: showSearch,
              color: showSearch ? '#2f949d' : 'var(--nm-badge-default-color)',
              onClick: () => setShowSearch(!showSearch)
            },
            {
              id: 'ai-analyse',
              icon: Brain,
              color: 'var(--nm-badge-default-color)',
              onClick: (e) => {
                const target = e.currentTarget.querySelector('svg');
                if (target) {
                  target.style.color = target.style.color === 'var(--nm-badge-default-color)' ? '#2f949d' : 'var(--nm-badge-default-color)';
                }
              }
            },
            {
              id: 'guardian',
              icon: Shield,
              isActive: isGuardianActive || scanState === 'scanning',
              color: (isGuardianActive || scanState === 'scanning') ? '#2f949d' : 'var(--nm-badge-default-color)',
              onClick: () => {
                if (scanState === 'idle') {
                  handleScan();
                } else {
                  setIsGuardianActive(!isGuardianActive);
                }
              }
            }
          ]}
        />
        
        <div className="flex flex-col gap-6 flex-1">
          {showSearch && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--nm-badge-default-color)' }} />
                <input
                  type="text"
                  placeholder="Search transcript..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-transparent outline-none focus:outline-none focus:ring-0"
                  style={{
                    borderRadius: 'var(--nm-radius)',
                    boxShadow: 'var(--nm-shadow-inset)',
                    color: 'var(--nm-text-color)',
                    border: 'none'
                  }}
                  autoFocus
                />
              </div>
            </div>
          )}

          <NeumorphicCard className="flex-1 !p-0 overflow-hidden flex flex-col">
            <div className="p-6 pb-4 border-b border-[rgba(209,217,230,0.4)]">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="neumorphic-icon-badge md">
                    <FileText style={{ color: 'var(--nm-badge-default-color)' }} />
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
                  {scanState !== 'idle' && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap" style={{ transform: 'translateY(-3px)' }}>
                      {scanState === 'scanning' && (
                        <div className="animate-pulse">
                          <NeumorphicBadge variant="error" size="sm" icon={Shield}>
                            Scanning...
                          </NeumorphicBadge>
                        </div>
                      )}
                      {scanState === 'done' && violationTimestamps.length > 0 && (
                        <div 
                          onClick={() => {
                            if (!isGuardianActive) {
                              setIsGuardianActive(true);
                            } else {
                              scrollToViolation(violationTimestamps[0]);
                            }
                          }} 
                          className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                        >
                          <NeumorphicBadge variant="error" size="sm" icon={Shield}>
                            {violationTimestamps.length} {violationTimestamps.length === 1 ? 'violation' : 'violations'}
                          </NeumorphicBadge>
                        </div>
                      )}
                      {scanState === 'done' && violationTimestamps.length === 0 && (
                        <NeumorphicBadge variant="success" size="sm" icon={Shield}>
                          0 violations
                        </NeumorphicBadge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ color: 'var(--nm-text-color)' }}>
              {loadingTranscript && (
                <div className="flex items-center justify-center gap-2 py-12" style={{ color: 'var(--nm-badge-default-color)' }}>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading transcript...</span>
                </div>
              )}
              {!loadingTranscript && transcriptLines.map((line, idx) => {
                 const match = line.match(/^(\[\d{2}:\d{2}:\d{2}\])\s+(.+?):\s(.*)$/);
                 if (match) {
                   const [_, timestamp, speaker, text] = match;
                   const isCoach = isCoachSpeaker(speaker);

                   // Interrupted: next card is a different speaker AND the card after that is this same speaker again
                   const nextMatch = idx < transcriptLines.length - 1 ? transcriptLines[idx + 1]?.match(/^(\[\d{2}:\d{2}:\d{2}\])\s+(.+?):\s(.*)$/) : null;
                   const nextNextMatch = idx < transcriptLines.length - 2 ? transcriptLines[idx + 2]?.match(/^(\[\d{2}:\d{2}:\d{2}\])\s+(.+?):\s(.*)$/) : null;
                   const isInterrupted = !!(nextMatch && nextNextMatch && nextMatch[2] !== speaker && nextNextMatch[2] === speaker && nextMatch[3].length < 100);

                   // Continuation: previous card was a different speaker AND the card before that was this same speaker
                   const prevMatch = idx > 0 ? transcriptLines[idx - 1]?.match(/^(\[\d{2}:\d{2}:\d{2}\])\s+(.+?):\s(.*)$/) : null;
                   const prePrevMatch = idx >= 2 ? transcriptLines[idx - 2]?.match(/^(\[\d{2}:\d{2}:\d{2}\])\s+(.+?):\s(.*)$/) : null;
                   const isContinuation = !!(prevMatch && prePrevMatch && prevMatch[2] !== speaker && prePrevMatch[2] === speaker && prevMatch[3].length < 100);

                   return (
                     <div key={idx} className={`flex flex-col ${isCoach ? 'items-start' : 'items-end'}`}>
                       {/* Speaker + timestamp — outside card, always rendered above it */}
                       <div className={`relative z-10 flex items-baseline gap-2 mb-1 ${isCoach ? 'flex-row' : 'flex-row-reverse'}`}>
                         <span className="text-xs font-semibold" style={{ color: isCoach ? 'var(--nm-badge-primary-color)' : 'var(--nm-badge-info-color)' }}>
                           {speaker}
                         </span>
                         <span className="text-[10px]" style={{ color: 'var(--nm-badge-default-color)' }}>
                           {(() => {
                             const t = timestamp.replace(/[\[\]]/g, '');
                             const [h, m, s] = t.split(':').map(Number);
                             if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
                             return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
                           })()}
                         </span>
                       </div>
                       <div 
                         className="group relative px-4 pt-3 pb-8 text-sm max-w-[85%] rounded-2xl leading-relaxed"
                         style={{
                           background: isCoach ? 'var(--nm-background)' : '#4299e115',
                           boxShadow: isCoach ? 'var(--nm-shadow-main)' : 'inset 1px 1px 3px rgba(255,255,255,0.4), inset -1px -1px 3px rgba(0,0,0,0.05)',
                           border: isCoach ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(66, 153, 225, 0.2)',
                           borderBottomLeftRadius: isCoach ? '4px' : '16px',
                           borderBottomRightRadius: !isCoach ? '4px' : '16px',
                           isolation: 'isolate',
                         }}
                       >
                          {isContinuation && (
                            <span className="text-sm opacity-30 mr-1" style={{ color: 'var(--nm-badge-default-color)' }}>...</span>
                          )}
                          {renderTextWithGuardian(text, timestamp, searchTerm)}
                          {isInterrupted && (
                            <span className="text-sm opacity-30 ml-1" style={{ color: 'var(--nm-badge-default-color)' }}>...</span>
                          )}

                         <div className="absolute bottom-2 right-3 flex items-center gap-1 z-10">
                          {isGuardianActive && outOfScopeAlerts[timestamp] && (
                            <>
                              <div 
                                className="bg-red-100 text-red-600 rounded-full p-1 shadow-sm border border-red-200 cursor-pointer hover:bg-red-200 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveGuardianTooltip(activeGuardianTooltip === timestamp ? null : timestamp);
                                  setActiveGuardianTab('warning');
                                }}
                                title="View Warning"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </div>
                              {(() => {
                                const currentIndex = violationTimestamps.indexOf(timestamp);
                                const hasNext = currentIndex < violationTimestamps.length - 1;
                                const hasPrev = currentIndex > 0;
                                return (
                                  <>
                                    {hasPrev && (
                                      <div 
                                        className="bg-white text-gray-500 rounded-full p-1 shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const prevTimestamp = violationTimestamps[currentIndex - 1];
                                          setActiveGuardianTooltip(prevTimestamp);
                                          setActiveGuardianTab('warning');
                                          scrollToViolation(prevTimestamp);
                                        }}
                                        title="Previous Warning"
                                      >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                      </div>
                                    )}
                                    {hasNext && (
                                      <div 
                                        className="bg-white text-gray-500 rounded-full p-1 shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const nextTimestamp = violationTimestamps[currentIndex + 1];
                                          setActiveGuardianTooltip(nextTimestamp);
                                          setActiveGuardianTab('warning');
                                          scrollToViolation(nextTimestamp);
                                        }}
                                        title="Next Warning"
                                      >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          )}
                          <div 
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-500 rounded-full p-1 shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50"
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </div>
                          </div>
                          </div>
                          </div>
                          );
                }
                
                return (
                  <div key={idx} className="text-sm italic my-6 text-center opacity-70" style={{ color: 'var(--nm-badge-default-color)' }}>
                    {highlightText(line, searchTerm)}
                  </div>
                );
              })}
              {!loadingTranscript && !transcriptContent && (
                <div className="text-xs text-center py-4 opacity-50" style={{ color: 'var(--nm-badge-default-color)' }}>
                  Showing demo transcript — real transcript not yet available
                </div>
              )}
            </div>
          </NeumorphicCard>
        </div>
      </div>
    </motion.div>
  );
}