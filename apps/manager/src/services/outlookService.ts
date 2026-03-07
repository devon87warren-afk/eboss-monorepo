/**
 * Microsoft Graph API Integration Service for Outlook
 *
 * Handles authentication and sync for:
 * - Outlook Calendar Events
 * - Outlook Tasks (Microsoft To Do)
 * - Bidirectional sync with local database
 */

import {
  CalendarEvent,
  Task,
  OutlookEvent,
  OutlookTask,
  EventAttendee,
  EventType,
  TaskStatus,
  TaskPriority,
  SyncMetadata
} from '../types';

// Microsoft Graph API Configuration
const GRAPH_API_BASE_URL = 'https://graph.microsoft.com/v1.0';
const GRAPH_API_SCOPES = [
  'Calendars.ReadWrite',
  'Tasks.ReadWrite',
  'User.Read',
  'offline_access'
];

export class OutlookService {
  private accessToken: string | null = null;
  private tenantId: string | null = null;

  constructor() {
    // Load access token from localStorage if available
    this.accessToken = localStorage.getItem('outlook_access_token');
    this.tenantId = localStorage.getItem('outlook_tenant_id');
  }

  /**
   * Initialize MSAL (Microsoft Authentication Library) authentication
   * This should be called when user clicks "Connect Outlook"
   */
  async authenticate(): Promise<boolean> {
    try {
      // In production, you'll use @azure/msal-browser
      // For now, this is a placeholder that shows the OAuth flow

      const clientId = import.meta.env.VITE_OUTLOOK_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_OUTLOOK_REDIRECT_URI || window.location.origin;

      if (!clientId) {
        throw new Error('Outlook Client ID not configured. Please add VITE_OUTLOOK_CLIENT_ID to environment variables.');
      }

      // OAuth 2.0 Authorization Code Flow with PKCE
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(GRAPH_API_SCOPES.join(' '))}` +
        `&response_mode=query`;

      // Open OAuth popup or redirect
      window.location.href = authUrl;

      return true;
    } catch (error) {
      console.error('Outlook authentication failed:', error);
      return false;
    }
  }

  /**
   * Handle OAuth callback and exchange code for access token
   */
  async handleAuthCallback(code: string): Promise<void> {
    try {
      const clientId = import.meta.env.VITE_OUTLOOK_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_OUTLOOK_CLIENT_SECRET;
      const redirectUri = import.meta.env.VITE_OUTLOOK_REDIRECT_URI || window.location.origin;

      const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: GRAPH_API_SCOPES.join(' '),
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        this.accessToken = data.access_token;
        localStorage.setItem('outlook_access_token', data.access_token);

        if (data.refresh_token) {
          localStorage.setItem('outlook_refresh_token', data.refresh_token);
        }
      } else {
        throw new Error('Failed to get access token');
      }
    } catch (error) {
      console.error('Failed to exchange auth code for token:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated with Outlook
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Disconnect Outlook integration
   */
  disconnect(): void {
    this.accessToken = null;
    this.tenantId = null;
    localStorage.removeItem('outlook_access_token');
    localStorage.removeItem('outlook_refresh_token');
    localStorage.removeItem('outlook_tenant_id');
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  private async graphRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Outlook. Please authenticate first.');
    }

    const url = `${GRAPH_API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      await this.refreshAccessToken();
      // Retry request
      return this.graphRequest(endpoint, method, body);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Graph API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    const refreshToken = localStorage.getItem('outlook_refresh_token');

    if (!refreshToken) {
      throw new Error('No refresh token available. Please re-authenticate.');
    }

    const clientId = import.meta.env.VITE_OUTLOOK_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_OUTLOOK_CLIENT_SECRET;

    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: GRAPH_API_SCOPES.join(' '),
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      this.accessToken = data.access_token;
      localStorage.setItem('outlook_access_token', data.access_token);

      if (data.refresh_token) {
        localStorage.setItem('outlook_refresh_token', data.refresh_token);
      }
    } else {
      throw new Error('Failed to refresh access token');
    }
  }

  // ==================== CALENDAR OPERATIONS ====================

  /**
   * Fetch calendar events from Outlook
   */
  async getCalendarEvents(
    startDate?: string,
    endDate?: string
  ): Promise<OutlookEvent[]> {
    let endpoint = '/me/calendar/events';

    if (startDate && endDate) {
      endpoint += `?$filter=start/dateTime ge '${startDate}' and end/dateTime le '${endDate}'`;
    }

    endpoint += `${startDate && endDate ? '&' : '?'}$orderby=start/dateTime`;

    const response = await this.graphRequest<{ value: OutlookEvent[] }>(endpoint);
    return response.value;
  }

