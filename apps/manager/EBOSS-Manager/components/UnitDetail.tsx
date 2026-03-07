
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../App';
import { MapPin, Calendar, Clock, BarChart2, FileText, ArrowLeft, CheckSquare, Plus, Activity, Zap, Thermometer, Battery, Signal, Radio, Sparkles, Download, Bell, AlertTriangle, CheckCircle, PlusCircle, Fuel } from 'lucide-react';
import { UnitStatus, TelemetryStatus, Ticket } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TicketDetailModal from './TicketDetailModal';
import TelemetrySensorCard from './TelemetrySensorCard';

const UnitDetail: React.FC = () => {
  const { serialNumber } = useParams<{ serialNumber: string }>();
  const { units, tickets } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'tickets'>('overview');
  const [activeMetric, setActiveMetric] = useState<string>('temperature');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const unit = units.find(u => u.serialNumber === serialNumber);
  const unitTickets = tickets.filter(t => t.unitSerialNumber === serialNumber);

  if (!unit) {
    return <div className="p-8 text-center">Unit not found</div>;
  }

  const lastReading = unit.recentReadings[unit.recentReadings.length - 1];
  
  // Logic to simulate time range changes using the mock data
  const getChartData = () => {
    let multiplier = 1;
    let labelFormat: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    
    if (timeRange === '7d') {
        multiplier = 7;
        labelFormat = { weekday: 'short', day: 'numeric' };
    } else if (timeRange === '30d') {
        multiplier = 30;
        labelFormat = { month: 'short', day: 'numeric' };
    }

    return unit.recentReadings.map((r, i) => {
      // Simulate historical spread by adjusting timestamp based on index and range
      const date = new Date(r.timestamp);
      // Hack to spread out the 24 mock points over the selected range for visualization
      if (timeRange !== '24h') {
          date.setDate(date.getDate() - (24 - i) * (multiplier / 24));
      }
      
      return {
        time: date.toLocaleDateString([], labelFormat),
        timestamp: date, // Keep full date for tooltip
        temperature: r.temperature + (Math.random() * 5 * (multiplier > 1 ? 1 : 0)), // Add jitter for long ranges
        vibration: r.vibration,
        voltage: r.voltage,
        fuel: r.fuelLevel,
        current: r.currentAmps
      };
    });
  };

  const chartData = getChartData();

  const getStatusColor = (status: TelemetryStatus) => {
    switch (status) {
      case TelemetryStatus.ONLINE: return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      case TelemetryStatus.WARNING: return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
      case TelemetryStatus.OFFLINE: return 'text-slate-400 bg-slate-50 dark:bg-slate-900/20';
      case TelemetryStatus.CRITICAL: return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'text-slate-400 bg-slate-50';
    }
  };

  const getUnitStatusColor = (status: UnitStatus) => {
    switch(status) {
      case UnitStatus.ACTIVE: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case UnitStatus.DOWN: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case UnitStatus.MAINTENANCE: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 relative pb-16">
      {/* Header */}
      <div>
        <Link to="/units" className="inline-flex items-center text-sm text-slate-500 hover:text-brand-600 mb-4 dark:text-slate-400 dark:hover:text-brand-400">
          <ArrowLeft size={16} className="mr-1" /> Back to Fleet
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{unit.serialNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getUnitStatusColor(unit.status)}`}>
                {unit.status}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{unit.model} • Batch: {unit.batchId}</p>
          </div>
          <div className="flex gap-3">
            {/* Standard Button */}
            <Link 
              to={`/tickets/new?unit=${unit.serialNumber}`}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm"
            >
              Log Issue
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Specs & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 p-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Unit Specifications</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 dark:text-slate-500 block uppercase tracking-wider font-bold">Current Location</label>
                <div className="flex items-start gap-2 mt-1 text-slate-700 dark:text-slate-300">
                  <MapPin size={16} className="mt-0.5 text-brand-500" />
                  {unit.location}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="text-xs text-slate-400 dark:text-slate-500 block uppercase tracking-wider font-bold">Runtime Hours</label>
                  <div className="flex items-center gap-2 mt-1 text-slate-700 dark:text-slate-300">
                    <Clock size={16} className="text-brand-500" />
                    {unit.runtimeHours} hrs
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 dark:text-slate-500 block uppercase tracking-wider font-bold">Condition</label>
                  <div className="flex items-center gap-2 mt-1 text-slate-700 dark:text-slate-300">
                    <BarChart2 size={16} className="text-brand-500" />
                    {unit.conditionScore}/100
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-dark-700">
                <div>
                  <label className="text-xs text-slate-400 dark:text-slate-500 block uppercase tracking-wider font-bold">Mfg Date</label>
                  <div className="flex items-center gap-2 mt-1 text-slate-700 dark:text-slate-300">
                    <Calendar size={16} className="text-slate-400" />
                    {unit.manufacturingDate}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-brand-500 dark:text-accent-500 block uppercase tracking-wider font-bold">Last PM</label>
                  <div className="flex items-center gap-2 mt-1 text-slate-700 dark:text-slate-300">
                    <CheckSquare size={16} className="text-accent-500" />
                    {unit.lastPmDate || 'No Record'}
                  </div>
                </div>
              </div>

              {unit.lastPmBy && (
                <div className="bg-accent-50 dark:bg-accent-900/10 p-2 rounded text-[10px] text-accent-800 dark:text-accent-400 flex flex-col">
                  <span>Performed by: <strong>{unit.lastPmBy}</strong></span>
                  <span>Hours at PM: <strong>{unit.lastPmHours} hrs</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 p-6 border-t-4 border-t-brand-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Radio size={16} className="text-brand-600" /> iMonnit Infrastructure
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${getStatusColor(unit.telemetryStatus)}`}>
                {unit.telemetryStatus}
              </span>
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase">Gateway ID</span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{unit.imonnitGatewayId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase">Signal Quality</span>
                <div className="flex items-center gap-1">
                  <Signal size={12} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Excellent</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold uppercase">Sensor Battery</span>
                <div className="flex items-center gap-1">
                  <Battery size={12} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">88%</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-dark-700">
                  <p className="text-[10px] text-slate-400 text-center">Factory installed by ANA Energy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-dark-700">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('telemetry')}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'telemetry' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              iMonnit Telemetry
            </button>
            <button 
              onClick={() => setActiveTab('tickets')}
              className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tickets' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              Service Tickets ({unitTickets.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="text-center py-8">
                {unit.imageUrl && (
                  <img src={unit.imageUrl} alt="Unit" className="w-full max-w-md mx-auto rounded-lg shadow-md mb-6 border border-slate-100 dark:border-dark-700" />
                )}
                <p className="text-slate-500 dark:text-slate-400">
                  This unit is currently <span className="font-semibold text-slate-800 dark:text-slate-200">{unit.status}</span> with <span className="font-semibold text-slate-800 dark:text-slate-200">{unit.customerName}</span>.
                </p>
              </div>
            )}

            {activeTab === 'telemetry' && (
              <div className="space-y-6">
                
                {/* Active Alerts Section (Added Feature) */}
                {unit.activeAlerts && unit.activeAlerts.length > 0 && (
                   <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-red-100 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/30 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                        <h4 className="font-bold text-red-900 dark:text-red-200 text-sm">Active Sensor Alerts</h4>
                      </div>
                      <div className="divide-y divide-red-100 dark:divide-red-900/30">
                        {unit.activeAlerts.map(alert => (
                          <div key={alert.id} className="p-4 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-bold text-red-800 dark:text-red-300">{alert.message}</p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  Reading: {alert.value} • Threshold: {alert.threshold} • {new Date(alert.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                            <button className="text-xs bg-white dark:bg-dark-800 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 font-medium shadow-sm">
                              Acknowledge
                            </button>
                          </div>
                        ))}
                      </div>
                   </div>
                )}

                {/* Real-time Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <TelemetrySensorCard
                    icon={<Thermometer size={20} />}
                    label="Engine Temp"
                    value={lastReading.temperature.toFixed(1)}
                    unit="°F"
                    trend={{ direction: 'stable', value: '0%' }}
                    colorScheme="brand"
                    status="normal"
                  />
                  <TelemetrySensorCard
                    icon={<Activity size={20} />}
                    label="Vibration"
                    value={lastReading.vibration.toFixed(2)}
                    unit="in/s"
                    trend={{ direction: 'down', value: '-5%' }}
                    colorScheme="accent"
                    status="normal"
                  />
                  <TelemetrySensorCard
                    icon={<Zap size={20} />}
                    label="Output Voltage"
                    value={lastReading.voltage.toFixed(1)}
                    unit="V"
                    trend={{ direction: 'up', value: '+2%' }}
                    colorScheme="blue"
                    status="normal"
                  />
                  <TelemetrySensorCard
                    icon={<Fuel size={20} />}
                    label="Fuel Level"
                    value={lastReading.fuelLevel.toFixed(0)}
                    unit="%"
                    trend={{ direction: 'down', value: '-12%' }}
                    colorScheme="emerald"
                    status="normal"
                  />
                </div>

                {/* Trending Chart Section */}
                <div className="bg-slate-50 dark:bg-dark-900/40 rounded-xl p-4 border border-slate-200 dark:border-dark-700">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">Trending Analysis</h4>
                      <p className="text-xs text-slate-500">Historical sensor data provided by iMonnit</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Time Range Selector */}
                        <div className="flex bg-white dark:bg-dark-800 p-1 rounded-lg border border-slate-200 dark:border-dark-700 shadow-sm">
                            {(['24h', '7d', '30d'] as const).map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${timeRange === range ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        {/* Metric Selector */}
                        <div className="flex bg-white dark:bg-dark-800 p-1 rounded-lg border border-slate-200 dark:border-dark-700 shadow-sm">
                        {['temperature', 'vibration', 'voltage', 'fuel'].map((m) => (
                            <button 
                            key={m}
                            onClick={() => setActiveMetric(m)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${activeMetric === m ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                            {m}
                            </button>
                        ))}
                        </div>
                        
                        <button className="p-1.5 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-lg text-slate-400 hover:text-brand-600 transition-colors" title="Export CSV">
                            <Download size={16} />
                        </button>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="time" 
                          tick={{fontSize: 10}} 
                          stroke="#94a3b8" 
                        />
                        <YAxis 
                          tick={{fontSize: 10}} 
                          stroke="#94a3b8" 
                          domain={['auto', 'auto']}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey={activeMetric} 
                          stroke="#e31b23" 
                          strokeWidth={3} 
                          dot={false}
                          animationDuration={1500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Predictive Insight */}
                <div className="bg-brand-900/5 dark:bg-brand-900/20 border border-brand-200/50 dark:border-brand-800/30 rounded-xl p-4 flex gap-4">
                  <div className="p-3 bg-white dark:bg-dark-800 rounded-lg text-brand-600 shadow-sm h-fit border border-brand-100 dark:border-dark-700">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-900 dark:text-brand-300 flex items-center gap-2">
                      Predictive Health Insight
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Gemini analysis of iMonnit trending data shows <span className="font-bold text-brand-600">stable operation</span> over the last 24 hours. No significant anomalies in vibration or voltage detected. Estimated battery health remains high (88%).
                    </p>
                    <div className="mt-3 flex gap-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Est. Runtime before next PM: <span className="text-slate-700 dark:text-slate-200">~245 hrs</span></div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Anomaly Risk: <span className="text-emerald-500">Low (4%)</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-4">
                {/* PM Checklist Call to Action */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-xl bg-accent-50 dark:bg-accent-900/10 border border-accent-100 dark:border-accent-800/20 mb-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-dark-800 rounded-lg text-accent-600 shadow-sm border border-accent-100 dark:border-dark-700">
                      <CheckSquare size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Perform PM Checklist</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Battery, Drives, Contactors & Comm Systems.</p>
                    </div>
                  </div>
                  <Link 
                    to={`/tickets/pm/${unit.serialNumber}`}
                    className="w-full sm:w-auto px-4 py-2 bg-accent-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-accent-700 transition-colors shadow-sm"
                  >
                    <Plus size={16} /> New PM Form
                  </Link>
                </div>

                {unitTickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    onClick={() => setSelectedTicket(ticket)}
                    className="border border-slate-200 dark:border-dark-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-dark-900/50 transition-colors bg-white dark:bg-dark-800 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{ticket.id}</span>
                         {ticket.category === 'PM Checklist' && (
                            <span className="text-[10px] bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">PM CHECKLIST</span>
                         )}
                       </div>
                       <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                         {ticket.status}
                       </span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{ticket.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{ticket.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                      <span>{ticket.createdAt}</span>
                      <span>Tech: {ticket.technician}</span>
                      {ticket.photos.length > 0 && (
                        <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400"><FileText size={12}/> {ticket.photos.length} Photos</span>
                      )}
                    </div>
                  </div>
                ))}
                {unitTickets.length === 0 && <div className="text-center text-slate-400 py-8">No service tickets found.</div>}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating Action Button for New Ticket - Only on Unit Detail */}
      <Link 
        to={`/tickets/new?unit=${unit.serialNumber}`}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-brand-600 hover:bg-brand-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105 z-50 flex items-center gap-2 border-2 border-white/20 dark:border-dark-900"
      >
        <PlusCircle size={24} />
        <span className="hidden md:inline font-medium">Log New Issue</span>
      </Link>

      {selectedTicket && (
        <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
};

export default UnitDetail;
