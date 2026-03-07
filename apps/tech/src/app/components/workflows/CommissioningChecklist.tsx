"use client";

import { CheckSquare, FileText, UploadCloud, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { clsx } from "clsx";

const CHECKLIST_ITEMS = [
    // Safety & Physical
    { id: "s1", label: "Inspect Mounting & Clear Debris (Intake/Exhaust)", type: "check" },
    { id: "s2", label: "Verify Grounding/Bonding Integrity (NETA Spec)", type: "check" },

    // Mechanical (Generator)
    { id: "m1", label: "Check Engine Oil & Coolant Levels", type: "check" },
    { id: "m2", label: "Fuel System: Valve Position & Leak Check", type: "check" },
    { id: "m3", label: "Starter Battery Voltage (Float)", type: "input", placeholder: "e.g. 27.4 VDC" },

    // Electrical (Power)
    { id: "e1", label: "Torque Power Connections to Spec", type: "check" },
    { id: "e2", label: "Phase Rotation Verification (ABC/CW)", type: "check" },
    { id: "e3", label: "Insulation Resistance (Megger Test - L-G)", type: "input", placeholder: "> 100 MΩ" },

    // VFD & Controls
    { id: "d1", label: "Input Motor Nameplate Data (V/A/Hz/RPM)", type: "check" },
    { id: "d2", label: "Perform Static Auto-Tune Routine", type: "check" },
    { id: "d3", label: "Verify Cooling Fan Operation (Direction)", type: "check" },

    // BESS / Hybrid
    { id: "b1", label: "Verify BMS Communication (Heartbeat)", type: "check" },
    { id: "b2", label: "Fire Suppression System Pressure Check", type: "check" },
];

export default function CommissioningChecklist() {
    const [items, setItems] = useState<{ [key: string]: boolean | string }>({});

    const toggleCheck = (id: string) => {
        setItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const updateInput = (id: string, val: string) => {
        setItems(prev => ({ ...prev, [id]: val }));
    };

    const progress = Math.round((Object.keys(items).filter(k => items[k]).length / CHECKLIST_ITEMS.length) * 100);

    return (
        <div className="space-y-6 rounded-sm border border-slate-800 bg-slate-900/50 p-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-slate-800 p-2 border border-slate-700">
                        <Image src="/brand/logo-icon.png" alt="EBOSS" width={48} height={48} className="h-full w-full object-contain opacity-80" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            Commissioning: EBOSS-104
                        </h2>
                        <p className="font-mono text-xs text-orange-500 uppercase tracking-wider">Site: Reston Data Center • Job #4421</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-mono text-3xl font-bold text-orange-500">{progress}%</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Complete</p>
                </div>
            </div>

            <div className="h-1 w-full bg-slate-800">
                <div className="h-full bg-orange-600 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            {/* Checklist */}
            <div className="space-y-2">
                {CHECKLIST_ITEMS.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-4 border-b border-slate-800/50 p-3 transition-colors hover:bg-white/5"
                    >
                        {item.type === "check" ? (
                            <button
                                onClick={() => toggleCheck(item.id)}
                                className={clsx(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-all",
                                    items[item.id]
                                        ? "border-orange-500 bg-orange-500 text-slate-950"
                                        : "border-slate-600 bg-transparent hover:border-orange-500/50"
                                )}
                            >
                                {items[item.id] && <CheckSquare size={14} />}
                            </button>
                        ) : (
                            <FileText size={20} className="text-slate-600" />
                        )}

                        <div className="flex-1">
                            <label className={clsx("text-sm font-medium transition-colors", items[item.id] ? "text-slate-200" : "text-slate-500")}>
                                {item.label}
                            </label>
                            {item.type === "input" && (
                                <input
                                    type="text"
                                    placeholder={item.placeholder}
                                    className="mt-2 w-full rounded-sm border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
                                    onChange={(e) => updateInput(item.id, e.target.value)}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Note */}
            <div className="rounded-sm border border-dashed border-slate-700 bg-slate-950/30 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <AlertCircle size={14} /> Observations
                </h4>
                <textarea
                    placeholder="Add site notes, photos, or anomalies..."
                    className="w-full resize-none bg-transparent text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none"
                    rows={2}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-orange-600 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-orange-500 active:translate-y-px">
                    <UploadCloud size={16} />
                    Finalize_Report
                </button>
            </div>
        </div>
    );
}
