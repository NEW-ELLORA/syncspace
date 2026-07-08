export interface Reminder { id: string; title: string; description: string; due_datetime: string; recurrence_rule: string; priority: string; category: string; is_completed: number; created_at: string; updated_at: string; }
export interface CalendarEvent { id: string; title: string; description: string; start_datetime: string; end_datetime: string; location: string; created_at: string; updated_at: string; }
export interface Transaction { id: string; type: string; amount: number; category: string; note: string; date: string; is_recurring: number; created_at: string; updated_at: string; }
export interface Budget { id: string; category: string; monthly_limit: number; created_at: string; updated_at: string; }
export interface BudgetConfig { id: string; starting_balance: number; monthly_savings_goal: number; updated_at: string; }
export interface ShoppingItem { id: string; item: string; estimated_cost: number; category: string; is_purchased: number; occasion: string; created_at: string; updated_at: string; }
export interface Note { id: string; title: string; content: string; linked_type: string; linked_id: string; tags: string; created_at: string; updated_at: string; }
export interface Project { id: string; title: string; description: string; status: string; priority: string; links: string; tags: string; deadline: string; created_at: string; updated_at: string; }
export interface SearchResults { reminders: Reminder[]; events: CalendarEvent[]; notes: Note[]; transactions: Transaction[]; projects: Project[]; }
export interface ElectronAPI {
  getReminders: () => Promise<Reminder[]>; createReminder: (d: Partial<Reminder>) => Promise<{id:string}>; updateReminder: (d: Partial<Reminder>) => Promise<{success:boolean}>; deleteReminder: (id: string) => Promise<{success:boolean}>; toggleReminder: (id: string) => Promise<{success:boolean}>;
  getEvents: () => Promise<CalendarEvent[]>; createEvent: (d: Partial<CalendarEvent>) => Promise<{id:string}>; updateEvent: (d: Partial<CalendarEvent>) => Promise<{success:boolean}>; deleteEvent: (id: string) => Promise<{success:boolean}>;
  getTransactions: () => Promise<Transaction[]>; createTransaction: (d: Partial<Transaction>) => Promise<{id:string}>; updateTransaction: (d: Partial<Transaction>) => Promise<{success:boolean}>; deleteTransaction: (id: string) => Promise<{success:boolean}>;
  getBudgets: () => Promise<Budget[]>; upsertBudget: (d: Partial<Budget>) => Promise<{success:boolean}>;
  getBudgetConfig: () => Promise<BudgetConfig[]>; updateBudgetConfig: (d: Partial<BudgetConfig>) => Promise<{success:boolean}>;
  getShoppingList: () => Promise<ShoppingItem[]>; createShoppingItem: (d: Partial<ShoppingItem>) => Promise<{id:string}>; updateShoppingItem: (d: Partial<ShoppingItem>) => Promise<{success:boolean}>; toggleShoppingItem: (id: string) => Promise<{success:boolean}>; deleteShoppingItem: (id: string) => Promise<{success:boolean}>;
  getNotes: () => Promise<Note[]>; createNote: (d: Partial<Note>) => Promise<{id:string}>; updateNote: (d: Partial<Note>) => Promise<{success:boolean}>; deleteNote: (id: string) => Promise<{success:boolean}>;
  getProjects: () => Promise<Project[]>; createProject: (d: Partial<Project>) => Promise<{id:string}>; updateProject: (d: Partial<Project>) => Promise<{success:boolean}>; deleteProject: (id: string) => Promise<{success:boolean}>;
  search: (q: string) => Promise<SearchResults>; getDbPath: () => Promise<string>;
  getSyncConfig?: () => Promise<{ ip: string, port: number, secret: string }>;
  exportData: () => Promise<string>;
  exportBudgetCsv: () => Promise<void>;
}
declare global { interface Window { api: ElectronAPI; } }
