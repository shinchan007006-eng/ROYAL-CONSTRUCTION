import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupees } from '../utils/format';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  IndianRupee, 
  HardHat, 
  ClipboardCheck, 
  FileText, 
  Camera, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  UserCheck,
  Tag
} from 'lucide-react';
import { Project, ProjectPhoto } from '../types';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function ProjectDetail({ projectId, onBack, setCurrentTab }: ProjectDetailProps) {
  const { 
    projects, 
    team, 
    attendance, 
    materials, 
    meetings, 
    photos, 
    addPhoto,
    updateProject,
    finance,
    addFinanceEntry
  } = useApp();

  // Find the focused project
  const project = projects.find(p => p.id === projectId);

  // States for uploading photo inside detail page
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoType, setPhotoType] = useState<'Progress' | 'Bill'>('Progress');
  const [photoDesc, setPhotoDesc] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');

  // States for adding custom money (funding / project income with notes)
  const [fundingAmount, setFundingAmount] = useState('');
  const [fundingSource, setFundingSource] = useState('');
  const [fundingNotes, setFundingNotes] = useState('');
  const [isAddingFunding, setIsAddingFunding] = useState(false);

  if (!project) {
    return (
      <div id="project-not-found-view" className="text-center p-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Operational Site File Not Located</h2>
        <p className="text-sm text-slate-500">The project reference {projectId} might have been removed or archived.</p>
        <button onClick={onBack} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  // Filter linked data
  const projectMaterials = materials.filter(m => m.projectId === projectId);
  const projectMeetings = meetings.filter(m => m.projectId === projectId);
  const projectPhotos = photos.filter(p => p.projectId === projectId);
  
  // Custom project funding inputs ("Income" category with this projectId)
  const projectFundingList = (finance || []).filter(f => f.projectId === projectId && f.category === 'Income');
  const totalFundingReceived = projectFundingList.reduce((sum, f) => sum + f.amount, 0);

  // Dynamic spent calculations
  const totalMaterialsCost = projectMaterials.reduce((sum, m) => sum + m.totalCost, 0);
  
  // Find project attendance
  const projectAttendance = attendance.filter(a => a.projectId === projectId);
  const uniquePersonnelToday = Array.from(new Set(projectAttendance.map(a => a.memberId)));

  const burnRatePercent = Math.round((project.spent / project.budget) * 100) || 0;
  const isOverBudget = project.spent > project.budget;

  const handleAddFunding = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(fundingAmount);
    if (isNaN(amt) || amt <= 0) return;

    addFinanceEntry({
      projectId,
      category: 'Income',
      amount: amt,
      vendor: fundingSource.trim() || 'Project Sponsor',
      description: fundingNotes.trim() || 'Customized added money',
      date: new Date().toISOString().slice(0, 10),
      paid: true
    });

    setFundingAmount('');
    setFundingSource('');
    setFundingNotes('');
    setIsAddingFunding(false);
  };

  // Handle Photo uploading file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitPhotoUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoTitle || !photoBase64) return;

    addPhoto({
      projectId,
      title: photoTitle,
      type: photoType,
      imageUrl: photoBase64,
      description: photoDesc
    });

    setPhotoTitle('');
    setPhotoType('Progress');
    setPhotoDesc('');
    setPhotoBase64('');
    setIsPhotoModalOpen(false);
  };

  return (
    <div id="project-detail-view" className="space-y-8 animate-fade-in pb-12">
      {/* Navigation and Detail Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          id="btn-back-to-projects"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-850 font-bold text-xs transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-205 py-2 px-3 rounded-lg w-max"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>See All Active Projects</span>
        </button>
        
        <div className="flex gap-2">
          <button 
            id="btn-detail-add-photo"
            onClick={() => setIsPhotoModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shadow-amber-500/10"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Daily Progress / Bill Photo</span>
          </button>
        </div>
      </div>

      {/* Main Stats Panel */}
      <div id="detail-profile-hero" className="bg-slate-900 rounded-3xl p-6 lg:p-8 text-white flex flex-col lg:flex-row justify-between gap-8 shadow-md">
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded">
              {project.id}
            </span>
            
            {/* Real-time Status Switcher */}
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Status:</span>
              <select
                id="select-project-detail-status"
                value={project.status}
                onChange={(e) => updateProject(project.id, { status: e.target.value as any })}
                className="bg-transparent text-xs font-bold focus:ring-0 focus:outline-hidden cursor-pointer py-0 px-1 hover:text-amber-400 transition-colors border-0 outline-hidden tracking-wide"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: project.status === 'Active' ? '#10b981' : project.status === 'Completed' ? '#818cf8' : '#cbd5e1',
                  boxShadow: 'none',
                  padding: '1px 4px',
                  fontWeight: '700'
                }}
              >
                <option value="Planned" className="bg-slate-900 text-slate-300">Planned</option>
                <option value="Active" className="bg-slate-900 text-emerald-400">Active</option>
                <option value="Completed" className="bg-slate-900 text-indigo-400">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 id="detail-header-title" className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              {project.name}
            </h2>
            <p className="text-slate-400 text-xs font-semibold">Client Project Sponsor: <span className="text-slate-200">{project.client}</span></p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {project.description || 'No direct structural details descriptions filled for this profile listing yet.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-800/40 border border-slate-750 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Project LeadPM</span>
              <span className="text-sm font-semibold text-white">{project.teamLead}</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-750 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Target Hand-Over</span>
              <span className="text-sm font-semibold font-mono text-white">{project.endDate}</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-750 p-3 rounded-xl col-span-2 md:col-span-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Excavation Range</span>
              <span className="text-sm font-semibold font-mono text-white">{project.startDate}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Spent Ring */}
        <div className="bg-slate-850 border border-slate-750 p-6 rounded-2xl w-full lg:w-80 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Contract Budget Chart</span>
            <span className={`text-xs font-bold font-mono ${isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>{burnRatePercent}% Spent</span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
              <div 
                style={{ width: `${Math.min(100, burnRatePercent)}%` }} 
                className={`h-full rounded-full ${isOverBudget ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}
              ></div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Actual Outlay</span>
                <span className="text-white font-mono">{formatRupees(project.spent)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Total Budget Limit</span>
                <span className="text-slate-300 font-mono">{formatRupees(project.budget)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold border-t border-slate-850 pt-2 mt-2">
                <span className="text-emerald-400 font-medium">Custom Funding Received</span>
                <span className="text-emerald-400 font-mono font-bold">+{formatRupees(totalFundingReceived)}</span>
              </div>
            </div>
          </div>

          {isOverBudget && (
            <div className="bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl text-rose-300 text-xs flex gap-1.5 items-start">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Project holds cost overruns of {formatRupees(project.spent - project.budget)}! Review Materials ledger and check daily labor wages.</span>
            </div>
          )}

          {/* Inline form to Add customized money with notes */}
          <div className="pt-2 border-t border-slate-800">
            {!isAddingFunding ? (
              <button
                type="button"
                onClick={() => setIsAddingFunding(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 hover:text-white font-extrabold text-[10px] py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-all uppercase cursor-pointer tracking-wider"
              >
                <span>➕ Add Capital / Money Received</span>
              </button>
            ) : (
              <form onSubmit={handleAddFunding} className="space-y-2.5 text-left pt-1 font-sans">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Add Project Income</span>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingFunding(false)} 
                    className="text-slate-450 hover:text-amber-400 font-bold"
                  >
                    Cancel
                  </button>
                </div>
                <div className="space-y-1">
                  <input
                    type="number"
                    required
                    placeholder="Amount to Add (₹ INR)"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-705 text-white placeholder-slate-500 text-[11px] py-1.5 px-2 rounded-lg focus:outline-hidden focus:border-emerald-400 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Source (e.g. Owner Capital, Milestone 2)"
                    value={fundingSource}
                    onChange={(e) => setFundingSource(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-705 text-white placeholder-slate-500 text-[11px] py-1.5 px-2 rounded-lg focus:outline-hidden focus:border-emerald-400 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <textarea
                    placeholder="Custom Funding Notes or Remarks..."
                    value={fundingNotes}
                    onChange={(e) => setFundingNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-705 text-white placeholder-slate-500 text-[11px] py-1.5 px-2 rounded-lg focus:outline-hidden focus:border-emerald-400 resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[10px] py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-all uppercase cursor-pointer tracking-widest"
                >
                  Confirm & Add Money
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Grid of related sub-datasets */}
      <div id="detail-related-datasets" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* customized funding received ledger card */}
        <div id="detail-funding-card" className="bg-white p-6 rounded-2xl border border-slate-205 shadow-xs space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900 text-md flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-500" />
              <span>Custom Funding & Capital Addition Logs ({projectFundingList.length})</span>
            </h3>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-100">
              Total Added: {formatRupees(totalFundingReceived)}
            </span>
          </div>

          <div className="overflow-y-auto max-h-[220px] space-y-2.5">
            {projectFundingList.length > 0 ? (
              projectFundingList.slice().reverse().map(item => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1 text-xs text-left">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{item.vendor}</span>
                    <span className="font-mono font-extrabold text-emerald-600">+{formatRupees(item.amount)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 font-sans leading-relaxed">
                    <strong>Funding Notes:</strong> "{item.description}"
                  </p>
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-0.5">
                    <span>Voucher ID: {item.id}</span>
                    <span>Received Date: {item.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-10 text-center font-medium italic">
                No custom funding additions or milestone payments recorded yet. Use the sidebar controller to add funds with custom notes.
              </p>
            )}
          </div>
        </div>

        {/* materials section */}
        <div id="detail-materials-card" className="bg-white p-6 rounded-2xl border border-slate-205 shadow-xs space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900 text-md flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-amber-500" />
              <span>Associated Materials Log ({projectMaterials.length})</span>
            </h3>
            <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded text-slate-700">
              Allocated: {formatRupees(totalMaterialsCost)}
            </span>
          </div>

          <div className="overflow-x-auto">
            {projectMaterials.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50 uppercase rounded">
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Sum Val (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {projectMaterials.map(m => (
                    <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{m.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">{m.quantityOrdered}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          m.status === 'Received' ? 'bg-emerald-50 text-emerald-600' :
                          m.status === 'Ordered' ? 'bg-indigo-50 text-indigo-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatRupees(m.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No explicit materials mapped under this project.</p>
            )}
          </div>
        </div>

        {/* daily attendance workers checklist links */}
        <div id="detail-attendance-card" className="bg-white p-6 rounded-2xl border border-slate-205 shadow-xs space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900 text-md flex items-center gap-2">
              <HardHat className="w-5 h-5 text-amber-500" />
              <span>Labour Logs ({projectAttendance.length} register entries)</span>
            </h3>
            <span className="text-xs font-mono font-semibold text-slate-500 font-mono">
              {uniquePersonnelToday.length} Active Staff Checked in
            </span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {projectAttendance.length > 0 ? (
              projectAttendance.slice(0, 7).map(a => {
                const staff = team.find(t => t.id === a.memberId);
                return (
                  <div key={a.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-sans">
                    <div>
                      <div className="font-semibold text-slate-800">{staff ? staff.name : 'Unknown Laborer'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{staff?.role || 'Labour'} • Date: {a.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        a.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-120' :
                        a.status === 'Half Day' ? 'bg-amber-50 text-amber-600 border border-amber-120' :
                        'bg-rose-50 text-rose-600 border border-rose-120'
                      }`}>
                        {a.status}
                      </span>
                      <span className="font-mono font-bold text-slate-900">{formatRupees(a.wages)} Earned</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No daily timesheet records matching this project ID.</p>
            )}
          </div>
        </div>

        {/* Meetings log MOM */}
        <div id="detail-meetings-card" className="bg-white p-6 rounded-2xl border border-slate-205 shadow-xs space-y-4 lg:col-span-2">
          <h3 className="font-bold text-slate-900 text-md flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>Project Schedule & Minutes of Meeting (MOM)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectMeetings.length > 0 ? (
              projectMeetings.map(m => (
                <div key={m.id} className="p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl transition-all space-y-2 font-sans">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-[10px] text-amber-500 font-semibold">{m.id}</span>
                    <span className="font-mono font-medium text-slate-400">{m.date}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{m.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-3">
                      <strong>Notes:</strong> {m.minutes}
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                    <strong>Attendees:</strong> {m.attendees}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 text-xs text-slate-400 py-6 text-center">
                No meeting logs compiled under this project site ID yet.
              </div>
            )}
          </div>
        </div>

        {/* site photos */}
        <div id="detail-photos-card" className="bg-white p-6 rounded-2xl border border-slate-205 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900 text-md flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              <span>Camera Logs & Invoice Bill Copies ({projectPhotos.length})</span>
            </h3>
            <div className="flex items-center gap-3">
              <button 
                id="btn-goto-site-photos"
                onClick={() => setCurrentTab('site-photos')}
                className="text-amber-650 hover:text-amber-700 font-bold text-xs transition-all"
              >
                Site Photos →
              </button>
              <span className="text-slate-300">|</span>
              <button 
                id="btn-goto-bill-photos"
                onClick={() => setCurrentTab('bill-photos')}
                className="text-indigo-600 hover:text-indigo-700 font-bold text-xs transition-all"
              >
                Bill Photos →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {projectPhotos.length > 0 ? (
              projectPhotos.map(p => (
                <div key={p.id} className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-105 h-36 flex flex-col justify-between">
                  <img 
                    src={p.imageUrl} 
                    alt={p.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-all" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-900/10 to-transparent p-2 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-[8px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-bold self-start mt-0.5">
                      {p.type}
                    </span>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-amber-400 font-semibold block truncate leading-tight font-sans">
                        {p.title}
                      </span>
                      <span className="text-[8px] text-slate-300 block font-mono">
                        {new Date(p.uploadedAt).toISOString().slice(0, 10)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 sm:col-span-4 text-xs text-slate-400 py-6 text-center">
                No site photographs or invoice bills archived for this project ID.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* PHOTO UPLOAD POPUP MODAL */}
      {isPhotoModalOpen && (
        <div id="add-photo-modal" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-250 w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm tracking-wide">Archive Image File on {project.name}</h3>
                <p className="text-[10px] text-slate-400 font-medium font-sans">Track site activities or backup cash bills.</p>
              </div>
              <button onClick={() => setIsPhotoModalOpen(false)} className="text-white text-xs hover:text-amber-400">
                ✕
              </button>
            </div>

            <form onSubmit={submitPhotoUpload} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Image Caption / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Excavation complete or Concrete Bill copy"
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-amber-400 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scan Classification</label>
                <select
                  value={photoType}
                  onChange={(e) => setPhotoType(e.target.value as 'Progress' | 'Bill')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                >
                  <option value="Progress">Progress Photograph (Field Work)</option>
                  <option value="Bill">Bill Scan / Invoice Voucher (Accounting Backup)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Photo / Scan File *</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
                />
                {photoBase64 && (
                  <div className="mt-2 border border-slate-200 rounded p-1">
                    <img 
                      src={photoBase64} 
                      alt="Preview" 
                      className="h-20 w-auto object-cover rounded mx-auto" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1 font-sans">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description Comments</label>
                <textarea
                  rows={2}
                  placeholder="Additional context on layout checks or concrete grading values..."
                  value={photoDesc}
                  onChange={(e) => setPhotoDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="text-xs text-slate-450 hover:text-slate-600 transition-all font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer shadow-amber-500/10"
                >
                  Confirm Upload & Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
