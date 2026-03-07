import CommissioningChecklist from "@/app/components/workflows/CommissioningChecklist";

export default function JobsPage() {
    return (
        <div className="mx-auto max-w-5xl p-6">
            <h1 className="mb-2 text-2xl font-black uppercase tracking-tighter text-white">
                Active<span className="text-orange-500">_Jobs</span>
            </h1>
            <p className="mb-8 font-mono text-xs text-slate-500">FIELD_OPERATIONS // COMMISSIONING</p>
            <CommissioningChecklist />
        </div>
    );
}
