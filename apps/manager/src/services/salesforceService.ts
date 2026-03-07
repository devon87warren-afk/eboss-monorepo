/**
 * Salesforce REST API Integration Service
 *
 * Handles authentication and sync for:
 * - Salesforce Events (Calendar)
 * - Salesforce Tasks
 * - Account/Contact relationships
 * - Bidirectional sync with local database
 */

import {
  CalendarEvent,
  Task,
  SalesforceEvent,
  SalesforceTask,
  EventType,
  TaskStatus,
  TaskPriority,
} from '../types';

// Salesforce API Configuration
const SF_API_VERSION = 'v59.0';

export class SalesforceService {
  private accessToken: string | null = null;
  private instanceUrl: string | null = null;
  private refreshToken: string | null = null;
  private userId: string | null = null;

  constructor() {
    // Load from localStorage if available
    this.accessToken = localStorage.getItem('sf_access_token');
    this.instanceUrl = localStorage.getItem('sf_instance_url');
    this.refreshToken = localStorage.getItem('sf_refresh_token');
    this.userId = localStorage.getItem('sf_user_id');
  }

  /**
   * Initialize Salesforce OAuth authentication
   */
  async authenticate(): Promise<boolean> {
    try {
      const clientId = import.meta.env.VITE_SF_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_SF_REDIRECT_URI || `${window.location.origin}/sf-callback`;

      if (!clientId) {
        throw new Error('Salesforce Client ID not configured. Please add VITE_SF_CLIENT_ID to environment variables.');
      }

      // OAuth 2.0 Authorization Flow
      const authUrl = `https://login.salesforce.com/services/oauth2/authorize?` +
        `response_type=code` +
        `&client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=api refresh_token`;

      // For sandbox, use: https://test.salesforce.com/services/oauth2/authorize
      // Can be configured via VITE_SF_SANDBOX=true

      const isSandbox = import.meta.env.VITE_SF_SANDBOX === 'true';
      const finalAuthUrl = isSandbox
        ? authUrl.replace('login.salesforce.com', 'test.salesforce.com')
        : authUrl;

      window.location.href = finalAuthUrl;

      return true;
    } catch (error) {
      console.error('Salesforce authentication failed:', error);
      return false;
    }
  }

