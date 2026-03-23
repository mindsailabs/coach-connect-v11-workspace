
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Activity, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import NeumorphicCard from './NeumorphicCard';
import NeumorphicButton from './NeumorphicButton';
import NeumorphicInput from './NeumorphicInput';
import NeumorphicSelect from './NeumorphicSelect';
import NeumorphicDatePicker from './NeumorphicDatePicker';

const NeumorphicJourneyDesignerV3 = ({
  onJourneyChange,
  startDate = new Date(),
  timelineLength = 45
}) => {
  const VIEW_MIN = 0;
  const VIEW_MAX = 99.5; // To prevent viewPosition 100% from causing wrap-around to next view

  const [milestones, setMilestones] = useState([
    { id: 'start', position: 0, title: 'Start', type: 'milestone', isDefault: true, date: null, description: '' },
    { id: 'end', position: 100, title: 'End', type: 'milestone', isDefault: true, date: null, description: '' }
  ]);

  const [steps, setSteps] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null); // { item: originalItem, originalPosition: pos, originalDate: date }
  const [dragPosition, setDragPosition] = useState(null); // View position during drag (0-100% relative to current view)
  const [dragViewIndex, setDragViewIndex] = useState(null); // The view index the item is currently being dragged into
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredMilestoneId, setHoveredMilestoneId] = useState(null);
  const [justFinishedDrag, setJustFinishedDrag] = useState(false);
  // targetViewRef removed as dragViewIndex state now explicitly tracks target view
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  const [startDateState, setStartDateState] = useState(startDate);
  const [timelineLenState, setTimelineLenState] = useState(timelineLength);
  const [scrollDirection, setScrollDirection] = useState(null);


  const milestoneTimelineRef = useRef(null);
  const stepTimelineRef = useRef(null);
  const draggedItemRef = useRef(null); // Add ref to track dragged item without stale closure issues
  const lastDragRef = useRef(null); // Add ref to store the last valid drag position and view index
  const scrollingRef = useRef(false);
  const rafIdRef = useRef(null);

  const weeksPerView = 6;
  const totalViews = Math.ceil(timelineLenState / 7 / weeksPerView);

  // Helper function to validate dates
  const isValidDate = useCallback((d) => d instanceof Date && !isNaN(d.getTime()), []);

  // Call onJourneyChange when milestones or steps change
  useEffect(() => {
    if (onJourneyChange) {
      onJourneyChange({
        milestones,
        steps,
        startDate: startDateState,
        timelineLength: timelineLenState
      });
    }
  }, [milestones, steps, startDateState, timelineLenState, onJourneyChange]);

  const getCurrentViewWeeks = useCallback(() => {
    const startWeek = currentViewIndex * weeksPerView;
    const endWeek = Math.min(startWeek + weeksPerView, Math.ceil(timelineLenState / 7));
    return { startWeek, endWeek };
  }, [currentViewIndex, weeksPerView, timelineLenState]);

  const getViewStartDay = useCallback(() => {
    return currentViewIndex * weeksPerView * 7;
  }, [currentViewIndex, weeksPerView]);

  const getViewEndDay = useCallback(() => {
    const viewStartDay = getViewStartDay();
    return Math.min(viewStartDay + (weeksPerView * 7), timelineLenState);
  }, [getViewStartDay, weeksPerView, timelineLenState]);

  const isStartFlagVisible = useCallback(() => {
    return currentViewIndex === 0;
  }, [currentViewIndex]);

  const isEndFlagVisible = useCallback(() => {
    const viewEndDay = getViewEndDay();
    // The "End" flag is visible if the current view block either contains the timeline end
    // or is the last possible block that could contain the timeline end.
    // It's 100% if timelineLenState is 0.
    return viewEndDay >= timelineLenState || currentViewIndex === totalViews - 1;
  }, [getViewEndDay, timelineLenState, currentViewIndex, totalViews]);

  const convertGlobalPositionToViewPosition = useCallback((globalPosition, activeViewIndex = currentViewIndex) => {
    const globalPosDays = (globalPosition / 100) * timelineLenState;
    const daysPerView = weeksPerView * 7;
    const globalViewStartDays = activeViewIndex * daysPerView;
    const globalViewEndDays = globalViewStartDays + daysPerView;
    
    // Strict boundary check - milestone must be within the view's date range
    if (globalPosDays < globalViewStartDays || globalPosDays >= globalViewEndDays) {
      return null;
    }
    
    const relativePositionDays = globalPosDays - globalViewStartDays;
    let pct = (relativePositionDays / daysPerView) * 100;
    
    // Avoid returning 100 which we treat as the next view's start.
    // Clamping to VIEW_MAX (99.5) for display within the current view.
    if (pct > VIEW_MAX) pct = VIEW_MAX;
    
    return Math.max(VIEW_MIN, Math.min(100, pct)); // Clamp to 100 for percentage calculation, but allow VIEW_MAX to be the max actual render position
  }, [currentViewIndex, timelineLenState, weeksPerView, VIEW_MIN, VIEW_MAX]);

  const convertViewPositionToGlobalPosition = useCallback((viewPosition, viewIndexOverride) => {
    const activeViewIndex = viewIndexOverride !== undefined ? viewIndexOverride : currentViewIndex;

    // Clamp viewPosition to avoid values outside expected range (0-99.5)
    const vp = Math.max(VIEW_MIN, Math.min(VIEW_MAX, viewPosition));

    const totalDaysInViewBlock = weeksPerView * 7; // Fixed size of a view block
    if (totalDaysInViewBlock === 0) return 0; // Prevent division by zero

    const relativeDaysInView = (vp / 100) * totalDaysInViewBlock;
    const globalDays = (activeViewIndex * weeksPerView * 7) + relativeDaysInView;
    
    const globalPosition = (globalDays / timelineLenState) * 100;
    return Math.max(0, Math.min(100, globalPosition));
  }, [currentViewIndex, weeksPerView, timelineLenState, VIEW_MIN, VIEW_MAX]);

  const getViewIndexFromGlobalPosition = useCallback((globalPosition) => {
    const globalDays = (globalPosition / 100) * timelineLenState;
    const daysPerView = weeksPerView * 7;
    if (daysPerView === 0) return 0;
    let calculatedViewIndex = Math.floor(globalDays / daysPerView);
    return Math.max(0, Math.min(totalViews - 1, calculatedViewIndex));
  }, [timelineLenState, weeksPerView, totalViews]);

  const constrainPosition = useCallback((globalPosition, itemId) => {
    const globalBoundaryBuffer = 1; 
    let constrainedGlobalPosition = Math.max(globalBoundaryBuffer, Math.min(100 - globalBoundaryBuffer, globalPosition));

    // Use dragViewIndex if dragging, otherwise currentViewIndex
    const activeViewIdx = isDragging && dragViewIndex !== null ? dragViewIndex : currentViewIndex;

    const viewStartDay = activeViewIdx * weeksPerView * 7;
    const viewEndDay = Math.min(viewStartDay + (weeksPerView * 7), timelineLenState);
    const actualViewDays = viewEndDay - viewStartDay;

    const minDayGapViewPercentage = actualViewDays > 0 ? (1 / actualViewDays) * 100 : 0;

    let draggedItemViewPosition = convertGlobalPositionToViewPosition(constrainedGlobalPosition, activeViewIdx);

    if (draggedItemViewPosition === null) {
      // This means the globalPosition itself, even if constrained, falls outside the active view window
      // Revert to initial global position, or just return the constrained global position which might be out of view
      // For now, let's return the global position, assuming it will be handled by filtering on render.
      return constrainedGlobalPosition;
    }

    const otherItemsInView = [...milestones, ...steps].filter(item => {
      if (item.id === itemId || item.isDefault) return false;
      const itemViewPos = convertGlobalPositionToViewPosition(item.position, activeViewIdx);
      return itemViewPos !== null;
    }).map(item => ({
      ...item,
      viewPosition: convertGlobalPositionToViewPosition(item.position, activeViewIdx)
    }));

    for (const item of otherItemsInView) {
      if (Math.abs(draggedItemViewPosition - item.viewPosition) < minDayGapViewPercentage) {
        if (draggedItemViewPosition < item.viewPosition) {
          draggedItemViewPosition = Math.max(VIEW_MIN, item.viewPosition - minDayGapViewPercentage);
        } else {
          draggedItemViewPosition = Math.min(VIEW_MAX, item.viewPosition + minDayGapViewPercentage);
        }
      }
    }

    let finalGlobalPosition = convertViewPositionToGlobalPosition(draggedItemViewPosition, activeViewIdx);
    finalGlobalPosition = Math.max(globalBoundaryBuffer, Math.min(100 - globalBoundaryBuffer, finalGlobalPosition));

    return finalGlobalPosition;

  }, [
    milestones,
    convertGlobalPositionToViewPosition,
    convertViewPositionToGlobalPosition,
    currentViewIndex,
    weeksPerView,
    timelineLenState,
    isDragging,
    VIEW_MIN, VIEW_MAX
  ]);

  const addMilestone = useCallback((viewPosition) => {
    const globalPosition = convertViewPositionToGlobalPosition(viewPosition);
    const constrainedGlobalPos = constrainPosition(globalPosition, `milestone-${Date.now()}`);

    const dayFromStart = Math.round((constrainedGlobalPos / 100) * timelineLenState);
    const milestoneDate = new Date(startDateState);
    milestoneDate.setDate(milestoneDate.getDate() + dayFromStart);

    setMilestones(prev => {
      const conflictingMilestone = prev.find(m =>
        m.id !== 'start' && m.id !== 'end' &&
        isValidDate(m.date) && isValidDate(milestoneDate) &&
        m.date.toDateString() === milestoneDate.toDateString()
      );

      if (conflictingMilestone) {
        alert('A milestone already exists on this date. Please choose a different date.');
        return prev;
      }

      const newMilestone = {
        id: `milestone-${Date.now()}`,
        position: constrainedGlobalPos,
        title: `Milestone ${prev.filter(m => !m.isDefault).length + 1}`,
        type: 'milestone',
        isDefault: false,
        date: milestoneDate,
        description: ''
      };

      setSelectedItem(newMilestone);
      return [...prev, newMilestone];
    });
  }, [convertViewPositionToGlobalPosition, constrainPosition, timelineLenState, startDateState, setSelectedItem, isValidDate]);

  const addStep = useCallback((viewPosition) => {
    const globalPosition = convertViewPositionToGlobalPosition(viewPosition);
    const constrainedGlobalPos = constrainPosition(globalPosition, `step-${Date.now()}`);

    setSteps(prev => {
      const newStep = {
        id: `step-${Date.now()}`,
        position: constrainedGlobalPos,
        title: `Step ${prev.length + 1}`,
        type: 'step'
      };
      return [...prev, newStep];
    });
  }, [convertViewPositionToGlobalPosition, constrainPosition]);

  const updateItemTitle = useCallback((itemId, newTitle) => {
    setMilestones(prev => prev.map(item =>
      item.id === itemId ? { ...item, title: newTitle } : item
    ));
    setSteps(prev => prev.map(item =>
      item.id === itemId ? { ...item, title: newTitle } : item
    ));
    setSelectedItem(prev => (prev && prev.id === itemId) ? { ...prev, title: newTitle } : prev);
  }, []);

  const deleteItem = useCallback((itemId) => {
    const itemToDelete = [...milestones, ...steps].find(item => item.id === itemId);
    if (itemToDelete?.isDefault) return;

    const updatedMilestones = milestones.filter(m => m.id !== itemId);
    const updatedSteps = steps.filter(s => s.id !== itemId);

    setMilestones(updatedMilestones);
    setSteps(updatedSteps);
    setSelectedItem(null);
  }, [milestones, steps]);

  // Handler for updating selected item properties in the edit panel
  const updateSelectedItem = useCallback((field, value) => {
    if (!selectedItem) return;

    let updatedItem = { ...selectedItem };
    let newPosition = updatedItem.position;

    if (selectedItem.type === 'milestone') {
      // If updating date for a milestone, check for conflicts and update position
      if (field === 'date') {
        if (!isValidDate(value)) {
          return; // ignore invalid picker values
        }

        const conflictingMilestone = milestones.find(m =>
          m.id !== selectedItem.id &&
          isValidDate(m.date) && isValidDate(value) &&
          value.toDateString() === m.date.toDateString()
        );

        if (conflictingMilestone) {
          alert(`A milestone already exists on ${value.toLocaleDateString()}. Please choose a different date.`);
          return; // Prevent update
        }

        // Calculate position based on new date
        const timeDiff = value.getTime() - startDateState.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        let calculatedPosition = (daysDiff / timelineLenState) * 100;

        // Ensure position is within valid range (0-100) and apply constraints
        if (calculatedPosition >= 0 && calculatedPosition <= 100) {
          newPosition = constrainPosition(calculatedPosition, selectedItem.id);
        } else {
          alert('Date outside of timeline range. Please select a date within the journey duration.');
          return; // Prevent update if date is out of range
        }
        updatedItem = { ...updatedItem, date: value, position: newPosition };
      } else {
        updatedItem = { ...updatedItem, [field]: value };
      }
      setMilestones(prev => prev.map(m =>
        m.id === selectedItem.id ? updatedItem : m
      ));
      setSelectedItem(updatedItem); // Update local selected item state

    } else if (selectedItem.type === 'step') {
      // Steps currently only support title updates through this modal.
      updatedItem = { ...updatedItem, [field]: value };
      setSteps(prev => prev.map(s =>
        s.id === selectedItem.id ? updatedItem : s
      ));
      setSelectedItem(updatedItem);
    }
  }, [selectedItem, milestones, startDateState, timelineLenState, constrainPosition, isValidDate, steps]);

  const handleTimelineClick = useCallback((e) => {
    if (isDragging || justFinishedDrag || e.target.closest('.no-drag') || e.target.closest('[data-draggable="true"]')) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickPosition = ((clickX / rect.width) * 100);
    
    const globalPosition = convertViewPositionToGlobalPosition(clickPosition);
    const dayFromStart = Math.round((globalPosition / 100) * timelineLenState);
    const milestoneDate = new Date(startDateState);
    milestoneDate.setDate(milestoneDate.getDate() + dayFromStart);

    const newMilestone = {
      id: `milestone_${Date.now()}`,
      title: 'New Milestone',
      date: milestoneDate,
      position: globalPosition,
      type: 'milestone',
      isDefault: false,
      description: ''
    };
    
    const conflictingMilestone = milestones.find(m =>
      m.id !== 'start' && m.id !== 'end' &&
      isValidDate(m.date) && isValidDate(milestoneDate) &&
      m.date.toDateString() === milestoneDate.toDateString()
    );

    if (conflictingMilestone) {
      alert('A milestone already exists on this date. Please choose a different date.');
      return;
    }

    setMilestones(prev => [...prev, newMilestone]);
    setSelectedItem(newMilestone);
  }, [isDragging, justFinishedDrag, convertViewPositionToGlobalPosition, timelineLenState, startDateState, setSelectedItem, milestones, isValidDate]);

  // Continuous scrolling logic
  const startContinuousScroll = useCallback((direction) => {
    if (scrollingRef.current) return;
    
    scrollingRef.current = true;
    setScrollDirection(direction > 0 ? 'right' : 'left');
    
    const scroll = () => {
      setCurrentViewIndex(prev => {
        const newIndex = prev + (direction > 0 ? 1 : -1);
        return Math.max(0, Math.min(totalViews - 1, newIndex));
      });
      
      if (scrollingRef.current) {
        rafIdRef.current = setTimeout(scroll, 80);
      }
    };
    
    rafIdRef.current = setTimeout(scroll, 80);
  }, [totalViews]);
  
  const stopContinuousScroll = useCallback(() => {
    scrollingRef.current = false;
    setScrollDirection(null);
    if (rafIdRef.current) {
      clearTimeout(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const handleMouseDown = useCallback((e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!item) return;

    if (item.isDefault) return;

    let hasMoved = false;
    const startX = e.clientX;
    const startY = e.clientY;
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    setSelectedItem(null);

    const timelineRef = item.type === 'milestone' ? milestoneTimelineRef : stepTimelineRef;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentViewPosition = convertGlobalPositionToViewPosition(item.position);
    const currentPixelPosition = currentViewPosition !== null ? (currentViewPosition / 100) * rect.width : 0;
    const clickOffsetX = e.clientX - rect.left - currentPixelPosition;
    
    const _drag = { item, originalPosition: item.position, originalDate: item.date };
    setDraggedItem(_drag);
    draggedItemRef.current = _drag; // Store in ref
    setIsDragging(true);
    setDragViewIndex(currentViewIndex); // Initialize dragViewIndex
    lastDragRef.current = null; // Clear previous last drag state

    const handleMouseMove = (moveE) => {
      const deltaX = Math.abs(moveE.clientX - startX);
      const deltaY = Math.abs(moveE.clientY - startY);
      
      if (deltaX > 3 || deltaY > 3) {
        hasMoved = true;
      }
      
      const currentTimelineRef = item.type === 'milestone' ? milestoneTimelineRef : stepTimelineRef;
      const currentRect = currentTimelineRef.current?.getBoundingClientRect();
      if (!currentRect) return;

      const pointerX = moveE.clientX;
      const timelineLeft = currentRect.left;
      const timelineRight = currentRect.right;
      
      // Check for scroll zones (20px outside timeline)
      if (pointerX < timelineLeft - 20 && currentViewIndex > 0) {
        startContinuousScroll(-1);
      } else if (pointerX > timelineRight + 20 && currentViewIndex < totalViews - 1) {
        startContinuousScroll(1);
      } else {
        stopContinuousScroll();
      }

      let newViewPosition = ((moveE.clientX - currentRect.left - clickOffsetX) / currentRect.width) * 100;
      
      // Determine target view index with earlier thresholds
      let targetViewIdx = currentViewIndex;
      if (newViewPosition > 90 && currentViewIndex < totalViews - 1) {
        targetViewIdx = currentViewIndex + 1;
        newViewPosition = newViewPosition - 100; // Adjust position for the new view
      } else if (newViewPosition < 10 && currentViewIndex > 0) {
        targetViewIdx = currentViewIndex - 1;
        newViewPosition = 100 + newViewPosition; // Adjust position for the new view
      }
      
      // Clamp view position to safe range
      if (newViewPosition < VIEW_MIN) newViewPosition = VIEW_MIN;
      if (newViewPosition > VIEW_MAX) newViewPosition = VIEW_MAX;
      
      // Auto-scroll to new view if needed
      if (targetViewIdx !== currentViewIndex) {
        setCurrentViewIndex(targetViewIdx);
      }
      
      // Calculate global position using target view
      const globalPos = convertViewPositionToGlobalPosition(newViewPosition, targetViewIdx);
      const constrainedGlobalPosition = constrainPosition(globalPos, item.id);
      
      // Calculate drag position in the target view
      const dragPosInTargetView = convertGlobalPositionToViewPosition(constrainedGlobalPosition, targetViewIdx);
      setDragViewIndex(targetViewIdx); // Update dragViewIndex state
      setDragPosition(dragPosInTargetView);
      
      // Store the last valid drag state
      lastDragRef.current = {
        globalPos: constrainedGlobalPosition,
        viewIdx: targetViewIdx,
        viewPos: dragPosInTargetView ?? 0 // Ensure it's not null
      };
      
      // Update item position and date in state
      const dayFromStart = Math.round((constrainedGlobalPosition / 100) * timelineLenState);
      const newDate = new Date(startDateState);
      newDate.setDate(newDate.getDate() + dayFromStart);

      if (item.type === 'milestone') {
        setMilestones(prev => prev.map(m => 
          m.id === item.id ? { ...m, position: constrainedGlobalPosition, date: newDate } : m
        ));
      } else { // Step
        setSteps(prev => prev.map(s =>
          s.id === item.id ? { ...s, position: constrainedGlobalPosition } : s
        ));
      }
    };

    const handleMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      stopContinuousScroll();
      setIsDragging(false);
      setJustFinishedDrag(true);
      setTimeout(() => setJustFinishedDrag(false), 100);

      setTimeout(() => {
        const di = draggedItemRef.current; // Use ref for current dragged item
        const last = lastDragRef.current; // Get the last valid drag state

        if (!di || !di.item) {
          setDraggedItem(null); // Clear state
          setDragPosition(null);
          setDragViewIndex(null);
          draggedItemRef.current = null; // Clear ref
          lastDragRef.current = null; // Clear ref
          return;
        }

        let finalItemFromState = null;
        let finalGlobalPosition = last?.globalPos; // Prioritize position from lastDragRef
        
        if (di.item.type === 'milestone') {
          const currentMilestone = milestones.find(m => m.id === di.item.id);
          if (currentMilestone) {
            finalGlobalPosition = finalGlobalPosition ?? currentMilestone.position; // Fallback if lastDragRef didn't capture
              
            // Check for date conflicts
            const conflictingMilestone = milestones.find(m =>
                m.id !== currentMilestone.id &&
                isValidDate(m.date) && isValidDate(currentMilestone.date) &&
                currentMilestone.date.toDateString() === m.date.toDateString()
            );

            if (conflictingMilestone) {
                alert(`A milestone already exists on ${currentMilestone.date.toLocaleDateString()}. Reverting changes.`);
                // Revert the milestone's position and date in state
                setMilestones(prev => prev.map(m =>
                    m.id === currentMilestone.id
                        ? { ...m, position: di.originalPosition, date: di.originalDate }
                        : m
                ));
                finalItemFromState = { ...currentMilestone, position: di.originalPosition, date: di.originalDate };
                finalGlobalPosition = di.originalPosition; // Ensure currentViewIndex is set to original position's view
            } else {
                finalItemFromState = currentMilestone;
            }
          }
        } else { // Step
            finalItemFromState = steps.find(s => s.id === di.item.id);
            finalGlobalPosition = finalGlobalPosition ?? finalItemFromState?.position; // Fallback for steps
        }

        if (typeof finalGlobalPosition === 'number') {
            const finalViewIndex = getViewIndexFromGlobalPosition(finalGlobalPosition);
            setCurrentViewIndex(finalViewIndex);
        }

        if (!hasMoved) {
            setSelectedItem(finalItemFromState);
        }
        
        setDraggedItem(null); // Clear state
        setDragPosition(null); // Clear state
        setDragViewIndex(null); // Clear state
        draggedItemRef.current = null; // Clear ref
        lastDragRef.current = null; // Clear ref
      }, 0);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [
    constrainPosition,
    convertViewPositionToGlobalPosition,
    convertGlobalPositionToViewPosition,
    getViewIndexFromGlobalPosition, // Added getViewIndexFromGlobalPosition
    timelineLenState,
    startDateState,
    milestoneTimelineRef,
    stepTimelineRef,
    setMilestones,
    setSteps,
    setDraggedItem,
    setIsDragging,
    setJustFinishedDrag,
    setDragPosition,
    setSelectedItem,
    isValidDate,
    currentViewIndex,
    totalViews,
    setCurrentViewIndex,
    milestones,
    steps, // Ensure steps is present as it's used in handleMouseUp
    VIEW_MIN, VIEW_MAX,
    startContinuousScroll,
    stopContinuousScroll,
    setDragViewIndex,
  ]);

  const { startWeek, endWeek } = getCurrentViewWeeks();

  return (
    <NeumorphicCard className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <NeumorphicDatePicker
              value={startDateState}
              placeholder="Select start date..."
              onChange={(d) => {
                if (!isValidDate(d)) return;
                setStartDateState(d);
                setMilestones(prev => prev.map(m =>
                  m.isDefault || !isValidDate(m.date)
                    ? m
                    : { ...m,
                        position: constrainPosition(
                          Math.max(0, Math.min(100, (Math.floor((m.date.getTime() - d.getTime()) / 86400000) / timelineLenState) * 100)),
                          m.id
                        )
                      }
                ));
                setSteps(prev => prev.map(s =>
                  s.isDefault // Steps don't have isDefault flag, but good to handle defensively
                    ? s
                    : { ...s,
                        position: constrainPosition(
                          Math.max(0, Math.min(100, (Math.floor((s.date?.getTime() - d.getTime()) / 86400000) / timelineLenState) * 100)), // Assuming steps can have dates later
                          s.id
                        )
                      }
                ));
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
            <NeumorphicInput
              type="number"
              value={timelineLenState}
              placeholder="45"
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isFinite(v) || v <= 0) return;
                setTimelineLenState(v);
                setMilestones(prev => prev.map(m =>
                  m.isDefault || !isValidDate(m.date)
                    ? m
                    : { ...m,
                        position: constrainPosition(
                          Math.max(0, Math.min(100, (Math.floor((m.date.getTime() - startDateState.getTime()) / 86400000) / v) * 100)),
                          m.id
                        )
                      }
                ));
                setSteps(prev => prev.map(s =>
                  s.isDefault // Steps don't have isDefault flag
                    ? s
                    : { ...s,
                        position: constrainPosition(
                          Math.max(0, Math.min(100, (Math.floor((s.date?.getTime() - startDateState.getTime()) / 86400000) / v) * 100)), // Assuming steps can have dates later
                          s.id
                        )
                      }
                ));
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NeumorphicButton icon={Flag} size="sm">Milestone</NeumorphicButton>
          <NeumorphicButton icon={Activity} size="sm">Step</NeumorphicButton>
        </div>
      </div>

      <div className="space-y-8">
        <div className="relative" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
          <div className="flex justify-between items-center">
            <div>
              {currentViewIndex > 0 && (
                <NeumorphicButton
                  size="sm"
                  onClick={() => setCurrentViewIndex(prev => Math.max(0, prev - 1))}
                  icon={ChevronLeft}
                >
                  Previous
                </NeumorphicButton>
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-700">
              Week View {currentViewIndex + 1} of {totalViews}
            </h3>
            <div>
              {currentViewIndex < totalViews - 1 && (
                <NeumorphicButton
                  size="sm"
                  onClick={() => setCurrentViewIndex(prev => Math.min(totalViews -1, prev + 1))}
                  icon={ChevronRight}
                >
                  Next
                </NeumorphicButton>
              )}
            </div>
          </div>
        </div>

        <motion.div
          key={currentViewIndex}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Milestone Timeline */}
          <div className="relative" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
            <div
              ref={milestoneTimelineRef}
              className="relative h-8 cursor-pointer"
              style={{
                borderRadius: '8px',
                background: 'var(--nm-background)',
                boxShadow: 'var(--nm-shadow-inset)',
              }}
              onClick={handleTimelineClick}
            >
              {/* Weekly notches */}
              {Array.from({ length: weeksPerView }, (_, weekIndex) => {
                const actualWeekIndex = startWeek + weekIndex;
                if (actualWeekIndex * 7 >= timelineLenState) return null;

                const weekPosition = ((weekIndex + 1) / weeksPerView) * 100;
                if (weekPosition >= VIEW_MAX) return null;

                return (
                  <div
                    key={`week-${actualWeekIndex}`}
                    className="absolute top-0 w-0.5 h-8"
                    style={{
                      left: `${weekPosition}%`,
                      transform: 'translateX(-50%)',
                      background: 'var(--nm-background)',
                      boxShadow: '1px 1px 2px #d1d9e6, -1px -1px 2px #ffffff',
                      borderRadius: '1px',
                    }}
                  />
                );
              })}

              {/* Week labels */}
              {Array.from({ length: weeksPerView }, (_, weekIndex) => {
                const actualWeekIndex = startWeek + weekIndex;
                if (actualWeekIndex * 7 >= timelineLenState) return null;

                const weekStartPosition = (weekIndex / weeksPerView) * 100;
                const weekEndPosition = ((weekIndex + 1) / weeksPerView) * 100;
                const weekCenterPosition = (weekStartPosition + Math.min(weekEndPosition, VIEW_MAX)) / 2;

                let isActiveWeek = false;
                if (isDragging && draggedItem?.item?.type === 'milestone') {
                  isActiveWeek = dragPosition >= weekStartPosition && dragPosition < weekEndPosition;
                }

                return (
                  <div
                    key={`week-label-${actualWeekIndex}`}
                    className="absolute top-0 h-8 flex items-center justify-center text-xs pointer-events-none"
                    style={{
                      left: `${weekCenterPosition}%`,
                      transform: 'translateX(-50%)',
                      fontSize: '10px',
                      fontWeight: '500',
                      color: isActiveWeek ? '#718096' : '#d1d9e6',
                      transition: 'color 0.2s ease',
                      userSelect: 'none',
                    }}
                  >
                    Week {actualWeekIndex + 1}
                  </div>
                );
              })}

              {/* Milestone Items */}
              <AnimatePresence>
                {milestones
                  .filter(milestone => {
                    const isCurrentDraggedItem = draggedItem && draggedItem.item.id === milestone.id;

                    // If it's the currently dragged item, and it's being dragged to a *different* view,
                    // do NOT render it in *this* currentViewIndex. It will render when currentViewIndex matches dragViewIndex.
                    if (isCurrentDraggedItem && dragViewIndex !== null && dragViewIndex !== currentViewIndex) {
                      return false; // Don't render the item in the old view if it's being dragged to another.
                    }

                    // Default flags (Start/End) have their own visibility conditions based on view boundaries.
                    // They should be considered visible if their specific conditions are met.
                    if (milestone.position === 0) return isStartFlagVisible();
                    if (milestone.position === 100) return isEndFlagVisible();

                    // For all other items (non-dragged, non-default, or dragged item *in* the current view),
                    // only render if their global position translates to a valid view position for the current view.
                    return convertGlobalPositionToViewPosition(milestone.position) !== null;
                  })
                  .map(milestone => {
                    const isCurrentDraggedItem = draggedItem && draggedItem.item.id === milestone.id;
                    const calculatedViewPosition = convertGlobalPositionToViewPosition(milestone.position); // Position if not dragged
                    
                    // If currently dragged, use dragPosition and dragViewIndex. Otherwise, use its calculated position for current view.
                    const finalRenderPosition = isCurrentDraggedItem && dragPosition !== null && dragViewIndex === currentViewIndex
                                                  ? dragPosition
                                                  : calculatedViewPosition;
                    
                    // This item should only render if its final position is valid within the current view,
                    // or if it's a default flag with its own visibility rules.
                    if (finalRenderPosition === null && !milestone.isDefault) {
                      return null;
                    }

                    const isHovered = hoveredMilestoneId === milestone.id;

                    // Special logic for default flags to position them outside the timeline explicitly
                    const isSpecialFlag = milestone.position === 0 || milestone.position === 100;
                    const flagLeftStyle = milestone.position === 0 && isStartFlagVisible() ? '-60px' :
                                          milestone.position === 100 && isEndFlagVisible() ? 'calc(100% + 15px)' :
                                          `${finalRenderPosition}%`;
                    const flagTransformStyle = isSpecialFlag ? 'translateX(0)' : 'translateX(-50%)';

                    return (
                      <motion.div
                        key={milestone.id}
                        data-draggable={!milestone.isDefault}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: 1,
                          scale: !milestone.isDefault && isHovered ? 1.1 : 1,
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }}
                        className="absolute flex flex-col items-center no-drag"
                        style={{
                          left: flagLeftStyle,
                          transform: flagTransformStyle,
                          top: '50%',
                          marginTop: '-26px',
                          cursor: milestone.isDefault ? 'default' : (
                            isDragging && draggedItem?.item?.id === milestone.id ? 'grabbing' : 'grab'
                          ),
                          zIndex: isHovered ? 50 : (isDragging && draggedItem?.item?.id === milestone.id ? 50 : 10),
                        }}
                        onMouseDown={!milestone.isDefault ? (e) => handleMouseDown(e, milestone) : undefined}
                        onMouseEnter={!milestone.isDefault ? () => setHoveredMilestoneId(milestone.id) : undefined}
                        onMouseLeave={!milestone.isDefault ? () => setHoveredMilestoneId(null) : undefined}
                      >
                        <motion.div
                          style={{
                            borderRadius: '50%',
                            background: 'var(--nm-background)',
                            boxShadow: 'var(--nm-shadow-main)',
                          }}
                          className="w-12 h-12 flex items-center justify-center"
                          whileHover={!milestone.isDefault ? { scale: 1.05 } : {}}
                          whileTap={!milestone.isDefault ? { scale: 0.95 } : {}}
                        >
                          {milestone.isDefault ? (
                            <Flag
                              className="w-6 h-6"
                              style={{
                                color: milestone.id === 'start' ? '#48bb78' : '#e53e3e',
                                fill: milestone.id === 'start' ? '#48bb78' : '#e53e3e'
                              }}
                            />
                          ) : (
                            <Flag
                              className="w-6 h-6"
                              style={{
                                color: '#2f949d',
                                fill: '#2f949d'
                              }}
                            />
                          )}
                        </motion.div>

                        <div
                          className={`mt-2 px-2 py-1 text-xs font-medium text-center whitespace-nowrap transition-all duration-200 ${!milestone.isDefault ? 'cursor-pointer' : ''}`}
                          style={{
                            ...(milestone.id === 'start' ? {
                              color: '#6b7280'
                            } : milestone.isDefault ? {} : {
                              background: 'var(--nm-background)',
                              boxShadow: 'var(--nm-shadow-main)',
                              borderRadius: '6px',
                              color: 'var(--nm-text-color)'
                            }),
                            transform: isHovered && !milestone.isDefault ? 'scale(1.05)' : 'scale(1)',
                          }}
                        >
                          {milestone.title}
                          {milestone.date && isValidDate(milestone.date) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {milestone.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
          </div>

          {/* Steps Timeline */}
          <div className="relative" style={{ paddingLeft: '80px', paddingRight: '80px' }}> 
            <div
              ref={stepTimelineRef}
              className="relative h-2 cursor-pointer"
              style={{
                background: 'var(--nm-background)',
                boxShadow: 'var(--nm-shadow-inset)',
                borderRadius: '4px',
                marginTop: '80px'
              }}
              onClick={(e) => {
                if (e.target.closest('.no-drag') || e.target.closest('[data-draggable="true"]') || justFinishedDrag) {
                  return;
                }

                const rect = stepTimelineRef.current?.getBoundingClientRect();
                if (!rect) return;

                const clickPosition = ((e.clientX - rect.left) / rect.width) * 100;
                const position = Math.max(VIEW_MIN, Math.min(VIEW_MAX, clickPosition)); 
                addStep(position);
              }}
            >
              <AnimatePresence>
                {steps
                  .filter(step => {
                    const isCurrentDraggedItem = draggedItem && draggedItem.item.id === step.id;
                    if (isCurrentDraggedItem && dragViewIndex !== null && dragViewIndex !== currentViewIndex) {
                      return false; // Don't render the item in the old view if it's being dragged to another.
                    }
                    return convertGlobalPositionToViewPosition(step.position) !== null;
                  })
                  .map((step) => {
                    const isCurrentDraggedItem = draggedItem && draggedItem.item.id === step.id;
                    const calculatedViewPosition = convertGlobalPositionToViewPosition(step.position);
                    const finalRenderPosition = isCurrentDraggedItem && dragPosition !== null && dragViewIndex === currentViewIndex
                                                  ? dragPosition
                                                  : calculatedViewPosition;

                    if (finalRenderPosition === null) return null; // Steps don't have default flags, so if it's not in view, don't render.

                    return (
                      <motion.div
                        key={step.id}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        className="absolute flex flex-col items-center no-drag"
                        data-draggable="true"
                        onMouseDown={(e) => handleMouseDown(e, step)}
                        style={{
                          left: `${finalRenderPosition}%`,
                          transform: 'translateX(-50%)',
                          top: '50%',
                          marginTop: '-12px',
                          cursor: isDragging && draggedItem?.item?.id === step.id ? 'grabbing' : 'grab',
                          zIndex: isDragging && draggedItem?.item?.id === step.id ? 50 : 20,
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                          style={{
                            background: 'var(--nm-background)',
                            boxShadow: 'var(--nm-shadow-main)',
                          }}
                        >
                          <Activity className="w-3 h-3" style={{ color: '#a8b2c5' }} />
                        </div>
                        <div className="mt-1 text-xs font-medium text-center whitespace-nowrap max-w-16 truncate">
                          {step.title}
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Milestone Editing Section */}
      <AnimatePresence>
        {selectedItem && selectedItem.type === 'milestone' && !selectedItem.isDefault && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 overflow-hidden"
          >
            <NeumorphicCard className="!shadow-inner-neumorphic">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">Edit Milestone</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <NeumorphicInput
                    value={selectedItem.title || ''}
                    onChange={(e) => updateSelectedItem('title', e.target.value)}
                    placeholder="Enter milestone title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <NeumorphicDatePicker
                    value={isValidDate(selectedItem.date) ? selectedItem.date : null}
                    onChange={(date) => updateSelectedItem('date', date)}
                    placeholder="Select milestone date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={selectedItem.description || ''}
                    onChange={(e) => updateSelectedItem('description', e.target.value)}
                    placeholder="Enter milestone description"
                    rows={3}
                    style={{
                      background: 'var(--nm-background)',
                      boxShadow: 'var(--nm-shadow-inset)',
                      borderRadius: '12px',
                    }}
                    className="w-full px-4 py-3 text-[--nm-text-color] focus:outline-none focus:ring-0 focus:border-none placeholder-gray-500 transition-all duration-300 resize-none hover:shadow-[var(--nm-shadow-inset-hover)]"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <NeumorphicButton
                    onClick={() => deleteItem(selectedItem.id)}
                  >
                    Delete
                  </NeumorphicButton>
                  <NeumorphicButton
                    variant="primary"
                    onClick={() => setSelectedItem(null)}
                    disabled={!selectedItem.title || !isValidDate(selectedItem.date)}
                  >
                    Save
                  </NeumorphicButton>
                </div>
              </div>
            </NeumorphicCard>
          </motion.div>
        )}

        {selectedItem && selectedItem.type === 'step' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 overflow-hidden"
            >
              <NeumorphicCard className="!shadow-inner-neumorphic">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">
                    Edit Step
                  </h4>
                  <div className="flex gap-2">
                    <NeumorphicButton
                      size="sm"
                      onClick={() => setSelectedItem(null)}
                    >
                      Done
                    </NeumorphicButton>
                    <NeumorphicButton
                      size="sm"
                      variant="primary"
                      onClick={() => deleteItem(selectedItem.id)}
                    >
                      Delete
                    </NeumorphicButton>
                  </div>
                </div>
                <NeumorphicInput
                  value={selectedItem.title}
                  onChange={(e) => updateItemTitle(selectedItem.id, e.target.value)}
                  placeholder="Enter title..."
                />
              </NeumorphicCard>
            </motion.div>
        )}
      </AnimatePresence>
    </NeumorphicCard>
  );
};

export default NeumorphicJourneyDesignerV3;
