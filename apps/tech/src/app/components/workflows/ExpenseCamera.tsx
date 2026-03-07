"use client";

import { clsx } from "clsx";
import { Camera, Clock, Check, RefreshCw, X } from "lucide-react";
import { useState } from "react";


const PENDING_EXPENSES = [
    { id: 1, type: "receipt", status: "matching", amount: "45.20", vendor: "Chick-fil-A", date: "Today, 12:30 PM", matchFound: false },
    { id: 2, type: "receipt", status: "matched", amount: "350.00", vendor: "Delta Airlines", date: "Jan 12", matchFound: true, context: "Trip to DC" },
];

export default function ExpenseCamera() {
    const [isCameraActive, setIsCameraActive] = useState(false);

    return (
        <div className="flex h-full flex-col gap-6">
            {/* Main Action Area */}
            <div className="relative overflow-hidden rounded-sm border border-slate-800 bg-slate-900 shadow-none">
                {/* Camera Mockup */}
                <div className="aspect-video w-full bg-slate-950 flex flex-col items-center justify-center relative">
                    {!isCameraActive ? (
                        <div className="text-center space-y-4">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-sm bg-slate-900 border border-slate-800 text-slate-500">
                                <Camera size={32} />
                            </div>
                            <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Receipt_Scanner_V2</p>
                            <button
                                onClick={() => setIsCameraActive(true)}
                                className="rounded-sm bg-orange-600 px-6 py-2 font-bold uppercase tracking-wider text-white transition-transform active:scale-95 hover:bg-orange-500"
                            >
                                Initialize_Camera
                            </button>
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-black">
                            {/* Live View Mock */}
                            <div className="absolute inset-4 border-2 border-dashed border-orange-500/50 rounded-sm flex items-center justify-center">
                                <p className="text-orange-500/80 font-mono text-xs uppercase animate-pulse">Align Receipt Edges</p>
                            </div>
                            <button
                                onClick={() => setIsCameraActive(false)}
                                className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-700 hover:bg-red-900/50 hover:border-red-500 hover:text-red-500 rounded-sm text-slate-400"
                            >
                                <X size={20} />
                            </button>
                            <button className="absolute bottom-8 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full border-4 border-white/20 bg-white/10 hover:bg-white/30 transition-colors"></button>
                        </div>
                    )}
                </div>
            </div>

            {/* Pending List */}
            <div className="flex-1 space-y-4 rounded-sm border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <Clock size={14} className="text-orange-500" /> Pending Reconciliation
                </h3>

                <div className="space-y-2">
                    {PENDING_EXPENSES.map(item => (
                        <div key={item.id} className="flex items-center justify-between rounded-sm border border-slate-800 bg-slate-950/50 p-3 hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "flex h-8 w-8 items-center justify-center rounded-sm border",
                                    item.matchFound
                                        ? "border-green-900/50 bg-green-900/10 text-green-500"
                                        : "border-amber-900/50 bg-amber-900/10 text-amber-500"
                                )}>
                                    {item.matchFound ? <Check size={16} /> : <RefreshCw size={16} className="animate-spin-slow" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">{item.vendor} <span className="text-slate-500 font-normal">(${item.amount})</span></p>
                                    <p className="font-mono text-[10px] text-slate-500 uppercase">
                                        {item.matchFound ? `LINKED: ${item.context}` : "SEARCHING_CONTEXT..."}
                                    </p>
                                </div>
                            </div>

                            {item.matchFound && (
                                <button className="rounded-sm bg-orange-600 px-3 py-1 text-[10px] font-bold uppercase text-white hover:bg-orange-500">
                                    Sync
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
