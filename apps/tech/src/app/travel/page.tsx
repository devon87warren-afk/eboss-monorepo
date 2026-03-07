import TravelOptimizer from "@/app/components/workflows/TravelOptimizer";

export default function TravelPage() {
    return (
        <div className="mx-auto max-w-5xl p-6">
            <h1 className="mb-2 text-2xl font-black uppercase tracking-tighter text-white">
                Travel<span className="text-orange-500">.AI</span>
            </h1>
            <p className="mb-8 font-mono text-xs text-slate-500">LOGISTICS // AUTOMATED_ROUTING</p>
            <TravelOptimizer />
        </div>
    );
}
