# SyncSpace Productivity Suite

SyncSpace is a premium, beautifully designed dark-themed desktop application built for Windows. It acts as an all-in-one personal productivity suite, seamlessly integrating task management, financial tracking, calendar planning, project organization, and note-taking into one cohesive interface. 

Built with performance and aesthetics in mind, SyncSpace uses modern web technologies packaged inside a native Windows desktop executable, running fully offline with your own private, local database.

---

## 🌟 Key Features

### 1. Dashboard
- **Centralized Overview**: Get a bird's-eye view of your entire life in one screen.
- **Dynamic Widgets**: See upcoming reminders, today's schedule, recent transactions, and quick links to active projects.
- **Global Search & Quick Add**: Press `Ctrl + K` anywhere in the app to instantly bring up the Quick Add menu to capture ideas, reminders, or expenses without losing your current context.

### 2. Reminders & Tasks
- **Categorized Lists**: Organize tasks by Priority (High, Medium, Low) and Category (Personal, Work, etc.).
- **Smart Due Dates**: Set specific deadlines and let the app track what is overdue or coming up.
- **Desktop Notifications**: Background workers check your due dates and trigger native Windows popup notifications so you never miss a deadline.

### 3. Planner (Calendar & Events)
- **Visual Calendar**: A beautiful grid view of your month, week, or day.
- **Event Management**: Schedule meetings, appointments, and blocks of time with descriptions and locations.

### 4. Financial Budgeting
- **Balance Tracking**: Input your starting balance, log income/expenses, and watch your total balance update in real-time.
- **Expense Categorization**: Tag your spending (e.g., Food, Tech, Bills) to see where your money goes.
- **Future Shopping List**: Maintain a list of items you *want* to buy along with estimated costs, keeping them separate from your actual completed transactions.
- **Analytics**: Visual charts plotting your Income vs. Expenses over the last 6 months.

### 5. Projects
- **Kanban-style Tracking**: Move ideas from "Idea" to "In Progress" to "Completed".
- **Deadlines & Priorities**: Keep massive goals on track with tags, external links, and strict deadlines.

### 6. Notes & Knowledge Base
- **Markdown Support**: Write rich text notes, documentation, or journal entries.
- **Cross-linking**: Link notes directly to specific projects or tasks to keep context tightly coupled.

### 7. Local Network Sync (Phase 2)
- **Local Wi-Fi Server**: Built-in HTTP server (`:14205`) that runs silently in the background.
- **E2E Encryption Ready**: Designed to pair securely with a companion Android app via a QR code, letting you sync your data across devices over your home Wi-Fi—completely bypassing the cloud for maximum privacy.

---

## 🛠️ Technology Stack & Formats

SyncSpace is a hybrid application blending a lightning-fast web frontend with a powerful desktop backend:

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion (for buttery-smooth page transitions and micro-animations), Lucide React (for iconography), and Recharts (for data visualization).
* **Backend Framework**: Electron (Node.js).
* **Database**: `sql.js` (WebAssembly SQLite). Your data is stored locally in a highly optimized SQLite database file (`productivity_data.db`).
* **Format Delivered**: `.exe` (Windows NSIS Installer).

---

## 🔒 Data Privacy & Storage

SyncSpace is entirely **offline-first**. 
Your data never touches a cloud server, third-party API, or corporate database. It is stored directly on your hard drive in your Windows `AppData` folder (`C:\Users\<username>\AppData\Roaming\syncspace\productivity_data.db`).

You can easily export your entire database as a `.json` backup file or import existing data directly from the **Settings** page.

---

## 🚀 Getting Started

1. **Install**: Double-click the `SyncSpace Setup 1.0.0.exe` file to install the application.
2. **Open**: Launch SyncSpace from your Windows Start Menu or Desktop shortcut.
3. **Customize**: Head over to the Settings page to configure your preferred currency, date format, and language.
4. **Start Tracking**: Use the `+` button in the bottom right corner (or `Ctrl+K`) to start adding your first reminders, transactions, and notes!
