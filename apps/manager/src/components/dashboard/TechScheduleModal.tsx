import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plane, Car, MapPin, X, ChevronRight, ChevronLeft, Clock, Building } from 'lucide-react';
import { clsx } from 'clsx';
import { TechnicianLocation } from './FleetMap'; // Import type for consistency

interface TechScheduleModalProps {
    tech: TechnicianLocation | null;
    onClose: () => void;
}

// Mock Data Generator for Calendar
const generateSchedule = (techName: string) => {
    // Generate dates for This Week (Week 1) and Next Week (Week 2)
    // Starting from a mock "Today" (Monday)
    const days = [];
    const today = new Date(); // Use real date for realism

    // Normalize to start of current week (Sunday/Monday)
    // For simplicity, let's just generate 14 days from "Today"
    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        // Mock Activities based on Tech status
        let type = 'available';
        let activity = null;

        if (i === 0) type = 'today'; // Highlight today

        // Mock Travel Logic
        if ([1, 4, 8].includes(i)) {
            type = 'travel';
            activity = {
                type: 'flight',
                from: 'DEN', to: 'AUS',
                time: '08:00 AM - 11:30 AM',
                airline: 'United 442',
                hotel: 'Marriott Downtown'
            };
        } else if ([2, 3, 5, 9, 10].includes(i)) {
            type = 'work';
            activity = {
                type: 'site',
                site: 'Project Alpha',
                location: 'Austin, TX',
                task: 'Commissioning'
            };
        }

        days.push({
            date: d,
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate(),
            status: type, // 'work', 'travel', 'available', 'off'
            details: activity
        });
    }
    return days;
};

export default function TechScheduleModal({ tech, onClose }: TechScheduleModalProps) {
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(0);

    if (!tech) return null;

    const schedule = generateSchedule(tech.name);
    const selectedDay = selectedDayIndex !== null ? schedule[selectedDayIndex] : null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row max-h-[80vh]"
                >
                    {/* Sidebar: Profile & Stats */}
                    <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-800 p-6 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {tech.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tech.name}</h2>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Senior Technician</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Current Status</div>
                                <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                                    <span className={clsx("w-2 h-2 rounded-full", tech.status === 'Traveling' ? 'bg-sky-500' : 'bg-orange-500')}></span>
                                    {tech.status}
                                </div>
                                {tech.client && (
                                    <div className="text-sm mt-1 text-slate-500">{tech.client}</div>
                                )}
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-2">Upcoming Travel</div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-300">Days Travel</span>
                                    <span className="font-bold text-slate-900 dark:text-white">3 Days</span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-2">
                                    <span className="text-slate-600 dark:text-slate-300">Next Trip</span>
                                    <span className="font-bold text-sky-600">AUS (Feb 5)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Calendar */}
                    <div className="w-full md:w-2/3 p-6 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Calendar className="text-slate-400" size={20} />
                                Schedule Overview
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        {/* 14 Day Grid */}
                        <div className="grid grid-cols-7 gap-2 mb-6">
                            {schedule.slice(0, 14).map((day, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedDayIndex(idx)}
                                    className={clsx(
                                        "cursor-pointer rounded-lg p-2 text-center border transition-all hover:shadow-md",
                                        selectedDayIndex === idx
                                            ? "bg-sky-50 dark:bg-sky-900/20 border-sky-500 ring-1 ring-sky-500"
                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-300",
                                        day.status === 'travel' && "border-b-4 border-b-sky-500",
                                        day.status === 'work' && "border-b-4 border-b-orange-500",
                                        idx === 0 && "bg-slate-50 font-bold"
                                    )}
                                >
                                    <div className="text-[10px] uppercase text-slate-400 mb-1">{day.dayName}</div>
                                    <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{day.dayNum}</div>
                                    {day.status === 'travel' && <Plane size={12} className="mx-auto mt-1 text-sky-500" />}
                                    {day.status === 'work' && <MapPin size={12} className="mx-auto mt-1 text-orange-500" />}
                                </div>
                            ))}
                        </div>

                        {/* Day Detail View */}
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            {selectedDay ? (
                                <motion.div
                                    key={selectedDay.date.toISOString()}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-4">
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                                                {selectedDay.dayName}, {selectedDay.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                            </h4>
                                            <div className="text-sm text-sky-600 font-medium capitalize">{selectedDay.status === 'today' ? 'Today' : selectedDay.status}</div>
                                        </div>
                                        {selectedDay.details?.type === 'flight' && (
                                            <button className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-sky-600 transition-colors">
                                                View Booking
                                            </button>
                                        )}
                                    </div>

                                    {/* Itinerary Details */}
                                    {selectedDay.status === 'travel' && selectedDay.details && (
                                        <div className="space-y-4">
                                            <div className="flex gap-4 items-start">
                                                <div className="bg-white p-2 rounded border border-slate-200 shadow-sm text-sky-500"><Plane size={24} /></div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">Flight to {selectedDay.details.to}</div>
                                                    <div className="text-sm text-slate-500">{selectedDay.details.time} • {selectedDay.details.airline}</div>
                                                    <div className="text-xs text-slate-400 mt-1">Conf: #HK8829</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 items-start">
                                                <div className="bg-white p-2 rounded border border-slate-200 shadow-sm text-indigo-500"><Building size={24} /></div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">Hotel Check-In</div>
                                                    <div className="text-sm text-slate-500">{selectedDay.details.hotel}</div>
                                                    <div className="text-xs text-slate-400 mt-1">2 Nights • King Bed</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedDay.status === 'work' && selectedDay.details && (
                                        <div className="flex gap-4 items-start">
                                            <div className="bg-white p-2 rounded border border-slate-200 shadow-sm text-orange-500"><MapPin size={24} /></div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{selectedDay.details.site}</div>
                                                <div className="text-sm text-slate-500">{selectedDay.details.task}</div>
                                                <div className="text-sm text-slate-500">{selectedDay.details.location}</div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedDay.status === 'available' && (
                                        <div className="text-center py-8 text-slate-400">
                                            <Clock size={48} className="mx-auto mb-2 opacity-20" />
                                            <div>No scheduled activities</div>
                                            <div className="text-sm">Available for dispatch</div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400">Select a day to view details</div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
