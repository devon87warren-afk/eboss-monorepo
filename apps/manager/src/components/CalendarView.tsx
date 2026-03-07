/**
 * Calendar View Component
 *
 * Unified calendar displaying:
 * - Events from Outlook, Salesforce, and local
 * - Tasks with due dates
 * - Service tickets
 * - Customer follow-ups
 *
 * Features:
 * - Month, Week, and Day views
 * - Drag-and-drop rescheduling
 * - Inline event/task creation
 * - Sync status indicators
 * - Color-coded by type and source
 */

import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, RefreshCw, Cloud, AlertCircle } from 'lucide-react';
import { CalendarEvent, Task, EventType, TaskStatus, SyncStatus } from '../types';
import { syncService } from '../services/syncService';

interface CalendarViewProps {
  events: CalendarEvent[];
  tasks: Task[];
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick: (task: Task) => void;
  onCreateEvent: (date: Date) => void;
  onSync: () => Promise<void>;
}

type ViewMode = 'month' | 'week' | 'day';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
  tasks: Task[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  tasks,
  onEventClick,
  onTaskClick,
  onCreateEvent,
  onSync
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get calendar days for current view
  const calendarDays = useMemo(() => {
    return generateCalendarDays(currentDate, viewMode);
  }, [currentDate, viewMode]);

  // Filter events and tasks for current view
  const filteredEvents = useMemo(() => {
    const startOfView = calendarDays[0]?.date;
    const endOfView = calendarDays[calendarDays.length - 1]?.date;

    if (!startOfView || !endOfView) return [];

    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= startOfView && eventDate <= endOfView;
    });
  }, [calendarDays, events]);

  const filteredTasks = useMemo(() => {
    const startOfView = calendarDays[0]?.date;
    const endOfView = calendarDays[calendarDays.length - 1]?.date;

    if (!startOfView || !endOfView) return [];

    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= startOfView && dueDate <= endOfView;
    });
  }, [calendarDays, tasks]);

  // Handle sync
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  // Navigation
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Format header title based on view mode
  const getHeaderTitle = () => {
    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (viewMode === 'month') {
      return monthYear;
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = getWeekEnd(currentDate);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-ana-red" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendar</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>

          {/* Create event button */}
          <button
            onClick={() => onCreateEvent(currentDate)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-ana-red rounded-lg hover:bg-red-700"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Today
          </button>

          <button
            onClick={handlePrevious}
            className="p-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="p-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <span className="ml-4 text-lg font-semibold text-slate-900 dark:text-white">
            {getHeaderTitle()}
          </span>
        </div>

        {/* View mode selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              viewMode === 'month'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              viewMode === 'week'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              viewMode === 'day'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'month' && (
          <MonthView
            calendarDays={calendarDays}
            events={filteredEvents}
            tasks={filteredTasks}
            onEventClick={onEventClick}
            onTaskClick={onTaskClick}
            onDayClick={(date) => {
              setSelectedDate(date);
              onCreateEvent(date);
            }}
          />
        )}

        {viewMode === 'week' && (
          <WeekView
            weekDays={calendarDays.slice(0, 7)}
            events={filteredEvents}
            tasks={filteredTasks}
            onEventClick={onEventClick}
            onTaskClick={onTaskClick}
          />
        )}

        {viewMode === 'day' && (
          <DayView
            date={currentDate}
            events={filteredEvents}
            tasks={filteredTasks}
            onEventClick={onEventClick}
            onTaskClick={onTaskClick}
          />
        )}
      </div>
    </div>
  );
};

// ==================== MONTH VIEW ====================

interface MonthViewProps {
  calendarDays: CalendarDay[];
  events: CalendarEvent[];
  tasks: Task[];
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick: (task: Task) => void;
  onDayClick: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  calendarDays,
  events,
  tasks,
  onEventClick,
  onTaskClick,
  onDayClick
}) => {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group events and tasks by date
  const itemsByDate = useMemo(() => {
    const map = new Map<string, { events: CalendarEvent[]; tasks: Task[] }>();

    events.forEach(event => {
      const dateKey = new Date(event.startTime).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, { events: [], tasks: [] });
      }
      map.get(dateKey)!.events.push(event);
    });

    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = new Date(task.dueDate).toDateString();
        if (!map.has(dateKey)) {
          map.set(dateKey, { events: [], tasks: [] });
        }
        map.get(dateKey)!.tasks.push(task);
      }
    });

    return map;
  }, [events, tasks]);

  return (
    <div className="h-full flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
        {weekdays.map(day => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, index) => {
          const dateKey = day.date.toDateString();
          const dayItems = itemsByDate.get(dateKey) || { events: [], tasks: [] };
          const isToday = isSameDay(day.date, new Date());

          return (
            <div
              key={index}
              onClick={() => onDayClick(day.date)}
              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[100px] ${
                !day.isCurrentMonth ? 'bg-slate-50 dark:bg-slate-800/50 opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? 'w-7 h-7 flex items-center justify-center rounded-full bg-ana-red text-white'
                      : day.isCurrentMonth
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {day.date.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayItems.events.slice(0, 3).map((event, idx) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    compact
                  />
                ))}

                {/* Tasks */}
                {dayItems.tasks.slice(0, 2).map((task, idx) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    compact
                  />
                ))}

                {/* Show "+X more" if there are more items */}
                {dayItems.events.length + dayItems.tasks.length > 5 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    +{dayItems.events.length + dayItems.tasks.length - 5} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== WEEK VIEW ====================

interface WeekViewProps {
  weekDays: CalendarDay[];
  events: CalendarEvent[];
  tasks: Task[];
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick: (task: Task) => void;
}

const WeekView: React.FC<WeekViewProps> = ({
  weekDays,
  events,
  tasks,
  onEventClick,
  onTaskClick
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="h-full flex">
      {/* Time column */}
      <div className="w-16 flex-shrink-0 border-r border-slate-200 dark:border-slate-700">
        <div className="h-12"></div>
        {hours.map(hour => (
          <div
            key={hour}
            className="h-16 border-b border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-500 dark:text-slate-400"
          >
            {formatHour(hour)}
          </div>
        ))}
      </div>

      {/* Days columns */}
      <div className="flex-1 grid grid-cols-7">
        {weekDays.map((day, dayIndex) => {
          const dayEvents = events.filter(event =>
            isSameDay(new Date(event.startTime), day.date)
          );
          const dayTasks = tasks.filter(task =>
            task.dueDate && isSameDay(new Date(task.dueDate), day.date)
          );

          const isToday = isSameDay(day.date, new Date());

          return (
            <div
              key={dayIndex}
              className="border-r border-slate-200 dark:border-slate-700 last:border-r-0"
            >
              {/* Day header */}
              <div
                className={`h-12 border-b border-slate-200 dark:border-slate-700 px-2 py-1 text-center ${
                  isToday ? 'bg-ana-red text-white' : ''
                }`}
              >
                <div className="text-xs font-medium">
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {day.date.getDate()}
                </div>
              </div>

              {/* Hour slots */}
              <div className="relative">
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="h-16 border-b border-slate-200 dark:border-slate-700"
                  ></div>
                ))}

                {/* Render events as positioned blocks */}
                {dayEvents.map(event => {
                  const startTime = new Date(event.startTime);
                  const endTime = new Date(event.endTime);
                  const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className="absolute left-0 right-0 mx-1 cursor-pointer"
                      style={{
                        top: `${startHour * 64}px`,
                        height: `${Math.max(duration * 64, 32)}px`
                      }}
                    >
                      <EventCard event={event} onClick={() => onEventClick(event)} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== DAY VIEW ====================

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  tasks: Task[];
  onEventClick: (event: CalendarEvent) => void;
  onTaskClick: (task: Task) => void;
}

const DayView: React.FC<DayViewProps> = ({
  date,
  events,
  tasks,
  onEventClick,
  onTaskClick
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const dayEvents = events.filter(event =>
    isSameDay(new Date(event.startTime), date)
  );

  const dayTasks = tasks.filter(task =>
    task.dueDate && isSameDay(new Date(task.dueDate), date)
  );

  return (
    <div className="h-full flex">
      {/* Time column */}
      <div className="w-20 flex-shrink-0 border-r border-slate-200 dark:border-slate-700">
        {hours.map(hour => (
          <div
            key={hour}
            className="h-20 border-b border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-400"
          >
            {formatHour(hour)}
          </div>
        ))}
      </div>

      {/* Events column */}
      <div className="flex-1 relative">
        {hours.map(hour => (
          <div
            key={hour}
            className="h-20 border-b border-slate-200 dark:border-slate-700"
          ></div>
        ))}

        {/* Render events */}
        {dayEvents.map(event => {
          const startTime = new Date(event.startTime);
          const endTime = new Date(event.endTime);
          const startHour = startTime.getHours() + startTime.getMinutes() / 60;
          const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className="absolute left-0 right-0 mx-4 cursor-pointer"
              style={{
                top: `${startHour * 80}px`,
                height: `${Math.max(duration * 80, 40)}px`
              }}
            >
              <EventCard event={event} onClick={() => onEventClick(event)} detailed />
            </div>
          );
        })}
      </div>

      {/* Tasks sidebar */}
      {dayTasks.length > 0 && (
        <div className="w-80 border-l border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Tasks Due Today
          </h3>
          <div className="space-y-2">
            {dayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== EVENT CARD ====================

interface EventCardProps {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
  compact?: boolean;
  detailed?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick, compact, detailed }) => {
  const syncColor = getSyncStatusColor(event.syncMetadata.syncStatus);
  const typeColor = getEventTypeColor(event.eventType);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`text-xs p-1 rounded truncate ${typeColor} border-l-2`}
        style={{ borderLeftColor: syncColor }}
      >
        <div className="flex items-center gap-1">
          {event.syncMetadata.syncStatus === 'conflict' && (
            <AlertCircle className="w-3 h-3 text-amber-600" />
          )}
          {event.syncMetadata.outlookId && <Cloud className="w-3 h-3" />}
          <span className="truncate">{event.title}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`p-2 rounded-lg border-l-4 ${typeColor} hover:shadow-md transition-shadow`}
      style={{ borderLeftColor: syncColor }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{event.title}</div>
          {detailed && event.description && (
            <div className="text-xs opacity-80 mt-1">{event.description}</div>
          )}
          <div className="text-xs opacity-70 mt-1">
            {new Date(event.startTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>
          {event.location && (
            <div className="text-xs opacity-70 truncate">{event.location}</div>
          )}
        </div>
        <div className="flex gap-1">
          {event.syncMetadata.syncStatus === 'conflict' && (
            <AlertCircle className="w-4 h-4 text-amber-600" />
          )}
          {event.syncMetadata.outlookId && <Cloud className="w-4 h-4 opacity-50" />}
        </div>
      </div>
    </div>
  );
};

// ==================== TASK CARD ====================

interface TaskCardProps {
  task: Task;
  onClick: (e?: React.MouseEvent) => void;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, compact }) => {
  const statusColor = getTaskStatusColor(task.status);
  const priorityColor = getTaskPriorityColor(task.priority);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`text-xs p-1 rounded border-l-2 ${statusColor}`}
        style={{ borderLeftColor: priorityColor }}
      >
        <div className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={(e) => {
              e.stopPropagation();
              // Handle checkbox toggle
            }}
            className="w-3 h-3"
          />
          <span className={`truncate ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
            {task.title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border-l-4 ${statusColor} hover:shadow-md transition-shadow cursor-pointer`}
      style={{ borderLeftColor: priorityColor }}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={(e) => {
            e.stopPropagation();
            // Handle checkbox toggle
          }}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
            {task.title}
          </div>
          {task.description && (
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {task.description}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {task.priority}
            </span>
            {task.syncMetadata.outlookId && (
              <Cloud className="w-3 h-3 text-slate-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== UTILITY FUNCTIONS ====================

function generateCalendarDays(date: Date, viewMode: ViewMode): CalendarDay[] {
  const days: CalendarDay[] = [];

  if (viewMode === 'month') {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get start of calendar (previous month days to fill the first week)
    const startDay = new Date(firstDay);
    startDay.setDate(startDay.getDate() - firstDay.getDay());

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDay);
      currentDate.setDate(currentDate.getDate() + i);

      days.push({
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === month,
        events: [],
        tasks: []
      });
    }
  } else if (viewMode === 'week') {
    const weekStart = getWeekStart(date);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(currentDate.getDate() + i);

      days.push({
        date: currentDate,
        isCurrentMonth: true,
        events: [],
        tasks: []
      });
    }
  } else {
    // Day view
    days.push({
      date: date,
      isCurrentMonth: true,
      events: [],
      tasks: []
    });
  }

  return days;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function getSyncStatusColor(status: SyncStatus): string {
  const colors: Record<SyncStatus, string> = {
    synced: '#10b981', // green
    pending: '#f59e0b', // amber
    conflict: '#ef4444', // red
    error: '#ef4444' // red
  };
  return colors[status];
}

function getEventTypeColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    meeting: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    task: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    reminder: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    service: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    follow_up: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
  };
  return colors[type];
}

function getTaskStatusColor(status: TaskStatus): string {
  const colors: Record<TaskStatus, string> = {
    notStarted: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    inProgress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    waitingOnOthers: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    deferred: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  };
  return colors[status];
}

function getTaskPriorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: '#94a3b8', // slate-400
    medium: '#3b82f6', // blue-500
    high: '#f59e0b', // amber-500
    urgent: '#ef4444' // red-500
  };
  return colors[priority];
}
