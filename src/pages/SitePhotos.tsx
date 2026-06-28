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
  Download,
  Calendar,
  X
} from 'lucide-react';
import { ProjectPhoto } from '../types';

export default function SitePhotos() {
  const { photos, projects, addPhoto, deletePhoto } = useApp();
  
  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pTitle, setPTitle] = useState('');
  const [pProj, setPProj] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pBase64, setPBase64] = useState('');

  // Expanded View Modal State
  const [expandedPhotoId, setExpandedPhotoId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // File Upload Helper
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

  // Download Trigger
  const handleDownload = (photo: ProjectPhoto) => {
    const link = document.createElement('a');
    link.href = photo.imageUrl;
    link.download = `SitePhoto_${photo.title.replace(/\s+/g, '_') || 'image'}_${photo.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form Submit (Auto progress type)
  const handleUploadPhotoMain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle || !pBase64) return;

    addPhoto({
      projectId: pProj || (projects[0]?.id || 'GENERAL'),
      title: pTitle,
      type: 'Progress', // Force "Progress" for Site Photos page
      imageUrl: pBase64,
      description: pDesc
    });

    setPTitle('');
    setPProj('');
    setPDesc('');
    setPBase64('');
    setIsModalOpen(false);
  };

  // Filter site photos (type === 'Progress')
  const filteredPhotos = photos.filter(p => {
    // Only site photos
    if (p.type !== 'Progress') return false;

    // Project Filter
    const matchesProj = selectedProjectId === 'All' ? true : p.projectId === selectedProjectId;
    
    // Date Range Filter
    const photoDate = p.uploadedAt.slice(0, 10); // YYYY-MM-DD
    const matchesStartDate = startDate ? photoDate >= startDate : true;
    const matchesEndDate = endDate ? photoDate <= endDate : true;

    // Search Text Filter
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());

    return matchesProj && matchesStartDate && matchesEndDate && matchesSearch;
  });

  const getProjAbbr = (projId: string) => {
    return projects.find(p => p.id === projId)?.name || 'General Inventory';
  };

  const activeExpandedPhoto = photos.find(p => p.id === expandedPhotoId);

  return (
    <div id="site-photos-page" className="space-y-6 animate-fade-in font-sans text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="site-photos-title" className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Camera className="w-7 h-7 text-amber-500" />
            <span>Site Progress Photos</span>
          </h1>
          <p className="text-sm text-slate-500">
            Monitor physical progress, foundation steps, brickwork, and finishes with timestamped site photos.
          </p>
        </div>
        <button
          id="btn-upload-site-photo"
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Camera className="w-4 h-4 text-amber-400 stroke-[2.5]" />
          <span>Upload Site Progress Photo</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* Project Selector */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Project Site</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:outline-none text-xs py-2 px-3 rounded-lg text-slate-800 font-medium"
            >
              <option value="All">-- All Project Sites --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">From Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none rounded-lg text-xs font-mono font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Date Range End */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">To Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none rounded-lg text-xs font-mono font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Search caption */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Search Captions</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search captions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:outline-none rounded-lg text-xs font-medium"
              />
            </div>
          </div>

        </div>

        {/* Clear Filters Helper */}
        {(selectedProjectId !== 'All' || startDate || endDate || search) && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSelectedProjectId('All');
                setStartDate('');
                setEndDate('');
                setSearch('');
              }}
              className="text-[10px] text-slate-500 hover:text-amber-600 font-bold flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Site Photos Gallery Grid */}
      <div id="site-photos-gallery-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
        {filteredPhotos.length > 0 ? (
          filteredPhotos.map(p => (
            <div 
              key={p.id} 
              id={`site-photo-${p.id}`}
              className="group bg-white border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Image Container Frame */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img 
                  src={p.imageUrl} 
                  alt={p.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all" 
                  referrerPolicy="no-referrer"
                />
                
                {/* ID Badge */}
                <span className="absolute left-3 top-3 text-[9px] font-bold bg-amber-400 text-slate-950 px-2 py-1 rounded shadow-sm font-mono">
                  {p.id}
                </span>

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-slate-900/45 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <button
                    onClick={() => setExpandedPhotoId(p.id)}
                    className="p-2.5 bg-white text-slate-900 rounded-full shadow hover:bg-slate-50 transition-all cursor-pointer"
                    title="View Photo"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(p)}
                    className="p-2.5 bg-amber-500 text-slate-950 rounded-full shadow hover:bg-amber-400 transition-all cursor-pointer"
                    title="Download Photo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {deletingId === p.id ? (
                    <div className="flex items-center gap-1 bg-red-600 p-1 rounded-full shadow-lg">
                      <button
                        onClick={() => {
                          deletePhoto(p.id);
                          setDeletingId(null);
                        }}
                        className="bg-red-800 text-white text-[9px] font-bold px-2 py-1 rounded-full cursor-pointer hover:bg-red-900 transition-all"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="bg-white text-slate-800 text-[9px] font-bold px-2 py-1 rounded-full cursor-pointer hover:bg-slate-100 transition-all"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(p.id)}
                      className="p-2.5 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Caption & Metadata Footer */}
              <div className="p-4 space-y-1.5 bg-white font-sans">
                <h4 className="font-bold text-slate-900 truncate leading-snug">{p.title}</h4>
                <p className="text-[10px] text-slate-500 font-semibold" title={getProjAbbr(p.projectId)}>
                  📍 {getProjAbbr(p.projectId)}
                </p>
                {p.description && (
                  <p className="text-[10px] text-slate-500 italic font-normal line-clamp-1">
                    "{p.description}"
                  </p>
                )}
                <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span>Progress Scan</span>
                  <span>{new Date(p.uploadedAt).toISOString().slice(0, 10)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-1 md:col-span-4 bg-white p-12 text-center rounded-2xl border flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300" />
            <h3 className="font-bold text-slate-800 text-sm">No Site Photos Found</h3>
            <p className="text-xs text-slate-400">Try adjusting your filters, selecting a different date range, or upload a new photo.</p>
          </div>
        )}
      </div>

      {/* UPLOAD SITE PHOTO MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 no-print animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden w-full max-w-sm max-h-[90vh] flex flex-col animate-scale-up">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-sm tracking-wide">Upload Progress Photo</h3>
                <p className="text-[10px] text-slate-400 font-semibold font-sans">Save high-quality visual progress logs from the field.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-amber-400 font-bold text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadPhotoMain} className="p-5 space-y-4 font-sans text-xs overflow-y-auto">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Photo Title / Caption *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Floor Slab Casting"
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2.5 px-3 rounded-lg font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Associated Project Site</label>
                <select
                  value={pProj}
                  onChange={(e) => setPProj(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg focus:outline-none"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Photo File *</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={handleFileChangeLocal}
                  className="w-full text-xs text-slate-500 file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:rounded cursor-pointer focus:outline-none"
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Describe material levels, current progress details, or contractor remarks..."
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-all font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Upload &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL SCREEN PHOTO EXPANDED MODAL */}
      {expandedPhotoId && activeExpandedPhoto && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 no-print flex-col gap-4 animate-fade-in">
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative h-[440px] bg-slate-950 flex items-center justify-center">
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
            
            <div className="p-6 text-white space-y-3 font-sans">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Ref: <strong className="font-mono text-amber-400">{activeExpandedPhoto.id}</strong></span>
                <span className="font-mono">{new Date(activeExpandedPhoto.uploadedAt).toLocaleString('en-IN')}</span>
              </div>
              <h3 className="text-base font-bold text-white">{activeExpandedPhoto.title}</h3>
              <p className="text-slate-300 text-xs leading-relaxed">{activeExpandedPhoto.description || 'No notes saved for this site photograph.'}</p>
              
              <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[10px]">
                <div className="text-slate-400 uppercase font-bold tracking-widest">
                  Site Location: {getProjAbbr(activeExpandedPhoto.projectId)}
                </div>
                <button
                  onClick={() => handleDownload(activeExpandedPhoto)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Original</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
