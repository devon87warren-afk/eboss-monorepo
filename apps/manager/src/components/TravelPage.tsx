import React from 'react';
import GeminiTravelConcierge from './GeminiTravelConcierge';

export default function TravelPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Travel Concierge
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-Powered Travel Orchestration by Gemini
          </p>
        </div>
      </div>

      <GeminiTravelConcierge />
    </div>
  );
}
