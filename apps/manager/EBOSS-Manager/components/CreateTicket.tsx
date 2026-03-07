import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAppContext } from '../App';
import { TicketPriority, TicketStatus } from '../types';
import { Camera, Save, X, Info, Phone, Mail, User, HelpCircle, Sparkles, Loader2, Book, CircuitBoard, Zap, ExternalLink } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Simulated Fault Code Database for "Auto Retrieval"
const FAULT_DICTIONARY: Record<string, string> = {
  'E-101': 'High Coolant Temperature - Shutdown',
  'E-102': 'Low Coolant Level - Warning',
  'E-201': 'Low Oil Pressure - Shutdown',
  'E-202': 'Low Fuel Level - Warning',
  'E-300': 'Overcrank / Fail to Start',
  'E-301': 'Overspeed Shutdown',
  'W-401': 'Battery Charge Alternator Failure',
  'W-404': 'Low Battery Voltage',
  'A-500': 'Emergency Stop Activated',
  'S-600': 'ECU Communication Error'
};

// Resource mapping for Category links
const CATEGORY_RESOURCES: Record<string, { title: string; type: string; icon: any }[]> = {
  'Defect': [
    { title: 'Inverter Fault: DC Over-Voltage', type: 'Troubleshooting', icon: Zap },
    { title: 'Generator Auto-Start Harness', type: 'Wiring Diagram', icon: CircuitBoard },
    { title: 'Main DC Bus Wiring Diagram', type: 'Schematic', icon: CircuitBoard }
  ],
  'Maintenance': [
    { title: 'EBOSS 48V Hybrid Spec Sheet', type: 'Spec Sheet', icon: Book },
    { title: 'Battery Bank BMS Specifications', type: 'Spec Sheet', icon: Book },
    { title: 'Scheduled Maintenance Interval Guide', type: 'Manual', icon: Book }
  ],
  'Training': [
    { title: 'Solar Input Controller Manual', type: 'User Manual', icon: Book },
    { title: 'Hybrid Mode Timer Configuration', type: 'Settings Guide', icon: Zap },
    { title: 'BMS Gen4 User Interface Overview', type: 'Training Guide', icon: Book }
  ],
  'Other': [
    { title: 'Hybrid Transfer Switch Layout', type: 'Layout Diagram', icon: CircuitBoard },
    { title: 'Technical Library - General', type: 'Full Archive', icon: Book }
  ]
};

