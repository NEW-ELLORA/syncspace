import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Wallet, GraduationCap, ArrowRight, PlayCircle, Plus, CalendarDays, Lightbulb, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Reminder, Transaction, BudgetConfig, Budget, Project, CalendarEvent } from '../types/electron.d.ts';

const STATUS_COLORS: Record<string, string> = { idea: 'bg-purple-500/15 text-purple-400 border-purple-500/20', 'in-progress': 'bg-blue-500/15 text-blue-400 border-blue-500/20', completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', 'on-hold': 'bg-amber-500/15 text-amber-400 border-amber-500/20' };

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
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
          window.api.getCourses ? window.api.getCourses() : Promise.resolve([])
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
    <motion.div className="p-6 h-full overflow-y-auto max-w-5xl mx-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{greeting()} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Here is your daily snapshot.</p>
      </motion.div>

      {/* Row 1: 3 Headline Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div variants={item} onClick={() => navigate('/budget')} className="glass-card glow-blue p-6 cursor-pointer group hover:bg-white/[0.04] transition-colors relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet className="w-16 h-16 text-blue-500" /></div>
           <div className="relative z-10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Total Balance</span>
              <p className="text-4xl font-extrabold text-blue-400 tracking-tight">₹{derivedTotalBalance.toLocaleString('en-IN')}</p>
           </div>
        </motion.div>

        <motion.div variants={item} onClick={() => navigate('/budget')} className="glass-card glow-emerald p-6 cursor-pointer group hover:bg-white/[0.04] transition-colors relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet className="w-16 h-16 text-emerald-500" /></div>
           <div className="relative z-10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Net Savings Rate</span>
              <p className="text-4xl font-extrabold text-emerald-400 tracking-tight">{netSavingsRate}%</p>
           </div>
        </motion.div>

        <motion.div variants={item} onClick={() => navigate('/reminders')} className="glass-card glow-amber p-6 cursor-pointer group hover:bg-white/[0.04] transition-colors relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Bell className="w-16 h-16 text-amber-500" /></div>
           <div className="relative z-10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Due Today</span>
              <p className="text-4xl font-extrabold text-amber-400 tracking-tight">{todayReminders.length}</p>
           </div>
        </motion.div>
      </div>

      {/* Row 2: 2 Content Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Budget Category Health */}
        <motion.div variants={item} className="glass-card p-6 flex flex-col max-h-[400px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-400" /> Budget Health</h2>
            <button onClick={() => navigate('/budget')} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">View Budget <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-4 pr-2 -mr-2">
             {budgets.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No category limits set.</p>
                </div>
             ) : (
                budgets.map(b => {
                   const spent = categorySpend[b.category] || 0;
                   const progress = Math.min(100, (spent / b.monthly_limit) * 100);
                   const isWarning = progress >= 80;
                   const isDanger = progress >= 100;
                   return (
                     <div key={b.id} className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.02]">
                       <div className="flex justify-between text-sm mb-2">
                         <span className="font-medium">{b.category}</span>
                         <span className={isDanger ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400 font-bold' : 'text-muted-foreground'}>
                           ₹{spent.toLocaleString()} / ₹{b.monthly_limit.toLocaleString()}
                         </span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className={`h-full rounded-full transition-all duration-500 ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }}></div>
                       </div>
                     </div>
                   );
                })
             )}
          </div>
        </motion.div>

        {/* Continue Learning */}
        <motion.div variants={item} className="glass-card p-6 flex flex-col max-h-[400px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-400" /> Continue Learning</h2>
            <button onClick={() => navigate('/learning')} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">View Learning <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-4 pr-2 -mr-2">
             {courses.filter(c => c.status === 'in_progress').length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Not studying anything actively.</p>
                  <button onClick={() => navigate('/learning')} className="btn-secondary text-xs py-1.5"><Plus className="w-3 h-3" /> Find a Course</button>
                </div>
             ) : (
                courses.filter(c => c.status === 'in_progress').slice(0, 3).map(course => (
                  <div key={course.id} className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.02] group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-sm mb-0.5">{course.title}</h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/70">{course.platform}</span>
                      </div>
                      <button className="text-indigo-400 bg-indigo-500/10 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-500/20"><PlayCircle className="w-4 h-4" /></button>
                    </div>
                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground mb-1.5">
                      <span>Progress</span>
                      <span>{course.progress_percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${course.progress_percent}%` }}></div>
                    </div>
                  </div>
                ))
             )}
          </div>
        </motion.div>
      </div>

      {/* Row 3: Reminders, Schedule, Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reminders */}
        <motion.div variants={item} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Bell className="w-4 h-4 text-amber-400" /> Upcoming Reminders</h2>
            <button onClick={() => navigate('/reminders')} className="text-[10px] text-indigo-400 hover:text-indigo-300">View all</button>
          </div>
          {reminders.filter(r => !r.is_completed).slice(0, 4).map(r => (
            <motion.div key={r.id} onClick={() => navigate('/reminders')} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer">
              <div className={`w-1.5 h-1.5 rounded-full ${r.priority === 'high' ? 'bg-rose-400' : 'bg-blue-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{r.title}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{r.due_datetime ? new Date(r.due_datetime).toLocaleDateString() : 'No date'}</p>
              </div>
            </motion.div>
          ))}
          {reminders.filter(r => !r.is_completed).length === 0 && (
            <div className="text-center py-4"><p className="text-xs text-muted-foreground">All caught up!</p></div>
          )}
        </motion.div>

        {/* Today's Schedule */}
        <motion.div variants={item} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-400" /> Today's Schedule</h2>
            <button onClick={() => navigate('/planner')} className="text-[10px] text-indigo-400 hover:text-indigo-300">View all</button>
          </div>
          {todayEvents.map(e => (
            <motion.div key={e.id} onClick={() => navigate('/planner')} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer">
              <div className="w-0.5 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium">{e.title}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(e.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(e.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </motion.div>
          ))}
          {todayEvents.length === 0 && (
            <div className="text-center py-4"><p className="text-xs text-muted-foreground">No events today</p></div>
          )}
        </motion.div>
        
        {/* Active Projects */}
        <motion.div variants={item} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="w-4 h-4 text-purple-400" /> Active Projects</h2>
            <button onClick={() => navigate('/projects')} className="text-[10px] text-indigo-400 hover:text-indigo-300">View all</button>
          </div>
          <div className="flex flex-col gap-2">
            {activeProjects.slice(0, 4).map(p => (
              <motion.div key={p.id} onClick={() => navigate('/projects')} className="p-2.5 rounded-lg cursor-pointer transition-all glass-card hover:bg-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] px-1 py-0.5 rounded border font-semibold uppercase ${STATUS_COLORS[p.status] || STATUS_COLORS.idea}`}>{p.status.replace('-', ' ')}</span>
                </div>
                <p className="text-xs font-semibold truncate mt-1">{p.title}</p>
              </motion.div>
            ))}
            {activeProjects.length === 0 && (
              <div className="text-center py-4"><p className="text-xs text-muted-foreground">No active projects</p></div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
