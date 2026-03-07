import React, { useState } from 'react';
import {
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building2,
  ChevronRight,
  Filter,
  Download,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import FleetMap from '../dashboard/FleetMap';

// Territory data
interface TerritoryData {
  code: string;
  name: string;
  customers: number;
  activeTickets: number;
  resolvedThisMonth: number;
  avgResponseTime: string;
  health: 'excellent' | 'good' | 'fair' | 'poor';
  trend: number;
}

const TERRITORIES: TerritoryData[] = [
  { code: 'CA', name: 'California', customers: 312, activeTickets: 18, resolvedThisMonth: 47, avgResponseTime: '2.4h', health: 'good', trend: 8 },
  { code: 'CO', name: 'Colorado', customers: 134, activeTickets: 7, resolvedThisMonth: 23, avgResponseTime: '1.8h', health: 'excellent', trend: 12 },
  { code: 'OR', name: 'Oregon', customers: 98, activeTickets: 5, resolvedThisMonth: 19, avgResponseTime: '2.1h', health: 'good', trend: 5 },
  { code: 'AZ', name: 'Arizona', customers: 89, activeTickets: 4, resolvedThisMonth: 15, avgResponseTime: '2.6h', health: 'fair', trend: -3 },
  { code: 'NV', name: 'Nevada', customers: 76, activeTickets: 3, resolvedThisMonth: 11, avgResponseTime: '3.1h', health: 'fair', trend: -8 },
  { code: 'UT', name: 'Utah', customers: 67, activeTickets: 2, resolvedThisMonth: 9, avgResponseTime: '2.0h', health: 'good', trend: 15 },
  { code: 'ID', name: 'Idaho', customers: 45, activeTickets: 2, resolvedThisMonth: 7, avgResponseTime: '2.8h', health: 'good', trend: 4 },
  { code: 'HI', name: 'Hawaii', customers: 41, activeTickets: 1, resolvedThisMonth: 5, avgResponseTime: '4.2h', health: 'poor', trend: -12 },
  { code: 'MT', name: 'Montana', customers: 38, activeTickets: 2, resolvedThisMonth: 6, avgResponseTime: '3.5h', health: 'fair', trend: 2 },
  { code: 'WY', name: 'Wyoming', customers: 29, activeTickets: 1, resolvedThisMonth: 4, avgResponseTime: '2.9h', health: 'good', trend: 7 },
  { code: 'NM', name: 'New Mexico', customers: 52, activeTickets: 3, resolvedThisMonth: 8, avgResponseTime: '2.3h', health: 'good', trend: 10 },
  { code: 'WA', name: 'Washington', customers: 127, activeTickets: 6, resolvedThisMonth: 21, avgResponseTime: '1.9h', health: 'excellent', trend: 14 },
  { code: 'AK', name: 'Alaska', customers: 23, activeTickets: 1, resolvedThisMonth: 3, avgResponseTime: '5.1h', health: 'poor', trend: -5 },
];

// Monthly trend data
const MONTHLY_TRENDS = [
  { month: 'Aug', customers: 892, tickets: 156, resolved: 142 },
  { month: 'Sep', customers: 945, tickets: 168, resolved: 159 },
  { month: 'Oct', customers: 1023, tickets: 182, resolved: 175 },
  { month: 'Nov', customers: 1078, tickets: 191, resolved: 188 },
  { month: 'Dec', customers: 1098, tickets: 178, resolved: 171 },
  { month: 'Jan', customers: 1131, tickets: 165, resolved: 152 },
];

// Category breakdown
const TICKET_CATEGORIES = [
  { name: 'Technical Support', value: 35, color: '#ff6b35' },
  { name: 'Account Issues', value: 28, color: '#06d6a0' },
  { name: 'Billing', value: 18, color: '#ffd23f' },
  { name: 'Feature Requests', value: 12, color: '#627d98' },
  { name: 'Other', value: 7, color: '#ef476f' },
];

// Health badge component
const HealthBadge: React.FC<{ health: TerritoryData['health'] }> = ({ health }) => {
  const configs = {
    excellent: { bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-600 dark:text-success-400', label: 'Excellent' },
    good: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', label: 'Good' },
    fair: { bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-600 dark:text-warning-500', label: 'Fair' },
    poor: { bg: 'bg-danger-100 dark:bg-danger-900/30', text: 'text-danger-600 dark:text-danger-400', label: 'Needs Attention' },
  };

  const config = configs[health];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Metric card component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, trend, color, subtitle }) => (
  <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-5 border-l-3" style={{ borderLeftColor: color }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-navy-600 dark:text-navy-300 mb-1">{title}</p>
        <p className="text-3xl font-bold text-navy-900 dark:text-white font-heading">{value}</p>
        {subtitle && <p className="text-xs text-medium mt-1">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <div style={{ color }}>{icon}</div>
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
        <span className="text-xs text-medium ml-2">vs last month</span>
      </div>
    )}
  </div>
);

// Territory row component
const TerritoryRow: React.FC<{ territory: TerritoryData; rank: number }> = ({ territory, rank }) => (
  <tr className="hover:bg-navy-50 dark:hover:bg-navy-900/50 transition-colors">
    <td className="py-4 px-4">
      <span className="text-sm font-bold text-navy-400">#{rank}</span>
    </td>
    <td className="py-4 px-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{territory.code}</span>
        </div>
        <div>
          <p className="font-medium text-navy-900 dark:text-white">{territory.name}</p>
          <p className="text-xs text-medium">{territory.customers} customers</p>
        </div>
      </div>
    </td>
    <td className="py-4 px-4">
      <div className="flex items-center gap-2">
        <Ticket size={14} className="text-orange-500" />
        <span className="font-medium text-navy-900 dark:text-white">{territory.activeTickets}</span>
      </div>
    </td>
    <td className="py-4 px-4">
      <div className="flex items-center gap-2">
        <CheckCircle size={14} className="text-success-500" />
        <span className="text-navy-600 dark:text-navy-400">{territory.resolvedThisMonth}</span>
      </div>
    </td>
    <td className="py-4 px-4">
      <span className="text-navy-600 dark:text-navy-400">{territory.avgResponseTime}</span>
    </td>
    <td className="py-4 px-4">
      <HealthBadge health={territory.health} />
    </td>
    <td className="py-4 px-4">
      <div className="flex items-center gap-1">
        {territory.trend >= 0 ? (
          <TrendingUp size={14} className="text-success-500" />
        ) : (
          <TrendingDown size={14} className="text-danger-500" />
        )}
        <span className={`text-sm font-medium ${territory.trend >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
          {territory.trend > 0 ? '+' : ''}{territory.trend}%
        </span>
      </div>
    </td>
    <td className="py-4 px-4">
      <button className="p-1.5 hover:bg-navy-100 dark:hover:bg-navy-700 rounded transition-colors">
        <ChevronRight size={16} className="text-navy-400" />
      </button>
    </td>
  </tr>
);

// Main Territory Analytics component
const TerritoryAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [sortBy, setSortBy] = useState<'customers' | 'tickets' | 'health'>('customers');

  // Calculate totals
  const totals = TERRITORIES.reduce((acc, t) => ({
    customers: acc.customers + t.customers,
    activeTickets: acc.activeTickets + t.activeTickets,
    resolved: acc.resolved + t.resolvedThisMonth,
  }), { customers: 0, activeTickets: 0, resolved: 0 });

  // Sort territories
  const sortedTerritories = [...TERRITORIES].sort((a, b) => {
    if (sortBy === 'customers') return b.customers - a.customers;
    if (sortBy === 'tickets') return b.activeTickets - a.activeTickets;
    const healthOrder = { excellent: 4, good: 3, fair: 2, poor: 1 };
    return healthOrder[b.health] - healthOrder[a.health];
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white font-heading">
            Territory & Fleet Analytics
          </h1>
          <p className="text-medium">Global operations, technician locations, and active travel paths</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-navy-800 rounded-lg border border-navy-200 dark:border-navy-700 p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === range
                  ? 'bg-orange-500 text-white'
                  : 'text-navy-600 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-700'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 px-4 py-2 rounded-lg text-sm font-medium text-navy-700 dark:text-navy-300 hover:border-orange-500 transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Fleet Map Section */}
      <div className="bg-white dark:bg-navy-800 rounded-card shadow-card overflow-hidden">
        <FleetMap />
      </div>

      {/* Stats Cards */}\
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Customers"
          value={totals.customers.toLocaleString()}
          icon={<Users size={24} />}
          trend={{ value: 8, isPositive: true }}
          color="#ff6b35"
          subtitle="Across 13 states"
        />
        <MetricCard
          title="Active Tickets"
          value={totals.activeTickets}
          icon={<Ticket size={24} />}
          trend={{ value: 5, isPositive: false }}
          color="#ef476f"
          subtitle="Requiring attention"
        />
        <MetricCard
          title="Resolved This Month"
          value={totals.resolved}
          icon={<CheckCircle size={24} />}
          trend={{ value: 12, isPositive: true }}
          color="#06d6a0"
          subtitle="92% resolution rate"
        />
        <MetricCard
          title="Avg Response Time"
          value="2.4h"
          icon={<Clock size={24} />}
          trend={{ value: 15, isPositive: true }}
          color="#627d98"
          subtitle="Target: < 4 hours"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading">
                Growth Trends
              </h3>
              <p className="text-sm text-medium">Customer base and ticket volume over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-navy-600 dark:text-navy-400">Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success-500" />
                <span className="text-navy-600 dark:text-navy-400">Resolved</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-navy-700" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#627d98" />
                <YAxis tick={{ fontSize: 12 }} stroke="#627d98" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a2332',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#ff6b35"
                  strokeWidth={2}
                  dot={{ fill: '#ff6b35', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#06d6a0"
                  strokeWidth={2}
                  dot={{ fill: '#06d6a0', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-navy-800 rounded-card shadow-card p-6">
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading mb-6">
            Ticket Categories
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={TICKET_CATEGORIES}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {TICKET_CATEGORIES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a2332',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {TICKET_CATEGORIES.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-navy-600 dark:text-navy-400">{cat.name}</span>
                </div>
                <span className="font-medium text-navy-900 dark:text-white">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Territory Table */}
      <div className="bg-white dark:bg-navy-800 rounded-card shadow-card">
        <div className="p-6 border-b border-navy-100 dark:border-navy-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-navy-900 dark:text-white font-heading">
                Territory Breakdown
              </h3>
              <p className="text-sm text-medium">Performance by state</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-navy-50 dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="customers">Sort by Customers</option>
                <option value="tickets">Sort by Active Tickets</option>
                <option value="health">Sort by Health</option>
              </select>
              <button className="p-2 bg-navy-50 dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-lg hover:border-orange-500 transition-colors">
                <Filter size={18} className="text-navy-600 dark:text-navy-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900">
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider w-16">Rank</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Territory</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Active Tickets</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Resolved (30d)</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Avg Response</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Health</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider">Trend</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100 dark:divide-navy-700">
              {sortedTerritories.map((territory, index) => (
                <TerritoryRow key={territory.code} territory={territory} rank={index + 1} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-navy-100 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-medium">Showing all 13 territories</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-success-500">
                <div className="w-2 h-2 rounded-full bg-success-500" />
                Excellent: 2
              </span>
              <span className="flex items-center gap-2 text-orange-500">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                Good: 7
              </span>
              <span className="flex items-center gap-2 text-warning-500">
                <div className="w-2 h-2 rounded-full bg-warning-500" />
                Fair: 2
              </span>
              <span className="flex items-center gap-2 text-danger-500">
                <div className="w-2 h-2 rounded-full bg-danger-500" />
                Needs Attention: 2
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerritoryAnalytics;
