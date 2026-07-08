const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { initDb, getDb, saveDb } = require('./database.cjs');
const { startSyncServer, getLocalIp, getSecretKey } = require('./server.cjs');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit(); }

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 650,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#060a14', symbolColor: '#94a3b8', height: 36 },
    backgroundColor: '#060a14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substring(2, 9); }
function now() { return new Date().toISOString(); }

// ── Reminder Notification Checker ──
let notificationInterval = null;
let notifiedBudgets = {};
function startReminderChecker() {
  notificationInterval = setInterval(() => {
    try {
      const db = getDb();
      const nowTime = new Date();
      const fiveMinLater = new Date(nowTime.getTime() + 5 * 60000).toISOString();
      const result = db.exec(
        "SELECT * FROM reminders WHERE is_completed = 0 AND deleted_at IS NULL AND due_datetime <= ? AND due_datetime >= ?",
        [fiveMinLater, nowTime.toISOString()]
      );
      if (result.length > 0 && result[0].values) {
        const cols = result[0].columns;
        result[0].values.forEach(row => {
          const r = {};
          cols.forEach((c, i) => { r[c] = row[i]; });
          if (Notification.isSupported()) {
            new Notification({
              title: '⏰ Reminder Due',
              body: r.title + (r.description ? '\n' + r.description : ''),
              icon: null,
            }).show();
          }
        });
      }

      // Check budgets
      const currentMonthStr = nowTime.toISOString().substring(0, 7);
      const currentMonthStart = currentMonthStr + "-01T00:00:00.000Z";
      const budgets = db.exec("SELECT * FROM budgets WHERE deleted_at IS NULL");
      if (budgets.length > 0 && budgets[0].values) {
        const bCols = budgets[0].columns;
        const bRows = budgets[0].values.map(row => { const r = {}; bCols.forEach((c, i) => r[c] = row[i]); return r; });
        const tx = db.exec("SELECT category, SUM(amount) as total FROM transactions WHERE deleted_at IS NULL AND date >= ? GROUP BY category", [currentMonthStart]);
        const txTotals = {};
        if (tx.length > 0 && tx[0].values) {
           tx[0].values.forEach(row => { txTotals[row[0]] = row[1]; });
        }
        bRows.forEach(b => {
          const spent = txTotals[b.category] || 0;
          const limit = b.monthly_limit;
          if (limit > 0) {
            const ratio = spent / limit;
            let level = 0;
            if (ratio >= 1) level = 100;
            else if (ratio >= 0.8) level = 80;
            
            if (level > 0) {
              const key = `${currentMonthStr}-${b.category}`;
              if (notifiedBudgets[key] !== level && (notifiedBudgets[key] || 0) < level) {
                if (Notification.isSupported()) {
                  new Notification({ title: level === 100 ? 'Budget Exceeded' : 'Budget Warning', body: `You have spent ${Math.round(ratio * 100)}% of your budget for ${b.category}.` }).show();
                }
                notifiedBudgets[key] = level;
              }
            }
          }
        });
      }
    } catch (e) { /* silent */ }
  }, 60000); // Check every minute
}

