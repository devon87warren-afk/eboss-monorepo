"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2 } from "lucide-react";

interface QRScannerProps {
    /** Called when a QR code is successfully decoded */
    onScan: (value: string) => void;
    /** Whether the scanner is active */
    active?: boolean;
    /** Called when the user requests to close the scanner */
    onClose?: () => void;
}

const QR_REGION_ID = "eboss-qr-reader";

/**
 * QRScanner – device camera QR code reader using html5-qrcode.
 *
 * Dynamically imports html5-qrcode to avoid SSR issues.
 * Falls back gracefully when camera access is denied.
 */
export default function QRScanner({ onScan, active = true, onClose }: QRScannerProps) {
    const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
    const hasStarted = useRef(false);

    useEffect(() => {
        if (!active) return;

        let cancelled = false;

        async function startScanner() {
            try {
                setStatus("starting");

                // Dynamically import to avoid SSR breakage
                const { Html5Qrcode } = await import("html5-qrcode");

                if (cancelled) return;

                const scanner = new Html5Qrcode(QR_REGION_ID);
                scannerRef.current = scanner;
                hasStarted.current = true;

                await scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        if (!cancelled) {
                            onScan(decodedText);
                        }
                    },
                    () => {
                        // scan failure – ignore, keep trying
                    }
                );

                if (!cancelled) {
                    setStatus("scanning");
                }
            } catch (err: unknown) {
                if (cancelled) return;
                const message =
                    err instanceof Error ? err.message : "Camera access denied";
                setErrorMsg(message);
                setStatus("error");
            }
        }

        startScanner();

        return () => {
            cancelled = true;
            const scanner = scannerRef.current;
            if (scanner && hasStarted.current) {
                scanner.stop().catch(() => {}).finally(() => {
                    scanner.clear();
                    scannerRef.current = null;
                    hasStarted.current = false;
                });
            }
        };
    }, [active, onScan]);

    return (
        <div className="space-y-4">
            {/* Scanner viewport */}
            <div className="relative overflow-hidden rounded-sm border border-slate-700 bg-slate-950">
                {/* html5-qrcode mounts video here */}
                <div id={QR_REGION_ID} className="w-full" />

                {/* Overlay states */}
                {status === "idle" && (
                    <div className="flex h-48 items-center justify-center">
                        <Camera size={40} className="text-slate-600" />
                    </div>
                )}

                {status === "starting" && (
                    <div className="flex h-48 items-center justify-center gap-3 text-slate-400">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="font-mono text-xs uppercase tracking-wider">
                            Initialising Camera...
                        </span>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex h-48 flex-col items-center justify-center gap-2 px-4 text-center">
                        <CameraOff size={32} className="text-red-400" />
                        <p className="text-xs text-red-400">{errorMsg}</p>
                    </div>
                )}

                {/* Corner guides (decorative) */}
                {status === "scanning" && (
                    <>
                        <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-orange-500" />
                        <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-orange-500" />
                        <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-orange-500" />
                        <span className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-orange-500" />
                    </>
                )}
            </div>

            {status === "scanning" && (
                <p className="text-center font-mono text-[10px] uppercase tracking-widest text-slate-500">
                    Point camera at eBoss QR code
                </p>
            )}

            {onClose && (
                <button
                    onClick={onClose}
                    className="w-full rounded-sm border border-slate-700 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
                >
                    Cancel Scan
                </button>
            )}
        </div>
    );
}
