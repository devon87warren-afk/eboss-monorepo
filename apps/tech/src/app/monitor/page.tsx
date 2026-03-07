'use client';

import { BottomNav } from '@/components/navigation/BottomNav';
import { useTelemetry } from '@/hooks/useTelemetry';

export default function MonitorPage() {
  const {
    readings,
    performance,
    asset,
    isUpdating,
    remoteOperationEnabled,
    setRemoteOperationEnabled,
  } = useTelemetry();

  const statusColor = asset.status === 'nominal' ? 'text-emerald-400' : 'text-amber-400';

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
            LATENCY: 12ms • ENCRYPTED
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
        {/* Raw Telemetry Section */}
        <section className="p-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Raw Telemetry
            </h3>
            <span
              className={`text-[10px] font-mono text-red-500 ${isUpdating ? 'animate-pulse' : ''}`}
            >
              {isUpdating ? 'UPDATING' : 'LIVE'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden font-mono">
            {readings.map((reading) => (
              <div
                key={reading.id}
                className="bg-[#121214] p-3 flex flex-col justify-between h-20"
              >
                <span className="text-[10px] text-white/40 uppercase">{reading.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-medium text-white">
                    {reading.value.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-white/50">{reading.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Performance Graphs Section */}
        <section className="space-y-1 px-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Performance Graphs
            </h3>
            <div className="flex gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white">
                1H
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/40">
                24H
              </span>
            </div>
          </div>

          {performance.map((perf, index) => (
            <div
              key={perf.id}
              className={`relative bg-[#121214] border-x border-white/10 h-32 overflow-hidden chart-grid ${
                index === 0 ? 'border-t rounded-t-lg' : ''
              } ${index === performance.length - 1 ? 'border-b rounded-b-lg' : ''}`}
            >
              <div className="absolute top-2 left-3 z-10">
                <p className="text-[10px] font-bold text-white/60 uppercase">{perf.label}</p>
                <p className="text-lg font-mono font-medium text-white">
                  {perf.value.toLocaleString()}{' '}
                  <span className="text-xs text-white/40">{perf.unit}</span>
                </p>
              </div>
              <svg
                className="absolute bottom-0 left-0 right-0 w-full h-24"
                preserveAspectRatio="none"
                viewBox="0 0 100 50"
              >
                <path
                  d={perf.chartPath}
                  fill="none"
                  stroke="white"
                  strokeOpacity="0.8"
                  strokeWidth="0.5"
                />
                <path
                  d="M0,25 L100,25"
                  fill="none"
                  stroke="white"
                  strokeDasharray="2,2"
                  strokeOpacity="0.2"
                  strokeWidth="0.2"
                />
                <path d={perf.fillPath} fill="white" fillOpacity="0.05" />
              </svg>
            </div>
          ))}
        </section>

        {/* Control Terminal Section */}
        <section className="mt-8 px-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-white/50 text-sm">terminal</span>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">
              Control Terminal
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {/* Remote Operation Toggle */}
            <div className="bg-[#121214] border border-white/10 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Remote Operation</h4>
                <p className="text-[10px] text-white/50 mt-1 max-w-[200px]">
                  Allow remote start/stop commands via telemetry uplink.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteOperationEnabled}
                  onChange={(e) => setRemoteOperationEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 hover:bg-white/20"></div>
              </label>
            </div>

            {/* Emergency Cutoff */}
            <div className="group relative overflow-hidden bg-[#09090b] border border-red-500/30 rounded-lg p-4">
              <div className="absolute inset-0 hazard-stripes opacity-20 pointer-events-none"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-red-500">
                    <span className="material-symbols-outlined text-lg">gpp_maybe</span>
                    <h4 className="text-sm font-bold uppercase tracking-wide">Emergency Cutoff</h4>
                  </div>
                  <p className="text-[10px] text-red-500/70 mt-1 font-mono">
                    SAFETY LOCK ENGAGED • AUTHORIZATION REQ
                  </p>
                </div>
                <button className="flex flex-col items-center justify-center size-14 rounded bg-gradient-to-br from-red-900 to-red-950 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-white text-2xl drop-shadow-md">
                    power_settings_new
                  </span>
                  <span className="text-[8px] font-bold text-white/80 mt-0.5">STOP</span>
                </button>
              </div>
            </div>
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
