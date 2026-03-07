
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../App';
import { Search, MapPin, Globe, Mail, ChevronRight } from 'lucide-react';

const CustomerList: React.FC = () => {
  const { customers, units } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Customer Directory</h2>
        <p className="text-slate-500 dark:text-slate-400">Synced from Salesforce. Manage fleet owners and accounts.</p>
      </div>

      <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-dark-900 text-slate-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => {
            const customerUnits = units.filter(u => u.salesforceAccountId === customer.id);
            return (
                <Link key={customer.id} to={`/customers/${customer.id}`} className="group">
                <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-dark-700 rounded-lg flex items-center justify-center text-xl font-bold text-brand-600 dark:text-brand-400">
                            {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${customer.accountStatus === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'}`}>
                            {customer.accountStatus}
                        </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-brand-600 transition-colors">{customer.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                        <Globe size={14} />
                        {customer.region}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-dark-700 flex justify-between items-center text-sm">
                        <div className="text-slate-500 dark:text-slate-400">
                            <strong>{customerUnits.length}</strong> Assets Deployed
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500" />
                    </div>
                </div>
                </Link>
            )
        })}
      </div>
    </div>
  );
};

export default CustomerList;
