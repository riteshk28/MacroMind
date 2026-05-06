import { useState } from 'react';
import { Home, Mic, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Dashboard } from './Dashboard';
import { VoiceLogger } from './VoiceLogger';
import { Trends } from './Trends';
import { Settings } from './Settings';

type Tab = 'home' | 'log' | 'trends' | 'settings';

export function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard />;
      case 'log': return <VoiceLogger />;
      case 'trends': return <Trends />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-y-auto">
        {renderContent()}
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none z-50">
        <div className="pointer-events-auto max-w-sm mx-auto bg-white/90 backdrop-blur-xl border border-zinc-200 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-around p-2">
          <NavItem icon={<Home size={22} />} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={<Mic size={22} />} active={activeTab === 'log'} onClick={() => setActiveTab('log')} className={activeTab === 'log' ? 'text-white bg-indigo-600' : 'text-zinc-400 hover:text-indigo-500'} forceBg={activeTab === 'log'} />
          <NavItem icon={<BarChart2 size={22} />} active={activeTab === 'trends'} onClick={() => setActiveTab('trends')} />
          <NavItem icon={<SettingsIcon size={22} />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, active, onClick, className, forceBg }: { icon: React.ReactNode, active: boolean, onClick: () => void, className?: string, forceBg?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-3 rounded-full transition-all duration-300",
        active && !forceBg ? "bg-zinc-100 text-zinc-900 scale-110" : "",
        !active && !className ? "text-zinc-400 hover:text-zinc-600" : className
      )}
    >
      {icon}
    </button>
  );
}
