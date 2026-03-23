
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Flag, Activity, Calendar, ChevronLeft, ChevronRight, X, AlertCircle, Plus, BookOpen, Users, CheckSquare, GraduationCap } from 'lucide-react';
import NeumorphicCard from './NeumorphicCard';
import NeumorphicButton from './NeumorphicButton';
import NeumorphicInput from './NeumorphicInput';
import NeumorphicSelect from './NeumorphicSelect';
import NeumorphicTextarea from './NeumorphicTextarea';
import NeumorphicDatePicker from './NeumorphicDatePicker';

// Constants
const WEEKS_PER_VIEW = 6;
const DAYS_PER_VIEW = WEEKS_PER_VIEW * 7;

// Step type icon mapping
const stepTypeIcons = {
  session: Users,
  assignment: BookOpen,
  activity: Activity,
  'check-in': CheckSquare,
  learning: GraduationCap
};

const stepTypeColors = {
  session: '#3b82f6',
  assignment: '#10b981',
  activity: '#f59e0b',
  'check-in': '#8b5cf6',
  learning: '#ec4899'
};

const NeumorphicJourneyDesignerV5 = ({
  onJourneyChange,
  startDate: initialStartDate = new Date(),
  timelineLength: initialTimelineLength = 45
}) => {
  const [milestones, setMilestones] = useState([
    { id: 'start', position: 0, title: 'Start', type: 'milestone', isDefault: true, date: null },
    { id: 'end', position: 100, title: 'End', type: 'milestone', isDefault: true, date: null }
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
  const [outOfBoundsMilestones, setOutOfBoundsMilestones] = useState(new Set());
  const [outOfBoundsSteps, setOutOfBoundsSteps] = useState(new Set());
  const [showLeftChevron, setShowLeftChevron] = useState(false);
  const [showRightChevron, setShowRightChevron] = useState(false);
  const [dateError, setDateError] = useState('');
  const [viewTransitioning, setViewTransitioning] = useState(false);
  const [highlightedWeek, setHighlightedWeek] = useState(null);

  const timelineRef = useRef(null);
  const stepTimelineRef = useRef(null);

  const totalViews = Math.ceil(timelineLength / DAYS_PER_VIEW);

  // Calculate which days are visible in current view
  const getViewDayRange = useCallback(() => {
    const startDay = currentViewIndex * DAYS_PER_VIEW;
    const endDay = Math.min(startDay + DAYS_PER_VIEW, timelineLength);
    return { startDay, endDay };
  }, [currentViewIndex, timelineLength]);

  // Convert between global position and view position
  const globalToViewPosition = useCallback((globalPos) => {
    const { startDay, endDay } = getViewDayRange();
    const globalDay = globalPos / 100 * timelineLength;

    if (globalDay < startDay || globalDay >= endDay) return null; // Use >= endDay to properly bound the view

    const viewDays = endDay - startDay;
    if (viewDays <= 0) return null; // Avoid division by zero for empty views

    const dayInView = globalDay - startDay;
    return dayInView / viewDays * 100;
  }, [getViewDayRange, timelineLength]);

  const viewToGlobalPosition = useCallback((viewPos) => {
    const { startDay, endDay } = getViewDayRange();
    const viewDays = endDay - startDay;
    const dayInView = viewPos / 100 * viewDays;
    const globalDay = startDay + dayInView;
    return globalDay / timelineLength * 100;
  }, [getViewDayRange, timelineLength]);

  // Position to date conversion
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

  // Check if a date is occupied
  const isDateOccupied = useCallback((date, excludeId = null, itemType = 'milestone') => {
    const items = itemType === 'milestone' ? milestones : steps;
    return items.some((item) =>
      item.id !== excludeId &&
      item.date &&
      !item.isDefault &&
      item.date.toDateString() === date.toDateString()
    );
  }, [milestones, steps]);

  // Find item on date
  const getItemOnDate = useCallback((date, excludeId = null, itemType = 'milestone') => {
    const items = itemType === 'milestone' ? milestones : steps;
    return items.find((item) =>
      item.id !== excludeId &&
      item.date &&
      !item.isDefault &&
      item.date.toDateString() === date.toDateString()
    );
  }, [milestones, steps]);

  // Snap to available date
  const snapToAvailableDate = useCallback((position, itemId, itemType = 'milestone') => {
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

  // Handle timeline click
  const handleTimelineClick = useCallback((e) => {
    if (isDragging || e.target.closest('.milestone-item') || e.target.closest('.step-item')) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPos = (x / rect.width) * 100;
    
    if (currentViewIndex === 0) {
      const outOfBoundsAtStart = milestones.filter((m) =>
        outOfBoundsMilestones.has(m.id) && m.position === 0 && !m.isDefault
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
      const outOfBoundsAtEnd = milestones.filter((m) =>
        outOfBoundsMilestones.has(m.id) && m.position === 99
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
    const snappedPos = snapToAvailableDate(globalPos, null, 'milestone');
    
    const newMilestone = {
      id: `m-${Date.now()}`,
      position: snappedPos,
      title: `Milestone ${milestones.filter((m) => !m.isDefault).length + 1}`,
      type: 'milestone',
      isDefault: false,
      date: positionToDate(snappedPos),
      description: ''
    };
    
    setMilestones([...milestones, newMilestone]);
    setSelectedItem(newMilestone);
  }, [isDragging, currentViewIndex, totalViews, milestones, outOfBoundsMilestones, viewToGlobalPosition, positionToDate, snapToAvailableDate]);

  // Handle step timeline click
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
      id: `s-${Date.now()}`,
      position: snappedPos,
      title: `Step ${steps.length + 1}`,
      type: 'step',
      date: positionToDate(snappedPos),
      stepTypes: ['session'],
      description: ''
    };
    
    setSteps([...steps, newStep]);
    setSelectedItem(newStep);
  }, [isDragging, currentViewIndex, totalViews, steps, outOfBoundsSteps, viewToGlobalPosition, positionToDate, snapToAvailableDate]);

  // Drag handling
  const handleDragStart = useCallback((e, item) => {
    e.preventDefault();
    setIsDragging(true);
    setDraggedItem({ ...item, isHidden: false });

    let currentDragView = currentViewIndex;
    let viewTransitionTimer = null;

    const handleMouseMove = (moveEvent) => {
      if (viewTransitioning) return;

      const timelineEl = item.type === 'milestone' ? timelineRef.current : stepTimelineRef.current;
      if (!timelineEl) return;

      const rect = timelineEl.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const viewWidth = rect.width;
      const relativeX = x / viewWidth;

      if (item.type === 'milestone') {
        const viewPos = Math.max(0, Math.min(100, relativeX * 100));
        const { startDay, endDay } = {
          startDay: currentDragView * DAYS_PER_VIEW,
          endDay: Math.min((currentDragView + 1) * DAYS_PER_VIEW, timelineLength)
        };
        const viewDays = endDay - startDay;
        const globalDay = startDay + (viewPos / 100 * viewDays);
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

    const updateItemPosition = (item, viewPos, viewIndex) => {
      const { startDay, endDay } = {
        startDay: viewIndex * DAYS_PER_VIEW,
        endDay: Math.min((viewIndex + 1) * DAYS_PER_VIEW, timelineLength)
      };
      const viewDays = endDay - startDay;
      const globalDay = startDay + (viewPos / 100 * viewDays);
      const globalPos = globalDay / timelineLength * 100;

      const finalPos = snapToAvailableDate(globalPos, item.id, item.type);
      const newDate = positionToDate(finalPos);

      const journeyEndDate = new Date(startDate);
      journeyEndDate.setDate(journeyEndDate.getDate() + timelineLength);
      const isNowInBounds = newDate >= startDate && newDate < journeyEndDate;

      if (item.type === 'milestone') {
        setMilestones((prev) => prev.map((m) =>
          m.id === item.id ?
          { ...m, position: finalPos, date: newDate } :
          m
        ));
        
        if (isNowInBounds && outOfBoundsMilestones.has(item.id)) {
          setOutOfBoundsMilestones((prev) => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        }
      } else {
        setSteps((prev) => prev.map((s) =>
          s.id === item.id ?
          { ...s, position: finalPos, date: newDate } :
          s
        ));
        
        if (isNowInBounds && outOfBoundsSteps.has(item.id)) {
          setOutOfBoundsSteps((prev) => {
            const newSet = new Set(prev);
            newSet.delete(item.id); // Fixed: Changed 's.id' to 'item.id'
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
  }, [currentViewIndex, totalViews, timelineLength, startDate, positionToDate, outOfBoundsMilestones, outOfBoundsSteps, snapToAvailableDate, viewTransitioning, selectedItem]);

  // Update selected item
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
      
      if (selectedItem.type === 'milestone' && outOfBoundsMilestones.has(selectedItem.id)) {
        setOutOfBoundsMilestones((prev) => {
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

    if (selectedItem.type === 'milestone') {
      setMilestones((prev) => prev.map((m) => m.id === selectedItem.id ? updated : m));
    } else {
      setSteps((prev) => prev.map((s) => s.id === selectedItem.id ? updated : s));
    }

    setSelectedItem(updated);
  }, [selectedItem, startDate, timelineLength, dateToPosition, outOfBoundsMilestones, outOfBoundsSteps, getItemOnDate]);

  // Add step type
  const addStepType = useCallback(() => {
    if (!selectedItem || selectedItem.type !== 'step') return;

    const availableTypes = ['session', 'assignment', 'activity', 'check-in', 'learning'];
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

  // Remove step type
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

  // Delete item
  const deleteItem = useCallback((id) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    setSteps((prev) => prev.filter((s) => s.id !== id));
    setSelectedItem(null);
    setDateError('');
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onJourneyChange) {
      onJourneyChange({ milestones, steps, startDate, timelineLength });
    }
  }, [milestones, steps, startDate, timelineLength, onJourneyChange]);

  const { startDay, endDay } = getViewDayRange();
  const actualDaysInView = endDay - startDay;
  const viewWeeks = Math.ceil(actualDaysInView / 7);
  const isPartialView = viewWeeks < WEEKS_PER_VIEW;
  const timelineWidthPercent = isPartialView ? (viewWeeks / WEEKS_PER_VIEW * 100) : 100;

  const stepTypeOptions = [
    { value: 'session', label: 'Session' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'activity', label: 'Activity' },
    { value: 'check-in', label: 'Check-in' },
    { value: 'learning', label: 'Learning' }
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
              onChange={(date) => { // 'date' here is the NEW start date
                setStartDate(date);
                
                const outOfBoundsM = new Set();
                const outOfBoundsS = new Set();
                
                setMilestones((prev) => prev.map((m) => {
                  if (m.isDefault || !m.date) return m;
                  
                  const daysDiff = Math.floor((m.date.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)); // Uses the NEW 'date' parameter
                  
                  if (daysDiff < 0) { // Milestone is before the new journey startDate
                    outOfBoundsM.add(m.id);
                    return { ...m, position: 0 };
                  } else if (daysDiff >= timelineLength) { // Milestone is after the journey endDate (timelineLength is current state value)
                    outOfBoundsM.add(m.id);
                    return { ...m, position: 99 };
                  } else { // Milestone is within the new journey duration
                    const newPosition = daysDiff / timelineLength * 100;
                    return { ...m, position: Math.max(0, Math.min(99, newPosition)) };
                  }
                }));
                
                setSteps((prev) => prev.map((s) => {
                  if (!s.date) return s;
                  
                  const daysDiff = Math.floor((s.date.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)); // Uses the NEW 'date' parameter
                  
                  if (daysDiff < 0) { // Step is before the new journey startDate
                    outOfBoundsS.add(s.id);
                    return { ...s, position: 0 };
                  } else if (daysDiff >= timelineLength) { // Step is after the journey endDate (timelineLength is current state value)
                    outOfBoundsS.add(s.id);
                    return { ...s, position: 98 };
                  } else { // Step is within the new journey duration
                    const newPosition = daysDiff / timelineLength * 100;
                    return { ...s, position: Math.max(0, Math.min(98, newPosition)) };
                  }
                }));
                
                setOutOfBoundsMilestones(outOfBoundsM);
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

                    // Recalculate milestone positions
                    setMilestones((prev) => prev.map((m) => {
                      if (m.isDefault || !m.date) return m;
                      
                      const daysDiff = Math.floor((m.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // Uses current state variable startDate

                      if (daysDiff < 0) { // Milestone is before the current journey startDate
                        outOfBoundsM.add(m.id);
                        return { ...m, position: 0 };
                      } else if (daysDiff >= newLength) { // Milestone is after the new journey endDate
                        outOfBoundsM.add(m.id);
                        return { ...m, position: 99 };
                      } else { // Milestone is within the new journey duration
                        const newPosition = daysDiff / newLength * 100;
                        return { ...m, position: Math.max(0, Math.min(99, newPosition)) };
                      }
                    }));

                    // Recalculate step positions  
                    setSteps((prev) => prev.map((s) => {
                      if (!s.date) return s;
                      
                      const daysDiff = Math.floor((s.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // Uses current state variable startDate

                      if (daysDiff < 0) { // Step is before the current journey startDate
                        outOfBoundsS.add(s.id);
                        return { ...s, position: 0 };
                      } else if (daysDiff >= newLength) { // Step is after the new journey endDate
                        outOfBoundsS.add(s.id);
                        return { ...s, position: 98 };
                      } else { // Step is within the new journey duration
                        const newPosition = daysDiff / newLength * 100;
                        return { ...s, position: Math.max(0, Math.min(98, newPosition)) };
                      }
                    }));

                    setOutOfBoundsMilestones(outOfBoundsM);
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
        {/* Milestone Timeline */}
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
          
          {showLeftChevron && draggedItem?.type === 'milestone' && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-60">
              <ChevronLeft className="w-10 h-10 text-gray-400 animate-pulse" />
            </div>
          )}
          {showRightChevron && draggedItem?.type === 'milestone' && (
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
              // This is a notch for steps, not the step item itself.
              // This is also a simple notch for steps, which does not require complex out-of-bounds positioning beyond basic visibility.
              const viewPos = globalToViewPosition(step.position);
              
              if (outOfBoundsSteps.has(step.id) && step.position === 0 && currentViewIndex === 0) {
                // Notches for steps that are out of bounds at the start
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
                // Notches for steps that are out of bounds at the end
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

              if (viewPos === null) return null; // If not in current view, don't show the notch

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
              const outOfBoundsMilestonesAtStart = milestones.filter((m) =>
                outOfBoundsMilestones.has(m.id) && m.position === 0 && !m.isDefault
              );
              
              const outOfBoundsMilestonesAtEnd = milestones.filter((m) =>
                outOfBoundsMilestones.has(m.id) && m.position === 99
              );

              return milestones.map((milestone) => {
                let displayPos = globalToViewPosition(milestone.position);

                const isOutOfBoundsAtStart = outOfBoundsMilestones.has(milestone.id) && milestone.position === 0 && !milestone.isDefault;
                const isOutOfBoundsAtEnd = outOfBoundsMilestones.has(milestone.id) && milestone.position === 99;

                if (isOutOfBoundsAtStart && currentViewIndex === 0) {
                  const index = outOfBoundsMilestonesAtStart.findIndex((m) => m.id === milestone.id);
                  const spacing = 13 / Math.max(1, outOfBoundsMilestonesAtStart.length);
                  displayPos = 5 + index * spacing;
                } else if (isOutOfBoundsAtEnd && currentViewIndex === totalViews - 1) {
                  const index = outOfBoundsMilestonesAtEnd.findIndex((m) => m.id === milestone.id);
                  const spacing = 13 / Math.max(1, outOfBoundsMilestonesAtEnd.length);
                  displayPos = 85 + index * spacing;
                } else if (displayPos === null && !milestone.isDefault) {
                  return null; // Don't render if not in view and not an explicitly positioned out-of-bounds item
                }
                
                // Handle default start/end milestones which are positioned outside 0-100%
                if (milestone.id === 'start' && currentViewIndex === 0) displayPos = -5;
                if (milestone.id === 'end' && currentViewIndex === totalViews - 1) {
                  // Ensure default end milestone is always shown at the end of the last view.
                  // Its global position is 100, which usually renders it out of view.
                  displayPos = 105;
                }
                
                // If displayPos is still null after all checks, it means it's genuinely not to be displayed.
                if (displayPos === null) return null;

                const isStart = milestone.id === 'start';
                const isEnd = milestone.id === 'end';
                const isHovered = hoveredItem === milestone.id;
                const isDragged = draggedItem?.id === milestone.id;
                const isHidden = isDragged && draggedItem?.isHidden;
                const showOutOfBoundsIndicator = isOutOfBoundsAtStart || isOutOfBoundsAtEnd;


                return (
                  <div
                    key={milestone.id}
                    className="milestone-item absolute flex flex-col items-center"
                    style={{
                      left: `${displayPos}%`,
                      transform: 'translateX(-50%)',
                      top: '50%',
                      marginTop: '-24px',
                      cursor: milestone.isDefault ? 'default' : isDragging ? 'grabbing' : 'grab',
                      zIndex: isDragged ? 60 : isHovered ? 50 : 10,
                      opacity: isHidden ? 0 : 1,
                      transition: 'none'
                    }}
                    onMouseDown={milestone.isDefault ? undefined : (e) => handleDragStart(e, milestone)}
                    onMouseEnter={() => setHoveredItem(milestone.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => !milestone.isDefault && !isDragging && setSelectedItem(milestone)}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        background: 'var(--nm-background)',
                        boxShadow: 'var(--nm-shadow-main)',
                        transform: isHovered && !milestone.isDefault ? 'scale(1.1)' : 'scale(1)'
                      }}
                    >
                      <Flag
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
                          title="Milestone date is outside timeline range"
                        >
                          !
                        </div>
                      )}
                    </div>
                    <div
                      className="mt-2 text-xs font-medium text-center rounded"
                      style={{
                        background: milestone.isDefault ? 'transparent' : 'var(--nm-background)',
                        boxShadow: milestone.isDefault ? 'none' : 'var(--nm-shadow-main)',
                        padding: milestone.isDefault ? '0' : '4px 8px',
                        minWidth: milestone.isDefault ? 'auto' : '80px'
                      }}
                    >
                      <div>{milestone.title}</div>
                      {milestone.date && (
                        <div className={showOutOfBoundsIndicator ? 'text-red-500' : 'text-gray-500'}>
                          {showOutOfBoundsIndicator ? 'Previously: ' : ''}
                          {milestone.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                  return null; // Don't render if not in view and not an explicitly positioned out-of-bounds item
                }
                
                // If displayPos is still null after all checks, it means it's genuinely not to be displayed.
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
                      {(step.stepTypes || ['session']).map((type, idx) => {
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
                            data-step-icon={`${step.id}-${idx}`}
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
              Edit {selectedItem.type === 'milestone' ? 'Milestone' : 'Step'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <NeumorphicInput
                value={selectedItem.title}
                onChange={(e) => updateSelectedItem('title', e.target.value)}
              />
            </div>
            
            {selectedItem.type === 'step' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Step Types</label>
                <div className="space-y-2">
                  {(selectedItem.stepTypes || ['session']).map((type, idx) => (
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
                      {selectedItem.stepTypes && selectedItem.stepTypes.length < 5 && idx === selectedItem.stepTypes.length - 1 && (
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
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <NeumorphicDatePicker
                value={selectedItem.date}
                onChange={(date) => updateSelectedItem('date', date)}
              />
              {dateError && (
                <p className="text-red-500 mt-2 text-sm flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {dateError}
                </p>
              )}
              {!dateError && selectedItem.type === 'milestone' && outOfBoundsMilestones.has(selectedItem.id) && (
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <NeumorphicTextarea
                value={selectedItem.description || ''}
                onChange={(e) => updateSelectedItem('description', e.target.value)}
                rows={3}
              />
            </div>
            
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

export default NeumorphicJourneyDesignerV5;
