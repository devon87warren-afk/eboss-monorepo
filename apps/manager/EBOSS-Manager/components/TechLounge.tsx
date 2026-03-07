import React, { useState } from 'react';
// Lightweight inline SVG icon components to avoid external dependency on 'lucide-react'.
type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const Send: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const User: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MessageSquare: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Clock: React.FC<IconProps> = ({ size = 12, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Hash: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Search: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth={2} />
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const Paperclip: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M21.44 11.05L12.7 19.8a4.5 4.5 0 0 1-6.36-6.36l8.74-8.74a3.5 3.5 0 0 1 4.95 4.95L11.3 18.23a2.5 2.5 0 0 1-3.54-3.54l7.07-7.07" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TechLounge: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState('general');
  const [newMessage, setNewMessage] = useState('');

  const CHANNELS = [
    { id: 'general', name: 'General Discussion', type: 'public' },
    { id: 'repairs', name: 'Ongoing Repairs', type: 'public' },
    { id: 'firmware', name: 'Firmware Updates', type: 'locked' },
    { id: 'parts', name: 'Parts Requests', type: 'public' },
  ];

  const MOCK_MESSAGES = [
    {
      id: 1,
      user: 'Mike R.',
      avatar: 'MR',
      role: 'Lead Tech',
      content: 'Has anyone seen the new vibration alert on the 400kVA units from Batch Q3? I\'m seeing it on 3 units in Houston.',
      timestamp: '10:42 AM',
      channel: 'repairs',
      likes: 2
    },
    {
      id: 2,
      user: 'Sarah L.',
      avatar: 'SL',
      role: 'Field Tech',
      content: 'Yes! I just logged Ticket #TKT-1004 for the same thing. Check the engine mounts, the torque specs seem off from factory.',
      timestamp: '10:45 AM',
      channel: 'repairs',
      likes: 5
    },
    {
      id: 3,
      user: 'John Doe',
      avatar: 'JD',
      role: 'Field Tech',
      content: 'Heading to the United Rentals site in Phoenix. Anyone need me to drop off that spare ECU?',
      timestamp: '09:15 AM',
      channel: 'general',
      likes: 1
    },
    {
      id: 4,
      user: 'Dev Team',
      avatar: 'DT',
      role: 'Admin',
      content: 'New Firmware v2.4.1 is available for EBOSS 25-70kVA. Fixes the solar input lag issue.',
      timestamp: 'Yesterday',
      channel: 'firmware',
      likes: 8
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    // In a real app, this would push to backend/Supabase
    setNewMessage('');
    alert('Message posted to board!');
  };

  const activeMessages = MOCK_MESSAGES.filter(m => m.channel === activeChannel);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-dark-700 overflow-hidden">
      {/* Header */}
      <div className="bg-dark-900 text-white p-4 flex justify-between items-center shrink-0 border-b border-dark-800">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="text-brand-500" /> 
            Applications Tech Lounge
          </h2>
          <p className="text-xs text-slate-400">Collaboration board for repairs, tickets, and field updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1.5 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search discussions..." 
              className="pl-8 pr-3 py-1.5 bg-dark-800 border border-dark-700 rounded text-sm text-white focus:outline-none focus:border-brand-500 placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / Channels */}
        <div className="w-64 bg-slate-50 dark:bg-dark-900 border-r border-slate-200 dark:border-dark-700 flex flex-col">
          <div className="p-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Channels</h3>
            <div className="space-y-1">
              {CHANNELS.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeChannel === channel.id 
                      ? 'bg-brand-100 dark:bg-brand-900/20 text-brand-800 dark:text-brand-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-800'
                  }`}
                >
                  <Hash size={16} className={activeChannel === channel.id ? 'text-brand-600 dark:text-brand-500' : 'text-slate-400'} />
                  {channel.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-200 dark:border-dark-700">
            <div className="bg-accent-100 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/30 p-3 rounded-lg">
              <p className="text-xs text-accent-800 dark:text-accent-400 font-bold mb-1">Weekly Standup</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Friday @ 9AM EST</p>
              <button className="text-xs text-brand-600 dark:text-brand-400 font-bold mt-2 hover:underline">Join Meeting</button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-dark-800">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeMessages.map(msg => (
              <div key={msg.id} className="flex gap-4 group">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-dark-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0 border-2 border-white dark:border-dark-600 shadow-sm">
                  {msg.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{msg.user}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-dark-700 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200 dark:border-dark-600">{msg.role}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {msg.timestamp}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-dark-700 border border-slate-100 dark:border-dark-600 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {msg.content}
                  </div>
                  <div className="flex gap-4 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium">Reply</button>
                    <button className="text-xs text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium">React</button>
                  </div>
                </div>
              </div>
            ))}
            
            {activeMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p>No messages in this channel yet.</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${CHANNELS.find(c => c.id === activeChannel)?.name}...`}
                className="w-full pl-4 pr-12 py-3 border border-slate-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm bg-white dark:bg-dark-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
              <button 
                type="button" 
                className="absolute right-12 top-2.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-1"
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
              <button
                type="submit"
                title="Send message"
                aria-label="Send message"
                className="absolute right-2 top-1.5 bg-brand-600 text-white p-1.5 rounded-md hover:bg-brand-700 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
              Enter to send. Shift + Enter for new line. All messages are visible to the engineering team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechLounge;