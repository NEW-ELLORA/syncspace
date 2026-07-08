import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, FileText, Search, Tag, Pencil, Hash, Clock, AlignLeft } from 'lucide-react';
import type { Note } from '../types/electron.d.ts';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const NOTE_COLORS = [
  'from-indigo-500/10 to-purple-500/5',
  'from-blue-500/10 to-cyan-500/5',
  'from-emerald-500/10 to-teal-500/5',
  'from-amber-500/10 to-orange-500/5',
  'from-rose-500/10 to-pink-500/5',
  'from-violet-500/10 to-fuchsia-500/5',
];

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', tags: '' });

  const load = async () => {
    try { setNotes(await window.api.getNotes()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    await window.api.createNote(form);
    setForm({ title: '', content: '', tags: '' });
    setShowModal(false);
    load();
  };

  const handleUpdate = async () => {
    if (!editingNote || !form.title.trim()) return;
    await window.api.updateNote({ ...editingNote, ...form });
    setEditingNote(null);
    setForm({ title: '', content: '', tags: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    await window.api.deleteNote(id);
    load();
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setForm({ title: note.title, content: note.content || '', tags: note.tags || '' });
  };

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      if (note.tags) {
        note.tags.split(',').forEach(t => {
          const trimmed = t.trim();
          if (trimmed) tagSet.add(trimmed);
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  const filtered = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (n.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? (n.tags || '').split(',').map(t => t.trim()).includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const wordCount = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;
  const charCount = form.content.length;

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="w-56 border-r border-border p-4 overflow-y-auto hidden md:block bg-background/50"
      >
        <div className="mb-6">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Tags & Folders</h2>
          <div className="space-y-1">
            <button 
              onClick={() => setSelectedTag(null)} 
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${!selectedTag ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
            >
              <Hash className="w-4 h-4" /> All Notes
            </button>
            {tags.map(tag => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedTag === tag ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
              >
                <Tag className="w-4 h-4" /> {tag}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Area */}
      <motion.div className="flex-1 p-6 overflow-y-auto" variants={container} initial="hidden" animate="show">
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length} notes {selectedTag && `in "${selectedTag}"`}</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setForm({ title: '', content: '', tags: '' }); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Note
          </motion.button>
        </motion.div>

        {/* Search */}
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input className="input-field !pl-10" placeholder="Search notes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </motion.div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((note, i) => (
              <motion.div key={note.id}
                variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
                initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.9 }} layout
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => openEdit(note)}
                className={`glass-card glass-card-hover p-5 cursor-pointer bg-gradient-to-br ${NOTE_COLORS[i % NOTE_COLORS.length]} group relative flex flex-col h-48`}
              >
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); openEdit(note); }}
                    className="p-1.5 rounded-md hover:bg-black/20 text-muted-foreground hover:text-white transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                    className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
                
                <h3 className="text-sm font-semibold mb-2 pr-12 truncate">{note.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-4 mb-3 whitespace-pre-wrap flex-1">{note.content || 'Empty note'}</p>
                
                <div className="mt-auto">
                  {note.tags && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.tags.split(',').map((tag, j) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary/70 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {note.updated_at ? new Date(note.updated_at).toLocaleDateString() : ''}</span>
                    <span className="flex items-center gap-1"><AlignLeft className="w-3 h-3" /> {note.content ? note.content.trim().split(/\s+/).length : 0} w</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && !searchQuery && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 text-center max-w-lg mx-auto mt-10">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 glow-purple">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">Your thoughts, organized</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
              Create rich notes, tag them for easy discovery, and keep your ideas securely stored in your workspace.
            </p>
            <button onClick={() => { setForm({ title: '', content: '', tags: '' }); setShowModal(true); }} className="btn-primary shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5 mr-1" /> Create Your First Note
            </button>
          </motion.div>
        )}

        {filtered.length === 0 && searchQuery && (
          <div className="text-center py-12 glass-card mt-6 max-w-md mx-auto">
            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium">No results found</h3>
            <p className="text-sm text-muted-foreground mt-1">We couldn't find any notes matching "{searchQuery}"</p>
          </div>
        )}
      </motion.div>

      {/* Modal logic */}
      <AnimatePresence>
        {(showModal || editingNote) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => { setShowModal(false); setEditingNote(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-content max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingNote ? 'Edit Note' : 'New Note'}</h2>
                <button onClick={() => { setShowModal(false); setEditingNote(null); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title *</label>
                  <input className="input-field text-lg font-medium" placeholder="Note title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Content</label>
                  <textarea className="input-field min-h-[200px]" placeholder="Write your note..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-2 px-1">
                    <span className="flex items-center gap-1"><AlignLeft className="w-3.5 h-3.5"/> {wordCount} words</span>
                    <span>{charCount} characters</span>
                    {editingNote?.updated_at && <span className="ml-auto flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Edited {new Date(editingNote.updated_at).toLocaleString()}</span>}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tags (comma separated)</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input className="input-field !pl-9" placeholder="e.g. work, ideas, urgent" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-border mt-6">
                  <button onClick={() => { setShowModal(false); setEditingNote(null); }} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={editingNote ? handleUpdate : handleCreate} className="btn-primary flex-1">{editingNote ? 'Update Note' : 'Save Note'}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
