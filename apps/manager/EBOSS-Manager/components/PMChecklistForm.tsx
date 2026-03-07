
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../App';
import { TicketStatus, TicketPriority, PMChecklist, Ticket } from '../types';
import { CheckSquare, Save, ArrowLeft, Battery, Zap, CircuitBoard, MessageSquare, AlertCircle, Info } from 'lucide-react';

const PMChecklistForm: React.FC = () => {
  const { unitSerialNumber } = useParams<{ unitSerialNumber: string }>();
  const navigate = useNavigate();
  const { units, addTicket, updateUnit } = useAppContext();
  const unit = units.find(u => u.serialNumber === unitSerialNumber);

  const [formData, setFormData] = useState({
    technician: 'Devon Warren',
    batteryStatus: 'Pass' as 'Pass' | 'Fail',
    driveStatus: 'Pass' as 'Pass' | 'Fail',
    contactorStatus: 'Pass' as 'Pass' | 'Fail',
    commSystemStatus: 'Pass' as 'Pass' | 'Fail',
    batteryNotes: '',
    driveNotes: '',
    contactorNotes: '',
    commNotes: '',
    generalNotes: ''
  });

  if (!unit) {
    return <div className="p-8 text-center">Unit not found</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const pmData: PMChecklist = {
      id: `PM-${Math.floor(Math.random() * 10000)}`,
      unitSerialNumber: unit.serialNumber,
      date: new Date().toISOString().split('T')[0],
      technician: formData.technician,
      hoursAtPm: unit.runtimeHours,
      batteryStatus: formData.batteryStatus,
      driveStatus: formData.driveStatus,
      contactorStatus: formData.contactorStatus,
      commSystemStatus: formData.commSystemStatus,
      notes: formData.generalNotes
    };

    // Create a service ticket to represent the PM event
    const newTicket: Ticket = {
      id: `TKT-PM-${Math.floor(Math.random() * 10000)}`,
      unitSerialNumber: unit.serialNumber,
      title: `Preventative Maintenance Checklist - ${unit.serialNumber}`,
      description: `Specialized PM performed on Battery, Drives, Contactors, and Communications. Results: Battery: ${pmData.batteryStatus}, Drives: ${pmData.driveStatus}, Contactors: ${pmData.contactorStatus}, Comms: ${pmData.commSystemStatus}. Notes: ${pmData.notes}`,
      category: 'PM Checklist',
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.RESOLVED,
      createdAt: pmData.date,
      technician: pmData.technician,
      photos: [],
      pmData: pmData
    };

    addTicket(newTicket);

    // Update the unit with Last PM information
    updateUnit({
      ...unit,
      lastPmDate: pmData.date,
      lastPmHours: pmData.hoursAtPm,
      lastPmBy: pmData.technician
    });

    navigate(`/units/${unit.serialNumber}`);
  };

  const Section = ({ title, icon: Icon, status, setStatus, notes, setNotes, label }: any) => (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 dark:bg-dark-900 rounded-lg text-slate-500 border border-slate-100 dark:border-dark-700">
            <Icon size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">{title}</h4>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        </div>
        <div className="flex bg-slate-100 dark:bg-dark-900 p-1 rounded-lg">
          <button 
            type="button"
            onClick={() => setStatus('Pass')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${status === 'Pass' ? 'bg-accent-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            PASS
          </button>
          <button 
            type="button"
            onClick={() => setStatus('Fail')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${status === 'Fail' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            FAIL
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Findings & Debris Check</label>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`Note any corrosion, loose wires, or debris found...`}
          className="w-full p-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-slate-700 dark:text-slate-300"
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-slate-500 hover:text-brand-600 mb-2 dark:text-slate-400">
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">PM Checklist</h2>
          <p className="text-slate-500 dark:text-slate-400">Unit: <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{unit.serialNumber}</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-bold uppercase">Current Run Hours</p>
          <p className="text-xl font-black text-slate-800 dark:text-slate-100">{unit.runtimeHours} hrs</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-4 rounded-xl flex gap-3">
          <Info className="text-blue-500 shrink-0" size={20} />
          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            This specialized PM checklist targets critical EBOSS hybrid components. Ensure all systems are free of debris and functional tests are performed under simulated load conditions before marking as <strong>PASS</strong>.
          </p>
        </div>

        {/* Form Sections */}
        <div className="space-y-4">
          <Section 
            title="Battery Connections" 
            icon={Battery} 
            status={formData.batteryStatus} 
            setStatus={(v: any) => setFormData({...formData, batteryStatus: v})}
            notes={formData.batteryNotes}
            setNotes={(v: any) => setFormData({...formData, batteryNotes: v})}
            label="Cleanliness, tightness, and corrosion check."
          />
          <Section 
            title="Drives (Inverters/Controllers)" 
            icon={Zap} 
            status={formData.driveStatus} 
            setStatus={(v: any) => setFormData({...formData, driveStatus: v})}
            notes={formData.driveNotes}
            setNotes={(v: any) => setFormData({...formData, driveNotes: v})}
            label="Internal fans, heat sinks, and debris-free check."
          />
          <Section 
            title="Contactors & Relays" 
            icon={CircuitBoard} 
            status={formData.contactorStatus} 
            setStatus={(v: any) => setFormData({...formData, contactorStatus: v})}
            notes={formData.contactorNotes}
            setNotes={(v: any) => setFormData({...formData, contactorNotes: v})}
            label="Cycle testing, pitting, and mechanical wear."
          />
          <Section 
            title="Communication Systems" 
            icon={MessageSquare} 
            status={formData.commSystemStatus} 
            setStatus={(v: any) => setFormData({...formData, commSystemStatus: v})}
            notes={formData.commNotes}
            setNotes={(v: any) => setFormData({...formData, commNotes: v})}
            label="Telemetry signal strength and cable integrity."
          />
        </div>

        {/* Technician Info */}
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 p-6 space-y-4">
           <h4 className="font-bold text-slate-800 dark:text-white">Validation</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Technician Name</label>
               <input 
                 type="text" 
                 required
                 className="w-full p-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-slate-700 dark:text-slate-300"
                 value={formData.technician}
                 onChange={(e) => setFormData({...formData, technician: e.target.value})}
               />
             </div>
             <div>
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Final Status</label>
               <div className="flex items-center gap-2 mt-2">
                 <div className={`w-3 h-3 rounded-full ${
                   [formData.batteryStatus, formData.driveStatus, formData.contactorStatus, formData.commSystemStatus].every(s => s === 'Pass') 
                   ? 'bg-accent-500 animate-pulse' 
                   : 'bg-red-500'
                 }`}></div>
                 <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {[formData.batteryStatus, formData.driveStatus, formData.contactorStatus, formData.commSystemStatus].every(s => s === 'Pass') 
                    ? 'READY FOR SERVICE' 
                    : 'DEFECTS IDENTIFIED'}
                 </span>
               </div>
             </div>
           </div>
           <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">General PM Summary</label>
              <textarea 
                value={formData.generalNotes}
                onChange={(e) => setFormData({...formData, generalNotes: e.target.value})}
                placeholder="Briefly summarize the overall health of the unit..."
                className="w-full p-3 text-sm bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-slate-700 dark:text-slate-300"
                rows={3}
              />
           </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-accent-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-accent-600/20 hover:bg-accent-700 transition-all flex items-center justify-center gap-2"
        >
          <Save size={20} /> SUBMIT PM CHECKLIST & UPDATE UNIT
        </button>
      </form>
    </div>
  );
};

export default PMChecklistForm;
