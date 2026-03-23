
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Calendar, ClipboardList, Phone, 
  MessageSquare, Activity, BookOpen, X, Edit3, GripVertical, Flag
} from 'lucide-react';
import NeumorphicCard from './NeumorphicCard';
import NeumorphicButton from './NeumorphicButton';
import NeumorphicBadge from './NeumorphicBadge';
import NeumorphicModal from './NeumorphicModal';
import NeumorphicInput from './NeumorphicInput';
import NeumorphicSelect from './NeumorphicSelect';
import NeumorphicTextarea from './NeumorphicTextarea';
import NeumorphicDatePicker from './NeumorphicDatePicker';

const NeumorphicJourneyDesigner = ({ 
  initialJourney = [], 
  onJourneyChange,
  startDate = new Date(),
  timelineLength = 30 // days
}) => {
  const [journey, setJourney] = useState(() => {
    // Create default start and end milestones if not provided
    const defaultStart = {
      id: 'start-milestone',
      type: 'milestone',
      title: 'Start',
      description: 'Journey begins',
      date: startDate,
      position: 0,
      itemType: 'milestone',
      isDefault: true,
      isStart: true
    };
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + timelineLength);
    
    const defaultEnd = {
      id: 'end-milestone',
      type: 'milestone', 
      title: 'End',
      description: 'Journey completes',
      date: endDate,
      position: 100,
      itemType: 'milestone',
      isDefault: true,
      isEnd: true
    };

    // Check if start/end milestones already exist in initialJourney
    const hasStart = initialJourney.some(item => item.isStart);
    const hasEnd = initialJourney.some(item => item.isEnd);
    
    let journeyWithDefaults = [...initialJourney];
    if (!hasStart) journeyWithDefaults.push(defaultStart);
    if (!hasEnd) journeyWithDefaults.push(defaultEnd);
    
    return journeyWithDefaults.sort((a, b) => a.position - b.position);
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [justFinishedDrag, setJustFinishedDrag] = useState(false); 
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [addPosition, setAddPosition] = useState(50);
  const [addTimelineType, setAddTimelineType] = useState('milestone');
  const [currentStartDate, setCurrentStartDate] = useState(startDate);
  const [currentDuration, setCurrentDuration] = useState(timelineLength);
  const [isCreating, setIsCreating] = useState(false); // New state for create/edit mode
  const [hoveredMilestoneId, setHoveredMilestoneId] = useState(null); // Track hovered milestone
  const [dragPosition, setDragPosition] = useState(null); // Track real-time drag position for week labels
  const milestoneTimelineRef = React.useRef(null);
  const stepTimelineRef = React.useRef(null);

  // Minimum separation between milestones in days (dynamic based on timeline length)
  const MINIMUM_SEPARATION_DAYS = 1.0; // 1 day separation

  // Helper function to find neighboring milestones
  const findNeighboringMilestones = React.useCallback((currentId, targetPosition) => {
    const milestones = journey
      .filter(item => item.itemType === 'milestone' && item.id !== currentId)
      .sort((a, b) => a.position - b.position);
    
    let leftNeighbor = null;
    let rightNeighbor = null;
    
    for (const milestone of milestones) {
      if (milestone.position < targetPosition) {
        leftNeighbor = milestone;
      } else if (milestone.position > targetPosition && !rightNeighbor) {
        rightNeighbor = milestone;
        break;
      }
    }
    
    return { leftNeighbor, rightNeighbor };
  }, [journey]);

  // Helper function to constrain position based on neighbors
  const constrainPosition = React.useCallback((position, currentId) => {
    const { leftNeighbor, rightNeighbor } = findNeighboringMilestones(currentId, position);
    
    // Calculate dynamic spacing percentage based on timeline length
    const dynamicMinSpacingPercentage = (MINIMUM_SEPARATION_DAYS / timelineLength) * 100;
    
    let minPosition = 0;
    let maxPosition = 100;
    
    if (leftNeighbor) {
      minPosition = leftNeighbor.position + dynamicMinSpacingPercentage;
    }
    
    if (rightNeighbor) {
      maxPosition = rightNeighbor.position - dynamicMinSpacingPercentage;
    }
    
    return Math.max(minPosition, Math.min(maxPosition, position));
  }, [findNeighboringMilestones, timelineLength]);


  const typeOptions = [
    { value: 'session', label: 'Session', icon: Phone },
    { value: 'assignment', label: 'Assignment', icon: ClipboardList },
    { value: 'activity', label: 'Activity', icon: Activity },
    { value: 'check-in', label: 'Check-in', icon: MessageSquare },
    { value: 'learning', label: 'Learning', icon: BookOpen },
  ];

  const getTypeIcon = (type) => {
    const typeConfig = typeOptions.find(opt => opt.value === type);
    return typeConfig ? typeConfig.icon : ClipboardList;
  };

  const getDateFromPosition = React.useCallback((position) => {
    const dayOffset = Math.round((position / 100) * currentDuration);
    const date = new Date(currentStartDate);
    date.setDate(date.getDate() + dayOffset);
    return date;
  }, [currentStartDate, currentDuration]);

  const getPositionFromDate = React.useCallback((date) => {
    const dayDiff = Math.floor((date - currentStartDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(100, (dayDiff / currentDuration) * 100));
  }, [currentStartDate, currentDuration]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const addStep = (position = 50) => {
    const newDate = getDateFromPosition(position);
    const newStep = {
      id: `step-${Date.now()}`,
      type: 'assignment',
      title: 'New Step',
      description: '',
      date: newDate,
      position: position, // Initial position, will be recalculated on save based on date
      itemType: 'step'
    };
    
    // Do not add to journey yet, item is added upon save from modal
    setEditingItem(newStep);
    setIsCreating(true); // Set creating mode
    setShowEditModal(true);
  };

  const addMilestone = (position = 50) => {
    const newDate = getDateFromPosition(position);
    const newMilestone = {
      id: `milestone-${Date.now()}`,
      type: 'milestone',
      title: 'New Milestone',
      description: '',
      date: newDate,
      position: position, // Initial position, will be recalculated on save based on date
      itemType: 'milestone'
    };
    
    // Do not add to journey yet, item is added upon save from modal
    setEditingItem(newMilestone);
    setIsCreating(true); // Set creating mode
    setShowEditModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item });
    setIsCreating(false); // Set editing mode
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedItem) => {
    // Calculate position from date
    let newPosition = getPositionFromDate(updatedItem.date);
    
    // Ensure start/end milestones remain at 0/100
    if (updatedItem.isStart) newPosition = 0;
    if (updatedItem.isEnd) newPosition = 100;

    // Apply spacing constraint for non-default milestones
    if (!updatedItem.isDefault && updatedItem.itemType === 'milestone') {
      const constrainedPosition = constrainPosition(newPosition, updatedItem.id);
      
      // If the constrained position is significantly different, it means the user tried to place
      // it too close to another milestone. Alert and prevent save.
      if (Math.abs(constrainedPosition - newPosition) > 0.1) {
        const constrainedDate = getDateFromPosition(constrainedPosition);
        alert(`The selected date is too close to another milestone. The closest available date is ${constrainedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`);
        return;
      }
      newPosition = constrainedPosition;
    }

    // Check for date conflicts with other milestones (excluding the item being edited)
    // Get date corresponding to the potentially constrained position
    const finalDate = getDateFromPosition(newPosition); 

    const hasDateConflict = journey.some(item => 
      item.id !== updatedItem.id && 
      item.itemType === 'milestone' &&
      item.date.toDateString() === finalDate.toDateString()
    );

    if (hasDateConflict) {
      alert('A milestone already exists on this date. Please choose a different date.');
      return;
    }

    let updatedJourney;
    if (isCreating) {
        // If creating, add the new item to the journey
        updatedJourney = [...journey, {
            ...updatedItem,
            position: newPosition,
            date: finalDate, // Use finalDate here
        }];
    } else {
        // If editing, map over existing items to update the specific one
        updatedJourney = journey.map(item =>
            item.id === updatedItem.id ? {
                ...updatedItem,
                position: newPosition,
                date: finalDate, // Use finalDate here
            } : item
        );
    }
    
    const sortedJourney = updatedJourney.sort((a, b) => a.position - b.position);
    setJourney(sortedJourney);
    if (onJourneyChange) onJourneyChange(sortedJourney);
    
    setShowEditModal(false);
    setEditingItem(null);
    setIsCreating(false); // Reset creating state
  };

  const deleteItem = (itemId) => {
    // Prevent deletion of default start/end milestones
    const item = journey.find(j => j.id === itemId);
    if (item && item.isDefault) return;
    
    const updatedJourney = journey.filter(item => item.id !== itemId);
    setJourney(updatedJourney);
    if (onJourneyChange) onJourneyChange(updatedJourney);
  };

  const handleMouseDown = (e, item) => {
    if (e.target.closest('.no-drag')) return;
    
    // Prevent dragging of default start/end milestones
    if (item.isDefault) return;
    
    const isMilestoneTimeline = item.itemType === 'milestone';
    const rect = isMilestoneTimeline 
      ? milestoneTimelineRef.current?.getBoundingClientRect()
      : stepTimelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDraggedItem(item);
    setDragOffset({
      x: e.clientX - rect.left - (item.position / 100 * rect.width),
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = React.useCallback((e) => {
    if (!isDragging || !draggedItem) return;

    const isMilestoneTimeline = draggedItem.itemType === 'milestone';
    const rect = isMilestoneTimeline 
      ? milestoneTimelineRef.current?.getBoundingClientRect()
      : stepTimelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    let newPosition = Math.max(0, Math.min(100, 
      ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100
    ));

    // Update real-time drag position for visual feedback
    setDragPosition(newPosition);

    // Apply spacing constraint for milestones (except start/end milestones)
    if (isMilestoneTimeline && !draggedItem.isStart && !draggedItem.isEnd) {
      newPosition = constrainPosition(newPosition, draggedItem.id);
    }

    const newDate = getDateFromPosition(newPosition);
    
    // Check for date conflicts with other milestones (excluding the item being dragged)
    const hasDateConflict = journey.some(item => 
      item.id !== draggedItem.id && 
      item.itemType === 'milestone' &&
      item.date.toDateString() === newDate.toDateString()
    );

    // Don't update position if it would cause a date conflict
    if (!hasDateConflict) {
      setJourney(currentJourney => currentJourney.map(item => 
        item.id === draggedItem.id 
          ? { 
              ...item, 
              position: newPosition,
              date: newDate
            }
          : item
      ));
    }
  }, [isDragging, draggedItem, dragOffset.x, getDateFromPosition, journey, constrainPosition]);

  const handleMouseUp = React.useCallback(() => {
    if (isDragging && onJourneyChange) {
      // Sort the journey after drag ends to ensure positions are ordered correctly
      const sortedJourney = [...journey].sort((a, b) => a.position - b.position);
      onJourneyChange(sortedJourney);
    }
    setIsDragging(false);
    setDraggedItem(null);
    setDragOffset({ x: 0, y: 0 });
    setDragPosition(null); // Reset real-time drag position
    setJustFinishedDrag(true); // Set flag to true immediately after drag ends
    setTimeout(() => {
      setJustFinishedDrag(false); // Reset flag after a short delay
    }, 100);
  }, [isDragging, journey, onJourneyChange]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevent text selection during dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // Restore text selection and cursor after dragging ends
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Update default milestone dates when start date or duration changes
  React.useEffect(() => {
    const updatedJourney = journey.map(item => {
      if (item.isStart) {
        return {
          ...item,
          date: currentStartDate,
          position: 0
        };
      }
      if (item.isEnd) {
        const endDate = new Date(currentStartDate);
        endDate.setDate(endDate.getDate() + currentDuration);
        return {
          ...item,
          date: endDate,
          position: 100
        };
      }
      return item;
    });
    
    // Deep comparison for dates and positions to prevent infinite loop.
    const hasChanged = JSON.stringify(updatedJourney.map(i => ({id: i.id, date: i.date.toISOString(), position: i.position}))) !== 
                     JSON.stringify(journey.map(i => ({id: i.id, date: i.date.toISOString(), position: i.position})));

    if (hasChanged) {
      setJourney(updatedJourney);
      if (onJourneyChange) onJourneyChange(updatedJourney);
    }
  }, [currentStartDate, currentDuration, onJourneyChange, journey]);

  // Filter items by type
  const milestones = journey.filter(item => item.itemType === 'milestone');
  const steps = journey.filter(item => item.itemType === 'step');

  return (
    <NeumorphicCard className="space-y-6">
      {/* Date Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <NeumorphicDatePicker
            value={currentStartDate}
            onChange={setCurrentStartDate}
            placeholder="Select start date..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
          <NeumorphicInput
            type="number"
            min="1"
            max="365"
            value={currentDuration}
            onChange={(e) => setCurrentDuration(parseInt(e.target.value) || 30)}
            placeholder="Enter duration..."
          />
        </div>

        <div className="flex gap-2">
          <NeumorphicButton 
            size="sm" 
            onClick={() => addMilestone(50)}
            icon={Flag}
          >
            Milestone
          </NeumorphicButton>
          <NeumorphicButton 
            size="sm" 
            onClick={() => addStep(50)}
            icon={Activity}
          >
            Step
          </NeumorphicButton>
        </div>
      </div>

      {/* Dual Timeline Container */}
      <div className="relative py-12 space-y-16">
        {/* Date Labels */}
        <div className="flex justify-between text-xs text-gray-500 mb-4 mx-8">
          <span>{formatDate(currentStartDate)}</span>
          <span>{formatDate(getDateFromPosition(50))}</span>
          <span>{formatDate(getDateFromPosition(100))}</span>
        </div>

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
            onClick={(e) => {
              // Prevent adding if clicking on an interactive element or if dragging
              if (e.target.closest('.no-drag') || e.target.closest('[data-draggable="true"]') || isDragging) {
                return;
              }
              
              const rect = milestoneTimelineRef.current?.getBoundingClientRect();
              if (!rect) return;
              
              const clickX = e.clientX - rect.left;
              let clickPosition = (clickX / rect.width) * 100;
              
              // Create a temporary ID for the new milestone to allow constrainPosition to work
              const tempNewMilestoneId = `temp-milestone-${Date.now()}`;
              let clampedPosition = constrainPosition(clickPosition, tempNewMilestoneId);
              
              // Check if click is on an existing milestone (especially start/end)
              const clickedOnMilestone = milestones.some(milestone => {
                const milestoneX = (milestone.position / 100) * rect.width;
                // Adjust tolerance based on icon size and desired click behavior
                // A tolerance of 20px means we're checking a 40px wide area around the milestone's center
                return Math.abs(clickX - milestoneX) < 20; 
              });
              
              // Don't create new milestone if clicked on or very near an existing one
              if (!clickedOnMilestone) {
                addMilestone(clampedPosition);
              }
            }}
          >
            {/* Weekly notches */}
            {Array.from({ length: Math.floor(timelineLength / 7) }, (_, weekIndex) => {
              const weekPosition = ((weekIndex + 1) * 7 / timelineLength) * 100;
              // Don't render notch if it's too close to the end (within 2% of timeline end)
              if (weekPosition > 98) return null;
              
              return (
                <div
                  key={`week-${weekIndex}`}
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
            {Array.from({ length: Math.floor(timelineLength / 7) + 1 }, (_, weekIndex) => {
              const weekStartPosition = (weekIndex * 7 / timelineLength) * 100;
              const weekEndPosition = ((weekIndex + 1) * 7 / timelineLength) * 100;
              const weekCenterPosition = (weekStartPosition + Math.min(weekEndPosition, 100)) / 2;
              
              // Don't render if the week center is beyond the timeline
              if (weekCenterPosition > 100) return null;
              
              // Calculate if the dragged milestone is in this week
              let isActiveWeek = false;
              if (isDragging && draggedItem?.itemType === 'milestone') {
                // Use dragPosition if available (during active dragging), otherwise use stored position
                const currentDragPosition = dragPosition !== null ? dragPosition : draggedItem.position;
                isActiveWeek = currentDragPosition >= weekStartPosition && currentDragPosition < weekEndPosition;
              }
              
              return (
                <div
                  key={`week-label-${weekIndex}`}
                  className="absolute top-0 h-8 flex items-center justify-center text-xs pointer-events-none"
                  style={{
                    left: `${weekCenterPosition}%`,
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    fontWeight: '500',
                    color: isActiveWeek ? '#718096' : '#d1d9e6',
                    transition: 'color 0.2s ease', // Smooth color transition
                    userSelect: 'none', // Prevent text selection during dragging
                  }}
                >
                  Week {weekIndex + 1}
                </div>
              );
            })}

            {/* Milestone Items */}
            <AnimatePresence>
              {milestones.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`absolute group ${
                    isDragging && draggedItem?.id === item.id ? 'z-50' : 'z-10'
                  }`}
                  style={{
                    left: item.position === 0 ? '-60px' : item.position === 100 ? 'calc(100% + 15px)' : `${item.position}%`,
                    transform: item.position === 0 || item.position === 100 ? 'translateX(0)' : 'translateX(-50%)',
                    top: '50%', // Center vertically on timeline
                    marginTop: '-26px', // Moved down 6px from -32px
                    cursor: item.isDefault ? 'default' : (
                      isDragging && draggedItem?.id === item.id ? 'grabbing' : 'grab'
                    ),
                    zIndex: hoveredMilestoneId === item.id ? 50 : (isDragging && draggedItem?.id === item.id ? 50 : 10),
                  }}
                  onMouseDown={(e) => handleMouseDown(e, item)}
                  onMouseEnter={() => setHoveredMilestoneId(item.id)}
                  onMouseLeave={() => setHoveredMilestoneId(null)}
                  data-draggable={!item.isDefault}
                >
                  {/* Milestone Flag Icon */}
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-200 relative ${
                      isDragging && draggedItem?.id === item.id 
                        ? 'shadow-lg scale-110' 
                        : ''
                    } ${item.isDefault ? 'opacity-90' : ''}`}
                    style={{
                      background: 'var(--nm-background)',
                      boxShadow: 'var(--nm-shadow-main)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent timeline click handler from firing
                      
                      // Don't open edit modal if we just finished dragging
                      if (justFinishedDrag) return;
                        
                      // Only allow editing non-default milestones, or do nothing for start/end
                      if (!item.isDefault) {
                        handleEdit(item);
                      }
                    }}
                  >
                    <Flag 
                      className="w-6 h-6" 
                      style={
                        item.isStart ? { color: '#48bb78' } : 
                        item.isEnd ? { color: '#4a5568' } : 
                        { color: '#4a5568' }
                      } 
                    />
                    
                    {!item.isDefault && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          style={{
                            borderRadius: '50%',
                            background: 'var(--nm-background)',
                            boxShadow: 'var(--nm-shadow-main)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <Edit3 className="w-2.5 h-2.5" style={{ color: '#2f949d' }} />
                          </div>
                        </div>
                    )}
                  </div>
                  
                  {!item.isDefault && (
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                    <div 
                      className="px-3 py-2 rounded-lg border text-sm whitespace-nowrap"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(209, 217, 230, 0.8)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-gray-600">{formatDate(item.date)}</div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-medium pointer-events-auto no-drag"
                          >
                            Delete
                          </button>
                        </div>
                    </div>
                  </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="relative" style={{ paddingLeft: '80px', paddingRight: '80px' }}>
          {/* Removed the header div with Activity icon and "Steps" title */}
          
          <div 
            ref={stepTimelineRef}
            className="relative h-2 cursor-pointer"
            style={{
              background: 'var(--nm-background)',
              boxShadow: 'var(--nm-shadow-inset)',
              borderRadius: '4px',
            }}
            onClick={(e) => {
              if (e.target.closest('.no-drag') || e.target.closest('[data-draggable="true"]') || justFinishedDrag) {
                return; // Also prevent if justFinishedDrag
              }

              const rect = stepTimelineRef.current?.getBoundingClientRect();
              if (!rect) return;
              
              const clickPosition = ((e.clientX - rect.left) / rect.width) * 100;
              const position = Math.max(5, Math.min(95, clickPosition));
              addStep(position);
            }}
          >
            {/* Step Items */}
            <AnimatePresence>
              {steps.map((item) => {
                const IconComponent = getTypeIcon(item.type);
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`absolute group ${
                      isDragging && draggedItem?.id === item.id ? 'z-50' : 'z-10'
                    }`}
                    style={{
                      left: `${item.position}%`,
                      transform: 'translateX(-50%)',
                      top: '-12px',
                      cursor: isDragging && draggedItem?.id === item.id ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, item)}
                    data-draggable={true}
                  >
                    {/* Step Circle Icon */}
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isDragging && draggedItem?.id === item.id 
                          ? 'shadow-lg scale-110 opacity-90' 
                          : ''
                      }`}
                      style={{
                        background: '#a8b2c5',
                        boxShadow: 'var(--nm-shadow-main)',
                      }}
                    >
                      <IconComponent className="w-3 h-3 text-white" />
                    </div>
                    
                    {/* Step Info */}
                    <div className="absolute top-full mt-1 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-20">
                      <NeumorphicCard className="px-2 py-1 min-w-[100px] max-w-[150px] text-left">
                        <div className="text-xs font-medium leading-tight">{item.title}</div>
                        <div className="text-xs text-gray-500 leading-tight">{formatDate(item.date)}</div>
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (justFinishedDrag) return; // Prevent if justFinishedDrag
                              handleEdit(item);
                            }}
                            className="p-0.5 rounded hover:bg-gray-100 no-drag"
                          >
                            <Edit3 className="w-2.5 h-2.5 text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (justFinishedDrag) return; // Prevent if justFinishedDrag
                              deleteItem(item.id);
                            }}
                            className="p-0.5 rounded hover:bg-red-100 no-drag"
                          >
                            <X className="w-2.5 h-2.5 text-red-500" />
                          </button>
                        </div>
                      </NeumorphicCard>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <NeumorphicModal
        isOpen={showEditModal}
        onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
            setIsCreating(false); // Reset creating state on close
        }}
        title={isCreating 
                ? `Create ${editingItem?.itemType === 'milestone' ? 'Milestone' : 'Step'}` 
                : `Edit ${editingItem?.itemType === 'milestone' ? 'Milestone' : 'Step'}`}
      >
        {editingItem && (
          <EditItemForm
            item={editingItem}
            typeOptions={typeOptions}
            onSave={handleSaveEdit}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </NeumorphicModal>
    </NeumorphicCard>
  );
};

// Edit Form Component
const EditItemForm = ({ item, typeOptions, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: item.title || '',
    description: item.description || '',
    type: item.type || (item.itemType === 'milestone' ? 'milestone' : 'assignment'),
    // Ensure date is in 'YYYY-MM-DD' format for input type="date"
    date: item.date ? new Date(item.date).toISOString().split('T')[0] : ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...item,
      ...formData,
      date: new Date(formData.date)
    });
  };

  const isMilestone = item.itemType === 'milestone';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
        <NeumorphicInput
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter title..."
        />
      </div>

      {!isMilestone && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <NeumorphicSelect
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
            options={typeOptions}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
        <NeumorphicInput
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <NeumorphicTextarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description..."
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <NeumorphicButton onClick={onCancel}>
          Cancel
        </NeumorphicButton>
        <NeumorphicButton variant="primary" type="submit">
          Save Changes
        </NeumorphicButton>
      </div>
    </form>
  );
};

export default NeumorphicJourneyDesigner;
