import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import NeumorphicCard from './NeumorphicCard';
import NeumorphicButton from './NeumorphicButton';
import NeumorphicInput from './NeumorphicInput';
import NeumorphicDatePicker from './NeumorphicDatePicker';

const DAYS_PER_VIEW = 42;            // 6 weeks
const VIEW_MIN = 0;
const VIEW_MAX = 99.5;               // avoid 100% spill
const SCROLL_ZONE_WIDTH = 50;        // px inside the timeline
const EDGE_DWELL_MS = 1000;          // show chevron + wait, then one jump
const EDGE_COOLDOWN_MS = 400;        // debounce between jumps

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function dayToPctInView(globalDay, viewStartDay, viewEndDay) {
  if (globalDay < viewStartDay || globalDay >= viewEndDay) return null;
  const rel = (globalDay - viewStartDay) / (viewEndDay - viewStartDay);
  return clamp(rel * 100, VIEW_MIN, VIEW_MAX);
}

function pctInViewToDay(pct, viewStartDay, viewEndDay) {
  const vp = clamp(pct, VIEW_MIN, VIEW_MAX);
  const raw = viewStartDay + (vp / 100) * (viewEndDay - viewStartDay);
  const epsilon = 1e-6; // strictly inside the window
  return clamp(raw, viewStartDay, viewEndDay - epsilon);
}

function dayToDate(startDate, day) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + Math.round(day));
  return d;
}
function dateToDay(startDate, date) {
  return Math.round((date.getTime() - startDate.getTime()) / 86400000);
}

// keep at least 1 day between visible non-default milestones
function applyMinGap1Day(globalDay, milestones, movingId, viewStartDay, viewEndDay) {
  const visibles = milestones.filter(m =>
    m.id !== movingId && !m.isDefault && m.day >= viewStartDay && m.day < viewEndDay
  );
  for (const other of visibles) {
    if (Math.abs(globalDay - other.day) < 1) {
      const dir = globalDay > other.day ? 1 : -1;
      return clamp(other.day + dir, viewStartDay, viewEndDay - 1);
    }
  }
  return globalDay;
}

