import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Circle, Clock, Tag, Trash2, X, Pencil, CalendarX2 } from 'lucide-react';
import { isBefore, parseISO } from 'date-fns';
import type { Reminder } from '../types/electron.d.ts';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const listItem = { 
  hidden: { opacity: 0, height: 0, marginBottom: 0 }, 
  show: { opacity: 1, height: 'auto', marginBottom: 8 }, 
  exit: { opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2 } } 
};

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: '', title: '', description: '', due_datetime: '', priority: 'medium', category: 'Personal', recurrence_rule: '' });

  const load = async () => {
    try { setReminders(await window.api.getReminders()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNewModal = () => {
    setForm({ id: '', title: '', description: '', due_datetime: '', priority: 'medium', category: 'Personal', recurrence_rule: '' });
    setShowModal(true);
  };

  const openEditModal = (r: Reminder) => {
    setForm({ 
      id: r.id, 
      title: r.title || '', 
      description: r.description || '', 
      due_datetime: r.due_datetime ? r.due_datetime.slice(0,16) : '', 
      priority: r.priority || 'medium', 
      category: r.category || 'Personal', 
      recurrence_rule: r.recurrence_rule || '' 
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (form.id) {
      await window.api.updateReminder(form);
    } else {
      await window.api.createReminder(form);
    }
    setShowModal(false);
    load();
  };

  const handleToggle = async (id: string) => {
    await window.api.toggleReminder(id);
    load();
  };

  const handleSnooze = async (r: Reminder) => {
    if (!r.due_datetime) return;
    const newDate = new Date(new Date(r.due_datetime).getTime() + 60 * 60 * 1000);
    
    await window.api.updateReminder({
      ...r,
      due_datetime: newDate.toISOString().slice(0, 16)
    });
    load();
  };

  const handleDelete = async (id: string) => {
    await window.api.deleteReminder(id);
    load();
  };

  const active = reminders.filter(r => !r.is_completed);
  const completed = reminders.filter(r => r.is_completed);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div className="p-6 h-full overflow-y-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
          <p className="text-muted-foreground text-sm mt-1">{active.length} active · {completed.length} completed</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openNewModal} className="btn-primary">
          <Plus className="w-4 h-4" /> New Reminder
        </motion.button>
      </motion.div>

      {active.length === 0 && completed.length === 0 && (
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="glass-card p-16 text-center max-w-md mx-auto mt-12 flex flex-col items-center border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <CalendarX2 className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3 tracking-tight">No reminders yet</h3>
          <p className="text-muted-foreground mb-8 text-center">Your mind is clear! Add some reminders to stay organized and never miss a beat.</p>
          <button onClick={openNewModal} className="btn-primary shadow-lg shadow-primary/20"><Plus className="w-5 h-5 mr-1" /> Add Your First Reminder</button>
        </motion.div>
      )}

      {active.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active ({active.length})</h2>
          <div>
            <AnimatePresence mode="sync">
              {active.map(r => <ReminderCard key={r.id} reminder={r} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEditModal} onSnooze={handleSnooze} />)}
            </AnimatePresence>
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Completed ({completed.length})</h2>
          <div>
            <AnimatePresence mode="sync">
              {completed.map(r => <ReminderCard key={r.id} reminder={r} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEditModal} onSnooze={handleSnooze} />)}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{form.id ? 'Edit Reminder' : 'New Reminder'}</h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title *</label>
                  <input className="input-field" placeholder="What do you need to remember?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                  <textarea className="input-field" rows={2} placeholder="Optional details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Due Date & Time</label>
                    <input type="datetime-local" className="input-field" value={form.due_datetime} onChange={e => setForm({ ...form, due_datetime: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Priority</label>
                    <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                    <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option>Personal</option><option>Work</option><option>Health</option><option>Finance</option><option>Shopping</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Recurrence</label>
                    <select className="input-field" value={form.recurrence_rule} onChange={e => setForm({ ...form, recurrence_rule: e.target.value })}>
                      <option value="">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleSave} className="btn-primary flex-1">{form.id ? 'Save Changes' : 'Create Reminder'}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReminderCard({ reminder: r, onToggle, onDelete, onEdit, onSnooze }: { reminder: Reminder; onToggle: (id: string) => void; onDelete: (id: string) => void; onEdit: (r: Reminder) => void; onSnooze: (r: Reminder) => void }) {
  const isOverdue = r.due_datetime && !r.is_completed && isBefore(parseISO(r.due_datetime), new Date());
  
  return (
    <motion.div variants={listItem} initial="hidden" animate="show" exit="exit" layout
      className={`glass-card glass-card-hover p-4 flex items-center gap-4 group transition-all duration-500 overflow-hidden ${r.is_completed ? 'opacity-50' : 'opacity-100'} ${isOverdue ? 'border-red-500/50 bg-red-500/5' : ''}`}
    >
      <button onClick={() => onToggle(r.id)} className="shrink-0 transition-colors z-10">
        {r.is_completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className={`w-5 h-5 hover:text-primary ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`} />}
      </button>
      <div className={`flex-1 min-w-0 transition-all duration-500 ${r.is_completed ? 'opacity-60' : 'opacity-100'}`}>
        <div className="relative inline-block max-w-full">
          <p className={`text-sm font-semibold truncate transition-all duration-500 ${isOverdue ? 'text-red-400' : ''}`}>
            {r.title}
          </p>
          {r.is_completed && (
            <motion.span 
              initial={{ scaleX: 0 }} 
              animate={{ scaleX: 1 }} 
              className="absolute left-0 top-1/2 w-full h-[1.5px] bg-foreground/70 origin-left" 
            />
          )}
        </div>
        {r.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{r.description}</p>}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {r.due_datetime && (
            <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}><Clock className="w-3 h-3" />{new Date(r.due_datetime).toLocaleString()}</span>
          )}
          <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3" />{r.category}</span>
        </div>
      </div>
      <span className={`badge shrink-0 ${r.priority === 'high' ? 'badge-high' : r.priority === 'medium' ? 'badge-medium' : 'badge-low'}`}>{r.priority}</span>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {!r.is_completed && r.due_datetime && (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onSnooze(r)}
            className="text-muted-foreground hover:text-amber-400 z-10 p-1" title="Snooze 1 Hour">
            <Clock className="w-4 h-4" />
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onEdit(r)}
          className="text-muted-foreground hover:text-primary z-10 p-1">
          <Pencil className="w-4 h-4" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onDelete(r.id)}
          className="text-muted-foreground hover:text-destructive z-10 p-1">
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
