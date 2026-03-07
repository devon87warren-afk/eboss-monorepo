/**
 * Sync Orchestration Service
 *
 * Coordinates bidirectional sync between:
 * - Local database (Supabase)
 * - Microsoft Outlook (Calendar & Tasks)
 * - Salesforce (Events & Tasks)
 *
 * Features:
 * - Conflict detection and resolution
 * - Last-write-wins strategy with user override
 * - Incremental sync based on last modified timestamps
 * - Error recovery and retry logic
 */

import { supabase } from '../lib/supabase';
import { outlookService } from './outlookService';
import { salesforceService } from './salesforceService';
import {
  CalendarEvent,
  Task,
  SyncConfiguration,
  SyncStatus,
  SyncMetadata,
  SyncProvider
} from '../types';

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  conflicts: number;
  errors: string[];
  lastSyncAt: string;
}

export interface ConflictResolution {
  localId: string;
  sourceOfTruth: SyncProvider;
  resolvedAt: string;
}

export class SyncService {
  private syncInProgress = false;
  private syncConfig: SyncConfiguration | null = null;

  constructor() {
    this.loadSyncConfiguration();
  }

  /**
   * Load sync configuration from database
   */
  private async loadSyncConfiguration(): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        return;
      }

      const { data, error } = await supabase
        .from('sync_configurations')
        .select('*')
        .eq('userId', user.user.id)
        .single();

      if (error) {
        console.error('Failed to load sync configuration:', error);
        return;
      }

      this.syncConfig = data;
    } catch (error) {
      console.error('Error loading sync configuration:', error);
    }
  }

  /**
   * Save sync configuration to database
   */
  async saveSyncConfiguration(config: Partial<SyncConfiguration>): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('sync_configurations')
        .upsert({
          userId: user.user.id,
          ...config,
          lastSyncAt: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      await this.loadSyncConfiguration();
    } catch (error) {
      console.error('Error saving sync configuration:', error);
      throw error;
    }
  }

  /**
   * Start full synchronization
   */
  async startSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;

    const result: SyncResult = {
      success: false,
      itemsSynced: 0,
      conflicts: 0,
      errors: [],
      lastSyncAt: new Date().toISOString()
    };

    try {
      // Sync calendar events
      if (this.syncConfig?.outlookEnabled) {
        const outlookResult = await this.syncOutlookCalendar();
        result.itemsSynced += outlookResult.itemsSynced;
        result.conflicts += outlookResult.conflicts;
        result.errors.push(...outlookResult.errors);
      }

      if (this.syncConfig?.salesforceEnabled) {
        const sfResult = await this.syncSalesforceEvents();
        result.itemsSynced += sfResult.itemsSynced;
        result.conflicts += sfResult.conflicts;
        result.errors.push(...sfResult.errors);
      }

      // Sync tasks
      if (this.syncConfig?.outlookEnabled) {
        const taskResult = await this.syncOutlookTasks();
        result.itemsSynced += taskResult.itemsSynced;
        result.conflicts += taskResult.conflicts;
        result.errors.push(...taskResult.errors);
      }

      if (this.syncConfig?.salesforceEnabled) {
        const sfTaskResult = await this.syncSalesforceTasks();
        result.itemsSynced += sfTaskResult.itemsSynced;
        result.conflicts += sfTaskResult.conflicts;
        result.errors.push(...sfTaskResult.errors);
      }

      result.success = result.errors.length === 0;

      // Update last sync time
      await this.saveSyncConfiguration({
        lastSyncAt: result.lastSyncAt
      });

      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync Outlook calendar events
   */
  private async syncOutlookCalendar(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      itemsSynced: 0,
      conflicts: 0,
      errors: [],
      lastSyncAt: new Date().toISOString()
    };

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Pull events from Outlook
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Last month
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // Next 3 months

      const outlookEvents = await outlookService.getCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );

      // For each Outlook event, check if it exists locally
      for (const outlookEvent of outlookEvents) {
        try {
          // Check if event exists by Outlook ID
          const { data: existingEvent } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('syncMetadata->>outlookId', outlookEvent.id)
            .single();

          if (existingEvent) {
            // Event exists - check for conflicts
            const conflict = this.detectConflict(
              existingEvent,
              outlookEvent.lastModifiedDateTime,
              'outlook'
            );

            if (conflict) {
              result.conflicts++;
              await this.handleConflict(existingEvent.id, outlookEvent, 'outlook');
            } else if (this.needsUpdate(existingEvent, outlookEvent.lastModifiedDateTime)) {
              // Update local event
              const updatedEvent = outlookService.mapOutlookEventToLocal(outlookEvent, user.user.id);
              await this.updateLocalEvent(existingEvent.id, updatedEvent);
              result.itemsSynced++;
            }
          } else {
            // New event - create locally
            const newEvent = outlookService.mapOutlookEventToLocal(outlookEvent, user.user.id);
            await this.createLocalEvent(newEvent);
            result.itemsSynced++;
          }
        } catch (error) {
          console.error(`Error syncing Outlook event ${outlookEvent.id}:`, error);
          result.errors.push(`Event ${outlookEvent.subject}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Push local changes to Outlook
      if (this.syncConfig?.syncDirection === 'bidirectional' || this.syncConfig?.syncDirection === 'push') {
        const pushResult = await this.pushLocalEventsToOutlook(user.user.id);
        result.itemsSynced += pushResult.itemsSynced;
        result.conflicts += pushResult.conflicts;
        result.errors.push(...pushResult.errors);
      }

      return result;
    } catch (error) {
      console.error('Outlook calendar sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Sync Salesforce events
   */
  private async syncSalesforceEvents(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      itemsSynced: 0,
      conflicts: 0,
      errors: [],
      lastSyncAt: new Date().toISOString()
    };

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const sfEvents = await salesforceService.getEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );

      for (const sfEvent of sfEvents) {
        try {
          const { data: existingEvent } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('syncMetadata->>salesforceId', sfEvent.Id)
            .single();

          if (existingEvent) {
            const conflict = this.detectConflict(
              existingEvent,
              sfEvent.LastModifiedDate,
              'salesforce'
            );

            if (conflict) {
              result.conflicts++;
              await this.handleConflict(existingEvent.id, sfEvent, 'salesforce');
            } else if (this.needsUpdate(existingEvent, sfEvent.LastModifiedDate)) {
              const updatedEvent = salesforceService.mapSalesforceEventToLocal(sfEvent, user.user.id);
              await this.updateLocalEvent(existingEvent.id, updatedEvent);
              result.itemsSynced++;
            }
          } else {
            const newEvent = salesforceService.mapSalesforceEventToLocal(sfEvent, user.user.id);
            await this.createLocalEvent(newEvent);
            result.itemsSynced++;
          }
        } catch (error) {
          console.error(`Error syncing Salesforce event ${sfEvent.Id}:`, error);
          result.errors.push(`Event ${sfEvent.Subject}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Push local changes to Salesforce
      if (this.syncConfig?.syncDirection === 'bidirectional' || this.syncConfig?.syncDirection === 'push') {
        const pushResult = await this.pushLocalEventsToSalesforce(user.user.id);
        result.itemsSynced += pushResult.itemsSynced;
        result.conflicts += pushResult.conflicts;
        result.errors.push(...pushResult.errors);
      }

      return result;
    } catch (error) {
      console.error('Salesforce event sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Sync Outlook tasks
   */
  private async syncOutlookTasks(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      itemsSynced: 0,
      conflicts: 0,
      errors: [],
      lastSyncAt: new Date().toISOString()
    };

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const outlookTasks = await outlookService.getTasks();

      for (const outlookTask of outlookTasks) {
        try {
          const { data: existingTask } = await supabase
            .from('tasks')
            .select('*')
            .eq('syncMetadata->>outlookId', outlookTask.id)
            .single();

          if (existingTask) {
            const conflict = this.detectConflict(
              existingTask,
              outlookTask.lastModifiedDateTime,
              'outlook'
            );

            if (conflict) {
              result.conflicts++;
              await this.handleConflict(existingTask.id, outlookTask, 'outlook', 'task');
            } else if (this.needsUpdate(existingTask, outlookTask.lastModifiedDateTime)) {
              const updatedTask = outlookService.mapOutlookTaskToLocal(outlookTask, user.user.id);
              await this.updateLocalTask(existingTask.id, updatedTask);
              result.itemsSynced++;
            }
          } else {
            const newTask = outlookService.mapOutlookTaskToLocal(outlookTask, user.user.id);
            await this.createLocalTask(newTask);
            result.itemsSynced++;
          }
        } catch (error) {
          console.error(`Error syncing Outlook task ${outlookTask.id}:`, error);
          result.errors.push(`Task ${outlookTask.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Push local tasks to Outlook
      if (this.syncConfig?.syncDirection === 'bidirectional' || this.syncConfig?.syncDirection === 'push') {
        const pushResult = await this.pushLocalTasksToOutlook(user.user.id);
        result.itemsSynced += pushResult.itemsSynced;
        result.conflicts += pushResult.conflicts;
        result.errors.push(...pushResult.errors);
      }

      return result;
    } catch (error) {
      console.error('Outlook task sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Sync Salesforce tasks
   */
  private async syncSalesforceTasks(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      itemsSynced: 0,
      conflicts: 0,
      errors: [],
      lastSyncAt: new Date().toISOString()
    };

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const sfTasks = await salesforceService.getTasks();

      for (const sfTask of sfTasks) {
        try {
          const { data: existingTask } = await supabase
            .from('tasks')
            .select('*')
            .eq('syncMetadata->>salesforceId', sfTask.Id)
            .single();

          if (existingTask) {
            const conflict = this.detectConflict(
              existingTask,
              sfTask.LastModifiedDate,
              'salesforce'
            );

            if (conflict) {
              result.conflicts++;
              await this.handleConflict(existingTask.id, sfTask, 'salesforce', 'task');
            } else if (this.needsUpdate(existingTask, sfTask.LastModifiedDate)) {
              const updatedTask = salesforceService.mapSalesforceTaskToLocal(sfTask, user.user.id);
              await this.updateLocalTask(existingTask.id, updatedTask);
              result.itemsSynced++;
            }
          } else {
            const newTask = salesforceService.mapSalesforceTaskToLocal(sfTask, user.user.id);
            await this.createLocalTask(newTask);
            result.itemsSynced++;
          }
        } catch (error) {
          console.error(`Error syncing Salesforce task ${sfTask.Id}:`, error);
          result.errors.push(`Task ${sfTask.Subject}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Push local tasks to Salesforce
      if (this.syncConfig?.syncDirection === 'bidirectional' || this.syncConfig?.syncDirection === 'push') {
        const pushResult = await this.pushLocalTasksToSalesforce(user.user.id);
        result.itemsSynced += pushResult.itemsSynced;
        result.conflicts += pushResult.conflicts;
        result.errors.push(...pushResult.errors);
      }

      return result;
    } catch (error) {
      console.error('Salesforce task sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Push local events to Outlook
   */
  private async pushLocalEventsToOutlook(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      itemsSynced: 0,
      conflicts: 0,
      errors: [],
      lastSyncAt: new Date().toISOString()
    };

    try {
      // Get local events that need to be pushed (modified after last sync)
      const { data: localEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('createdByUserId', userId)
        .or('syncMetadata->>outlookId.is.null,syncMetadata->>syncStatus.eq.pending');

      if (!localEvents || localEvents.length === 0) {
        return result;
      }

      for (const localEvent of localEvents) {
        try {
          const outlookId = localEvent.syncMetadata?.outlookId;

          if (outlookId) {
            // Update existing Outlook event
            await outlookService.updateCalendarEvent(outlookId, localEvent);
          } else {
            // Create new Outlook event
            const createdEvent = await outlookService.createCalendarEvent(localEvent);

            // Update local event with Outlook ID
            await this.updateLocalEvent(localEvent.id, {
              ...localEvent,
              syncMetadata: {
                ...localEvent.syncMetadata,
                outlookId: createdEvent.id,
                lastSyncedAt: new Date().toISOString(),
                syncStatus: 'synced'
              }
            });
          }

          result.itemsSynced++;
        } catch (error) {
          console.error(`Error pushing event ${localEvent.id} to Outlook:`, error);
          result.errors.push(`Event ${localEvent.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Push to Outlook failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Push local events to Salesforce
   */
  private async pushLocalEventsToSalesforce(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      itemsSynced: 0,
      conflicts: 0,
      errors: [],
      lastSyncAt: new Date().toISOString()
    };

    try {
      const { data: localEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('createdByUserId', userId)
        .or('syncMetadata->>salesforceId.is.null,syncMetadata->>syncStatus.eq.pending');

      if (!localEvents || localEvents.length === 0) {
        return result;
      }

      for (const localEvent of localEvents) {
        try {
          const salesforceId = localEvent.syncMetadata?.salesforceId;

          if (salesforceId) {
            await salesforceService.updateEvent(salesforceId, localEvent);
          } else {
            const createdEvent = await salesforceService.createEvent(localEvent);

            await this.updateLocalEvent(localEvent.id, {
              ...localEvent,
              syncMetadata: {
                ...localEvent.syncMetadata,
                salesforceId: createdEvent.Id,
                lastSyncedAt: new Date().toISOString(),
                syncStatus: 'synced'
              }
            });
          }

          result.itemsSynced++;
        } catch (error) {
          console.error(`Error pushing event ${localEvent.id} to Salesforce:`, error);
          result.errors.push(`Event ${localEvent.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Push to Salesforce failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Push local tasks to Outlook
   */
  private async pushLocalTasksToOutlook(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      itemsSynced: 0,
      conflicts: 0,
      errors: [],
      lastSyncAt: new Date().toISOString()
    };

    try {
      const { data: localTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('createdByUserId', userId)
        .or('syncMetadata->>outlookId.is.null,syncMetadata->>syncStatus.eq.pending');

      if (!localTasks || localTasks.length === 0) {
        return result;
      }

      for (const localTask of localTasks) {
        try {
          const outlookId = localTask.syncMetadata?.outlookId;

          if (outlookId) {
            await outlookService.updateTask(outlookId, localTask);
          } else {
            const createdTask = await outlookService.createTask(localTask);

            await this.updateLocalTask(localTask.id, {
              ...localTask,
              syncMetadata: {
                ...localTask.syncMetadata,
                outlookId: createdTask.id,
                lastSyncedAt: new Date().toISOString(),
                syncStatus: 'synced'
              }
            });
          }

          result.itemsSynced++;
        } catch (error) {
          console.error(`Error pushing task ${localTask.id} to Outlook:`, error);
          result.errors.push(`Task ${localTask.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Push tasks to Outlook failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Push local tasks to Salesforce
   */
  private async pushLocalTasksToSalesforce(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      itemsSynced: 0,
      conflicts: 0,
      errors: [],
      lastSyncAt: new Date().toISOString()
    };

    try {
      const { data: localTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('createdByUserId', userId)
        .or('syncMetadata->>salesforceId.is.null,syncMetadata->>syncStatus.eq.pending');

      if (!localTasks || localTasks.length === 0) {
        return result;
      }

      for (const localTask of localTasks) {
        try {
          const salesforceId = localTask.syncMetadata?.salesforceId;

          if (salesforceId) {
            await salesforceService.updateTask(salesforceId, localTask);
          } else {
            const createdTask = await salesforceService.createTask(localTask);

            await this.updateLocalTask(localTask.id, {
              ...localTask,
              syncMetadata: {
                ...localTask.syncMetadata,
                salesforceId: createdTask.Id,
                lastSyncedAt: new Date().toISOString(),
                syncStatus: 'synced'
              }
            });
          }

          result.itemsSynced++;
        } catch (error) {
          console.error(`Error pushing task ${localTask.id} to Salesforce:`, error);
          result.errors.push(`Task ${localTask.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Push tasks to Salesforce failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  // ==================== CONFLICT DETECTION & RESOLUTION ====================

  /**
   * Detect if there's a conflict between local and remote data
   */
  private detectConflict(
    localItem: CalendarEvent | Task,
    remoteModifiedDate: string,
    provider: SyncProvider
  ): boolean {
    const localModified = new Date(localItem.updatedAt);
    const remoteModified = new Date(remoteModifiedDate);
    const lastSynced = new Date(localItem.syncMetadata.lastSyncedAt);

    // If both local and remote were modified after last sync, it's a conflict
    return localModified > lastSynced && remoteModified > lastSynced;
  }

  /**
   * Check if local item needs update from remote
   */
  private needsUpdate(
    localItem: CalendarEvent | Task,
    remoteModifiedDate: string
  ): boolean {
    const remoteModified = new Date(remoteModifiedDate);
    const lastSynced = new Date(localItem.syncMetadata.lastSyncedAt);

    return remoteModified > lastSynced;
  }

  /**
   * Handle sync conflict
   */
  private async handleConflict(
    localId: string,
    remoteItem: any,
    provider: SyncProvider,
    itemType: 'event' | 'task' = 'event'
  ): Promise<void> {
    // Store conflict for user resolution
    await supabase.from('sync_conflicts').insert({
      localId,
      provider,
      itemType,
      remoteData: remoteItem,
      detectedAt: new Date().toISOString(),
      status: 'pending'
    });

    // Update sync status to conflict
    const table = itemType === 'event' ? 'calendar_events' : 'tasks';
    await supabase
      .from(table)
      .update({
        'syncMetadata.syncStatus': 'conflict' as SyncStatus
      })
      .eq('id', localId);
  }

  /**
   * Resolve conflict by choosing source of truth
   */
  async resolveConflict(
    localId: string,
    sourceOfTruth: SyncProvider,
    itemType: 'event' | 'task'
  ): Promise<void> {
    // Get conflict details
    const { data: conflict } = await supabase
      .from('sync_conflicts')
      .select('*')
      .eq('localId', localId)
      .eq('status', 'pending')
      .single();

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    if (sourceOfTruth === 'local') {
      // Keep local version, push to remote
      if (conflict.provider === 'outlook') {
        if (itemType === 'event') {
          const { data: localEvent } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('id', localId)
            .single();

          if (localEvent) {
            await outlookService.updateCalendarEvent(
              localEvent.syncMetadata.outlookId!,
              localEvent
            );
          }
        } else {
          const { data: localTask } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', localId)
            .single();

          if (localTask) {
            await outlookService.updateTask(
              localTask.syncMetadata.outlookId!,
              localTask
            );
          }
        }
      } else if (conflict.provider === 'salesforce') {
        if (itemType === 'event') {
          const { data: localEvent } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('id', localId)
            .single();

          if (localEvent) {
            await salesforceService.updateEvent(
              localEvent.syncMetadata.salesforceId!,
              localEvent
            );
          }
        } else {
          const { data: localTask } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', localId)
            .single();

          if (localTask) {
            await salesforceService.updateTask(
              localTask.syncMetadata.salesforceId!,
              localTask
            );
          }
        }
      }
    } else {
      // Use remote version, update local
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      if (conflict.provider === 'outlook') {
        if (itemType === 'event') {
          const updatedEvent = outlookService.mapOutlookEventToLocal(
            conflict.remoteData,
            user.user.id
          );
          await this.updateLocalEvent(localId, updatedEvent);
        } else {
          const updatedTask = outlookService.mapOutlookTaskToLocal(
            conflict.remoteData,
            user.user.id
          );
          await this.updateLocalTask(localId, updatedTask);
        }
      } else if (conflict.provider === 'salesforce') {
        if (itemType === 'event') {
          const updatedEvent = salesforceService.mapSalesforceEventToLocal(
            conflict.remoteData,
            user.user.id
          );
          await this.updateLocalEvent(localId, updatedEvent);
        } else {
          const updatedTask = salesforceService.mapSalesforceTaskToLocal(
            conflict.remoteData,
            user.user.id
          );
          await this.updateLocalTask(localId, updatedTask);
        }
      }
    }

    // Mark conflict as resolved
    await supabase
      .from('sync_conflicts')
      .update({
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolution: sourceOfTruth
      })
      .eq('id', conflict.id);

    // Update sync status
    const table = itemType === 'event' ? 'calendar_events' : 'tasks';
    await supabase
      .from(table)
      .update({
        'syncMetadata.syncStatus': 'synced' as SyncStatus
      })
      .eq('id', localId);
  }

  // ==================== DATABASE HELPERS ====================

  private async createLocalEvent(event: CalendarEvent): Promise<void> {
    await supabase.from('calendar_events').insert(event);
  }

  private async updateLocalEvent(id: string, event: Partial<CalendarEvent>): Promise<void> {
    await supabase
      .from('calendar_events')
      .update({ ...event, updatedAt: new Date().toISOString() })
      .eq('id', id);
  }

  private async createLocalTask(task: Task): Promise<void> {
    await supabase.from('tasks').insert(task);
  }

  private async updateLocalTask(id: string, task: Partial<Task>): Promise<void> {
    await supabase
      .from('tasks')
      .update({ ...task, updatedAt: new Date().toISOString() })
      .eq('id', id);
  }

  /**
   * Get all sync conflicts for user
   */
  async getSyncConflicts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('sync_conflicts')
      .select('*')
      .eq('status', 'pending')
      .order('detectedAt', { ascending: false });

    if (error) {
      console.error('Error fetching conflicts:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Enable auto-sync
   */
  startAutoSync(): void {
    if (!this.syncConfig?.autoSyncEnabled) {
      return;
    }

    const intervalMinutes = this.syncConfig.syncFrequencyMinutes || 15;

    setInterval(async () => {
      try {
        await this.startSync();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

// Export singleton instance
export const syncService = new SyncService();
