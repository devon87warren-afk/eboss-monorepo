/**
 * FleetMap - Real-time technician location tracking
 * BACKEND: Leaflet (React-Leaflet)
 * FEATURE: Directional Bearings for Icons
 */

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { clsx } from 'clsx';

// --- TYPES (Same) ---
export interface Coordinates { lat: number; lng: number; }
export interface TravelSegment { from: string; to: string; origin: Coordinates; destination: Coordinates; mode: 'flight' | 'drive'; departureTime: string; arrivalTime: string; progress: number; }
export interface TechnicianLocation { id: number; name: string; status: 'On-Site' | 'Traveling' | 'Available'; client: string | null; task: string; lat: number; lng: number; travel: TravelSegment | null; }

const MOCK_TECH_LOCATIONS: TechnicianLocation[] = [
  { id: 1, name: "Alex Tech", status: "On-Site", client: "Sunbelt Rentals", task: "Comm DC", lat: 38.9072, lng: -77.0369, travel: null },
  { id: 2, name: "Sarah Field", status: "Traveling", client: "United Rentals", task: "Travel to Austin", lat: 34.0, lng: -95.0, travel: { from: "Denver", to: "Austin", origin: { lat: 39.8561, lng: -104.6737 }, destination: { lat: 30.1975, lng: -97.6664 }, mode: "flight", departureTime: "8:00 AM", arrivalTime: "11:15 AM", progress: 60 } },
  { id: 3, name: "Mike Lead", status: "Available", client: null, task: "Remote Triage", lat: 39.7392, lng: -104.9903, travel: null },
  { id: 4, name: "Jordan Ops", status: "On-Site", client: "Herc Rentals", task: "PM Checklist", lat: 33.4484, lng: -112.0740, travel: null },
  { id: 5, name: "Casey Tech", status: "Traveling", client: "Aggreko", task: "Site Call", lat: 40.7128, lng: -74.0060, travel: { from: "NYC HQ", to: "Boston", origin: { lat: 40.7128, lng: -74.0060 }, destination: { lat: 42.3601, lng: -71.0589 }, mode: "drive", departureTime: "9:00 AM", arrivalTime: "1:30 PM", progress: 45 } },
  { id: 6, name: "West Coast Rep", status: "On-Site", client: "Tesla Energy", task: "Battery Install", lat: 37.7749, lng: -122.4194, travel: null },
  { id: 7, name: "Cross Country", status: "Traveling", client: "Emergency", task: "Relocation", lat: 0, lng: 0, travel: { from: "Vegas", to: "Miami", origin: { lat: 36.1699, lng: -115.1398 }, destination: { lat: 25.7617, lng: -80.1918 }, mode: "flight", departureTime: "6:00 AM", arrivalTime: "2:00 PM", progress: 35 } }
];

// --- MATH HELPERS ---

function getCurvePosition(start: Coordinates, end: Coordinates, progress: number): [number, number] {
  const t = progress / 100;
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  const dist = Math.sqrt(Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2));
  const arcHeight = dist * 0.2;
  const controlLat = midLat + arcHeight;
  const controlLng = midLng;

  const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * controlLat + t * t * end.lat;
  const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * controlLng + t * t * end.lng;
  return [lat, lng];
}

// Calculate Bearing (Rotation) of the icon based on future position
function getBearing(start: Coordinates, end: Coordinates, progress: number): number {
  // Current pos
  const [lat1, lng1] = getCurvePosition(start, end, progress);
  // Future pos (small delta)
  const [lat2, lng2] = getCurvePosition(start, end, Math.min(progress + 1, 100));

  // Simple angle calculation (accurate enough for visual marker rotation)
  const dy = lat2 - lat1;
  const dx = lng2 - lng1;

  // In Leaflet/SVG, rotation is usually clockwise from North (or East).
  // Math.atan2 returns angle from X axis (East).
  // Lat is Y, Lng is X.
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Adjust for Icon orientation. 
  // Icons usually point UP (North). 
  // If standard math angle is from East (0deg), North is 90deg.
  // We want to rotate the icon to match the vector.
  // Vector (1,0) [East] -> angle 0. Rot = 90?
  // Let's rely on standard bearing formula:
  // Bearing = atan2(X,Y). 

  // Use proper spherical bearing if exact precision needed, but planar approx fine for small delta.
  // In CSS rotate, 0deg is Up (usually).
  // dx is longitude change (X), dy is latitude change (Y).
  // We want the angle relative to Up (Y axis).
  // Angle = 90 - atan2(dy, dx)

  return 90 - angle;
}


// --- MARKER STYLES ---

