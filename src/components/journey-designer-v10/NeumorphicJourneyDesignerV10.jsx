
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Flag, Users, Activity, ChevronLeft, ChevronRight, X, AlertCircle, Plus, BookOpen, CheckSquare, GraduationCap, Video, Phone, MessageSquare, ZoomIn } from 'lucide-react';

import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicButton from '@/components/ui/NeumorphicButton';
import NeumorphicInput from '@/components/ui/NeumorphicInput';
import NeumorphicSelect from '@/components/ui/NeumorphicSelect';
import NeumorphicTextarea from '@/components/ui/NeumorphicTextarea';
import NeumorphicDatePicker from '@/components/ui/NeumorphicDatePicker';
import NeumorphicTimePicker from '@/components/ui/NeumorphicTimePicker';
import SelectableEditableBadge from '@/components/ui/SelectableEditableBadge';

// Zoom levels configuration
const ZOOM_LEVELS = [
  { weeks: 2, label: '2 Weeks', daysPerView: 14 },
  { weeks: 4, label: '4 Weeks', daysPerView: 28 },
  { weeks: 6, label: '6 Weeks', daysPerView: 42 },
  { weeks: 8, label: '8 Weeks', daysPerView: 56 },
  { weeks: 12, label: '12 Weeks', daysPerView: 84 },
  { weeks: 20, label: '20 Weeks', daysPerView: 140 }
];

const MIN_TIMELINE_LENGTH = 7;
const MAX_TIMELINE_LENGTH = 999;
const MAX_OUT_OF_BOUNDS_DISPLAY = 10;

const meetingTypeIcons = {
  'in-person': Users,
  'video': Video,
  'voice': Phone,
  'text': MessageSquare
};

const stepTypeIcons = {
  assignment: BookOpen,
  activity: Activity,
  'check-in': CheckSquare,
  learning: GraduationCap
};

const stepTypeColors = {
  assignment: '#10b981',
  activity: '#f59e0b',
  'check-in': '#8b5cf6',
  learning: '#ec4899'
};

