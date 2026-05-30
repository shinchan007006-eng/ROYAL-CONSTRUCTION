import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupees, formatRupeesShorthand } from '../utils/format';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  PiggyBank
} from 'lucide-react';
import { FinanceEntry } from '../types';

export default function Finance() {
  const { finance, projects, addFinanceEntry, deleteFinanceEntry, updateFinanceEntry } = useApp();
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Voucher States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vDate, setVDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [vProjId, setVProjId] = useState('');
  const [vCategory, setVCategory] = useState<'Income' | 'Expense'>('Expense');
  const [vDesc, setVDesc] = useState('');
  const [vAmount, setVAmount] = useState('');
  const [vVendor, setVVendor] = useState('');
  const [vPaid, setVPaid] = useState(true);

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vAmount || !vDesc) return;

    addFinanceEntry({
      date: vDate,
      projectId: vProjId || (projects[0]?.id || 'GENERAL'),
      category: vCategory,
      description: vDesc,
      amount: parseFloat(vAmount),
      vendor: vVendor || 'Underdeclared Cash',
      paid: vPaid
    });

    setVDate(new Date().toISOString().slice(0, 10));
    setVProjId('');
    setVCategory('Expense');
    setVDesc('');
    setVAmount('');
    setVVendor('');
    setVPaid(true);
    setIsModalOpen(false);
  };

  // Math Calculations
  const totalIncome = finance
    .filter(f => f.category === 'Income')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalExpense = finance
    .filter(f => f.category === 'Expense')
    .reduce((sum, f) => sum + f.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const filteredVouchers = finance.filter(f => {
    const matchesSearch = f.description.toLowerCase().includes(search.toLowerCase()) || 
                          f.vendor.toLowerCase().includes(search.toLowerCase()) || 
                          f.id.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' ? true : f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getProjectAbbr = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.name.slice(0, 15) + '..' : 'Float Cash';
  };

  return (
    <div id="finance-page" className="space-y-6 animate-fade-in font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="finance-header-title" className="text-2xl font-bold text-slate-900 tracking-tight">
            Financial Ledger Ledger Book
          </h1>
          <p className="text-sm text-slate-500">
            Audit general income voucher awards and record cash field purchase expenses.
          </p>
        </div>
        <button
          id="btn-add-voucher"
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>Record Cash Voucher</span>
        </button>
      </div>

      {/* LEDGER KPI CARDS */}
      <div id="finance-stats-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Inward Income */}
        <div id="stat-finance-income" className="bg-white border border-slate-200/85 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Inward Income</span>
            <span id="text-finance-income" className="text-xl font-bold font-mono text-emerald-600">{formatRupees(totalIncome)}</span>
          </div>
        </div>

        {/* Total Outward Costs */}
        <div id="stat-finance-expense" className="bg-white border border-slate-200/85 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Expenditure Outflow</span>
            <span id="text-finance-expense" className="text-xl font-bold font-mono text-rose-600">{formatRupees(totalExpense)}</span>
          </div>
        </div>

        {/* Net Profit Cash balance */}
        <div id="stat-finance-net" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm text-white">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Net Balance Book</span>
            <span id="text-finance-balance" className={`text-xl font-bold font-mono ${netBalance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {formatRupees(netBalance)}
            </span>
          </div>
        </div>

      </div>

      {/* FILTER & LEDGER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Searching */}
          <div id="finance-search" className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="input-finance-search"
              type="text"
              placeholder="Search voucher descriptive keywords, vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>

          {/* Slicing Tabs */}
          <div id="finance-category-tabs" className="flex bg-slate-100 p-1 rounded-lg border border-slate-150">
            {(['All', 'Income', 'Expense'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-all cursor-pointer ${
                  categoryFilter === cat 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

        {/* Ledger Table Section */}
        <div className="overflow-x-auto">
          {filteredVouchers.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 text-xs font-extrabold uppercase bg-slate-50/40 font-sans">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Voucher/Project</th>
                  <th className="py-3 px-6">Core Description</th>
                  <th className="py-3 px-6">Payor / Receiver Vendor</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Sum (₹ INR)</th>
                  <th className="py-3 px-6 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-sans">
                {filteredVouchers.map(f => (
                  <tr key={f.id} id={`ledger-row-${f.id}`} className="hover:bg-slate-55/40 transition-all">
                    <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">{f.date}</td>
                    <td className="py-3.5 px-6">
                      <div className="font-mono text-[9px] font-bold text-amber-500 leading-none">{f.id}</div>
                      <div className="text-xs font-semibold text-slate-700 mt-1 truncate max-w-[120px]">{getProjectAbbr(f.projectId)}</div>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-850 truncate max-w-[200px]">{f.description}</td>
                    <td className="py-3.5 px-6 text-slate-500 text-xs">{f.vendor}</td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => updateFinanceEntry(f.id, { paid: !f.paid })}
                        className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold py-1 px-2.5 rounded-full border transition-all cursor-pointer ${
                          f.paid 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-110 hover:bg-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-110 hover:bg-amber-100'
                        }`}
                        title="Click to toggle transaction status"
                      >
                        {f.paid ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>CLEARED</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            <span>DUE VOUCHER</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className={`py-3.5 px-6 text-right font-mono font-bold text-sm ${
                      f.category === 'Income' ? 'text-emerald-600' : 'text-slate-800'
                    }`}>
                      {f.category === 'Income' ? '+' : '-'}{formatRupees(f.amount)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {deletingId === f.id ? (
                        <div className="inline-flex items-center gap-1 bg-rose-50 border border-slate-200 p-0.5 rounded">
                          <button
                            onClick={() => {
                              deleteFinanceEntry(f.id);
                              setDeletingId(null);
                            }}
                            className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer leading-none"
                          >
                            Del
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="bg-slate-200 text-slate-800 text-[9px] font-bold px-1 py-0.5 rounded cursor-pointer leading-none"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(f.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-all cursor-pointer"
                          title="Delete voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-10 h-10 mx-auto" />
              <h3 className="font-semibold text-slate-800">Ledger Index is Unloaded</h3>
              <p className="text-xs">Adjust your search parameters or declare inward funding above.</p>
            </div>
          )}
        </div>

      </div>

      {/* RECORD CASH VOUCHER DIALOG POPUP */}
      {isModalOpen && (
        <div id="add-voucher-modal" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-md animate-slide-up">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm tracking-wide">Declare Ledger Cash Voucher</h3>
                <p className="text-[10px] text-slate-400 font-medium">Record materials costs and site logistics immediately.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-amber-400 font-bold text-xs cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="p-5 space-y-4 font-sans">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Associated Project</label>
                  <select
                    value={vProjId}
                    onChange={(e) => setVProjId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                  >
                    <option value="GENERAL">-- Non-Site Central Cash --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Voucher Date</label>
                  <input
                    type="date"
                    required
                    value={vDate}
                    onChange={(e) => setVDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transaction Class</label>
                  <select
                    value={vCategory}
                    onChange={(e) => setVCategory(e.target.value as 'Income' | 'Expense')}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg font-bold"
                  >
                    <option value="Expense" className="text-rose-500">Outgoing Cost (Expense)</option>
                    <option value="Income" className="text-emerald-500">Milestone Funding (Income)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ledger Amount (₹ INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 180000"
                    value={vAmount}
                    onChange={(e) => setVAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg font-mono font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Voucher Descriptive Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Purchased 400 CFT course aggregates or Cement invoice"
                  value={vDesc}
                  onChange={(e) => setVDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Receive Account / Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gupta Traders Ltd."
                  value={vVendor}
                  onChange={(e) => setVVendor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Voucher Clearing</label>
                <select
                  value={vPaid ? 'yes' : 'no'}
                  onChange={(e) => setVPaid(e.target.value === 'yes')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                >
                  <option value="yes">Paid & Confirmed Immediately (Cleared)</option>
                  <option value="no">Pending Payment Clearance (Dues Ledger)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-slate-450 hover:text-slate-650 font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer shadow-amber-500/10"
                >
                  Record Voucher Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