function registerIpcHandlers() {
  // ── Reminders ──
  ipcMain.handle('db:reminders:getAll', () => {
    return getDb().exec('SELECT * FROM reminders WHERE deleted_at IS NULL ORDER BY due_datetime ASC');
  });
  ipcMain.handle('db:reminders:create', (_e, data) => {
    const id = generateId(), ts = now();
    getDb().run('INSERT INTO reminders (id,title,description,due_datetime,recurrence_rule,priority,category,is_completed,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
      [id, data.title, data.description||'', data.due_datetime||'', data.recurrence_rule||'', data.priority||'medium', data.category||'Personal', 0, ts, ts]);
    saveDb(); return { id };
  });
  ipcMain.handle('db:reminders:update', (_e, data) => {
    const ts = now();
    getDb().run('UPDATE reminders SET title=?,description=?,due_datetime=?,recurrence_rule=?,priority=?,category=?,is_completed=?,updated_at=? WHERE id=?',
      [data.title, data.description, data.due_datetime, data.recurrence_rule, data.priority, data.category, data.is_completed?1:0, ts, data.id]);
    saveDb(); return { success: true };
  });
  ipcMain.handle('db:reminders:delete', (_e, id) => {
    const ts = now(); getDb().run('UPDATE reminders SET deleted_at=?,updated_at=? WHERE id=?', [ts, ts, id]); saveDb(); return { success: true };
  });
  ipcMain.handle('db:reminders:toggle', (_e, id) => {
    const ts = now(); getDb().run('UPDATE reminders SET is_completed=CASE WHEN is_completed=1 THEN 0 ELSE 1 END, updated_at=? WHERE id=?', [ts, id]); saveDb(); return { success: true };
  });

  // ── Events ──
  ipcMain.handle('db:events:getAll', () => getDb().exec('SELECT * FROM events WHERE deleted_at IS NULL ORDER BY start_datetime ASC'));
  ipcMain.handle('db:events:create', (_e, data) => {
    const id = generateId(), ts = now();
    getDb().run('INSERT INTO events (id,title,description,start_datetime,end_datetime,location,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
      [id, data.title, data.description||'', data.start_datetime, data.end_datetime, data.location||'', ts, ts]);
    saveDb(); return { id };
  });
  ipcMain.handle('db:events:update', (_e, data) => {
    const ts = now();
    getDb().run('UPDATE events SET title=?,description=?,start_datetime=?,end_datetime=?,location=?,updated_at=? WHERE id=?',
      [data.title, data.description, data.start_datetime, data.end_datetime, data.location, ts, data.id]);
    saveDb(); return { success: true };
  });
  ipcMain.handle('db:events:delete', (_e, id) => {
    const ts = now(); getDb().run('UPDATE events SET deleted_at=?,updated_at=? WHERE id=?', [ts, ts, id]); saveDb(); return { success: true };
  });

  // ── Transactions ──
  ipcMain.handle('db:transactions:getAll', () => getDb().exec('SELECT * FROM transactions WHERE deleted_at IS NULL ORDER BY date DESC'));
  ipcMain.handle('db:transactions:create', (_e, data) => {
    const id = generateId(), ts = now();
    getDb().run('INSERT INTO transactions (id,type,amount,category,note,date,is_recurring,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',
      [id, data.type, data.amount, data.category, data.note||'', data.date, data.is_recurring?1:0, ts, ts]);
    saveDb(); return { id };
  });
  ipcMain.handle('db:transactions:update', (_e, data) => {
    const ts = now();
    getDb().run('UPDATE transactions SET type=?,amount=?,category=?,note=?,date=?,is_recurring=?,updated_at=? WHERE id=?',
      [data.type, data.amount, data.category, data.note, data.date, data.is_recurring?1:0, ts, data.id]);
    saveDb(); return { success: true };
  });
  ipcMain.handle('db:transactions:delete', (_e, id) => {
    const ts = now(); getDb().run('UPDATE transactions SET deleted_at=?,updated_at=? WHERE id=?', [ts, ts, id]); saveDb(); return { success: true };
  });

  // ── Budgets ──
  ipcMain.handle('db:budgets:getAll', () => getDb().exec('SELECT * FROM budgets WHERE deleted_at IS NULL'));
  ipcMain.handle('db:budgets:upsert', (_e, data) => {
    const db = getDb(), ts = now();
    const existing = db.exec("SELECT id FROM budgets WHERE category=? AND deleted_at IS NULL", [data.category]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      db.run('UPDATE budgets SET monthly_limit=?,updated_at=? WHERE category=? AND deleted_at IS NULL', [data.monthly_limit, ts, data.category]);
    } else {
      db.run('INSERT INTO budgets (id,category,monthly_limit,created_at,updated_at) VALUES(?,?,?,?,?)', [generateId(), data.category, data.monthly_limit, ts, ts]);
    }
    saveDb(); return { success: true };
  });

  // ── Budget Config ──
  ipcMain.handle('db:budgetConfig:get', () => {
    const result = getDb().exec('SELECT * FROM budget_config LIMIT 1');
    return result;
  });
  ipcMain.handle('db:budgetConfig:update', (_e, data) => {
    const db = getDb(), ts = now();
    const existing = db.exec('SELECT id FROM budget_config LIMIT 1');
    if (existing.length > 0 && existing[0].values.length > 0) {
      db.run('UPDATE budget_config SET starting_balance=?,monthly_savings_goal=?,updated_at=?', [data.starting_balance, data.monthly_savings_goal, ts]);
    } else {
      db.run('INSERT INTO budget_config (id,starting_balance,monthly_savings_goal,updated_at) VALUES(?,?,?,?)', [generateId(), data.starting_balance, data.monthly_savings_goal, ts]);
    }
    saveDb(); return { success: true };
  });

  // ── Shopping List ──
  ipcMain.handle('db:shopping:getAll', () => getDb().exec('SELECT * FROM shopping_list WHERE deleted_at IS NULL ORDER BY is_purchased ASC, created_at DESC'));
  ipcMain.handle('db:shopping:create', (_e, data) => {
    const id = generateId(), ts = now();
    getDb().run('INSERT INTO shopping_list (id,item,estimated_cost,category,is_purchased,occasion,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
      [id, data.item, data.estimated_cost||0, data.category||'General', 0, data.occasion||'', ts, ts]);
    saveDb(); return { id };
  });
  ipcMain.handle('db:shopping:update', (_e, data) => {
    const ts = now();
    getDb().run('UPDATE shopping_list SET item=?,estimated_cost=?,category=?,occasion=?,updated_at=? WHERE id=?',
      [data.item, data.estimated_cost, data.category, data.occasion, ts, data.id]);
    saveDb(); return { success: true };
  });
  ipcMain.handle('db:shopping:toggle', (_e, id) => {
    const ts = now(); getDb().run('UPDATE shopping_list SET is_purchased=CASE WHEN is_purchased=1 THEN 0 ELSE 1 END, updated_at=? WHERE id=?', [ts, id]); saveDb(); return { success: true };
  });
  ipcMain.handle('db:shopping:delete', (_e, id) => {
    const ts = now(); getDb().run('UPDATE shopping_list SET deleted_at=?,updated_at=? WHERE id=?', [ts, ts, id]); saveDb(); return { success: true };
  });

  // ── Notes ──
  ipcMain.handle('db:notes:getAll', () => getDb().exec('SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY updated_at DESC'));
  ipcMain.handle('db:notes:create', (_e, data) => {
    const id = generateId(), ts = now();
    getDb().run('INSERT INTO notes (id,title,content,linked_type,linked_id,tags,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
      [id, data.title, data.content||'', data.linked_type||'', data.linked_id||'', data.tags||'', ts, ts]);
    saveDb(); return { id };
  });
  ipcMain.handle('db:notes:update', (_e, data) => {
    const ts = now();
    getDb().run('UPDATE notes SET title=?,content=?,linked_type=?,linked_id=?,tags=?,updated_at=? WHERE id=?',
      [data.title, data.content, data.linked_type||'', data.linked_id||'', data.tags||'', ts, data.id]);
    saveDb(); return { success: true };
  });
  ipcMain.handle('db:notes:delete', (_e, id) => {
    const ts = now(); getDb().run('UPDATE notes SET deleted_at=?,updated_at=? WHERE id=?', [ts, ts, id]); saveDb(); return { success: true };
  });

  // ── Projects ──
  ipcMain.handle('db:projects:getAll', () => getDb().exec('SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC'));
  ipcMain.handle('db:projects:create', (_e, data) => {
    const id = generateId(), ts = now();
    getDb().run('INSERT INTO projects (id,title,description,status,priority,links,tags,deadline,checklists,time_in_stage_since,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, data.title, data.description||'', data.status||'idea', data.priority||'medium', data.links||'', data.tags||'', data.deadline||'', data.checklists||'', ts, ts, ts]);
    saveDb(); return { id };
  });
  ipcMain.handle('db:projects:update', (_e, data) => {
    const ts = now();
    getDb().run('UPDATE projects SET title=?,description=?,status=?,priority=?,links=?,tags=?,deadline=?,checklists=?,time_in_stage_since=?,updated_at=? WHERE id=?',
      [data.title, data.description, data.status, data.priority, data.links, data.tags, data.deadline, data.checklists||'', data.time_in_stage_since||ts, ts, data.id]);
    saveDb(); return { success: true };
  });
  ipcMain.handle('db:projects:delete', (_e, id) => {
    const ts = now(); getDb().run('UPDATE projects SET deleted_at=?,updated_at=? WHERE id=?', [ts, ts, id]); saveDb(); return { success: true };
  });

  // ── Courses ──
  ipcMain.handle('db:courses:getAll', () => getDb().exec('SELECT * FROM courses WHERE deleted_at IS NULL ORDER BY created_at DESC'));
  ipcMain.handle('db:courses:create', (_e, data) => {
    const id = generateId(), ts = now();
    getDb().run('INSERT INTO courses (id,title,platform,status,priority,progress_percent,estimated_hours,link,why_tag,started_at,completed_at,certificate_path,linked_project_id,linked_note_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, data.title, data.platform||'', data.status||'planned', data.priority||'medium', data.progress_percent||0, data.estimated_hours||0, data.link||'', data.why_tag||'', data.started_at||'', data.completed_at||'', data.certificate_path||'', data.linked_project_id||'', data.linked_note_id||'', ts, ts]);
    saveDb(); return { id };
  });
  ipcMain.handle('db:courses:update', (_e, data) => {
    const ts = now();
    getDb().run('UPDATE courses SET title=?,platform=?,status=?,priority=?,progress_percent=?,estimated_hours=?,link=?,why_tag=?,started_at=?,completed_at=?,certificate_path=?,linked_project_id=?,linked_note_id=?,updated_at=? WHERE id=?',
      [data.title, data.platform, data.status, data.priority, data.progress_percent, data.estimated_hours, data.link, data.why_tag, data.started_at, data.completed_at, data.certificate_path, data.linked_project_id, data.linked_note_id, ts, data.id]);
    saveDb(); return { success: true };
  });
  ipcMain.handle('db:courses:delete', (_e, id) => {
    const ts = now(); getDb().run('UPDATE courses SET deleted_at=?,updated_at=? WHERE id=?', [ts, ts, id]); saveDb(); return { success: true };
  });

  // ── Study Log ──
  ipcMain.handle('db:studylog:getAll', () => getDb().exec('SELECT * FROM study_log WHERE deleted_at IS NULL ORDER BY date DESC'));
  ipcMain.handle('db:studylog:create', (_e, data) => {
    const id = generateId(), ts = now();
    getDb().run('INSERT INTO study_log (id,course_id,date,minutes_studied,created_at) VALUES(?,?,?,?,?)',
      [id, data.course_id, data.date, data.minutes_studied||0, ts]);
    saveDb(); return { id };
  });
  ipcMain.handle('db:studylog:update', (_e, data) => {
    getDb().run('UPDATE study_log SET course_id=?,date=?,minutes_studied=? WHERE id=?',
      [data.course_id, data.date, data.minutes_studied, data.id]);
    saveDb(); return { success: true };
  });
  ipcMain.handle('db:studylog:delete', (_e, id) => {
    const ts = now(); getDb().run('UPDATE study_log SET deleted_at=? WHERE id=?', [ts, id]); saveDb(); return { success: true };
  });

  // ── Search ──
  ipcMain.handle('db:search', (_e, query) => {
    const db = getDb(), q = `%${query}%`;
    return {
      reminders: db.exec("SELECT *, 'reminder' as _type FROM reminders WHERE deleted_at IS NULL AND (title LIKE ? OR description LIKE ?)", [q, q]),
      events: db.exec("SELECT *, 'event' as _type FROM events WHERE deleted_at IS NULL AND (title LIKE ? OR description LIKE ?)", [q, q]),
      notes: db.exec("SELECT *, 'note' as _type FROM notes WHERE deleted_at IS NULL AND (title LIKE ? OR content LIKE ?)", [q, q]),
      transactions: db.exec("SELECT *, 'transaction' as _type FROM transactions WHERE deleted_at IS NULL AND (category LIKE ? OR note LIKE ?)", [q, q]),
      projects: db.exec("SELECT *, 'project' as _type FROM projects WHERE deleted_at IS NULL AND (title LIKE ? OR description LIKE ?)", [q, q]),
    };
  });

  ipcMain.handle('app:getDbPath', () => path.join(app.getPath('userData'), 'productivity_data.db'));
  ipcMain.handle('db:export', () => {
    const db = getDb();
    const tables = ['reminders', 'events', 'transactions', 'budgets', 'notes', 'projects', 'shopping_list', 'budget_config'];
    const exportData = {};
    for (const t of tables) { exportData[t] = db.exec(`SELECT * FROM ${t} WHERE deleted_at IS NULL OR deleted_at IS NULL`); }
    return JSON.stringify(exportData, null, 2);
  });
  
  ipcMain.handle('app:getSyncConfig', () => {
    return {
      ip: getLocalIp(),
      port: 14205,
      secret: getSecretKey(app.getPath('userData'))
    };
  });

  ipcMain.handle('db:export:csv:budget', () => {
    const db = getDb();
    const result = db.exec('SELECT * FROM transactions WHERE deleted_at IS NULL ORDER BY date ASC');
    if (!result || result.length === 0 || !result[0].values) return "id,type,amount,category,note,date,is_recurring,created_at,updated_at\n";
    
    const cols = result[0].columns;
    let csv = cols.join(',') + '\n';
    result[0].values.forEach(row => {
      const csvRow = row.map(v => {
        if (v === null || v === undefined) return '';
        let str = String(v);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      });
      csv += csvRow.join(',') + '\n';
    });
    return csv;
  });
}

app.whenReady().then(async () => {
  try {
    await initDb();
    
    // Auto-backup
    try {
      const userDataDir = app.getPath('userData');
      const dbPath = path.join(userDataDir, 'productivity_data.db');
      const backupsDir = path.join(userDataDir, 'backups');
      if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);
      
      const today = new Date().toISOString().split('T')[0];
      const backupPath = path.join(backupsDir, `productivity_data_${today}.db`);
      if (fs.existsSync(dbPath) && !fs.existsSync(backupPath)) {
        fs.copyFileSync(dbPath, backupPath);
      }
      
      // Cleanup backups older than 7 days
      const files = fs.readdirSync(backupsDir);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      for (const file of files) {
        if (file.endsWith('.db')) {
          const filePath = path.join(backupsDir, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime < sevenDaysAgo) fs.unlinkSync(filePath);
        }
      }
    } catch (err) {
      console.error('Backup failed:', err);
    }

    getSecretKey(app.getPath('userData')); // Generate secret key if it doesn't exist
    startSyncServer(14205);
    registerIpcHandlers();
    createWindow();
    startReminderChecker();
  } catch (err) {
    console.error('Failed to initialize:', err);
    app.quit();
  }
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (notificationInterval) clearInterval(notificationInterval);
  if (process.platform !== 'darwin') app.quit();
});
