import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupees } from '../utils/format';
import { 
  CalendarDays, 
  MapPin, 
  Save, 
  Check, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  HardHat, 
  BookOpen, 
  Trash2,
  ListFilter
} from 'lucide-react';
import { TeamMember, AttendanceStatus } from '../types';

export default function Attendance() {
  const { 
    projects, 
    team, 
    attendance, 
    saveBulkAttendance, 
    deleteAttendance 
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Temporary container state for active attendance edits
  // Map of memberId -> status/notes
  const [sessionRoster, setSessionRoster] = useState<{
    [memberId: string]: { status: AttendanceStatus; notes: string; dailyRate: number }
  }>({});

  // Fetch active project's workers
  const eligibleWorkers = team.filter(t => t.assignedProjectId === selectedProjectId);

  // Sync session roster when project or date changes
  useEffect(() => {
    if (!selectedProjectId) {
      setSessionRoster({});
      return;
    }

    // Check if attendance already recorded for this project and date
    const existingRecords = attendance.filter(
      a => a.projectId === selectedProjectId && a.date === selectedDate
    );

    const initialRoster: typeof sessionRoster = {};

    eligibleWorkers.forEach(w => {
      const existing = existingRecords.find(e => e.memberId === w.id);
      if (existing) {
        initialRoster[w.id] = {
          status: existing.status,
          notes: existing.notes || '',
          dailyRate: existing.dailyRate
        };
      } else {
        initialRoster[w.id] = {
          status: 'Absent', // default to Absent
          notes: '',
          dailyRate: w.dailyRate
        };
      }
    });

    setSessionRoster(initialRoster);
  }, [selectedProjectId, selectedDate, team, attendance]);

  // Set default project on load if not set
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const updateWorkerStatus = (memberId: string, status: AttendanceStatus) => {
    setSessionRoster(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        status
      }
    }));
  };

  const updateWorkerNotes = (memberId: string, notes: string) => {
    setSessionRoster(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        notes
      }
    }));
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    const recordsToSave = Object.keys(sessionRoster).map(mId => ({
      date: selectedDate,
      memberId: mId,
      projectId: selectedProjectId,
      status: sessionRoster[mId].status,
      dailyRate: sessionRoster[mId].dailyRate,
      notes: sessionRoster[mId].notes
    }));

    saveBulkAttendance(selectedDate, recordsToSave);
    alert(`Success! Daily attendance sheet for ${selectedDate} synced into project budget calculations.`);
  };

  // Calculate session totals
  const totalSessionCost = Object.keys(sessionRoster).reduce((sum, key) => {
    const item = sessionRoster[key];
    if (item.status === 'Present') return sum + item.dailyRate;
    if (item.status === 'Half Day') return sum + Math.round(item.dailyRate * 0.5);
    return sum;
  }, 0);

  // Historic audit log of attendance sheets sorted chronologically
  const sortedAttendanceHistory = [...attendance].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div id="attendance-page" className="space-y-8 animate-fade-in font-sans">
      
      {/* Title */}
      <div>
        <h1 id="attendance-title" className="text-2xl font-bold text-slate-900 tracking-tight">
          Labour Daily Attendance & Wages Bookkeeping
        </h1>
        <p className="text-sm text-slate-500">
          Mark site-specific present/absent logs. Labor wages instantly charge as actual site expenses onto project cost limits.
        </p>
      </div>

      {/* Main Form Roster Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Day check-in panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-xs lg:col-span-2 space-y-6">
          <form onSubmit={handleBulkSubmit} className="space-y-6">
            
            {/* Choose parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Work Site</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    id="select-attendance-project"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-white pl-9 pr-3 py-2 border border-slate-200 text-slate-800 text-sm rounded-lg"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Booking Date</label>
                <div className="relative">
                  <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-attendance-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-white pl-9 pr-3 py-2 border border-slate-200 text-slate-800 text-sm rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Workers Slate */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <HardHat className="w-4.5 h-4.5 text-amber-500" />
                  <span>Labor Roster Deployment ({eligibleWorkers.length} assigned)</span>
                </h3>
                <span className="text-xs bg-amber-500/10 text-amber-700 font-bold px-2.5 py-1 rounded">
                  Session wage total: {formatRupees(totalSessionCost)}
                </span>
              </div>

              {eligibleWorkers.length > 0 ? (
                <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {eligibleWorkers.map(worker => {
                    const status = sessionRoster[worker.id]?.status || 'Absent';
                    const notes = sessionRoster[worker.id]?.notes || '';
                    return (
                      <div key={worker.id} id={`roster-worker-${worker.id}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50">
                        {/* Name and Role */}
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-slate-850 block">{worker.name}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                            {worker.role} • {formatRupees(worker.dailyRate)}/day
                          </span>
                        </div>

                        {/* Status Selectors */}
                        <div className="flex flex-wrap gap-1">
                          {(['Present', 'Half Day', 'Absent', 'Leave'] as const).map(option => {
                            const isSelected = status === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                id={`btn-status-${worker.id}-${option}`}
                                onClick={() => updateWorkerStatus(worker.id, option)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isSelected 
                                    ? option === 'Present' ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-sm' :
                                      option === 'Half Day' ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-sm' :
                                      option === 'Leave' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                                      'bg-slate-350 border-slate-400 text-slate-700'
                                    : 'bg-white border-slate-150 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>

                        {/* Small Remarks Box */}
                        <div>
                          <input
                            type="text"
                            placeholder="Add task details..."
                            value={notes}
                            onChange={(e) => updateWorkerNotes(worker.id, e.target.value)}
                            className="bg-slate-50/70 border border-slate-150 py-1.5 px-3 rounded-lg text-xs w-full sm:w-44 focus:bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50/60 p-8 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="font-semibold text-slate-800 text-xs">No Crew Allocated to this Workplace</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Go to the Labor Directory tab and allocate crew members to {projects.find(p => p.id === selectedProjectId)?.name || 'this codebase'} before tracking.
                  </p>
                </div>
              )}
            </div>

            {/* Save Buttons */}
            {eligibleWorkers.length > 0 && (
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  id="btn-save-attendance-sheet"
                  className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-5 rounded-xl inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Save Attendance Sheet (₹ Auto Cost reduction)</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Dynamic Wage reductions card info panel */}
        <div className="space-y-6">
          {/* Quick Business Rules Infobox */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-750 flex flex-col justify-between h-max gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-15">
              <HardHat className="w-32 h-32 text-amber-400" />
            </div>
            
            <div className="space-y-1">
              <h4 className="font-bold text-amber-400 text-xs uppercase tracking-widest">Wages Mechanics</h4>
              <h3 className="font-bold text-md text-slate-100">Dynamic Cost Integrations</h3>
            </div>
            
            <ul className="text-xs text-slate-300 space-y-2 pt-1 font-sans">
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Present:</strong> Full day worker daily wage charged (100% deduction to remaining project budget balance).</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Half Day:</strong> 50% daily rate subtracted from site.</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Absent/Leave:</strong> No cost recorded, wage remains 0 for that period.</span>
              </li>
            </ul>
          </div>

          {/* Historical register list (Recent Entries) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider flex items-center gap-1.5 h-max">
              <BookOpen className="w-4 h-4" />
              <span>Recent Entries Feed ({sortedAttendanceHistory.length})</span>
            </h3>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {sortedAttendanceHistory.length > 0 ? (
                sortedAttendanceHistory.slice(0, 10).map(item => {
                  const workerName = team.find(t => t.id === item.memberId)?.name || 'Unknown Tradesman';
                  const projLabel = projects.find(p => p.id === item.projectId)?.name.split(' ')[0] || 'Unknown';
                  
                  return (
                    <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between font-sans relative group">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold block">{item.date} • {projLabel}</span>
                        <span className="font-bold text-xs text-slate-800 leading-none">{workerName}</span>
                        {item.notes && <p className="text-[9px] text-slate-400 italic">"{item.notes}"</p>}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1 rounded ${
                          item.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                          item.status === 'Half Day' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {item.status[0]} {/* P, H, A */}
                        </span>
                        <span className="font-bold text-xs text-slate-900 font-mono text-right">{formatRupees(item.wages)}</span>
                        
                        {deletingId === item.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 border border-slate-200 p-0.5 rounded-md">
                            <span className="text-[8px] text-rose-600 font-bold px-0.5">Del?</span>
                            <button
                              onClick={() => {
                                deleteAttendance(item.id);
                                setDeletingId(null);
                              }}
                              className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded cursor-pointer leading-none"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="bg-slate-200 text-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer leading-none"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setDeletingId(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer ml-1 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No daily sheets recorded.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
