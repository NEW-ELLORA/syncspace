import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  Clock,
  PlayCircle,
  Plus,
  CheckCircle2,
  Award,
  Sparkles,
  X,
  ExternalLink,
  Trash2,
  Pencil,
} from 'lucide-react';
import type { Course } from '../types/electron.d.ts';

/* ── animation variants ─────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};
const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
const modalPanel = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
  exit: { opacity: 0, scale: 0.92, y: 24, transition: { duration: 0.15 } },
};
const cardHover = { scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 25 } };

/* ── default form state ──────────────────────────────────── */
const emptyForm: Partial<Course> = {
  title: '',
  platform: '',
  status: 'queued',
  priority: 'medium',
  link: '',
  estimated_hours: 0,
  why_tag: '',
};

/* ── stat card helper ────────────────────────────────────── */
function StatCard({
  icon,
  label,
  value,
  accent,
  glow,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
  glow: string;
}) {
  return (
    <motion.div variants={item} whileHover={cardHover} className={`glass-card ${glow} p-6 flex flex-col justify-center`}>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className={accent}>{icon}</span>
        {label}
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LEARNING PAGE
   ═══════════════════════════════════════════════════════════ */
export default function Learning() {
  const [activeTab, setActiveTab] = useState<'in_progress' | 'queued' | 'completed'>('in_progress');
  const [courses, setCourses] = useState<Course[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<Partial<Course>>({ ...emptyForm });
  const [error, setError] = useState<string | null>(null);

  /* ── data loading ──────────────────────────────────────── */
  const load = async () => {
    try {
      const c = await window.api.getCourses();
      setCourses(c);
      setError(null);
    } catch (e) {
      console.error('Failed to load courses:', e);
      setError('Could not load courses. Please try again.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ── save (create / update) ────────────────────────────── */
  const handleSave = async () => {
    if (!form.title) return;
    try {
      if (isEditing) {
        await window.api.updateCourse({ ...isEditing, ...form } as Course);
      } else {
        await window.api.createCourse({ ...form, progress_percent: 0 } as Omit<Course, 'id'>);
      }
      setShowAddModal(false);
      setIsEditing(null);
      setForm({ ...emptyForm });
      load();
    } catch (e) {
      console.error('Failed to save course:', e);
      setError('Could not save the course. Please try again.');
    }
  };

  /* ── delete ────────────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    try {
      await window.api.deleteCourse(id);
      load();
    } catch (e) {
      console.error('Failed to delete course:', e);
      setError('Could not delete the course. Please try again.');
    }
  };

  /* ── quick status change ───────────────────────────────── */
  const handleStatusChange = async (course: Course, newStatus: string) => {
    try {
      await window.api.updateCourse({
        ...course,
        status: newStatus,
        progress_percent: newStatus === 'completed' ? 100 : course.progress_percent,
      } as Course);
      load();
    } catch (e) {
      console.error('Failed to update course status:', e);
      setError('Could not update course status.');
    }
  };

  /* ── edit ───────────────────────────────────────────────── */
  const openEdit = (c: Course) => {
    setIsEditing(c);
    setForm(c);
    setShowAddModal(true);
  };

  const openAdd = () => {
    setIsEditing(null);
    setForm({ ...emptyForm });
    setShowAddModal(true);
  };

  const filteredCourses = courses.filter((c) => c.status === activeTab);
  const inProgressCount = courses.filter((c) => c.status === 'in_progress').length;
  const completedCount = courses.filter((c) => c.status === 'completed').length;
  const totalHours = courses.reduce((acc, c) => acc + (c.estimated_hours || 0), 0);

  /* ── tab config ────────────────────────────────────────── */
  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'in_progress', label: 'In Progress' },
    { key: 'queued', label: 'Up Next' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <motion.div
      className="p-6 h-full overflow-y-auto max-w-5xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ──────────────────────────────────────── */}
      <motion.div variants={item} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <span className="gradient-text">Learning</span>
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse-glow" />
          </h1>
          <p className="text-muted-foreground text-sm">
            Track your courses, study streaks, and knowledge goals.
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" /> New Course
        </button>
      </motion.div>

      {/* ── Error Banner ────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 glass-card glow-rose p-4 flex items-center justify-between text-sm text-rose-300"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats Row ───────────────────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<BookOpen className="w-4 h-4" />}
          label="Active Courses"
          value={inProgressCount}
          accent="text-blue-400"
          glow="glow-blue"
        />
        <StatCard
          icon={<GraduationCap className="w-4 h-4" />}
          label="Completed"
          value={completedCount}
          accent="text-emerald-400"
          glow="glow-emerald"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Total Hours"
          value={
            <span className="flex items-end gap-2">
              {totalHours}
              <span className="text-sm text-muted-foreground mb-1 font-medium lowercase">hrs</span>
            </span>
          }
          accent="text-amber-400"
          glow="glow-amber"
        />
      </motion.div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <motion.div variants={item} className="flex gap-1 mb-6 border-b border-white/5 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-white'
                : 'text-muted-foreground hover:text-white/80'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="learning-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* ── Course List ─────────────────────────────────── */}
      <motion.div variants={item} className="space-y-4">
        {filteredCourses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 border border-dashed border-white/10 rounded-2xl glass-card"
          >
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-semibold mb-2">No courses here</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Start learning something new today.
            </p>
            <button onClick={openAdd} className="btn-secondary">
              Add a Course
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                whileHover={cardHover}
                className="glass-card glass-card-hover p-5 group flex items-start gap-4"
              >
                {/* left content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h3 className="font-bold text-lg truncate">{course.title}</h3>
                    <span
                      className={`badge ${
                        course.priority === 'high'
                          ? 'badge-high'
                          : course.priority === 'medium'
                          ? 'badge-medium'
                          : 'badge-low'
                      }`}
                    >
                      {course.priority}
                    </span>
                    {course.platform && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/60 border border-white/5">
                        {course.platform}
                      </span>
                    )}
                  </div>

                  {course.why_tag && (
                    <p className="text-xs text-muted-foreground mt-1 italic">"{course.why_tag}"</p>
                  )}

                  {/* progress bar for in-progress */}
                  {course.status === 'in_progress' && (
                    <div className="mt-4 max-w-md">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-indigo-300">{course.progress_percent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress_percent}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* meta row */}
                  {(course.estimated_hours > 0 || course.link) && (
                    <div className="flex items-center gap-4 mt-3">
                      {course.estimated_hours > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {course.estimated_hours}h
                        </span>
                      )}
                      {course.link && (
                        <a
                          href={course.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Open link
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* right actions */}
                <div className="flex flex-col gap-2 items-end shrink-0">
                  {course.status === 'queued' && (
                    <button
                      className="btn-primary text-xs py-1.5"
                      onClick={() => handleStatusChange(course, 'in_progress')}
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Start Now
                    </button>
                  )}
                  {course.status === 'in_progress' && (
                    <button
                      className="btn-primary text-xs py-1.5"
                      onClick={() => handleStatusChange(course, 'completed')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                    </button>
                  )}
                  {course.status === 'completed' && (
                    <button className="btn-secondary text-xs py-1.5">
                      <Award className="w-3.5 h-3.5" /> View Notes
                    </button>
                  )}
                  <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => openEdit(course)}
                      className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="text-xs text-rose-500/70 hover:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* ── Add / Edit Modal ────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="modal-overlay"
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="modal-content"
              variants={modalPanel}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* modal header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold gradient-text">
                  {isEditing ? 'Edit Course' : 'Add Course'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* form fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                    Title
                  </label>
                  <input
                    className="input-field"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Next.js Masterclass"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                      Platform
                    </label>
                    <input
                      className="input-field"
                      value={form.platform}
                      onChange={(e) => setForm({ ...form, platform: e.target.value })}
                      placeholder="e.g. Udemy"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                      Priority
                    </label>
                    <select
                      className="input-field"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value as Course['priority'] })}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                      Course Link
                    </label>
                    <input
                      className="input-field"
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                      Est. Hours
                    </label>
                    <input
                      className="input-field"
                      type="number"
                      min={0}
                      value={form.estimated_hours ?? 0}
                      onChange={(e) =>
                        setForm({ ...form, estimated_hours: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                    Status
                  </label>
                  <select
                    className="input-field"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Course['status'] })}
                  >
                    <option value="queued">Up Next (Queued)</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                    Why? (motivation tag)
                  </label>
                  <input
                    className="input-field"
                    value={form.why_tag}
                    onChange={(e) => setForm({ ...form, why_tag: e.target.value })}
                    placeholder="e.g. Career growth, side project..."
                  />
                </div>

                {/* buttons */}
                <div className="pt-2 flex gap-3">
                  <button
                    className="btn-secondary flex-1 justify-center"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn-primary flex-1 justify-center" onClick={handleSave}>
                    {isEditing ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
