"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { QrCode, Keyboard, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import SerialInput from "@/components/commissioning/SerialInput";
import { lookupUnitBySerialNumber, validateSerialNumber } from "@/services/commissioningService";
import type { EbossUnit } from "@/types/database";

// QRScanner uses camera APIs – client-only
const QRScanner = dynamic(
    () => import("@/components/commissioning/QRScanner"),
    { ssr: false }
);

type Mode = "manual" | "qr";
type LookupState = "idle" | "loading" | "found" | "not_found" | "error";

/**
 * SerialLookup page – EBOSS Commissioning Module
 *
 * Allows field technicians to identify an eBoss unit by:
 *  1. Scanning the unit's QR code with the device camera
 *  2. Manually entering the serial number
 *
 * On successful lookup the unit details are shown and the technician
 * can proceed to the model-specific commissioning checklist.
 */
export default function SerialLookupPage() {
    const [mode, setMode] = useState<Mode>("manual");
    const [lookupState, setLookupState] = useState<LookupState>("idle");
    const [unit, setUnit] = useState<EbossUnit | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleLookup = useCallback(async (serialNumber: string) => {
        setLookupState("loading");
        setUnit(null);
        setErrorMsg(null);

        try {
            const result = await lookupUnitBySerialNumber(serialNumber);
            if (result) {
                setUnit(result);
                setLookupState("found");
            } else {
                setLookupState("not_found");
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Lookup failed";
            setErrorMsg(msg);
            setLookupState("error");
        }
    }, []);

    const handleQRScan = useCallback((raw: string) => {
        const normalized = raw.trim().toUpperCase();
        if (validateSerialNumber(normalized)) {
            // Stop scanning and run lookup
            setMode("manual");
            handleLookup(normalized);
        }
        // If the QR content doesn't match the serial format, silently ignore
        // and keep scanning – the scanner continues until a valid code is found.
    }, [handleLookup]);

    const reset = () => {
        setLookupState("idle");
        setUnit(null);
        setErrorMsg(null);
    };

    return (
        <div className="mx-auto max-w-lg p-6">
            {/* Header */}
            <div className="mb-8 flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-slate-700 bg-slate-800 p-2">
                    <Image
                        src="/brand/logo-icon.png"
                        alt="EBOSS"
                        width={48}
                        height={48}
                        className="h-full w-full object-contain opacity-80"
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white">
                        Serial<span className="text-orange-500">_Lookup</span>
                    </h1>
                    <p className="font-mono text-xs text-slate-500 uppercase tracking-wider">
                        Commissioning // Unit Identification
                    </p>
                </div>
            </div>

            {/* Mode tabs */}
            <div className="mb-6 flex gap-2">
                <button
                    onClick={() => { setMode("manual"); reset(); }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-sm border py-2.5 text-sm font-medium transition-all ${
                        mode === "manual"
                            ? "border-orange-500 bg-orange-600/10 text-orange-400"
                            : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
                    }`}
                >
                    <Keyboard size={16} />
                    Manual Entry
                </button>
                <button
                    onClick={() => { setMode("qr"); reset(); }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-sm border py-2.5 text-sm font-medium transition-all ${
                        mode === "qr"
                            ? "border-orange-500 bg-orange-600/10 text-orange-400"
                            : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
                    }`}
                >
                    <QrCode size={16} />
                    QR Scan
                </button>
            </div>

            {/* Input area */}
            <div className="rounded-sm border border-slate-800 bg-slate-900/50 p-6">
                {mode === "manual" ? (
                    <SerialInput
                        onSubmit={handleLookup}
                        isLoading={lookupState === "loading"}
                        error={lookupState === "error" ? errorMsg : null}
                    />
                ) : (
                    <QRScanner
                        active={mode === "qr"}
                        onScan={handleQRScan}
                        onClose={() => setMode("manual")}
                    />
                )}
            </div>

            {/* Result panel */}
            {lookupState === "found" && unit && (
                <div className="mt-6 rounded-sm border border-green-500/30 bg-green-500/5 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 size={20} className="shrink-0 text-green-400" />
                        <div>
                            <p className="font-bold text-white">Unit Found</p>
                            <p className="font-mono text-xs text-green-400">{unit.serial_number}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Model</p>
                            <p className="font-bold text-white">{unit.model}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Year</p>
                            <p className="font-bold text-white">{unit.year}</p>
                        </div>
                        {unit.customer_name && (
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Client</p>
                                <p className="font-bold text-white">{unit.customer_name}</p>
                            </div>
                        )}
                        {unit.site_location && (
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Site</p>
                                <p className="font-bold text-white">{unit.site_location}</p>
                            </div>
                        )}
                        {unit.status && (
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Status</p>
                                <p className="font-bold text-white">{unit.status}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            // TODO: navigate to checklist once implemented
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-sm bg-orange-600 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-orange-500 active:translate-y-px"
                    >
                        Load_Checklist
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {lookupState === "not_found" && (
                <div className="mt-6 rounded-sm border border-red-500/30 bg-red-500/5 p-5">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="shrink-0 text-red-400" />
                        <div>
                            <p className="font-bold text-white">Unit Not Found</p>
                            <p className="text-xs text-slate-400">
                                No unit found with that serial number, or it belongs to a different territory.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={reset}
                        className="mt-4 w-full rounded-sm border border-slate-700 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