  /**
   * Create a new calendar event in Outlook
   */
  async createCalendarEvent(event: Partial<CalendarEvent>): Promise<OutlookEvent> {
    const outlookEvent = this.mapToOutlookEvent(event);

    return this.graphRequest<OutlookEvent>(
      '/me/calendar/events',
      'POST',
      outlookEvent
    );
  }

  /**
   * Update an existing calendar event in Outlook
   */
  async updateCalendarEvent(
    outlookId: string,
    event: Partial<CalendarEvent>
  ): Promise<OutlookEvent> {
    const outlookEvent = this.mapToOutlookEvent(event);

    return this.graphRequest<OutlookEvent>(
      `/me/calendar/events/${outlookId}`,
      'PATCH',
      outlookEvent
    );
  }

  /**
   * Delete a calendar event from Outlook
   */
  async deleteCalendarEvent(outlookId: string): Promise<void> {
    await this.graphRequest(
      `/me/calendar/events/${outlookId}`,
      'DELETE'
    );
  }

  // ==================== TASK OPERATIONS ====================

  /**
   * Fetch tasks from Microsoft To Do
   */
  async getTasks(listId?: string): Promise<OutlookTask[]> {
    const targetListId = listId || await this.getDefaultTaskListId();

    const response = await this.graphRequest<{ value: OutlookTask[] }>(
      `/me/todo/lists/${targetListId}/tasks`
    );

    return response.value;
  }

  /**
   * Create a new task in Microsoft To Do
   */
  async createTask(task: Partial<Task>): Promise<OutlookTask> {
    const listId = await this.getDefaultTaskListId();
    const outlookTask = this.mapToOutlookTask(task);

    return this.graphRequest<OutlookTask>(
      `/me/todo/lists/${listId}/tasks`,
      'POST',
      outlookTask
    );
  }

  /**
   * Update an existing task in Microsoft To Do
   */
  async updateTask(
    outlookId: string,
    task: Partial<Task>,
    listId?: string
  ): Promise<OutlookTask> {
    const targetListId = listId || await this.getDefaultTaskListId();
    const outlookTask = this.mapToOutlookTask(task);

    return this.graphRequest<OutlookTask>(
      `/me/todo/lists/${targetListId}/tasks/${outlookId}`,
      'PATCH',
      outlookTask
    );
  }

  /**
   * Delete a task from Microsoft To Do
   */
  async deleteTask(outlookId: string, listId?: string): Promise<void> {
    const targetListId = listId || await this.getDefaultTaskListId();

    await this.graphRequest(
      `/me/todo/lists/${targetListId}/tasks/${outlookId}`,
      'DELETE'
    );
  }

  /**
   * Get the default task list ID (usually "Tasks")
   */
  private async getDefaultTaskListId(): Promise<string> {
    const cachedId = localStorage.getItem('outlook_default_task_list_id');

    if (cachedId) {
      return cachedId;
    }

    const response = await this.graphRequest<{ value: Array<{ id: string; displayName: string }> }>(
      '/me/todo/lists'
    );

    // Find "Tasks" list or use the first one
    const defaultList = response.value.find(list => list.displayName === 'Tasks') || response.value[0];

    if (!defaultList) {
      throw new Error('No task lists found in Microsoft To Do');
    }

    localStorage.setItem('outlook_default_task_list_id', defaultList.id);
    return defaultList.id;
  }

  // ==================== MAPPING FUNCTIONS ====================

  /**
   * Map CalendarEvent to Outlook Event format
   */
  private mapToOutlookEvent(event: Partial<CalendarEvent>): Partial<OutlookEvent> {
    return {
      subject: event.title,
      bodyPreview: event.description,
      start: event.startTime ? {
        dateTime: event.startTime,
        timeZone: 'UTC'
      } : undefined,
      end: event.endTime ? {
        dateTime: event.endTime,
        timeZone: 'UTC'
      } : undefined,
      location: event.location ? {
        displayName: event.location
      } : undefined,
      isAllDay: event.isAllDay || false,
      attendees: event.attendees?.map(a => ({
        emailAddress: {
          name: a.name,
          address: a.email
        },
        type: a.isOrganizer ? 'required' : 'optional'
      })),
      reminder: event.reminderMinutes || 15,
    };
  }

  /**
   * Map Task to Outlook Task format
   */
  private mapToOutlookTask(task: Partial<Task>): Partial<OutlookTask> {
    return {
      title: task.title || '',
      body: task.description ? {
        content: task.description
      } : undefined,
      status: this.mapTaskStatus(task.status),
      importance: this.mapTaskPriority(task.priority),
      dueDateTime: task.dueDate ? {
        dateTime: task.dueDate,
        timeZone: 'UTC'
      } : undefined,
      reminderDateTime: task.reminderDateTime ? {
        dateTime: task.reminderDateTime,
        timeZone: 'UTC'
      } : undefined,
    };
  }