  /**
   * Handle OAuth callback and exchange code for access token
   */
  async handleAuthCallback(code: string): Promise<void> {
    try {
      const clientId = import.meta.env.VITE_SF_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_SF_CLIENT_SECRET;
      const redirectUri = import.meta.env.VITE_SF_REDIRECT_URI || `${window.location.origin}/sf-callback`;
      const isSandbox = import.meta.env.VITE_SF_SANDBOX === 'true';

      const tokenUrl = isSandbox
        ? 'https://test.salesforce.com/services/oauth2/token'
        : 'https://login.salesforce.com/services/oauth2/token';

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        this.accessToken = data.access_token;
        this.instanceUrl = data.instance_url;
        this.refreshToken = data.refresh_token;
        this.userId = data.id.split('/').pop();

        localStorage.setItem('sf_access_token', data.access_token);
        localStorage.setItem('sf_instance_url', data.instance_url);
        localStorage.setItem('sf_refresh_token', data.refresh_token);
        localStorage.setItem('sf_user_id', this.userId!);
      } else {
        throw new Error('Failed to get Salesforce access token');
      }
    } catch (error) {
      console.error('Failed to exchange Salesforce auth code:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated with Salesforce
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null && this.instanceUrl !== null;
  }

  /**
   * Disconnect Salesforce integration
   */
  disconnect(): void {
    this.accessToken = null;
    this.instanceUrl = null;
    this.refreshToken = null;
    this.userId = null;
    localStorage.removeItem('sf_access_token');
    localStorage.removeItem('sf_instance_url');
    localStorage.removeItem('sf_refresh_token');
    localStorage.removeItem('sf_user_id');
  }

  /**
   * Make authenticated request to Salesforce REST API
   */
  private async sfRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    if (!this.accessToken || !this.instanceUrl) {
      throw new Error('Not authenticated with Salesforce. Please authenticate first.');
    }

    const url = `${this.instanceUrl}/services/data/${SF_API_VERSION}${endpoint}`;

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
      return this.sfRequest(endpoint, method, body);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Salesforce API error: ${error[0]?.message || response.statusText}`);
    }

    if (method === 'DELETE') {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available. Please re-authenticate.');
    }

    const clientId = import.meta.env.VITE_SF_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SF_CLIENT_SECRET;
    const isSandbox = import.meta.env.VITE_SF_SANDBOX === 'true';

    const tokenUrl = isSandbox
      ? 'https://test.salesforce.com/services/oauth2/token'
      : 'https://login.salesforce.com/services/oauth2/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      this.accessToken = data.access_token;
      localStorage.setItem('sf_access_token', data.access_token);
    } else {
      throw new Error('Failed to refresh Salesforce access token');
    }
  }

  // ==================== EVENT OPERATIONS ====================

  /**
   * Fetch events from Salesforce
   */
  async getEvents(startDate?: string, endDate?: string): Promise<SalesforceEvent[]> {
    let query = `SELECT Id, Subject, Description, StartDateTime, EndDateTime, Location, ` +
      `IsAllDayEvent, WhoId, WhatId, OwnerId, ActivityDate, ReminderDateTime, ` +
      `IsRecurrence, RecurrencePattern, LastModifiedDate FROM Event`;

    if (startDate && endDate) {
      query += ` WHERE StartDateTime >= ${startDate} AND EndDateTime <= ${endDate}`;
    }

    query += ` ORDER BY StartDateTime ASC`;

    const response = await this.sfRequest<{ records: SalesforceEvent[] }>(
      `/query?q=${encodeURIComponent(query)}`
    );

    return response.records;
  }

  /**
   * Create a new event in Salesforce
   */
  async createEvent(event: Partial<CalendarEvent>): Promise<SalesforceEvent> {
    const sfEvent = this.mapToSalesforceEvent(event);

    const response = await this.sfRequest<{ id: string }>(
      '/sobjects/Event',
      'POST',
      sfEvent
    );

    // Fetch the created event to get all fields
    return this.getEventById(response.id);
  }

  /**
   * Update an existing event in Salesforce
   */
  async updateEvent(
    salesforceId: string,
    event: Partial<CalendarEvent>
  ): Promise<SalesforceEvent> {
    const sfEvent = this.mapToSalesforceEvent(event);

    await this.sfRequest(
      `/sobjects/Event/${salesforceId}`,
      'PATCH',
      sfEvent
    );

    // Fetch the updated event
    return this.getEventById(salesforceId);
  }

  /**
   * Delete an event from Salesforce
   */
  async deleteEvent(salesforceId: string): Promise<void> {
    await this.sfRequest(
      `/sobjects/Event/${salesforceId}`,
      'DELETE'
    );
  }

  /**
   * Get a single event by ID
   */
  private async getEventById(id: string): Promise<SalesforceEvent> {
    return this.sfRequest<SalesforceEvent>(
      `/sobjects/Event/${id}`
    );
  }

  // ==================== TASK OPERATIONS ====================

  /**
   * Fetch tasks from Salesforce
   */
  async getTasks(includeCompleted: boolean = false): Promise<SalesforceTask[]> {
    let query = `SELECT Id, Subject, Description, Status, Priority, ActivityDate, ` +
      `ReminderDateTime, WhoId, WhatId, OwnerId, IsRecurrence, ` +
      `CompletedDateTime, LastModifiedDate FROM Task`;

    if (!includeCompleted) {
      query += ` WHERE Status != 'Completed'`;
    }

    query += ` ORDER BY ActivityDate ASC`;

    const response = await this.sfRequest<{ records: SalesforceTask[] }>(
      `/query?q=${encodeURIComponent(query)}`
    );

    return response.records;
  }

  /**
   * Create a new task in Salesforce
   */
  async createTask(task: Partial<Task>): Promise<SalesforceTask> {
    const sfTask = this.mapToSalesforceTask(task);

    const response = await this.sfRequest<{ id: string }>(
      '/sobjects/Task',
      'POST',
      sfTask
    );

    // Fetch the created task to get all fields
    return this.getTaskById(response.id);
  }

  /**
   * Update an existing task in Salesforce
   */
  async updateTask(
    salesforceId: string,
    task: Partial<Task>
  ): Promise<SalesforceTask> {
    const sfTask = this.mapToSalesforceTask(task);

    await this.sfRequest(
      `/sobjects/Task/${salesforceId}`,
      'PATCH',
      sfTask
    );

    // Fetch the updated task
    return this.getTaskById(salesforceId);
  }

  /**
   * Delete a task from Salesforce
   */
  async deleteTask(salesforceId: string): Promise<void> {
    await this.sfRequest(
      `/sobjects/Task/${salesforceId}`,
      'DELETE'
    );
  }

  /**
   * Get a single task by ID
   */
  private async getTaskById(id: string): Promise<SalesforceTask> {
    return this.sfRequest<SalesforceTask>(
      `/sobjects/Task/${id}`
    );
  }

  // ==================== MAPPING FUNCTIONS ====================

  /**
   * Map CalendarEvent to Salesforce Event format
   */
  private mapToSalesforceEvent(event: Partial<CalendarEvent>): Partial<SalesforceEvent> {
    return {
      Subject: event.title,
      Description: event.description,
      StartDateTime: event.startTime,
      EndDateTime: event.endTime,
      Location: event.location,
      IsAllDayEvent: event.isAllDay || false,
      WhatId: event.relatedAccountId, // Link to Account
      ReminderDateTime: event.reminderMinutes
        ? this.calculateReminderDateTime(event.startTime!, event.reminderMinutes)
        : undefined,
    };
  }

  /**
   * Map Task to Salesforce Task format
   */
  private mapToSalesforceTask(task: Partial<Task>): Partial<SalesforceTask> {
    return {
      Subject: task.title,
      Description: task.description,
      Status: this.mapTaskStatus(task.status),
      Priority: this.mapTaskPriority(task.priority),
      ActivityDate: task.dueDate ? task.dueDate.split('T')[0] : undefined,
      ReminderDateTime: task.reminderDateTime,
      WhatId: task.relatedAccountId, // Link to Account
      CompletedDateTime: task.completedDateTime,
    };
  }

  /**
   * Map Salesforce Event to CalendarEvent format
   */
  mapSalesforceEventToLocal(sfEvent: SalesforceEvent, userId: string): CalendarEvent {
    return {
      id: '', // Will be generated by database
      title: sfEvent.Subject,
      description: sfEvent.Description,
      eventType: 'meeting' as EventType,
      status: 'confirmed',
      startTime: sfEvent.StartDateTime,
      endTime: sfEvent.EndDateTime,
      isAllDay: sfEvent.IsAllDayEvent,
      location: sfEvent.Location,
      attendees: [],
      organizer: {
        email: '',
        name: 'Salesforce User',
        status: 'accepted',
        isOrganizer: true
      },
      relatedAccountId: sfEvent.WhatId,
      createdByUserId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: sfEvent.LastModifiedDate,
      syncMetadata: {
        localId: '',
        salesforceId: sfEvent.Id,
        lastSyncedAt: new Date().toISOString(),
        lastModifiedAt: sfEvent.LastModifiedDate,
        syncStatus: 'synced',
        sourceOfTruth: 'salesforce'
      }
    };
  }

  /**
   * Map Salesforce Task to Task format
   */
  mapSalesforceTaskToLocal(sfTask: SalesforceTask, userId: string): Task {
    return {
      id: '', // Will be generated by database
      title: sfTask.Subject,
      description: sfTask.Description,
      status: this.mapSalesforceTaskStatus(sfTask.Status),
      priority: this.mapSalesforceTaskPriority(sfTask.Priority),
      dueDate: sfTask.ActivityDate,
      reminderDateTime: sfTask.ReminderDateTime,
      completedDateTime: sfTask.CompletedDateTime,
      relatedAccountId: sfTask.WhatId,
      createdByUserId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: sfTask.LastModifiedDate,
      syncMetadata: {
        localId: '',
        salesforceId: sfTask.Id,
        lastSyncedAt: new Date().toISOString(),
        lastModifiedAt: sfTask.LastModifiedDate,
        syncStatus: 'synced',
        sourceOfTruth: 'salesforce'
      }
    };
  }

  /**
   * Map local task status to Salesforce status
   */
  private mapTaskStatus(status?: TaskStatus): string {
    const mapping: Record<TaskStatus, string> = {
      notStarted: 'Not Started',
      inProgress: 'In Progress',
      completed: 'Completed',
      waitingOnOthers: 'Waiting on someone else',
      deferred: 'Deferred'
    };

    return status ? mapping[status] : 'Not Started';
  }

  /**
   * Map local task priority to Salesforce priority
   */
  private mapTaskPriority(priority?: TaskPriority): string {
    const mapping: Record<TaskPriority, string> = {
      low: 'Low',
      medium: 'Normal',
      high: 'High',
      urgent: 'High'
    };

    return priority ? mapping[priority] : 'Normal';
  }

  /**
   * Map Salesforce task status to local format
   */
  private mapSalesforceTaskStatus(status: string): TaskStatus {
    const mapping: Record<string, TaskStatus> = {
      'Not Started': 'notStarted',
      'In Progress': 'inProgress',
      'Completed': 'completed',
      'Waiting on someone else': 'waitingOnOthers',
      'Deferred': 'deferred'
    };

    return mapping[status] as TaskStatus || 'notStarted';
  }

  /**
   * Map Salesforce task priority to local format
   */
  private mapSalesforceTaskPriority(priority: string): TaskPriority {
    const mapping: Record<string, TaskPriority> = {
      'Low': 'low',
      'Normal': 'medium',
      'High': 'high'
    };

    return mapping[priority] as TaskPriority || 'medium';
  }

  /**
   * Calculate reminder datetime from start time and minutes before
   */
  private calculateReminderDateTime(startTime: string, minutesBefore: number): string {
    const start = new Date(startTime);
    const reminder = new Date(start.getTime() - minutesBefore * 60000);
    return reminder.toISOString();
  }

  /**
   * Search for accounts by name (for linking events/tasks)
   */
  async searchAccounts(searchTerm: string): Promise<Array<{ id: string; name: string }>> {
    const query = `SELECT Id, Name FROM Account WHERE Name LIKE '%${searchTerm}%' LIMIT 10`;

    const response = await this.sfRequest<{ records: Array<{ Id: string; Name: string }> }>(
      `/query?q=${encodeURIComponent(query)}`
    );

    return response.records.map(acc => ({ id: acc.Id, name: acc.Name }));
  }

  /**
   * Search for contacts by name (for linking events/tasks)
   */
  async searchContacts(searchTerm: string): Promise<Array<{ id: string; name: string; email: string }>> {
    const query = `SELECT Id, Name, Email FROM Contact WHERE Name LIKE '%${searchTerm}%' LIMIT 10`;

    const response = await this.sfRequest<{ records: Array<{ Id: string; Name: string; Email: string }> }>(
      `/query?q=${encodeURIComponent(query)}`
    );

    return response.records.map(contact => ({
      id: contact.Id,
      name: contact.Name,
      email: contact.Email
    }));
  }
}

// Export singleton instance
export const salesforceService = new SalesforceService();
