"use client";

import { clsx } from "clsx";
import { LayoutDashboard, Plane, Receipt, Briefcase, Settings, LogOut, FileText, Database, QrCode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
    { label: "Cockpit", icon: LayoutDashboard, href: "/" },
    { label: "Active Jobs", icon: Briefcase, href: "/jobs" },
    { label: "Commissioning", icon: QrCode, href: "/commissioning" },
    { label: "Expense Auto", icon: Receipt, href: "/expenses" },
    { label: "Travel.ai", icon: Plane, href: "/travel" },
];

const UTILITY_ITEMS = [
    { label: "Docs", icon: FileText, href: "/docs" },
    { label: "Data", icon: Database, href: "/data" },
    { label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sticky top-0 z-50 flex h-screen w-20 flex-col border-r border-slate-800 bg-slate-950 text-white transition-all duration-300 md:w-64">
            {/* Brand Header - Industrial */}
            <div className="flex bg-orange-600/10 h-16 items-center px-4 md:px-6 border-b border-orange-500/20">
                <div className="relative h-8 w-8 flex-shrink-0">
                    <Image src="/brand/logos-ana/logo-icon.png" alt="EBOSS" fill className="object-contain" />
                </div>
                <span className="ml-3 hidden text-lg font-bold tracking-tighter text-white md:block">
                    EBOSS<span className="text-orange-500"> TECH APP</span>
                </span>
            </div>

            {/* Main Navigation - Rail Style */}
            <nav className="flex-1 space-y-1 p-3">
                <p className="px-3 pb-2 pt-4 text-xs font-mono font-medium uppercase tracking-widest text-slate-500 md:block hidden">
                    Operations
                </p>
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "group flex items-center rounded-sm px-3 py-2.5 text-sm font-medium transition-all hover:bg-white/5",
                                isActive
                                    ? "bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Icon size={20} className={isActive ? "text-white" : "text-slate-500 group-hover:text-white"} />
                            <span className="ml-3 hidden md:block">{item.label}</span>
                            {isActive && (
                                <div className="absolute left-0 h-6 w-1 bg-orange-400 shadow-[0_0_10px_#f97316]" />
                            )}
                        </Link>
                    );
                })}

                <div className="my-4 border-t border-slate-800/50" />

                <p className="px-3 pb-2 text-xs font-mono font-medium uppercase tracking-widest text-slate-500 md:block hidden">
                    System
                </p>
                {UTILITY_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group flex items-center rounded-sm px-3 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                        >
                            <Icon size={18} className="text-slate-600 group-hover:text-slate-300" />
                            <span className="ml-3 hidden md:block">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Panel - Technician ID */}
            <div className="border-t border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30">
                        <span className="text-xs font-bold">JD</span>
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-bold text-white">John Doe</p>
                        <p className="text-xs text-orange-500 font-mono">FIELD_LEVEL_3</p>
                    </div>
                    <button className="ml-auto text-slate-500 hover:text-white md:block hidden">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
