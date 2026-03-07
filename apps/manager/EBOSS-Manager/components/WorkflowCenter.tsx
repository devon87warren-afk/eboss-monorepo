import React from 'react';
import { useAppContext } from '../App';
import { AlertTriangle, CheckSquare, ShieldCheck, Clock } from 'lucide-react';
import { Action } from '../types';

const ACTION_LABELS: Record<string, string> = {
  recover: 'Recovery',
  approve_log: 'Approve Log',
  after_action_required: 'After-Action',
  approve_receipt: 'Approve Receipt',
  verify_link: 'Verify Link',
  approve_sync: 'Approve Sync'
};

const titleize = (value: string) =>
  value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatDate = (value?: string) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString();
};

const getUrgencyClasses = (urgency: string) => {
  const styles: Record<string, string> = {
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    low: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300'
  };

  return styles[urgency] ?? styles.low;
};

const getStatusClasses = (status: string) => {
  const styles: Record<string, string> = {
    open: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    blocked: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    completed: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300'
  };

  return styles[status] ?? styles.open;
};

interface SummaryCardProps {
  title: string;
  value: number;
  subtitle: string;
  tone: string;
  icon: React.ComponentType<{ size?: number }>;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subtitle, tone, icon: Icon }) => (
  <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 p-5 flex items-start justify-between gap-4">
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-3xl font-bold text-slate-800 dark:text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
    </div>
    <div className={`p-3 rounded-lg text-white shadow-sm ${tone}`}>
      <Icon size={22} />
    </div>
  </div>
);

const WorkflowCenter: React.FC = () => {
  const {
    actions,
    customers,
    interactions,
    expenses,
    territoryReminders,
    verificationQueue,
    territories,
    currentUser
  } = useAppContext();

  const activeTerritory = territories.find(territory => territory.id === currentUser.territoryId);
  const scopedReminders = currentUser.territoryId
    ? territoryReminders.filter(reminder => reminder.territoryId === currentUser.territoryId)
    : territoryReminders;

  const openActions = actions.filter(action => action.status !== 'completed').length;
  const openReminders = scopedReminders.filter(reminder => reminder.status === 'open').length;
  const pendingVerifications = verificationQueue.filter(item => item.status === 'pending').length;

  const resolveActionSubject = (action: Action) => {
    if (action.subjectType === 'account') {
      return customers.find(customer => customer.id === action.subjectId)?.name ?? action.subjectId;
    }

    if (action.subjectType === 'interaction') {
      return interactions.find(interaction => interaction.id === action.subjectId)?.summary ?? action.subjectId;
    }

    if (action.subjectType === 'expense') {
      const expense = expenses.find(item => item.id === action.subjectId);
      if (!expense) {
        return action.subjectId;
      }

      return `${expense.vendor} ($${expense.amount.toFixed(2)})`;
    }

    return action.subjectId;
  };

  const actionsSorted = [...actions].sort((a, b) => b.priorityScore - a.priorityScore);
  const remindersSorted = [...scopedReminders].sort((a, b) => b.daysSinceContact - a.daysSinceContact);
  const verificationSorted = [...verificationQueue].sort((a, b) => a.confidenceScore - b.confidenceScore);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Workflow Center</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Review approvals, territory reminders, and verification tasks.
        </p>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Territory scope:{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {activeTerritory?.name ?? 'All territories'}
          </span>
          {currentUser.territoryAssignmentSource && (
            <span className="ml-2 rounded-full bg-slate-100 dark:bg-dark-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-600 dark:text-slate-300">
              {currentUser.territoryAssignmentSource} assigned
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Open Actions"
          value={openActions}
          subtitle="Recoveries, approvals, and follow-ups"
          tone="bg-emerald-600"
          icon={CheckSquare}
        />
        <SummaryCard
          title="Territory Reminders"
          value={openReminders}
          subtitle="Accounts past SLA thresholds"
          tone="bg-amber-600"
          icon={AlertTriangle}
        />
        <SummaryCard
          title="Verification Queue"
          value={pendingVerifications}
          subtitle="Items needing review"
          tone="bg-blue-600"
          icon={ShieldCheck}
        />
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Action Queue</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Highest priority actions across workflows.</p>
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sorted by priority score
          </div>
        </div>

        {actionsSorted.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No actions pending.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-900 border-b border-slate-200 dark:border-dark-700 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Subject</th>
                  <th className="p-3 font-medium">Urgency</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                {actionsSorted.map(action => (
                  <tr key={action.id} className="hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors">
                    <td className="p-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {ACTION_LABELS[action.type] ?? titleize(action.type)}
                      <div className="text-xs text-slate-500 dark:text-slate-400">{action.id}</div>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                      {resolveActionSubject(action)}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getUrgencyClasses(action.urgency)}`}>
                        {titleize(action.urgency)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusClasses(action.status)}`}>
                        {titleize(action.status)}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(action.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Territory Reminders</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Reminders scoped to {activeTerritory?.name ?? 'all territories'}.
            </p>
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {openReminders} open
          </div>
        </div>

        {remindersSorted.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No reminders for this territory.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-900 border-b border-slate-200 dark:border-dark-700 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-3 font-medium">Account</th>
                  <th className="p-3 font-medium">Days Since Contact</th>
                  <th className="p-3 font-medium">Talking Points</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                {remindersSorted.map(reminder => {
                  const account = customers.find(customer => customer.id === reminder.accountId);
                  const points = reminder.talkingPoints ?? [];
                  const talkingPoints = points.slice(0, 2);
                  const remainingPoints = points.length - talkingPoints.length;

                  return (
                    <tr key={reminder.id} className="hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors">
                      <td className="p-3">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {account?.name ?? reminder.accountId}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Tier {account?.accountTier ?? '-'} · {account?.region ?? 'Unknown'}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                        {reminder.daysSinceContact} days
                        <div className="text-xs text-slate-500 dark:text-slate-400">SLA {reminder.slaDays} days</div>
                      </td>
                      <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                        <ul className="list-disc list-inside space-y-1">
                          {talkingPoints.map(point => (
                            <li key={point}>{point}</li>
                          ))}
                          {remainingPoints > 0 && <li>+{remainingPoints} more</li>}
                        </ul>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusClasses(reminder.status)}`}>
                          {titleize(reminder.status)}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(reminder.dueAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Verification Queue</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Low-confidence matches requiring review.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Clock size={14} />
            Weekly review cadence
          </div>
        </div>

        {verificationSorted.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No verification items queued.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-900 border-b border-slate-200 dark:border-dark-700 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-3 font-medium">Record</th>
                  <th className="p-3 font-medium">Reason</th>
                  <th className="p-3 font-medium">Confidence</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                {verificationSorted.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors">
                    <td className="p-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {titleize(item.recordType)}
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.recordId}</div>
                    </td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{item.reason}</td>
                    <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                      {Math.round(item.confidenceScore * 100)}%
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusClasses(item.status)}`}>
                        {titleize(item.status)}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowCenter;
