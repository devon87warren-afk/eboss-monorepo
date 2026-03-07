'use client';

import { BottomNav } from '@/components/navigation/BottomNav';
import { useLogs } from '@/hooks/useLogs';
import type { LogType } from '@/types/dashboard';

export default function LogsPage() {
  const {
    groupedLogs,
    asset,
    typeFilter,
    setTypeFilter,
    dateRange,
    expandedLogs,
    toggleLogExpanded,
  } = useLogs();

  const statusColor = asset.status === 'nominal' ? 'text-emerald-400' : 'text-amber-400';

  const logTypeStyles = {
    critical: {
      border: 'border-red-500/20',
      bg: 'bg-red-500/10',
      text: 'text-red-500',
      barColor: 'bg-red-500',
    },
    warning: {
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/10',
      text: 'text-amber-500',
      barColor: 'bg-amber-500',
    },
    info: {
      border: 'border-white/5',
      bg: 'bg-white/5',
      text: 'text-white/60',
      barColor: '',
    },
    system: {
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/10',
      text: 'text-blue-500',
      barColor: 'bg-blue-500',
    },
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-[#09090b]/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500 text-sm animate-pulse">
              radio_button_checked
            </span>
            <h2 className="text-white text-sm font-bold uppercase tracking-widest">
              Asset: {asset.name}
            </h2>
          </div>
          <p className="text-[10px] text-white/40 font-mono mt-0.5">
            HISTORICAL LOGS • ENCRYPTED
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/60 font-medium">STATUS</span>
            <span className={`text-xs font-bold font-mono ${statusColor}`}>
              {asset.status.toUpperCase()}
            </span>
          </div>
          <button className="flex items-center justify-center size-8 bg-[#1c1c1f] border border-white/10 rounded">
            <span className="material-symbols-outlined text-lg">more_vert</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col pb-32">
        {/* Filter Section */}
        <section className="sticky top-[69px] z-40 bg-[#09090b]/95 backdrop-blur-xl border-b border-white/10 p-4 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white uppercase tracking-wide">
              Telemetry Logs
            </h1>
            <button className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-sm">download</span>
              EXPORT
            </button>
          </div>

          <div className="flex gap-2">
            {/* Date Range */}
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-white/40 text-base group-focus-within:text-white/80 transition-colors">
                  calendar_today
                </span>
              </div>
              <input
                type="text"
                readOnly
                value={`${dateRange.start} - ${dateRange.end}`}
                className="block w-full rounded bg-[#121214] border-white/10 pl-9 pr-3 py-2.5 text-xs font-mono text-white focus:ring-1 focus:ring-white/20 focus:border-white/30 cursor-pointer placeholder-white/20 transition-all"
              />
            </div>

            {/* Event Type Filter */}
            <div className="relative w-[140px] group">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-white/40 text-base group-focus-within:text-white/80 transition-colors">
                  filter_alt
                </span>
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as LogType | 'all')}
                className="block w-full rounded bg-[#121214] border-white/10 pl-8 pr-8 py-2.5 text-xs font-mono text-white focus:ring-1 focus:ring-white/20 focus:border-white/30 appearance-none transition-all"
              >
                <option value="all">All Events</option>
                <option value="critical">Critical</option>
                <option value="system">Updates</option>
                <option value="info">Nominal</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-white/40 text-sm">
                  expand_more
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Logs Section */}
        <section className="p-4 space-y-3 min-h-[60vh]">
          {Object.entries(groupedLogs).map(([date, logs]) => (
            <div key={date}>
              {/* Date Divider */}
              <div className="flex items-center gap-4 py-2 mt-6 first:mt-0">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-[10px] font-mono font-bold text-white/40 uppercase">
                  {date}
                </span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              {/* Log Entries */}
              {logs.map((log) => {
                const styles = logTypeStyles[log.type];
                const isExpanded = expandedLogs.has(log.id);
                const hasSideBorder = log.type === 'critical' || log.type === 'system';

                return (
                  <details
                    key={log.id}
                    open={isExpanded}
                    className={`group bg-[#121214] border ${styles.border} rounded-lg overflow-hidden open:bg-[#1c1c1f] transition-all mb-3`}
                  >
                    <summary
                      onClick={(e) => {
                        e.preventDefault();
                        toggleLogExpanded(log.id);
                      }}
                      className="flex items-start justify-between p-3 cursor-pointer select-none hover:bg-white/5 transition-colors relative"
                    >
                      {hasSideBorder && (
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 ${styles.barColor}`}
                        ></div>
                      )}

                      <div className="flex gap-3 pl-2 w-full">
                        <div
                          className={`mt-0.5 min-w-[32px] h-8 flex items-center justify-center rounded ${styles.bg} border ${styles.border} ${styles.text}`}
                        >
                          <span className="material-symbols-outlined text-base">{log.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span
                              className={`font-bold text-xs ${styles.text} tracking-wide uppercase`}
                            >
                              {log.title}
                            </span>
                            <span className="font-mono text-[10px] text-white/40">
                              {log.timestamp}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${log.type === 'info' ? 'text-white/60' : 'text-white/90'} truncate`}
                          >
                            {log.message}
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-white/30 group-open:rotate-180 transition-transform text-lg ml-2">
                        expand_more
                      </span>
                    </summary>

                    {log.details && (
                      <div className="p-3 pl-4 pt-0 border-t border-white/5 bg-black/20">
                        <div className="mt-2 p-2 rounded border border-white/5 font-mono text-[10px] text-white/70 overflow-x-auto bg-[#09090b]/50">
                          {Object.entries(log.details).length > 1 ? (
                            <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1.5">
                              {Object.entries(log.details).map(([key, value]) => (
                                <div key={key} className="contents">
                                  <span className="text-white/30 select-none">{key}</span>
                                  <span
                                    className={
                                      key === 'ERROR_CODE' || key === 'DELTA'
                                        ? 'text-red-500 font-bold'
                                        : key === 'VERSION'
                                          ? 'text-blue-500'
                                          : key === 'STATUS' && value.includes('OK')
                                            ? 'text-emerald-500'
                                            : 'text-white'
                                    }
                                  >
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span
                              className={
                                Object.values(log.details)[0]?.includes('OK')
                                  ? 'text-emerald-500'
                                  : 'text-white/70'
                              }
                            >
                              {Object.values(log.details)[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          ))}

          {/* End of Logs */}
          <div className="text-center pt-8 pb-4">
            <span className="text-[10px] text-white/20 font-mono">END OF CACHED LOGS</span>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Spacer for bottom nav */}
      <div className="h-8 bg-transparent"></div>
    </div>
  );
}
