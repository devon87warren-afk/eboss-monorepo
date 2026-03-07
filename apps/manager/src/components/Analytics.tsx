import React, { useState } from 'react';
import { useAppContext } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sparkles } from 'lucide-react';

const Analytics: React.FC = () => {
  const { tickets } = useAppContext();
  const [recommendations, setRecommendations] = useState([
    {
      type: 'Alert',
      title: 'Batch BATCH-24-Q1 Alert',
      description: 'High frequency of vibration issues in PowerMax X2000 units from this batch. Recommend proactive inspection of engine mounts for all units in rental fleet.'
    },
    {
      type: 'Info',
      title: 'Training Gap Identified',
      description: 'Multiple "Defect" tickets resolved as "User Error" regarding the new control panel. Suggest scheduling refresher training for Sunbelt Rentals staff.'
    }
  ]);

  // Process data for charts
  const defectsByModel: Record<string, number> = {};
  const defectsByCategory: Record<string, number> = {};

  tickets.forEach(t => {
    // Mock mapping serial to model (simplified)
    const model = t.unitSerialNumber.includes('X2000') ? 'PowerMax X2000' : 'EcoGen 500';
    defectsByModel[model] = (defectsByModel[model] || 0) + 1;
    defectsByCategory[t.category] = (defectsByCategory[t.category] || 0) + 1;
  });

  const modelChartData = Object.keys(defectsByModel).map(key => ({
    name: key,
    defects: defectsByModel[key]
  }));

  const categoryChartData = Object.keys(defectsByCategory).map(key => ({
    name: key,
    count: defectsByCategory[key]
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quality Analytics</h2>
        <p className="text-slate-500 dark:text-slate-400">Track defects, manufacturing bugs, and field issues.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Issues by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-dark-700" />
                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#e31b23" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Defects by Generator Model</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#e2e8f0" className="dark:stroke-dark-700" />
                <XAxis type="number" tick={{fontSize: 12}} stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="defects" fill="#8dc63f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="text-brand-600" size={20} />
              Quality Recommendations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">AI-powered insights from Gemini</p>
          </div>
        </div>

        <ul className="space-y-3">
          {recommendations.map((rec, idx) => (
             <li key={idx} className={`flex items-start gap-3 p-4 rounded-lg border ${
               rec.type === 'Alert'
                 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
                 : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30'
             }`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                rec.type === 'Alert'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}>
                {rec.type === 'Alert' ? '!' : 'i'}
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${
                  rec.type === 'Alert'
                    ? 'text-red-900 dark:text-red-200'
                    : 'text-blue-900 dark:text-blue-200'
                }`}>{rec.title}</p>
                <p className={`text-sm mt-1 ${
                  rec.type === 'Alert'
                    ? 'text-red-800 dark:text-red-300'
                    : 'text-blue-800 dark:text-blue-300'
                }`}>{rec.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Analytics;
