
import React from 'react';
import { useAppContext } from '../App';
import { UnitStatus, TicketStatus, TicketPriority, TelemetryStatus } from '../types';
import { Activity, AlertTriangle, Truck, MessageSquare, ChevronRight, ExternalLink, Radio, SignalHigh, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, subtext, linkTo }: any) => (
  <Link 
    to={linkTo} 
    className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 p-6 flex items-start justify-between hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
       <ExternalLink size={16} className="text-slate-400 dark:text-slate-500" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1 group-hover:text-brand-600 dark:group-hover:text-brand-500 transition-colors">
        {title} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all" />
      </p>
      <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
  </Link>
);

const Dashboard: React.FC = () => {
  const { units, tickets } = useAppContext();

  // Stats Calculations
  const unitsDown = units.filter(u => u.status === UnitStatus.DOWN).length;
  const unitsInService = units.filter(u => u.status === UnitStatus.ACTIVE).length;
  const unitsMaintenance = units.filter(u => u.status === UnitStatus.MAINTENANCE).length;
  
  const openTickets = tickets.filter(t => t.status !== TicketStatus.CLOSED).length;
  const criticalTickets = tickets.filter(t => t.priority === TicketPriority.CRITICAL && t.status !== TicketStatus.CLOSED).length;
  
  const telemetryOnline = units.filter(u => u.telemetryStatus === TelemetryStatus.ONLINE).length;
  const telemetryWarning = units.filter(u => u.telemetryStatus === TelemetryStatus.WARNING).length;

  const chartData = [
    { name: 'In Service', value: unitsInService, color: '#8dc63f' }, // ANA Energy Green
    { name: 'Maintenance', value: unitsMaintenance, color: '#f59e0b' }, // Warning color
    { name: 'Down', value: unitsDown, color: '#e31b23' }, // ANA Corporate Red
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Operational Overview</h2>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, here's the status of the fleet.</p>
        </div>
        <div className="text-sm text-slate-400 dark:text-slate-500 bg-white dark:bg-dark-800 px-3 py-1 rounded border border-slate-200 dark:border-dark-700 flex items-center gap-2">
          <Radio size={14} className="text-emerald-500 animate-pulse" />
          Last iMonnit Sync: Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Fleet"
          value={unitsInService}
          icon={Truck}
          color="bg-accent-600"
          subtext="Units currently in service"
          linkTo="/units?status=In Service"
        />
        <StatCard
          title="Units Down"
          value={unitsDown}
          icon={AlertTriangle}
          color="bg-brand-600"
          subtext={`${criticalTickets} critical tickets active`}
          linkTo="/units?status=Down"
        />
        <StatCard
          title="Maintenance"
          value={unitsMaintenance}
          icon={Wrench}
          color="bg-amber-600"
          subtext="Routine service & repair"
          linkTo="/units?status=Maintenance"
        />
        <StatCard
          title="Telemetry Health"
          value={`${telemetryOnline}/${units.length}`}
          icon={SignalHigh}
          color="bg-blue-600"
          subtext={`${telemetryWarning} units reporting warnings`}
          linkTo="/units"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Status Chart */}
        <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Fleet Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {chartData.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                 <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: item.color }}></div>
                 <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.value}</span>
                 <span className="text-xs text-slate-500 dark:text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tickets Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Recent Service Tickets</h3>
            <Link to="/tickets" className="text-sm text-brand-600 dark:text-brand-500 hover:text-brand-800 dark:hover:text-brand-400 font-medium">View All</Link>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="space-y-3">
              {tickets.slice(0, 5).map(ticket => (
                <Link key={ticket.id} to={`/tickets`} className="block group">
                  <div className="p-4 rounded-lg border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-900/50 hover:bg-white dark:hover:bg-dark-700 hover:border-brand-200 dark:hover:border-brand-900 transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          ticket.priority === TicketPriority.CRITICAL ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                          ticket.priority === TicketPriority.HIGH ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        }`}>
                          {ticket.priority}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{ticket.id}</span>
                        {ticket.category === 'PM Checklist' && <span className="text-[10px] bg-accent-100 dark:bg-accent-900/20 text-accent-700 px-1.5 rounded font-bold uppercase">PM</span>}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">{ticket.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unit: {ticket.unitSerialNumber} • Tech: {ticket.technician}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-500" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
