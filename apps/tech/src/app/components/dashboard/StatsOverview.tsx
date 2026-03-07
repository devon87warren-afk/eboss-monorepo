"use client";

import { Droplets, Gauge, Moon, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const STATS = [
    { label: "Fuel Saved", value: "1,240 Gal", icon: Droplets, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "CO2 Reduced", value: "4.2 Tons", icon: Gauge, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Silent Hours", value: "88 Hrs", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Active Jobs", value: "3", icon: Wrench, color: "text-ana-orange", bg: "bg-orange-500/10" },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function StatsOverview() {
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
            {STATS.map((stat) => (
                <motion.div key={stat.label} variants={item}>
                    <Card className="border border-slate-800 bg-slate-900 shadow-none transition-all hover:border-orange-500/50 hover:bg-slate-900/80">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-sm bg-slate-800 text-slate-400 ring-1 ring-inset ring-slate-700/50`}>
                                <stat.icon size={20} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
                                <h3 className="font-mono text-2xl font-bold tracking-tight text-white">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    );
}
