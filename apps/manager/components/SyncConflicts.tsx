/**
 * Sync Conflicts Resolution Component
 *
 * Displays and resolves conflicts when:
 * - Same item modified in multiple locations
 * - Data mismatch between local and remote
 * - Sync errors that need manual resolution
 *
 * Features:
 * - Side-by-side comparison of conflicting versions
 * - Choose which version to keep
 * - Merge conflicting data manually
 * - Bulk resolution options
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Tag,
  Database,
  Cloud
} from 'lucide-react';
import { syncService } from '../services/syncService';
import { SyncProvider } from '../types';

interface SyncConflict {
  id: string;
  localId: string;
  provider: SyncProvider;
  itemType: 'event' | 'task';
  remoteData: any;
  detectedAt: string;
  status: 'pending' | 'resolved';
  localData?: any;
}

export const SyncConflicts: React.FC = () => {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    setIsLoading(true);
    try {
      const data = await syncService.getSyncConflicts();
      setConflicts(data);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (conflictId: string, sourceOfTruth: SyncProvider) => {
    setIsResolving(true);
    try {
      const conflict = conflicts.find(c => c.id === conflictId);
      if (!conflict) return;

      await syncService.resolveConflict(conflict.localId, sourceOfTruth, conflict.itemType);

      // Remove resolved conflict from list
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      setSelectedConflict(null);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleResolveAll = async (sourceOfTruth: SyncProvider) => {
    setIsResolving(true);
    try {
      for (const conflict of conflicts) {
        await syncService.resolveConflict(conflict.localId, sourceOfTruth, conflict.itemType);
      }
      setConflicts([]);
      setSelectedConflict(null);
    } catch (error) {
      console.error('Failed to resolve all conflicts:', error);
    } finally {
      setIsResolving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sync Conflicts</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {conflicts.length} {conflicts.length === 1 ? 'conflict' : 'conflicts'} need resolution
            </p>
          </div>
        </div>

        {conflicts.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleResolveAll('local')}
              disabled={isResolving}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Keep All Local
            </button>
            <button
              onClick={() => handleResolveAll('outlook')}
              disabled={isResolving}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Keep All Remote
            </button>
            <button
              onClick={loadConflicts}
              disabled={isResolving}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isResolving ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {conflicts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Check className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No sync conflicts</p>
          <p className="text-sm">All your data is in sync!</p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Conflict List */}
          <div className="w-80 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
            <div className="p-4 space-y-2">
              {conflicts.map(conflict => (
                <button
                  key={conflict.id}
                  onClick={() => setSelectedConflict(conflict)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedConflict?.id === conflict.id
                      ? 'bg-ana-red/10 border-ana-red dark:bg-ana-red/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-ana-red'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {conflict.remoteData.subject || conflict.remoteData.title || 'Untitled'}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {conflict.itemType === 'event' ? 'Calendar Event' : 'Task'} • {conflict.provider}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(conflict.detectedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conflict Details */}
          <div className="flex-1 overflow-y-auto">
            {selectedConflict ? (
              <ConflictResolver
                conflict={selectedConflict}
                onResolve={handleResolve}
                isResolving={isResolving}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <ArrowRight className="w-12 h-12 mb-2 mx-auto opacity-20" />
                  <p className="text-sm">Select a conflict to review</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== CONFLICT RESOLVER ====================

interface ConflictResolverProps {
  conflict: SyncConflict;
  onResolve: (conflictId: string, sourceOfTruth: SyncProvider) => Promise<void>;
  isResolving: boolean;
}

const ConflictResolver: React.FC<ConflictResolverProps> = ({
  conflict,
  onResolve,
  isResolving
}) => {
  const localData = conflict.localData || {};
  const remoteData = conflict.remoteData || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Resolve Conflict
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This {conflict.itemType} was modified in both locations. Choose which version to keep.
        </p>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Local Version */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="font-semibold text-slate-900 dark:text-white">Local Version</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              EBOSS Manager
            </p>
          </div>

          <div className="p-4 space-y-3">
            <DataField
              label="Title"
              value={localData.title || localData.subject}
              icon={<Tag className="w-4 h-4" />}
            />
            {conflict.itemType === 'event' && (
              <>
                <DataField
                  label="Start Time"
                  value={formatDateTime(localData.startTime || localData.start?.dateTime)}
                  icon={<Calendar className="w-4 h-4" />}
                />
                <DataField
                  label="End Time"
                  value={formatDateTime(localData.endTime || localData.end?.dateTime)}
                  icon={<Clock className="w-4 h-4" />}
                />
                <DataField
                  label="Location"
                  value={localData.location || localData.location?.displayName || '-'}
                  icon={<Tag className="w-4 h-4" />}
                />
              </>
            )}
            {conflict.itemType === 'task' && (
              <>
                <DataField
                  label="Status"
                  value={localData.status || '-'}
                  icon={<Tag className="w-4 h-4" />}
                />
                <DataField
                  label="Priority"
                  value={localData.priority || localData.importance || '-'}
                  icon={<Tag className="w-4 h-4" />}
                />
                <DataField
                  label="Due Date"
                  value={formatDateTime(localData.dueDate || localData.dueDateTime?.dateTime)}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </>
            )}
            <DataField
              label="Description"
              value={localData.description || localData.bodyPreview || '-'}
              icon={<Tag className="w-4 h-4" />}
              multiline
            />
            <DataField
              label="Last Modified"
              value={formatDateTime(localData.updatedAt)}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onResolve(conflict.id, 'local')}
              disabled={isResolving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-ana-red rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Keep Local Version
            </button>
          </div>
        </div>

        {/* Remote Version */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-slate-900 dark:text-white">Remote Version</span>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-300 mt-1 capitalize">
              {conflict.provider}
            </p>
          </div>

          <div className="p-4 space-y-3">
            <DataField
              label="Title"
              value={remoteData.title || remoteData.Subject || remoteData.subject}
              icon={<Tag className="w-4 h-4" />}
            />
            {conflict.itemType === 'event' && (
              <>
                <DataField
                  label="Start Time"
                  value={formatDateTime(remoteData.StartDateTime || remoteData.start?.dateTime)}
                  icon={<Calendar className="w-4 h-4" />}
                />
                <DataField
                  label="End Time"
                  value={formatDateTime(remoteData.EndDateTime || remoteData.end?.dateTime)}
                  icon={<Clock className="w-4 h-4" />}
                />
                <DataField
                  label="Location"
                  value={remoteData.Location || remoteData.location?.displayName || '-'}
                  icon={<Tag className="w-4 h-4" />}
                />
              </>
            )}
            {conflict.itemType === 'task' && (
              <>
                <DataField
                  label="Status"
                  value={remoteData.Status || remoteData.status || '-'}
                  icon={<Tag className="w-4 h-4" />}
                />
                <DataField
                  label="Priority"
                  value={remoteData.Priority || remoteData.importance || '-'}
                  icon={<Tag className="w-4 h-4" />}
                />
                <DataField
                  label="Due Date"
                  value={formatDateTime(remoteData.ActivityDate || remoteData.dueDateTime?.dateTime)}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </>
            )}
            <DataField
              label="Description"
              value={remoteData.Description || remoteData.bodyPreview || remoteData.body?.content || '-'}
              icon={<Tag className="w-4 h-4" />}
              multiline
            />
            <DataField
              label="Last Modified"
              value={formatDateTime(remoteData.LastModifiedDate || remoteData.lastModifiedDateTime)}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onResolve(conflict.id, conflict.provider)}
              disabled={isResolving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Keep Remote Version
            </button>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Warning:</strong> The version you don't choose will be overwritten.
            Make sure you've reviewed both versions carefully before proceeding.
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== DATA FIELD ====================

interface DataFieldProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  multiline?: boolean;
}

const DataField: React.FC<DataFieldProps> = ({ label, value, icon, multiline }) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-sm text-slate-900 dark:text-white ${multiline ? '' : 'truncate'}`}>
        {value || '-'}
      </div>
    </div>
  );
};

// ==================== UTILITY FUNCTIONS ====================

function formatDateTime(dateTime?: string): string {
  if (!dateTime) return '-';

  try {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return dateTime;
  }
}
