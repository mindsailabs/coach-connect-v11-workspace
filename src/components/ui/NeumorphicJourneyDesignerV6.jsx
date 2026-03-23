import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Flag, Users, Activity, Calendar, ChevronLeft, ChevronRight, X, AlertCircle, Plus, BookOpen, CheckSquare, GraduationCap, Video, Phone, MessageSquare } from 'lucide-react';
import NeumorphicCard from './NeumorphicCard';
import NeumorphicButton from './NeumorphicButton';
import NeumorphicInput from './NeumorphicInput';
import NeumorphicSelect from './NeumorphicSelect';
import NeumorphicTextarea from './NeumorphicTextarea';
import NeumorphicDatePicker from './NeumorphicDatePicker';

// Constants
const WEEKS_PER_VIEW = 6;
const DAYS_PER_VIEW = WEEKS_PER_VIEW * 7;

// Step type icon mapping (removed session)
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

const NeumorphicJourneyDesignerV6 = ({
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

  const timelineRef = useRef(null);
  const stepTimelineRef = useRef(null);

  const totalViews = Math.ceil(timelineLength / DAYS_PER_VIEW);

  const getViewDayRange = useCallback(() => {
    const startDay = currentViewIndex * DAYS_PER_VIEW;
    const endDay = Math.min(startDay + DAYS_PER_VIEW, timelineLength);
    return { startDay, endDay };
  }, [currentViewIndex, timelineLength]);

  const globalToViewPosition = useCallback((globalPos) => {
    const { startDay, endDay } = getViewDayRange();
    const globalDay = globalPos / 100 * timelineLength;

    if (globalDay < startDay || globalDay >= endDay) return null;

    const viewDays = endDay - startDay;
    if (viewDays <= 0) return null;

    const dayInView = globalDay - startDay;
    return dayInView / viewDays * 100;
  }, [getViewDayRange, timelineLength]);

  const viewToGlobalPosition = useCallback((viewPos, viewIndex = currentViewIndex) => {
    const startDay = viewIndex * DAYS_PER_VIEW;
    const endDay = Math.min(startDay + DAYS_PER_VIEW, timelineLength);
    const viewDays = endDay - startDay;
    const dayInView = viewPos / 100 * viewDays;
    const globalDay = startDay + dayInView;
    return globalDay / timelineLength * 100;
  }, [timelineLength, currentViewIndex]);

  const positionToDate = useCallback((position) => {
    const days = Math.round(position / 100 * timelineLength);
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    return date;
  }, [timelineLength, startDate]);

  const dateToPosition = useCallback((date) => {
    const diff = date.getTime() - startDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days / timelineLength * 100;
  }, [timelineLength, startDate]);

  const isDateOccupied = useCallback((date, excludeId = null, itemType = 'session') => {
    const items = itemType === 'session' ? sessions : steps;
    return items.some((item) =>
      item.id !== excludeId &&
      item.date &&
      !item.isDefault &&
      item.date.toDateString() === date.toDateString()
    );
  }, [sessions, steps]);

  const getItemOnDate = useCallback((date, excludeId = null, itemType = 'session') => {
    const items = itemType === 'session' ? sessions : steps;
    return items.find((item) =>
      item.id !== excludeId &&
      item.date &&
      !item.isDefault &&
      item.date.toDateString() === date.toDateString()
    );
  }, [sessions, steps]);

  const snapToAvailableDate = useCallback((position, itemId, itemType = 'session') => {
    const targetDate = positionToDate(position);

    if (!isDateOccupied(targetDate, itemId, itemType)) {
      return position;
    }

    for (let offset = 1; offset <= 7; offset++) {
      const beforeDate = new Date(targetDate);
      beforeDate.setDate(beforeDate.getDate() - offset);
      if (beforeDate >= startDate && beforeDate.getTime() < startDate.getTime() + timelineLength * 24 * 60 * 60 * 1000 && !isDateOccupied(beforeDate, itemId, itemType)) {
        const beforePos = dateToPosition(beforeDate);
        if (beforePos >= 0 && beforePos <= 100) {
          return beforePos;
        }
      }

      const afterDate = new Date(targetDate);
      afterDate.setDate(afterDate.getDate() + offset);
      if (afterDate >= startDate && afterDate.getTime() < startDate.getTime() + timelineLength * 24 * 60 * 60 * 1000 && !isDateOccupied(afterDate, itemId, itemType)) {
        const afterPos = dateToPosition(afterDate);
        if (afterPos >= 0 && afterPos <= 100) {
          return afterPos;
        }
      }
    }

    return position;
  }, [positionToDate, isDateOccupied, dateToPosition, startDate, timelineLength]);

  const handleTimelineClick = useCallback((e) => {
    if (isDragging || e.target.closest('.session-item') || e.target.closest('.step-item')) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPos = (x / rect.width) * 100;
    
    if (currentViewIndex === 0) {
      const outOfBoundsAtStart = sessions.filter((m) =>
        outOfBoundsSessions.has(m.id) && m.position === 0 && !m.isDefault
      );
      
      for (let i = 0; i < outOfBoundsAtStart.length; i++) {
        const spacing = 13 / Math.max(1, outOfBoundsAtStart.length);
        const itemPos = 5 + (i * spacing);
        
        if (Math.abs(clickPos - itemPos) < 3) {
          setSelectedItem(outOfBoundsAtStart[i]);
          return;
        }
      }
    }
    
    if (currentViewIndex === totalViews - 1) {
      const outOfBoundsAtEnd = sessions.filter((m) =>
        outOfBoundsSessions.has(m.id) && m.position === 99
      );
      
      for (let i = 0; i < outOfBoundsAtEnd.length; i++) {
        const spacing = 13 / Math.max(1, outOfBoundsAtEnd.length);
        const itemPos = 85 + (i * spacing);
        
        if (Math.abs(clickPos - itemPos) < 3) {
          setSelectedItem(outOfBoundsAtEnd[i]);
          return;
        }
      }
    }
    
    const viewPos = (x / rect.width) * 100;
    const globalPos = viewToGlobalPosition(viewPos);
    const snappedPos = snapToAvailableDate(globalPos, null, 'session');
    
    const newSession = {
      id: `s-${Date.now()}`,
      position: snappedPos,
      title: `Session ${sessions.filter((m) => !m.isDefault).length + 1}`,
      type: 'session',
      isDefault: false,
      date: positionToDate(snappedPos),
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
  }, [isDragging, currentViewIndex, totalViews, sessions, outOfBoundsSessions, viewToGlobalPosition, positionToDate, snapToAvailableDate]);

  const handleStepTimelineClick = useCallback((e) => {
    if (isDragging || e.target.closest('.step-item')) return;
    
    const rect = stepTimelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPos = (x / rect.width) * 100;
    
    if (currentViewIndex === 0) {
      const outOfBoundsAtStart = steps.filter((s) =>
        outOfBoundsSteps.has(s.id) && s.position === 0
      );
      
      for (let i = 0; i < outOfBoundsAtStart.length; i++) {
        const spacing = 18 / Math.max(1, outOfBoundsAtStart.length);
        const itemPos = 5 + (i * spacing);
        
        if (Math.abs(clickPos - itemPos) < 3) {
          setSelectedItem(outOfBoundsAtStart[i]);
          return;
        }
      }
    }
    
    if (currentViewIndex === totalViews - 1) {
      const outOfBoundsAtEnd = steps.filter((s) =>
        outOfBoundsSteps.has(s.id) && s.position >= 98
      );
      
      for (let i = 0; i < outOfBoundsAtEnd.length; i++) {
        const spacing = 18 / Math.max(1, outOfBoundsAtEnd.length);
        const itemPos = 85 + (i * spacing);
        
        if (Math.abs(clickPos - itemPos) < 3) {
          setSelectedItem(outOfBoundsAtEnd[i]);
          return;
        }
      }
    }
    
    const viewPos = (x / rect.width) * 100;
    const globalPos = viewToGlobalPosition(viewPos);
    const snappedPos = snapToAvailableDate(globalPos, null, 'step');
    
    const newStep = {
      id: `st-${Date.now()}`,
      position: snappedPos,
      title: `Step ${steps.length + 1}`,
      type: 'step',
      date: positionToDate(snappedPos),
      stepTypes: ['assignment'],
      description: ''
    };
    
    setSteps([...steps, newStep]);
    setSelectedItem(newStep);
  }, [isDragging, currentViewIndex, totalViews, steps, outOfBoundsSteps, viewToGlobalPosition, positionToDate, snapToAvailableDate]);

  const handleDragStart = useCallback((e, item) => {
    e.preventDefault();
    setIsDragging(true);
    setDraggedItem({ ...item, isHidden: false });

    let currentDragView = currentViewIndex;
    let viewTransitionTimer = null;

    const handleMouseMove = (moveEvent) => {
      if (viewTransitioning) return;

      const timelineEl = item.type === 'session' ? timelineRef.current : stepTimelineRef.current;
      if (!timelineEl) return;

      const rect = timelineEl.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const viewWidth = rect.width;
      const relativeX = x / viewWidth;

      if (item.type === 'session') {
        const viewPos = Math.max(0, Math.min(100, relativeX * 100));
        const startDayForView = currentDragView * DAYS_PER_VIEW;
        const endDayForView = Math.min((currentDragView + 1) * DAYS_PER_VIEW, timelineLength);
        const viewDaysForView = endDayForView - startDayForView;
        const dayInView = viewPos / 100 * viewDaysForView;
        const globalDay = startDayForView + dayInView;
        const weekIndex = Math.floor(globalDay / 7);
        const viewWeekIndex = weekIndex - Math.floor(startDayForView / 7);
        setHighlightedWeek(viewWeekIndex >= 0 ? viewWeekIndex : null);
      }

      const inLeftZone = relativeX < 0.15 && currentDragView > 0;
      const inRightZone = relativeX > 0.85 && currentDragView < totalViews - 1;

      setShowLeftChevron(inLeftZone);
      setShowRightChevron(inRightZone);

      const pastLeftEdge = x < -10;
      const pastRightEdge = x > viewWidth + 10;

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
          }, 300);
        }, 600);
      } else if ((inRightZone || pastRightEdge) && currentDragView < totalViews - 1 && !viewTransitionTimer) {
        viewTransitionTimer = setTimeout(() => {
          setDraggedItem((prev) => ({ ...prev, isHidden: true }));
          setViewTransitioning(true);

          currentDragView++;
          setCurrentViewIndex(currentDragView);

          setTimeout(() => {
            setViewTransitioning(false);
            setDraggedItem((prev) => ({ ...prev, isHidden: false }));
            viewTransitionTimer = null;
          }, 300);
        }, 600);
      } else if (!inLeftZone && !inRightZone && !pastLeftEdge && !pastRightEdge && viewTransitionTimer) {
        clearTimeout(viewTransitionTimer);
        viewTransitionTimer = null;
      }

      if (!viewTransitioning) {
        const clampedX = Math.max(0, Math.min(1, relativeX));
        const viewPos = clampedX * 100;
        updateItemPosition(item, viewPos, currentDragView);
      }
    };

    const updateItemPosition = (item, viewPos, viewIndex) => {
      const globalPos = viewToGlobalPosition(viewPos, viewIndex);
      const finalPos = snapToAvailableDate(globalPos, item.id, item.type);
      const newDate = positionToDate(finalPos);

      const journeyEndDate = new Date(startDate);
      journeyEndDate.setDate(journeyEndDate.getDate() + timelineLength);
      const isNowInBounds = newDate >= startDate && newDate < journeyEndDate;

      if (item.type === 'session') {
        setSessions((prev) => prev.map((m) =>
          m.id === item.id ? { ...m, position: finalPos, date: newDate } : m
        ));
        
        if (isNowInBounds && outOfBoundsSessions.has(item.id)) {
          setOutOfBoundsSessions((prev) => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        }
      } else {
        setSteps((prev) => prev.map((s) =>
          s.id === item.id ? { ...s, position: finalPos, date: newDate } : s
        ));
        
        if (isNowInBounds && outOfBoundsSteps.has(item.id)) {
          setOutOfBoundsSteps((prev) => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        }
      }

      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem((prev) => ({ ...prev, position: finalPos, date: newDate }));
      }
    };

    const handleMouseUp = () => {
      if (viewTransitionTimer) {
        clearTimeout(viewTransitionTimer);
      }

      setIsDragging(false);
      setDraggedItem(null);
      setShowLeftChevron(false);
      setShowRightChevron(false);
      setViewTransitioning(false);
      setHighlightedWeek(null);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentViewIndex, totalViews, timelineLength, startDate, positionToDate, outOfBoundsSessions, outOfBoundsSteps, snapToAvailableDate, viewTransitioning, selectedItem, viewToGlobalPosition]);

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

    const updated = { ...selectedItem, [field]: value };

    if (field === 'date') {
      updated.position = dateToPosition(value);
    }

    if (selectedItem.type === 'session') {
      setSessions((prev) => prev.map((m) => m.id === selectedItem.id ? updated : m));
    } else {
      setSteps((prev) => prev.map((s) => s.id === selectedItem.id ? updated : s));
    }

    setSelectedItem(updated);
  }, [selectedItem, startDate, timelineLength, dateToPosition, outOfBoundsSessions, outOfBoundsSteps, getItemOnDate]);

  const addStepType = useCallback(() => {
    if (!selectedItem || selectedItem.type !== 'step') return;

    const availableTypes = ['assignment', 'activity', 'check-in', 'learning'];
    const unusedTypes = availableTypes.filter((t) => !selectedItem.stepTypes?.includes(t));

    if (unusedTypes.length > 0) {
      const updated = {
        ...selectedItem,
        stepTypes: [...(selectedItem.stepTypes || []), unusedTypes[0]]
      };

      setSteps((prev) => prev.map((s) => s.id === selectedItem.id ? updated : s));
      setSelectedItem(updated);
    }
  }, [selectedItem]);

  const removeStepType = useCallback((typeToRemove) => {
    if (!selectedItem || selectedItem.type !== 'step') return;

    const updated = {
      ...selectedItem,
      stepTypes: selectedItem.stepTypes.filter((t) => t !== typeToRemove)
    };

    if (updated.stepTypes.length > 0) {
      setSteps((prev) => prev.map((s) => s.id === selectedItem.id ? updated : s));
      setSelectedItem(updated);
    }
  }, [selectedItem]);

  const calculateEndTime = (date, duration) => {
    if (!date || !duration) return null;
    const endTime = new Date(date);
    endTime.setMinutes(endTime.getMinutes() + duration);
    return endTime;
  };

  const formatEndTime = (date, duration) => {
    const endTime = calculateEndTime(date, duration);
    if (!endTime) return '';
    
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
  };

  const deleteItem = useCallback((id) => {
    setSessions((prev) => prev.filter((m) => m.id !== id));
    setSteps((prev) => prev.filter((s) => s.id !== id));
    setSelectedItem(null);
    setDateError('');
  }, []);

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
      onJourneyChange({ sessions, steps, startDate, timelineLength });
    }
  }, [sessions, steps, startDate, timelineLength, onJourneyChange]);

  const { startDay, endDay } = getViewDayRange();
  const actualDaysInView = endDay - startDay;
  const viewWeeks = Math.ceil(actualDaysInView / 7);
  const isPartialView = viewWeeks < WEEKS_PER_VIEW;
  const timelineWidthPercent = isPartialView ? (viewWeeks / WEEKS_PER_VIEW * 100) : 100;

  const stepTypeOptions = [
    { value: 'assignment', label: 'Assignment' },
    { value: 'activity', label: 'Activity' },
    { value: 'check-in', label: 'Check-in' },
    { value: 'learning', label: 'Learning' }
  ];

  const sessionTypeOptions = [
    { value: 'coaching', label: 'Coaching Session' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'check-in-assessment', label: 'Check In Assessment' },
    { value: 'follow-up', label: 'Follow Up' }
  ];

  const meetingTypeOptions = [
    { value: 'in-person', label: 'In Person' },
    { value: 'video', label: 'Video Call' },
    { value: 'voice', label: 'Voice Call' },
    { value: 'text', label: 'Text Chat' }
  ];

  const platformOptions = [
    { value: 'google-meet', label: 'Google Meet' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'teams', label: 'Teams' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'facetime', label: 'FaceTime' }
  ];
  
  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'missed', label: 'Missed' }
  ];

  return (
    <NeumorphicCard className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
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
                  
                  const daysDiff = Math.floor((m.date.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (daysDiff < 0) {
                    outOfBoundsM.add(m.id);
                    return { ...m, position: 0 };
                  } else if (daysDiff >= timelineLength) {
                    outOfBoundsM.add(m.id);
                    return { ...m, position: 99 };
                  } else {
                    const newPosition = daysDiff / timelineLength * 100;
                    return { ...m, position: Math.max(0, Math.min(99, newPosition)) };
                  }
                }));
                
                setSteps((prev) => prev.map((s) => {
                  if (!s.date) return s;
                  
                  const daysDiff = Math.floor((s.date.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (daysDiff < 0) {
                    outOfBoundsS.add(s.id);
                    return { ...s, position: 0 };
                  } else if (daysDiff >= timelineLength) {
                    outOfBoundsS.add(s.id);
                    return { ...s, position: 98 };
                  } else {
                    const newPosition = daysDiff / timelineLength * 100;
                    return { ...s, position: Math.max(0, Math.min(98, newPosition)) };
                  }
                }));
                
                setOutOfBoundsSessions(outOfBoundsM);
                setOutOfBoundsSteps(outOfBoundsS);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
            <div style={{ width: '80px' }}>
              <NeumorphicInput
                type="number"
                value={timelineLengthInput}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setTimelineLengthInput(inputValue);
                  
                  const parsedValue = parseInt(inputValue);
                  if (parsedValue > 0 && parsedValue <= 999) {
                    const newLength = parsedValue;
                    setTimelineLength(newLength);
                    const newTotalViews = Math.ceil(newLength / DAYS_PER_VIEW);
                    if (currentViewIndex >= newTotalViews) {
                      setCurrentViewIndex(Math.max(0, newTotalViews - 1));
                    }

                    const outOfBoundsM = new Set();
                    const outOfBoundsS = new Set();

                    // Recalculate session positions
                    setSessions((prev) => prev.map((m) => {
                      if (m.isDefault || !m.date) return m;
                      
                      const daysDiff = Math.floor((m.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                      if (m.date < startDate) {
                        outOfBoundsM.add(m.id);
                        return { ...m, position: 0 };
                      }
                      
                      if (daysDiff >= newLength) {
                        outOfBoundsM.add(m.id);
                        return { ...m, position: 99 };
                      } else if (daysDiff < 0) {
                        outOfBoundsM.add(m.id);
                        return { ...m, position: 0 };
                      } else {
                        const newPosition = daysDiff / newLength * 100;
                        return { ...m, position: Math.max(0, Math.min(99, newPosition)) };
                      }
                    }));

                    // Recalculate step positions  
                    setSteps((prev) => prev.map((s) => {
                      if (!s.date) return s;
                      
                      const daysDiff = Math.floor((s.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                      if (s.date < startDate) {
                        outOfBoundsS.add(s.id);
                        return { ...s, position: 0 };
                      }
                      
                      if (daysDiff >= newLength) {
                        outOfBoundsS.add(s.id);
                        return { ...s, position: 98 };
                      } else if (daysDiff < 0) {
                        outOfBoundsS.add(s.id);
                        return { ...s, position: 0 };
                      } else {
                        const newPosition = daysDiff / newLength * 100;
                        return { ...s, position: Math.max(0, Math.min(98, newPosition)) };
                      }
                    }));

                    setOutOfBoundsSessions(outOfBoundsM);
                    setOutOfBoundsSteps(outOfBoundsS);
                  }
                }}
                onBlur={() => {
                  const parsedValue = parseInt(timelineLengthInput);
                  if (!(parsedValue > 0 && parsedValue <= 999)) {
                    setTimelineLengthInput(timelineLength.toString());
                  }
                }}
                placeholder="45"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* View Navigation */}
      <div className="flex justify-center items-center px-20">
        <h3 className="text-gray-700 text-base font-medium">
          Weeks {Math.floor(startDay / 7) + 1}-{Math.ceil(endDay / 7)} of {Math.ceil(timelineLength / 7)}
        </h3>
      </div>
      
      {/* Timeline Container */}
      <div className="transition-opacity duration-300">
        {/* Sessions Timeline */}
        <div className="relative px-20 mb-20">
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
          
          {showLeftChevron && draggedItem?.type === 'session' && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-60">
              <ChevronLeft className="w-10 h-10 text-gray-400 animate-pulse" />
            </div>
          )}
          {showRightChevron && draggedItem?.type === 'session' && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-60">
              <ChevronRight className="w-10 h-10 text-gray-400 animate-pulse" />
            </div>
          )}

          <div
            ref={timelineRef}
            onClick={handleTimelineClick}
            className="relative h-12 rounded-xl cursor-pointer"
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
                      boxShadow: '1px 1px 2px #d1d9e6, -1px -1px 2px #ffffff',
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
            
            {steps.map((step) => {
              const viewPos = globalToViewPosition(step.position);
              
              if (outOfBoundsSteps.has(step.id) && step.position === 0 && currentViewIndex === 0) {
                const outOfBoundsStepsAtStart = steps.filter((s) => outOfBoundsSteps.has(s.id) && s.position === 0);
                const index = outOfBoundsStepsAtStart.findIndex((s) => s.id === step.id);
                const spacing = 18 / Math.max(1, outOfBoundsStepsAtStart.length);
                return (
                  <div
                    key={`notch-${step.id}`}
                    className="absolute bottom-0 w-0.5 h-3"
                    style={{
                      left: `${5 + index * spacing}%`,
                      transform: 'translateX(-50%)',
                      background: '#ef4444',
                      opacity: 0.6
                    }}
                  />
                );
              }
              
              if (outOfBoundsSteps.has(step.id) && step.position >= 98 && currentViewIndex === totalViews - 1) {
                const outOfBoundsStepsAtEnd = steps.filter((s) => outOfBoundsSteps.has(s.id) && s.position >= 98);
                const index = outOfBoundsStepsAtEnd.findIndex((s) => s.id === step.id);
                const spacing = 18 / Math.max(1, outOfBoundsStepsAtEnd.length);
                return (
                  <div
                    key={`notch-${step.id}`}
                    className="absolute bottom-0 w-0.5 h-3"
                    style={{
                      left: `${85 + index * spacing}%`,
                      transform: 'translateX(-50%)',
                      background: '#ef4444',
                      opacity: 0.6
                    }}
                  />
                );
              }

              if (viewPos === null) return null;

              return (
                <div
                  key={`notch-${step.id}`}
                  className="absolute bottom-0 w-0.5 h-3"
                  style={{
                    left: `${viewPos}%`,
                    transform: 'translateX(-50%)',
                    background: outOfBoundsSteps.has(step.id) ? '#ef4444' : '#a8b2c5',
                    opacity: 0.6
                  }}
                />
              );
            })}
            
            {(() => {
              const outOfBoundsAtStart = sessions.filter((m) =>
                outOfBoundsSessions.has(m.id) && m.position === 0 && !m.isDefault
              );
              
              const outOfBoundsAtEnd = sessions.filter((m) =>
                outOfBoundsSessions.has(m.id) && m.position === 99
              );

              return sessions.map((session) => {
                let displayPos = globalToViewPosition(session.position);

                const isOutOfBoundsAtStart = outOfBoundsSessions.has(session.id) && session.position === 0 && !session.isDefault;
                const isOutOfBoundsAtEnd = outOfBoundsSessions.has(session.id) && session.position === 99;

                if (isOutOfBoundsAtStart && currentViewIndex === 0) {
                  const index = outOfBoundsAtStart.findIndex((m) => m.id === session.id);
                  const spacing = 13 / Math.max(1, outOfBoundsAtStart.length);
                  displayPos = 5 + index * spacing;
                } else if (isOutOfBoundsAtEnd && currentViewIndex === totalViews - 1) {
                  const index = outOfBoundsAtEnd.findIndex((m) => m.id === session.id);
                  const spacing = 13 / Math.max(1, outOfBoundsAtEnd.length);
                  displayPos = 85 + index * spacing;
                } else if (displayPos === null && !session.isDefault) {
                  return null;
                }
                
                if (session.id === 'start' && currentViewIndex === 0) displayPos = -5;
                if (session.id === 'end' && currentViewIndex === totalViews - 1) {
                  displayPos = 105;
                }
                
                if (displayPos === null) return null;

                const isStart = session.id === 'start';
                const isEnd = session.id === 'end';
                const isHovered = hoveredItem === session.id;
                const isDragged = draggedItem?.id === session.id;
                const isHidden = isDragged && draggedItem?.isHidden;
                const showOutOfBoundsIndicator = isOutOfBoundsAtStart || isOutOfBoundsAtEnd;
                const SessionIcon = getSessionIcon(session);

                return (
                  <div
                    key={session.id}
                    className="session-item absolute flex flex-col items-center"
                    style={{
                      left: `${displayPos}%`,
                      transform: 'translateX(-50%)',
                      top: '50%',
                      marginTop: '-24px',
                      cursor: session.isDefault ? 'default' : isDragging ? 'grabbing' : 'grab',
                      zIndex: isDragged ? 60 : isHovered ? 50 : 10,
                      opacity: isHidden ? 0 : 1,
                      transition: 'none'
                    }}
                    onMouseDown={session.isDefault ? undefined : (e) => handleDragStart(e, session)}
                    onMouseEnter={() => setHoveredItem(session.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => !session.isDefault && !isDragging && setSelectedItem(session)}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        background: 'var(--nm-background)',
                        boxShadow: 'var(--nm-shadow-main)',
                        transform: isHovered && !session.isDefault ? 'scale(1.1)' : 'scale(1)'
                      }}
                    >
                      <SessionIcon
                        className="w-6 h-6"
                        style={{
                          color: isStart ? '#48bb78' : isEnd ? '#e53e3e' : '#2f949d',
                          fill: isStart ? '#48bb78' : isEnd ? '#e53e3e' : '#2f949d'
                        }}
                      />
                      {showOutOfBoundsIndicator && (
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
                        <div className={showOutOfBoundsIndicator ? 'text-red-500' : 'text-gray-500'}>
                          {showOutOfBoundsIndicator ? 'Previously: ' : ''}
                          {session.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
        
        {/* Steps Timeline */}
        <div className="relative px-20">
          {showLeftChevron && draggedItem?.type === 'step' && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-50">
              <ChevronLeft className="w-10 h-10 text-gray-400 animate-pulse" />
            </div>
          )}
          {showRightChevron && draggedItem?.type === 'step' && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50">
              <ChevronRight className="w-10 h-10 text-gray-400 animate-pulse" />
            </div>
          )}
          
          <div
            ref={stepTimelineRef}
            onClick={handleStepTimelineClick}
            className="relative h-2 rounded cursor-pointer"
            style={{
              width: `${timelineWidthPercent}%`,
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-inset)'
            }}
          >
            {(() => {
              const outOfBoundsStepsAtStart = steps.filter((s) =>
                outOfBoundsSteps.has(s.id) && s.position === 0
              );
              const outOfBoundsStepsAtEnd = steps.filter((s) =>
                outOfBoundsSteps.has(s.id) && s.position >= 98
              );

              return steps.map((step) => {
                let displayPos = globalToViewPosition(step.position);

                const isOutOfBoundsAtStart = outOfBoundsSteps.has(step.id) && step.position === 0;
                const isOutOfBoundsAtEnd = outOfBoundsSteps.has(step.id) && step.position >= 98;

                if (isOutOfBoundsAtStart && currentViewIndex === 0) {
                  const index = outOfBoundsStepsAtStart.findIndex((s) => s.id === step.id);
                  const spacing = 18 / Math.max(1, outOfBoundsStepsAtStart.length);
                  displayPos = 5 + index * spacing;
                } else if (isOutOfBoundsAtEnd && currentViewIndex === totalViews - 1) {
                  const index = outOfBoundsStepsAtEnd.findIndex((s) => s.id === step.id);
                  const spacing = 18 / Math.max(1, outOfBoundsStepsAtEnd.length);
                  displayPos = 85 + index * spacing;
                } else if (displayPos === null) {
                  return null;
                }
                
                if (displayPos === null) return null;

                const isHovered = hoveredItem === step.id;
                const isDragged = draggedItem?.id === step.id;
                const isHidden = isDragged && draggedItem?.isHidden;
                const showOutOfBoundsIndicator = isOutOfBoundsAtStart || isOutOfBoundsAtEnd;

                return (
                  <div
                    key={step.id}
                    className="step-item absolute flex flex-col items-center"
                    style={{
                      left: `${displayPos}%`,
                      transform: 'translateX(-50%)',
                      top: '50%',
                      marginTop: '-20px',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      zIndex: isDragged ? 60 : isHovered ? 50 : 20,
                      opacity: isHidden ? 0 : 1,
                      transition: 'none'
                    }}
                    onMouseDown={(e) => handleDragStart(e, step)}
                    onMouseEnter={() => setHoveredItem(step.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => !isDragging && setSelectedItem(step)}
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
                            className="absolute w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                            style={{
                              background: 'var(--nm-background)',
                              boxShadow: isTopIcon ? '5px 5px 10px #bec3c9, -5px -5px 10px #ffffff' : 'none',
                              border: isTopIcon ? 'none' : '2px solid #d1d9e6',
                              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                              left: `${offset - 20}px`,
                              top: `${offset}px`,
                              zIndex: (step.stepTypes?.length || 1) - idx
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '5px 5px 10px #bec3c9, -5px -5px 10px #ffffff';
                              e.currentTarget.style.border = 'none';
                              e.currentTarget.style.zIndex = '100';
                            }}
                            onMouseLeave={(e) => {
                              if (!isTopIcon) {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.border = '2px solid #d1d9e6';
                              }
                              e.currentTarget.style.zIndex = (step.stepTypes?.length || 1) - idx;
                            }}
                          >
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>
                        );
                      })}
                      {showOutOfBoundsIndicator && (
                        <div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                          style={{
                            background: '#ef4444',
                            fontSize: '10px',
                            boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                            zIndex: 100
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
                        <div className={showOutOfBoundsIndicator ? 'text-red-500 text-[10px]' : 'text-gray-500 text-[10px]'}>
                          {showOutOfBoundsIndicator ? 'Prev: ' : ''}
                          {step.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
      
      {/* Edit Panel */}
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
                    options={sessionTypeOptions}
                    allowCustom={true}
                    customValue={selectedItem.customSessionType}
                    onCustomChange={(value) => updateSelectedItem('customSessionType', value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label>
                  <NeumorphicSelect
                    value={selectedItem.meetingType || 'video'}
                    onValueChange={(value) => updateSelectedItem('meetingType', value)}
                    options={meetingTypeOptions}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Platform</label>
                  <NeumorphicSelect
                    value={selectedItem.platform || 'google-meet'}
                    onValueChange={(value) => updateSelectedItem('platform', value)}
                    options={platformOptions}
                    allowCustom={true}
                    customValue={selectedItem.customPlatform}
                    onCustomChange={(value) => updateSelectedItem('customPlatform', value)}
                  />
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
                          options={stepTypeOptions}
                        />
                        {selectedItem.stepTypes.length > 1 && (
                          <button
                            onClick={() => removeStepType(type)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {selectedItem.stepTypes && selectedItem.stepTypes.length < 4 && idx === selectedItem.stepTypes.length - 1 && (
                          <NeumorphicButton
                            onClick={addStepType}
                            size="sm"
                            icon={Plus}
                          />
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
              {selectedItem.type === 'session' && selectedItem.date && selectedItem.duration && (
                <p className="text-gray-500 mt-1 text-xs">
                  End Time: {formatEndTime(selectedItem.date, selectedItem.duration)}
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
                  options={statusOptions}
                />
              </div>
            )}
            
            <div className="flex gap-3 justify-end pt-4">
              <NeumorphicButton onClick={() => deleteItem(selectedItem.id)}>
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

export default NeumorphicJourneyDesignerV6;