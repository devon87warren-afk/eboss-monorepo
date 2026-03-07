
import React from 'react';
import { useAppContext } from '../../App';
import { Activity, Users, FileText, CreditCard, ChevronRight, ExternalLink, Radio, MapPin, BarChart3, TrendingUp, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, subtext, linkTo }: any) => (
  <Link
    to={linkTo}
    className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 p-6 flex flex-col justify-between hover:shadow-md transition-all group cursor-pointer relative overflow-hidden h-full"
  >
    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
      <ExternalLink size={18} className="text-slate-400 dark:text-slate-500" />
    </div>

    <div>
      <div className={`w-12 h-12 rounded-lg ${color} text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>

      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
        {subtext}
      </p>
    </div>

    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-700 flex items-center text-sm font-medium text-brand-600 dark:text-brand-500">
      Access Workflow <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
    </div>
  </Link>
);

const Dashboard: React.FC = () => {
  const { units, customers } = useAppContext();

  // Basic Stats
  const totalUnits = units.length;
  // We can add customer count if available in context, else generic.

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Command Center</h2>
          <p className="text-slate-500 dark:text-slate-400">Sales Support & Commissioning Operations</p>
        </div>
        <div className="text-sm text-slate-400 dark:text-slate-500 bg-white dark:bg-dark-800 px-3 py-1 rounded border border-slate-200 dark:border-dark-700 flex items-center gap-2">
          <Radio size={14} className="text-emerald-500 animate-pulse" />
          System Status: Online
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4 px-1">Sales Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Territory Analytics"
            icon={BarChart3}
            color="bg-brand-600"
            subtext="Analyze regional performance, customer distribution, and market trends."
            linkTo="/analytics"
          />
          <StatCard
            title="Customer Database"
            icon={Users}
            color="bg-purple-600"
            subtext={`Manage client profiles and history.`}
            linkTo="/customers"
          />
          <StatCard
            title="Lead Imports"
            icon={FileText}
            color="bg-emerald-600"
            subtext="Import and validate customer contact lists and unit batches."
            linkTo="/workflow"
          />
          <StatCard
            title="Unit Database"
            icon={Activity}
            color="bg-slate-600"
            subtext={`Browse entire fleet inventory (${totalUnits} units).`}
            linkTo="/units"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4 px-1">Field & Commissioning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Travel & Logistics"
            icon={Plane}
            color="bg-sky-500"
            subtext="Manage trip itineraries, bookings, and travel schedules."
            linkTo="/travel"
          />
          <StatCard
            title="Expense Manager"
            icon={CreditCard}
            color="bg-amber-500"
            subtext="Track reimbursement status, upload receipts, and manage budget."
            linkTo="/expenses"
          />
          <StatCard
            title="Resource Center"
            icon={FileText}
            color="bg-indigo-500"
            subtext="Access technical documentation, guides, and training numbers."
            linkTo="/resources"
          />
          <StatCard
            title="Tech Lounge"
            icon={MapPin}
            color="bg-rose-500"
            subtext="Community hub and field updates."
            linkTo="/tech-lounge"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
