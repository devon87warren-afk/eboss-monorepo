import React, { useState } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  ChevronRight,
  UserPlus,
  FileText,
  Clock,
  AlertTriangle,
  MessageSquare,
  Settings,
  Activity,
  Users,
  MapPin,
  Ticket,
  Upload,
  Receipt,
  BarChart3
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationType, ResourceType, ActivityLogItem } from '../types/permissions';

// Get icon for notification type
const getNotificationIcon = (type: NotificationType) => {
  const icons: Record<NotificationType, React.ReactNode> = {
    assignment: <UserPlus size={16} />,
    status_change: <Activity size={16} />,
    mention: <MessageSquare size={16} />,
    approval_request: <FileText size={16} />,
    approval_response: <Check size={16} />,
    deadline: <Clock size={16} />,
    system: <Settings size={16} />,
  };
  return icons[type];
};

// Get icon for resource type
const getResourceIcon = (type: ResourceType) => {
  const icons: Record<ResourceType, React.ReactNode> = {
    tickets: <Ticket size={14} />,
    customers: <Users size={14} />,
    units: <Activity size={14} />,
    imports: <Upload size={14} />,
    expenses: <Receipt size={14} />,
    analytics: <BarChart3 size={14} />,
    territories: <MapPin size={14} />,
    users: <Users size={14} />,
    workflows: <Activity size={14} />,
    reports: <FileText size={14} />,
    settings: <Settings size={14} />,
  };
  return icons[type];
};

// Format relative time
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Notification item component
const NotificationItem: React.FC<{
  notification: {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    actionUrl?: string;
    createdAt: string;
  };
  onMarkRead: () => void;
  onDelete: () => void;
}> = ({ notification, onMarkRead, onDelete }) => {
  const typeColors: Record<NotificationType, string> = {
    assignment: '#ff6b35',
    status_change: '#06d6a0',
    mention: '#627d98',
    approval_request: '#ffd23f',
    approval_response: '#06d6a0',
    deadline: '#ef476f',
    system: '#627d98',
  };

  return (
    <div
      className={`p-4 border-b border-navy-100 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-900/50 transition-colors ${
        !notification.read ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${typeColors[notification.type]}20`, color: typeColors[notification.type] }}
        >
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-navy-900 dark:text-white`}>
                {notification.title}
              </p>
              <p className="text-xs text-medium mt-0.5 line-clamp-2">{notification.message}</p>
            </div>
            {!notification.read && (
              <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-medium">{formatRelativeTime(notification.createdAt)}</span>
            <div className="flex items-center gap-1">
              {!notification.read && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMarkRead(); }}
                  className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors"
                  title="Mark as read"
                >
                  <Check size={12} className="text-navy-400" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1 hover:bg-danger-50 dark:hover:bg-danger-900/30 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={12} className="text-danger-400" />
              </button>
              {notification.actionUrl && (
                <a
                  href={notification.actionUrl}
                  className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors"
                  title="View"
                >
                  <ChevronRight size={12} className="text-navy-400" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity item component
const ActivityItem: React.FC<{ activity: ActivityLogItem; userName: string }> = ({ activity, userName }) => {
  const actionColors: Record<string, string> = {
    created: '#06d6a0',
    updated: '#ff6b35',
    deleted: '#ef476f',
    completed: '#06d6a0',
    approved: '#06d6a0',
    rejected: '#ef476f',
    assigned: '#627d98',
    imported: '#ff6b35',
    viewed: '#627d98',
    commented: '#627d98',
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-navy-100 dark:border-navy-700 last:border-0">
      <div
        className="p-1.5 rounded flex-shrink-0"
        style={{ backgroundColor: `${actionColors[activity.action] || '#627d98'}20` }}
      >
        <span style={{ color: actionColors[activity.action] || '#627d98' }}>
          {getResourceIcon(activity.resourceType)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-navy-900 dark:text-white">
          <span className="font-medium">{userName}</span>
          <span className="text-medium"> {activity.action} </span>
          <span className="text-medium">{activity.resourceType}</span>
        </p>
        {activity.details && (
          <p className="text-xs text-medium mt-0.5 line-clamp-1">{activity.details}</p>
        )}
        <span className="text-xs text-medium">{formatRelativeTime(activity.timestamp)}</span>
      </div>
    </div>
  );
};

// Toast notification component
export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();

  const typeStyles = {
    success: 'bg-success-500 text-white',
    error: 'bg-danger-500 text-white',
    warning: 'bg-warning-500 text-white',
    info: 'bg-navy-700 text-white',
  };

  const typeIcons = {
    success: <Check size={18} />,
    error: <X size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Bell size={18} />,
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lift animate-slide-in ${typeStyles[toast.type]}`}
        >
          {typeIcons[toast.type]}
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

// Main Notification Center component (dropdown panel)
const NotificationCenter: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'activity'>('notifications');
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    activityLog,
  } = useNotifications();

  // Mock user names for activity log
  const userNames: Record<string, string> = {
    'user-1': 'System Admin',
    'user-2': 'Tim Buffington',
    'user-3': 'Sarah Chen',
    'user-4': 'Mike Rodriguez',
    'user-5': 'Emily Watson',
    'user-6': 'James Lee',
    'user-7': 'Anna Martinez',
    'user-8': 'David Kim',
    'user-9': 'Lisa Johnson',
    'user-10': 'Chris Brown',
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-navy-800 rounded-card shadow-lift z-50 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-navy-100 dark:border-navy-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-navy-900 dark:text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors"
              >
                <X size={16} className="text-navy-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-3">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeTab === 'notifications'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
              }`}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-navy-500 hover:text-navy-700 dark:hover:text-navy-300'
              }`}
            >
              Activity
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {activeTab === 'notifications' ? (
            notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                />
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-navy-300 mb-2" />
                <p className="text-sm text-medium">No notifications</p>
              </div>
            )
          ) : (
            <div className="px-4 py-2">
              {activityLog.slice(0, 10).map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  userName={userNames[activity.userId] || 'Unknown'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-navy-50 dark:bg-navy-900 border-t border-navy-100 dark:border-navy-700">
          <a
            href={activeTab === 'notifications' ? '/settings/notifications' : '/admin?tab=activity'}
            className="block text-center text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            View all {activeTab}
          </a>
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;
