import ActionCenter from "@/app/components/dashboard/ActionCenter";
import FleetMap from "@/app/components/dashboard/FleetMap";
import StatsOverview from "@/app/components/dashboard/StatsOverview";
import SavingsCalculator from "@/app/components/dashboard/SavingsCalculator";

export default function Dashboard() {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-950 md:flex-row">

      {/* LEFT: Immersive Map (70%) */}
      {/* Using 'isolate' to ensure sticky HUD elements sit on top correctly */}
      <div className="relative h-[50vh] w-full grow md:h-full md:w-[70%] isolate">
        <div className="absolute inset-0 z-0">
          <FleetMap />
        </div>

        {/* Map HUD Overlay - Top Left */}
        <div className="absolute left-6 top-6 z-10 hidden md:block">
          <div className="w-64">
            {/* TODO(EBOSS-111, 2026-03-08): Replace with next/image for LCP optimisation once dimensions are confirmed. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logos-ana/ANA-HORIZONTAL-LOGO-METAL-WHITE-TAGLINE.svg"
              alt="ANA Energy"
              className="w-full h-auto drop-shadow-lg"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="font-mono text-xs font-bold text-green-400">LIVE DATA STREAM</span>
          </div>
        </div>

        {/* Map HUD Overlay - Stats Strip (Bottom) */}
        <div className="absolute bottom-6 left-6 right-6 z-10">
          <StatsOverview />
        </div>
      </div>

      {/* RIGHT: Data Stream (30%) */}
      <div className="flex h-[50vh] w-full flex-col border-l border-slate-800 bg-slate-900/80 backdrop-blur-md md:h-full md:w-[30%]">
        <div className="flex items-center justify-between border-b border-white/5 p-4">
          <span className="font-mono text-xs font-bold text-slate-400">OPERATIONS_CENTER</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">ONLINE</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent space-y-6">
          <section>
            <SavingsCalculator />
          </section>

          <div className="border-t border-slate-800 pt-4">
            <ActionCenter />
          </div>
        </div>
      </div>

    </div>
  );
}
