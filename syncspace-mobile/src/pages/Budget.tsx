import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Trash2, X, PieChart as PieIcon, IndianRupee, Target, CheckCircle2, Circle, ShoppingBag, Edit2, Check, Receipt } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Transaction, BudgetConfig, ShoppingItem, Budget } from '../types/electron.d.ts';

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];
const CATEGORIES = ['Food', 'Transport', 'Rent', 'Entertainment', 'Shopping', 'Health', 'Utilities', 'Education', 'Other'];
const SHOPPING_CATEGORIES = ['General', 'Groceries', 'Electronics', 'Clothing', 'Home', 'Gifts'];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const listItem = {
  hidden: { opacity: 0, y: -10, height: 0, overflow: 'hidden' },
  show: { opacity: 1, y: 0, height: 'auto', overflow: 'visible', transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, height: 0, overflow: 'hidden', transition: { duration: 0.25, ease: 'easeOut' } }
};

function CountUp({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, current => `₹${Math.round(current).toLocaleString('en-IN')}`);
  useEffect(() => { spring.set(value); }, [spring, value]);
  return <motion.span>{display}</motion.span>;
}

export default function Budget() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isEditingTxn, setIsEditingTxn] = useState<Transaction | null>(null);
  const [txnForm, setTxnForm] = useState({ type: 'expense', amount: '', category: 'Food', note: '', date: new Date().toISOString().split('T')[0] });
  
  const [isEditingShop, setIsEditingShop] = useState<ShoppingItem | null>(null);
  const [shopForm, setShopForm] = useState({ item: '', estimated_cost: '', category: 'General', occasion: '' });
  
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ starting_balance: '', monthly_savings_goal: '' });
  const configInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const [txns, shops, config, bgts] = await Promise.all([
        window.api.getTransactions(),
        window.api.getShoppingList(),
        window.api.getBudgetConfig(),
        window.api.getBudgets?.() || Promise.resolve([])
      ]);
      setTransactions(txns);
      setShoppingList(shops);
      setBudgets(bgts);
      if (config && config.length > 0) {
        setBudgetConfig(config[0]);
        setConfigForm({ starting_balance: config[0].starting_balance.toString(), monthly_savings_goal: config[0].monthly_savings_goal.toString() });
      } else {
        setConfigForm({ starting_balance: '0', monthly_savings_goal: '0' });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  
  useEffect(() => { if (isEditingConfig && configInputRef.current) configInputRef.current.focus(); }, [isEditingConfig]);

  const handleSaveTxn = async () => {
    if (!txnForm.amount || parseFloat(txnForm.amount) <= 0) return;
    if (isEditingTxn) {
      await window.api.updateTransaction({ ...isEditingTxn, ...txnForm, amount: parseFloat(txnForm.amount) });
    } else {
      await window.api.createTransaction({ ...txnForm, amount: parseFloat(txnForm.amount) });
    }
    setTxnForm({ type: 'expense', amount: '', category: 'Food', note: '', date: new Date().toISOString().split('T')[0] });
    setShowTxnModal(false);
    setIsEditingTxn(null);
    load();
  };

  const handleSaveShop = async () => {
    if (!shopForm.item) return;
    if (isEditingShop) {
      await window.api.updateShoppingItem({ ...isEditingShop, ...shopForm, estimated_cost: parseFloat(shopForm.estimated_cost) || 0 });
    } else {
      await window.api.createShoppingItem({ ...shopForm, estimated_cost: parseFloat(shopForm.estimated_cost) || 0 });
    }
    setShopForm({ item: '', estimated_cost: '', category: 'General', occasion: '' });
    setShowShopModal(false);
    setIsEditingShop(null);
    load();
  };

  const handleSaveConfig = async () => {
    await window.api.updateBudgetConfig({ 
      starting_balance: parseFloat(configForm.starting_balance) || 0, 
      monthly_savings_goal: parseFloat(configForm.monthly_savings_goal) || 0 
    });
    setIsEditingConfig(false);
    load();
  };

  const handleDeleteTxn = async (id: string) => { await window.api.deleteTransaction(id); load(); };
  const handleDeleteShop = async (id: string) => { await window.api.deleteShoppingItem(id); load(); };
  const handleToggleShop = async (id: string) => { await window.api.toggleShoppingItem(id); load(); };
  
  const convertShopToTxn = async (item: ShoppingItem) => {
    setTxnForm({ type: 'expense', amount: (item.estimated_cost || 0).toString(), category: item.category, note: `Purchased: ${item.item}`, date: new Date().toISOString().split('T')[0] });
    await window.api.toggleShoppingItem(item.id);
    setShowTxnModal(true);
    load();
  };
  
  const exportCsv = async () => {
    try {
      if (window.api.exportBudgetCsv) {
        const csv = await window.api.exportBudgetCsv();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch(e) {}
  };
  
  const openEditTxn = (t: Transaction) => {
    setIsEditingTxn(t);
    setTxnForm({ type: t.type, amount: t.amount.toString(), category: t.category, note: t.note || '', date: t.date });
    setShowTxnModal(true);
  };
  
  const openEditShop = (s: ShoppingItem) => {
    setIsEditingShop(s);
    setShopForm({ item: s.item, estimated_cost: s.estimated_cost.toString(), category: s.category, occasion: s.occasion || '' });
    setShowShopModal(true);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTxns = transactions.filter(t => t.date?.startsWith(currentMonth));
  const totalIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  
  const allTimeIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allTimeExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const derivedTotalBalance = (budgetConfig?.starting_balance || 0) + allTimeIncome - allTimeExpense;

  const savedThisMonth = totalIncome - totalExpense;
  const savingsGoal = budgetConfig?.monthly_savings_goal || 0;
  const savingsProgress = savingsGoal > 0 ? Math.min(100, Math.max(0, (savedThisMonth / savingsGoal) * 100)) : 0;
  const netSavingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  
  const totalShoppingEst = shoppingList.filter(s => !s.is_purchased).reduce((sum, item) => sum + (item.estimated_cost || 0), 0);

  const categorySpend: Record<string, number> = {};
  monthTxns.filter(t => t.type === 'expense').forEach(t => { categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount; });
  const pieData = Object.entries(categorySpend).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  const barData: { month: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const m = d.toISOString().slice(0, 7);
    const mLabel = d.toLocaleDateString('en', { month: 'short' });
    const inc = transactions.filter(t => t.type === 'income' && t.date?.startsWith(m)).reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'expense' && t.date?.startsWith(m)).reduce((s, t) => s + t.amount, 0);
    barData.push({ month: mLabel, income: inc, expense: exp });
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div className="p-6 h-full overflow-y-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your spending, savings, and shopping.</p>
        </div>
        <div className="flex gap-3">
           <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setIsEditingShop(null); setShowShopModal(true); }} className="btn-secondary">
            <ShoppingBag className="w-4 h-4" /> Add Item
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setIsEditingTxn(null); setShowTxnModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Transaction
          </motion.button>
        </div>
      </motion.div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="glass-card glow-blue p-6 relative group" style={{ background: 'linear-gradient(135deg, rgba(13,18,33,0.8), rgba(59,130,246,0.05))' }}>
           <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-blue-200/70">Total Balance</span>
            </div>
          </div>
          <p className="text-4xl font-extrabold text-white tracking-tight"><CountUp value={derivedTotalBalance} /></p>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
             <span className="text-xs text-muted-foreground">Starting Balance</span>
             {isEditingConfig ? (
                <div className="flex items-center gap-2">
                  <input ref={configInputRef} type="number" className="input-field !py-1 !text-xs w-24" value={configForm.starting_balance} onChange={e => setConfigForm({...configForm, starting_balance: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleSaveConfig()} />
                  <button onClick={handleSaveConfig} className="text-emerald-400 p-1 rounded hover:bg-emerald-500/20"><Check className="w-4 h-4" /></button>
                </div>
             ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">₹{budgetConfig?.starting_balance?.toLocaleString('en-IN') || '0'}</span>
                  <button onClick={() => setIsEditingConfig(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-300/50 hover:text-blue-300 outline-none"><Edit2 className="w-3.5 h-3.5" /></button>
                </div>
             )}
          </div>
        </motion.div>
        
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="glass-card p-6 border-emerald-500/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-muted-foreground">Net Savings Rate</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{netSavingsRate}%</p>
          <p className="text-xs text-muted-foreground mt-4">Current month efficiency</p>
        </motion.div>
      </div>

      {/* Savings Goal & Shopping summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
         <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="glass-card p-6 relative group flex flex-col justify-center cursor-pointer" onClick={() => !isEditingConfig && setIsEditingConfig(true)}>
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Monthly Savings Goal</h2>
              {!isEditingConfig && (
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white" title="Edit Goal">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
           </div>
           
           {isEditingConfig ? (
              <div className="flex items-center gap-3 mb-4" onClick={e => e.stopPropagation()}>
                <span className="text-sm text-muted-foreground font-medium">Goal: ₹</span>
                <input type="number" className="input-field !py-1.5 w-32" value={configForm.monthly_savings_goal} onChange={e => setConfigForm({...configForm, monthly_savings_goal: e.target.value})} onKeyDown={e => e.key === 'Enter' && handleSaveConfig()} />
                <button onClick={handleSaveConfig} className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/30 font-medium">Save</button>
              </div>
           ) : (
             <div className="flex justify-between items-end mb-3">
               <div>
                 <span className="text-2xl font-bold text-white"><CountUp value={Math.max(0, savedThisMonth)} /></span>
                 <span className="text-sm text-muted-foreground ml-2">/ <CountUp value={savingsGoal} /></span>
               </div>
               <span className="text-xs font-bold text-primary">{Math.round(savingsProgress)}%</span>
             </div>
           )}
           
           <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
               initial={{ width: 0 }}
               animate={{ width: `${savingsProgress}%` }}
               transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
             />
           </div>
         </motion.div>
         
         <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="glass-card p-6 flex flex-col justify-center">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><ShoppingBag className="w-4 h-4 text-amber-400" /> Pending Shopping Est.</h2>
            <p className="text-3xl font-bold text-amber-400 mb-1"><CountUp value={totalShoppingEst} /></p>
            <p className="text-sm text-muted-foreground">{shoppingList.filter(s => !s.is_purchased).length} items remaining to buy</p>
         </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
         {/* Shopping List */}
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="glass-card p-6 max-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" /> Shopping List</h2>
            {shoppingList.length > 0 && (
               <button onClick={() => { setIsEditingShop(null); setShowShopModal(true); }} className="text-xs text-primary hover:text-indigo-400 font-medium">Add Item</button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 space-y-2 pr-2 -mr-2">
             <AnimatePresence>
               {shoppingList.length === 0 ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center h-full">
                   <ShoppingBag className="w-12 h-12 text-primary/20 mb-4" />
                   <h3 className="text-sm font-semibold mb-1">Your list is empty</h3>
                   <p className="text-xs text-muted-foreground mb-4">Keep track of things you need to buy.</p>
                   <button onClick={() => { setIsEditingShop(null); setShowShopModal(true); }} className="btn-primary"><Plus className="w-3.5 h-3.5" /> Add Item</button>
                 </motion.div>
               ) : (
                 shoppingList.map(item => (
                   <motion.div key={item.id} variants={listItem} initial="hidden" animate="show" exit="exit" layout
                     className={`flex items-center gap-3 p-3 rounded-xl transition-all group border ${item.is_purchased ? 'bg-white/[0.01] border-transparent opacity-60' : 'bg-white/[0.03] border-white/[0.02] hover:border-white/[0.05] hover:bg-white/[0.05] glass-card-hover'}`}>
                     <button onClick={() => handleToggleShop(item.id)} className={`shrink-0 transition-colors p-1 ${item.is_purchased ? 'text-emerald-400' : 'text-muted-foreground hover:text-emerald-400'}`}>
                        {item.is_purchased ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                     </button>
                     <div className="flex-1 min-w-0 relative">
                       <p className={`text-sm font-medium truncate transition-all duration-300 ${item.is_purchased ? 'text-muted-foreground' : 'text-white'}`}>
                          {item.item}
                          {item.is_purchased && <motion.span initial={{ width: 0 }} animate={{ width: '100%' }} className="absolute left-0 top-1/2 h-[1.5px] bg-emerald-500/50 -translate-y-1/2 block" />}
                       </p>
                       <div className="flex items-center gap-2 mt-1 mb-1">
                         <span className="text-[10px] bg-secondary/80 px-2 py-0.5 rounded text-muted-foreground font-medium">{item.category}</span>
                         {item.occasion && <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-medium">{item.occasion}</span>}
                       </div>
                       {!item.is_purchased && item.estimated_cost > 0 && (
                          <div className="text-[10px] mt-0.5 font-medium">
                            {item.estimated_cost > derivedTotalBalance ? (
                               <span className="text-rose-400/80">You need another ₹{(item.estimated_cost - derivedTotalBalance).toLocaleString('en-IN')} to afford this.</span>
                            ) : (
                               <span className="text-emerald-400/80">Your balance will be reduced by ₹{item.estimated_cost.toLocaleString('en-IN')} if you buy this.</span>
                            )}
                          </div>
                       )}
                     </div>
                     <div className="text-right shrink-0 mr-2">
                       <span className={`text-sm font-semibold ${item.is_purchased ? 'text-muted-foreground' : 'text-amber-400'}`}>₹{item.estimated_cost?.toLocaleString('en-IN') || '0'}</span>
                     </div>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {item.is_purchased && <button onClick={() => convertShopToTxn(item)} className="p-1.5 text-emerald-400 hover:bg-white/5 rounded-md text-xs font-medium border border-emerald-500/20" title="Convert to Transaction">To Txn</button>}
                        <button onClick={() => openEditShop(item)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors bg-white/5 rounded-md" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteShop(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors bg-white/5 rounded-md" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                     </div>
                   </motion.div>
                 ))
               )}
             </AnimatePresence>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="glass-card p-6 max-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /> Recent Transactions</h2>
            <div className="flex gap-2">
              <button onClick={exportCsv} className="text-xs text-muted-foreground hover:text-white font-medium">Export CSV</button>
              {transactions.length > 0 && (
                 <button onClick={() => { setIsEditingTxn(null); setShowTxnModal(true); }} className="text-xs text-primary hover:text-indigo-400 font-medium">Add Txn</button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto flex-1 space-y-2 pr-2 -mr-2">
            <AnimatePresence>
              {transactions.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center h-full">
                  <Receipt className="w-12 h-12 text-primary/20 mb-4" />
                  <h3 className="text-sm font-semibold mb-1">No transactions yet</h3>
                  <p className="text-xs text-muted-foreground mb-4">Record your income and expenses here.</p>
                  <button onClick={() => { setIsEditingTxn(null); setShowTxnModal(true); }} className="btn-primary"><Plus className="w-3.5 h-3.5" /> Add Transaction</button>
                </motion.div>
              ) : (
                transactions.slice(0, 30).map(t => (
                  <motion.div key={t.id} variants={listItem} initial="hidden" animate="show" exit="exit" layout
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.02] hover:border-white/[0.05] hover:bg-white/[0.04] transition-all group glass-card-hover">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                      {t.type === 'income' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.category}</p>
                      {t.note && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.note}</p>}
                    </div>
                    <div className="text-right shrink-0 mr-2">
                      <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">{t.date ? new Date(t.date).toLocaleDateString() : ''}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                       <button onClick={() => openEditTxn(t)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors bg-white/5 rounded-md" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                       <button onClick={() => handleDeleteTxn(t.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors bg-white/5 rounded-md" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="glass-card p-6">
          <h2 className="text-base font-semibold mb-6 flex items-center gap-2"><PieIcon className="w-5 h-5 text-primary" /> Spending by Category (This Month)</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} contentStyle={{ background: '#0d1221', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px' }} itemStyle={{ fontWeight: 500 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[260px]">
              <PieIcon className="w-12 h-12 text-primary/10 mb-3" />
              <p className="text-sm text-muted-foreground text-center">No expense data for this month</p>
            </div>
          )}
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="glass-card p-6">
          <h2 className="text-base font-semibold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Income vs Expenses (6 Months)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barGap={6} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tickFormatter={(val) => `₹${val>=1000 ? (val/1000)+'k' : val}`} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ background: '#0d1221', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px' }} itemStyle={{ fontWeight: 500 }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showTxnModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowTxnModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{isEditingTxn ? 'Edit Transaction' : 'Add Transaction'}</h2>
                <button onClick={() => setShowTxnModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setTxnForm({ ...txnForm, type: 'expense' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${txnForm.type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary'}`}>
                    Expense
                  </button>
                  <button onClick={() => setTxnForm({ ...txnForm, type: 'income' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${txnForm.type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-secondary/50 text-muted-foreground border border-transparent hover:bg-secondary'}`}>
                    Income
                  </button>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount (₹) *</label>
                  <input type="number" step="1" className="input-field" placeholder="0" value={txnForm.amount} onChange={e => setTxnForm({ ...txnForm, amount: e.target.value })} autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                    <select className="input-field" value={txnForm.category} onChange={e => setTxnForm({ ...txnForm, category: e.target.value })}>
                      {txnForm.type === 'income' ? (
                        <>
                          <option>Salary</option>
                          <option>Freelance</option>
                          <option>Other</option>
                        </>
                      ) : (
                        CATEGORIES.map(c => <option key={c}>{c}</option>)
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
                    <input type="date" className="input-field" value={txnForm.date} onChange={e => setTxnForm({ ...txnForm, date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Note</label>
                  <input className="input-field" placeholder="Optional note" value={txnForm.note} onChange={e => setTxnForm({ ...txnForm, note: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowTxnModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveTxn} className="btn-primary flex-1 justify-center">{isEditingTxn ? 'Save Changes' : `Add ${txnForm.type === 'income' ? 'Income' : 'Expense'}`}</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Shopping Modal */}
      <AnimatePresence>
        {showShopModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowShopModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{isEditingShop ? 'Edit Shopping Item' : 'Add Shopping Item'}</h2>
                <button onClick={() => setShowShopModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Item Name *</label>
                  <input className="input-field" placeholder="What do you need to buy?" value={shopForm.item} onChange={e => setShopForm({ ...shopForm, item: e.target.value })} autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estimated Cost (₹)</label>
                  <input type="number" className="input-field" placeholder="0" value={shopForm.estimated_cost} onChange={e => setShopForm({ ...shopForm, estimated_cost: e.target.value })} />
                  {shopForm.estimated_cost && parseFloat(shopForm.estimated_cost) > 0 && (
                    <div className="mt-2 text-[11px] font-medium">
                      {parseFloat(shopForm.estimated_cost) > derivedTotalBalance ? (
                         <span className="text-rose-400">You need another ₹{(parseFloat(shopForm.estimated_cost) - derivedTotalBalance).toLocaleString('en-IN')} to afford this.</span>
                      ) : (
                         <span className="text-emerald-400">Your balance will be reduced by ₹{parseFloat(shopForm.estimated_cost).toLocaleString('en-IN')} if you buy this.</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                    <select className="input-field" value={shopForm.category} onChange={e => setShopForm({ ...shopForm, category: e.target.value })}>
                      {SHOPPING_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Occasion (Optional)</label>
                    <input className="input-field" placeholder="e.g. Birthday, Diwali" value={shopForm.occasion} onChange={e => setShopForm({ ...shopForm, occasion: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowShopModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveShop} className="btn-primary flex-1 justify-center">{isEditingShop ? 'Save Changes' : 'Add to List'}</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
