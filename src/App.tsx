import './types/electron.d.ts';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Bell, CalendarDays, Wallet, StickyNote, Settings, Search, CheckCircle2, Menu, LogOut, Lightbulb, Plus, GraduationCap, LayoutList, FileText, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Reminders from './pages/Reminders';
import Planner from './pages/Planner';
import Budget from './pages/Budget';
import Notes from './pages/Notes';
import Projects from './pages/Projects';
import SettingsPage from './pages/Settings';

import Learning from './pages/Learning';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/learning" element={<Learning />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function GlobalQuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-500 transition-colors focus-visible"
        >
          <motion.div animate={{ rotate: isOpen ? 45 : 0 }}><Plus className="w-6 h-6" /></motion.div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 right-6 w-64 glass-card p-2 z-50 flex flex-col gap-1 border-white/10">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5 mb-1">Quick Add (Ctrl+K)</div>
              
              <Link to="/reminders" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
                <Bell className="w-4 h-4 text-purple-400" /> Reminder
              </Link>
              <Link to="/planner" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
                <CalendarDays className="w-4 h-4 text-blue-400" /> Event
              </Link>
              <Link to="/budget" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
                <Wallet className="w-4 h-4 text-emerald-400" /> Transaction
              </Link>
              <Link to="/projects" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
                <Lightbulb className="w-4 h-4 text-amber-400" /> Project Idea
              </Link>
              <Link to="/notes" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
                <StickyNote className="w-4 h-4 text-indigo-400" /> Note
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  const [search, setSearch] = useState('');
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Bell, label: 'Reminders', path: '/reminders' },
    { icon: CalendarDays, label: 'Planner', path: '/planner' },
    { icon: Wallet, label: 'Budget', path: '/budget' },
    { icon: Lightbulb, label: 'Projects', path: '/projects' },
    { icon: StickyNote, label: 'Notes', path: '/notes' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-64 border-r border-white/5 flex flex-col" style={{ background: 'linear-gradient(180deg, rgba(13,18,33,0.95) 0%, rgba(6,10,20,0.98) 100%)' }}>
        <div className="h-9 w-full" style={{ WebkitAppRegion: 'drag' } as any}></div>
        <div className="p-6 pt-2 pb-4">
          <h1 className="text-2xl font-bold tracking-tight gradient-text mb-1">SyncSpace</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Productivity Suite</p>
        </div>

        <div className="flex-1 px-3 space-y-6 overflow-y-auto pb-4">
          
          {/* Main */}
          <div className="space-y-1">
            <Link to="/" className="relative block focus-visible outline-none">
              {location.pathname === '/' && <motion.div layoutId="activeNavIndicator" className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
              <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors z-10 font-medium text-sm ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                <LayoutDashboard className="w-5 h-5" /> Dashboard
              </div>
            </Link>
          </div>

          {/* Plan Section */}
          <div className="space-y-1">
            <h3 className="px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Plan</h3>
            {[
              { path: '/reminders', label: 'Reminders', icon: Bell },
              { path: '/planner', label: 'Planner', icon: CalendarDays }
            ].map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className="relative block focus-visible outline-none">
                  {isActive && <motion.div layoutId="activeNavIndicator" className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                  <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors z-10 font-medium text-sm ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                    <item.icon className="w-5 h-5" /> {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Track Section */}
          <div className="space-y-1">
            <h3 className="px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Track</h3>
            {[
              { path: '/budget', label: 'Budget', icon: Wallet },
              { path: '/learning', label: 'Learning', icon: GraduationCap } // New Learning Tab
            ].map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className="relative block focus-visible outline-none">
                  {isActive && <motion.div layoutId="activeNavIndicator" className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                  <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors z-10 font-medium text-sm ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                    <item.icon className="w-5 h-5" /> {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Build Section */}
          <div className="space-y-1">
            <h3 className="px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Build</h3>
            {[
              { path: '/projects', label: 'Projects', icon: LayoutList },
              { path: '/notes', label: 'Notes', icon: FileText }
            ].map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className="relative block focus-visible outline-none">
                  {isActive && <motion.div layoutId="activeNavIndicator" className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                  <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors z-10 font-medium text-sm ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                    <item.icon className="w-5 h-5" /> {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

        </div>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link to="/settings" className="relative block focus-visible outline-none">
            {location.pathname === '/settings' && <motion.div layoutId="activeNavIndicator" className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
            <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors z-10 font-medium text-sm ${location.pathname === '/settings' ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
              <Settings className="w-5 h-5" /> Settings
            </div>
          </Link>
          
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl mt-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-sm font-semibold">Sync Online</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Local network active</p>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 grid min-w-0 relative" style={{ gridTemplateRows: '36px 64px 1fr' }}>
        {/* Drag Region */}
        <div className="w-full bg-background/50" style={{ WebkitAppRegion: 'drag' } as any}></div>
        
        {/* Header */}
        <header className="border-b border-white/5 flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4 flex-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search everything... (Ctrl+F)"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder:text-muted-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button onClick={() => window.location.reload()} className="p-2 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-white/5 focus-visible group" title="Sync / Refresh Data">
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <Link to="/reminders" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5 focus-visible">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-background"></span>
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-indigo-500/20">
              U
            </div>
          </div>
        </header>
        
        {/* Animated Routes Container */}
        <div className="overflow-hidden relative bg-background">
           <AnimatedRoutes />
        </div>
      </main>
      
      {/* Global Quick Add (FAB & Ctrl+K Menu) */}
      <GlobalQuickAdd />
    </div>
  );
}
