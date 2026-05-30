import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupees } from '../utils/format';
import { 
  Building, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Trash2, 
  AlertCircle,
  Eye,
  CheckCircle,
  Timer
} from 'lucide-react';
import { Project, ProjectStatus } from '../types';

interface ProjectsProps {
  setCurrentTab: (tab: string) => void;
  setSelectedProjectId: (id: string) => void;
}

export default function Projects({ setCurrentTab, setSelectedProjectId }: ProjectsProps) {
  const { projects, team, addProject, deleteProject } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ProjectStatus>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Create Project Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pClient, setPClient] = useState('');
  const [pStart, setPStart] = useState('');
  const [pEnd, setPEnd] = useState('');
  const [pStatus, setPStatus] = useState<ProjectStatus>('Active');
  const [pBudget, setPBudget] = useState('');
  const [pLead, setPLead] = useState('');
  const [pDesc, setPDesc] = useState('');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pClient || !pBudget) return;
    
    addProject({
      name: pName,
      client: pClient,
      startDate: pStart || new Date().toISOString().slice(0, 10),
      endDate: pEnd || new Date().toISOString().slice(0, 10),
      status: pStatus,
      budget: parseFloat(pBudget),
      teamLead: pLead || 'Unassigned',
      description: pDesc
    });

    // Reset fields
    setPName('');
    setPClient('');
    setPStart('');
    setPEnd('');
    setPStatus('Active');
    setPBudget('');
    setPLead('');
    setPDesc('');
    setIsModalOpen(false);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.id.toLowerCase().includes(search.toLowerCase()) || 
                          p.client.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="projects-page" className="space-y-6 animate-fade-in">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="projects-header-title" className="text-2xl font-bold text-slate-900 tracking-tight">
            Workplace Project Registry
          </h1>
          <p className="text-sm text-slate-500">
            Provision, monitor budgets, track actual spending and allocate supervisor managers.
          </p>
        </div>
        <button
          id="btn-add-new-project"
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>Add Custom Project Site</span>
        </button>
      </div>

      {/* Searching & Tabs Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        {/* Search Field */}
        <div id="project-search-container" className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            id="input-project-search"
            type="text"
            placeholder="Search Project Title, Client, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all text-slate-800"
          />
        </div>

        {/* Status Filters */}
        <div id="project-status-tabs" className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
          {(['All', 'Active', 'Planned', 'Completed'] as const).map(tab => (
            <button
              key={tab}
              id={`tab-project-${tab}`}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 sm:flex-none text-xs font-semibold px-4 py-1.5 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab 
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Cards Grid */}
      <div id="projects-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map(proj => {
            const pctUsed = Math.round((proj.spent / proj.budget) * 100) || 0;
            const isOverBudget = proj.spent > proj.budget;

            return (
              <div 
                key={proj.id} 
                id={`project-card-${proj.id}`}
                className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all group"
              >
                {/* ID and Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-amber-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded">
                    {proj.id}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded inline-flex items-center gap-1 ${
                    proj.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    proj.status === 'Completed' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                    'bg-slate-50 text-slate-500 border border-slate-200'
                  }`}>
                    {proj.status === 'Active' && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>}
                    {proj.status}
                  </span>
                </div>

                {/* Name / Client */}
                <div className="space-y-1">
                  <h3 id={`proj-card-title-${proj.id}`} className="font-semibold text-slate-800 text-base leading-snug group-hover:text-slate-950 truncate transition-all">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-400">Client: <span className="font-medium text-slate-600">{proj.client}</span></p>
                </div>

                {/* Date and Manager icons */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                    <span>{proj.teamLead}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{proj.endDate}</span>
                  </div>
                </div>

                {/* Progress bar budget indicator */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Burn Ratio</span>
                    <span className={isOverBudget ? 'text-rose-600' : 'text-emerald-600 font-mono'}>{pctUsed}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      style={{ width: `${Math.min(100, pctUsed)}%` }} 
                      className={`h-full rounded-full ${isOverBudget ? 'bg-rose-500' : 'bg-amber-500'}`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono leading-none pt-0.5 font-bold">
                    <span className="text-slate-500">{formatRupees(proj.spent)} spent</span>
                    <span className="text-slate-400">of {formatRupees(proj.budget)}</span>
                  </div>
                </div>

                <hr className="border-t border-slate-100" />

                {/* Footer Controls */}
                <div className="flex gap-2 pt-1 font-sans justify-end items-center">
                  {deletingId === proj.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-red-200 p-1 rounded-lg">
                      <span className="text-[10px] text-rose-600 font-bold px-1 uppercase shrink-0">Retire?</span>
                      <button
                        id={`btn-proj-delete-yes-${proj.id}`}
                        onClick={() => {
                          deleteProject(proj.id);
                          setDeletingId(null);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-2 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        Yes
                      </button>
                      <button
                        id={`btn-proj-delete-no-${proj.id}`}
                        onClick={() => setDeletingId(null)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`btn-proj-delete-${proj.id}`}
                      onClick={() => setDeletingId(proj.id)}
                      className="p-1.5 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 hover:border-rose-150 rounded-lg transition-all cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    id={`btn-proj-inspect-${proj.id}`}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setCurrentTab(`project-detail-${proj.id}`);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Site</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-1 md:col-span-3 bg-white p-12 text-center rounded-2xl border border-slate-250 flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-base">No Matching Projects Registered</h3>
            <p className="text-xs text-slate-400 max-w-sm">Adjust filters or create your first civil engineering site project listing using the dynamic form creator above.</p>
          </div>
        )}
      </div>

      {/* CREATE PROJECT DIALOG MODAL */}
      {isModalOpen && (
        <div id="create-project-modal" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Register New Project Site</h3>
                <p className="text-xs text-slate-400 font-medium">Provision dynamic budgets and allocate general managers.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-amber-400 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Project Work Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Golden Meadows Annex Tower B"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm py-2 px-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all font-medium"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Client Firm / Owner Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Sterling Developers Ltd."
                    value={pClient}
                    onChange={(e) => setPClient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm py-2 px-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Budget Size (₹ INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 45000000"
                    value={pBudget}
                    onChange={(e) => setPBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm py-2 px-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Work Start Date</label>
                  <input
                    type="date"
                    value={pStart}
                    onChange={(e) => setPStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm py-2 px-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Target Completion Date</label>
                  <input
                    type="date"
                    value={pEnd}
                    onChange={(e) => setPEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm py-2 px-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Allocated Supervising Lead</label>
                  <input
                    type="text"
                    placeholder="Rajesh Kumar"
                    value={pLead}
                    onChange={(e) => setPLead(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm py-2 px-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all"
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Workflow Status</label>
                  <select
                    value={pStatus}
                    onChange={(e) => setPStatus(e.target.value as ProjectStatus)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm py-2 px-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all"
                  >
                    <option value="Planned">Planned (Review Stage)</option>
                    <option value="Active">Active (In Progress)</option>
                    <option value="Completed">Completed (Handed Over)</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">Structural Details / Scope of Work</label>
                  <textarea
                    rows={3}
                    placeholder="Erection of pre-cast slabs and columns..."
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm py-2 px-3 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition-all"
                  ></textarea>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm cursor-pointer shadow-amber-500/10"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
