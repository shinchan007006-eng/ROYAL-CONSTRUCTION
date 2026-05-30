import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Camera, 
  Search, 
  Plus, 
  Trash2, 
  MapPin, 
  CalendarDays, 
  Eye,
  AlertCircle,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import { ProjectPhoto } from '../types';

export default function Photos() {
  const { photos, projects, addPhoto, deletePhoto } = useApp();
  
  const [selectedProjectId, setSelectedProjectId] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Progress' | 'Bill'>('All');
  const [search, setSearch] = useState('');

  // Photo Creation Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pTitle, setPTitle] = useState('');
  const [pProj, setPProj] = useState('');
  const [pType, setPType] = useState<'Progress' | 'Bill'>('Progress');
  const [pDesc, setPDesc] = useState('');
  const [pBase64, setPBase64] = useState('');

  // Expanded focus image screen modal
  const [expandedPhotoId, setExpandedPhotoId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhotoMain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle || !pBase64) return;

    addPhoto({
      projectId: pProj || (projects[0]?.id || 'GENERAL'),
      title: pTitle,
      type: pType,
      imageUrl: pBase64,
      description: pDesc
    });

    setPTitle('');
    setPProj('');
    setPType('Progress');
    setPDesc('');
    setPBase64('');
    setIsModalOpen(false);
  };

  // Processing filters
  const filteredPhotos = photos.filter(p => {
    const matchesProj = selectedProjectId === 'All' ? true : p.projectId === selectedProjectId;
    const matchesType = typeFilter === 'All' ? true : p.type === typeFilter;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    return matchesProj && matchesType && matchesSearch;
  });

  const getProjAbbr = (projId: string) => {
    return projects.find(p => p.id === projId)?.name || 'General Inventory';
  };

  const activeExpandedPhoto = photos.find(p => p.id === expandedPhotoId);

  return (
    <div id="photos-vault-page" className="space-y-6 animate-fade-in font-sans text-xs">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="photos-page-title" className="text-2xl font-bold text-slate-900 tracking-tight">
            Site Photo Vault & Bills Scans
          </h1>
          <p className="text-sm text-slate-500">
            Archive daily field progress captures and store billing voucher records in one safe visual repo.
          </p>
        </div>
        <button
          id="btn-upload-photo-main"
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-905 hover:bg-slate-805 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Camera className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>Upload Site Image Record</span>
        </button>
      </div>

      {/* Roster Controls */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Project Selector */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Filter Project Site</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:outline-hidden text-xs py-2 px-3 rounded-lg text-slate-800"
          >
            <option value="All">-- All Workplace Sites --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
        </div>

        {/* Classification Filter */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Classification</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-200 focus:outline-hidden text-xs py-2 px-3 rounded-lg text-slate-800"
          >
            <option value="All">Both Scans & Progress</option>
            <option value="Progress">Progress Photocopy Only</option>
            <option value="Bill">Bill Scans / Invoices Only</option>
          </select>
        </div>

        {/* Captions search */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Search Captions</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search photovault caption comments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:outline-hidden rounded-lg text-xs"
            />
          </div>
        </div>

      </div>

      {/* Grid gallery */}
      <div id="photos-gallery-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
        {filteredPhotos.length > 0 ? (
          filteredPhotos.map(p => (
            <div 
              key={p.id} 
              id={`photo-card-${p.id}`}
              className="group bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Image Frame with Overlay action */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img 
                  src={p.imageUrl} 
                  alt={p.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all" 
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual badges */}
                <span className={`absolute left-3 top-3 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm ${
                  p.type === 'Progress' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-indigo-600 text-white'
                }`}>
                  {p.type}
                </span>

                {/* Inspect Overlay Trigger */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <button
                    onClick={() => setExpandedPhotoId(p.id)}
                    className="p-2.5 bg-white text-slate-900 rounded-full shadow hover:bg-slate-50 transition-all cursor-pointer"
                    title="Expand View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {deletingId === p.id ? (
                    <div className="flex items-center gap-1.5 bg-red-650 bg-opacity-95 p-1 rounded-full shadow-lg">
                      <button
                        onClick={() => {
                          deletePhoto(p.id);
                          setDeletingId(null);
                        }}
                        className="bg-red-800 text-white text-[10px] font-black px-2 py-1 rounded-full cursor-pointer hover:bg-red-950 transition-all"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="bg-white text-slate-800 text-[10px] font-black px-2 py-1 rounded-full cursor-pointer hover:bg-slate-100 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(p.id)}
                      className="p-2.5 bg-rose-600 text-white rounded-full shadow hover:bg-rose-750 transition-all cursor-pointer"
                      title="Delete Scan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Photo Description text */}
              <div className="p-4 space-y-1 bg-white font-sans">
                <span className="font-mono text-[9px] text-amber-500 font-bold block">{p.id}</span>
                <h4 className="font-bold text-slate-900 truncate leading-snug">{p.title}</h4>
                <p className="text-[10px] text-slate-400 truncate font-semibold" title={getProjAbbr(p.projectId)}>
                  {getProjAbbr(p.projectId)}
                </p>
                {p.description && <p className="text-[10px] text-slate-500 italic mt-1 font-normal line-clamp-1">"{p.description}"</p>}
                
                <span className="text-[9px] text-slate-400 font-mono block pt-1.5 border-t border-slate-50 text-right font-medium">
                  {new Date(p.uploadedAt).toISOString().slice(0, 10)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-4 bg-white p-12 text-center rounded-2xl border flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-350" />
            <h3 className="font-bold text-slate-800">Photo Vault holds no matches</h3>
            <p className="text-xs text-slate-400">Refine search criteria or load commodity photos above.</p>
          </div>
        )}
      </div>

      {/* CREATE PHOTO FILE MODAL */}
      {isModalOpen && (
        <div id="photos-upload-modal-view" className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-sm animate-slide-up">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm tracking-wide">Cabinet Image Upload</h3>
                <p className="text-[10px] text-slate-400 font-semibold font-sans">Backup progress steps or delivery receipts.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-amber-400 font-bold text-xs style-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadPhotoMain} className="p-5 space-y-4 font-sans text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Image Title Caption *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower B Foundations completed"
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 text-slate-850 text-xs py-2.5 px-3 rounded-lg font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Attached Workplace</label>
                <select
                  value={pProj}
                  onChange={(e) => setPProj(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 text-slate-805 text-xs py-2 px-3 rounded-lg"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Scan Category</label>
                <select
                  value={pType}
                  onChange={(e) => setPType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-205 text-slate-805 text-xs py-2 px-3 rounded-lg"
                >
                  <option value="Progress">Progress Photocopy (Field Activity)</option>
                  <option value="Bill">Bill/Invoice Scans (Financial Ledger Backup)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Select Photograph File *</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleFileChangeLocal}
                  className="w-full text-xs text-slate-500 file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:rounded cursor-pointer"
                />
                {pBase64 && (
                  <div className="mt-2 border p-1 rounded bg-slate-50 text-center">
                    <img 
                      src={pBase64} 
                      alt="Preview upload" 
                      className="h-20 w-auto object-cover rounded mx-auto" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1 font-sans">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Brief Details</label>
                <textarea
                  rows={2}
                  placeholder="Record slump values, contractor signatures, or brick courses count..."
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-slate-45 transition-all font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer shadow-amber-500/10"
                >
                  Confirm Upload & Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL SCREEN PHOTO EXPANDED MODAL */}
      {expandedPhotoId && activeExpandedPhoto && (
        <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center p-4 z-50 no-print flex-col gap-4">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="relative h-[440px] bg-slate-950">
              <img 
                src={activeExpandedPhoto.imageUrl} 
                alt={activeExpandedPhoto.title} 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setExpandedPhotoId(null)}
                className="absolute right-4 top-4 bg-slate-950/70 hover:bg-slate-950 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold cursor-pointer hover:text-amber-400"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 text-white space-y-2 font-sans">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Ref: <strong className="font-mono text-amber-400">{activeExpandedPhoto.id}</strong></span>
                <span className="font-mono">{new Date(activeExpandedPhoto.uploadedAt).toLocaleString()}</span>
              </div>
              <h3 className="text-base font-bold text-white">{activeExpandedPhoto.title}</h3>
              <p className="text-slate-300 text-xs leading-relaxed">{activeExpandedPhoto.description || 'No descriptive comments saved on this capture.'}</p>
              
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-450 uppercase font-black tracking-widest">
                <span>Associated: {getProjAbbr(activeExpandedPhoto.projectId)}</span>
                <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md">{activeExpandedPhoto.type} SCAN</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