// Standard Tech (Non-Travel)
const createTechIcon = (tech: TechnicianLocation, selected: boolean) => {
  const color = tech.status === 'On-Site' ? '#f97316' : '#64748b';
  const html = `
        <div class="flex flex-col items-center justify-center -translate-y-full group">
            <div class="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center font-bold text-white text-[10px]" style="background-color: ${color}">
                ${tech.status === 'On-Site' ? '⚡' : '●'}
            </div>
            <div class="mt-1 bg-white text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                ${tech.name}
            </div>
        </div>
    `;
  return new L.DivIcon({ html, className: 'bg-transparent', iconSize: [40, 40], iconAnchor: [20, 20] });
};

// Travel Vehicle (Applied Rotation)
const createVehicleIcon = (mode: 'flight' | 'drive', color: string, bearing: number) => {
  // We rotate the INNER SVG, not the Div, to keep the anchor stable.
  // Standard icon points UP.
  // The bearing is calculated as "Degrees Clockwise from North".

  // Plane: Usually points UP in icon.
  // Car: Usually points UP or Side.
  // Let's assume Lucide icons are Up-oriented or we adjust.
  // Lucide Plane points Up-Right (45deg). So we subtract 45.

  const rotation = mode === 'flight' ? bearing - 45 : bearing;

  // We use a clean Arrow shape for "Pointing the way" as requested ("acting as arrows")
  // Or we use the vehicle icon heavily styled as a pointer.

  const html = `
        <div class="relative w-8 h-8 flex items-center justify-center perspective-500">
             <!-- Directional Cone/Arrow behind -->
             <div style="transform: rotate(${bearing}deg); transition: transform 0.5s;" class="absolute inset-0 flex items-center justify-center opacity-30">
                 <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[20px]" style="border-bottom-color: ${color}"></div>
             </div>
             
             <!-- Vehicle Icon -->
             <div style="transform: rotate(${rotation}deg); transition: transform 0.5s;" class="relative z-10 drop-shadow-md">
                 ${mode === 'flight' ?
      `<svg width="24" height="24" fill="${color}" viewBox="0 0 24 24" stroke="white" stroke-width="1.5"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>` :
      `<svg width="20" height="20" fill="${color}" viewBox="0 0 24 24" stroke="white" stroke-width="1.5"><path d="M12 2L2 22h20L12 2z"/></svg>` // Generic Arrow for Drive/Other as Car icons are boxy
    }
             </div>
        </div>
    `;
  return new L.DivIcon({ html, className: 'bg-transparent', iconSize: [32, 32], iconAnchor: [16, 16] });
};

// ... getCurvePoints helper (same as previous)
function getCurvePoints(start: Coordinates, end: Coordinates): [number, number][] {
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;
  const dist = Math.sqrt(Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2));
  const arcHeight = dist * 0.2;
  const controlLat = midLat + arcHeight;
  const controlLng = midLng;
  const points: [number, number][] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * controlLat + t * t * end.lat;
    const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * controlLng + t * t * end.lng;
    points.push([lat, lng]);
  }
  return points;
}

import TechScheduleModal from './TechScheduleModal';

