/**
 * Sync Settings Component
 *
 * Configuration interface for:
 * - Outlook integration (OAuth, calendar/task sync)
 * - Salesforce integration (OAuth, event/task sync)
 * - Sync preferences (direction, frequency, auto-sync)
 * - Conflict resolution strategy
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cloud,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { outlookService } from '../services/outlookService';
import { salesforceService } from '../services/salesforceService';
import { syncService } from '../services/syncService';
import { SyncConfiguration, SyncDirection } from '../types';

export const SyncSettings: React.FC = () => {
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [salesforceConnected, setSalesforceConnected] = useState(false);
  const [syncConfig, setSyncConfig] = useState<Partial<SyncConfiguration>>({
    outlookEnabled: false,
    salesforceEnabled: false,
    syncDirection: 'bidirectional',
    syncFrequencyMinutes: 15,
    autoSyncEnabled: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check connection status
    setOutlookConnected(outlookService.isAuthenticated());
    setSalesforceConnected(salesforceService.isAuthenticated());

    // Load sync configuration
    loadSyncConfig();
  }, []);

  const loadSyncConfig = async () => {
    // This would load from the database via syncService
    // For now, using default values
  };

  const handleOutlookConnect = async () => {
    try {
      await outlookService.authenticate();
    } catch (error) {
      console.error('Outlook connection failed:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to connect to Outlook. Please try again.'
      });
    }
  };

  const handleOutlookDisconnect = () => {
    outlookService.disconnect();
    setOutlookConnected(false);
    setSyncConfig(prev => ({ ...prev, outlookEnabled: false }));
    setSaveMessage({
      type: 'success',
      text: 'Disconnected from Outlook successfully.'
    });
  };

  const handleSalesforceConnect = async () => {
    try {
      await salesforceService.authenticate();
    } catch (error) {
      console.error('Salesforce connection failed:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to connect to Salesforce. Please try again.'
      });
    }
  };

  const handleSalesforceDisconnect = () => {
    salesforceService.disconnect();
    setSalesforceConnected(false);
    setSyncConfig(prev => ({ ...prev, salesforceEnabled: false }));
    setSaveMessage({
      type: 'success',
      text: 'Disconnected from Salesforce successfully.'
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await syncService.saveSyncConfiguration(syncConfig as SyncConfiguration);

      setSaveMessage({
        type: 'success',
        text: 'Settings saved successfully!'
      });

      // Start auto-sync if enabled
      if (syncConfig.autoSyncEnabled) {
        syncService.startAutoSync();
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to save settings. Please try again.'
      });
    } finally {
      setIsSaving(false);

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Settings className="w-8 h-8 text-ana-red" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sync Settings</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Configure integration with Outlook and Salesforce
            </p>
          </div>
        </div>

        {/* Save message */}
        {saveMessage && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            saveMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            <span className={`text-sm font-medium ${
              saveMessage.type === 'success'
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-red-800 dark:text-red-300'
            }`}>
              {saveMessage.text}
            </span>
          </div>
        )}

        {/* Outlook Integration */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Microsoft Outlook
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sync calendar events and tasks from Outlook
                </p>
              </div>
            </div>

            {outlookConnected ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Connected
                </span>
                <button
                  onClick={handleOutlookDisconnect}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Disconnect Outlook"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleOutlookConnect}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                Connect Outlook
              </button>
            )}
          </div>

          {outlookConnected && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={syncConfig.outlookEnabled}
                  onChange={(e) => setSyncConfig(prev => ({ ...prev, outlookEnabled: e.target.checked }))}
                  className="w-4 h-4 text-ana-red rounded border-slate-300 focus:ring-ana-red"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    Enable Outlook sync
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Automatically sync calendar events and tasks
                  </p>
                </div>
              </label>

              <div className="pl-7 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Calendar events will sync to EBOSS Manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Microsoft To Do tasks will sync to task list</span>
                </div>
              </div>
            </div>
          )}

          {!outlookConnected && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> You'll need to grant permission to access your Outlook calendar and tasks.
                This uses Microsoft's secure OAuth 2.0 authentication.
              </p>
            </div>
          )}
        </div>

        {/* Salesforce Integration */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Cloud className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Salesforce
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sync events and tasks from Salesforce
                </p>
              </div>
            </div>

            {salesforceConnected ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Connected
                </span>
                <button
                  onClick={handleSalesforceDisconnect}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Disconnect Salesforce"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSalesforceConnect}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700"
              >
                <ExternalLink className="w-4 h-4" />
                Connect Salesforce
              </button>
            )}
          </div>

          {salesforceConnected && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={syncConfig.salesforceEnabled}
                  onChange={(e) => setSyncConfig(prev => ({ ...prev, salesforceEnabled: e.target.checked }))}
                  className="w-4 h-4 text-ana-red rounded border-slate-300 focus:ring-ana-red"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    Enable Salesforce sync
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Automatically sync events and tasks
                  </p>
                </div>
              </label>

              <div className="pl-7 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Salesforce Events will sync to calendar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Salesforce Tasks will sync to task list</span>
                </div>
              </div>
            </div>
          )}

          {!salesforceConnected && (
            <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
              <p className="text-xs text-cyan-800 dark:text-cyan-300">
                <strong>Note:</strong> You'll need to authorize EBOSS Manager to access your Salesforce data.
                This uses Salesforce's secure OAuth 2.0 authentication.
              </p>
            </div>
          )}
        </div>

        {/* Sync Preferences */}
        {(outlookConnected || salesforceConnected) && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Sync Preferences
            </h2>

            {/* Sync Direction */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Sync Direction
              </label>
              <select
                value={syncConfig.syncDirection}
                onChange={(e) => setSyncConfig(prev => ({ ...prev, syncDirection: e.target.value as SyncDirection }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="pull">Pull Only (Import from external sources)</option>
                <option value="push">Push Only (Export to external sources)</option>
                <option value="bidirectional">Bidirectional (Full two-way sync)</option>
              </select>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {syncConfig.syncDirection === 'pull' && 'Changes from Outlook/Salesforce will be imported to EBOSS Manager'}
                {syncConfig.syncDirection === 'push' && 'Changes from EBOSS Manager will be exported to Outlook/Salesforce'}
                {syncConfig.syncDirection === 'bidirectional' && 'Changes sync in both directions automatically'}
              </p>
            </div>

            {/* Auto-sync */}
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={syncConfig.autoSyncEnabled}
                onChange={(e) => setSyncConfig(prev => ({ ...prev, autoSyncEnabled: e.target.checked }))}
                className="mt-0.5 w-4 h-4 text-ana-red rounded border-slate-300 focus:ring-ana-red"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Enable automatic sync
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Automatically sync data at regular intervals
                </p>
              </div>
            </label>

            {/* Sync Frequency */}
            {syncConfig.autoSyncEnabled && (
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Sync Frequency
                </label>
                <select
                  value={syncConfig.syncFrequencyMinutes}
                  onChange={(e) => setSyncConfig(prev => ({ ...prev, syncFrequencyMinutes: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value={5}>Every 5 minutes</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every hour</option>
                  <option value={120}>Every 2 hours</option>
                </select>
              </div>
            )}

            {/* Warning */}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Important:</strong> When conflicts occur (same item modified in multiple places),
                  the most recently modified version will be used. You can review and resolve conflicts
                  manually in the Sync Conflicts section.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving || (!outlookConnected && !salesforceConnected)}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-ana-red rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Need Help?
          </h3>
          <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
            <li>• Outlook requires a Microsoft 365 account with calendar and tasks enabled</li>
            <li>• Salesforce requires API access permissions (contact your Salesforce admin)</li>
            <li>• Bidirectional sync keeps all systems in sync automatically</li>
            <li>• You can manually sync at any time using the sync button in Calendar or Tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
