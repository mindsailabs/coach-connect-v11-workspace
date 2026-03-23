import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, Contact } from '@/components/api/entities';
import NeumorphicCard from '@/components/ui/NeumorphicCard';
import NeumorphicBadge from '@/components/ui/NeumorphicBadge';
import { formatRelativeDate, getPriorityVariant, getTaskStatusVariant } from '@/components/utils/entityHelpers';
import TaskDetailPanel from '@/components/app/TaskDetailPanel';
import { NeumorphicListSkeleton } from '@/components/ui/NeumorphicSkeleton';
import ListToolbar from '@/components/app/ListToolbar';

export default function TasksList() {
  const queryClient = useQueryClient();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  // Fetch tasks
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => Task.list(),
  });

  // Fetch contacts for display names
  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => Contact.list(),
  });

  // Toggle task status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ taskId, currentStatus }) => {
      const newStatus = currentStatus === 'done' ? 'open' : 'done';
      return Task.update(taskId, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Process tasks with contact info
  const tasks = (tasksData || []).map(task => {
    const contact = (contactsData || []).find(c => c.id === task.contact_id);
    return {
      ...task,
      contactName: contact?.full_name || null,
    };
  }).sort((a, b) => {
    // Sort: open first, then by priority (high > medium > low), then by due date
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority] ?? 1;
    const bPriority = priorityOrder[b.priority] ?? 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  const handleToggleStatus = (task) => {
    toggleStatusMutation.mutate({ taskId: task.id, currentStatus: task.status });
  };

  // Search & filter
  let filtered = tasks;
  if (filterStatus === 'Open') filtered = tasks.filter(t => t.status !== 'done');
  else if (filterStatus === 'Done') filtered = tasks.filter(t => t.status === 'done');
  else if (filterStatus === 'High') filtered = tasks.filter(t => t.priority === 'high' && t.status !== 'done');

  if (searchValue.trim()) {
    const q = searchValue.toLowerCase();
    filtered = filtered.filter(t => 
      (t.title || '').toLowerCase().includes(q) || 
      (t.contactName || '').toLowerCase().includes(q)
    );
  }

  const openTasks = filtered.filter(t => t.status !== 'done');
  const completedTasks = filtered.filter(t => t.status === 'done');

  if (isLoading) {
    return <NeumorphicListSkeleton itemCount={4} />;
  }

  if (error) {
    return (
      <NeumorphicCard className="p-8 text-center">
        <p style={{ color: 'var(--nm-badge-default-color)' }}>Error loading tasks. Please try again.</p>
      </NeumorphicCard>
    );
  }

  const renderTask = (task) => {
    const isCompleted = task.status === 'done';
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted;

    return (
      <div
        key={task.id}
        className="flex items-center gap-4 px-6 py-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
      >
        {/* Checkbox */}
        <button
          onClick={() => handleToggleStatus(task)}
          className="flex-shrink-0 p-0 border-0 bg-transparent cursor-pointer"
          style={{ color: isCompleted ? '#10b981' : 'var(--nm-badge-default-color)' }}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <h5 
            className="text-base font-normal truncate"
            style={{ 
              textDecoration: isCompleted ? 'line-through' : 'none',
              color: isCompleted ? 'var(--nm-badge-default-color)' : 'var(--nm-text-color)',
            }}
          >
            {task.title}
          </h5>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.contactName && (
              <span className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>
                {task.contactName}
              </span>
            )}
            {task.due_date && (
              <>
                {task.contactName && <span className="text-xs" style={{ color: 'var(--nm-badge-default-color)' }}>•</span>}
                <span 
                  className="text-xs flex items-center gap-1"
                  style={{ color: isOverdue ? '#ef4444' : 'var(--nm-badge-default-color)' }}
                >
                  {isOverdue && <AlertCircle className="w-3 h-3" />}
                  <Clock className="w-3 h-3" />
                  {formatRelativeDate(task.due_date)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Priority badge */}
        {task.priority && task.priority !== 'medium' && !isCompleted && (
          <NeumorphicBadge variant={getPriorityVariant(task.priority)} size="sm">
            {task.priority}
          </NeumorphicBadge>
        )}
      </div>
    );
  };

  return (
    <>
      <ListToolbar
        onAdd={() => setShowCreateTask(true)}
        searchPlaceholder="Search tasks..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filterStates={['All', 'Open', 'Done', 'High']}
        filterColors={['default', 'info', 'success', 'error']}
        onFilterChange={setFilterStatus}
        showFilter={showFilter}
        onFilterToggle={() => {
          setShowFilter(prev => !prev);
          if (showFilter) setFilterStatus('All');
        }}
      />

      {filtered.length === 0 ? (
        <NeumorphicCard className="p-8 text-center">
          <p style={{ color: 'var(--nm-badge-default-color)' }}>No tasks yet. Create your first task to get started.</p>
        </NeumorphicCard>
      ) : (
        <div className="space-y-6">
          {/* Open Tasks */}
          {openTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2 px-1" style={{ color: 'var(--nm-badge-default-color)' }}>
                Open ({openTasks.length})
              </h3>
              <NeumorphicCard className="!p-0 overflow-hidden">
                <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                  {openTasks.map(renderTask)}
                </div>
              </NeumorphicCard>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2 px-1" style={{ color: 'var(--nm-badge-default-color)' }}>
                Completed ({completedTasks.length})
              </h3>
              <NeumorphicCard className="!p-0 overflow-hidden">
                <div className="divide-y" style={{ borderColor: 'rgba(209, 217, 230, 0.4)' }}>
                  {completedTasks.map(renderTask)}
                </div>
              </NeumorphicCard>
            </div>
          )}
        </div>
      )}

      <TaskDetailPanel
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        backLabel="Back to Tasks"
      />
    </>
  );
}