export default function FleetMap({
  locations = MOCK_TECH_LOCATIONS,
  onTechnicianSelect,
  className,
  perspective = 'operational'
}: {
  locations?: TechnicianLocation[],
  onTechnicianSelect?: (t: TechnicianLocation) => void,
  className?: string,
  perspective?: 'strategic' | 'operational'
}) {
  const [selectedTech, setSelectedTech] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTechClick = (tech: TechnicianLocation) => {
    setSelectedTech(tech.id);
    setIsModalOpen(true);
    onTechnicianSelect?.(tech);
  };

  const activeTech = selectedTech ? locations.find((t: TechnicianLocation) => t.id === selectedTech) : null;

  // Strategic Heatmap Data (New Sales Leads)
  const heatmapData = [
    { pos: [37.7749, -122.4194], radius: 100, color: '#fbbf24', val: '$2.4M', label: 'West Hub' }, // Golden
    { pos: [30.2672, -97.7431], radius: 80, color: '#f59e0b', val: '$1.8M', label: 'Texas Hub' },  // Amber
    { pos: [40.7128, -74.0060], radius: 120, color: '#fbbf24', val: '$4.1M', label: 'East Hub' },  // Golden
    { pos: [25.7617, -80.1918], radius: 60, color: '#fcd34d', val: '$0.9M', label: 'South Hub' },  // Yellow
  ];

  return (
    <div className={clsx("relative w-full aspect-[5/3] overflow-hidden rounded-lg shadow-sm border border-slate-300 bg-slate-50", className)}>
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ background: '#f8fafc' }}
      >
        <TileLayer
          attribution='&copy; CARTO'
          url={perspective === 'strategic'
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          }
          maxZoom={19}
        />

        {/* Strategic View: Vibrant Sales Heatmap */}
        {perspective === 'strategic' && heatmapData.map((d, i) => (
          <Marker
            key={`heat-${i}`}
            position={d.pos as [number, number]}
            icon={new L.DivIcon({
              html: `
                <div class="relative flex items-center justify-center">
                    <!-- Core Glow -->
                    <div class="absolute w-32 h-32 rounded-full blur-2xl opacity-80" style="background: ${d.color}; filter: saturate(2);"></div>
                    
                    <!-- Sharp Indicator Ring -->
                    <div class="absolute w-14 h-14 rounded-full border-4 border-white shadow-[0_0_15px_rgba(255,255,255,0.8)] flex items-center justify-center font-black text-[11px] text-white z-10" style="background: ${d.color}">
                        ${d.val}
                    </div>
                    
                    <!-- Floating Label -->
                    <div class="absolute top-10 whitespace-nowrap bg-slate-900 border border-white/20 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-2xl z-20">
                        ${d.label}
                    </div>
                </div>`,
              className: 'bg-transparent',
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            })}
          />
        ))}

        {/* Operational View: Asset Tracking */}
        {perspective === 'operational' && (
          <>
            {/* Static Techs */}
            {locations.filter((t: TechnicianLocation) => !t.travel).map((tech: TechnicianLocation) => (
              <Marker
                key={tech.id}
                position={[tech.lat, tech.lng]}
                icon={createTechIcon(tech, selectedTech === tech.id)}
                eventHandlers={{ click: () => handleTechClick(tech) }}
              />
            ))}

            {/* Traveling Techs */}
            {locations.filter((t: TechnicianLocation) => t.travel).map((tech: TechnicianLocation) => {
              if (!tech.travel) return null;
              const pathPoints = getCurvePoints(tech.travel.origin, tech.travel.destination);
              const techPos = getCurvePosition(tech.travel.origin, tech.travel.destination, tech.travel.progress);
              const bearing = getBearing(tech.travel.origin, tech.travel.destination, tech.travel.progress);
              const color = tech.travel.mode === 'flight' ? '#0284c7' : '#d97706';

              return (
                <div key={`travel-group-${tech.id}`}>
                  <Polyline
                    positions={pathPoints}
                    pathOptions={{ color: color, weight: 3, dashArray: '1, 6', opacity: 0.6 }}
                  />
                  {/* Terminals */}
                  <Marker position={[tech.travel.origin.lat, tech.travel.origin.lng]} icon={new L.DivIcon({ html: `<div class="w-1.5 h-1.5 rounded-full border border-${color}" style="border-color: ${color}"></div>`, className: 'bg-transparent' })} />
                  <Marker position={[tech.travel.destination.lat, tech.travel.destination.lng]} icon={new L.DivIcon({ html: `<div class="w-1.5 h-1.5 rounded-full border border-${color}" style="border-color: ${color}"></div>`, className: 'bg-transparent' })} />

                  <Marker
                    position={techPos}
                    icon={createVehicleIcon(tech.travel.mode, color, bearing)}
                    eventHandlers={{ click: () => handleTechClick(tech) }}
                    zIndexOffset={100}
                  />
                </div>
              );
            })}
          </>
        )}
      </MapContainer>

      {/* Legend - Dynamic based on Perspective */}
      <div className="absolute top-4 right-4 z-[500] bg-white/90 dark:bg-slate-900/90 backdrop-blur p-2 rounded shadow border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
        <div className="mb-1 uppercase tracking-wider">{perspective === 'strategic' ? 'New Sales Opportunity' : 'Asset Status'}</div>
        <div className="flex gap-3">
          {perspective === 'strategic' ? (
            <>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> High Value</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Emerging</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-200" /> Lead Gen</span>
            </>
          ) : (
            <>
              <span className="text-orange-500 flex items-center gap-1">⚡ On-Site</span>
              <span className="text-sky-600 flex items-center gap-1">✈ Traveling</span>
              <span className="text-slate-500 flex items-center gap-1">● Idle</span>
            </>
          )}
        </div>
      </div>

      {/* Schedule Modal Overlay */}
      {isModalOpen && activeTech && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
          <TechScheduleModal tech={activeTech} onClose={() => setIsModalOpen(false)} />
        </div>
      )}
    </div>
  );
}
