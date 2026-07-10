import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Wallet, GraduationCap, ArrowRight, PlayCircle, Plus, CalendarDays, Lightbulb, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Reminder, Transaction, BudgetConfig, Budget, Project, CalendarEvent, Course } from '../types/electron.d.ts';

const STATUS_COLORS: Record<string, string> = { idea: 'bg-purple-500/15 text-purple-400 border-purple-500/20', 'in-progress': 'bg-blue-500/15 text-blue-400 border-blue-500/20', completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', 'on-hold': 'bg-amber-500/15 text-amber-400 border-amber-500/20' };

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } } };

export default function Dashboard() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [r, t, c, b, p, e, crs] = await Promise.all([
          window.api.getReminders(),
          window.api.getTransactions(),
          window.api.getBudgetConfig(),
          window.api.getBudgets?.() || Promise.resolve([]),
          window.api.getProjects(),
          window.api.getEvents(),
          window.api.getCourses()
        ]);
        setReminders(r);
        setTransactions(t);
        if (c && c.length > 0) setBudgetConfig(c[0]);
        setBudgets(b);
        setProjects(p);
        setEvents(e);
        setCourses(crs);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayReminders = reminders.filter(r => !r.is_completed && r.due_datetime?.startsWith(todayStr));
  const todayEvents = events.filter(e => e.start_datetime?.startsWith(todayStr));
  const activeProjects = projects.filter(p => p.status !== 'completed');
  
  const monthStr = new Date().toISOString().slice(0, 7);
  const monthTxns = transactions.filter(t => t.date?.startsWith(monthStr));
  
  const totalIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  
  const allTimeIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allTimeExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const derivedTotalBalance = (budgetConfig?.starting_balance || 0) + allTimeIncome - allTimeExpense;

  const netSavingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const categorySpend: Record<string, number> = {};
  monthTxns.filter(t => t.type === 'expense').forEach(t => { categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount; });

  const greeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good Morning'; if (h < 17) return 'Good Afternoon'; return 'Good Evening'; };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div className="p-8 h-full overflow-y-auto w-full max-w-6xl mx-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight gradient-text mb-1">{greeting()} 👋</h1>
        <p className="text-muted-foreground text-sm font-medium">Here is your daily snapshot.</p>
      </motion.div>

      {/* Bento Grid */}
      <div className="bento-grid bento-grid-3">
        
        {/* Total Balance - Hero Card */}
        <motion.div variants={item} onClick={() => navigate('/budget')} className="glass-card glow-blue p-6 cursor-pointer group relative overflow-hidden bento-span-2 flex flex-col justify-between min-h-[160px]">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all group-hover:scale-110 duration-500"><Wallet className="w-24 h-24 text-blue-500" /></div>
           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
           <div className="relative z-10">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-400" /> Total Balance</span>
           </div>
           <div className="relative z-10 mt-4">
              <p className="text-5xl font-extrabold text-blue-400 tracking-tighter drop-shadow-lg">₹{derivedTotalBalance.toLocaleString('en-IN')}</p>
           </div>
        </motion.div>

        {/* Due Today - Hero Card */}
        <motion.div variants={item} onClick={() => navigate('/reminders')} className="glass-card glow-amber p-6 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all group-hover:scale-110 duration-500"><Bell className="w-20 h-20 text-amber-500" /></div>
           <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
           <div className="relative z-10">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Bell className="w-4 h-4 text-amber-400" /> Due Today</span>
           </div>
           <div className="relative z-10 mt-4">
              <p className="text-5xl font-extrabold text-amber-400 tracking-tighter drop-shadow-lg">{todayReminders.length}</p>
           </div>
        </motion.div>

        {/* Budget Health */}
        <motion.div variants={item} className="glass-card p-6 flex flex-col h-[320px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground"><Wallet className="w-4 h-4 text-emerald-400" /> Budget Health</h2>
            <button onClick={() => navigate('/budget')} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold tracking-wide flex items-center gap-1 uppercase">View <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-5 pr-2 -mr-2">
             {budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-60">
                  <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground font-medium">No category limits set.</p>
                </div>
             ) : (
                budgets.map(b => {
                   const spent = categorySpend[b.category] || 0;
                   const progress = Math.min(100, (spent / b.monthly_limit) * 100);
                   const isWarning = progress >= 80;
                   const isDanger = progress >= 100;
                   return (
                     <div key={b.id} className="group">
                       <div className="flex justify-between text-xs mb-2">
                         <span className="font-semibold">{b.category}</span>
                         <span className={`font-bold ${isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                           ₹{spent.toLocaleString()} / ₹{b.monthly_limit.toLocaleString()}
                         </span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                         <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isDanger ? 'bg-rose-500 glow-rose' : isWarning ? 'bg-amber-500 glow-amber' : 'bg-emerald-500 glow-emerald'}`} style={{ width: `${progress}%` }}></div>
                       </div>
                     </div>
                   );
                })
             )}
          </div>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div variants={item} className="glass-card p-6 flex flex-col h-[320px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground"><CalendarDays className="w-4 h-4 text-blue-400" /> Today's Schedule</h2>
            <button onClick={() => navigate('/planner')} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold tracking-wide flex items-center gap-1 uppercase">Planner <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-3 pr-2 -mr-2">
            {todayEvents.map(e => (
              <motion.div key={e.id} whileHover={{ x: 4 }} onClick={() => navigate('/planner')} className="flex items-start gap-4 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all cursor-pointer">
                <div className="w-1 h-10 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{e.title}</p>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">{new Date(e.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(e.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </motion.div>
            ))}
            {todayEvents.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-xs text-muted-foreground font-medium">No events today</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Continue Learning */}
        <motion.div variants={item} className="glass-card p-6 flex flex-col h-[320px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground"><GraduationCap className="w-4 h-4 text-indigo-400" /> Continue Learning</h2>
            <button onClick={() => navigate('/learning')} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold tracking-wide flex items-center gap-1 uppercase">Learn <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-4 pr-2 -mr-2">
             {courses.filter(c => c.status === 'in_progress').length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-60">
                  <GraduationCap className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground font-medium mb-4">Not studying actively.</p>
                  <button onClick={() => navigate('/learning')} className="btn-secondary text-[11px] py-1.5 px-3"><Plus className="w-3.5 h-3.5" /> Find a Course</button>
                </div>
             ) : (
                courses.filter(c => c.status === 'in_progress').slice(0, 3).map(course => (
                  <div key={course.id} className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/50 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-semibold text-sm mb-1 truncate text-slate-200">{course.title}</h3>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">{course.platform}</span>
                      </div>
                      <button className="text-indigo-400 bg-indigo-500/10 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500 hover:text-white hover:scale-110 shadow-lg"><PlayCircle className="w-4 h-4" /></button>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                      <span>Progress</span>
                      <span className="text-indigo-300">{course.progress_percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out glow-purple" style={{ width: `${course.progress_percent}%` }}></div>
                    </div>
                  </div>
                ))
             )}
          </div>
        </motion.div>

        {/* Reminders - Horizontal span */}
        <motion.div variants={item} className="glass-card p-6 bento-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground"><Bell className="w-4 h-4 text-rose-400" /> Upcoming Reminders</h2>
            <button onClick={() => navigate('/reminders')} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold tracking-wide uppercase flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reminders.filter(r => !r.is_completed).slice(0, 4).map(r => (
              <motion.div key={r.id} whileHover={{ y: -2 }} onClick={() => navigate('/reminders')} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all cursor-pointer">
                <div className={`w-2.5 h-2.5 rounded-full ${r.priority === 'high' ? 'bg-rose-500 glow-rose' : r.priority === 'medium' ? 'bg-amber-500 glow-amber' : 'bg-blue-500 glow-blue'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{r.title}</p>
                  <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{r.due_datetime ? new Date(r.due_datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date'}</p>
                </div>
              </motion.div>
            ))}
            {reminders.filter(r => !r.is_completed).length === 0 && (
              <div className="col-span-2 text-center py-6 opacity-60">
                <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2"><Bell className="w-4 h-4" /> All caught up!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Active Projects */}
        <motion.div variants={item} className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold flex items-center gap-2 text-foreground"><Lightbulb className="w-4 h-4 text-purple-400" /> Active Projects</h2>
            <button onClick={() => navigate('/projects')} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold tracking-wide flex items-center gap-1 uppercase">Projects <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="flex flex-col gap-3">
            {activeProjects.slice(0, 3).map(p => (
              <motion.div key={p.id} whileHover={{ x: 4 }} onClick={() => navigate('/projects')} className="p-3 rounded-xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ${STATUS_COLORS[p.status] || STATUS_COLORS.idea}`}>{p.status.replace('-', ' ')}</span>
                </div>
                <p className="text-sm font-semibold text-slate-200 truncate">{p.title}</p>
              </motion.div>
            ))}
            {activeProjects.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-60 py-4">
                <Lightbulb className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-medium">No active projects</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
