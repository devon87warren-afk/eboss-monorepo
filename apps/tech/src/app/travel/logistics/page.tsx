'use client';

export default function LogisticsTicketsPage() {
    return (
        <div className="space-y-6">
            <section className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 bg-red-500/10 rounded-xl border border-red-500/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-500">local_shipping</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">Dispatch Ticket</h3>
                        <p className="text-[10px] text-white/40 font-mono mt-1 uppercase">Field_Operations_Backbone</p>
                    </div>
                </div>

                <form className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 font-mono">Asset Identifier</label>
                        <input
                            type="text"
                            placeholder="ANA-EB-992"
                            className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg p-3 text-sm font-mono placeholder:text-white/10 focus:outline-none focus:border-red-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 font-mono">Priority</label>
                            <select className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg p-3 text-sm focus:outline-none">
                                <option>Routine</option>
                                <option>Urgent</option>
                                <option>Emergency</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 font-mono">Topic</label>
                            <select className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg p-3 text-sm focus:outline-none">
                                <option>Maintenance</option>
                                <option>Logistics</option>
                                <option>Technical</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 font-mono">Description</label>
                        <textarea
                            rows={4}
                            placeholder="Describe the logistics requirement..."
                            className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg p-3 text-sm placeholder:text-white/10 focus:outline-none focus:border-red-500/50"
                        />
                    </div>

                    <button className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] shadow-lg shadow-red-500/20">
                        Submit_Ticket
                    </button>
                </form>
            </section>

            <section className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
                <p className="text-[10px] text-red-200/50 font-mono italic leading-relaxed text-center">
                    "Attention: All field dispatch tickets are audited by Operations Center. Emergency override requires Site Lead authorization."
                </p>
            </section>
        </div>
    );
}
