
import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Flag, Users, Activity, Calendar, ChevronLeft, ChevronRight, X, AlertCircle, Plus, BookOpen, CheckSquare, GraduationCap, Video, Phone, MessageSquare, Globe, Monitor, Settings, ZoomIn, ZoomOut, Repeat } from 'lucide-react';

// Import shared neumorphic components
import NeumorphicCard from './NeumorphicCard';
import NeumorphicButton from './NeumorphicButton';
import NeumorphicInput from './NeumorphicInput';
import NeumorphicSelect from './NeumorphicSelect';
import NeumorphicTextarea from './NeumorphicTextarea';
import NeumorphicDatePicker from './NeumorphicDatePicker';
import NeumorphicTimePicker from './NeumorphicTimePicker';
import NeumorphicBadge from './NeumorphicBadge';
import SelectableEditableBadge from './SelectableEditableBadge';
import NeumorphicIconBadge from './NeumorphicIconBadge';
import NeumorphicToggle from './NeumorphicToggle';

// Zoom levels configuration
const ZOOM_LEVELS = [
  { weeks: 2, label: '2 Weeks', daysPerView: 14 },
  { weeks: 4, label: '4 Weeks', daysPerView: 28 },
  { weeks: 6, label: '6 Weeks', daysPerView: 42 },
  { weeks: 8, label: '8 Weeks', daysPerView: 56 },
  { weeks: 12, label: '12 Weeks', daysPerView: 84 },
  { weeks: 20, label: '20 Weeks', daysPerView: 140 }
];

// Constants
const WEEKS_PER_VIEW = 6;

// Platform icon mapping - based on meeting type not platform
const meetingTypeIcons = {
  'in-person': Users,
  'video': Video,
  'voice': Phone,
  'text': MessageSquare
};

// Step type icon mapping
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

