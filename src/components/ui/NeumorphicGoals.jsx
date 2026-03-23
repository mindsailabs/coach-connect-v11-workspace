import React, { useState } from 'react';
import NeumorphicButton from './NeumorphicButton';
import NeumorphicInput from './NeumorphicInput';
import NeumorphicDatePicker from './NeumorphicDatePicker';
import NeumorphicBadge from './NeumorphicBadge';
import NeumorphicModal from './NeumorphicModal';
import { Plus, X, Calendar, CheckCircle, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NeumorphicGoals - A comprehensive goals management component
 * 
 * @param {Array} goals - Array of goal objects with structure: { id, title, targetDate, completed, completedDate, createdDate }
 * @param {Function} onGoalsChange - Callback function when goals array changes
 * @param {String} title - Header title for the goals section (default: "Goals")
 * @param {Boolean} showAddButton - Whether to show the add new goal button (default: true)
 * @param {Object} filters - Filter object with status, priority, category properties (default: { status: "all", priority: "all", category: "all" })
 */
const NeumorphicGoals = ({
  goals = [],
  onGoalsChange,
  title = "Goals",
  showAddButton = true,
  filters = { status: "all", priority: "all", category: "all" }
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetDate: null });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);

  const handleEdit = (goalId, field, currentValue) => {
    setEditingId(goalId);
    setEditingField(field);
    setEditingValue(currentValue);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditingValue(null);
  };

  const handleToggleCompleted = (goalId) => {
    const updatedGoals = goals.map((goal) => {
      if (goal.id === goalId) {
        return {
          ...goal,
          completed: !goal.completed,
          completedDate: !goal.completed ? new Date() : null
        };
      }
      return goal;
    });

    onGoalsChange?.(updatedGoals);
  };

  const handleAddNew = () => {
    if (!newGoal.title.trim()) return;

    const goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      targetDate: newGoal.targetDate,
      completed: false,
      completedDate: null,
      createdDate: new Date()
    };

    onGoalsChange?.([...goals, goal]);
    setNewGoal({ title: '', targetDate: null });
    setIsAddingNew(false);
  };

  const handleDeleteGoal = (goalId) => {
    const updatedGoals = goals.filter((goal) => goal.id !== goalId);
    onGoalsChange?.(updatedGoals);
    setShowDeleteModal(false);
    setGoalToDelete(null);
  };

  const handleDeleteClick = (goal) => {
    setGoalToDelete(goal);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setGoalToDelete(null);
  };

  const formatDate = (date, isCompleted = false) => {
    if (!date) return null;
    const goalDate = new Date(date);
    const today = new Date();
    const diffTime = goalDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysCount = Math.abs(diffDays);
      const text = isCompleted ? `${daysCount} days late` : `${daysCount} days overdue`;
      return { text, variant: 'error' };
    } else if (diffDays === 0) {
      return { text: 'Due today', variant: 'warning' };
    } else if (diffDays <= 7) {
      const text = isCompleted ? `${diffDays} days early` : `${diffDays} days left`;
      return { text, variant: 'warning' };
    } else {
      const options = { month: 'short', day: 'numeric' };
      if (goalDate.getFullYear() !== today.getFullYear()) {
        options.year = 'numeric';
      }
      return { text: goalDate.toLocaleDateString('en-US', options), variant: 'info' };
    }
  };

  const sortedGoals = [...goals].sort((a, b) => {
    // First, separate by completion status - uncompleted first, completed second
    if (!a.completed && b.completed) return -1;
    if (a.completed && !b.completed) return 1;

    // Within each group, sort by date
    if (!a.completed && !b.completed) {
      // Both uncompleted - prioritize those with due dates, then sort by due date
      if (a.targetDate && !b.targetDate) return -1;
      if (!a.targetDate && b.targetDate) return 1;

      if (a.targetDate && b.targetDate) {
        return new Date(a.targetDate) - new Date(b.targetDate);
      } else {
        // Both have no dates, sort by created date (newest first)
        return new Date(b.createdDate) - new Date(a.createdDate);
      }
    }

    if (a.completed && b.completed) {
      // Both completed - sort by completion date (most recent first)
      const dateA = a.completedDate ? new Date(a.completedDate) : new Date(0);
      const dateB = b.completedDate ? new Date(b.completedDate) : new Date(0);
      return dateB - dateA;
    }

    return 0;
  });

  const filteredGoals = sortedGoals.filter(goal => {
    const statusMatch = filters.status === "all" || goal.status === filters.status;
    const priorityMatch = filters.priority === "all" || goal.priority === filters.priority;
    const categoryMatch = filters.category === "all" || goal.category === filters.category;
    return statusMatch && priorityMatch && categoryMatch;
  });

  return (
    <>
      <div className="neumorphic-goals-container">
        <div className="neumorphic-goals-header">
          <h2 className="neumorphic-goals-title">{title}</h2>
          {showAddButton && (
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="neumorphic-goals-add-button"
            >
              {isAddingNew ? <X /> : <Plus />}
            </button>
          )}
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {isAddingNew && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="neumorphic-goals-form">
                  <div className="space-y-4">
                    <NeumorphicInput
                      placeholder="Enter your goal..."
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNew()}
                    />

                    <div className="flex items-center justify-end gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--nm-text-color)' }}>Target Date:</span>
                      </div>
                      <div className="max-w-[200px]">
                        <NeumorphicDatePicker
                          value={newGoal.targetDate}
                          onChange={(date) => setNewGoal({ ...newGoal, targetDate: date })}
                          placeholder="Select date..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <NeumorphicButton
                        size="sm"
                        onClick={() => {
                          setIsAddingNew(false);
                          setNewGoal({ title: '', targetDate: null });
                        }}
                      >
                        Cancel
                      </NeumorphicButton>
                      <NeumorphicButton
                        size="sm"
                        variant="primary"
                        onClick={handleAddNew}
                      >
                        Add Goal
                      </NeumorphicButton>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filteredGoals.map((goal) => {
            const dateInfo = goal.targetDate ? formatDate(goal.targetDate, goal.completed) : null;
            const isEditing = editingId === goal.id;

            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className={`neumorphic-goals-item ${goal.completed ? 'completed' : ''}`}>
                  <div className="neumorphic-goals-item-content">
                    <div className="neumorphic-goals-item-text">
                      <motion.textarea
                        value={goal.title}
                        onChange={(e) => {
                          const updatedGoals = goals.map((g) =>
                            g.id === goal.id ? { ...g, title: e.target.value } : g
                          );
                          onGoalsChange?.(updatedGoals);
                        }}
                        className={`neumorphic-goals-item-textarea ${goal.completed ? 'completed' : ''}`}
                        animate={{
                          textDecoration: goal.completed ? 'line-through' : 'none'
                        }}
                        transition={{ duration: 0.3 }}
                        rows={1}
                        onInput={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.max(e.target.scrollHeight, 48) + 'px';
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.max(e.target.scrollHeight, 48) + 'px';
                        }}
                      />
                    </div>

                    <div className="neumorphic-goals-item-actions">
                      <div className="neumorphic-goals-date-picker">
                        <NeumorphicDatePicker
                          value={goal.completed ? goal.completedDate : goal.targetDate}
                          onChange={(date) => {
                            const updatedGoals = goals.map((g) =>
                              g.id === goal.id ? {
                                ...g,
                                ...(goal.completed ? { completedDate: date } : { targetDate: date })
                              } : g
                            );
                            onGoalsChange?.(updatedGoals);
                          }}
                          showDateText={false}
                          icon={Calendar}
                          className=""
                          style={{
                            background: 'transparent',
                            boxShadow: 'none',
                            border: 'none',
                            padding: '0'
                          }}
                        />
                      </div>

                      <button
                        onClick={() => handleToggleCompleted(goal.id)}
                        className={`neumorphic-goals-toggle-button ${goal.completed ? 'completed' : ''}`}
                        onMouseEnter={(e) => {
                          if (!goal.completed) {
                            e.currentTarget.style.color = 'var(--nm-badge-primary-color)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!goal.completed) {
                            e.currentTarget.style.color = '#9ca3af';
                          }
                        }}
                      >
                        {goal.completed ?
                          <CheckCircle className="w-5 h-5" /> :
                          <Circle className="w-5 h-5" />
                        }
                      </button>

                      <button
                        onClick={() => handleDeleteClick(goal)}
                        className="neumorphic-goals-delete-button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {goal.completed && goal.completedDate && (
                    <div className="neumorphic-goals-completion-info">
                      <div className="flex items-center justify-between ml-3">
                        <span className="neumorphic-goals-completion-text">
                          Completed on {new Date(goal.completedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {dateInfo && (
                          <NeumorphicBadge
                            variant={dateInfo.variant}
                            size="sm"
                            className="cursor-pointer hover:opacity-80"
                            onClick={() => handleEdit(goal.id, 'date', goal.targetDate)}
                            style={{ opacity: '1' }}
                          >
                            {dateInfo.text}
                          </NeumorphicBadge>
                        )}
                      </div>
                    </div>
                  )}
                  {!goal.completed && goal.targetDate && (
                    <div className="neumorphic-goals-due-info">
                      <div className="flex items-center justify-between ml-3">
                        <span className="neumorphic-goals-due-text">
                          Due on {new Date(goal.targetDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {dateInfo && (
                          <NeumorphicBadge
                            variant={dateInfo.variant}
                            size="sm"
                            className="cursor-pointer hover:opacity-80"
                            onClick={() => handleEdit(goal.id, 'date', goal.targetDate)}
                          >
                            {dateInfo.text}
                          </NeumorphicBadge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filteredGoals.length === 0 && !isAddingNew && (
            <div className="neumorphic-goals-empty-state">
              <Circle className="neumorphic-goals-empty-icon" />
              <p>No goals yet. Add your first goal to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal - positioned outside card for proper centering */}
      <NeumorphicModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Delete Goal?"
        size="md"
      >
        <div className="space-y-4">
          <p style={{ color: 'var(--nm-text-color)' }}>
            Are you sure you want to delete this goal? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <NeumorphicButton onClick={handleCancelDelete}>
              Cancel
            </NeumorphicButton>
            <NeumorphicButton
              variant="primary"
              onClick={() => handleDeleteGoal(goalToDelete?.id)}
            >
              Delete Goal
            </NeumorphicButton>
          </div>
        </div>
      </NeumorphicModal>
    </>
  );
};

export default NeumorphicGoals;