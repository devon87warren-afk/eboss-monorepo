
import React from 'react';

export const StatePaths = ({ regionColors }: { regionColors: Record<string, string> }) => (
    <g>
        {/* West Region (Red) */}
        {/* WA */} <path d="M120,30 L180,40 L175,85 L115,75 Z" fill={regionColors.West} stroke="white" strokeWidth="0.5" />
        {/* OR */} <path d="M115,75 L175,85 L170,135 L105,120 Z" fill={regionColors.West} stroke="white" strokeWidth="0.5" />
        {/* CA */} <path d="M105,120 L160,115 L180,240 L130,260 L90,160 Z" fill={regionColors.West} stroke="white" strokeWidth="0.5" />
        {/* ID */} <path d="M180,40 L210,50 L200,140 L160,135 L175,85 Z" fill={regionColors.West} stroke="white" strokeWidth="0.5" />
        {/* NV */} <path d="M160,115 L220,110 L210,210 L150,230 Z" fill={regionColors.West} stroke="white" strokeWidth="0.5" />
        {/* UT */} <path d="M220,110 L270,115 L260,200 L210,210 Z" fill={regionColors.West} stroke="white" strokeWidth="0.5" />
        {/* AZ */} <path d="M210,210 L260,200 L250,290 L180,270 Z" fill={regionColors.West} stroke="white" strokeWidth="0.5" />
        {/* MT */} <path d="M210,40 L350,55 L340,130 L200,120 Z" fill={regionColors.West} stroke="white" strokeWidth="0.5" />
        {/* WY */} <path d="M220,120 L330,130 L320,190 L220,180 Z" fill={regionColors.West} stroke="white" strokeWidth="0.5" />
        {/* CO */} <path d="M260,190 L360,200 L350,270 L250,260 Z" fill={regionColors.West} stroke="white" strokeWidth="0.5" />
        {/* NM */} <path d="M250,270 L340,275 L330,350 L240,340 Z" fill={regionColors.West} stroke="white" strokeWidth="0.5" />

        {/* North Region (Green) */}
        {/* ND */} <path d="M350,55 L440,60 L435,125 L340,120 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* SD */} <path d="M340,120 L435,125 L430,185 L330,180 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* NE */} <path d="M330,180 L430,185 L440,245 L320,240 L320,220 L330,220 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* KS */} <path d="M340,240 L450,245 L455,300 L350,295 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* MN */} <path d="M440,50 L520,60 L500,160 L440,160 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* IA */} <path d="M435,160 L510,165 L515,225 L430,220 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* MO */} <path d="M450,225 L530,230 L540,300 L455,310 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* WI */} <path d="M500,80 L560,90 L565,170 L510,165 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* IL */} <path d="M515,180 L570,185 L560,280 L525,290 L515,225 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* IN */} <path d="M570,190 L610,195 L600,270 L570,275 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* MI */} <path d="M570,100 L640,120 L620,180 L570,170 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* OH */} <path d="M610,195 L660,185 L650,250 L610,255 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />
        {/* KY */} <path d="M560,280 L680,260 L650,310 L540,300 Z" fill={regionColors.North} stroke="white" strokeWidth="0.5" />

        {/* South Region (Brown/Amber) */}
        {/* OK */} <path d="M350,300 L470,305 L480,350 L380,355 L380,320 L350,320 Z" fill={regionColors.South} stroke="white" strokeWidth="0.5" />
        {/* TX */} <path d="M330,320 L380,320 L380,355 L480,360 L500,450 L400,520 L300,420 Z" fill={regionColors.South} stroke="white" strokeWidth="0.5" />
        {/* AR */} <path d="M470,305 L540,310 L530,380 L480,370 Z" fill={regionColors.South} stroke="white" strokeWidth="0.5" />
        {/* LA */} <path d="M480,380 L530,380 L540,450 L500,440 Z" fill={regionColors.South} stroke="white" strokeWidth="0.5" />
        {/* MS */} <path d="M530,370 L570,370 L570,450 L540,440 Z" fill={regionColors.South} stroke="white" strokeWidth="0.5" />
        {/* AL */} <path d="M570,360 L610,360 L600,440 L570,440 Z" fill={regionColors.South} stroke="white" strokeWidth="0.5" />
        {/* TN */} <path d="M540,310 L680,300 L660,350 L530,355 Z" fill={regionColors.South} stroke="white" strokeWidth="0.5" />
        {/* GA */} <path d="M610,350 L660,360 L660,430 L600,430 Z" fill={regionColors.South} stroke="white" strokeWidth="0.5" />
        {/* FL */} <path d="M600,440 L700,440 L740,530 L660,500 L640,440 Z" fill={regionColors.South} stroke="white" strokeWidth="0.5" />

        {/* East Region (Blue) */}
        {/* NY */} <path d="M680,110 L740,100 L740,170 L670,165 Z" fill={regionColors.East} stroke="white" strokeWidth="0.5" />
        {/* PA */} <path d="M660,180 L730,170 L720,210 L660,210 Z" fill={regionColors.East} stroke="white" strokeWidth="0.5" />
        {/* WV */} <path d="M630,220 L670,220 L660,260 L620,250 Z" fill={regionColors.East} stroke="white" strokeWidth="0.5" />
        {/* VA */} <path d="M660,240 L730,230 L720,280 L640,280 Z" fill={regionColors.East} stroke="white" strokeWidth="0.5" />
        {/* NC */} <path d="M640,285 L740,280 L720,320 L650,320 Z" fill={regionColors.East} stroke="white" strokeWidth="0.5" />
        {/* SC */} <path d="M660,320 L730,320 L710,370 L660,360 Z" fill={regionColors.East} stroke="white" strokeWidth="0.5" />
        {/* New England Block */} <path d="M740,100 L800,80 L810,170 L740,170 Z" fill={regionColors.East} stroke="white" strokeWidth="0.5" />
    </g>
);
