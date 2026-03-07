'use client';

import { ExternalConnector } from '@/components/travel/ExternalConnector';

export default function ConcurPage() {
    return (
        <div className="space-y-6">
            <ExternalConnector
                name="SAP Concur"
                url="https://www.concursolutions.com"
                status="online"
                desc="Submit field expenses & reconciliation."
                icon="receipt_long"
            />

            <section className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    Submission Protocol
                </h3>
                <ul className="space-y-4 font-mono text-[11px] text-white/40">
                    <li className="flex gap-3">
                        <span className="text-red-500 font-bold">01</span>
                        <span>Upload all field receipts within 24 hours via ANA Expense.Auto.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-red-500 font-bold">02</span>
                        <span>Ensure Site Code is included in all report metadata.</span>
                    </li>
                </ul>
            </section>
        </div>
    );
}
