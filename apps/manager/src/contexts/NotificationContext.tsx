import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationType, ActivityLogItem, ResourceType } from '../types/permissions';

// Mock notifications
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'assignment',
    title: 'New Ticket Assigned',
    message: 'You have been assigned ticket TKT-4521: API sync failure',
    userId: 'user-2',
    read: false,
    actionUrl: '/tickets/TKT-4521',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
  },
  {
    id: 'notif-2',
    type: 'approval_request',
    title: 'Expense Approval Needed',
    message: 'Sarah Chen submitted an expense report ($487.50) for your approval',
    userId: 'user-2',
    read: false,
    actionUrl: '/expenses?view=approvals',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
  },
  {
    id: 'notif-3',
    type: 'status_change',
    title: 'Import Completed',
    message: 'Batch IMP-001 (127 contacts) has been successfully imported',
    userId: 'user-2',
    read: true,
    actionUrl: '/workflow',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
  },
  {
    id: 'notif-4',
    type: 'mention',
    title: 'You were mentioned',
    message: 'Emily Watson mentioned you in a comment on TKT-4518',
    userId: 'user-2',
    read: true,
    actionUrl: '/tickets/TKT-4518',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'notif-5',
    type: 'deadline',
    title: 'Expense Deadline Approaching',
    message: 'Weekly expense submission deadline is in 2 hours',
    userId: 'user-2',
    read: false,
    actionUrl: '/expenses',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'notif-6',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance window: Saturday 2AM-4AM PST',
    userId: 'user-2',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
];

// Mock activity log
const MOCK_ACTIVITY: ActivityLogItem[] = [
  { id: 'act-1', userId: 'user-2', action: 'created', resourceType: 'tickets', resourceId: 'TKT-4522', details: 'Created new ticket: Network connectivity issue', territoryId: 'terr-ca', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
  { id: 'act-2', userId: 'user-3', action: 'updated', resourceType: 'customers', resourceId: 'cust-127', details: 'Updated contact information', territoryId: 'terr-or', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: 'act-3', userId: 'user-4', action: 'completed', resourceType: 'tickets', resourceId: 'TKT-4519', details: 'Resolved ticket', territoryId: 'terr-az', timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
  { id: 'act-4', userId: 'user-5', action: 'approved', resourceType: 'expenses', resourceId: 'EXP-2847', details: 'Approved expense $234.50', territoryId: 'terr-wa', timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
  { id: 'act-5', userId: 'user-6', action: 'imported', resourceType: 'imports', resourceId: 'IMP-003', details: 'Started import batch (45 records)', territoryId: 'terr-co', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { id: 'act-6', userId: 'user-2', action: 'assigned', resourceType: 'tickets', resourceId: 'TKT-4521', details: 'Assigned ticket to Mike Rodriguez', territoryId: 'terr-ca', timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  { id: 'act-7', userId: 'user-9', action: 'viewed', resourceType: 'analytics', resourceId: 'report-weekly', details: 'Viewed weekly analytics report', territoryId: 'terr-hi', timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
  { id: 'act-8', userId: 'user-3', action: 'commented', resourceType: 'tickets', resourceId: 'TKT-4518', details: 'Added comment mentioning @Tim Buffington', territoryId: 'terr-or', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
];

interface NotificationContextType {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;

  // Activity log
  activityLog: ActivityLogItem[];
  addActivity: (activity: Omit<ActivityLogItem, 'id' | 'timestamp'>) => void;
  getActivityByResource: (resourceType: ResourceType, resourceId: string) => ActivityLogItem[];
  getActivityByUser: (userId: string) => ActivityLogItem[];
  getActivityByTerritory: (territoryId: string) => ActivityLogItem[];

  // Toast notifications (for real-time alerts)
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, duration?: number) => void;
  toasts: Toast[];
  dismissToast: (toastId: string) => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>(MOCK_ACTIVITY);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addActivity = useCallback((activity: Omit<ActivityLogItem, 'id' | 'timestamp'>) => {
    const newActivity: ActivityLogItem = {
      ...activity,
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setActivityLog(prev => [newActivity, ...prev]);
  }, []);

  const getActivityByResource = useCallback((resourceType: ResourceType, resourceId: string) => {
    return activityLog.filter(a => a.resourceType === resourceType && a.resourceId === resourceId);
  }, [activityLog]);

  const getActivityByUser = useCallback((userId: string) => {
    return activityLog.filter(a => a.userId === userId);
  }, [activityLog]);

  const getActivityByTerritory = useCallback((territoryId: string) => {
    return activityLog.filter(a => a.territoryId === territoryId);
  }, [activityLog]);

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, duration = 5000) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAllNotifications,
      activityLog,
      addActivity,
      getActivityByResource,
      getActivityByUser,
      getActivityByTerritory,
      showToast,
      toasts,
      dismissToast,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
