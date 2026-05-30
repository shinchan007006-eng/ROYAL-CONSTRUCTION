import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Settings as IconSettings, 
  Save, 
  Building2, 
  CheckCircle,
  Camera,
  RotateCcw,
  Sparkles,
  Trash2
} from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, clearAllData } = useApp();

  const [name, setName] = useState(settings.appName);
  const [subtitle, setSubtitle] = useState(settings.appSubtitle);
  const [logo, setLogo] = useState(settings.logoUrl || '');

  // Custom UI success & confirm states to replace iframe-blocking alerts/confirms
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [showPurgeSuccess, setShowPurgeSuccess] = useState(false);
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);

  const handleClearAllSampleData = () => {
    clearAllData();
    setIsPurgeConfirmOpen(false);
    setShowPurgeSuccess(true);
    setTimeout(() => {
      setShowPurgeSuccess(false);
    }, 5000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitSettingsUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      appName: name,
      appSubtitle: subtitle,
      logoUrl: logo
    });
    setShowSyncSuccess(true);
    setTimeout(() => {
      setShowSyncSuccess(false);
    }, 4500);
  };

  const handleReset = () => {
    setName('Onsite Build-Pro');
    setSubtitle('Construction ERP Dashboard');
    setLogo('');
  };

  return (
    <div id="settings-page" className="max-w-2xl space-y-6 animate-fade-in font-sans text-xs">
      {/* Title */}
      <div>
        <h1 id="settings-title" className="text-2xl font-bold text-slate-900 tracking-tight">
          Application Settings & Branding
        </h1>
        <p className="text-sm text-slate-500">
          Personalize company names, descriptions, and logos that print directly on invoices and quotations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Settings configure Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-xs lg:col-span-2 space-y-6">
          <form onSubmit={submitSettingsUpdate} className="space-y-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b pb-3 border-slate-100">
              <IconSettings className="w-4.5 h-4.5 text-amber-500" />
              <span>Modify Workspace Branding</span>
            </h3>

            {/* App title */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Core Company App Name *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-setting-appname"
                  type="text"
                  required
                  placeholder="e.g. Onsite Build-Pro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>
            </div>

            {/* app sub */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block font-sans">Corporate Subtitle Label</label>
              <input
                id="input-setting-sub"
                type="text"
                placeholder="e.g. Construction ERP Dashboard"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* logo file selector */}
            <div className="space-y-2 bg-slate-50 border border-dashed p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-700">Company Identity Logo</span>
              </div>
              <p className="text-[10px] text-slate-400">Attached Base64 image files instantly override fallback headers throughout sidebars & printed quotes.</p>
              
              <input
                id="input-setting-logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full text-xs text-slate-500 file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:rounded cursor-pointer"
              />
              
              {logo && (
                <div className="mt-3 border p-1 rounded w-max bg-white flex items-center gap-3">
                  <img 
                    src={logo} 
                    alt="Branding preview" 
                    className="h-14 w-auto object-contain rounded border" 
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setLogo('')}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-850"
                  >
                    Remove Logo
                  </button>
                </div>
              )}
            </div>

            {/* success settings message */}
            {showSyncSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs font-semibold animate-fade-in flex items-center gap-1.5 shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Excellent! Workspace settings synced in real-time. Feel free to review the updated layout branding on your sidebar.</span>
              </div>
            )}

            {/* save settings actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 font-sans">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Default Config</span>
              </button>

              <button
                type="submit"
                id="btn-save-settings"
                className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-5 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-500" />
                <span>Sync Application settings</span>
              </button>
            </div>

          </form>
        </div>

        {/* Live branding card sidebar preview */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-md">
            <div>
              <h4 className="font-semibold text-amber-400 text-[10px] tracking-wider uppercase mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Branding Live Preview</span>
              </h4>
              <p className="text-[10px] text-slate-450 leading-relaxed font-sans">This illustrates how your identity displays prominently across the client layout panels immediately on sync.</p>
            </div>

            <hr className="border-t border-slate-800" />

            {/* Mock Header sample representing sidebar logo sync */}
            <div className="p-3 bg-slate-950/60 rounded-xl flex items-center gap-3 border border-slate-800">
              {logo ? (
                <img 
                  src={logo} 
                  alt="Identity live preview" 
                  className="w-10 h-10 object-cover rounded border border-amber-400"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 bg-amber-500 rounded flex items-center justify-center text-slate-950 font-black text-xs">
                  <Building2 className="w-5 h-5" />
                </div>
              )}
              <div className="flex flex-col overflow-hidden text-left">
                <span className="font-bold text-amber-400 text-sm truncate leading-snug">{name || 'Onsite Build-Pro'}</span>
                <span className="text-[10px] text-slate-400 truncate">{subtitle || 'Construction ERP Dashboard'}</span>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-450 italic leading-none text-center">Sidebar layout updates immediately.</p>
          </div>

          {/* Database Maintenance Panel */}
          <div className="bg-slate-900 border border-red-950 p-5 rounded-2xl flex flex-col gap-4 shadow-md">
            <div>
              <h4 className="font-bold text-red-500 text-[10px] tracking-wider uppercase mb-1 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Workspace Maintenance</span>
              </h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1">
                Wipe all records including Projects, Team lists, Finance entries, Materials, CRM leads, and Progress images.
              </p>
            </div>
            
            {showPurgeSuccess && (
              <div className="p-3 bg-emerald-950 border border-emerald-900 rounded-lg text-emerald-250 text-[10px] font-semibold animate-fade-in">
                All sample data has been successfully cleared! Your workspace is now clean and ready for fresh input.
              </div>
            )}

            {isPurgeConfirmOpen ? (
              <div className="bg-red-950/80 border border-red-900 p-3.5 rounded-lg space-y-3 animate-fade-in">
                <p className="text-[10px] text-red-200 font-semibold leading-relaxed">
                  Are you absolutely sure? This will irreversibly empty your local database of all projects, team members, attendance, finance, materials, CRM leads, and quotes.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClearAllSampleData}
                    className="flex-1 bg-red-650 hover:bg-red-700 text-white text-[10px] font-black py-1.5 rounded cursor-pointer text-center"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPurgeConfirmOpen(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold py-1.5 rounded cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="btn-clear-sample-data"
                type="button"
                onClick={() => setIsPurgeConfirmOpen(true)}
                className="w-full bg-red-950/45 hover:bg-red-900/60 text-red-200 border border-red-900/80 hover:border-red-600 font-bold text-[11px] py-2 px-4 rounded transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Sample Data</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
