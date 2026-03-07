"use client";

import { MOCK_NOTIFICATIONS } from "@/app/lib/mock-data";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ActionCenter() {
    return (
        <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
                <span className="h-2 w-2 bg-orange-500 rounded-none animate-pulse"></span>
                System_Actions
            </h2>
            <div className="grid gap-3">
                {MOCK_NOTIFICATIONS.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="group relative overflow-hidden border border-slate-800 bg-slate-900 transition-all hover:border-orange-500/50">
                                {/* Technical decorative line */}
                                <div className={clsx(
                                    "absolute left-0 top-0 bottom-0 w-1 transition-colors",
                                    item.priority === "critical" ? "bg-red-500" : "bg-orange-500/50 group-hover:bg-orange-500"
                                )} />

                                <CardHeader className="py-3 pl-4 pr-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "rounded-sm p-1.5",
                                                item.priority === "critical" ? "bg-red-500/10 text-red-500" : "bg-slate-800 text-slate-400 group-hover:text-orange-400"
                                            )}>
                                                <Icon size={16} />
                                            </div>
                                            <CardTitle className="font-mono text-sm font-medium text-slate-200">
                                                {item.title}
                                            </CardTitle>
                                        </div>
                                        {item.priority === "critical" && (
                                            <Badge variant="destructive" className="rounded-none px-1.5 py-0 font-mono text-[10px] uppercase">CRIT</Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="py-0 pl-4 pr-4 pb-3">
                                    <div className="ml-10 border-l border-slate-800 pl-3">
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {item.desc}
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="py-2 pl-14 pr-2 bg-slate-950/50 border-t border-slate-800/50">
                                    <Button
                                        variant="ghost"
                                        className="h-6 w-full justify-between p-0 text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:bg-transparent hover:text-orange-500"
                                    >
                                        {item.action}
                                        <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
