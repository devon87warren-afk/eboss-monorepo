import React, { useState } from 'react';
import {
  Ticket,
  Upload,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  MapPin,
  ChevronRight,
  Bell,
  Settings,
  Search,
  Plus,
  FileText,
  RefreshCw,
} from 'lucide-react';

// Western US States data
const WESTERN_STATES = [
  { code: 'WA', name: 'Washington', customers: 127, x: 85, y: 20 },
  { code: 'OR', name: 'Oregon', customers: 98, x: 75, y: 65 },
  { code: 'CA', name: 'California', customers: 312, x: 55, y: 140 },
  { code: 'NV', name: 'Nevada', customers: 76, x: 95, y: 120 },
  { code: 'ID', name: 'Idaho', customers: 45, x: 120, y: 55 },
  { code: 'MT', name: 'Montana', customers: 38, x: 160, y: 25 },
  { code: 'WY', name: 'Wyoming', customers: 29, x: 175, y: 70 },
  { code: 'UT', name: 'Utah', customers: 67, x: 140, y: 115 },
  { code: 'CO', name: 'Colorado', customers: 134, x: 195, y: 120 },
  { code: 'AZ', name: 'Arizona', customers: 89, x: 120, y: 175 },
  { code: 'NM', name: 'New Mexico', customers: 52, x: 175, y: 175 },
  { code: 'AK', name: 'Alaska', customers: 23, x: 30, y: 220 },
  { code: 'HI', name: 'Hawaii', customers: 41, x: 90, y: 250 },
];

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  accentColor?: string;
}> = ({ title, value, icon, trend, subtitle, accentColor = 'orange' }) => (
  <div className="bg-white dark:bg-navy-800 rounded-card shadow-card hover:shadow-card-hover transition-all duration-200 p-5 border-t-3 border-orange-500 relative overflow-hidden">
    <div className={`absolute top-0 left-0 right-0 h-1 bg-${accentColor}-500`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-navy-600 dark:text-navy-300 mb-1">{title}</p>
        <p className="text-3xl font-bold text-navy-900 dark:text-white font-heading">{value}</p>
        {subtitle && (
          <p className="text-xs text-medium mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-${accentColor}-50 dark:bg-${accentColor}-900/20`}>
        <div className={`text-${accentColor}-500`}>{icon}</div>
      </div>
    </div>
    {trend && (
      <div className="flex items-center mt-3 pt-3 border-t border-navy-100 dark:border-navy-700">
        {trend.isPositive ? (
          <TrendingUp size={16} className="text-success-500 mr-1" />
        ) : (
          <TrendingDown size={16} className="text-danger-500 mr-1" />
        )}
        <span className={`text-sm font-medium ${trend.isPositive ? 'text-success-500' : 'text-danger-500'}`}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </span>
        <span className="text-xs text-medium ml-2">vs last week</span>
      </div>
    )}
  </div>
);

// Territory Map Component
const TerritoryMap: React.FC = () => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const getHeatColor = (customers: number) => {
    if (customers > 200) return 'fill-orange-500';
    if (customers > 100) return 'fill-orange-400';
    if (customers > 50) return 'fill-orange-300';
    return 'fill-orange-200';
  };

  return (
    <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading">
          West Region Coverage
        </h3>
        <span className="text-sm text-medium">13 States • 1,131 Customers</span>
      </div>

      <div className="relative h-80 bg-navy-50 dark:bg-navy-900 rounded-lg overflow-hidden">
        <svg viewBox="0 0 280 280" className="w-full h-full">
          {/* Simple state representations */}
          {WESTERN_STATES.map(state => (
            <g
              key={state.code}
              onMouseEnter={() => setHoveredState(state.code)}
              onMouseLeave={() => setHoveredState(null)}
              className="cursor-pointer transition-all duration-200"
            >
              <rect
                x={state.x}
                y={state.y}
                width={40}
                height={35}
                rx={4}
                className={`
                  ${getHeatColor(state.customers)}
                  stroke-orange-600 stroke-2
                  ${hoveredState === state.code ? 'opacity-100 transform scale-105' : 'opacity-80'}
                  transition-all duration-200
                `}
                style={{
                  transformOrigin: `${state.x + 20}px ${state.y + 17.5}px`,
                  filter: hoveredState === state.code ? 'drop-shadow(0 4px 8px rgba(255, 107, 53, 0.4))' : 'none'
                }}
              />
              <text
                x={state.x + 20}
                y={state.y + 20}
                textAnchor="middle"
                className="text-xs font-bold fill-navy-900 pointer-events-none"
              >
                {state.code}
              </text>
              <text
                x={state.x + 20}
                y={state.y + 30}
                textAnchor="middle"
                className="text-[8px] fill-navy-700 pointer-events-none"
              >
                {state.customers}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover tooltip */}
        {hoveredState && (
          <div className="absolute bottom-4 left-4 bg-navy-900 text-white px-4 py-2 rounded-lg shadow-lift">
            <p className="font-semibold">
              {WESTERN_STATES.find(s => s.code === hoveredState)?.name}
            </p>
            <p className="text-sm text-navy-300">
              {WESTERN_STATES.find(s => s.code === hoveredState)?.customers} active customers
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-200" />
          <span className="text-medium">0-50</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-300" />
          <span className="text-medium">51-100</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-400" />
          <span className="text-medium">101-200</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-medium">200+</span>
        </div>
      </div>
    </div>
  );
};

// Activity Item Component
const ActivityItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'danger';
}> = ({ icon, title, description, time, type }) => {
  const borderColors = {
    success: 'border-l-success-500',
    warning: 'border-l-warning-500',
    info: 'border-l-orange-500',
    danger: 'border-l-danger-500',
  };

  const iconBgColors = {
    success: 'bg-success-50 text-success-500',
    warning: 'bg-warning-50 text-warning-600',
    info: 'bg-orange-50 text-orange-500',
    danger: 'bg-danger-50 text-danger-500',
  };

  return (
    <div className={`bg-soft dark:bg-navy-900 p-4 rounded-card border-l-3 ${borderColors[type]} hover:shadow-card transition-shadow`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${iconBgColors[type]}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-navy-900 dark:text-white text-sm">{title}</p>
          <p className="text-xs text-medium truncate">{description}</p>
        </div>
        <span className="text-xs text-medium whitespace-nowrap">{time}</span>
      </div>
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 w-full p-3 rounded-lg bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 hover:border-orange-500 hover:shadow-card transition-all group"
  >
    <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
      {icon}
    </div>
    <span className="font-medium text-navy-900 dark:text-white text-sm">{label}</span>
    <ChevronRight size={16} className="ml-auto text-medium group-hover:text-orange-500" />
  </button>
);

// Main Dashboard Component
const EnergyBossCommand: React.FC = () => {
  return (
    <div className="min-h-screen bg-soft dark:bg-navy-950">
      {/* Header */}
      <header className="bg-navy-900 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold font-heading">EnergyBoss</h1>
                <p className="text-xs text-navy-300">Support Command</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type="text"
                placeholder="Search tickets, customers..."
                className="pl-10 pr-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-sm w-64 focus:outline-none focus:border-orange-500 placeholder:text-navy-500"
              />
            </div>
            <button className="p-2 hover:bg-navy-800 rounded-lg transition-colors relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs flex items-center justify-center font-bold">3</span>
            </button>
            <button className="p-2 hover:bg-navy-800 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-navy-700">
              <div className="text-right">
                <p className="text-sm font-medium">West Region</p>
                <p className="text-xs text-navy-400">13 States</p>
              </div>
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-bold">
                TB
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white font-heading">
            Command Center
          </h2>
          <p className="text-medium">Welcome back! Here's your regional overview.</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Active Tickets"
            value={47}
            icon={<Ticket size={24} />}
            trend={{ value: 12, isPositive: false }}
            subtitle="8 critical priority"
          />
          <MetricCard
            title="Pending Imports"
            value={23}
            icon={<Upload size={24} />}
            trend={{ value: 8, isPositive: true }}
            subtitle="3 batches processing"
            accentColor="warning"
          />
          <MetricCard
            title="Permission Issues"
            value={5}
            icon={<Shield size={24} />}
            subtitle="2 high severity"
            accentColor="danger"
          />
          <MetricCard
            title="Territory Health"
            value="94%"
            icon={<Activity size={24} />}
            trend={{ value: 3, isPositive: true }}
            subtitle="All systems operational"
            accentColor="success"
          />
        </div>

        {/* Map and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Territory Map */}
          <div className="lg:col-span-2">
            <TerritoryMap />
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <QuickActionButton icon={<Plus size={18} />} label="Create New Ticket" />
              <QuickActionButton icon={<Upload size={18} />} label="Import Contacts" />
              <QuickActionButton icon={<Shield size={18} />} label="Permission Request" />
              <QuickActionButton icon={<FileText size={18} />} label="Generate Report" />
              <QuickActionButton icon={<RefreshCw size={18} />} label="Sync Salesforce" />
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading">
                Recent Activity
              </h3>
              <button className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                View All
              </button>
            </div>
            <div className="space-y-3">
              <ActivityItem
                icon={<CheckCircle size={16} />}
                title="Import batch #2847 completed"
                description="127 contacts imported for California region"
                time="5m ago"
                type="success"
              />
              <ActivityItem
                icon={<AlertTriangle size={16} />}
                title="Permission issue detected"
                description="User jsmith@energyboss.com needs Salesforce access"
                time="12m ago"
                type="warning"
              />
              <ActivityItem
                icon={<Ticket size={16} />}
                title="New ticket assigned"
                description="TKT-4521: API sync failure for Nevada accounts"
                time="28m ago"
                type="info"
              />
              <ActivityItem
                icon={<Users size={16} />}
                title="Territory handoff initiated"
                description="Montana & Wyoming transferred to new AST"
                time="1h ago"
                type="info"
              />
              <ActivityItem
                icon={<MapPin size={16} />}
                title="New customer onboarded"
                description="SolarTech Industries added to Arizona territory"
                time="2h ago"
                type="success"
              />
            </div>
          </div>

          {/* Team Status */}
          <div className="lg:col-span-2 bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading mb-4">
              Team Status
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Tim Buffington', role: 'Lead AST', status: 'online', tickets: 12 },
                { name: 'Sarah Chen', role: 'AST', status: 'online', tickets: 8 },
                { name: 'Mike Rodriguez', role: 'AST', status: 'away', tickets: 15 },
                { name: 'Emily Watson', role: 'RSM', status: 'online', tickets: 3 },
              ].map((member, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-soft dark:hover:bg-navy-900 transition-colors">
                  <div className="relative">
                    <div className="w-10 h-10 bg-navy-200 dark:bg-navy-700 rounded-full flex items-center justify-center font-semibold text-navy-700 dark:text-navy-300">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-navy-800 ${
                      member.status === 'online' ? 'bg-success-500' : 'bg-warning-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-navy-900 dark:text-white text-sm">{member.name}</p>
                    <p className="text-xs text-medium">{member.role}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 text-xs font-medium">
                      {member.tickets} tickets
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnergyBossCommand;
