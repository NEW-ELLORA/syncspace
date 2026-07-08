import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Monitor, HardDrive, Wifi, Moon, Sun, Download, Upload, FolderOpen, Copy, User, Bell, Globe, Calendar, DollarSign, AlertTriangle, X, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function Settings() {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState('Never');
  const [darkMode, setDarkMode] = useState(true);
  const [dbPath, setDbPath] = useState('');
  const [syncConfig, setSyncConfig] = useState<{ ip: string, port: number, secret: string } | null>(null);
  
  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [language, setLanguage] = useState('English');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    (async () => {
      try { 
        setDbPath(await window.api.getDbPath());
        if (window.api.getSyncConfig) {
          setSyncConfig(await window.api.getSyncConfig());
        }
      } catch (e) { console.error(e); }
    })();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('http://localhost:14205/api/status');
      if (res.ok) {
        setLastSynced('Just now');
      }
    } catch {
      setLastSynced('Failed — no device found');
    }
    setSyncing(false);
  };

  const handleExport = async () => {
    try {
      const data = await window.api.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `syncspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  const copyDbPath = () => {
    navigator.clipboard.writeText(dbPath);
  };

  return (
    <motion.div className="p-6 h-full overflow-y-auto max-w-5xl mx-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your app preferences and data.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* Sync Card */}
          <motion.div variants={item} className="glass-card glow-purple p-6 flex flex-col h-full">
            <h2 className="text-base font-semibold mb-6 flex items-center gap-2"><Wifi className="w-5 h-5 text-indigo-400" /> Local Network Sync</h2>
            <div className="space-y-4 mb-6 flex-1">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Server Online
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Endpoint</span>
                <span className="text-sm font-mono">{syncConfig ? `http://${syncConfig.ip}:${syncConfig.port}` : ':14205'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Security</span>
                <span className="text-sm text-emerald-400">AES-256 Enabled</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Devices</span>
                <span className="text-sm">Scan QR to Pair</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Manual Sync</span>
                <span className="text-xs text-muted-foreground">Last: {lastSynced}</span>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSync} disabled={syncing}
                className={`btn-primary flex-1 justify-center py-3 text-sm ${syncing ? 'opacity-50' : ''}`}>
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Check Status' : 'Check Server Status'}
              </motion.button>
              <div onClick={() => setShowQrModal(true)} className="bg-white p-2 rounded-xl text-center group cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] relative">
                 <QrCode className="w-10 h-10 text-black mx-auto" />
                 <p className="text-[9px] font-bold text-black mt-1 uppercase tracking-wider">Pair App</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Preferences */}
          <motion.div variants={item} className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold">Preferences</h2>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <span className="text-sm font-medium">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <button onClick={() => setDarkMode(!darkMode)}
                  className="relative w-11 h-6 rounded-full transition-colors" style={{ background: darkMode ? '#6366f1' : 'rgba(148,163,184,0.3)' }}>
                  <motion.div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                    animate={{ left: darkMode ? 24 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-medium">Notifications</span>
                </div>
                <button onClick={() => setNotifications(!notifications)}
                  className="relative w-11 h-6 rounded-full transition-colors" style={{ background: notifications ? '#6366f1' : 'rgba(148,163,184,0.3)' }}>
                  <motion.div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                    animate={{ left: notifications ? 24 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium">Currency</span>
                </div>
                <select className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm outline-none"
                  value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="INR" className="bg-slate-900">₹ INR</option>
                  <option value="USD" className="bg-slate-900">$ USD</option>
                  <option value="EUR" className="bg-slate-900">€ EUR</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">Date Format</span>
                </div>
                <select className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm outline-none"
                  value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
                  <option value="DD/MM/YYYY" className="bg-slate-900">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY" className="bg-slate-900">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD" className="bg-slate-900">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-medium">Language</span>
                </div>
                <select className="bg-transparent border border-white/10 rounded px-2 py-1 text-sm outline-none"
                  value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="English" className="bg-slate-900">English</option>
                  <option value="Hindi" className="bg-slate-900">Hindi</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Data Management */}
          <motion.div variants={item} className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold">Data Management</h2>
            </div>

            <div className="p-3 rounded-xl text-xs flex justify-between items-center" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(148, 163, 184, 0.06)' }}>
              <div className="flex-1 overflow-hidden pr-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Database Location</span>
                </div>
                <p className="font-mono text-[11px] text-foreground/70 truncate">{dbPath || 'Loading...'}</p>
              </div>
              <button onClick={copyDbPath} className="p-2 hover:bg-white/10 rounded-md transition-colors" title="Copy path">
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleExport} className="btn-secondary flex-1 text-xs justify-center py-2">
                <Download className="w-4 h-4" /> Export Backup
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setImportModalOpen(true)} className="btn-secondary flex-1 text-xs justify-center py-2">
                <Upload className="w-4 h-4" /> Import Data
              </motion.button>
            </div>
            
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setResetModalOpen(true)} className="btn-danger w-full text-xs justify-center py-2 mt-2">
              <AlertTriangle className="w-4 h-4" /> Reset Database
            </motion.button>
          </motion.div>
        </div>
      </div>
      
      {/* Modals */}
      <AnimatePresence>
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 w-full max-w-md bg-slate-900 border border-white/10 shadow-xl relative">
              <button onClick={() => setImportModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold mb-2">Import Data</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Importing data will merge with your existing database. Are you sure you want to proceed?
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setImportModalOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={() => setImportModalOpen(false)} className="btn-primary">Select File</button>
              </div>
            </motion.div>
          </div>
        )}
        
        {resetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 w-full max-w-md bg-slate-900 border border-red-500/30 shadow-xl shadow-red-900/20 relative">
              <button onClick={() => setResetModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-4 text-red-500">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Reset Database</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                This action is irreversible. All your local data will be permanently deleted. Ensure you have a backup before proceeding.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setResetModalOpen(false)} className="btn-secondary">Cancel</button>
                <button onClick={() => setResetModalOpen(false)} className="btn-danger">Yes, Reset Data</button>
              </div>
            </motion.div>
          </div>
        )}

        {showQrModal && syncConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowQrModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-8 bg-white border border-white/10 shadow-xl relative text-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowQrModal(false)} className="absolute top-4 right-4 text-black/50 hover:text-black">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold mb-1 text-black">Pair Mobile App</h3>
              <p className="text-sm text-black/60 mb-6 font-medium">Scan this QR code from the SyncSpace Android App.</p>
              
              <div className="bg-white p-4 rounded-xl mx-auto inline-block border-2 border-black/5 shadow-sm">
                <QRCodeSVG value={`${syncConfig.ip}:${syncConfig.port}|${syncConfig.secret}`} size={240} level="H" />
              </div>
              
              <p className="text-xs text-black/50 mt-6 max-w-[280px] mx-auto font-medium">
                Make sure your phone and PC are connected to the same WiFi network.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