const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSerial = searchParams.get('unit') || '';
  const { units, addTicket } = useAppContext();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState({
    unitSerialNumber: preselectedSerial,
    title: '',
    description: '',
    category: 'Defect',
    priority: TicketPriority.MEDIUM,
    photos: [] as string[],
    customerComplaint: '',
    alarmCodes: '',
    alarmDescription: '',
    troubleshootingSteps: '',
    communicationMethods: [] as string[],
    actualFaults: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket = {
      id: `TKT-${Math.floor(Math.random() * 10000)}`,
      status: TicketStatus.OPEN,
      createdAt: new Date().toISOString().split('T')[0],
      technician: 'John Doe',
      ...formData
    };
    // @ts-ignore
    addTicket(newTicket);
    navigate('/tickets');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, photos: [...prev.photos, url] }));
    }
  };

  const handleAlarmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    const desc = FAULT_DICTIONARY[code] || '';
    setFormData(prev => ({ ...prev, alarmCodes: code, alarmDescription: desc }));
  };

  const toggleCommMethod = (method: string) => {
    setFormData(prev => {
      const methods = prev.communicationMethods.includes(method)
        ? prev.communicationMethods.filter(m => m !== method)
        : [...prev.communicationMethods, method];
      return { ...prev, communicationMethods: methods };
    });
  };

  const analyzeWithGemini = async () => {
    if (!formData.customerComplaint && !formData.alarmCodes && !formData.troubleshootingSteps) {
      alert("Please enter a Customer Complaint, Alarm Code, or Troubleshooting Steps first.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are an expert technical support engineer for ANA Energy's EBOSS hybrid systems. Analyze this incident:
      Customer Complaint: "${formData.customerComplaint}"
      Alarm Codes: "${formData.alarmCodes}"
      Troubleshooting Steps: "${formData.troubleshootingSteps}"

      Based on this information, provide a JSON object with:
      1. "title": Concise professional title.
      2. "category": One of ["Defect", "Maintenance", "Training", "Other"].
      3. "priority": One of ["Low", "Medium", "High", "Critical"].
      4. "alarmDescription": Technical explanation of codes.
      5. "suggestedFaults": Hypothesis of root cause.
      6. "nextSteps": Suggestion to append to description.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const text = response.text;
      if (text) {
        const result = JSON.parse(text);
        setFormData(prev => ({
          ...prev,
          title: result.title || prev.title,
          category: result.category || prev.category,
          priority: result.priority || prev.priority,
          alarmDescription: result.alarmDescription || prev.alarmDescription,
          actualFaults: result.suggestedFaults || prev.actualFaults,
          description: prev.description + (prev.description ? '\n\n' : '') + `[AI Recommendation]: ${result.nextSteps}`
        }));
      }
    } catch (error) {
      console.error("Gemini Analysis Failed", error);
      alert("AI Analysis failed. Please check your network or API Key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const suggestedResources = CATEGORY_RESOURCES[formData.category] || [];

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create Service Ticket</h2>
        <p className="text-slate-500 dark:text-slate-400">Log a defect, customer complaint, or maintenance record.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden">
        
        {/* Section 1: Identification */}
        <div className="p-6 border-b border-slate-100 dark:border-dark-700 space-y-6">
           <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
             1. Unit Identification
           </h3>
           <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Generator Unit <span className="text-red-500">*</span></label>
            <select 
              required
              className="w-full p-3 border border-slate-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-white"
              value={formData.unitSerialNumber}
              onChange={e => setFormData({...formData, unitSerialNumber: e.target.value})}
            >
              <option value="">Select Unit...</option>
              {units.map(u => (
                <option key={u.serialNumber} value={u.serialNumber}>
                  {u.serialNumber} - {u.model} ({u.customerName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Incident Details */}
        <div className="p-6 border-b border-slate-100 dark:border-dark-700 space-y-6 bg-slate-50/50 dark:bg-dark-900/20 relative">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">2. Incident Details</h3>
            <button 
              type="button" 
              onClick={analyzeWithGemini}
              disabled={isAnalyzing}
              className="flex items-center gap-2 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Analyze with Gemini
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Customer Complaint</label>
              <textarea 
                rows={3}
                className="w-full p-3 border border-slate-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-dark-900 text-slate-900 dark:text-white"
                placeholder="What did the customer report?"
                value={formData.customerComplaint}
                onChange={e => setFormData({...formData, customerComplaint: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Warnings / Alarms</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full p-3 border border-slate-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none uppercase dark:bg-dark-900 text-slate-900 dark:text-white"
                  placeholder="Enter Fault Code (e.g., E-101)"
                  value={formData.alarmCodes}
                  onChange={handleAlarmChange}
                />
                {formData.alarmDescription && (
                  <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm p-3 rounded-lg flex items-center gap-2 shadow-sm">
                    <Info size={16} className="text-blue-500 shrink-0" />
                    <span>{formData.alarmDescription}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Diagnosis */}
        <div className="p-6 border-b border-slate-100 dark:border-dark-700 space-y-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">3. Troubleshooting & Findings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Troubleshooting Steps Taken</label>
              <textarea 
                rows={3}
                className="w-full p-3 border border-slate-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-dark-900 text-slate-900 dark:text-white"
                placeholder="List steps taken to diagnose..."
                value={formData.troubleshootingSteps}
                onChange={e => setFormData({...formData, troubleshootingSteps: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Actual Faults Found</label>
              <textarea 
                rows={3}
                className="w-full p-3 border border-slate-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-dark-900 text-slate-900 dark:text-white"
                placeholder="What was the root cause?"
                value={formData.actualFaults}
                onChange={e => setFormData({...formData, actualFaults: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Classification & Reference Links */}
        <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-dark-900/20">
           <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">4. Classification & Technical Resources</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ticket Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., Battery Voltage Failure"
                    className="w-full p-3 border border-slate-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-dark-800 text-slate-900 dark:text-white"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                    <select 
                      className="w-full p-3 border border-slate-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-dark-800 text-slate-900 dark:text-white"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="Defect">Defect / Bug</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Training">Customer Training</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
                    <select 
                      className="w-full p-3 border border-slate-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-dark-800 text-slate-900 dark:text-white"
                      value={formData.priority}
                      // @ts-ignore
                      onChange={e => setFormData({...formData, priority: e.target.value})}
                    >
                      {Object.values(TicketPriority).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
             </div>

             {/* Dynamic Reference Panel */}
             <div className="bg-white dark:bg-dark-800 border border-brand-100 dark:border-brand-900/30 rounded-xl p-4 shadow-sm h-fit">
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 mb-3">
                  <Book size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">Suggested Guides</span>
                </div>
                <div className="space-y-2">
                  {suggestedResources.map((res, i) => (
                    <Link 
                      key={i} 
                      to="/resources" 
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-dark-900 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors border border-transparent hover:border-brand-200"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="text-accent-600 dark:text-accent-500 shrink-0">
                          <res.icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{res.title}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{res.type}</p>
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-slate-300 shrink-0" />
                    </Link>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                  Technicians are encouraged to consult these {formData.category.toLowerCase()} guides before finalizing the ticket report.
                </p>
             </div>
           </div>

           <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Photos (Evidence)</label>
            <div className="flex flex-wrap gap-4">
              {formData.photos.map((photo, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-dark-700 shadow-sm">
                  <img src={photo} alt="Upload" className="w-full h-full object-cover" />
                  <button type="button" className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500" onClick={() => {
                     setFormData(prev => ({...prev, photos: prev.photos.filter((_, i) => i !== idx)}))
                  }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-dark-600 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer transition-colors text-slate-400 hover:text-brand-600 bg-white dark:bg-dark-800">
                <Camera size={24} />
                <span className="text-[10px] mt-1 font-bold">ADD PHOTO</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 p-6 bg-slate-50 dark:bg-dark-900 border-t border-slate-200 dark:border-dark-700">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-lg border border-slate-300 dark:border-dark-600 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-dark-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-6 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <Save size={18} />
            Save Ticket
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket;