import React, { useState } from 'react';
import { FileText, Download, Zap, AlertTriangle, ChevronDown, ChevronRight, CircuitBoard, Book, Battery, Sun } from 'lucide-react';

const Resources: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'specs' | 'schematics' | 'troubleshoot'>('specs');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const SPEC_SHEETS = [
    { title: 'EBOSS 70-25 Hybrid System', model: 'BOSS70-25', size: '3.2 MB', date: '2024-03-10' },
    { title: 'EBOSS 25-25 Compact Hybrid', model: 'EB-2525-H', size: '2.8 MB', date: '2024-02-15' },
    { title: 'EBOSS 125-65 High-Output', model: 'EB-12565-H', size: '4.1 MB', date: '2024-01-20' },
    { title: 'LTO Battery Tech & BMS Guide', model: 'LTO-GEN3', size: '1.5 MB', date: '2024-03-01' },
  ];

  const SCHEMATICS = [
    { title: 'LTO Battery Bus & BMS Layout', type: 'Logic', id: 'SCH-BMS-48', icon: Battery },
    { title: 'Hybrid Transfer Switch Path', type: 'Wiring', id: 'DWG-HTS-001', icon: Zap },
    { title: 'SDG125 Generator Interface', type: 'Wiring', id: 'DWG-GEN-IF', icon: CircuitBoard },
    { title: 'Solar Array Micro-Inverter Loop', type: 'Layout', id: 'LAY-SOL-QS', icon: Sun },
  ];

  const TROUBLESHOOTING = [
    {
      id: 'ts-1',
      issue: 'Hybrid Mode: Generator Fails to Charge',
      steps: [
        'Check "Remote Start" toggle in EBOSS 10-inch controller settings.',
        'Verify 2-wire start harness continuity to Generator ECU.',
        'Inspect LTO stack voltage (Expected > 42VDC per module).',
        'Check for "External Fault" on Micro-Inverter feedback loop.'
      ]
    },
    {
      id: 'ts-2',
      issue: 'Inverter Fault: "LTO Thermal Warning"',
      steps: [
        'Verify Arctic/Desert package heater/fan status.',
        'Check air intake filters for debris/blockage.',
        'Monitor individual cell temps via BMS diagnostic port.',
        'Ensure load demand is not exceeding continuous rating (kW Meter Check).'
      ]
    },
    {
      id: 'ts-3',
      issue: 'Telematics: Sync Latency / No Data',
      steps: [
        'Check iMonnit Gateway connectivity status (Online/Offline LED).',
        'Verify antenna orientation and clear line-of-sight.',
        'Restart 10-inch control panel via "System Reboot" menu.',
        'Inspect CAT6 connection between PLC and Gateway.'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ textShadow: "2px 2px 7px rgba(155, 155, 155, 1)" }}>Technical Library</h2>
          <p className="text-slate-500">Spec Sheets, Schematics, and Troubleshooting for <span className="text-accent-600 font-bold">EBOSS Hybrid Power Systems</span>.</p>
        </div>
        <div className="bg-white px-3 py-1 rounded border border-slate-200 text-xs font-mono text-slate-500 flex items-center gap-2">
          <Zap size={14} className="text-accent-500" />
          EBOSS-DOCS-v2.4
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${activeTab === 'specs' ? 'border-brand-500 text-brand-600 bg-gray-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-400'}`}
          >
            <FileText size={18} /> <div style={{ color: "rgba(74, 74, 74, 1)" }}> Spec Sheets</div>
          </button>
          <button
            onClick={() => setActiveTab('schematics')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${activeTab === 'schematics' ? 'border-brand-500 text-brand-600 bg-gray-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-400'}`}
          >
            <CircuitBoard size={18} style={{ color: "rgba(208, 2, 27, 1)" }} /> <div style={{ color: "rgba(74, 74, 74, 1)" }}> Wire Diagrams</div>
          </button>
          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${activeTab === 'troubleshoot' ? 'border-brand-500 text-brand-600 bg-gray-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-400'}`}
          >
            <Zap size={18} style={{ color: "rgba(208, 2, 27, 1)" }} /> <div style={{ color: "rgba(74, 74, 74, 1)" }}> Troubleshooting</div>
          </button>
        </div>

        <div className="p-6 min-h-[362px] bg-black" style={{ backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "cover" }}>

          {/* SPEC SHEETS TAB */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Book className="text-brand-600" size={20} /> Product Documentation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SPEC_SHEETS.map((doc, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:border-brand-400 hover:shadow-md transition-all group cursor-pointer" style={{ backgroundColor: "rgba(155, 155, 155, 1)" }}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="bg-slate-100 p-2 rounded border border-slate-200 text-brand-600">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{doc.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">Model: {doc.model}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-accent-50 text-accent-700 px-1.5 rounded border border-accent-200">Hybrid</span>
                            <p className="text-xs text-slate-400">Updated: {doc.date}</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{doc.size}</span>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button className="text-sm font-bold text-brand-600 flex items-center gap-1 hover:underline">
                        Download PDF <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCHEMATICS TAB */}
          {activeTab === 'schematics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <CircuitBoard className="text-brand-600" size={20} /> EBOSS Hybrid System Schematics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SCHEMATICS.map((drawing, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden group hover:shadow-lg transition-all bg-white">
                    <div className="h-48 bg-slate-800 relative flex items-center justify-center overflow-hidden">
                      {/* Blueprint Effect */}
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                      <drawing.icon className="text-accent-500 opacity-80 group-hover:scale-110 transition-transform duration-500" size={64} />
                      <div className="absolute bottom-2 right-2 bg-brand-600 text-white text-xs px-2 py-1 rounded font-mono shadow-sm">
                        {drawing.id}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{drawing.type}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg group-hover:text-brand-600 transition-colors">{drawing.title}</h4>
                      <button className="mt-4 w-full py-2 border border-slate-300 rounded text-slate-600 font-bold hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors text-sm">
                        View Full Diagram
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TROUBLESHOOTING TAB */}
          {activeTab === 'troubleshoot' && (
            <div className="max-w-3xl">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Zap className="text-amber-500" size={20} /> Common Faults & Solutions
              </h3>
              <div className="space-y-3">
                {TROUBLESHOOTING.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <button
                      onClick={() => toggleAccordion(item.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-amber-500" />
                        <span className="font-bold text-slate-800">{item.issue}</span>
                      </div>
                      {openAccordion === item.id ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                    </button>

                    {openAccordion === item.id && (
                      <div className="p-4 bg-slate-50 border-t border-slate-100 pl-11">
                        <p className="text-sm font-bold text-slate-700 mb-2">Recommended Steps:</p>
                        <ul className="space-y-2 text-sm text-slate-600">
                          {item.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-accent-500 mt-1">•</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-navy-900/50 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Battery className="text-orange-500" size={20} />
                    <h4 className="font-bold text-white">LTO Battery Advantage</h4>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li>• <span className="text-orange-400 font-bold">90,000 Cycles:</span> Up to 20x the life of traditional NMC/LFP batteries.</li>
                    <li>• <span className="text-orange-400 font-bold">Extreme Range:</span> Operates from -22°F to 130°F (-50°F with Arctic pack).</li>
                    <li>• <span className="text-orange-400 font-bold">Fast Charging:</span> Generator charge ready in ~30 minutes for 15kWh modules.</li>
                  </ul>
                </div>
                <div className="p-4 bg-navy-900/50 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="text-emerald-500" size={20} />
                    <h4 className="font-bold text-white">Efficiency Metrics</h4>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li>• <span className="text-emerald-400 font-bold">50-80% Savings:</span> Radical reduction in fuel and maintenance overhead.</li>
                    <li>• <span className="text-emerald-400 font-bold">Quiet Ops:</span> Low-load battery handling eliminates generator noise.</li>
                    <li>• <span className="text-emerald-400 font-bold">Zero Run-Away:</span> LTO chemistry is inherently non-combustible.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-4 bg-brand-50 rounded-lg border border-brand-100 flex items-start gap-3">
                <div className="bg-white p-2 rounded-full text-brand-600 border border-brand-100 shadow-sm">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-900">Need Advanced Support?</h4>
                  <p className="text-sm text-brand-800 mt-1">If these steps don't resolve the issue, create a Service Ticket with the <span className="font-bold underline">Critical</span> priority to alert the Tier 2 Engineering team.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Resources;
