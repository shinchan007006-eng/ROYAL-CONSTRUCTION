import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupees } from '../utils/format';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle, 
  HardHat, 
  Phone,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { TeamMember } from '../types';

export default function Teams() {
  const { team, projects, addTeamMember, deleteTeamMember } = useApp();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Labourer');
  const [contact, setContact] = useState('');
  const [rate, setRate] = useState('');
  const [assignedProjId, setAssignedProjId] = useState('');

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rate) return;

    addTeamMember({
      name,
      role,
      contact: contact || 'N/A',
      dailyRate: parseFloat(rate),
      assignedProjectId: assignedProjId || (projects[0]?.id || '')
    });

    setName('');
    setRole('Labourer');
    setContact('');
    setRate('');
    setAssignedProjId('');
    setIsModalOpen(false);
  };

  const filteredTeam = team.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.role.toLowerCase().includes(search.toLowerCase()) ||
    t.contact.includes(search)
  );

  const getProjectName = (projId: string) => {
    return projects.find(p => p.id === projId)?.name || 'Central Office / Float';
  };

  return (
    <div id="teams-page" className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="teams-header-title" className="text-2xl font-bold text-slate-900 tracking-tight">
            Workmen & Labour Directory
          </h1>
          <p className="text-sm text-slate-500">
            Catalog site engineers, specialized tradesmen, and allocate precise daily rates for automated attendance bookkeeping.
          </p>
        </div>
        <button
          id="btn-add-team-member"
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>Allocate New Worker</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/85 flex flex-col md:flex-row md:items-center gap-4 justify-between shadow-xs">
        <div id="team-search-box" className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="input-team-search"
            type="text"
            placeholder="Search workmen names, trades, contact numbers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-850 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-hidden transition-all font-medium"
          />
        </div>

        <div className="text-xs font-semibold text-slate-400 font-sans">
          Total Field Crew: <span className="text-slate-800 font-mono font-bold bg-slate-100 px-2.5 py-1.5 rounded">{team.length} Staff members</span>
        </div>
      </div>

      {/* Grid of Crew Cards */}
      <div id="teams-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeam.length > 0 ? (
          filteredTeam.map(t => (
            <div 
              key={t.id} 
              id={`worker-card-${t.id}`}
              className="bg-white border border-slate-200/85 hover:border-amber-400/80 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-800">
                    <HardHat className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 id={`worker-name-${t.id}`} className="font-bold text-slate-900 text-sm leading-tight">{t.name}</h3>
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{t.role}</span>
                  </div>
                </div>

                <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                  {t.id}
                </span>
              </div>

              {/* Specific info items */}
              <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-300" />
                    <span>Mobile Contact:</span>
                  </span>
                  <span className="font-mono text-slate-700 font-semibold" id={`worker-phone-${t.id}`}>{t.contact}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-300" />
                    <span>Site Allocation:</span>
                  </span>
                  <span className="text-slate-700 max-w-[160px] truncate block text-right font-medium" title={getProjectName(t.assignedProjectId)}>
                    {getProjectName(t.assignedProjectId)}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
                  <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wide">Standard Daily Pay (₹):</span>
                  <span className="font-mono text-xs font-bold text-slate-900" id={`worker-rate-${t.id}`}>{formatRupees(t.dailyRate)} / Day</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-end pt-1">
                {deletingId === t.id ? (
                  <div className="flex items-center gap-2 animate-fade-in bg-rose-50 border border-slate-200 p-1 rounded-lg">
                    <span className="text-[10px] text-rose-600 font-bold px-1">Retire worker?</span>
                    <button
                      id={`btn-worker-delete-yes-${t.id}`}
                      onClick={() => {
                        deleteTeamMember(t.id);
                        setDeletingId(null);
                      }}
                      className="bg-red-650 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                    >
                      Yes, Retire
                    </button>
                    <button
                      id={`btn-worker-delete-no-${t.id}`}
                      onClick={() => setDeletingId(null)}
                      className="bg-slate-200 hover:bg-slate-350 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    id={`btn-worker-delete-${t.id}`}
                    onClick={() => setDeletingId(t.id)}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-600 transition-all text-xs font-bold bg-slate-100 hover:bg-rose-50 border border-slate-150 p-2 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Retire Worker</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-3 bg-white p-12 text-center rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 animate-pulse" />
            <h3 className="font-bold text-slate-800 text-sm">No Workmen Listed</h3>
            <p className="text-xs text-slate-400">Ensure spellings are correct or allocate a custom crew member.</p>
          </div>
        )}
      </div>

      {/* ALLOCATE WORKER MODAL DIALOG */}
      {isModalOpen && (
        <div id="allocate-worker-modal" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl border border-slate-250 shadow-xl overflow-hidden w-full max-w-md animate-slide-up">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm tracking-wide">Allocate New Workmen</h3>
                <p className="text-[10px] text-slate-400 font-medium">Record daily wage payouts and project details.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-amber-400 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Specialized Trade / Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                  >
                    <option value="Project Manager">Project Manager</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Mason">Mason (Brick / Plaster)</option>
                    <option value="Painter">Painter</option>
                    <option value="Welder">Welder (Steel / Canopy)</option>
                    <option value="Carpenter">Carpenter (Formwork)</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Labourer">Helper Labourer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Daily Payout Rate (₹ INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1000"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs py-2 px-3 rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Primary Project Allocation</label>
                <select
                  value={assignedProjId}
                  onChange={(e) => setAssignedProjId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs py-2 px-3 rounded-lg"
                >
                  <option value="">-- Float / Central Office --</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name} ({proj.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Mobile Contact</label>
                <input
                  type="text"
                  placeholder="e.g. 9812345678"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs py-2 px-3 rounded-lg font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-slate-450 hover:text-slate-650 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer shadow-amber-500/10 animate-pulse-once"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
