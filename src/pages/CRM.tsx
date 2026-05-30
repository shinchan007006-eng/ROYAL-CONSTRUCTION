import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupees } from '../utils/format';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle, 
  Building2, 
  Phone, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { CRMLead } from '../types';

export default function CRM() {
  const { crmLeads, projects, addCRMLead, convertLeadToProject, deleteCRMLead, updateCRMLead } = useApp();
  
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'All' | 'Lead' | 'Proposal' | 'Won' | 'Lost'>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Lead modal States
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [val, setVal] = useState('');
  const [followDate, setFollowDate] = useState('');
  const [notes, setNotes] = useState('');

  // Conversion Modal States
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState('');
  const [conversionBudget, setConversionBudget] = useState('');
  const [conversionNotes, setConversionNotes] = useState('');

  const submitNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !val) return;

    addCRMLead({
      name: clientName,
      company: company || 'Self Employed Broker',
      contact: contact || 'N/A',
      stage: 'Lead',
      value: parseFloat(val),
      followUpDate: followDate || new Date().toISOString().slice(0, 10),
      notes
    });

    setClientName('');
    setCompany('');
    setContact('');
    setVal('');
    setFollowDate('');
    setNotes('');
    setIsLeadModalOpen(false);
  };

  const handleTriggerConversion = (lead: CRMLead) => {
    setActiveLeadId(lead.id);
    setConversionBudget(lead.value.toString());
    setConversionNotes(lead.notes);
    setIsConvertModalOpen(true);
  };

  const confirmProjectConversion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadId || !conversionBudget) return;

    convertLeadToProject(activeLeadId, parseFloat(conversionBudget), conversionNotes);
    setIsConvertModalOpen(false);
    setActiveLeadId('');
    alert('Brilliant! This CRM prospect has been converted. See details on the Projects tab.');
  };

  const filteredCRM = crmLeads.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.company.toLowerCase().includes(search.toLowerCase()) || 
                          c.id.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === 'All' ? true : c.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div id="crm-page" className="space-y-6 animate-fade-in font-sans">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="crm-header-title" className="text-2xl font-bold text-slate-900 tracking-tight">
            Client Acquisition CRM Pipeline
          </h1>
          <p className="text-sm text-slate-500">
            Qualify incoming real estate leads, formulate proposal values, and trigger structural project handovers.
          </p>
        </div>
        <button
          id="btn-add-crm-lead"
          onClick={() => setIsLeadModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>Qualify Incoming Lead</span>
        </button>
      </div>

      {/* CRM Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <Sparkles className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pipeline Targets</span>
            <span className="text-lg font-bold text-slate-850 font-mono">
              {crmLeads.filter(c => c.stage === 'Lead' || c.stage === 'Proposal').length} Active Leads
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-650 flex items-center justify-center">
            <CheckCircle className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Acquired / Won Portfolios</span>
            <span className="text-lg font-bold text-slate-850 font-mono">
              {crmLeads.filter(c => c.stage === 'Won').length} Won Proposals
            </span>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center gap-4 border border-slate-850">
          <div className="w-11 h-11 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Building2 className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Active Pipeline Valuation</span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {formatRupees(crmLeads.filter(c => c.stage !== 'Lost').reduce((sum, c) => sum + c.value, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Main card pipeline layout */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div id="crm-search" className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="input-crm-search"
              type="text"
              placeholder="Search leads, companies or lead contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-205 rounded-lg text-sm bg-white"
            />
          </div>

          <div id="crm-stage-tabs" className="flex bg-slate-100 p-1 rounded-lg border border-slate-150">
            {(['All', 'Lead', 'Proposal', 'Won', 'Lost'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStageFilter(tab)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-md transition-all cursor-pointer ${
                  stageFilter === tab 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* CRM Leads Table/Roster */}
        <div className="overflow-x-auto">
          {filteredCRM.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 text-xs font-extrabold uppercase bg-slate-50/40">
                  <th className="py-3.5 px-6">Prospect detail</th>
                  <th className="py-3.5 px-6">Firm / Company</th>
                  <th className="py-3.5 px-6">Mobile Line</th>
                  <th className="py-3.5 px-6 text-right">Target Value (₹)</th>
                  <th className="py-3.5 px-6">Workflow Status</th>
                  <th className="py-3.5 px-6">Next callback date</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-sans">
                {filteredCRM.map(c => (
                  <tr key={c.id} id={`crm-row-${c.id}`} className="hover:bg-slate-55/40 transition-all">
                    <td className="py-4 px-6">
                      <div className="font-mono text-[9px] font-bold text-amber-500 leading-none">{c.id}</div>
                      <div className="font-bold text-slate-800 text-xs mt-1">{c.name}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-semibold">{c.company}</td>
                    <td className="py-4 px-6 text-slate-500 font-mono text-xs">{c.contact}</td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">{formatRupees(c.value)}</td>
                    <td className="py-4 px-6">
                      <select
                        value={c.stage}
                        onChange={(e) => updateCRMLead(c.id, { stage: e.target.value as any })}
                        className={`text-[10px] font-extrabold uppercase border rounded-md px-2 py-1 outline-hidden cursor-pointer ${
                          c.stage === 'Won' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
                          c.stage === 'Proposal' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' :
                          c.stage === 'Lost' ? 'bg-rose-50 text-rose-750 border-rose-150' :
                          'bg-amber-50 text-amber-700 border-amber-150'
                        }`}
                      >
                        <option value="Lead">Lead</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Won">Won (Closed Deal)</option>
                        <option value="Lost">Lost (Declined)</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{c.followUpDate}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        {c.stage !== 'Won' && (
                          <button
                            onClick={() => handleTriggerConversion(c)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Convert to Project</span>
                          </button>
                        )}
                        {deletingId === c.id ? (
                          <div className="inline-flex items-center gap-1 bg-rose-50 border border-slate-200 p-0.5 rounded">
                            <span className="text-[8px] text-rose-600 font-bold px-0.5">Del?</span>
                            <button
                              onClick={() => {
                                deleteCRMLead(c.id);
                                setDeletingId(null);
                              }}
                              className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded cursor-pointer leading-none"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="bg-slate-200 text-slate-800 text-[8px] font-bold px-1 py-0.5 rounded cursor-pointer leading-none"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(c.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-all cursor-pointer"
                            title="Erase CRM record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-10 h-10 mx-auto" />
              <h3 className="font-semibold text-slate-800">Prospect Pipeline is Unlogged</h3>
              <p className="text-xs">Adjust your status tags or qualifies custom inbound leads above.</p>
            </div>
          )}
        </div>

      </div>

      {/* LEAD QUALIFIER MODAL POPUP */}
      {isLeadModalOpen && (
        <div id="add-lead-modal" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-md animate-slide-up">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm tracking-wide">Qualify Inbound Leads</h3>
                <p className="text-[10px] text-slate-400 font-medium font-sans">Acquire contract values and project sponsors.</p>
              </div>
              <button onClick={() => setIsLeadModalOpen(false)} className="text-white hover:text-amber-400 font-bold text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={submitNewLead} className="p-5 space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lead Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Prasad"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Corporate Group / Firm</label>
                  <input
                    type="text"
                    placeholder="e.g. Balaji Business Units"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Valuation (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500000"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Direct Contact Line</label>
                  <input
                    type="text"
                    placeholder="e.g. 9812345678"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs py-2 px-3 rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Next Callback Goal</label>
                  <input
                    type="date"
                    value={followDate}
                    onChange={(e) => setFollowDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs py-2 px-3 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Qualifications / Interaction Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context on layout checks or concrete grading values..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(false)}
                  className="text-xs text-slate-45 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-905 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer shadow-amber-500/10"
                >
                  Acquire Prospect Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Closed proposal project spinner wizard */}
      {isConvertModalOpen && (
        <div id="lead-conversion-modal" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-sm animate-slide-up">
            <div className="p-5 bg-slate-900 text-white">
              <h3 className="font-bold text-sm tracking-wide">Configure Project Spin-Off</h3>
              <p className="text-[10px] text-slate-400 font-medium">Provision dynamic budgets and finalize contractor profiles.</p>
            </div>

            <form onSubmit={confirmProjectConversion} className="p-5 space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Final Allocations Budget (₹ INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. lead value"
                  value={conversionBudget}
                  onChange={(e) => setConversionBudget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-805 text-xs py-2.5 px-3 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contractor execution handovers notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Confirm parameters..."
                  value={conversionNotes}
                  onChange={(e) => setConversionNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-805 text-xs py-2 px-3 rounded-lg"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-650 transition-all font-semibold"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer shadow-amber-500/10"
                >
                  Spin-off Project Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
