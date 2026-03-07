
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../App';
import { Mail, MapPin, Globe, Calendar, RefreshCw, Package, ArrowLeft, ClipboardList } from 'lucide-react';
import { UnitStatus, TicketStatus } from '../types';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { customers, units, tickets } = useAppContext();
  
  const customer = customers.find(c => c.id === id);
  
  if (!customer) {
      return <div className="p-8 text-center">Customer not found</div>;
  }

  const customerUnits = units.filter(u => u.salesforceAccountId === id);
  const customerTickets = tickets.filter(t => customerUnits.some(u => u.serialNumber === t.unitSerialNumber));

  return (
    <div className="space-y-6">
        <div>
            <Link to="/customers" className="inline-flex items-center text-sm text-slate-500 hover:text-brand-600 mb-4 dark:text-slate-400 dark:hover:text-brand-400">
                <ArrowLeft size={16} className="mr-1" /> Back to Directory
            </Link>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
                    <div className="flex items-center gap-4 mt-2 text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Globe size={16}/> {customer.region}</span>
                        <span className="flex items-center gap-1"><Mail size={16}/> {customer.contactEmail}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-slate-400 font-bold uppercase">Salesforce ID</span>
                    <p className="font-mono text-slate-700 dark:text-slate-300 mb-2">{customer.id}</p>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${customer.accountStatus === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'}`}>
                        {customer.accountStatus}
                    </span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assets Column */}
            <div className="lg:col-span-2 space-y-6">
                <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                    <Package className="text-brand-600" /> Assets ({customerUnits.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerUnits.map(unit => (
                        <Link key={unit.serialNumber} to={`/units/${unit.serialNumber}`} className="block group">
                             <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-lg p-4 hover:border-brand-500 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600">{unit.serialNumber}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                        unit.status === UnitStatus.ACTIVE ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                        unit.status === UnitStatus.DOWN ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    }`}>{unit.status}</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{unit.model}</p>
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <MapPin size={12} /> {unit.location}
                                </div>
                             </div>
                        </Link>
                    ))}
                    {customerUnits.length === 0 && <p className="text-slate-400 italic">No assets assigned.</p>}
                </div>
            </div>

            {/* Tickets Column */}
            <div className="space-y-6">
                <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                    <ClipboardList className="text-brand-600" /> Service History
                </h3>
                <div className="space-y-3">
                    {customerTickets.map(ticket => (
                        <div key={ticket.id} className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{ticket.id}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                     ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                }`}>{ticket.status}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{ticket.title}</p>
                            <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                                <span>Unit: <Link to={`/units/${ticket.unitSerialNumber}`} className="hover:text-brand-600 underline">{ticket.unitSerialNumber}</Link></span>
                                <span>{ticket.createdAt}</span>
                            </div>
                        </div>
                    ))}
                     {customerTickets.length === 0 && <p className="text-slate-400 italic">No service history found.</p>}
                </div>
            </div>
        </div>
    </div>
  );
};

export default CustomerDetail;
