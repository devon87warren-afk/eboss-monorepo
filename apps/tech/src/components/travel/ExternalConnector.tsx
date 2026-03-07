'use client';

interface ConnectorProps {
    name: string;
    url: string;
    status: 'online' | 'warning' | 'pending';
    desc: string;
    icon: string;
}

export function ExternalConnector({ name, url, status, desc, icon }: ConnectorProps) {
    const statusColors = {
        online: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        pending: 'text-white/30 bg-white/5 border-white/10',
    };

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group bg-[#121214] border border-white/10 p-4 rounded-xl hover:bg-[#1c1c1f] transition-all active:scale-[0.98]"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10">
                    <span className="material-symbols-outlined text-white/60 group-hover:text-white transition-colors">{icon}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold tracking-tight uppercase ${statusColors[status]}`}>
                    {status}
                </span>
            </div>
            <h4 className="font-bold text-sm text-white mb-1 uppercase tracking-tight group-hover:text-red-500 transition-colors">{name}</h4>
            <p className="text-[10px] text-white/30 font-mono italic leading-relaxed">{desc}</p>
        </a>
    );
}
