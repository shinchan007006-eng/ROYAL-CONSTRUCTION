import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Search, 
  Plus, 
  CalendarDays, 
  Trash2, 
  Users, 
  Clock, 
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { MeetingNote } from '../types';

export default function Schedule() {
  const { meetings, projects, addMeetingNote, deleteMeetingNote } = useApp();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal Note state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mDate, setMDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mProjId, setMProjId] = useState('');
  const [mTitle, setMTitle] = useState('');
  const [mMinutes, setMMinutes] = useState('');
  const [mAttendees, setMAttendees] = useState('');
  const [mActions, setMActions] = useState('');

  const submitNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle || !mMinutes) return;

    addMeetingNote({
      date: mDate,
      projectId: mProjId || (projects[0]?.id || 'GENERAL'),
      title: mTitle,
      minutes: mMinutes,
      attendees: mAttendees || 'All supervisors present',
      actionItems: mActions
    });

    setMDate(new Date().toISOString().slice(0, 10));
    setMProjId('');
    setMTitle('');
    setMMinutes('');
    setMAttendees('');
    setMActions('');
    setIsModalOpen(false);
  };

  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.minutes.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase())
  );

  const getProjAbbr = (projId: string) => {
    return projects.find(p => p.id === projId)?.name || 'Central Boardroom';
  };

  return (
    <div id="schedule-page" className="space-y-6 animate-fade-in font-sans">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="schedule-header-title" className="text-2xl font-bold text-slate-900 tracking-tight">
            Schedule & Minutes of Meeting (MOM)
          </h1>
          <p className="text-sm text-slate-500">
            Log technical deliberations, site structural alignment agendas, and assign core action directives.
          </p>
        </div>
        <button
          id="btn-add-meeting"
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>Compile Site MOM Agenda</span>
        </button>
      </div>

      {/* Roster Control Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/85 flex flex-col md:flex-row md:items-center gap-4 justify-between shadow-xs">
        <div id="schedule-search-box" className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="input-schedule-search"
            type="text"
            placeholder="Search discussion topics, action items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>

        <span className="text-xs font-semibold text-slate-400 font-sans">
          MOM Indexing: <span className="text-slate-800 font-bold font-mono bg-slate-100 px-3 py-1.5 rounded">{meetings.length} Catalog records</span>
        </span>
      </div>

      {/* Agenda/Meetings listings */}
      <div id="meetings-list-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        {filteredMeetings.length > 0 ? (
          filteredMeetings.map(m => (
            <div 
              key={m.id} 
              id={`meeting-card-${m.id}`}
              className="bg-white border border-slate-200/85 p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-md hover:border-amber-400/80 transition-all font-sans group"
            >
              <div className="space-y-2">
                
                {/* Meta details */}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[9px] font-bold text-amber-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded leading-none">
                    {m.id}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold font-mono text-[11px]">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-350" />
                    <span>{m.date}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 id={`meeting-title-${m.id}`} className="font-bold text-slate-900 text-base leading-snug truncate group-hover:text-slate-950 transition-all">
                    {m.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Associated Site: <span className="text-slate-700 font-medium">{getProjAbbr(m.projectId)}</span></p>
                </div>

                <hr className="border-t border-slate-100" />

                {/* Discussions detail block */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider font-sans">Minutes of Discussion:</span>
                  <p className="text-xs text-slate-600 leading-relaxed max-h-[90px] overflow-y-auto pr-1">
                    {m.minutes}
                  </p>
                </div>

                {/* Actions Items */}
                {m.actionItems && (
                  <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-1 mt-2">
                    <span className="text-[10px] text-amber-700 uppercase font-bold flex items-center gap-1.5 tracking-wider font-sans">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Directives & Deliverables</span>
                    </span>
                    <p className="text-xs text-slate-700 font-semibold font-mono whitespace-pre-line leading-relaxed">
                      {m.actionItems}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer detail */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[140px]" title={m.attendees}>Attendees: {m.attendees}</span>
                </div>

                {deletingId === m.id ? (
                  <div className="flex items-center gap-1.5 bg-rose-50 border border-slate-200 p-0.5 rounded-lg">
                    <span className="text-[9px] text-rose-600 font-bold px-1 uppercase shrink-0">Erase MOM?</span>
                    <button
                      id={`btn-meeting-delete-yes-${m.id}`}
                      onClick={() => {
                        deleteMeetingNote(m.id);
                        setDeletingId(null);
                      }}
                      className="bg-red-650 hover:bg-red-700 text-white text-[9px] font-black px-2 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      Delete
                    </button>
                    <button
                      id={`btn-meeting-delete-no-${m.id}`}
                      onClick={() => setDeletingId(null)}
                      className="bg-slate-200 hover:bg-slate-350 text-slate-850 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    id={`btn-meeting-delete-${m.id}`}
                    onClick={() => setDeletingId(m.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-all cursor-pointer"
                    title="Delete agenda MOM"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 bg-white p-12 text-center rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-805">No Agendas Compiled</h3>
            <p className="text-xs text-slate-400 max-w-sm">Use the site dynamic agenda compiler modal above to log structural review minutes.</p>
          </div>
        )}
      </div>

      {/* AGENDA COMPILER MODAL DIALOG POPUP */}
      {isModalOpen && (
        <div id="add-meeting-modal" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 no-print animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-lg animate-slide-up">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm tracking-wide">Compile Agenda Site MOM</h3>
                <p className="text-[10px] text-slate-400 font-medium font-sans">Distribute directives, alignments and deadlines.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-amber-400 font-bold text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={submitNewNote} className="p-5 space-y-4 font-sans text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Connected Workplace Site</label>
                  <select
                    value={mProjId}
                    onChange={(e) => setMProjId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg focus:ring-2"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Meeting Date</label>
                  <input
                    type="date"
                    required
                    value={mDate}
                    onChange={(e) => setMDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg font-mono focus:ring-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discussion Topic Agenda *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Columns alignment inspection & cement batch checklist"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Minute Deliberations *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Reviewed foundations checklist, calibrated vertical columns gauge..."
                  value={mMinutes}
                  onChange={(e) => setMMinutes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Active Participants / Attendees</label>
                <input
                  type="text"
                  placeholder="e.g. PM Rajesh Kumar, Supervisor Sanjay, Mason Lead Gurpreet"
                  value={mAttendees}
                  onChange={(e) => setMAttendees(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Action Deliverables (Newline Seperated)</label>
                <textarea
                  rows={2}
                  placeholder="1. Structural clearance verification report before Tuesday (Rajesh)&#10;2. Slump bucket purchase (Sanjay)"
                  value={mActions}
                  onChange={(e) => setMActions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg font-mono"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-slate-45 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer shadow-amber-500/10"
                >
                  Save Meeting MOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
