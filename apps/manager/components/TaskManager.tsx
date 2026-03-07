/**
 * Unified Task Management Component
 *
 * Combines tasks from:
 * - Outlook (Microsoft To Do)
 * - Salesforce Tasks
 * - Local EBOSS tasks
 * - Service tickets
 * - Action items
 *
 * Features:
 * - Unified view across all task sources
 * - Create/edit tasks with automatic sync
 * - Filter by source, status, priority
 * - Bulk operations
 * - Drag-and-drop prioritization
 * - Sync status indicators
 */

import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Cloud,
  Database,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  Task,
  TaskStatus,
  TaskPriority,
  SyncStatus,
  SyncProvider
} from '../types';
import { syncService } from '../services/syncService';

interface TaskManagerProps {
  tasks: Task[];
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onSync: () => Promise<void>;
}

type FilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
type GroupBy = 'none' | 'status' | 'priority' | 'source' | 'dueDate';

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onSync
}) => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<SyncProvider | 'all'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Source filter
    if (selectedSource !== 'all') {
      filtered = filtered.filter(task =>
        task.syncMetadata.sourceOfTruth === selectedSource
      );
    }

    // Date/status filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filterType) {
      case 'today':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
        break;

      case 'upcoming':
        filtered = filtered.filter(task => {
          if (!task.dueDate || task.status === 'completed') return false;
          const dueDate = new Date(task.dueDate);
          return dueDate > today;
        });
        break;

      case 'overdue':
        filtered = filtered.filter(task => {
          if (!task.dueDate || task.status === 'completed') return false;
          const dueDate = new Date(task.dueDate);
          return dueDate < today;
        });
        break;

      case 'completed':
        filtered = filtered.filter(task => task.status === 'completed');
        break;

      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  }, [tasks, filterType, searchQuery, selectedSource]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    const groups = new Map<string, Task[]>();

    if (groupBy === 'none') {
      groups.set('all', filteredTasks);
      return groups;
    }

    filteredTasks.forEach(task => {
      let groupKey: string;

      switch (groupBy) {
        case 'status':
          groupKey = task.status;
          break;
        case 'priority':
          groupKey = task.priority;
          break;
        case 'source':
          groupKey = task.syncMetadata.sourceOfTruth;
          break;
        case 'dueDate':
          groupKey = getDateGroupKey(task.dueDate);
          break;
        default:
          groupKey = 'all';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(task);
    });

    // Sort groups
    const sortedGroups = new Map<string, Task[]>();
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      if (groupBy === 'priority') {
        return getPriorityOrder(a as TaskPriority) - getPriorityOrder(b as TaskPriority);
      }
      if (groupBy === 'status') {
        return getStatusOrder(a as TaskStatus) - getStatusOrder(b as TaskStatus);
      }
      return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
      sortedGroups.set(key, groups.get(key)!);
    });

    return sortedGroups;
  }, [filteredTasks, groupBy]);

  // Handle sync
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle group expansion
  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  // Task counts
  const taskCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      all: tasks.length,
      today: tasks.filter(t => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        return due.getTime() === today.getTime();
      }).length,
      upcoming: tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) > today;
      }).length,
      overdue: tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < today;
      }).length,
      completed: tasks.filter(t => t.status === 'completed').length
    };
  }, [tasks]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <CheckSquare className="w-6 h-6 text-ana-red" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>

          {/* Create task button */}
          <button
            onClick={onCreateTask}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-ana-red rounded-lg hover:bg-red-700"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-ana-red"
          />
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All Tasks', count: taskCounts.all },
            { key: 'today', label: 'Today', count: taskCounts.today },
            { key: 'upcoming', label: 'Upcoming', count: taskCounts.upcoming },
            { key: 'overdue', label: 'Overdue', count: taskCounts.overdue },
            { key: 'completed', label: 'Completed', count: taskCounts.completed }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setFilterType(filter.key as FilterType)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap ${
                filterType === filter.key
                  ? 'bg-ana-red text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter.label}
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                filterType === filter.key
                  ? 'bg-white/20'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Source filter & Group by */}
        <div className="flex items-center gap-3">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value as SyncProvider | 'all')}
            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Sources</option>
            <option value="local">Local</option>
            <option value="outlook">Outlook</option>
            <option value="salesforce">Salesforce</option>
          </select>

          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="none">No Grouping</option>
            <option value="status">Group by Status</option>
            <option value="priority">Group by Priority</option>
            <option value="source">Group by Source</option>
            <option value="dueDate">Group by Due Date</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4">
        {groupedTasks.size === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <CheckSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No tasks found</p>
            <p className="text-sm">Create a new task to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(groupedTasks.entries()).map(([groupKey, groupTasks]) => (
              <div key={groupKey} className="space-y-2">
                {/* Group header */}
                {groupBy !== 'none' && (
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {expandedGroups.has(groupKey) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="capitalize">{formatGroupKey(groupKey, groupBy)}</span>
                    <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                      {groupTasks.length}
                    </span>
                  </button>
                )}

                {/* Group tasks */}
                {(groupBy === 'none' || expandedGroups.has(groupKey)) && (
                  <div className="space-y-2">
                    {groupTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={() => onEditTask(task)}
                        onDelete={() => onDeleteTask(task.id)}
                        onUpdateStatus={(status) => onUpdateTaskStatus(task.id, status)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== TASK CARD ====================

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (status: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onUpdateStatus
}) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const syncIcon = getSyncIcon(task.syncMetadata.sourceOfTruth);

  return (
    <div
      onClick={onEdit}
      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        task.status === 'completed'
          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-75'
          : isOverdue
          ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-ana-red'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={(e) => {
            e.stopPropagation();
            onUpdateStatus(e.target.checked ? 'completed' : 'notStarted');
          }}
          className="mt-1 w-4 h-4 text-ana-red rounded border-slate-300 focus:ring-ana-red"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className={`font-medium text-slate-900 dark:text-white ${
                task.status === 'completed' ? 'line-through opacity-60' : ''
              }`}
            >
              {task.title}
            </h3>

            {/* Priority badge */}
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getPriorityBadgeClass(task.priority)}`}>
              {task.priority}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {/* Due date */}
            {task.dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                <Calendar className="w-3 h-3" />
                {formatDueDate(task.dueDate)}
              </div>
            )}

            {/* Assigned to */}
            {task.assignedToUserId && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Assigned
              </div>
            )}

            {/* Related items */}
            {(task.relatedAccountId || task.relatedTicketId || task.relatedUnitId) && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Linked
              </div>
            )}

            {/* Sync status */}
            <div className="flex items-center gap-1">
              {syncIcon}
              <span className="capitalize">{task.syncMetadata.sourceOfTruth}</span>
              {task.syncMetadata.syncStatus === 'conflict' && (
                <AlertCircle className="w-3 h-3 text-amber-600" />
              )}
            </div>
          </div>

          {/* Checklist items */}
          {task.checklistItems && task.checklistItems.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <CheckSquare className="w-3 h-3" />
                <span>
                  {task.checklistItems.filter(item => item.isCompleted).length} / {task.checklistItems.length} completed
                </span>
              </div>
            </div>
          )}

          {/* Sync conflict warning */}
          {task.syncMetadata.syncStatus === 'conflict' && (
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Sync conflict detected</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== UTILITY FUNCTIONS ====================

function getDateGroupKey(dueDate?: string): string {
  if (!dueDate) return 'No due date';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (due < today) return 'Overdue';
  if (due.getTime() === today.getTime()) return 'Today';
  if (due.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (due <= nextWeek) return 'This week';
  return 'Later';
}

function formatGroupKey(key: string, groupBy: GroupBy): string {
  if (groupBy === 'status') {
    const statusLabels: Record<TaskStatus, string> = {
      notStarted: 'Not Started',
      inProgress: 'In Progress',
      completed: 'Completed',
      waitingOnOthers: 'Waiting on Others',
      deferred: 'Deferred'
    };
    return statusLabels[key as TaskStatus] || key;
  }

  if (groupBy === 'priority') {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  return key;
}

function getPriorityOrder(priority: TaskPriority): number {
  const order: Record<TaskPriority, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3
  };
  return order[priority] || 999;
}

function getStatusOrder(status: TaskStatus): number {
  const order: Record<TaskStatus, number> = {
    inProgress: 0,
    notStarted: 1,
    waitingOnOthers: 2,
    deferred: 3,
    completed: 4
  };
  return order[status] || 999;
}

function getPriorityBadgeClass(priority: TaskPriority): string {
  const classes: Record<TaskPriority, string> = {
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    low: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  };
  return classes[priority];
}

function getSyncIcon(source: SyncProvider): JSX.Element {
  if (source === 'outlook') {
    return <Cloud className="w-3 h-3 text-blue-500" />;
  }
  if (source === 'salesforce') {
    return <Cloud className="w-3 h-3 text-cyan-500" />;
  }
  return <Database className="w-3 h-3 text-slate-500" />;
}

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const due = new Date(date);
  due.setHours(0, 0, 0, 0);

  if (due.getTime() === today.getTime()) return 'Today';
  if (due.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (due < today) return `Overdue (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
