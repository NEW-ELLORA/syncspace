import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, FileText, Search, Tag, Pencil, Hash, Clock, AlignLeft, StickyNote, Sparkles } from 'lucide-react';
import type { Note } from '../types/electron.d.ts';

/* ── animation presets ─────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};
const cardItem = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

/* ── curated color palette for note cards ──────────────── */
const NOTE_COLORS = [
  { gradient: 'from-indigo-500/10 to-purple-500/5', accent: 'rgba(99,102,241,0.35)', glow: 'rgba(99,102,241,0.08)' },
  { gradient: 'from-blue-500/10 to-cyan-500/5',     accent: 'rgba(59,130,246,0.35)', glow: 'rgba(59,130,246,0.08)' },
  { gradient: 'from-emerald-500/10 to-teal-500/5',  accent: 'rgba(16,185,129,0.35)', glow: 'rgba(16,185,129,0.08)' },
  { gradient: 'from-amber-500/10 to-orange-500/5',  accent: 'rgba(245,158,11,0.35)', glow: 'rgba(245,158,11,0.08)' },
  { gradient: 'from-rose-500/10 to-pink-500/5',     accent: 'rgba(244,63,94,0.35)',  glow: 'rgba(244,63,94,0.08)' },
  { gradient: 'from-violet-500/10 to-fuchsia-500/5', accent: 'rgba(139,92,246,0.35)', glow: 'rgba(139,92,246,0.08)' },
];

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', tags: '' });

  /* ── data helpers ──────────────────────────────────────── */
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

  /* ── derived data ──────────────────────────────────────── */
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

  /* ── loading state ─────────────────────────────────────── */
  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="flex h-full w-full">
      {/* ═══ SIDEBAR ═══════════════════════════════════════ */}
      <motion.aside
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="w-60 border-r border-border/60 overflow-y-auto hidden md:flex flex-col bg-gradient-to-b from-[#0c1120]/80 to-[#050a12]/60 backdrop-blur-xl"
      >
        {/* sidebar header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <StickyNote className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tags</span>
          </div>
        </div>

        {/* tag list */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5">
          <button
            onClick={() => setSelectedTag(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
              !selectedTag
                ? 'bg-primary/10 text-primary font-semibold shadow-[inset_0_0_0_1px_rgba(99,102,241,0.15)]'
                : 'hover:bg-white/[0.03] text-muted-foreground hover:text-foreground'
            }`}
          >
            <Hash className="w-4 h-4 shrink-0" />
            <span className="truncate">All Notes</span>
            <span className="ml-auto text-[10px] tabular-nums opacity-60">{notes.length}</span>
          </button>

          {tags.map(tag => {
            const count = notes.filter(n => (n.tags || '').split(',').map(t => t.trim()).includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                  selectedTag === tag
                    ? 'bg-primary/10 text-primary font-semibold shadow-[inset_0_0_0_1px_rgba(99,102,241,0.15)]'
                    : 'hover:bg-white/[0.03] text-muted-foreground hover:text-foreground'
                }`}
              >
                <Tag className="w-4 h-4 shrink-0" />
                <span className="truncate">{tag}</span>
                <span className="ml-auto text-[10px] tabular-nums opacity-60">{count}</span>
              </button>
            );
          })}
        </nav>
      </motion.aside>

      {/* ═══ MAIN AREA ═════════════════════════════════════ */}
      <motion.div className="flex-1 p-6 overflow-y-auto" variants={container} initial="hidden" animate="show">
        {/* header row */}
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">Notes</h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              {filtered.length} note{filtered.length !== 1 ? 's' : ''}{selectedTag && <> in <span className="text-primary/80 font-medium">"{selectedTag}"</span></>}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setForm({ title: '', content: '', tags: '' }); setShowModal(true); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> New Note
          </motion.button>
        </motion.div>

        {/* search bar */}
        <motion.div variants={fadeUp} className="mb-7 max-w-md">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary/70" />
            <input
              className="input-field !pl-10"
              placeholder="Search notes…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* ── notes grid ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((note, i) => {
              const palette = NOTE_COLORS[i % NOTE_COLORS.length];
              return (
                <motion.div
                  key={note.id}
                  variants={cardItem}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  layout
                  whileHover={{
                    y: -5,
                    transition: { type: 'spring', stiffness: 400, damping: 20 },
                  }}
                  onClick={() => openEdit(note)}
                  className={`relative group cursor-pointer rounded-2xl bg-gradient-to-br ${palette.gradient} flex flex-col h-52`}
                  style={{
                    background: 'rgba(12, 17, 32, 0.65)',
                    backdropFilter: 'blur(20px) saturate(150%)',
                    border: '1px solid rgba(148, 163, 184, 0.06)',
                  }}
                >
                  {/* gradient border glow on hover */}
                  <div
                    className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${palette.accent}, transparent 60%)`,
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                      WebkitMaskComposite: 'xor',
                      padding: '1px',
                      borderRadius: '16px',
                    }}
                  />
                  {/* subtle glow shadow on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: `0 8px 40px ${palette.glow}, 0 0 0 1px ${palette.glow}` }}
                  />

                  <div className="relative p-5 flex flex-col h-full">
                    {/* action buttons */}
                    <div className="absolute top-3 right-3 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); openEdit(note); }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>

                    {/* title */}
                    <h3 className="text-[15px] font-semibold leading-snug mb-2 pr-14 truncate text-foreground/90 group-hover:text-foreground transition-colors">
                      {note.title}
                    </h3>

                    {/* content preview */}
                    <p className="text-xs text-muted-foreground/80 line-clamp-4 mb-3 whitespace-pre-wrap flex-1 leading-relaxed">
                      {note.content || 'Empty note'}
                    </p>

                    {/* footer */}
                    <div className="mt-auto space-y-2">
                      {note.tags && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.split(',').map((tag, j) => (
                            <span
                              key={j}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary/70 flex items-center gap-1 backdrop-blur-sm"
                            >
                              <Tag className="w-2.5 h-2.5" />{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {note.updated_at ? new Date(note.updated_at).toLocaleDateString() : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlignLeft className="w-3 h-3" />
                          {note.content ? note.content.trim().split(/\s+/).length : 0}w
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ── empty state: no notes yet ────────────────── */}
        {filtered.length === 0 && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.15 }}
            className="glass-card p-14 text-center max-w-lg mx-auto mt-12"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 glow-purple">
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
                <Sparkles className="w-9 h-9 text-primary" />
              </motion.div>
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">Your thoughts, organized</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
              Create rich notes, tag them for easy discovery, and keep your ideas securely stored in your workspace.
            </p>
            <button
              onClick={() => { setForm({ title: '', content: '', tags: '' }); setShowModal(true); }}
              className="btn-primary shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5 mr-1" /> Create Your First Note
            </button>
          </motion.div>
        )}

        {/* ── empty state: no search results ──────────── */}
        {filtered.length === 0 && searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-14 glass-card mt-8 max-w-md mx-auto"
          >
            <Search className="w-9 h-9 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No results found</h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              We couldn't find any notes matching "<span className="text-primary/70">{searchQuery}</span>"
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* ═══ MODAL ═════════════════════════════════════════ */}
      <AnimatePresence>
        {(showModal || editingNote) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="modal-overlay"
            onClick={() => { setShowModal(false); setEditingNote(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="modal-content max-w-2xl w-full"
              onClick={e => e.stopPropagation()}
            >
              {/* modal header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    {editingNote
                      ? <Pencil className="w-4 h-4 text-primary" />
                      : <Plus className="w-4 h-4 text-primary" />
                    }
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">{editingNote ? 'Edit Note' : 'New Note'}</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setShowModal(false); setEditingNote(null); }}
                  className="p-2 rounded-xl hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* form fields */}
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Title *</label>
                  <input
                    className="input-field text-lg font-medium"
                    placeholder="Note title"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Content</label>
                  <textarea
                    className="input-field min-h-[200px]"
                    placeholder="Write your note…"
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                  />
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground/70 mt-2.5 px-1">
                    <span className="flex items-center gap-1"><AlignLeft className="w-3.5 h-3.5" /> {wordCount} words</span>
                    <span>{charCount} characters</span>
                    {editingNote?.updated_at && (
                      <span className="ml-auto flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Edited {new Date(editingNote.updated_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Tags (comma separated)</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      className="input-field !pl-10"
                      placeholder="e.g. work, ideas, urgent"
                      value={form.tags}
                      onChange={e => setForm({ ...form, tags: e.target.value })}
                    />
                  </div>
                </div>

                {/* action buttons */}
                <div className="flex gap-3 pt-5 border-t border-border/60 mt-6">
                  <button onClick={() => { setShowModal(false); setEditingNote(null); }} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button onClick={editingNote ? handleUpdate : handleCreate} className="btn-primary flex-1">
                    {editingNote ? 'Update Note' : 'Save Note'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
