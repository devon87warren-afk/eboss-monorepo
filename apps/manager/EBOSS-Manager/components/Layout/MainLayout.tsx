import React, { useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, BarChart3, Menu, X, BookOpen, MessageSquare, Sun, Moon, RefreshCw, Users, CheckSquare } from 'lucide-react';
import { useTheme } from '../../App';
import { useAppContext } from '../../App';
import RightPanel from './RightPanel';

const SidebarLink = ({ to, icon: Icon, label, onClick }: { to: string, icon: any, label: string, onClick?: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 group ${
        isActive 
          ? 'bg-brand-600 text-white shadow-md' 
          : 'text-slate-400 hover:bg-dark-800 hover:text-white'
      }`}
    >
      <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Logo = () => {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      <img 
        src="/logo.png" 
        alt="ANA Energy" 
        className="w-full max-w-[180px] h-auto object-contain"
      />
    </div>
  );
};

const MobileLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <img 
        src="/logo-mobile.png" 
        alt="ANA Energy" 
        className="h-8 w-auto object-contain"
      />
    </div>
  );
};

interface MainLayoutProps {
  children: ReactNode;
  rightPanelContent?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, rightPanelContent }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const { syncSalesforce, isSyncing, currentUser } = useAppContext();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-dark-950 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-900 text-white shadow-xl z-20 border-r border-dark-800">
        <div className="border-b border-dark-800 flex flex-col items-center text-center">
          <Logo />
          <div className="pb-4 w-full">
            <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase opacity-70">EBOSS Manager v2.1</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink to="/units" icon={Package} label="Units" />
          <SidebarLink to="/customers" icon={Users} label="Customers" />
          <SidebarLink to="/workflow" icon={CheckSquare} label="Workflow Center" />
          <SidebarLink to="/tickets" icon={ClipboardList} label="Service Tickets" />
          <SidebarLink to="/tech-lounge" icon={MessageSquare} label="App Tech Lounge" />
          <SidebarLink to="/analytics" icon={BarChart3} label="Quality Analytics" />
          <SidebarLink to="/resources" icon={BookOpen} label="Technical Library" />
        </nav>

        <div className="p-4 bg-dark-800 border-t border-dark-700">
          <div className="flex flex-col gap-4">
            <button 
              onClick={syncSalesforce}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Syncing..." : "Sync Salesforce"}
            </button>

            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Appearance</span>
              <button 
                onClick={toggleDarkMode}
                className="p-1.5 rounded-full bg-dark-700 text-slate-300 hover:text-white hover:bg-dark-600 transition-colors"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
            
            <div className="flex items-center gap-3 px-2 pt-2 border-t border-dark-700">
              <div className="w-9 h-9 rounded-full bg-brand-600 border border-dark-600 flex items-center justify-center text-xs font-bold shadow-lg text-white">JD</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-dark-900 text-white p-4 flex justify-between items-center shadow-md z-30 border-b border-dark-800">
          <MobileLogo />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full h-[calc(100%-4rem)] bg-dark-900/95 backdrop-blur-md z-40 p-4 flex flex-col md:hidden">
            <nav className="flex-1">
              <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/units" icon={Package} label="Units" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/customers" icon={Users} label="Customers" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/workflow" icon={CheckSquare} label="Workflow Center" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/tickets" icon={ClipboardList} label="Service Tickets" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/tech-lounge" icon={MessageSquare} label="App Tech Lounge" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/analytics" icon={BarChart3} label="Quality Analytics" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarLink to="/resources" icon={BookOpen} label="Technical Library" onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8 dark:bg-dark-950">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Right Panel */}
      <RightPanel>
        {rightPanelContent}
      </RightPanel>
    </div>
  );
};

export default MainLayout;
