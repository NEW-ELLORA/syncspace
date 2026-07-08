import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronLeft, ChevronRight, MapPin, Trash2, Edit2, X, Clock,
  Calendar as CalendarIcon, CalendarDays, CalendarRange
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek, parseISO
} from 'date-fns';
import type { CalendarEvent } from '../types/electron.d.ts';

const CATEGORIES = [
  { name: 'Work', color: 'bg-blue-500', glow: 'glow-blue', border: 'border-blue-500/30' },
  { name: 'Personal', color: 'bg-emerald-500', glow: 'glow-emerald', border: 'border-emerald-500/30' },
  { name: 'Health', color: 'bg-rose-500', glow: 'glow-rose', border: 'border-rose-500/30' },
  { name: 'Learning', color: 'bg-purple-500', glow: 'glow-purple', border: 'border-purple-500/30' },
  { name: 'Other', color: 'bg-amber-500', glow: 'glow-amber', border: 'border-amber-500/30' }
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const listAnim = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Planner() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', start_datetime: '', end_datetime: '', location: '', category: 'Work', auto_create_reminder: false });

  const load = async () => {
    try { setEvents(await window.api.getEvents()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.start_datetime || !form.end_datetime) return;
    
    // Check conflict (only with other events)
    const newStart = new Date(form.start_datetime).getTime();
    const newEnd = new Date(form.end_datetime).getTime();
    const conflict = events.some(e => {
      if (editId && e.id === editId) return false;
      const eStart = new Date(e.start_datetime).getTime();
      const eEnd = new Date(e.end_datetime).getTime();
      return newStart < eEnd && newEnd > eStart;
    });
    
    if (conflict && !confirm('⚠️ This event overlaps with an existing event. Save anyway?')) return;
    
    // We hackily store category in location separated by ::
    const locationStr = form.location ? `${form.category}::${form.location}` : `${form.category}::`;

    if (editId) {
      await window.api.updateEvent({ id: editId, ...form, location: locationStr });
    } else {
      await window.api.createEvent({ ...form, location: locationStr });
      if (form.auto_create_reminder) {
        await window.api.createReminder({
          title: `Reminder: ${form.title}`,
          description: `Starts at ${new Date(form.start_datetime).toLocaleString()}`,
          due_datetime: form.start_datetime,
          priority: 'high',
          category: form.category || 'Work',
          recurrence_rule: ''
        });
      }
    }
    
    setForm({ title: '', description: '', start_datetime: '', end_datetime: '', location: '', category: 'Work', auto_create_reminder: false });
    setEditId(null);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await window.api.deleteEvent(id);
    load();
  };

  const openCreateForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setForm({ title: '', description: '', start_datetime: `${dateStr}T09:00`, end_datetime: `${dateStr}T10:00`, location: '', category: 'Work' });
    setSelectedDate(date);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (e: CalendarEvent) => {
    let cat = 'Work';
    let loc = e.location || '';
    if (loc.includes('::')) {
      const parts = loc.split('::');
      cat = parts[0];
      loc = parts[1] || '';
    } else if (CATEGORIES.some(c => c.name === loc)) {
      cat = loc;
      loc = '';
    }
    
    setForm({
      title: e.title,
      description: e.description || '',
      start_datetime: e.start_datetime,
      end_datetime: e.end_datetime,
      location: loc,
      category: cat || 'Work'
    });
    setEditId(e.id);
    setShowModal(true);
  };

  // Helper to parse event
  const parseEvent = (e: CalendarEvent) => {
    let cat = 'Work';
    let loc = e.location || '';
    if (loc.includes('::')) {
      const parts = loc.split('::');
      cat = parts[0];
      loc = parts[1] || '';
    }
    const catData = CATEGORIES.find(c => c.name === cat) || CATEGORIES[0];
    return { ...e, parsedCategory: cat, parsedLocation: loc, catData };
  };

  const parsedEvents = useMemo(() => events.map(parseEvent), [events]);

  const nextPeriod = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prevPeriod = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Get days to render in grid/list
  const daysInView = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return eachDayOfInterval({ start, end });
    } else if (view === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return eachDayOfInterval({ start, end });
    } else {
      return [currentDate];
    }
  }, [view, currentDate]);

  const getEventsForDay = (day: Date) => parsedEvents.filter(e => e.start_datetime && isSameDay(parseISO(e.start_datetime), day));
  const selectedDayEvents = getEventsForDay(selectedDate);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div className="p-6 h-full overflow-y-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={listAnim} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planner</h1>
          <p className="text-muted-foreground text-sm mt-1">{events.length} total events</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-black/20 p-1 rounded-lg border border-white/5 flex gap-1">
            <button onClick={() => setView('month')} className={`p-1.5 rounded-md transition-colors ${view === 'month' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5'}`} title="Month View"><CalendarIcon className="w-4 h-4" /></button>
            <button onClick={() => setView('week')} className={`p-1.5 rounded-md transition-colors ${view === 'week' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5'}`} title="Week View"><CalendarDays className="w-4 h-4" /></button>
            <button onClick={() => setView('day')} className={`p-1.5 rounded-md transition-colors ${view === 'day' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5'}`} title="Day View"><CalendarRange className="w-4 h-4" /></button>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openCreateForDate(new Date())} className="btn-primary">
            <Plus className="w-4 h-4" /> New Event
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main View Area */}
        <motion.div variants={listAnim} className={`glass-card p-5 ${view === 'month' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">
              {view === 'month' && format(currentDate, 'MMMM yyyy')}
              {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
              {view === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={prevPeriod} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-4 h-4" /></motion.button>
              <button onClick={goToToday} className="text-xs px-3 py-1 rounded-lg hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition-colors">Today</button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={nextPeriod} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition-colors"><ChevronRight className="w-4 h-4" /></motion.button>
            </div>
          </div>

          {/* Month Grid */}
          {view === 'month' && (
            <div className="grid grid-cols-7 gap-px">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {daysInView.map((day, i) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);
                return (
                  <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDate(day)}
                    onDoubleClick={() => openCreateForDate(day)}
                    className={`relative p-2 rounded-xl text-sm transition-all min-h-[56px] flex flex-col items-center gap-1 ${
                      isSelected ? 'bg-primary/20 border border-primary/30' :
                      isToday ? 'bg-white/[0.05] border border-white/[0.1]' :
                      'hover:bg-white/[0.03] border border-transparent'
                    } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap justify-center w-full px-1">
                        {dayEvents.slice(0, 3).map((e, j) => (
                          <div key={j} className={`w-1.5 h-1.5 rounded-full ${e.catData.color}`} title={e.title} />
                        ))}
                        {dayEvents.length > 3 && <span className="text-[9px] text-muted-foreground leading-none">+{dayEvents.length - 3}</span>}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Week & Day Lists */}
          {(view === 'week' || view === 'day') && (
            <div className="space-y-6">
              {daysInView.map(day => {
                const dayEvents = getEventsForDay(day);
                if (dayEvents.length === 0 && view === 'week') return null; // Skip empty days in week view to save space
                
                return (
                  <div key={day.toISOString()} className="space-y-3">
                    {view === 'week' && (
                      <h3 className={`text-sm font-medium pb-1 border-b border-white/5 ${isSameDay(day, new Date()) ? 'text-primary' : 'text-muted-foreground'}`}>
                        {format(day, 'EEEE, MMM d')}
                      </h3>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {dayEvents.map(e => (
                          <motion.div key={e.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className={`glass-card glass-card-hover p-4 group relative border-l-2 ${e.catData.border}`}>
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-sm font-semibold pr-12 truncate">{e.title}</p>
                              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(e)} className="p-1 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDelete(e.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                            
                            {e.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
                            
                            <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                                {format(parseISO(e.start_datetime), 'HH:mm')} – {format(parseISO(e.end_datetime), 'HH:mm')}
                              </span>
                              {e.parsedLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.parsedLocation}</span>}
                              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border ${e.catData.border} text-white/70`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${e.catData.color}`} />
                                {e.parsedCategory}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {dayEvents.length === 0 && view === 'day' && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 glow-purple">
                            <CalendarIcon className="w-8 h-8 text-primary" />
                          </div>
                          <h3 className="text-lg font-medium mb-1">No events scheduled</h3>
                          <p className="text-sm text-muted-foreground mb-5 max-w-sm">You have a clear schedule for this day. Enjoy your free time or add a new event!</p>
                          <button onClick={() => openCreateForDate(currentDate)} className="btn-primary">
                            <Plus className="w-4 h-4" /> Add Event
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {view === 'week' && daysInView.every(d => getEventsForDay(d).length === 0) && (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 glow-purple">
                    <CalendarDays className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Clear Week Ahead</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-sm">No events scheduled for this entire week. Take a break or plan something new!</p>
                  <button onClick={() => openCreateForDate(currentDate)} className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Event
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Sidebar for Month View (Selected Day details) */}
        {view === 'month' && (
          <motion.div variants={listAnim} className="glass-card p-5 h-fit sticky top-0">
            <h2 className="text-lg font-semibold mb-1">{format(selectedDate, 'EEEE')}</h2>
            <p className="text-xs text-muted-foreground mb-4">{format(selectedDate, 'MMMM d, yyyy')}</p>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {selectedDayEvents.map(e => (
                  <motion.div key={e.id} layout initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className={`glass-card glass-card-hover p-3 group relative border-l-2 ${e.catData.border}`}>
                    <p className="text-sm font-semibold pr-10">{e.title}</p>
                    {e.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
                    
                    <div className="flex flex-col gap-1 mt-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                          {format(parseISO(e.start_datetime), 'HH:mm')} – {format(parseISO(e.end_datetime), 'HH:mm')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><div className={`w-1.5 h-1.5 rounded-full ${e.catData.color}`} />{e.parsedCategory}</span>
                        {e.parsedLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.parsedLocation}</span>}
                      </div>
                    </div>
                    
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 p-1 rounded-md backdrop-blur-md">
                      <button onClick={() => openEdit(e)} className="p-1 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {selectedDayEvents.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">No events for this day</p>
                  <button onClick={() => openCreateForDate(selectedDate)} className="btn-primary text-xs !py-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Event
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content !max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editId ? 'Edit Event' : 'New Event'}</h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title *</label>
                  <input className="input-field" placeholder="Event name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                  <textarea className="input-field" rows={2} placeholder="Optional details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start *</label>
                    <input type="datetime-local" className="input-field" value={form.start_datetime} onChange={e => setForm({ ...form, start_datetime: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">End *</label>
                    <input type="datetime-local" className="input-field" value={form.end_datetime} onChange={e => setForm({ ...form, end_datetime: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                    <select className="input-field appearance-none" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location</label>
                    <input className="input-field" placeholder="Zoom, Office..." value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>
                {!editId && (
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="auto-remind" className="rounded border-white/10 bg-white/5" checked={form.auto_create_reminder} onChange={e => setForm({ ...form, auto_create_reminder: e.target.checked })} />
                    <label htmlFor="auto-remind" className="text-sm text-muted-foreground cursor-pointer">Auto-create reminder for this event</label>
                  </div>
                )}
                <div className="flex gap-3 pt-4 border-t border-white/5 mt-6">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleSave} className="btn-primary flex-1">{editId ? 'Save Changes' : 'Create Event'}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
