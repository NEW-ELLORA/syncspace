import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Lightbulb, Clock, Tag, Link as LinkIcon, Trash2, Edit2, Calendar } from 'lucide-react';
import type { Project } from '../types/electron.d.ts';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const STATUS_COLORS: Record<string, string> = { 
  idea: 'bg-purple-500/15 text-purple-400 border-purple-500/20', 
  'in-progress': 'bg-blue-500/15 text-blue-400 border-blue-500/20', 
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', 
  'on-hold': 'bg-amber-500/15 text-amber-400 border-amber-500/20' 
};

const STATUS_BG: Record<string, string> = {
  idea: 'bg-purple-500',
  'in-progress': 'bg-blue-500',
  completed: 'bg-emerald-500',
  'on-hold': 'bg-amber-500'
};

const getProgress = (status: string) => {
  switch (status) {
    case 'completed': return 100;
    case 'in-progress': return 60;
    case 'on-hold': return 30;
    case 'idea':
    default: return 0;
  }
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [form, setForm] = useState({ 
    title: '', description: '', status: 'idea', priority: 'medium', links: '', tags: '', deadline: '' 
  });
  const [isEditing, setIsEditing] = useState(false);

  const load = async () => {
    try { setProjects(await window.api.getProjects()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    
    if (isEditing && selectedProject) {
      await window.api.updateProject({ ...selectedProject, ...form });
    } else {
      await window.api.createProject(form);
    }
    
    setForm({ title: '', description: '', status: 'idea', priority: 'medium', links: '', tags: '', deadline: '' });
    setShowModal(false);
    setIsEditing(false);
    setSelectedProject(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await window.api.deleteProject(id);
    setSelectedProject(null);
    load();
  };

  const openCreate = () => {
    setForm({ title: '', description: '', status: 'idea', priority: 'medium', links: '', tags: '', deadline: '' });
    setIsEditing(false);
    setSelectedProject(null);
    setShowModal(true);
  };

  const openDetail = (p: Project) => {
    setSelectedProject(p);
  };
  
  const openEdit = () => {
    if (!selectedProject) return;
    setForm({
      title: selectedProject.title,
      description: selectedProject.description || '',
      status: selectedProject.status || 'idea',
      priority: selectedProject.priority || 'medium',
      links: selectedProject.links || '',
      tags: selectedProject.tags || '',
      deadline: selectedProject.deadline || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div className="p-6 h-full overflow-y-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Ideas</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} projects tracked.</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </motion.button>
      </motion.div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {projects.map((project) => (
              <motion.div key={project.id}
                variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
                initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.9 }} layout
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="glass-card glass-card-hover p-4 cursor-pointer flex flex-col group relative overflow-hidden h-[240px]"
                onClick={() => openDetail(project)}
              >
                <div className={`absolute top-0 left-0 w-full h-1 ${STATUS_BG[project.status] || STATUS_BG.idea} opacity-30`} />
                
                <div className="flex items-center justify-between mb-3 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold uppercase ${STATUS_COLORS[project.status] || STATUS_COLORS.idea}`}>
                    {project.status.replace('-', ' ')}
                  </span>
                  {project.deadline && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <h3 className="text-base font-semibold mb-2 line-clamp-2">{project.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1">{project.description || 'No description'}</p>
                
                {/* Time in stage indicator */}
                {(project as any).time_in_stage_since && (
                  <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    In {project.status} for {Math.floor((Date.now() - new Date((project as any).time_in_stage_since).getTime()) / (1000*60*60*24))} days
                  </p>
                )}
                
                <div className="mt-auto space-y-3">
                  {/* Tags */}
                  {project.tags && (
                    <div className="flex flex-wrap gap-1">
                      {project.tags.split(',').slice(0, 3).map((tag, j) => (
                        <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-muted-foreground border border-white/5">
                          {tag.trim()}
                        </span>
                      ))}
                      {project.tags.split(',').length > 3 && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-secondary/80 text-muted-foreground">+{project.tags.split(',').length - 3}</span>}
                    </div>
                  )}

                  {/* Checklist Subtasks */}
                  {((project as any).subtasks && (project as any).subtasks.length > 0) && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1 mb-1">
                      <div className="w-full bg-white/10 rounded-full h-1 flex-1">
                        <div className="bg-primary h-1 rounded-full" style={{ width: `${((project as any).subtasks.filter((s: any) => s.completed).length / (project as any).subtasks.length) * 100}%` }} />
                      </div>
                      <span>{(project as any).subtasks.filter((s: any) => s.completed).length}/{(project as any).subtasks.length} subtasks</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground">Progress</span>
                      <span className="text-[10px] font-medium">{getProgress(project.status)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${STATUS_BG[project.status] || STATUS_BG.idea}`} 
                        style={{ width: `${getProgress(project.status)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="glass-card p-12 text-center mt-4"
          >
            <Lightbulb className="w-12 h-12 text-purple-500/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start tracking your big ideas and side projects.</p>
            <button onClick={openCreate} className="btn-primary mx-auto"><Plus className="w-4 h-4" /> Create Project</button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProject && !showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedProject(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content !max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs px-2.5 py-1 rounded-md border font-semibold uppercase ${STATUS_COLORS[selectedProject.status] || STATUS_COLORS.idea}`}>{selectedProject.status.replace('-', ' ')}</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide bg-secondary/50 px-2 py-1 rounded">Priority: {selectedProject.priority}</span>
                  </div>
                  <h2 className="text-2xl font-bold">{selectedProject.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={openEdit} className="text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/5"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(selectedProject.id)} className="text-muted-foreground hover:text-danger p-2 rounded-lg hover:bg-danger/10"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => setSelectedProject(null)} className="text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/5 ml-2"><X className="w-5 h-5" /></button>
                </div>
              </div>
              
              <div className="space-y-6">
                {selectedProject.deadline && (
                  <div className="flex items-center gap-2 text-sm text-amber-400/90 font-medium bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <Calendar className="w-4 h-4" /> Deadline: {new Date(selectedProject.deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                )}
                
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedProject.description || 'No description provided.'}</p>
                </div>
                
                {selectedProject.links && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Links</h4>
                    <div className="space-y-2">
                      {selectedProject.links.split('\n').filter(l => l.trim()).map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 hover:underline bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-lg w-fit pr-4">
                          <LinkIcon className="w-3.5 h-3.5" /> <span className="truncate max-w-[400px]">{link}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedProject.tags && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tags.split(',').map((tag, j) => (
                        <span key={j} className="text-xs px-2.5 py-1 rounded-md bg-secondary border border-white/10 flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-muted-foreground" /> {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{isEditing ? 'Edit Project' : 'New Project'}</h2>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project Title *</label>
                  <input className="input-field" placeholder="Awesome idea name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                  <textarea className="input-field" rows={4} placeholder="What is this project about?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                    <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="idea">Idea</option>
                      <option value="in-progress">In Progress</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
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
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Deadline</label>
                  <input type="date" className="input-field" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Links (one per line)</label>
                  <textarea className="input-field" rows={3} placeholder="https://..." value={form.links} onChange={e => setForm({ ...form, links: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tags (comma separated)</label>
                  <input className="input-field" placeholder="design, frontend, ai" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleSave} className="btn-primary flex-1 justify-center">{isEditing ? 'Save Changes' : 'Create Project'}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
