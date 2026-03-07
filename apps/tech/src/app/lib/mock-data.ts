
import { Plane, AlertTriangle, Receipt } from "lucide-react";

export const MOCK_USER = {
    name: "Devon Warren",
    role: "Applications Technician",
    location: "Las Vegas",
    status: "Available",
};

export const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        type: "travel",
        title: "Trip Proposal: Washington DC",
        desc: "Meeting with Sunbelt Rentals detected (Feb 12-14).",
        action: "Review Itinerary",
        priority: "high",
        icon: Plane,
    },
    {
        id: 2,
        type: "alert",
        title: "Downed Unit: EBOSS-104",
        desc: "Critical Inverter Fault at Site 44 (Reston, VA).",
        action: "Dispatch",
        priority: "critical",
        icon: AlertTriangle,
    },
    {
        id: 3,
        type: "expense",
        title: "Receipt Matched (Waiting)",
        desc: "Found 'Delta Airlines' email ($450). Waiting for photo/approval.",
        action: "Verify",
        priority: "medium",
        icon: Receipt,
    },
];

export const MOCK_STATS = [
    { label: "Fuel Saved (Gal)", value: "1,240", change: "+12%" },
    { label: "CO2 Reduced (Tons)", value: "8.5", change: "+5%" },
    { label: "Silent Hours", value: "340", change: "+8%" },
    { label: "Active Jobs", value: "3", change: "0" },
];
