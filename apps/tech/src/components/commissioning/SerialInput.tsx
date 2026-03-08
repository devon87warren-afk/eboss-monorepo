"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { validateSerialNumber } from "@/services/commissioningService";

interface SerialInputProps {
    /** Called when the user submits a valid serial number */
    onSubmit: (serialNumber: string) => void;
    /** Whether a lookup is in progress */
    isLoading?: boolean;
    /** Optional error message to display */
    error?: string | null;
}

/**
 * SerialInput – manual serial number entry with format validation.
 *
 * Accepts serial numbers in the format: EBOSS-{MODEL}-{YEAR}-{SEQ}
 * Example: EBOSS-60KW-2025-001234
 */
export default function SerialInput({ onSubmit, isLoading = false, error = null }: SerialInputProps) {
    const [value, setValue] = useState("");
    const [touched, setTouched] = useState(false);

    const normalized = value.trim().toUpperCase();
    const isValid = normalized.length > 0 && validateSerialNumber(normalized);
    const showFormatError = touched && normalized.length > 0 && !isValid;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (isValid) {
            onSubmit(normalized);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setTouched(false);
                    }}
                    onBlur={() => setTouched(true)}
                    placeholder="EBOSS-60KW-2025-001234"
                    aria-label="Serial number"
                    disabled={isLoading}
                    className={clsx(
                        "w-full rounded-sm border bg-slate-950 px-4 py-3 pr-10 font-mono text-sm text-white placeholder:text-slate-600",
                        "focus:outline-none focus:ring-1",
                        showFormatError || error
                            ? "border-red-500/70 focus:ring-red-500/50"
                            : isValid
                            ? "border-green-500/70 focus:ring-green-500/50"
                            : "border-slate-700 focus:ring-orange-500/50"
                    )}
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {isValid ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                    ) : showFormatError || error ? (
                        <AlertCircle size={16} className="text-red-400" />
                    ) : null}
                </div>
            </div>

            {/* Format hint */}
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                Format: EBOSS-[30KW|60KW|100KW|150KW]-[YEAR]-[SEQ]
            </p>

            {/* Validation errors */}
            {showFormatError && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle size={12} />
                    Invalid serial number format
                </p>
            )}
            {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle size={12} />
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={isLoading || !isValid}
                className={clsx(
                    "flex w-full items-center justify-center gap-2 rounded-sm py-3 text-sm font-bold uppercase tracking-wider transition-all",
                    isLoading || !isValid
                        ? "cursor-not-allowed bg-slate-800 text-slate-500"
                        : "bg-orange-600 text-white hover:bg-orange-500 active:translate-y-px"
                )}
            >
                <Search size={16} />
                {isLoading ? "Searching..." : "Lookup_Unit"}
            </button>
        </form>
    );
}
