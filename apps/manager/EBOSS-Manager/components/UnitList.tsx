
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../App';
import { Search, Filter, MapPin } from 'lucide-react';
import { UnitStatus } from '../types';

const UnitList: React.FC = () => {
  const { units } = useAppContext();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Effect to read URL params when component mounts or params change
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && Object.values(UnitStatus).includes(statusParam as UnitStatus)) {
      setFilterStatus(statusParam);
    }
  }, [searchParams]);

  const filteredUnits = units.filter(unit => {
    const matchesSearch = 
      unit.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      unit.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'All' || unit.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: UnitStatus) => {
    switch(status) {
      case UnitStatus.ACTIVE: return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case UnitStatus.DOWN: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case UnitStatus.MAINTENANCE: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Unit Database</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage generator fleet, track locations, and view history.</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by Serial #, Model, or Customer..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-dark-900 text-slate-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={20} />
          <select 
            className="p-2 border border-slate-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-dark-900 text-slate-700 dark:text-slate-200"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {Object.values(UnitStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUnits.map(unit => (
          <Link key={unit.serialNumber} to={`/units/${unit.serialNumber}`} className="group">
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="h-40 bg-slate-200 dark:bg-dark-700 relative">
                {unit.imageUrl ? (
                  <img src={unit.imageUrl} alt={unit.model} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                )}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(unit.status)}`}>
                  {unit.status}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">{unit.serialNumber}</h3>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{unit.model}</p>
                </div>
                
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <span>{unit.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Customer:</span>
                    <span>{unit.customerName}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-dark-700 flex justify-between items-center">
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    Hours: <span className="font-medium text-slate-700 dark:text-slate-300">{unit.runtimeHours}</span>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    Condition: <span className={`font-medium ${unit.conditionScore < 70 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{unit.conditionScore}/100</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {filteredUnits.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-dark-800 rounded-xl border border-dashed border-slate-300 dark:border-dark-700">
            No units found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitList;
