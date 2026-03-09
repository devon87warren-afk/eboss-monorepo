'use client';

import { useState } from 'react';
// TODO(EBOSS-111, 2026-03-08): AnimatePresence imported for planned message
// transition animations; suppress until the feature is implemented.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

export default function GeminiAiPage() {
    const [messages] = useState([
        { type: 'ai', text: 'SYNC_COMPLETE. Logistics analysis ready.' },
        { type: 'ai', text: 'I recommend moving your hotel reservation closer to SITE-A for the Feb 13 deployment. Traffic data suggests a 45min delay from current location.' },
    ]);

    return (
        <div className="flex flex-col gap-6">
            <section className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden min-h-[400px] flex flex-col shadow-2xl">
                <div className="bg-white/5 p-3 flex items-center gap-2 border-b border-white/5">
                    <span className="material-symbols-outlined text-blue-400 text-sm">auto_awesome</span>
                    <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-[0.2em]">Gemini_Assistant_V4</span>
                </div>

                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/[0.03] border border-white/[0.05] p-3 rounded-lg max-w-[85%]"
                        >
                            <p className="text-xs text-blue-100/80 leading-relaxed font-mono">
                                {msg.text}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="p-3 border-t border-white/5 bg-white/5">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Ask Gemini for logistics help..."
                            className="w-full bg-[#09090b] border border-white/10 rounded-lg p-2.5 pr-12 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all group-hover:border-white/20"
                        />
                        <div className="absolute right-2 top-2 flex items-center gap-2">
                            <span className="text-[8px] font-mono text-white/20 mr-1 hidden sm:block">CMD + K</span>
                            <button className="material-symbols-outlined text-blue-400 hover:text-blue-300 transition-colors">
                                send
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
                <div className="bg-[#121214] border border-white/10 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-emerald-500 text-lg">bolt</span>
                        <span className="text-[10px] font-bold text-white/50 uppercase">Score</span>
                    </div>
                    <p className="text-2xl font-mono font-bold text-white">94%</p>
                    <p className="text-[9px] text-white/30 uppercase mt-1">Efficiency Rating</p>
                </div>
                <div className="bg-[#121214] border border-white/10 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-red-500 text-lg">warning</span>
                        <span className="text-[10px] font-bold text-white/50 uppercase">Risks</span>
                    </div>
                    <p className="text-2xl font-mono font-bold text-white">1</p>
                    <p className="text-[9px] text-white/30 uppercase mt-1">Pending Warning</p>
                </div>
            </section>
        </div>
    );
}