const NeumorphicJourneyDesignerV4 = ({
  onJourneyChange,
  startDate = new Date(),
  timelineLength = 45
}) => {
  const initLen = clamp(Math.trunc(timelineLength), 7, 365);
  const [timelineLenState, setTimelineLenState] = useState(initLen);
  const [timelineLenInput, setTimelineLenInput] = useState(String(initLen));
  const [startDateState, setStartDateState] = useState(startDate);

  const [currentViewStartDay, setCurrentViewStartDay] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [justFinishedDrag, setJustFinishedDrag] = useState(false);
  const [edgeHint, setEdgeHint] = useState(null); // 'left' | 'right' | null

  const [milestones, setMilestones] = useState(() => ([
    { id: 'start', title: 'Start', day: 0, date: dayToDate(startDate, 0), isDefault: true, type: 'milestone' },
    { id: 'end',   title: 'End',   day: initLen - 1, date: dayToDate(startDate, initLen - 1), isDefault: true, type: 'milestone' }
  ]));

  // drag state/refs
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(null);
  const timelineRef = useRef(null);
  const draggedItemRef = useRef(null);
  const lastDragRef = useRef(null);
  const pointerXRef = useRef(null);

  // live refs to avoid stale closures
  const milestonesRef = useRef(milestones);
  useEffect(() => { milestonesRef.current = milestones; }, [milestones]);

  const viewStartRef = useRef(currentViewStartDay);
  useEffect(() => { viewStartRef.current = currentViewStartDay; }, [currentViewStartDay]);

  // dwell debounce
  const dwellTimerRef  = useRef(null);
  const dwellTokenRef  = useRef(0);
  const cooldownRef    = useRef(false);

  // computed
  const totalViews = Math.max(1, Math.ceil(timelineLenState / DAYS_PER_VIEW));
  const currentViewEndDay = Math.min(currentViewStartDay + DAYS_PER_VIEW, timelineLenState);
  // ✅ simple and correct header index
  const currentIndex = Math.floor(currentViewStartDay / DAYS_PER_VIEW) + 1;
  const weeksPerView = 6;

  // notify parent
  useEffect(() => {
    onJourneyChange?.({ milestones, startDate: startDateState, timelineLength: timelineLenState });
  }, [milestones, startDateState, timelineLenState, onJourneyChange]);

  // keep input in sync
  useEffect(() => { setTimelineLenInput(String(timelineLenState)); }, [timelineLenState]);

  // LIVE duration updates (like V3) while typing
  const handleDurationChange = useCallback((raw) => {
    setTimelineLenInput(raw);
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    const clamped = clamp(Math.trunc(v), 7, 365);
    setTimelineLenState(clamped);
    // keep window valid
    setCurrentViewStartDay(prev => clamp(prev, 0, Math.max(0, clamped - DAYS_PER_VIEW)));
    // keep end flag correct immediately
    setMilestones(prev => prev.map(m =>
      m.id === 'end'
        ? { ...m, day: clamped - 1, date: dayToDate(startDateState, clamped - 1) }
        : m
    ));
  }, [startDateState]);

  const commitDurationIfNeeded = useCallback(() => {
    // noop now because we commit live; still keep for Enter/blur parity
    if (!Number.isFinite(Number(timelineLenInput))) {
      setTimelineLenInput(String(timelineLenState));
    }
  }, [timelineLenInput, timelineLenState]);

  // navigation
  const goToNextView = useCallback(() => {
    commitDurationIfNeeded();
    setCurrentViewStartDay(prev => Math.min(prev + DAYS_PER_VIEW, Math.max(0, timelineLenState - DAYS_PER_VIEW)));
  }, [timelineLenState, commitDurationIfNeeded]);

  const goToPrevView = useCallback(() => {
    commitDurationIfNeeded();
    setCurrentViewStartDay(prev => Math.max(0, prev - DAYS_PER_VIEW));
  }, [commitDurationIfNeeded]);

  // edge dwell (single jump, no auto-continued scroll)
  const clearDwell = useCallback(() => {
    setEdgeHint(null);
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  }, []);

  const jumpBlock = useCallback((dir) => {
    setCurrentViewStartDay(prev =>
      clamp(prev + dir * DAYS_PER_VIEW, 0, Math.max(0, timelineLenState - DAYS_PER_VIEW))
    );
  }, [timelineLenState]);

  const startDwellThenJump = useCallback((dir) => {
    if (dwellTimerRef.current || cooldownRef.current) return;
    setEdgeHint(dir > 0 ? 'right' : 'left');
    const token = ++dwellTokenRef.current;
    dwellTimerRef.current = setTimeout(() => {
      if (token !== dwellTokenRef.current) return;
      jumpBlock(dir);           // one jump only
      clearDwell();
      cooldownRef.current = true;
      setTimeout(() => { cooldownRef.current = false; }, EDGE_COOLDOWN_MS);
    }, EDGE_DWELL_MS);
  }, [jumpBlock, clearDwell]);

  // click to add milestone (exact under cursor unless colliding)
  const handleTimelineClick = useCallback((e) => {
    if (isDragging || justFinishedDrag) return;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickPct  = ((e.clientX - rect.left) / rect.width) * 100;
    const localStart = viewStartRef.current;
    const localEnd   = Math.min(localStart + DAYS_PER_VIEW, timelineLenState);
    let clickDay     = pctInViewToDay(clickPct, localStart, localEnd);

    // don't allow start/end
    if (clickDay <= 0 || clickDay >= timelineLenState - 1) return;

    // only nudge if truly colliding (within ~1 day of another non-default)
    const willCollide = milestonesRef.current.some(m => !m.isDefault && Math.abs(m.day - clickDay) < 0.95);
    const adjustedDay = willCollide
      ? applyMinGap1Day(clickDay, milestonesRef.current, null, localStart, localEnd)
      : clickDay;

    const newMilestone = {
      id: `milestone-${Date.now()}`,
      title: 'New Milestone',
      day: adjustedDay,
      date: dayToDate(startDateState, adjustedDay),
      isDefault: false,
      description: '',
      type: 'milestone'
    };
    setMilestones(prev => [...prev, newMilestone]);
    setSelectedItem(newMilestone);
  }, [isDragging, justFinishedDrag, timelineLenState, startDateState]);

  // drag handlers
  const handlePointerDown = useCallback((e, milestone) => {
    if (milestone.isDefault) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    draggedItemRef.current = { id: milestone.id, originalDay: milestone.day, isDefault: milestone.isDefault };
    setIsDragging(true);
    setSelectedItem(null);

    const onMove = (moveE) => {
      const r = timelineRef.current?.getBoundingClientRect();
      if (!r) return;

      const pointerX = moveE.clientX;
      pointerXRef.current = pointerX;

      // inner edge zones inside the timeline element
      const inLeftZone  = pointerX <= (r.left  + SCROLL_ZONE_WIDTH);
      const inRightZone = pointerX >= (r.right - SCROLL_ZONE_WIDTH);
      if (inLeftZone)      startDwellThenJump(-1);
      else if (inRightZone) startDwellThenJump(1);
      else                  clearDwell();

      const localStart = viewStartRef.current;
      const localEnd   = Math.min(localStart + DAYS_PER_VIEW, timelineLenState);

      const pct = ((pointerX - r.left) / r.width) * 100;
      let targetDay = pctInViewToDay(pct, localStart, localEnd);
      const constrained = clamp(targetDay, 1, timelineLenState - 2);
      const finalDay = applyMinGap1Day(constrained, milestonesRef.current, milestone.id, localStart, localEnd);

      lastDragRef.current = {
        globalDay: finalDay,
        viewStartDay: localStart,
        viewPct: dayToPctInView(finalDay, localStart, localEnd) || 0
      };

      setDragPosition(lastDragRef.current.viewPct);
      setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, day: finalDay, date: dayToDate(startDateState, finalDay) } : m));
    };

    const onUp = (upE) => {
      clearDwell();

      // 🔑 clear drag state first to avoid a ghost frame
      draggedItemRef.current = null;
      setIsDragging(false);
      setDragPosition(null);
      pointerXRef.current = null;

      // block synthetic click
      setJustFinishedDrag(true);
      setTimeout(() => setJustFinishedDrag(false), 150);
      upE.preventDefault?.();
      upE.stopPropagation?.();

      if (lastDragRef.current) {
        const finalDay = lastDragRef.current.globalDay;
        setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, day: finalDay, date: dayToDate(startDateState, finalDay) } : m));

        // snap to the block containing the drop
        const snapStart = clamp(Math.floor(finalDay / DAYS_PER_VIEW) * DAYS_PER_VIEW, 0, Math.max(0, timelineLenState - DAYS_PER_VIEW));
        setCurrentViewStartDay(snapStart);
      }
      lastDragRef.current = null;

      if (upE.currentTarget && upE.currentTarget.releasePointerCapture) {
        upE.currentTarget.releasePointerCapture(upE.pointerId);
      }
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [timelineLenState, startDateState, startDwellThenJump, clearDwell]);

  // recompute milestone dates when start/duration change
  useEffect(() => {
    setMilestones(prev => prev.map(m => {
      if (m.isDefault) {
        if (m.id === 'start') return { ...m, day: 0, date: dayToDate(startDateState, 0) };
        if (m.id === 'end') {
          const endDay = timelineLenState - 1;
          return { ...m, day: endDay, date: dayToDate(startDateState, endDay) };
        }
      } else {
        const newDay = dateToDay(startDateState, m.date);
        const clampedDay = clamp(newDay, 1, timelineLenState - 2);
        return { ...m, day: clampedDay, date: dayToDate(startDateState, clampedDay) };
      }
      return m;
    }));
  }, [startDateState, timelineLenState]);

  const isStartFlagVisible = useCallback(() => currentViewStartDay === 0, [currentViewStartDay]);
  const isEndFlagVisible   = useCallback(() => currentViewEndDay >= timelineLenState, [currentViewEndDay, timelineLenState]);

  return (
    <NeumorphicCard>
      <div className="jdv4" data-dragging={isDragging}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <NeumorphicDatePicker
                value={startDateState}
                placeholder="Select start date..."
                onChange={(d) => { if (d instanceof Date && !isNaN(d.getTime())) setStartDateState(d); }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
              <NeumorphicInput
                type="number"
                inputMode="numeric"
                min={7}
                max={365}
                value={timelineLenInput}
                placeholder="45"
                onChange={(e) => handleDurationChange(e.target.value)}
                onBlur={commitDurationIfNeeded}
                onKeyDown={(e) => { if (e.key === 'Enter') commitDurationIfNeeded(); }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NeumorphicButton icon={Flag} size="sm">Milestone</NeumorphicButton>
          </div>
        </div>

        <div className="space-y-8 mt-8">
          <div className="relative" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
            <div className="flex justify-between items-center">
              <div>
                {currentViewStartDay > 0 && (
                  <NeumorphicButton size="sm" onClick={goToPrevView} icon={ChevronLeft}>Previous</NeumorphicButton>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-700">Week View {currentIndex} of {totalViews}</h3>
              <div>
                {currentViewStartDay < timelineLenState - DAYS_PER_VIEW && (
                  <NeumorphicButton size="sm" onClick={goToNextView} icon={ChevronRight}>Next</NeumorphicButton>
                )}
              </div>
            </div>
          </div>

          <motion.div
            key={currentViewStartDay}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="relative" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
              {/* Timeline (chevrons are children of the timeline so they anchor to its edges) */}
              <div
                ref={timelineRef}
                className="relative h-8 cursor-pointer"
                style={{ borderRadius: '8px', background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-inset)' }}
                onClick={handleTimelineClick}
              >
                {/* Edge dwell chevrons */}
                {edgeHint === 'left' && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                    <ChevronLeft className="w-6 h-6 text-gray-400 animate-pulse" />
                  </div>
                )}
                {edgeHint === 'right' && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-gray-400 animate-pulse" />
                  </div>
                )}

                {/* Weekly notches */}
                {Array.from({ length: weeksPerView }, (_, i) => {
                  const weekStartDay = currentViewStartDay + (i * 7);
                  if (weekStartDay >= timelineLenState) return null;
                  const pos = ((i + 1) / weeksPerView) * 100;
                  if (pos >= VIEW_MAX) return null;
                  return (
                    <div key={`week-${i}`} className="absolute top-0 w-0.5 h-8"
                      style={{
                        left: `${pos}%`,
                        transform: 'translateX(-50%)',
                        background: 'var(--nm-background)',
                        boxShadow: '1px 1px 2px #d1d9e6, -1px -1px 2px #ffffff',
                        borderRadius: '1px'
                      }} />
                  );
                })}

                {/* Week labels */}
                {Array.from({ length: weeksPerView }, (_, i) => {
                  const weekStartDay = currentViewStartDay + (i * 7);
                  if (weekStartDay >= timelineLenState) return null;
                  const startP = (i / weeksPerView) * 100;
                  const endP = ((i + 1) / weeksPerView) * 100;
                  const center = (startP + Math.min(endP, VIEW_MAX)) / 2;
                  return (
                    <div key={`week-label-${i}`}
                         className="absolute top-0 h-8 flex items-center justify-center text-xs pointer-events-none"
                         style={{ left: `${center}%`, transform: 'translateX(-50%)', fontSize: 10, fontWeight: 500, color: '#d1d9e6', userSelect: 'none' }}>
                      Week {Math.floor(weekStartDay / 7) + 1}
                    </div>
                  );
                })}

                {/* Milestones */}
                <AnimatePresence>
                  {milestones
                    .filter(m => {
                      const isDragged = isDragging && draggedItemRef.current?.id === m.id;
                      if (m.id === 'start') return isStartFlagVisible();
                      if (m.id === 'end')   return isEndFlagVisible();
                      if (isDragged) return true; // show dragged item anywhere
                      return dayToPctInView(m.day, currentViewStartDay, currentViewEndDay) !== null;
                    })
                    .map(m => {
                      const isDragged = isDragging && draggedItemRef.current?.id === m.id;
                      const vp = isDragged && dragPosition !== null
                        ? dragPosition
                        : dayToPctInView(m.day, currentViewStartDay, currentViewEndDay);

                      if (vp === null && !m.isDefault) return null;

                      const isSpecial = m.id === 'start' || m.id === 'end';
                      const leftStyle = m.id === 'start' && isStartFlagVisible() ? '-60px'
                        : m.id === 'end' && isEndFlagVisible() ? 'calc(100% + 15px)'
                        : `${vp}%`;
                      const transformStyle = isSpecial ? 'translateX(0)' : 'translateX(-50%)';

                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className="absolute flex flex-col items-center no-drag"
                          style={{
                            left: leftStyle,
                            transform: transformStyle,
                            top: '50%',
                            marginTop: '-26px',
                            cursor: m.isDefault ? 'default' : 'grab',
                            zIndex: isDragged ? 60 : (hoveredId === m.id ? 50 : 10)
                          }}
                          onPointerDown={!m.isDefault ? (e) => handlePointerDown(e, m) : undefined}
                          onMouseEnter={() => setHoveredId(m.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          onClick={(e) => { e.stopPropagation(); if (!isDragged) setSelectedItem(m); }}
                        >
                          <motion.div
                            style={{ borderRadius: '50%', background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-main)' }}
                            className="w-12 h-12 flex items-center justify-center"
                            whileHover={!m.isDefault ? { scale: 1.05 } : {}}
                            whileTap={!m.isDefault ? { scale: 0.95 } : {}}
                            data-dragging={isDragged}
                          >
                            <Flag className="w-6 h-6" style={{
                              color: m.id === 'start' ? '#48bb78' : m.id === 'end' ? '#e53e3e' : '#2f949d',
                              fill:  m.id === 'start' ? '#48bb78' : m.id === 'end' ? '#e53e3e' : '#2f949d'
                            }} />
                          </motion.div>

                          <div className="mt-2 px-2 py-1 text-xs font-medium text-center whitespace-nowrap transition-all duration-200"
                               style={m.isDefault ? { color: '#6b7280' } : { background: 'var(--nm-background)', boxShadow: 'var(--nm-shadow-main)', borderRadius: '6px', color: 'var(--nm-text-color)' }}>
                            {m.title}
                            {m.date && (
                              <div className="text-xs text-gray-500 mt-1">
                                {m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Editor */}
        <AnimatePresence>
          {selectedItem && selectedItem.type === 'milestone' && !selectedItem.isDefault && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="mt-6 overflow-hidden">
              <NeumorphicCard className="!shadow-inner-neumorphic">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-700">Edit Milestone</h3>
                  <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
                    <NeumorphicInput
                      value={selectedItem.title || ''}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setSelectedItem(prev => ({ ...prev, title: newTitle }));
                        setMilestones(prev => prev.map(m => m.id === selectedItem.id ? { ...m, title: newTitle } : m));
                      }}
                      placeholder="Enter milestone title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                    <NeumorphicDatePicker
                      value={selectedItem.date}
                      onChange={(date) => {
                        if (!date || isNaN(date.getTime())) return;
                        const newDay = dateToDay(startDateState, date);
                        const clampedDay = clamp(newDay, 1, timelineLenState - 2);
                        const finalDate = dayToDate(startDateState, clampedDay);
                        setSelectedItem(prev => ({ ...prev, date: finalDate, day: clampedDay }));
                        setMilestones(prev => prev.map(m => m.id === selectedItem.id ? { ...m, date: finalDate, day: clampedDay } : m));
                      }}
                      placeholder="Select milestone date"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <NeumorphicButton onClick={() => { setMilestones(prev => prev.filter(m => m.id !== selectedItem.id)); setSelectedItem(null); }}>
                      Delete
                    </NeumorphicButton>
                    <NeumorphicButton variant="primary" onClick={() => setSelectedItem(null)}>
                      Save
                    </NeumorphicButton>
                  </div>
                </div>
              </NeumorphicCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NeumorphicCard>
  );
};

export default NeumorphicJourneyDesignerV4;