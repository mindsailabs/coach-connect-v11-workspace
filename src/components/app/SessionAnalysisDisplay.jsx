import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Brain, Tag, Target, TrendingUp, TrendingDown,
  Minus, CheckSquare, Eye, HelpCircle, BookOpen, BarChart2,
  User, Users
} from 'lucide-react';

function CollapsibleSection({ title, icon: Icon, color, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <div
        className="flex items-center gap-3 px-6 py-4 cursor-pointer transition-all duration-200"
        onClick={() => setOpen(v => !v)}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="flex-1 text-base font-normal">{title}</span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{ color: 'var(--nm-badge-default-color)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-6 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const GOAL_STATUS = {
  new:         { label: 'New',         bg: 'rgba(66,153,225,0.12)',  color: '#4299e1' },
  in_progress: { label: 'In Progress', bg: 'rgba(237,137,54,0.12)',  color: '#ed8936' },
  achieved:    { label: 'Achieved',    bg: 'rgba(72,187,120,0.12)',  color: '#48bb78' },
  struggling:  { label: 'Struggling',  bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
};

const PRIORITY_COLORS = {
  high:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  medium: { bg: 'rgba(237,137,54,0.12)',  color: '#ed8936' },
  low:    { bg: 'rgba(72,187,120,0.12)',  color: '#48bb78' },
};

function Pill({ label, bg, color }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal"
      style={{ background: bg, color }}>
      {label}
    </span>
  );
}

function Divider() {
  return <div className="my-0" style={{ borderTop: '1px solid rgba(209,217,230,0.4)' }} />;
}

// Legacy format (summary_bullets / action_items)
function LegacyDisplay({ data }) {
  return (
    <div className="space-y-4">
      {data.summary_bullets && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--nm-badge-default-color)' }}>Summary</p>
          <ul className="space-y-1">
            {data.summary_bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span style={{ color: '#2f949d' }}>•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.action_items && Array.isArray(data.action_items) && data.action_items.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--nm-badge-default-color)' }}>Action Items</p>
          <ul className="space-y-1">
            {data.action_items.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span style={{ color: '#ed8936' }}>→</span>
                <span>{typeof a === 'string' ? a : a.title || JSON.stringify(a)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SessionAnalysisDisplay({ summaryJson }) {
  if (!summaryJson) return null;

  // Parse JSON safely
  let data = null;
  try {
    data = typeof summaryJson === 'string' ? JSON.parse(summaryJson) : summaryJson;
  } catch {
    // Raw text fallback
    return <p className="text-sm" style={{ color: 'var(--nm-text-color)' }}>{summaryJson}</p>;
  }

  if (!data || typeof data !== 'object') {
    return <p className="text-sm" style={{ color: 'var(--nm-text-color)' }}>{summaryJson}</p>;
  }

  // Legacy format detection
  const isLegacy = !data.overview && (data.summary_bullets || (data.action_items && typeof data.action_items[0] === 'string'));
  if (isLegacy) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-main)' }}>
        <div className="px-6 py-5"><LegacyDisplay data={data} /></div>
      </div>
    );
  }

  const { overview, key_topics, client_goals, progress_indicators, action_items, coaching_observations, follow_up, session_metrics } = data;

  return (
    <div className="rounded-xl overflow-hidden divide-y" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-main)', borderColor: 'rgba(209,217,230,0.4)' }}>

      {/* Overview — default open */}
      {overview && (
        <>
          <CollapsibleSection title="Overview" icon={Brain} color="#8b5cf6" defaultOpen={true}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--nm-text-color)' }}>{overview}</p>
          </CollapsibleSection>
          <Divider />
        </>
      )}

      {/* Session Metrics */}
      {session_metrics && (
        <>
          <CollapsibleSection title="Session Metrics" icon={BarChart2} color="#4299e1" defaultOpen={false}>
            <div className="grid grid-cols-3 gap-3">
              {session_metrics.emotional_tone && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--nm-badge-default-color)' }}>Tone</p>
                  <p className="text-sm font-normal capitalize">{session_metrics.emotional_tone}</p>
                </div>
              )}
              {session_metrics.client_talk_ratio !== undefined && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--nm-badge-default-color)' }}>Client Talk</p>
                  <p className="text-sm font-normal">{session_metrics.client_talk_ratio}</p>
                </div>
              )}
              {session_metrics.dominant_topics && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--nm-badge-default-color)' }}>Main Topic</p>
                  <p className="text-sm font-normal capitalize">
                    {Array.isArray(session_metrics.dominant_topics) ? session_metrics.dominant_topics[0] : session_metrics.dominant_topics}
                  </p>
                </div>
              )}
            </div>
          </CollapsibleSection>
          <Divider />
        </>
      )}

      {/* Key Topics */}
      {key_topics && key_topics.length > 0 && (
        <>
          <CollapsibleSection title="Key Topics" icon={Tag} color="#2f949d" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {key_topics.map((t, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs"
                  style={{ background: 'rgba(47,148,157,0.12)', color: '#2f949d' }}>
                  {t}
                </span>
              ))}
            </div>
          </CollapsibleSection>
          <Divider />
        </>
      )}

      {/* Client Goals */}
      {client_goals && client_goals.length > 0 && (
        <>
          <CollapsibleSection title="Client Goals" icon={Target} color="#10b981" defaultOpen={false}>
            <div className="space-y-3">
              {client_goals.map((g, i) => {
                const s = GOAL_STATUS[g.status] || GOAL_STATUS['new'];
                return (
                  <div key={i} className="rounded-xl p-3" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)' }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-normal flex-1">{g.goal}</p>
                      <Pill label={s.label} bg={s.bg} color={s.color} />
                    </div>
                    {g.notes && <p className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>{g.notes}</p>}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
          <Divider />
        </>
      )}

      {/* Progress Indicators */}
      {progress_indicators && progress_indicators.length > 0 && (
        <>
          <CollapsibleSection title="Progress Indicators" icon={TrendingUp} color="#f59e0b" defaultOpen={false}>
            <div className="space-y-2">
              {progress_indicators.map((p, i) => {
                const isPos = p.direction === 'positive';
                const isNeg = p.direction === 'negative';
                const Icon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
                const color = isPos ? '#48bb78' : isNeg ? '#ef4444' : '#ed8936';
                return (
                  <div key={i} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
                    <div>
                      <span className="text-sm font-normal">{p.area}</span>
                      {p.detail && <p className="text-xs mt-0.5" style={{ color: 'var(--nm-badge-default-color)' }}>{p.detail}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
          <Divider />
        </>
      )}

      {/* Action Items — default open */}
      {action_items && action_items.length > 0 && (
        <>
          <CollapsibleSection title="Action Items" icon={CheckSquare} color="#2f949d" defaultOpen={true}>
            <div className="space-y-2">
              {action_items.map((a, i) => {
                const p = PRIORITY_COLORS[a.priority] || PRIORITY_COLORS['medium'];
                const isCoach = a.assignee === 'coach';
                return (
                  <div key={i} className="rounded-xl p-3" style={{ background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)' }}>
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm flex-1">{a.title}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Pill label={a.priority || 'medium'} bg={p.bg} color={p.color} />
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                          style={{ background: isCoach ? 'rgba(139,92,246,0.12)' : 'rgba(66,153,225,0.12)', color: isCoach ? '#8b5cf6' : '#4299e1' }}>
                          {isCoach ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {isCoach ? 'Coach' : 'Client'}
                        </span>
                      </div>
                    </div>
                    {a.due_context && <p className="text-xs mt-1" style={{ color: 'var(--nm-badge-default-color)' }}>{a.due_context}</p>}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
          <Divider />
        </>
      )}

      {/* Coaching Observations */}
      {coaching_observations && (
        <>
          <CollapsibleSection title="Coaching Observations" icon={Eye} color="#ec4899" defaultOpen={false}>
            <div className="space-y-3">
              {coaching_observations.client_engagement && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--nm-badge-default-color)' }}>Client Engagement</p>
                  <p className="text-sm">{coaching_observations.client_engagement}</p>
                </div>
              )}
              {coaching_observations.breakthroughs && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--nm-badge-default-color)' }}>Breakthroughs</p>
                  <p className="text-sm">{coaching_observations.breakthroughs}</p>
                </div>
              )}
              {coaching_observations.concerns && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--nm-badge-default-color)' }}>Concerns</p>
                  <p className="text-sm">{coaching_observations.concerns}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>
          <Divider />
        </>
      )}

      {/* Follow-up */}
      {follow_up && (
        <CollapsibleSection title="Follow-up" icon={BookOpen} color="#4299e1" defaultOpen={false}>
          <div className="space-y-3">
            {follow_up.recommended_focus && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--nm-badge-default-color)' }}>Recommended Focus</p>
                <p className="text-sm">{follow_up.recommended_focus}</p>
              </div>
            )}
            {follow_up.questions_to_explore && follow_up.questions_to_explore.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--nm-badge-default-color)' }}>Questions to Explore</p>
                <ul className="space-y-1">
                  {follow_up.questions_to_explore.map((q, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <HelpCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#4299e1' }} />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {follow_up.resources_to_share && follow_up.resources_to_share.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--nm-badge-default-color)' }}>Resources to Share</p>
                <ul className="space-y-1">
                  {follow_up.resources_to_share.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#2f949d' }} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

    </div>
  );
}