const NeumorphicJourneyDesignerV10 = ({
  onJourneyChange,
  startDate: initialStartDate = new Date(),
  timelineLength: initialTimelineLength = 45
}) => {
  const [sessions, setSessions] = useState([
    { id: 'start', position: 0, title: 'Start', type: 'session', isDefault: true, date: null },
    { id: 'end', position: 100, title: 'End', type: 'session', isDefault: true, date: null }
  ]);

  const [steps, setSteps] = useState([]);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [timelineLength, setTimelineLength] = useState(initialTimelineLength);
  const [timelineLengthInput, setTimelineLengthInput] = useState(initialTimelineLength.toString());
  const [outOfBoundsSessions, setOutOfBoundsSessions] = useState(new Set());
  const [outOfBoundsSteps, setOutOfBoundsSteps] = useState(new Set());
  const [showLeftChevron, setShowLeftChevron] = useState(false);
  const [showRightChevron, setShowRightChevron] = useState(false);
  const [dateError, setDateError] = useState('');
  const [viewTransitioning, setViewTransitioning] = useState(false);
  const [highlightedWeek, setHighlightedWeek] = useState(null);
  const [journeyTitle, setJourneyTitle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(2); // Index 2 = 6 weeks (default)

  const timelineContainerRef = useRef(null); // Ref for the main timeline display area
  const timelineRef = useRef(null); // Ref for the central week markers timeline
  const dragCleanupRef = useRef(null);

  const currentZoomConfig = ZOOM_LEVELS[zoomLevel];
  const DAYS_PER_VIEW = currentZoomConfig.daysPerView;
  const totalViews = Math.ceil(timelineLength / DAYS_PER_VIEW);
  const hasNextView = currentViewIndex < totalViews - 1;

  const normalizeDate = useCallback((date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, []);

  const compareDates = useCallback((date1, date2) => {
    return normalizeDate(date1).getTime() === normalizeDate(date2).getTime();
  }, [normalizeDate]);

  const getViewDayRange = useCallback(() => {
    const startDay = currentViewIndex * DAYS_PER_VIEW;
    const endDay = Math.min(startDay + DAYS_PER_VIEW, timelineLength);
    return { startDay, endDay };
  }, [currentViewIndex, DAYS_PER_VIEW, timelineLength]);

  const globalToViewPosition = useCallback((globalPos) => {
    const { startDay, endDay } = getViewDayRange();
    const globalDay = globalPos / 100 * timelineLength;

    if (globalDay < startDay || globalDay >= endDay) { // Adjusted condition to be strict on endDay for displaying within view
      return null;
    }

    const viewDays = endDay - startDay;
    const dayInView = globalDay - startDay;
    
    return (dayInView / viewDays) * 100;
  }, [getViewDayRange, timelineLength]);

  const viewToGlobalPosition = useCallback((viewPos) => {
    const { startDay, endDay } = getViewDayRange();
    const viewDays = endDay - startDay;
    const dayInView = viewPos / 100 * viewDays;
    const globalDay = startDay + dayInView;
    return globalDay / timelineLength * 100;
  }, [getViewDayRange, timelineLength]);

  const positionToDate = useCallback((position) => {
    // Snap position to nearest day
    const exactDay = position / 100 * timelineLength;
    const days = Math.min(timelineLength - 1, Math.round(exactDay));
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date;
  }, [timelineLength, startDate]);

  const dateToPosition = useCallback((date) => {
    const diff = date.getTime() - startDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    // Return exact position for this day
    return Math.min(99, (days / timelineLength) * 100);
  }, [timelineLength, startDate]);

  const snapToDay = useCallback((position) => {
    // Convert position to day number
    const exactDay = position / 100 * timelineLength;
    const day = Math.min(timelineLength - 1, Math.round(exactDay));
    // Convert back to exact position for that day
    return (day / timelineLength) * 100;
  }, [timelineLength]);

  const isDateOccupied = useCallback((date, excludeId = null, itemType = 'session') => {
    const items = itemType === 'session' ? sessions : steps;
    return items.some((item) =>
      item.id !== excludeId &&
      item.date &&
      !item.isDefault &&
      compareDates(item.date, date)
    );
  }, [sessions, steps, compareDates]);

  const getItemOnDate = useCallback((date, excludeId = null, itemType = 'session') => {
    const items = itemType === 'session' ? sessions : steps;
    return items.find((item) =>
      item.id !== excludeId &&
      item.date &&
      !item.isDefault &&
      compareDates(item.date, date)
    );
  }, [sessions, steps, compareDates]);

  const snapToAvailableDate = useCallback((position, itemId, itemType = 'session') => {
    // First snap to nearest day
    const snappedPosition = snapToDay(position);
    const targetDate = positionToDate(snappedPosition);

    if (!isDateOccupied(targetDate, itemId, itemType)) {
      return snappedPosition;
    }

    for (let offset = 1; offset <= 7; offset++) {
      const beforeDate = new Date(targetDate);
      beforeDate.setDate(beforeDate.getDate() - offset);
      if (!isDateOccupied(beforeDate, itemId, itemType)) {
        const beforePos = dateToPosition(beforeDate);
        if (beforePos >= 0 && beforePos <= 100) {
          return beforePos;
        }
      }

      const afterDate = new Date(targetDate);
      afterDate.setDate(afterDate.getDate() + offset);
      if (!isDateOccupied(afterDate, itemId, itemType)) {
        const afterPos = dateToPosition(afterDate);
        if (afterPos >= 0 && afterPos >= 0 && afterPos <= 100) {
          return afterPos;
        }
      }
    }

    return snappedPosition;
  }, [snapToDay, positionToDate, isDateOccupied, dateToPosition]);

  const getIconScale = useCallback(() => {
    const scaleFactors = [1.3, 1.1, 1, 0.9, 0.75, 0.6];
    return scaleFactors[zoomLevel];
  }, [zoomLevel]);

  const getValidZoomLevels = useCallback(() => {
    const journeyWeeks = Math.ceil(timelineLength / 7);
    return ZOOM_LEVELS.map((level, index) => ({
      ...level,
      index,
      disabled: level.weeks > journeyWeeks
    }));
  }, [timelineLength]);

  const { startDay, endDay } = getViewDayRange();
  const actualDaysInView = endDay - startDay;
  const viewWeeks = Math.ceil(actualDaysInView / 7);
  const isPartialView = viewWeeks < currentZoomConfig.weeks;
  const timelineWidthPercent = isPartialView ? (viewWeeks / currentZoomConfig.weeks * 100) : 100;

  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
      }
    };
  }, []);

  const handleDragStart = useCallback((e, item) => {
    e.preventDefault();
    setIsDragging(true);
    setDraggedItem({ ...item, isHidden: false });

    let currentDragView = currentViewIndex;
    let currentDaysPerView = DAYS_PER_VIEW;
    let viewTransitionTimer = null;

    const handleMouseMove = (moveEvent) => {
      if (viewTransitioning) return;

      const timelineEl = timelineContainerRef.current; // Use the main container for drag calculations
      if (!timelineEl) return;

      const rect = timelineEl.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const viewWidth = rect.width;
      const relativeX = x / viewWidth;

      // Calculate partial view status for this drag view
      const { startDay: dragStartDay, endDay: dragEndDay } = {
        startDay: currentDragView * currentDaysPerView,
        endDay: Math.min((currentDragView + 1) * currentDaysPerView, timelineLength)
      };
      const actualDaysInDragView = dragEndDay - dragStartDay;
      const viewWeeksInDrag = Math.ceil(actualDaysInDragView / 7);
      const isPartialDragView = viewWeeksInDrag < currentZoomConfig.weeks;
      const timelinePercentInDrag = isPartialDragView ? (viewWeeksInDrag / currentZoomConfig.weeks * 100) : 100;

      if (item.type === 'session') { // Still highlight week only for session-level drag (arbitrary choice)
        const viewPos = Math.max(0, Math.min(100, relativeX * 100));
        const viewDays = dragEndDay - dragStartDay; 
        const dayInView = viewPos / 100 * viewDays;
        const globalDay = dragStartDay + dayInView;
        const weekIndex = Math.floor(globalDay / 7);
        const viewWeekIndex = weekIndex - Math.floor(dragStartDay / 7);
        setHighlightedWeek(viewWeekIndex >= 0 ? viewWeekIndex : null);
      }

      const pastLeftEdge = x < -10;
      const pastRightEdge = x > viewWidth + 10;
      const inLeftZone = relativeX < 0.15;
      const inRightZone = relativeX > 0.85;
      const isInGreyArea = isPartialDragView && relativeX > (timelinePercentInDrag / 100);

      const shouldShowRightChevron = inRightZone && !isInGreyArea;

      setShowLeftChevron(inLeftZone);
      setShowRightChevron(shouldShowRightChevron);

      if ((inLeftZone || pastLeftEdge) && currentDragView > 0 && !viewTransitionTimer) {
        viewTransitionTimer = setTimeout(() => {
          setDraggedItem((prev) => ({ ...prev, isHidden: true }));
          setViewTransitioning(true);

          currentDragView--;
          setCurrentViewIndex(currentDragView);

          setTimeout(() => {
            setViewTransitioning(false);
            setDraggedItem((prev) => ({ ...prev, isHidden: false }));
            viewTransitionTimer = null;
          }, 600);
        }, 600);
      } else if ((shouldShowRightChevron || pastRightEdge) && currentDragView < totalViews - 1 && !viewTransitionTimer) {
        viewTransitionTimer = setTimeout(() => {
          setDraggedItem((prev) => ({ ...prev, isHidden: true }));
          setViewTransitioning(true);

          currentDragView++;
          setCurrentViewIndex(currentDragView);

          setTimeout(() => {
            setViewTransitioning(false);
            setDraggedItem((prev) => ({ ...prev, isHidden: false }));
            viewTransitionTimer = null;
          }, 600);
        }, 600);
      } else if (!inLeftZone && !shouldShowRightChevron && !pastLeftEdge && !pastRightEdge && viewTransitionTimer) {
        clearTimeout(viewTransitionTimer);
        viewTransitionTimer = null;
      }

      if (!viewTransitioning) {
        const clampedX = Math.max(0, Math.min(1, relativeX));
        const viewPos = clampedX * 100;
        updateItemPosition(item, viewPos, currentDragView, currentDaysPerView);
      }
    };

    const updateItemPosition = (item, viewPos, viewIndex, daysPerViewForDrag) => {
      const { startDay: dragStartDay, endDay: dragEndDay } = {
        startDay: viewIndex * daysPerViewForDrag,
        endDay: Math.min((viewIndex + 1) * daysPerViewForDrag, timelineLength)
      };
      const viewDays = dragEndDay - dragStartDay;
      const dayInView = viewPos / 100 * viewDays;
      const globalDay = dragStartDay + dayInView;
      const globalPos = globalDay / timelineLength * 100;

      // During drag, just update to smooth position (no snapping)
      const smoothPos = Math.max(0, Math.min(99, globalPos));
      
      if (item.type === 'session') {
        setSessions((prev) => prev.map((m) =>
          m.id === item.id ?
          { ...m, position: smoothPos, date: positionToDate(smoothPos) } :
          m
        ));
      } else {
        setSteps((prev) => prev.map((s) =>
          s.id === item.id ?
          { ...s, position: smoothPos, date: positionToDate(smoothPos) } :
          s
        ));
      }

      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem((prev) => ({ ...prev, position: smoothPos, date: positionToDate(smoothPos) }));
      }
    };

    const handleMouseUp = () => {
      if (viewTransitionTimer) {
        clearTimeout(viewTransitionTimer);
      }

      // Snap to day position on release
      if (draggedItem) {
        const currentItem = draggedItem.type === 'session' 
          ? sessions.find(s => s.id === draggedItem.id)
          : steps.find(s => s.id === draggedItem.id);
        
        if (currentItem) {
          const snappedPos = snapToAvailableDate(currentItem.position, currentItem.id, currentItem.type);
          const newDate = positionToDate(snappedPos);
          
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + timelineLength);
          const isNowInBounds = newDate >= startDate && newDate < endDate;

          if (draggedItem.type === 'session') {
            setSessions((prev) => prev.map((m) =>
              m.id === draggedItem.id ?
              { ...m, position: snappedPos, date: newDate } :
              m
            ));
            
            if (isNowInBounds && outOfBoundsSessions.has(draggedItem.id)) {
              setOutOfBoundsSessions((prev) => {
                const newSet = new Set(prev);
                newSet.delete(draggedItem.id);
                return newSet;
              });
            } else if (!isNowInBounds && !outOfBoundsSessions.has(draggedItem.id)) {
              setOutOfBoundsSessions((prev) => new Set(prev).add(draggedItem.id));
            }
          } else {
            setSteps((prev) => prev.map((s) =>
              s.id === draggedItem.id ?
              { ...s, position: snappedPos, date: newDate } :
              s
            ));
            
            if (isNowInBounds && outOfBoundsSteps.has(draggedItem.id)) {
              setOutOfBoundsSteps((prev) => {
                const newSet = new Set(prev);
                newSet.delete(draggedItem.id);
                return newSet;
              });
            } else if (!isNowInBounds && !outOfBoundsSteps.has(draggedItem.id)) {
              setOutOfBoundsSteps((prev) => new Set(prev).add(draggedItem.id));
            }
          }
          
          if (selectedItem && selectedItem.id === draggedItem.id) {
            setSelectedItem({ ...selectedItem, position: snappedPos, date: newDate });
          }
        }
      }

      setIsDragging(false);
      setDraggedItem(null);
      setShowLeftChevron(false);
      setShowRightChevron(false);
      setViewTransitioning(false);
      setHighlightedWeek(null);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      dragCleanupRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    dragCleanupRef.current = handleMouseUp;
  }, [
    selectedItem, 
    currentViewIndex, 
    DAYS_PER_VIEW,
    outOfBoundsSessions, 
    outOfBoundsSteps, 
    startDate, 
    timelineLength, 
    totalViews, 
    viewTransitioning,
    snapToAvailableDate,
    positionToDate,
    sessions,
    steps,
    currentZoomConfig
  ]);

  const updateSelectedItem = useCallback((field, value) => {
    if (!selectedItem) return;

    if (field === 'date') {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + timelineLength);
      
      if (value < startDate || value >= endDate) {
        const dateStr = value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        setDateError(`${dateStr} is outside the current journey timeline`);
        return;
      }
      
      const occupyingItem = getItemOnDate(value, selectedItem.id, selectedItem.type);
      if (occupyingItem) {
        setDateError(`This date is occupied by ${occupyingItem.title}`);
        return;
      }
      
      setDateError('');
      
      if (selectedItem.type === 'session' && outOfBoundsSessions.has(selectedItem.id)) {
        setOutOfBoundsSessions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(selectedItem.id);
          return newSet;
        });
      }
      if (selectedItem.type === 'step' && outOfBoundsSteps.has(selectedItem.id)) {
        setOutOfBoundsSteps((prev) => {
          const newSet = new Set(prev);
          newSet.delete(selectedItem.id);
          return newSet;
        });
      }
    }

    const updated = { 
      ...selectedItem, 
      [field]: value 
    };

    if (field === 'date') {
      updated.position = dateToPosition(value);
    }

    if (selectedItem.type === 'session') {
      setSessions((prev) => prev.map((m) => 
        m.id === selectedItem.id ? updated : m
      ));
    } else {
      setSteps((prev) => prev.map((s) => 
        s.id === selectedItem.id ? updated : s
      ));
    }

    setSelectedItem({ ...updated });
  }, [selectedItem, startDate, timelineLength, dateToPosition, outOfBoundsSessions, outOfBoundsSteps, getItemOnDate, setSessions, setSteps, setSelectedItem, setOutOfBoundsSessions, setOutOfBoundsSteps, setDateError]);

  const calculateEndTime = useCallback((date, duration, startTimeStr) => {
    if (!date || !duration) return null;
    
    const baseDate = new Date(date);
    if (isNaN(baseDate.getTime())) return null;
    
    const endTime = new Date(baseDate);
    if (startTimeStr) {
      if (startTimeStr.includes('AM') || startTimeStr.includes('PM')) {
        const [time, period] = startTimeStr.split(' ');
        const [hoursStr, minutesStr] = time.split(':');
        let hours = parseInt(hoursStr, 10);
        let minutes = parseInt(minutesStr, 10) || 0;
        
        if (period === 'PM' && hours !== 12) {
          hours = hours + 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        if (!isNaN(hours) && !isNaN(minutes)) {
          endTime.setHours(hours, minutes, 0, 0);
        } else {
          endTime.setHours(9, 0, 0, 0);
        }
      } else {
        const [hours, minutes] = startTimeStr.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          endTime.setHours(hours, minutes, 0, 0);
        } else {
          endTime.setHours(9, 0, 0, 0);
        }
      }
    } else {
      endTime.setHours(9, 0, 0, 0);
    }
    endTime.setMinutes(endTime.getMinutes() + duration);
    return endTime;
  }, []);

  const formatEndTime = useCallback((date, duration, startTimeStr) => {
    if (!date || !duration) return '';
    
    const endTime = calculateEndTime(date, duration, startTimeStr);
    if (!endTime || isNaN(endTime.getTime())) return '';
    
    const timeStr = endTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const dateStr = endTime.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    return `${timeStr}, ${dateStr}`;
  }, [calculateEndTime]);

  const getSessionIcon = (session) => {
    if (session.isDefault) {
      return Flag;
    }
    
    const iconMap = {
      'in-person': Users,
      'video': Video,
      'voice': Phone,
      'text': MessageSquare
    };
    
    return iconMap[session.meetingType] || Users;
  };

  useEffect(() => {
    if (onJourneyChange) {
      onJourneyChange({ 
        sessions, 
        steps, 
        startDate, 
        timelineLength,
        journeyTitle,
        selectedCategories
      });
    }
  }, [sessions, steps, startDate, timelineLength, journeyTitle, selectedCategories, onJourneyChange]);

  // Auto-adjust zoom level when timeline length changes
  useEffect(() => {
    const validLevels = getValidZoomLevels();
    const currentLevelValid = !validLevels[zoomLevel].disabled;
    
    if (!currentLevelValid) {
      // Find highest valid zoom level
      let highestValidIndex = -1;
      for (let i = validLevels.length - 1; i >= 0; i--) {
        if (!validLevels[i].disabled) {
          highestValidIndex = i;
          break;
        }
      }
      
      if (highestValidIndex >= 0) {
        setZoomLevel(highestValidIndex);
        // Also reset view index if needed
        const newDaysPerView = ZOOM_LEVELS[highestValidIndex].daysPerView;
        const newTotalViews = Math.ceil(timelineLength / newDaysPerView);
        if (currentViewIndex >= newTotalViews) {
          setCurrentViewIndex(Math.max(0, newTotalViews - 1));
        }
      } else {
        setZoomLevel(0); // Fallback to 2 weeks
        setCurrentViewIndex(0);
      }
    }
  }, [timelineLength, zoomLevel, currentViewIndex, getValidZoomLevels]);

  return (
    <NeumorphicCard className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div className="flex items-end gap-6">
            <div style={{ minWidth: '400px' }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Journey Title</label>
              <NeumorphicInput
                type="text"
                placeholder="Enter journey title..."
                value={journeyTitle}
                onChange={(e) => setJourneyTitle(e.target.value)}
                className="text-left text-gray-700 px-4 py-3 focus:outline-none focus:ring-0 focus:border-none transition-all duration-300"
                widthClass="w-[400px]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <NeumorphicDatePicker
                value={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  
                  const outOfBoundsM = new Set();
                  const outOfBoundsS = new Set();
                  
                  setSessions((prev) => prev.map((m) => {
                    if (m.isDefault || !m.date) return m;
                    
                    const normalizedMDate = normalizeDate(m.date);
                    const normalizedStartDate = normalizeDate(date);

                    if (normalizedMDate < normalizedStartDate) {
                      outOfBoundsM.add(m.id);
                      return { ...m, position: 0 };
                    }
                    
                    const daysDiff = Math.floor((normalizedMDate.getTime() - normalizedStartDate.getTime()) / (1000 * 60 * 60 * 24));
                    const newPosition = (daysDiff / timelineLength) * 100;
                    
                    if (daysDiff >= timelineLength) {
                      outOfBoundsM.add(m.id);
                      return { ...m, position: 99 };
                    }
                    
                    return { ...m, position: Math.max(0, Math.min(99, newPosition)) };
                  }));
                  
                  setSteps((prev) => prev.map((s) => {
                    if (!s.date) return s;
                    
                    const normalizedSDate = normalizeDate(s.date);
                    const normalizedStartDate = normalizeDate(date);

                    if (normalizedSDate < normalizedStartDate) {
                      outOfBoundsS.add(s.id);
                      return { ...s, position: 0 };
                    }
                    
                    const daysDiff = Math.floor((normalizedSDate.getTime() - normalizedStartDate.getTime()) / (1000 * 60 * 60 * 24));
                    const newPosition = (daysDiff / timelineLength) * 100;
                    
                    if (daysDiff >= timelineLength) {
                      outOfBoundsS.add(s.id);
                      return { ...s, position: 98 };
                    }
                    
                    return { ...s, position: Math.max(0, Math.min(98, newPosition)) };
                  }));
                  
                  setOutOfBoundsSessions(outOfBoundsM);
                  setOutOfBoundsSteps(outOfBoundsS);
                }}
                className="text-left text-gray-700 px-4 py-3 w-full focus:outline-none focus:ring-0 focus:border-none transition-all duration-300 flex items-center justify-between"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
              <div style={{ width: '120px' }}>
                <NeumorphicInput
                  type="number"
                  value={timelineLengthInput}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setTimelineLengthInput(inputValue);
                    
                    const newLength = parseInt(inputValue);
                    if (!isNaN(newLength) && newLength >= MIN_TIMELINE_LENGTH && newLength <= MAX_TIMELINE_LENGTH) {
                      setTimelineLength(newLength);
                      const newTotalViews = Math.ceil(newLength / DAYS_PER_VIEW);
                      if (currentViewIndex >= newTotalViews) {
                        setCurrentViewIndex(Math.max(0, newTotalViews - 1));
                      }

                      const outOfBoundsM = new Set();
                      const outOfBoundsS = new Set();

                      setSessions((prev) => prev.map((m) => {
                        if (m.isDefault || !m.date) return m;

                        const normalizedMDate = normalizeDate(m.date);
                        const normalizedStartDate = normalizeDate(startDate);
                        const daysDiff = Math.floor((normalizedMDate.getTime() - normalizedStartDate.getTime()) / (1000 * 60 * 60 * 24));

                        if (normalizedMDate < normalizedStartDate) {
                          outOfBoundsM.add(m.id);
                          return { ...m, position: 0 };
                        }
                        
                        if (daysDiff >= newLength) {
                          outOfBoundsM.add(m.id);
                          return { ...m, position: 99 };
                        } else {
                          const newPosition = daysDiff / newLength * 100;
                          return { ...m, position: Math.max(0, Math.min(99, newPosition)) };
                        }
                      }));

                      setSteps((prev) => prev.map((s) => {
                        if (!s.date) return s;

                        const normalizedSDate = normalizeDate(s.date);
                        const normalizedStartDate = normalizeDate(startDate);
                        const daysDiff = Math.floor((normalizedSDate.getTime() - normalizedStartDate.getTime()) / (1000 * 60 * 60 * 24));

                        if (normalizedSDate < normalizedStartDate) {
                          outOfBoundsS.add(s.id);
                          return { ...s, position: 0 };
                        }
                        
                        if (daysDiff >= newLength) {
                          outOfBoundsS.add(s.id);
                          return { ...s, position: 98 };
                        } else {
                          const newPosition = daysDiff / newLength * 100;
                          return { ...s, position: Math.max(0, Math.min(98, newPosition)) };
                        }
                      }));

                      setOutOfBoundsSessions(outOfBoundsM);
                      setOutOfBoundsSteps(outOfBoundsS);
                    }
                  }}
                  onBlur={(e) => {
                    const newLength = parseInt(timelineLengthInput);
                    if (isNaN(newLength) || newLength < MIN_TIMELINE_LENGTH || newLength > MAX_TIMELINE_LENGTH) {
                      setTimelineLengthInput(timelineLength.toString());
                    }
                  }}
                  placeholder="45"
                />
              </div>
            </div>
          </div>
          
        </div>
        
        <div>
          <SelectableEditableBadge
            badges={selectedCategories}
            onAdd={(newCategory) => {
              if (newCategory && !selectedCategories.includes(newCategory)) {
                setSelectedCategories([...selectedCategories, newCategory]);
              }
            }}
            onRemove={(index) => {
              setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
            }}
            options={[
              'Weight Loss',
              'Nutrition',
              'Fitness',
              'Mindfulness',
              'Health',
              'Wellness',
              'Learning',
              'Growth',
              'Habit Building',
              'Recovery',
              'Mental Health',
              'Physical Therapy'
            ]}
            variant="category"
            size="md"
            placeholder="+ category"
          />
        </div>
      </div>
      
      <div className="px-20">
        <div className="flex items-center justify-between mb-4">
          {/* Left side - Week navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentViewIndex(Math.max(0, currentViewIndex - 1))}
              disabled={currentViewIndex === 0}
              className="p-2 rounded-lg transition-all duration-300 disabled:opacity-50"
              style={{
                background: 'var(--nm-background)',
                boxShadow: currentViewIndex === 0 ? 'none' : 'var(--nm-shadow-main)',
                cursor: currentViewIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: 'var(--nm-text-color)' }} />
            </button>
            <span className="text-sm font-medium text-gray-600">
              Weeks {Math.floor(currentViewIndex * DAYS_PER_VIEW / 7) + 1}-
              {Math.min(
                Math.floor((currentViewIndex * DAYS_PER_VIEW + DAYS_PER_VIEW) / 7),
                Math.ceil(timelineLength / 7)
              )} of {Math.ceil(timelineLength / 7)}
            </span>
            <button
              onClick={() => setCurrentViewIndex(Math.min(totalViews - 1, currentViewIndex + 1))}
              disabled={!hasNextView}
              className="p-2 rounded-lg transition-all duration-300 disabled:opacity-50"
              style={{
                background: 'var(--nm-background)',
                boxShadow: !hasNextView ? 'none' : 'var(--nm-shadow-main)',
                cursor: !hasNextView ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--nm-text-color)' }} />
            </button>
          </div>

          {/* Right side - Zoom dropdown */}
          <NeumorphicSelect
            value={zoomLevel.toString()}
            onValueChange={(value) => {
              const newZoomLevel = parseInt(value);
              const validLevels = getValidZoomLevels();
              
              // Don't change if selected level is disabled
              if (validLevels[newZoomLevel].disabled) {
                return;
              }
              
              const oldDaysPerView = currentZoomConfig.daysPerView;
              const currentCenterDay = currentViewIndex * oldDaysPerView + oldDaysPerView / 2;
              const newDaysPerView = ZOOM_LEVELS[newZoomLevel].daysPerView;
              const newTotalViews = Math.ceil(timelineLength / newDaysPerView);
              const newViewIndex = Math.max(0, Math.floor(currentCenterDay / newDaysPerView));
              setZoomLevel(newZoomLevel);
              setCurrentViewIndex(newViewIndex);
            }}
            options={getValidZoomLevels().map((level) => ({
              value: level.index.toString(),
              label: level.label,
              disabled: level.disabled
            }))}
            size="sm"
            widthClass="w-auto"
            icon={ZoomIn}
          />
          {getValidZoomLevels()[zoomLevel].disabled && (
            <span className="text-xs text-gray-500 ml-2">
              (Journey is {Math.ceil(timelineLength / 7)} weeks)
            </span>
          )}
        </div>
      </div>
      
      <div className="transition-opacity duration-300">
        <div ref={timelineContainerRef} className="relative px-20" style={{ height: '400px' }}>
          {currentViewIndex > 0 && (
            <div
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-50 cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => setCurrentViewIndex(Math.max(0, currentViewIndex - 1))}
            >
              <ChevronLeft className="w-10 h-10 text-gray-500" />
            </div>
          )}
          {currentViewIndex < totalViews - 1 && (
            <div
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-50 cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => setCurrentViewIndex(Math.min(totalViews - 1, currentViewIndex + 1))}
            >
              <ChevronRight className="w-10 h-10 text-gray-500" />
            </div>
          )}
          
          {showLeftChevron && isDragging && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-60">
              <ChevronLeft className="w-10 h-10 text-gray-400 animate-pulse" />
            </div>
          )}
          {showRightChevron && isDragging && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-60">
              <ChevronRight className="w-10 h-10 text-gray-400 animate-pulse" />
            </div>
          )}
          
          <div className="relative" style={{ height: '100%' }}>
            {/* Sessions Area - Top Half */}
            <div 
              className="absolute top-0 w-full"
              style={{ height: '45%' }}
              onClick={(e) => {
                if (isDragging || e.target.closest('.session-item')) return;
                
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const viewPos = (x / rect.width) * 100 * (100 / timelineWidthPercent);
                
                if (viewPos > 100) return;
                
                const globalPos = viewToGlobalPosition(viewPos);
                const snappedPos = snapToAvailableDate(globalPos, null, 'session');
                
                const newSession = {
                  id: `s-${Date.now()}`,
                  position: snappedPos,
                  title: `Session ${sessions.filter((m) => !m.isDefault).length + 1}`,
                  type: 'session',
                  isDefault: false,
                  date: positionToDate(snappedPos),
                  startTime: '09:00',
                  description: '',
                  sessionType: 'coaching',
                  meetingType: 'video',
                  platform: 'google-meet',
                  duration: 60,
                  meetingUrl: '',
                  preparationNotes: '',
                  customSessionType: '',
                  customPlatform: '',
                  status: 'scheduled'
                };
                
                setSessions([...sessions, newSession]);
                setSelectedItem(newSession);
              }}
            >
              {sessions.map((session) => {
                const viewPos = globalToViewPosition(session.position);
                const isOutOfBounds = outOfBoundsSessions.has(session.id);
                
                if (viewPos === null && !session.isDefault && !isOutOfBounds) return null; // Only hide if truly out of view AND not an out-of-bounds item we want to show at edges

                // Always show start/end flags
                if (session.isDefault) {
                  if (session.id === 'start' && currentViewIndex !== 0) return null;
                  if (session.id === 'end' && currentViewIndex !== totalViews - 1) return null;
                }
                
                const isStart = session.id === 'start';
                const isEnd = session.id === 'end';
                const isHovered = hoveredItem === session.id;
                const isDragged = draggedItem?.id === session.id;
                const isHidden = isDragged && draggedItem?.isHidden;
                const SessionIcon = getSessionIcon(session);
                
                let displayPos = viewPos;
                if (isOutOfBounds) { // If out of bounds, place at nearest edge for display
                  if (session.position === 0 && currentViewIndex === 0) displayPos = 0;
                  else if (session.position === 99 && currentViewIndex === totalViews - 1) displayPos = 100;
                  else if (viewPos === null) return null; // If out of bounds and not on an edge, hide it.
                }
                if (isStart && currentViewIndex === 0) displayPos = 0;
                if (isEnd && currentViewIndex === totalViews - 1) displayPos = 100;
                if (displayPos === null) return null; // Final check

                const actualPos = displayPos * (timelineWidthPercent / 100);
                
                return (
                  <div key={session.id}>
                    <div
                      className="session-item absolute flex flex-col items-center"
                      style={{
                        left: `${actualPos}%`,
                        transform: 'translateX(-50%)',
                        bottom: '20px',
                        cursor: session.isDefault ? 'default' : isDragging ? 'grabbing' : 'grab',
                        zIndex: isDragged ? 60 : isHovered ? 50 : 10,
                        opacity: isHidden ? 0 : 1,
                        transition: isDragged ? 'none' : 'left 0.3s ease-out'
                      }}
                      onMouseDown={session.isDefault ? undefined : (e) => handleDragStart(e, session)}
                      onMouseEnter={() => setHoveredItem(session.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!session.isDefault && !isDragging) setSelectedItem(session);
                      }}
                    >
                      <div
                        className="rounded-full flex items-center justify-center transition-all duration-300"
                        style={{
                          width: session.isDefault ? '48px' : `${Math.max(32, Math.min(48, 48 * getIconScale()))}px`,
                          height: session.isDefault ? '48px' : `${Math.max(32, Math.min(48, 48 * getIconScale()))}px`,
                          background: 'var(--nm-background)',
                          boxShadow: 'var(--nm-shadow-main)',
                          transform: isHovered && !session.isDefault ? 'scale(1.1)' : 'scale(1)'
                        }}
                      >
                        <SessionIcon 
                          style={{
                            width: session.isDefault ? '24px' : `${Math.max(16, Math.min(24, 24 * getIconScale()))}px`,
                            height: session.isDefault ? '24px' : `${Math.max(16, Math.min(24, 24 * getIconScale()))}px`,
                            color: isStart ? '#48bb78' : isEnd ? '#e53e3e' : '#2f949d',
                            fill: session.isDefault ? (isStart ? '#48bb78' : '#e53e3e') : 'none'
                          }}
                        />
                         {isOutOfBounds && (
                          <div
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                            style={{
                              background: '#ef4444',
                              fontSize: '10px',
                              boxShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                            }}
                            title="Session date is outside timeline range"
                          >
                            !
                          </div>
                        )}
                      </div>
                      <div
                        className="mt-2 text-xs font-medium text-center rounded"
                        style={{
                          background: session.isDefault ? 'transparent' : 'var(--nm-background)',
                          boxShadow: session.isDefault ? 'none' : 'var(--nm-shadow-main)',
                          padding: session.isDefault ? '0' : '4px 8px',
                          minWidth: session.isDefault ? 'auto' : '80px'
                        }}
                      >
                        <div>{session.title}</div>
                        {session.date && (
                          <div className={isOutOfBounds ? 'text-red-500' : 'text-gray-500'}>
                            {isOutOfBounds ? 'Prev: ' : ''}
                            {session.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!session.isDefault && (
                      <div
                        className="absolute"
                        style={{
                          left: `${actualPos}%`,
                          transform: 'translateX(-50%)',
                          bottom: '0',
                          width: '2px',
                          height: '20px',
                          background: '#2f949d',
                          opacity: 0.5
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Timeline - Middle */}
            <div className="absolute w-full" style={{ top: '45%' }}>
              <div className="relative">
                <div
                  ref={timelineRef}
                  className="relative h-12 rounded-xl"
                  style={{
                    width: `${timelineWidthPercent}%`,
                    background: 'var(--nm-background)',
                    boxShadow: 'var(--nm-shadow-inset)'
                  }}
                >
                  {Array.from({ length: viewWeeks }, (_, i) => (
                    <React.Fragment key={`week-${i}`}>
                      {i > 0 && (
                        <div
                          className="absolute top-0 w-0.5 h-12"
                          style={{
                            left: `${i / viewWeeks * 100}%`,
                            transform: 'translateX(-50%)',
                            background: 'var(--nm-background)',
                            boxShadow: 'var(--nm-shadow-main)',
                            borderRadius: '1px'
                          }}
                        />
                      )}
                      <div
                        className="absolute top-0 h-12 flex items-center justify-center text-xs pointer-events-none"
                        style={{
                          left: `${i / viewWeeks * 100}%`,
                          width: `${100 / viewWeeks}%`,
                          fontSize: 10,
                          fontWeight: 500,
                          color: highlightedWeek === i ? '#718096' : '#d1d9e6',
                          userSelect: 'none'
                        }}
                      >
                        Week {Math.floor(startDay / 7) + i + 1}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                
                {isPartialView && (
                  <div
                    className="absolute top-0 h-12 rounded-xl"
                    style={{
                      left: `${timelineWidthPercent}%`,
                      width: `${100 - timelineWidthPercent}%`,
                      background: 'var(--nm-background)',
                      opacity: 0.4,
                      boxShadow: 'var(--nm-shadow-inset)',
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Steps Area - Bottom Half */}
            <div 
              className="absolute bottom-0 w-full"
              style={{ height: '45%' }}
              onClick={(e) => {
                if (isDragging || e.target.closest('.step-item')) return;
                
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const viewPos = (x / rect.width) * 100 * (100 / timelineWidthPercent);
                
                if (viewPos > 100) return;
                
                const globalPos = viewToGlobalPosition(viewPos);
                const snappedPos = snapToAvailableDate(globalPos, null, 'step');
                
                const newStep = {
                  id: `st-${Date.now()}`,
                  position: snappedPos,
                  title: `Step ${steps.length + 1}`,
                  type: 'step',
                  date: positionToDate(snappedPos),
                  startTime: '09:00',
                  stepTypes: ['assignment'],
                  description: ''
                };
                
                setSteps([...steps, newStep]);
                setSelectedItem(newStep);
              }}
            >
              {steps.map((step) => {
                const viewPos = globalToViewPosition(step.position);
                const isOutOfBounds = outOfBoundsSteps.has(step.id);
                
                if (viewPos === null && !isOutOfBounds) return null; // Hide if truly out of view AND not an out-of-bounds item

                const isHovered = hoveredItem === step.id;
                const isDragged = draggedItem?.id === step.id;
                const isHidden = isDragged && draggedItem?.isHidden;

                let displayPos = viewPos;
                if (isOutOfBounds) { // If out of bounds, place at nearest edge for display
                  if (step.position === 0 && currentViewIndex === 0) displayPos = 0;
                  else if (step.position === 99 && currentViewIndex === totalViews - 1) displayPos = 100;
                  else if (viewPos === null) return null; // If out of bounds and not on an edge, hide it.
                }
                if (displayPos === null) return null; // Final check
                
                const actualPos = displayPos * (timelineWidthPercent / 100);
                
                return (
                  <div key={step.id}>
                    <div
                      className="absolute"
                      style={{
                        left: `${actualPos}%`,
                        transform: 'translateX(-50%)',
                        top: '0',
                        width: '2px',
                        height: '20px',
                        background: '#10b981',
                        opacity: 0.5
                      }}
                    />
                    
                    <div
                      className="step-item absolute flex flex-col items-center"
                      style={{
                        left: `${actualPos}%`,
                        transform: 'translateX(-50%)',
                        top: '20px',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        zIndex: isDragged ? 60 : isHovered ? 50 : 20,
                        opacity: isHidden ? 0 : 1,
                        transition: isDragged ? 'none' : 'left 0.3s ease-out'
                      }}
                      onMouseDown={(e) => handleDragStart(e, step)}
                      onMouseEnter={() => setHoveredItem(step.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDragging) setSelectedItem(step);
                      }}
                    >
                      <div className="relative">
                        {(step.stepTypes || ['assignment']).map((type, idx) => {
                          const Icon = stepTypeIcons[type] || Activity;
                          const color = stepTypeColors[type] || '#a8b2c5';
                          const offset = idx * 18;
                          const isTopIcon = idx === 0;

                          return (
                            <div
                              key={idx}
                              className="absolute rounded-full flex items-center justify-center transition-all duration-300"
                              style={{
                                width: `${Math.max(30, Math.min(40, 40 * getIconScale()))}px`,
                                height: `${Math.max(30, Math.min(40, 40 * getIconScale()))}px`,
                                background: 'var(--nm-background)',
                                boxShadow: isTopIcon ? 'var(--nm-shadow-main)' : 'none',
                                border: isTopIcon ? 'none' : '2px solid #d1d9e6',
                                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                left: `${offset - (Math.max(15, Math.min(20, 20 * getIconScale())))}px`,
                                top: `${offset}px`,
                                zIndex: step.stepTypes.length - idx
                              }}
                            >
                              <Icon 
                                style={{ 
                                  width: `${Math.max(15, Math.min(20, 20 * getIconScale()))}px`,
                                  height: `${Math.max(15, Math.min(20, 20 * getIconScale()))}px`,
                                  color 
                                }} 
                              />
                            </div>
                          );
                        })}
                        {isOutOfBounds && (
                          <div
                            className="absolute w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                            style={{
                              background: '#ef4444',
                              fontSize: '10px',
                              boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                              zIndex: 100,
                              top: '-2px',
                              right: '-20px'
                            }}
                            title="Step date is outside timeline range"
                          >
                            !
                          </div>
                        )}
                      </div>
                      <div
                        className="text-xs font-medium text-center rounded"
                        style={{
                          background: 'var(--nm-background)',
                          boxShadow: 'var(--nm-shadow-main)',
                          padding: '2px 6px',
                          minWidth: '60px',
                          marginTop: `${((step.stepTypes?.length || 1) - 1) * 18 + 46}px`
                        }}
                      >
                        <div>{step.title}</div>
                        {step.date && (
                          <div className={isOutOfBounds ? 'text-red-500 text-[10px]' : 'text-gray-500 text-[10px]'}>
                            {isOutOfBounds ? 'Prev: ' : ''}
                            {step.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {selectedItem && !selectedItem.isDefault && (
        <NeumorphicCard className="!shadow-inner-neumorphic" style={{ marginTop: '40px' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700">
              Edit {selectedItem.type === 'session' ? 'Session' : 'Step'}
            </h3>
            <button
              onClick={() => {
                setSelectedItem(null);
                setDateError('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {selectedItem.type === 'session' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Name</label>
                  <NeumorphicInput
                    value={selectedItem.title}
                    onChange={(e) => updateSelectedItem('title', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Description</label>
                  <NeumorphicTextarea
                    value={selectedItem.description || ''}
                    onChange={(e) => updateSelectedItem('description', e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                  <NeumorphicSelect
                    value={selectedItem.sessionType || 'coaching'}
                    onValueChange={(value) => updateSelectedItem('sessionType', value)}
                    options={[
                      { value: 'coaching', label: 'Coaching Session' },
                      { value: 'consultation', label: 'Consultation' },
                      { value: 'check-in-assessment', label: 'Check In Assessment' },
                      { value: 'follow-up', label: 'Follow Up' },
                      { value: 'custom', label: 'Custom' }
                    ]}
                  />
                  {selectedItem.sessionType === 'custom' && (
                    <div className="mt-2">
                      <NeumorphicInput
                        placeholder="Enter custom session type..."
                        value={selectedItem.customSessionType || ''}
                        onChange={(e) => updateSelectedItem('customSessionType', e.target.value)}
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label>
                  <NeumorphicSelect
                    value={selectedItem.meetingType || 'video'}
                    onValueChange={(value) => updateSelectedItem('meetingType', value)}
                    options={[
                      { value: 'in-person', label: 'In Person' },
                      { value: 'video', label: 'Video Call' },
                      { value: 'voice', label: 'Voice Call' },
                      { value: 'text', label: 'Text Chat' }
                    ]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Platform</label>
                  <NeumorphicSelect
                    value={selectedItem.platform || 'google-meet'}
                    onValueChange={(value) => updateSelectedItem('platform', value)}
                    options={[
                      { value: 'google-meet', label: 'Google Meet' },
                      { value: 'zoom', label: 'Zoom' },
                      { value: 'teams', label: 'Teams' },
                      { value: 'whatsapp', label: 'WhatsApp' },
                      { value: 'facetime', label: 'FaceTime' },
                      { value: 'custom', label: 'Custom' }
                    ]}
                  />
                  {selectedItem.platform === 'custom' && (
                    <div className="mt-2">
                      <NeumorphicInput
                        placeholder="Enter custom platform..."
                        value={selectedItem.customPlatform || ''}
                        onChange={(e) => updateSelectedItem('customPlatform', e.target.value)}
                      />
                    </div>
                  )}
                </div>
                
                {(selectedItem.platform === 'google-meet' || 
                  selectedItem.platform === 'zoom' || 
                  selectedItem.platform === 'teams') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting URL</label>
                    <NeumorphicInput
                      value={selectedItem.meetingUrl || ''}
                      onChange={(e) => updateSelectedItem('meetingUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <NeumorphicInput
                    type="number"
                    value={selectedItem.duration || 60}
                    onChange={(e) => updateSelectedItem('duration', parseInt(e.target.value) || 60)}
                    placeholder="60"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preparation Notes</label>
                  <NeumorphicTextarea
                    value={selectedItem.preparationNotes || ''}
                    onChange={(e) => updateSelectedItem('preparationNotes', e.target.value)}
                    rows={3}
                    placeholder="Notes for preparation..."
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <NeumorphicInput
                    value={selectedItem.title}
                    onChange={(e) => updateSelectedItem('title', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Step Types</label>
                  <div className="space-y-2">
                    {(selectedItem.stepTypes || ['assignment']).map((type, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <NeumorphicSelect
                          value={type}
                          onValueChange={(value) => {
                            const newTypes = [...(selectedItem.stepTypes || [])];
                            newTypes[idx] = value;
                            updateSelectedItem('stepTypes', newTypes);
                          }}
                          options={[
                            { value: 'assignment', label: 'Assignment' },
                            { value: 'activity', label: 'Activity' },
                            { value: 'check-in', label: 'Check-in' },
                            { value: 'learning', label: 'Learning' }
                          ]}
                        />
                        {(selectedItem.stepTypes || []).length > 1 && (
                          <button
                            onClick={() => {
                              const updated = {
                                ...selectedItem,
                                stepTypes: (selectedItem.stepTypes || []).filter((t) => t !== type)
                              };
                              if (updated.stepTypes.length > 0) {
                                setSteps((prev) => prev.map((s) => s.id === selectedItem.id ? updated : s));
                                setSelectedItem(updated);
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {(selectedItem.stepTypes || []).length < 4 && idx === (selectedItem.stepTypes || []).length - 1 && (
                          <button
                            onClick={() => {
                              const availableTypes = ['assignment', 'activity', 'check-in', 'learning'];
                              const unusedTypes = availableTypes.filter((t) => !(selectedItem.stepTypes || []).includes(t));
                              if (unusedTypes.length > 0) {
                                const updated = {
                                  ...selectedItem,
                                  stepTypes: [...(selectedItem.stepTypes || []), unusedTypes[0]]
                                };
                                setSteps((prev) => prev.map((s) => s.id === selectedItem.id ? updated : s));
                                setSelectedItem(updated);
                              }
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:opacity-70"
                            style={{
                              background: 'var(--nm-background)',
                              boxShadow: 'var(--nm-shadow-main)',
                              color: '#2f949d'
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <NeumorphicTextarea
                    value={selectedItem.description || ''}
                    onChange={(e) => updateSelectedItem('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <NeumorphicDatePicker
                value={selectedItem.date}
                onChange={(date) => updateSelectedItem('date', date)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedItem.type === 'session' ? 'Start Time' : 'Target Time'}
              </label>
              <NeumorphicTimePicker
                value={selectedItem.startTime || '09:00'}
                onChange={(time) => {
                  updateSelectedItem('startTime', time);
                  setSelectedItem(prev => {
                    const newItem = { ...prev, startTime: time };
                    return newItem;
                  });
                }}
                placeholder={selectedItem.type === 'session' ? 'Select start time...' : 'Select target time...'}
              />
              {selectedItem.type === 'session' && 
               selectedItem.date && 
               selectedItem.duration && 
               selectedItem.startTime && (
                <p className="text-gray-500 mt-1 text-xs">
                  End Time: {(() => {
                    return formatEndTime(selectedItem.date, selectedItem.duration, selectedItem.startTime);
                  })()}
                </p>
              )}
              {dateError && (
                <p className="text-red-500 mt-2 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {dateError}
                </p>
              )}
              {!dateError && selectedItem.type === 'session' && outOfBoundsSessions.has(selectedItem.id) && (
                <p className="text-red-500 mt-2 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {selectedItem.title} is outside the journey timeline
                </p>
              )}
              {!dateError && selectedItem.type === 'step' && outOfBoundsSteps.has(selectedItem.id) && (
                <p className="text-red-500 mt-2 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {selectedItem.title} is outside the journey timeline
                </p>
              )}
            </div>
            
            {selectedItem.type === 'session' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <NeumorphicSelect
                  value={selectedItem.status || 'scheduled'}
                  onValueChange={(value) => updateSelectedItem('status', value)}
                  options={[
                    { value: 'scheduled', label: 'Scheduled' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'in-progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'missed', label: 'Missed' }
                  ]}
                />
              </div>
            )}
            
            <div className="flex gap-3 justify-end pt-4">
              <NeumorphicButton onClick={() => {
                setSessions((prev) => prev.filter((m) => m.id !== selectedItem.id));
                setSteps((prev) => prev.filter((s) => s.id !== selectedItem.id));
                setSelectedItem(null);
                setDateError('');
              }}>
                Delete
              </NeumorphicButton>
              <NeumorphicButton
                variant="primary"
                onClick={() => {
                  setSelectedItem(null);
                  setDateError('');
                }}
                disabled={!!dateError}
              >
                Save
              </NeumorphicButton>
            </div>
          </div>
        </NeumorphicCard>
      )}
    </NeumorphicCard>
  );
};

export default NeumorphicJourneyDesignerV10;