  /**
   * Map local task status to Outlook task status
   */
  private mapTaskStatus(status?: TaskStatus): string {
    const mapping: Record<TaskStatus, string> = {
      notStarted: 'notStarted',
      inProgress: 'inProgress',
      completed: 'completed',
      waitingOnOthers: 'waitingOnOthers',
      deferred: 'deferred'
    };

    return status ? mapping[status] : 'notStarted';
  }

  /**
   * Map local task priority to Outlook task importance
   */
  private mapTaskPriority(priority?: TaskPriority): string {
    const mapping: Record<TaskPriority, string> = {
      low: 'low',
      medium: 'normal',
      high: 'high',
      urgent: 'high'
    };

    return priority ? mapping[priority] : 'normal';
  }

  /**
   * Map Outlook Event to CalendarEvent format
   */
  mapOutlookEventToLocal(outlookEvent: OutlookEvent, userId: string): CalendarEvent {
    return {
      id: '', // Will be generated by database
      title: outlookEvent.subject,
      description: outlookEvent.bodyPreview,
      eventType: 'meeting' as EventType,
      status: 'confirmed',
      startTime: outlookEvent.start.dateTime,
      endTime: outlookEvent.end.dateTime,
      isAllDay: outlookEvent.isAllDay,
      location: outlookEvent.location?.displayName,
      attendees: outlookEvent.attendees?.map(a => ({
        email: a.emailAddress.address,
        name: a.emailAddress.name,
        status: this.mapAttendeeStatus(a.status.response),
        isOrganizer: false
      })) || [],
      organizer: {
        email: outlookEvent.organizer.emailAddress.address,
        name: outlookEvent.organizer.emailAddress.name,
        status: 'accepted',
        isOrganizer: true
      },
      reminderMinutes: outlookEvent.reminder,
      createdByUserId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: outlookEvent.lastModifiedDateTime,
      syncMetadata: {
        localId: '',
        outlookId: outlookEvent.id,
        lastSyncedAt: new Date().toISOString(),
        lastModifiedAt: outlookEvent.lastModifiedDateTime,
        syncStatus: 'synced',
        sourceOfTruth: 'outlook'
      }
    };
  }

  /**
   * Map Outlook Task to Task format
   */
  mapOutlookTaskToLocal(outlookTask: OutlookTask, userId: string): Task {
    return {
      id: '', // Will be generated by database
      title: outlookTask.title,
      description: outlookTask.body?.content,
      status: this.mapOutlookTaskStatus(outlookTask.status),
      priority: this.mapOutlookTaskPriority(outlookTask.importance),
      dueDate: outlookTask.dueDateTime?.dateTime,
      reminderDateTime: outlookTask.reminderDateTime?.dateTime,
      completedDateTime: outlookTask.completedDateTime?.dateTime,
      createdByUserId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: outlookTask.lastModifiedDateTime,
      syncMetadata: {
        localId: '',
        outlookId: outlookTask.id,
        lastSyncedAt: new Date().toISOString(),
        lastModifiedAt: outlookTask.lastModifiedDateTime,
        syncStatus: 'synced',
        sourceOfTruth: 'outlook'
      }
    };
  }

  /**
   * Map Outlook attendee status to local format
   */
  private mapAttendeeStatus(outlookStatus: string): EventAttendee['status'] {
    const mapping: Record<string, EventAttendee['status']> = {
      accepted: 'accepted',
      declined: 'declined',
      tentativelyAccepted: 'tentative',
      notResponded: 'needsAction',
      organizer: 'accepted'
    };

    return mapping[outlookStatus] || 'needsAction';
  }

  /**
   * Map Outlook task status to local format
   */
  private mapOutlookTaskStatus(status: string): TaskStatus {
    const mapping: Record<string, TaskStatus> = {
      notStarted: 'notStarted',
      inProgress: 'inProgress',
      completed: 'completed',
      waitingOnOthers: 'waitingOnOthers',
      deferred: 'deferred'
    };

    return mapping[status] as TaskStatus || 'notStarted';
  }

  /**
   * Map Outlook task importance to local priority
   */
  private mapOutlookTaskPriority(importance: string): TaskPriority {
    const mapping: Record<string, TaskPriority> = {
      low: 'low',
      normal: 'medium',
      high: 'high'
    };

    return mapping[importance] as TaskPriority || 'medium';
  }
}

// Export singleton instance
export const outlookService = new OutlookService();
