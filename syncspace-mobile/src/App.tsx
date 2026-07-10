import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Bell, CalendarDays, Wallet, Settings, QrCode, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

// We'll bring over the exact same pages, but they will render in the mobile viewport.
import Dashboard from './pages/Dashboard';
import Reminders from './pages/Reminders';
import Planner from './pages/Planner';
import Budget from './pages/Budget';
import SettingsPage from './pages/Settings';
import Pairing from './pages/Pairing';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/pairing" element={<Pairing />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const url = localStorage.getItem('syncspace_endpoint');
      if (!url) {
        alert("Please pair with desktop first.");
        setSyncing(false);
        return;
      }
      
      const res = await fetch(`${url}/api/sync`);
      if (res.ok) {
        const data = await res.json();
        if (data.payload) {
          localStorage.setItem('syncspace_db', data.payload);
          localStorage.removeItem('syncspace_outbox');
          window.location.reload();
        }
      }
    } catch (e) {
      console.error('Sync failed:', e);
      alert("Failed to sync. Ensure you are on the same WiFi as the Desktop app.");
    }
    setSyncing(false);
  };

  return (
    <HashRouter>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        {/* Mobile Header */}
        <header className="border-b border-white/5 flex items-center justify-between px-4 py-3 bg-background/90 backdrop-blur-md z-10 pt-safe">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight gradient-text">SyncSpace</h1>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={handleSync} className="p-2 text-muted-foreground hover:text-white transition-colors rounded-full focus-visible">
               <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
             </button>
             <Link to="/pairing" className="p-2 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors rounded-full focus-visible">
               <QrCode className="w-5 h-5" />
             </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-safe">
          <AnimatedRoutes />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="border-t border-white/5 bg-background/95 backdrop-blur-md pb-safe">
          <div className="flex justify-around items-center px-2 py-2">
            <BottomNavItem to="/" icon={LayoutDashboard} label="Home" />
            <BottomNavItem to="/reminders" icon={Bell} label="Reminders" />
            <BottomNavItem to="/planner" icon={CalendarDays} label="Planner" />
            <BottomNavItem to="/budget" icon={Wallet} label="Budget" />
            <BottomNavItem to="/settings" icon={Settings} label="Settings" />
          </div>
        </nav>
      </div>
    </HashRouter>
  );
}

function BottomNavItem({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className="flex flex-col items-center gap-1 p-2 focus-visible outline-none group relative">
      {isActive && <motion.div layoutId="bottomNavIndicator" className="absolute -top-3 w-10 h-1 bg-primary rounded-b-full" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
      <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-white'}`} />
      <span className={`text-[9px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-white'}`}>{label}</span>
    </Link>
  );
}
