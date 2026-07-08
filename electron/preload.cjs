const { contextBridge, ipcRenderer } = require('electron');

function sqlToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => { const o = {}; columns.forEach((c, i) => { o[c] = row[i]; }); return o; });
}

contextBridge.exposeInMainWorld('api', {
  // Reminders
  getReminders: async () => sqlToObjects(await ipcRenderer.invoke('db:reminders:getAll')),
  createReminder: (d) => ipcRenderer.invoke('db:reminders:create', d),
  updateReminder: (d) => ipcRenderer.invoke('db:reminders:update', d),
  deleteReminder: (id) => ipcRenderer.invoke('db:reminders:delete', id),
  toggleReminder: (id) => ipcRenderer.invoke('db:reminders:toggle', id),
  // Events
  getEvents: async () => sqlToObjects(await ipcRenderer.invoke('db:events:getAll')),
  createEvent: (d) => ipcRenderer.invoke('db:events:create', d),
  updateEvent: (d) => ipcRenderer.invoke('db:events:update', d),
  deleteEvent: (id) => ipcRenderer.invoke('db:events:delete', id),
  // Transactions
  getTransactions: async () => sqlToObjects(await ipcRenderer.invoke('db:transactions:getAll')),
  createTransaction: (d) => ipcRenderer.invoke('db:transactions:create', d),
  updateTransaction: (d) => ipcRenderer.invoke('db:transactions:update', d),
  deleteTransaction: (id) => ipcRenderer.invoke('db:transactions:delete', id),
  // Budgets
  getBudgets: async () => sqlToObjects(await ipcRenderer.invoke('db:budgets:getAll')),
  upsertBudget: (d) => ipcRenderer.invoke('db:budgets:upsert', d),
  // Budget Config
  getBudgetConfig: async () => sqlToObjects(await ipcRenderer.invoke('db:budgetConfig:get')),
  updateBudgetConfig: (d) => ipcRenderer.invoke('db:budgetConfig:update', d),
  // Shopping List
  getShoppingList: async () => sqlToObjects(await ipcRenderer.invoke('db:shopping:getAll')),
  createShoppingItem: (d) => ipcRenderer.invoke('db:shopping:create', d),
  updateShoppingItem: (d) => ipcRenderer.invoke('db:shopping:update', d),
  toggleShoppingItem: (id) => ipcRenderer.invoke('db:shopping:toggle', id),
  deleteShoppingItem: (id) => ipcRenderer.invoke('db:shopping:delete', id),
  // Notes
  getNotes: async () => sqlToObjects(await ipcRenderer.invoke('db:notes:getAll')),
  createNote: (d) => ipcRenderer.invoke('db:notes:create', d),
  updateNote: (d) => ipcRenderer.invoke('db:notes:update', d),
  deleteNote: (id) => ipcRenderer.invoke('db:notes:delete', id),
  // Projects
  getProjects: async () => sqlToObjects(await ipcRenderer.invoke('db:projects:getAll')),
  createProject: (d) => ipcRenderer.invoke('db:projects:create', d),
  updateProject: (d) => ipcRenderer.invoke('db:projects:update', d),
  deleteProject: (id) => ipcRenderer.invoke('db:projects:delete', id),
  // Search
  search: async (q) => {
    const r = await ipcRenderer.invoke('db:search', q);
    return { reminders: sqlToObjects(r.reminders), events: sqlToObjects(r.events), notes: sqlToObjects(r.notes), transactions: sqlToObjects(r.transactions), projects: sqlToObjects(r.projects) };
  },
  getDbPath: () => ipcRenderer.invoke('app:getDbPath'),
  getSyncConfig: () => ipcRenderer.invoke('app:getSyncConfig'),
  exportData: () => ipcRenderer.invoke('db:export'),
});
