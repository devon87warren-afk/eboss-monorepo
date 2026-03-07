'use client';

import { ExternalConnector } from '@/components/travel/ExternalConnector';

export default function CommsHubPage() {
    return (
        <div className="space-y-6">
            <section className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-4">
                <span className="material-symbols-outlined text-red-500">notifications_active</span>
                <div>
                    <p className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">Priority Comms</p>
                    <p className="text-xs text-white/70">New field dispatch protocol updated in Teams.</p>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4">
                <ExternalConnector
                    name="Outlook Email"
                    url="https://outlook.office.com"
                    status="online"
                    desc="Operations inbox for deployment sync."
                    icon="mail"
                />
                <ExternalConnector
                    name="MS Teams"
                    url="https://teams.microsoft.com"
                    status="online"
                    desc="Technician stand-ups & logistics chat."
                    icon="chat_bubble"
                />
            </div>
        </div>
    );
}
