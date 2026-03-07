import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    ChevronLeft,
    ChevronRight,
    Zap,
    Target,
    Users,
    Ticket,
    Clock,
    CheckCircle,
    TrendingUp,
    LayoutGrid,
    Map as MapIcon,
    Maximize2,
    RefreshCw
} from 'lucide-react';
import FleetMap from './FleetMap';
import TechScheduleModal from './TechScheduleModal';
import clsx from 'clsx';

// --- Types ---
type Perspective = 'strategic' | 'operational';

// --- Sub-components ---

const PerspectiveToggle = ({ active, onChange }: { active: Perspective, onChange: (p: Perspective) => void }) => (
    <div className="flex bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md p-1 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
        <button
            onClick={() => onChange('operational')}
            className={clsx(
                "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2",
                active === 'operational'
                    ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-lg scale-105"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
        >
            <Activity size={14} className={active === 'operational' ? "animate-pulse" : ""} />
            Operational
        </button>
        <button
            onClick={() => onChange('strategic')}
            className={clsx(
                "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2",
                active === 'strategic'
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-lg scale-105"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            )}
        >
            <Target size={14} />
            Strategic
        </button>
    </div>
);

const OperationsHub = () => {
    const [perspective, setPerspective] = useState<Perspective>('operational');
    const [sidebarExpanded, setSidebarExpanded] = useState(true);

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-orange-500/30">
            {/* Top Navigation / Status Bar */}
            <header className="h-20 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-8 flex items-center justify-between z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 rotate-3">
                            <Zap className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">Operations Hub</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Active • Global Sync</span>
                            </div>
                        </div>
                    </div>

                    <nav className="hidden xl:flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        {['Network', 'Assets', 'Logistics', 'Intelligence'].map((tab) => (
                            <button key={tab} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">{tab}</button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    <PerspectiveToggle active={perspective} onChange={setPerspective} />
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                    <button className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-400 hover:text-orange-500">
                        <RefreshCw size={20} />
                    </button>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-black text-slate-900 dark:text-white leading-none">Command Admin</p>
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter mt-1">Tier 1 Access</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 border-2 border-white dark:border-slate-700 shadow-lg" />
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Left Dynamic Sidebar */}
                <aside
                    className={clsx(
                        "relative flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-40",
                        sidebarExpanded ? "w-96" : "w-0 opacity-0 -translate-x-full"
                    )}
                >
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-50">
                        <button
                            onClick={() => setSidebarExpanded(!sidebarExpanded)}
                            className="w-8 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-r-xl flex items-center justify-center text-slate-400 hover:text-orange-500 transition-all hover:translate-x-1"
                        >
                            {sidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {perspective === 'strategic' ? (
                                <motion.div
                                    key="strategic-sidebar"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">New Sales Pipeline</h3>
                                        <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-white/5 p-4 flex items-center justify-center">
                                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_-20%,#fbbf24,transparent)]" />
                                            <Target size={48} className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: 'Growth', val: '12.4%', color: 'emerald' },
                                            { label: 'Retention', val: '97.9%', color: 'emerald' },
                                            { label: 'EBITDA', val: '$4.2M', color: 'sky' },
                                            { label: 'Churn', val: '2.1%', color: 'rose' }
                                        ].map(stat => (
                                            <div key={stat.label} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                                <div className={`text-[10px] font-black text-${stat.color}-600 dark:text-${stat.color}-400 uppercase mb-1`}>{stat.label}</div>
                                                <div className="text-lg font-black text-slate-900 dark:text-white leading-none">{stat.val}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-5 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 overflow-hidden relative group">
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                        <h4 className="font-black text-sm mb-1 uppercase tracking-tight">Market Expansion</h4>
                                        <p className="text-xs font-bold text-emerald-100">Southeast Region High Priority</p>
                                        <button className="mt-4 px-4 py-2 bg-white text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Generate Analysis</button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="operational-sidebar"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className="space-y-8"
                                >
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Priority Incidents</h3>
                                    <div className="space-y-4">
                                        {[
                                            { id: 'TKT-991', title: 'Power Grid Unstable', type: 'critical', tech: 'Alex' },
                                            { id: 'TKT-842', title: 'Asset Comm Failure', type: 'warning', tech: 'Sarah' },
                                            { id: 'TKT-703', title: 'System Optimization', type: 'info', tech: 'Mike' }
                                        ].map(inc => (
                                            <motion.div
                                                whileHover={{ x: 5 }}
                                                key={inc.id}
                                                className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-sky-500/50 shadow-sm transition-all cursor-pointer"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={clsx(
                                                        "w-1 h-10 rounded-full shrink-0 mt-1",
                                                        inc.type === 'critical' ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" :
                                                            inc.type === 'warning' ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" :
                                                                "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                                                    )} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-black text-slate-400 tracking-tighter uppercase">{inc.id}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Users size={10} /> {inc.tech}</span>
                                                        </div>
                                                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate group-hover:text-sky-600 transition-colors">{inc.title}</h4>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset Utilization</h3>
                                        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <Zap className="text-orange-500" size={24} />
                                                    <span className="text-2xl font-black italic">84.2%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                                                    <div className="h-full w-[84%] bg-gradient-to-r from-orange-600 to-orange-400 rounded-full" />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Peak Load Optimization Active</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </aside>

                {/* Map Section */}
                <section className="flex-1 relative bg-slate-200 dark:bg-slate-950 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <FleetMap perspective={perspective} />
                    </div>

                    {/* Floating Map Controls */}
                    <div className="absolute top-8 left-8 flex flex-col gap-3 z-40">
                        {[
                            { icon: LayoutGrid, label: 'Layers' },
                            { icon: MapIcon, label: 'Grid' },
                            { icon: Maximize2, label: 'Fullscreen' }
                        ].map(control => (
                            <button
                                key={control.label}
                                className="group flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl hover:bg-orange-500 hover:text-white transition-all duration-500"
                            >
                                <control.icon size={18} />
                                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                    {control.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Global Asset Feed Bar */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
                        <motion.div
                            layout
                            className="px-8 py-4 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center gap-10"
                        >
                            <div className="flex items-center gap-4 border-r border-white/10 pr-10">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase leading-none mb-1">Fleet Health</p>
                                    <p className="text-xl font-black text-white leading-none tracking-tighter">98.4%</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <Activity size={20} />
                                </div>
                            </div>

                            <div className="flex items-center gap-8 text-white min-w-[300px]">
                                {[
                                    { label: 'Active', val: 142, icon: Zap, color: 'text-orange-500' },
                                    { label: 'Pending', val: 12, icon: Clock, color: 'text-sky-500' },
                                    { label: 'Critical', val: 3, icon: Activity, color: 'text-rose-500' }
                                ].map(status => (
                                    <div key={status.label} className="flex items-center gap-3">
                                        <status.icon size={14} className={status.color} />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase leading-none mb-1">{status.label}</p>
                                            <p className="text-sm font-black leading-none">{status.val}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pl-10 border-l border-white/10">
                                <button className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:scale-105 transition-all shadow-lg shadow-orange-500/20 active:scale-95">
                                    Dispatch Unit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Right Analytics Sidebar (Optional/Conditional) */}
                <aside className="w-20 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col items-center py-8 gap-8 z-40">
                    <button className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all group">
                        <LayoutGrid size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                    <div className="w-8 h-px bg-slate-100 dark:bg-slate-800" />
                    {[Users, Ticket, Clock, CheckCircle].map((Icon, i) => (
                        <button key={i} className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all relative">
                            <Icon size={20} />
                            {i === 1 && <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900" />}
                        </button>
                    ))}
                    <div className="mt-auto">
                        <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all">
                            <TrendingUp size={20} />
                        </button>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default OperationsHub;
