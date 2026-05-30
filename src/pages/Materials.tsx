import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupees } from '../utils/format';
import { 
  ClipboardCheck, 
  Search, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Warehouse, 
  ArrowRightLeft,
  Truck
} from 'lucide-react';
import { Material } from '../types';

export default function Materials() {
  const { materials, projects, addMaterial, deleteMaterial, updateMaterial } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Ordered' | 'Received' | 'Pending'>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal setup
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [qty, setQty] = useState('');
  const [qtyReceived, setQtyReceived] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const [status, setStatus] = useState<'Ordered' | 'Received' | 'Pending'>('Ordered');

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !qty || !unitCost) return;

    addMaterial({
      name,
      projectId: projectId || (projects[0]?.id || 'GENERAL'),
      quantityOrdered: parseFloat(qty),
      quantityReceived: parseFloat(qtyReceived || '0'),
      unitCost: parseFloat(unitCost),
      supplier: supplier || 'Local Vendor',
      status
    });

    setName('');
    setProjectId('');
    setQty('');
    setQtyReceived('');
    setUnitCost('');
    setSupplier('');
    setStatus('Ordered');
    setIsModalOpen(false);
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                          m.supplier.toLowerCase().includes(search.toLowerCase()) || 
                          m.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjAbbr = (projId: string) => {
    return projects.find(p => p.id === projId)?.name || 'Central Inventory';
  };

  return (
    <div id="materials-page" className="space-y-6 animate-fade-in font-sans">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="materials-header-title" className="text-2xl font-bold text-slate-900 tracking-tight">
            Materials Supply Log & Inventory
          </h1>
          <p className="text-sm text-slate-500">
            Log raw commodity orders, manage delivery receipts, and track supplier billing.
          </p>
        </div>
        <button
          id="btn-add-material"
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>Procure Commodities</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ClipboardCheck className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Procured Orders</span>
            <span className="text-lg font-bold text-slate-850 font-mono">{materials.length} Commodities</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-650 flex items-center justify-center">
            <Truck className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fully Received</span>
            <span className="text-lg font-bold text-slate-850 font-mono">
              {materials.filter(m => m.status === 'Received').length} Consignments
            </span>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center gap-4 border border-slate-850">
          <div className="w-11 h-11 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Warehouse className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Material Capital Outlay</span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {formatRupees(materials.reduce((sum, m) => sum + m.totalCost, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Main filter ledger list */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div id="material-search" className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="input-material-search"
              type="text"
              placeholder="Search commodities / suppliers / IDs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-205 rounded-lg text-sm bg-white"
            />
          </div>

          <div id="material-status-tabs" className="flex bg-slate-100 p-1 rounded-lg border border-slate-150">
            {(['All', 'Ordered', 'Pending', 'Received'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-all cursor-pointer ${
                  statusFilter === tab 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table Section */}
        <div className="overflow-x-auto">
          {filteredMaterials.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 text-xs font-extrabold uppercase bg-slate-50/40">
                  <th className="py-3 px-6">Item details</th>
                  <th className="py-3 px-6">Work Site Allocation</th>
                  <th className="py-3 px-6">Dealer Supplier</th>
                  <th className="py-3 px-6 text-right">Qty Received / Ordered</th>
                  <th className="py-3 px-6">Consignment Status</th>
                  <th className="py-3 px-6 text-right">Expenditure Cost (₹)</th>
                  <th className="py-3 px-6 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-sans">
                {filteredMaterials.map(m => (
                  <tr key={m.id} id={`material-row-${m.id}`} className="hover:bg-slate-55/40 transition-all">
                    <td className="py-3.5 px-6">
                      <div className="font-mono text-[9px] font-bold text-slate-400">{m.id}</div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">{m.name}</div>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-600 max-w-[150px] truncate">{getProjAbbr(m.projectId)}</td>
                    <td className="py-3.5 px-6 text-slate-500 text-xs">{m.supplier}</td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs font-bold text-slate-705">
                      {m.quantityReceived} <span className="text-[10px] text-slate-400 font-semibold">of</span> {m.quantityOrdered}
                    </td>
                    <td className="py-3.5 px-6">
                      <select
                        value={m.status}
                        onChange={(e) => updateMaterial(m.id, { status: e.target.value as any })}
                        className={`text-[10px] font-extrabold uppercase bg-slate-50 border outline-hidden rounded-md px-2 py-1 cursor-pointer font-sans transition-all ${
                          m.status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                          m.status === 'Ordered' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' :
                          'bg-amber-50 text-amber-700 border-amber-150 animate-pulse'
                        }`}
                      >
                        <option value="Ordered">Ordered</option>
                        <option value="Pending">Pending</option>
                        <option value="Received">Received</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-900">
                      {formatRupees(m.totalCost)}
                      <div className="text-[9px] text-slate-400 font-semibold mt-0.5">₹{m.unitCost} / Unit</div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {deletingId === m.id ? (
                        <div className="inline-flex items-center gap-1 bg-rose-50 border border-slate-200 p-0.5 rounded">
                          <button
                            onClick={() => {
                              deleteMaterial(m.id);
                              setDeletingId(null);
                            }}
                            className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer leading-none"
                          >
                            Del
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="bg-slate-200 text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer leading-none"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(m.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-all cursor-pointer"
                          title="Delete Material Record"
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
              <h3 className="font-semibold text-slate-800">Supply Logs are Empty</h3>
              <p className="text-xs">Adjust your status tabs or place custom materials request tickets above.</p>
            </div>
          )}
        </div>

      </div>

      {/* DISPATCH/PROCURE MODAL DIALOG POPUP */}
      {isModalOpen && (
        <div id="add-material-modal" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-md animate-slide-up">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm tracking-wide">Procure Commodity Supplies</h3>
                <p className="text-[10px] text-slate-400 font-medium font-sans">Record bulk masonry elements or site gravel loads.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-amber-400 font-bold text-xs" style={{ cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="p-5 space-y-4 font-sans">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commodity / Material Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UltraTech Premium Portland Cement Bags"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Site / Project Allocation Office</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantity Ordered *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg font-mono focus:ring-2 focus:ring-amber-550"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price Per Unit (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 420"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantity Received (to-Date)</label>
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    value={qtyReceived}
                    onChange={(e) => setQtyReceived(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Code</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                  >
                    <option value="Ordered">Ordered (Ticket Created)</option>
                    <option value="Pending">Pending (Transit Check)</option>
                    <option value="Received">Received (Fully Unloaded)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supplier Merchant Dealer</label>
                <input
                  type="text"
                  placeholder="e.g. TATA Builders Agency"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs py-2 px-3 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-slate-450 hover:text-slate-650 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer shadow-amber-500/10"
                >
                  Procure Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