const NeumorphicJourneyDesignerV8 = ({
  onJourneyChange,
  startDate: initialStartDate = new Date(),
  timelineLength: initialTimelineLength = 45
}) => {
  const [sessions, setSessions] = useState([
    { id: 'start', position: 0, title: 'Start', type: 'session', isDefault: true, date: null, startTime: null, repeatSourceId: null, repeatIndex: null },
    { id: 'end', position: 100, title: 'End', type: 'session', isDefault: true, date: null, startTime: null, repeatSourceId: null, repeatIndex: null }
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
  const [journeyTitle, setJourneyTitle] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [outOfBoundsSessions, setOutOfBoundsSessions] = useState(new Set());
  const [outOfBoundsSteps, setOutOfBoundsSteps] = useState(new Set());
  const [showLeftChevron, setShowLeftChevron] = useState(false);
  const [showRightChevron, setShowRightChevron] = useState(false);
  const [dateError, setDateError] = useState('');
  const [viewTransitioning, setViewTransitioning] = useState(false);
  const [highlightedWeek, setHighlightedWeek] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [repeatConfig, setRepeatConfig] = useState({
    frequency: 'weekly',
    interval: 1,
    endCount: 4
  });
  const [panelContent, setPanelContent] = useState(null);
  const [isPanelTransitioning, setIsPanelTransitioning] = useState(false);

  const timelineRef = useRef(null);
  const stepTimelineRef = useRef(null);
  const lastClickTime = useRef(0);

  const currentZoomConfig = ZOOM_LEVELS[zoomLevel];
  const DAYS_PER_VIEW = currentZoomConfig.daysPerView;

  const totalViews = Math.ceil(timelineLength / DAYS_PER_VIEW);

  const getViewDayRange = useCallback(() => {
    const startDay = currentViewIndex * DAYS_PER_VIEW;
    const endDay = Math.min(startDay + DAYS_PER_VIEW, timelineLength);
    return { startDay, endDay };
  }, [currentViewIndex, timelineLength, DAYS_PER_VIEW]);

  const globalToViewPosition = useCallback((globalPos) => {
    const { startDay, endDay } = getViewDayRange();
    const globalDay = globalPos / 100 * timelineLength;

    if (globalDay < startDay || globalDay >= endDay) return null;
    if (endDay - startDay === 0) return null;

    const dayInView = globalDay - startDay;
    return dayInView / (endDay - startDay) * 100;
  }, [getViewDayRange, timelineLength]);

  const viewToGlobalPosition = useCallback((viewPos) => {
    const { startDay, endDay } = getViewDayRange();
    const viewDays = endDay - startDay;
    const dayInView = viewPos / 100 * viewDays;
    const globalDay = startDay + dayInView;
    return globalDay / timelineLength * 100;
  }, [getViewDayRange, timelineLength]);

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
      item.type !== 'session' && // Default sessions don't occupy a date
      item.date.toDateString() === date.toDateString()
    );
  }, [sessions, steps]);

  const getItemOnDate = useCallback((date, excludeId = null, itemType = 'session') => {
    const items = itemType === 'session' ? sessions : steps;
    return items.find((item) =>
      item.id !== excludeId &&
      item.date &&
      item.type !== 'session' &&
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
        if (afterPos >= 0 && afterPos <= 100) {
          return afterPos;
        }
      }
    }

    return position;
  }, [positionToDate, isDateOccupied, dateToPosition]);

  const updateItemPosition = useCallback((item, viewPos, currentDragView) => {
    const { startDay } = {
      startDay: currentDragView * DAYS_PER_VIEW,
      endDay: Math.min((currentDragView + 1) * DAYS_PER_VIEW, timelineLength)
    };
    const viewDays = Math.min((currentDragView + 1) * DAYS_PER_VIEW, timelineLength) - startDay;
    const dayInView = viewPos / 100 * viewDays;
    const globalDay = startDay + dayInView;
    const globalPos = globalDay / timelineLength * 100;
    const snappedPos = snapToAvailableDate(globalPos, item.id, item.type);
    
    if (item.type === 'session') {
      setSessions((prev) => prev.map((m) => 
        m.id === item.id ? { ...m, position: snappedPos, date: positionToDate(snappedPos) } : m
      ));
    } else {
      setSteps((prev) => prev.map((s) => 
        s.id === item.id ? { ...s, position: snappedPos, date: positionToDate(snappedPos) } : s
      ));
    }
    
    const newDate = positionToDate(snappedPos);
    const endDateBoundary = new Date(startDate);
    endDateBoundary.setDate(endDateBoundary.getDate() + timelineLength);
    
    const dateOnlyNewDate = new Date(newDate);
    dateOnlyNewDate.setHours(0,0,0,0);
    const dateOnlyStartDate = new Date(startDate);
    dateOnlyStartDate.setHours(0,0,0,0);
    const dateOnlyEndDateBoundary = new Date(endDateBoundary);
    dateOnlyEndDateBoundary.setHours(0,0,0,0);

    const isOutOfBounds = dateOnlyNewDate < dateOnlyStartDate || dateOnlyNewDate >= dateOnlyEndDateBoundary;
    
    if (item.type === 'session') {
      setOutOfBoundsSessions((prev) => {
        if (isOutOfBounds && !prev.has(item.id)) {
          return new Set(prev).add(item.id);
        } else if (!isOutOfBounds && prev.has(item.id)) {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        }
        return prev;
      });
    } else {
      setOutOfBoundsSteps((prev) => {
        if (isOutOfBounds && !prev.has(item.id)) {
          return new Set(prev).add(item.id);
        } else if (!isOutOfBounds && prev.has(item.id)) {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        }
        return prev;
      });
    }
  }, [DAYS_PER_VIEW, timelineLength, snapToAvailableDate, positionToDate, startDate, setSessions, setSteps, setOutOfBoundsSessions, setOutOfBoundsSteps]);

  const handleDragStart = useCallback((e, item) => {
    e.preventDefault();
    setIsDragging(true);
    setDraggedItem({ ...item, isHidden: false });
    setSelectedItem(null);
    setShowRepeatOptions(false);

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
        const { startDay } = {
          startDay: currentDragView * DAYS_PER_VIEW,
          endDay: Math.min((currentDragView + 1) * DAYS_PER_VIEW, timelineLength)
        };
        const viewDays = Math.min((currentDragView + 1) * DAYS_PER_VIEW, timelineLength) - startDay;
        const dayInView = Math.max(0, Math.min(100, relativeX * 100)) / 100 * viewDays;
        const globalDay = startDay + dayInView;
        const weekIndex = Math.floor(globalDay / 7);
        const viewWeekIndex = weekIndex - Math.floor(startDay / 7);
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
  }, [
    currentViewIndex, 
    timelineLength, 
    totalViews, 
    viewTransitioning,
    DAYS_PER_VIEW,
    updateItemPosition,
    setIsDragging, 
    setDraggedItem, 
    setSelectedItem, 
    setShowRepeatOptions, 
    setHighlightedWeek, 
    setShowLeftChevron, 
    setShowRightChevron, 
    setCurrentViewIndex, 
    setViewTransitioning 
  ]);

  const handleTimelineClick = useCallback((e) => {
    if (isDragging || e.target.closest('.session-item') || e.target.closest('.step-item')) return;
    
    if (selectedItem && selectedItem.type === 'session') {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickPos = (x / rect.width) * 100;
      const itemViewPos = globalToViewPosition(selectedItem.position);
      
      if (itemViewPos !== null && Math.abs(clickPos - itemViewPos) < 2) {
        return;
      }
    }
    
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
          setShowRepeatOptions(false);
          setDateError('');
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
          setShowRepeatOptions(false);
          setDateError('');
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
      status: 'scheduled',
      repeatSourceId: null,
      repeatIndex: null
    };
    
    setSessions([...sessions, newSession]);
    setSelectedItem(newSession);
    setShowRepeatOptions(false); 
    setDateError('');
  }, [isDragging, currentViewIndex, totalViews, sessions, outOfBoundsSessions, viewToGlobalPosition, positionToDate, snapToAvailableDate, setSessions, setSelectedItem, setShowRepeatOptions, setDateError, selectedItem, globalToViewPosition]);

  const handleStepTimelineClick = useCallback((e) => {
    if (isDragging || e.target.closest('.step-item')) return;
    
    if (selectedItem && selectedItem.type === 'step') {
      const rect = stepTimelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickPos = (x / rect.width) * 100;
      const itemViewPos = globalToViewPosition(selectedItem.position);
      
      if (itemViewPos !== null && Math.abs(clickPos - itemViewPos) < 2) {
        return;
      }
    }
    
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
          setShowRepeatOptions(false);
          setDateError('');
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
          setShowRepeatOptions(false);
          setDateError('');
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
      startTime: '09:00',
      stepTypes: ['assignment'],
      description: '',
      repeatSourceId: null,
      repeatIndex: null
    };
    
    setSteps([...steps, newStep]);
    setSelectedItem(newStep);
    setShowRepeatOptions(false);
    setDateError('');
  }, [isDragging, currentViewIndex, totalViews, steps, outOfBoundsSteps, viewToGlobalPosition, positionToDate, snapToAvailableDate, setSteps, setSelectedItem, setShowRepeatOptions, setDateError, selectedItem, globalToViewPosition]);

  const updateSelectedItem = useCallback((field, value) => {
    if (!selectedItem) return;

    let updated = { ...selectedItem };
    
    if (field === 'date') {
      updated.date = value;
      updated.position = dateToPosition(value);
    } else if (field === 'startTime') {
      updated.startTime = value;
    } else {
      updated[field] = value;
    }

    const dateForValidation = updated.date; 
    
    if (dateForValidation instanceof Date && !isNaN(dateForValidation)) {
      const endDateBoundary = new Date(startDate);
      endDateBoundary.setDate(endDateBoundary.getDate() + timelineLength);
      
      const dateOnlyForValidation = new Date(dateForValidation);
      dateOnlyForValidation.setHours(0, 0, 0, 0);
      const dateOnlyStartDate = new Date(startDate);
      dateOnlyStartDate.setHours(0, 0, 0, 0);
      const dateOnlyEndDateBoundary = new Date(endDateBoundary);
      dateOnlyEndDateBoundary.setHours(0, 0, 0, 0);

      let currentErrors = '';
      if (dateOnlyForValidation < dateOnlyStartDate || dateOnlyForValidation >= dateOnlyEndDateBoundary) {
        currentErrors = `${dateForValidation.toLocaleDateString('en-US')} is outside the current journey timeline`;
      } else {
        const occupyingItem = getItemOnDate(dateForValidation, selectedItem.id, selectedItem.type);
        if (occupyingItem) {
          currentErrors = `This date is occupied by ${occupyingItem.title}`;
        }
      }
      setDateError(currentErrors);

      const isNowInBoundsDay = dateOnlyForValidation >= dateOnlyStartDate && dateOnlyForValidation < dateOnlyEndDateBoundary;

      if (selectedItem.type === 'session') {
        setOutOfBoundsSessions((prev) => {
          if (!isNowInBoundsDay && !prev.has(selectedItem.id)) {
            return new Set(prev).add(selectedItem.id);
          } else if (isNowInBoundsDay && prev.has(selectedItem.id)) {
            const newSet = new Set(prev);
            newSet.delete(selectedItem.id);
            return newSet;
          }
          return prev;
        });
      } else if (selectedItem.type === 'step') {
        setOutOfBoundsSteps((prev) => {
          if (!isNowInBoundsDay && !prev.has(selectedItem.id)) {
            return new Set(prev).add(selectedItem.id);
          } else if (isNowInBoundsDay && prev.has(selectedItem.id)) {
            const newSet = new Set(prev);
            newSet.delete(selectedItem.id);
            return newSet;
          }
          return prev;
        });
      }
    } else {
      setDateError('');
    }

    if (selectedItem.type === 'session') {
      setSessions((prev) => prev.map((m) => m.id === selectedItem.id ? updated : m));
    } else {
      setSteps((prev) => prev.map((s) => s.id === selectedItem.id ? updated : s));
    }

    setSelectedItem(updated);
    setPanelContent(updated);
  }, [selectedItem, startDate, timelineLength, dateToPosition, getItemOnDate, setDateError, setOutOfBoundsSessions, setOutOfBoundsSteps, setSessions, setSteps, setSelectedItem, setPanelContent]);

  const addStepType = useCallback(() => {
    if (!selectedItem || selectedItem.type !== 'step') return;

    const availableTypes = ['assignment', 'activity', 'check-in', 'learning'];
    const currentStepTypes = selectedItem.stepTypes || [];
    const unusedTypes = availableTypes.filter((t) => !currentStepTypes.includes(t));

    if (unusedTypes.length > 0) {
      const updated = {
        ...selectedItem,
        stepTypes: [...currentStepTypes, unusedTypes[0]]
      };

      setSteps((prev) => prev.map((s) => s.id === selectedItem.id ? updated : s));
      setSelectedItem(updated);
      setPanelContent(updated);
    }
  }, [selectedItem, setSteps, setSelectedItem, setPanelContent]);

  const removeStepType = useCallback((typeToRemove) => {
    if (!selectedItem || selectedItem.type !== 'step') return;

    const currentStepTypes = selectedItem.stepTypes || [];
    const updated = {
      ...selectedItem,
      stepTypes: currentStepTypes.filter((t) => t !== typeToRemove)
    };

    if (updated.stepTypes.length > 0) {
      setSteps((prev) => prev.map((s) => s.id === selectedItem.id ? updated : s));
      setSelectedItem(updated);
      setPanelContent(updated);
    }
  }, [selectedItem, setSteps, setSelectedItem, setPanelContent]);

  const calculateEndTime = (date, duration, startTimeStr) => {
    if (!date || !duration) return null;
    const startDateTime = new Date(date);
    if (startTimeStr) {
      const [hours, minutes] = startTimeStr.split(':').map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);
    } else {
      startDateTime.setHours(0, 0, 0, 0);
    }
    startDateTime.setMinutes(startDateTime.getMinutes() + duration);
    return startDateTime;
  };

  const formatEndTime = (date, duration, startTimeStr) => {
    if (!date || !duration) return '';
    const endTime = calculateEndTime(date, duration, startTimeStr);
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
    setShowRepeatOptions(false);
  }, [setSessions, setSteps, setSelectedItem, setDateError, setShowRepeatOptions]);

  const getIconScale = useCallback(() => {
    const scaleFactors = [1.3, 1.1, 1, 0.9, 0.75, 0.6];
    return scaleFactors[zoomLevel];
  }, [zoomLevel]);

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
      onJourneyChange({ sessions, steps, startDate, timelineLength, journeyTitle, selectedCategories });
    }
  }, [sessions, steps, startDate, timelineLength, journeyTitle, selectedCategories, onJourneyChange]);

  useEffect(() => {
    if (isDragging) return;
    
    // Lock scroll position during transitions
    const scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.overflowY = 'scroll'; // Prevent horizontal scrollbar from appearing if content is narrow
    
    if (!selectedItem || selectedItem.isDefault) {
      if (panelContent) {
        setIsPanelTransitioning(true);
        setTimeout(() => {
          setPanelContent(null);
          setIsPanelTransitioning(false);
          // Restore scroll
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          document.body.style.overflowY = '';
          window.scrollTo(0, scrollY);
        }, 100);
      } else {
        // Restore scroll immediately if no panel
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, scrollY);
      }
    } else {
      if (selectedItem.id !== panelContent?.id) {
        setIsPanelTransitioning(true);
        setPanelContent(selectedItem);
        setTimeout(() => {
          setIsPanelTransitioning(false);
          // Restore scroll
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          document.body.style.overflowY = '';
          window.scrollTo(0, scrollY);
        }, 50);
      } else {
        setPanelContent(selectedItem);
        // Restore scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, scrollY);
      }
    }
    
    return () => {
      // Cleanup on unmount
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
    };
  }, [selectedItem, isDragging, panelContent]);

  const { startDay, endDay } = getViewDayRange();
  const actualDaysInView = endDay - startDay;
  const viewWeeks = Math.ceil(actualDaysInView / 7);
  const timelineWidthPercent = 100;

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
    { value: 'follow-up', label: 'Follow Up' },
    { value: 'custom', label: 'Custom' }
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

  const renderSteps = () => {
    const outOfBoundsAtEnd = steps.filter((s) =>
      outOfBoundsSteps.has(s.id) && s.position >= 98
    );
    
    const outOfBoundsAtStart = steps.filter((s) =>
      outOfBoundsSteps.has(s.id) && s.position === 0
    );

    const getOutOfBoundsPosition = (step) => {
      if (!outOfBoundsSteps.has(step.id)) {
        return null;
      }
      
      if (step.position === 0 && currentViewIndex === 0) {
        const index = outOfBoundsAtStart.findIndex((s) => s.id === step.id);
        if (index === -1) return null;
        const spacing = 18 / Math.max(1, outOfBoundsAtStart.length);
        return 5 + (index * spacing);
      }
      
      if (step.position >= 98 && currentViewIndex === totalViews - 1) {
        const index = outOfBoundsAtEnd.findIndex((s) => s.id === step.id);
        if (index === -1) return null;
        const spacing = 18 / Math.max(1, outOfBoundsAtEnd.length);
        return 85 + (index * spacing);
      }
      
      return null;
    };

    return steps.map((step) => {
      const viewPos = globalToViewPosition(step.position);
      const outOfBoundsPos = getOutOfBoundsPosition(step);

      const shouldUseOutOfBoundsPos = outOfBoundsPos !== null && 
        ((step.position === 0 && currentViewIndex === 0) || 
         (step.position >= 98 && currentViewIndex === totalViews - 1));

      if (viewPos === null && !shouldUseOutOfBoundsPos) return null;

      const isHovered = hoveredItem === step.id;
      const isDragged = draggedItem?.id === step.id;
      const isOutOfBounds = outOfBoundsSteps.has(step.id);
      const isHidden = isDragged && draggedItem?.isHidden;

      const displayPos = shouldUseOutOfBoundsPos ? outOfBoundsPos : viewPos;

      return (
        <div
          key={step.id}
          className="step-item absolute flex flex-col items-center"
          tabIndex={-1} // Add tabIndex to prevent keyboard focus
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
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent focus-based scrolling
            if (!isDragging) {
              handleDragStart(e, step);
            }
          }}
          onMouseEnter={() => setHoveredItem(step.id)}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={(e) => {
            if (!isDragging) {
              e.preventDefault();
              e.stopPropagation();
              
              // Prevent any focus
              if (document.activeElement) {
                document.activeElement.blur();
              }
              
              // Debounce rapid clicks
              const now = Date.now();
              if (now - lastClickTime.current < 100) return;
              lastClickTime.current = now;
              
              setSelectedItem(step);
              setShowRepeatOptions(false);
              setDateError('');
            }
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
                    left: `${offset - 20}px`,
                    top: `${offset}px`,
                    zIndex: (step.stepTypes?.length || 1) - idx
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--nm-shadow-main)';
                    e.currentTarget.style.border = 'none';
                    e.currentTarget.style.zIndex = '100';
                  }}
                  onMouseLeave={(e) => {
                    if (!isTopIcon) {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.border = '2px solid #d1d9e6';
                    }
                    e.currentTarget.style.zIndex = String((step.stepTypes?.length || 1) - idx);
                  }}
                  data-step-icon={`${step.id}-${idx}`}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                  {!step.repeatSourceId && steps.some(s => s.repeatSourceId === step.id) && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full flex items-center justify-center"
                      style={{
                        background: '#2f949d',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        border: '1px solid var(--nm-background)'
                      }}
                      title={`Original - has ${steps.filter(s => s.repeatSourceId === step.id).length} repeat(s)`}
                    >
                      <Repeat className="w-2 h-2" style={{ color: 'white' }} />
                    </div>
                  )}
                  {step.repeatSourceId && (
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full flex items-center justify-center"
                      style={{
                        background: '#6b7280',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        border: '1px solid var(--nm-background)'
                      }}
                      title={`Repeat ${step.repeatIndex || ''} from ${steps.find(s => s.id === step.repeatSourceId)?.title?.replace(/\s*\(\d+\)$/, '') || 'original'}`}
                    >
                      <Repeat className="w-2.5 h-2.5" style={{ color: 'white' }} />
                    </div>
                  )}
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
      );
    });
  };

  return (
    <NeumorphicCard className="space-y-6 overflow-visible">
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
                    
                    if (m.date < date) {
                      outOfBoundsM.add(m.id);
                      return { ...m, position: 0 };
                    }
                    
                    const daysDiff = Math.floor((m.date.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                    const newPosition = (daysDiff / timelineLength) * 100;
                    
                    if (daysDiff >= timelineLength) {
                      outOfBoundsM.add(m.id);
                      return { ...m, position: 99 };
                    }
                    
                    return { ...m, position: Math.max(0, Math.min(99, newPosition)) };
                  }));
                  
                  setSteps((prev) => prev.map((s) => {
                    if (!s.date) return s;
                    
                    if (s.date < date) {
                      outOfBoundsS.add(s.id);
                      return { ...s, position: 0 };
                    }
                    
                    const daysDiff = Math.floor((s.date.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
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
                className="text-left text-gray-700 px-4 py-3 w-full focus:outline-none focus:ring-0 focus:border-none transition-all duration-300"
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
                    
                    const newLength = parseInt(inputValue);
                    if (!isNaN(newLength) && newLength > 0 && newLength <= 999) {
                      setTimelineLength(newLength);
                      const newTotalViews = Math.ceil(newLength / DAYS_PER_VIEW);
                      if (currentViewIndex >= newTotalViews) {
                        setCurrentViewIndex(Math.max(0, newTotalViews - 1));
                      }

                      const outOfBoundsM = new Set();
                      const outOfBoundsS = new Set();

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
                  onBlur={(e) => {
                    const newLength = parseInt(timelineLengthInput);
                    if (isNaN(newLength) || newLength <= 0 || newLength > 999) {
                      setTimelineLengthInput(timelineLength.toString());
                    }
                  }}
                  placeholder="45"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (zoomLevel > 0) {
                      if (currentViewIndex === 0) {
                        setZoomLevel(zoomLevel - 1);
                        setCurrentViewIndex(0);
                      } else {
                        const currentCenterDay = currentViewIndex * DAYS_PER_VIEW + DAYS_PER_VIEW / 2;
                        const newDaysPerView = ZOOM_LEVELS[zoomLevel - 1].daysPerView;
                        const newViewIndex = Math.max(0, Math.floor(currentCenterDay / newDaysPerView));
                        setZoomLevel(zoomLevel - 1);
                        setCurrentViewIndex(newViewIndex);
                      }
                    }
                  }}
                  disabled={zoomLevel === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:opacity-70 disabled:opacity-40"
                  style={{
                    background: 'var(--nm-background)',
                    boxShadow: 'var(--nm-shadow-main)',
                    color: 'var(--nm-text-color)'
                  }}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                
                <div className="text-sm font-medium text-gray-600 min-w-[80px] text-center">
                  {currentZoomConfig.label}
                </div>
                
                <button
                  onClick={() => {
                    if (zoomLevel < ZOOM_LEVELS.length - 1) {
                      if (currentViewIndex === 0) {
                        setZoomLevel(zoomLevel + 1);
                        setCurrentViewIndex(0);
                      } else {
                        const currentCenterDay = currentViewIndex * DAYS_PER_VIEW + DAYS_PER_VIEW / 2;
                        const newDaysPerView = ZOOM_LEVELS[zoomLevel + 1].daysPerView;
                        const newViewIndex = Math.max(0, Math.floor(currentCenterDay / newDaysPerView));
                        setZoomLevel(zoomLevel + 1);
                        setCurrentViewIndex(newViewIndex);
                      }
                    }
                  }}
                  disabled={zoomLevel === ZOOM_LEVELS.length - 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:opacity-70 disabled:opacity-40"
                  style={{
                    background: 'var(--nm-background)',
                    boxShadow: 'var(--nm-shadow-main)',
                    color: 'var(--nm-text-color)'
                  }}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <NeumorphicIconBadge
              icon={Settings}
              size="md"
              variant="default"
              clickable
              onClick={() => {
                console.log('Settings clicked');
              }}
            />
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
            placeholder="Select category..."
          />
        </div>
      </div>
      
      <div className="flex justify-center items-center px-20">
        <h3 className="text-gray-700 text-base font-medium">
          Weeks {Math.floor(startDay / 7) + 1}-{Math.ceil(endDay / 7)} of {Math.ceil(timelineLength / 7)}
        </h3>
      </div>
      
      <div className="transition-opacity duration-300">
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
            
            {steps.map((step) => {
              const viewPos = globalToViewPosition(step.position);
              const outOfBoundsAtEnd = steps.filter((s) =>
                outOfBoundsSteps.has(s.id) && s.position >= 98
              );

              let displayPos = viewPos;
              if (outOfBoundsSteps.has(step.id) && step.position >= 98 && currentViewIndex === totalViews - 1) {
                const index = outOfBoundsAtEnd.findIndex((s) => s.id === step.id);
                if (index !== -1) {
                  const spacing = 13 / Math.max(1, outOfBoundsAtEnd.length);
                  displayPos = 85 + index * spacing;
                }
              }

              if (displayPos === null) return null;

              return (
                <div
                  key={`notch-${step.id}`}
                  className="absolute bottom-0 w-0.5 h-3"
                  style={{
                    left: `${displayPos}%`,
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

              const getOutOfBoundsPosition = (session) => {
                if (!outOfBoundsSessions.has(session.id)) {
                  return null;
                }
                
                if (session.position === 0 && !session.isDefault && currentViewIndex === 0) {
                  const index = outOfBoundsAtStart.findIndex((m) => m.id === session.id);
                  if (index === -1) return null;
                  const spacing = 13 / Math.max(1, outOfBoundsAtStart.length);
                  return 5 + (index * spacing);
                }
                
                if (session.position === 99 && currentViewIndex === totalViews - 1) {
                  const index = outOfBoundsAtEnd.findIndex((m) => m.id === session.id);
                  if (index === -1) return null;
                  const spacing = 13 / Math.max(1, outOfBoundsAtEnd.length);
                  return 85 + (index * spacing);
                }
                
                return null;
              };

              return sessions.map((session) => {
                const viewPos = globalToViewPosition(session.position);
                const outOfBoundsPos = getOutOfBoundsPosition(session);

                const shouldUseOutOfBoundsPos = outOfBoundsPos !== null && 
                  ((session.position === 0 && currentViewIndex === 0) || 
                   (session.position === 99 && currentViewIndex === totalViews - 1));

                if (viewPos === null && !session.isDefault && !shouldUseOutOfBoundsPos) return null;

                const isStart = session.id === 'start';
                const isEnd = session.id === 'end';
                const isHovered = hoveredItem === session.id;
                const isDragged = draggedItem?.id === session.id;
                const isOutOfBounds = outOfBoundsSessions.has(session.id);
                const isHidden = isDragged && draggedItem?.isHidden;
                const SessionIcon = getSessionIcon(session);

                let displayPos = shouldUseOutOfBoundsPos ? outOfBoundsPos : viewPos;
                if (isStart && currentViewIndex === 0) displayPos = -5;
                if (isEnd && currentViewIndex === totalViews - 1) {
                  displayPos = 105;
                }
                if (displayPos === null) return null;

                return (
                  <div
                    key={session.id}
                    className="session-item absolute flex flex-col items-center"
                    tabIndex={-1} // Add tabIndex to prevent keyboard focus
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
                    onMouseDown={session.isDefault ? undefined : (e) => {
                      e.preventDefault(); // Prevent focus-based scrolling
                      if (!isDragging) {
                        handleDragStart(e, session);
                      }
                    }}
                    onMouseEnter={() => setHoveredItem(session.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={(e) => {
                      if (!session.isDefault && !isDragging) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Prevent any focus
                        if (document.activeElement) {
                          document.activeElement.blur();
                        }
                        
                        // Debounce rapid clicks
                        const now = Date.now();
                        if (now - lastClickTime.current < 100) return;
                        lastClickTime.current = now;
                        
                        setSelectedItem(session);
                        setShowRepeatOptions(false);
                        setDateError('');
                      }
                    }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        width: `${Math.max(32, Math.min(48, 48 * getIconScale()))}px`,
                        height: `${Math.max(32, Math.min(48, 48 * getIconScale()))}px`,
                        background: 'var(--nm-background)',
                        boxShadow: 'var(--nm-shadow-main)',
                        transform: isHovered && !session.isDefault ? 'scale(1.1)' : 'scale(1)'
                      }}
                    >
                      <SessionIcon 
                        className="w-6 h-6"
                        style={{
                          color: isStart ? '#48bb78' : isEnd ? '#e53e3e' : '#2f949d',
                          fill: session.isDefault ? (isStart ? '#48bb78' : '#e53e3e') : 'none'
                        }}
                      />
                      {!session.repeatSourceId && sessions.some(s => s.repeatSourceId === session.id) && (
                        <div
                          className="absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{
                            background: '#2f949d',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            border: '1.5px solid var(--nm-background)'
                          }}
                          title={`Original - has ${sessions.filter(s => s.repeatSourceId === session.id).length} repeat(s)`}
                        >
                          <Repeat className="w-2.5 h-2.5" style={{ color: 'white' }} />
                        </div>
                      )}
                      {session.repeatSourceId && (
                        <div
                          className="absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{
                            background: '#6b7280',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                            border: '1.5px solid var(--nm-background)'
                          }}
                          title={`Repeat ${session.repeatIndex || ''} from ${sessions.find(s => s.id === session.repeatSourceId)?.title?.replace(/\s*\(\d+\)$/, '') || 'original'}`}
                        >
                          <Repeat className="w-2.5 h-2.5" style={{ color: 'white' }} />
                        </div>
                      )}
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
                          {isOutOfBounds ? 'Previously: ' : ''}
                          {session.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            })()}
          </div>
        </div>
        
        <div className="relative px-20 pb-16">
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
            {renderSteps()}
          </div>
        </div>
      </div>
      
      {/* Edit Panel - Fixed positioning to prevent scroll jumps */}
      <div style={{ 
        marginTop: '40px',
        height: panelContent ? 'auto' : '0',
        minHeight: panelContent ? '1px' : '0',
        overflow: 'hidden',
        opacity: panelContent ? '1' : '0',
        visibility: panelContent ? 'visible' : 'hidden',
        transition: 'opacity 0.2s ease',
        pointerEvents: panelContent ? 'auto' : 'none',
        position: 'relative',
        willChange: 'opacity'
      }}>
        <NeumorphicCard className="!shadow-inner-neumorphic">
          <div style={{
            opacity: isPanelTransitioning ? '0.7' : '1',
            transition: 'opacity 0.15s ease'
          }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700">
                Edit {panelContent?.type === 'session' ? 'Session' : panelContent?.type === 'step' ? 'Step' : ''}
              </h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedItem(null);
                  setDateError('');
                  setShowRepeatOptions(false);
                }}
                onMouseDown={(e) => e.preventDefault()}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {panelContent?.type === 'session' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Name</label>
                    <NeumorphicInput
                      value={panelContent?.title || ''}
                      onChange={(e) => updateSelectedItem('title', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Description</label>
                    <NeumorphicTextarea
                      value={panelContent?.description || ''}
                      onChange={(e) => updateSelectedItem('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                    <NeumorphicSelect
                      value={panelContent?.sessionType || 'coaching'}
                      onValueChange={(value) => updateSelectedItem('sessionType', value)}
                      options={sessionTypeOptions}
                    />
                    {panelContent?.sessionType === 'custom' && (
                      <div className="mt-2">
                        <NeumorphicInput
                          placeholder="Enter custom session type..."
                          value={panelContent?.customSessionType || ''}
                          onChange={(e) => updateSelectedItem('customSessionType', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label>
                    <NeumorphicSelect
                      value={panelContent?.meetingType || 'video'}
                      onValueChange={(value) => updateSelectedItem('meetingType', value)}
                      options={meetingTypeOptions}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Platform</label>
                    <NeumorphicSelect
                      value={panelContent?.platform || 'google-meet'}
                      onValueChange={(value) => updateSelectedItem('platform', value)}
                      options={platformOptions}
                    />
                    {(panelContent?.platform === 'custom' || !platformOptions.some(opt => opt.value === panelContent?.platform)) && (
                      <div className="mt-2">
                        <NeumorphicInput
                          placeholder="Enter custom platform..."
                          value={panelContent?.customPlatform || ''}
                          onChange={(e) => updateSelectedItem('customPlatform', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  
                  {(panelContent?.platform === 'google-meet' || 
                    panelContent?.platform === 'zoom' || 
                    panelContent?.platform === 'teams') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meeting URL</label>
                      <NeumorphicInput
                        value={panelContent?.meetingUrl || ''}
                        onChange={(e) => updateSelectedItem('meetingUrl', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    <NeumorphicInput
                      type="number"
                      value={panelContent?.duration || 60}
                      onChange={(e) => updateSelectedItem('duration', parseInt(e.target.value) || 60)}
                      placeholder="60"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preparation Notes</label>
                    <NeumorphicTextarea
                      value={panelContent?.preparationNotes || ''}
                      onChange={(e) => updateSelectedItem('preparationNotes', e.target.value)}
                      rows={3}
                      placeholder="Notes for preparation..."
                    />
                  </div>
                </>
              ) : panelContent?.type === 'step' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <NeumorphicInput
                      value={panelContent?.title || ''}
                      onChange={(e) => updateSelectedItem('title', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Step Types</label>
                    <div className="space-y-2">
                      {(panelContent?.stepTypes || ['assignment']).map((type, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <NeumorphicSelect
                            value={type}
                            onValueChange={(value) => {
                              const currentStepTypes = panelContent?.stepTypes || ['assignment'];
                              const newTypes = [...currentStepTypes];
                              newTypes[idx] = value;
                              updateSelectedItem('stepTypes', newTypes);
                            }}
                            options={stepTypeOptions}
                          />
                          {(panelContent?.stepTypes?.length || 0) > 1 && (
                            <button
                              onClick={() => removeStepType(type)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {panelContent?.stepTypes && (panelContent?.stepTypes.length || 0) < 4 && idx === ((panelContent?.stepTypes?.length || 1) - 1) && (
                            <button
                              onClick={addStepType}
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
                      value={panelContent?.description || ''}
                      onChange={(e) => updateSelectedItem('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              ) : null}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <NeumorphicDatePicker
                  value={panelContent?.date}
                  onChange={(date) => updateSelectedItem('date', date)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {panelContent?.type === 'session' ? 'Start Time' : 'Target Time'}
                </label>
                <NeumorphicTimePicker
                  value={panelContent?.startTime || ''}
                  onChange={(time) => updateSelectedItem('startTime', time)}
                  placeholder={panelContent?.type === 'session' ? 'Select start time...' : 'Select target time...'}
                />
                {panelContent?.type === 'session' && panelContent?.date && panelContent?.duration && (
                  <p className="text-gray-500 mt-1 text-xs">
                    End Time: {formatEndTime(panelContent?.date, panelContent?.duration, panelContent?.startTime)}
                  </p>
                )}
                {dateError && (
                  <p className="text-red-500 mt-2 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {dateError}
                  </p>
                )}
                {!dateError && panelContent?.type === 'session' && panelContent?.id && outOfBoundsSessions.has(panelContent?.id) && (
                  <p className="text-red-500 mt-2 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {panelContent?.title} is outside the journey timeline
                  </p>
                )}
                {!dateError && panelContent?.type === 'step' && panelContent?.id && outOfBoundsSteps.has(panelContent?.id) && (
                  <p className="text-red-500 mt-2 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {panelContent?.title} is outside the journey timeline
                  </p>
                )}
              </div>
              
              {panelContent?.type === 'session' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <NeumorphicSelect
                    value={panelContent?.status || 'scheduled'}
                    onValueChange={(value) => updateSelectedItem('status', value)}
                    options={statusOptions}
                  />
                </div>
              )}
              
              {panelContent?.repeatSourceId && (
                <div className="p-3 rounded-lg" style={{ background: '#e3f2fd', border: '1px solid #90caf9' }}>
                  <p className="text-sm" style={{ color: '#1976d2' }}>
                    Repeating from{' '}
                    <button
                      onClick={() => {
                        const sourceItem = panelContent?.type === 'session' 
                          ? sessions.find(s => s.id === panelContent?.repeatSourceId)
                          : steps.find(s => s.id === panelContent?.repeatSourceId);
                        if (sourceItem) {
                          setSelectedItem(sourceItem);
                          setShowRepeatOptions(false);
                        }
                      }}
                      style={{ 
                        color: '#1565c0', 
                        textDecoration: 'underline', 
                        fontWeight: '500',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#0d47a1'}
                      onMouseLeave={(e) => e.target.style.color = '#1565c0'}
                    >
                      {sessions.find(s => s.id === panelContent?.repeatSourceId)?.title?.replace(/\s*\(\d+\)$/, '') || 
                      steps.find(s => s.id === panelContent?.repeatSourceId)?.title?.replace(/\s*\(\d+\)$/, '')}
                    </button>
                  </p>
                </div>
              )}

              {!panelContent?.repeatSourceId && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Repeat</span>
                    <NeumorphicToggle
                      initialChecked={showRepeatOptions}
                      onToggle={(checked) => setShowRepeatOptions(checked)}
                    />
                  </div>
                  
                  {showRepeatOptions && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                        <NeumorphicSelect
                          value={repeatConfig.frequency}
                          onValueChange={(value) => setRepeatConfig({ ...repeatConfig, frequency: value })}
                          options={[
                            { value: 'daily', label: 'Daily' },
                            { value: 'weekly', label: 'Weekly' },
                            { value: 'monthly', label: 'Monthly' }
                          ]}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Repeat every</label>
                        <NeumorphicInput
                          type="number"
                          value={repeatConfig.interval}
                          onChange={(e) => setRepeatConfig({ ...repeatConfig, interval: parseInt(e.target.value) || 1 })}
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End after</label>
                        <NeumorphicInput
                          type="number"
                          value={repeatConfig.endCount}
                          onChange={(e) => setRepeatConfig({ ...repeatConfig, endCount: parseInt(e.target.value) || 1 })}
                          min="1"
                        />
                        <span className="text-sm text-gray-500 ml-2">occurrences</span>
                      </div>
                      
                      <NeumorphicButton 
                        variant="primary" 
                        onClick={() => {
                          if (!panelContent?.date) return;
                          
                          const repeatingDates = [];
                          const baseDate = new Date(panelContent.date);
                          
                          const timelineEndDate = new Date(startDate);
                          timelineEndDate.setDate(timelineEndDate.getDate() + timelineLength);

                          for (let i = 1; i < repeatConfig.endCount; i++) {
                            const newDate = new Date(baseDate);
                            if (repeatConfig.frequency === 'daily') {
                              newDate.setDate(newDate.getDate() + (i * repeatConfig.interval));
                            } else if (repeatConfig.frequency === 'weekly') {
                              newDate.setDate(newDate.getDate() + (i * repeatConfig.interval * 7));
                            } else if (repeatConfig.frequency === 'monthly') {
                              newDate.setMonth(newDate.getMonth() + (i * repeatConfig.interval));
                            }
                            
                            const dateOnlyNewDate = new Date(newDate);
                            dateOnlyNewDate.setHours(0,0,0,0);
                            const dateOnlyStartDate = new Date(startDate);
                            dateOnlyStartDate.setHours(0,0,0,0);
                            const dateOnlyTimelineEndDate = new Date(timelineEndDate);
                            dateOnlyTimelineEndDate.setHours(0,0,0,0);

                            if (dateOnlyNewDate >= dateOnlyStartDate && dateOnlyNewDate < dateOnlyTimelineEndDate) {
                              if (!isDateOccupied(newDate, null, panelContent?.type)) {
                                repeatingDates.push(newDate);
                              }
                            }
                          }
                          
                          if (panelContent?.type === 'session') {
                            const newSessions = repeatingDates.map((date, index) => ({
                              ...panelContent,
                              id: `s-${Date.now()}-${index + 1}`,
                              date: date,
                              position: dateToPosition(date),
                              title: `${panelContent.title} (${index + 2})`,
                              isDefault: false,
                              repeatSourceId: panelContent.id,
                              repeatIndex: index + 2,
                              customSessionType: panelContent.sessionType === 'custom' ? panelContent.customSessionType : undefined,
                              customPlatform: panelContent.platform === 'custom' ? panelContent.customPlatform : undefined,
                              startTime: panelContent.startTime,
                            }));
                            
                            setSessions(prev => [...prev, ...newSessions]);
                          } else if (panelContent?.type === 'step') {
                              const newSteps = repeatingDates.map((date, index) => ({
                              ...panelContent,
                              id: `st-${Date.now()}-${index + 1}`,
                              date: date,
                              position: dateToPosition(date),
                              title: `${panelContent.title} (${index + 2})`,
                              repeatSourceId: panelContent.id,
                              repeatIndex: index + 2,
                              startTime: panelContent.startTime,
                              stepTypes: panelContent.stepTypes || ['assignment'],
                            }));
                            
                            setSteps(prev => [...prev, ...newSteps]);
                          }
                          
                          setShowRepeatOptions(false);
                        }}
                      >
                        Apply Repeat
                      </NeumorphicButton>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-3 justify-end pt-4">
                <NeumorphicButton onClick={() => panelContent?.id && deleteItem(panelContent.id)}>
                  Delete
                </NeumorphicButton>
                <NeumorphicButton
                  variant="primary"
                  onClick={() => {
                    setSelectedItem(null);
                    setDateError('');
                    setShowRepeatOptions(false);
                  }}
                  disabled={!!dateError}
                >
                  Save
                </NeumorphicButton>
              </div>
            </div>
          </div>
        </NeumorphicCard>
      </div>
    </NeumorphicCard>
  );
};

export default NeumorphicJourneyDesignerV8;
