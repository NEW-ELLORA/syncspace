// Mobile Mock of the Electron IPC API
// This reads and writes to LocalStorage, which is populated by the Sync Engine.

const getTable = (tableName: string) => {
  const data = localStorage.getItem('syncspace_db');
  if (!data) return [];
  try {
    const db = JSON.parse(data);
    if (!db[tableName]) return [];
    
    // SQLite payload is { columns: [], values: [[]] }
    const table = db[tableName];
    if (!table.columns || !table.values) return [];
    
    return table.values.map((row: any[]) => {
      const obj: any = {};
      table.columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  } catch {
    return [];
  }
};

const writeTable = (tableName: string, dataObj: any, isDelete = false) => {
  // To handle offline writes, we store mutations in an outbox
  const outboxStr = localStorage.getItem('syncspace_outbox');
  const outbox = outboxStr ? JSON.parse(outboxStr) : [];
  
  dataObj.updated_at = new Date().toISOString();
  if (isDelete) dataObj.deleted_at = dataObj.updated_at;
  
  outbox.push({ table: tableName, data: dataObj, isDelete });
  localStorage.setItem('syncspace_outbox', JSON.stringify(outbox));
  
  // Optimistic update of local cache
  const dbStr = localStorage.getItem('syncspace_db');
  if (dbStr) {
    try {
      const db = JSON.parse(dbStr);
      if (db[tableName]) {
         // This is a naive update for the mock.
         // In reality we should rebuild the columns/values array, but we'll reload instead.
      }
    } catch {}
  }
};

// We attach a mock API to the window object so the React components (copied from desktop) work seamlessly.
(window as any).api = {
  getReminders: async () => getTable('reminders').filter((r: any) => !r.deleted_at).sort((a: any, b: any) => new Date(a.due_datetime).getTime() - new Date(b.due_datetime).getTime()),
  createReminder: async (d: any) => { writeTable('reminders', { id: Date.now().toString(), ...d }); return { id: 'ok' }; },
  updateReminder: async (d: any) => { writeTable('reminders', d); return { success: true }; },
  deleteReminder: async (id: string) => { writeTable('reminders', { id }, true); return { success: true }; },
  toggleReminder: async (id: string) => { writeTable('reminders', { id, is_completed: true }); return { success: true }; },
  
  getEvents: async () => getTable('events').filter((r: any) => !r.deleted_at),
  createEvent: async (d: any) => { writeTable('events', { id: Date.now().toString(), ...d }); return { id: 'ok' }; },
  
  getTransactions: async () => getTable('transactions').filter((r: any) => !r.deleted_at),
  createTransaction: async (d: any) => { writeTable('transactions', { id: Date.now().toString(), ...d }); return { id: 'ok' }; },
  
  getBudgets: async () => getTable('budgets').filter((r: any) => !r.deleted_at),
  getBudgetConfig: async () => getTable('budget_config'),
  
  getShoppingList: async () => getTable('shopping_list').filter((r: any) => !r.deleted_at),
  createShoppingItem: async (d: any) => { writeTable('shopping_list', { id: Date.now().toString(), ...d }); return { id: 'ok' }; },
  
  getProjects: async () => getTable('projects').filter((r: any) => !r.deleted_at),
  
  getCourses: async () => getTable('courses').filter((r: any) => !r.deleted_at),
  
  getDbPath: async () => "Mobile LocalStorage",
  
  search: async (q: string) => ({ reminders: [], events: [], transactions: [], notes: [], projects: [] }),
};
