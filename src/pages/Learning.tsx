import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, Clock, PlayCircle, Plus, CheckCircle2, Award } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

type Course = {
  id: string;
  title: string;
  platform: string;
  status: 'queued' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  progress_percent: number;
  estimated_hours: number;
  link: string;
  why_tag: string;
  started_at: string;
};

export default function Learning() {
  const [activeTab, setActiveTab] = useState<'in_progress' | 'queued' | 'completed'>('in_progress');
  const [courses, setCourses] = useState<Course[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<Partial<Course>>({ title: '', platform: '', status: 'queued', priority: 'medium', link: '', estimated_hours: 0, why_tag: '' });

  const load = async () => {
    try {
      if (window.api?.getCourses) {
        const c = await window.api.getCourses();
        setCourses(c);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title) return;
    try {
      if (isEditing && window.api?.updateCourse) {
        await window.api.updateCourse({ ...isEditing, ...form } as Course);
      } else if (window.api?.createCourse) {
        await window.api.createCourse({ ...form, progress_percent: 0 } as Omit<Course, 'id'>);
      }
      setShowAddModal(false);
      setIsEditing(null);
      setForm({ title: '', platform: '', status: 'queued', priority: 'medium', link: '', estimated_hours: 0, why_tag: '' });
      load();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (window.api?.deleteCourse) {
      await window.api.deleteCourse(id);
      load();
    }
  };

  const openEdit = (c: Course) => {
    setIsEditing(c);
    setForm(c);
    setShowAddModal(true);
  };



  const filteredCourses = courses.filter(c => c.status === activeTab);

  return (
    <motion.div className="p-6 h-full overflow-y-auto max-w-5xl mx-auto" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Learning</h1>
          <p className="text-muted-foreground text-sm">Track your courses, study streaks, and knowledge goals.</p>
        </div>
        <button onClick={() => { setIsEditing(null); setForm({ title: '', platform: '', status: 'queued', priority: 'medium', link: '', estimated_hours: 0, why_tag: '' }); setShowAddModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> New Course
        </button>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 flex flex-col justify-center">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-400" /> Active Courses</div>
          <div className="text-3xl font-bold">{courses.filter(c => c.status === 'in_progress').length}</div>
        </div>
        <div className="glass-card p-6 flex flex-col justify-center">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-emerald-400" /> Completed</div>
          <div className="text-3xl font-bold">{courses.filter(c => c.status === 'completed').length}</div>
        </div>
        <div className="glass-card p-6 flex flex-col justify-center">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Study Streak</div>
          <div className="text-3xl font-bold flex items-end gap-2">3 <span className="text-sm text-muted-foreground mb-1 font-medium lowercase">days</span></div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-4 mb-6 border-b border-white/5 pb-px">
        <button onClick={() => setActiveTab('in_progress')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'in_progress' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}>In Progress</button>
        <button onClick={() => setActiveTab('queued')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'queued' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}>Up Next</button>
        <button onClick={() => setActiveTab('completed')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'completed' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-white'}`}>Completed</button>
      </motion.div>

      {/* Course List */}
      <motion.div variants={item} className="space-y-4">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl glass-card">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No courses here</h3>
            <p className="text-sm text-muted-foreground mb-4">Start learning something new today.</p>
            <button onClick={() => setShowAddModal(true)} className="btn-secondary">Add a Course</button>
          </div>
        ) : (
          filteredCourses.map(course => (
            <div key={course.id} className="glass-card p-5 group flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{course.title}</h3>
                  <span className={`badge ${course.priority === 'high' ? 'badge-high' : course.priority === 'medium' ? 'badge-medium' : 'badge-low'}`}>{course.priority}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/70">{course.platform}</span>
                </div>
                
                {course.status === 'in_progress' && (
                  <div className="mt-4 max-w-md">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{course.progress_percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${course.progress_percent}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 items-end">
                {course.status === 'queued' && (
                  <button className="btn-primary text-xs py-1.5"><PlayCircle className="w-3.5 h-3.5" /> Start Now</button>
                )}
                {course.status === 'in_progress' && (
                  <button className="btn-primary text-xs py-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete</button>
                )}
                {course.status === 'completed' && (
                  <button className="btn-secondary text-xs py-1.5"><Award className="w-3.5 h-3.5" /> View Notes</button>
                )}
                <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => openEdit(course)} className="text-xs text-muted-foreground hover:text-white">Edit</button>
                   <button onClick={() => handleDelete(course.id)} className="text-xs text-rose-500/70 hover:text-rose-400">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </motion.div>
      
      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Course' : 'Add Course'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Title</label>
                <input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Next.js Masterclass" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Platform</label>
                  <input className="input-field" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} placeholder="e.g. Udemy" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Priority</label>
                  <select className="input-field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Course Link</label>
                <input className="input-field" value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}>
                  <option value="queued">Up Next (Queued)</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="pt-3 flex gap-2">
                <button className="btn-secondary flex-1 justify-center" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn-primary flex-1 justify-center" onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
