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
  Trash2,
  Users,
  UserPlus,
  Key,
  Trash,
  Plus,
  Edit2,
  Shield,
  X
} from 'lucide-react';

export default function Settings() {
  const { 
    settings, 
    updateSettings, 
    clearAllData,
    workspaceUsers = [], 
    addWorkspaceUser, 
    updateWorkspaceUser, 
    deleteWorkspaceUser,
    currentSubUser
  } = useApp();

  const [name, setName] = useState(settings.appName);
  const [subtitle, setSubtitle] = useState(settings.appSubtitle);
  const [logo, setLogo] = useState(settings.logoUrl || '');

  // Custom sub-user forms state
  const [isEditingUser, setIsEditingUser] = useState<string | null>(null);
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState<'Admin' | 'Estimator' | 'Supervisor' | 'Viewer'>('Supervisor');
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);
  const [userErrorMsg, setUserErrorMsg] = useState<string | null>(null);
  const [showSubForm, setShowSubForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [userId: string]: boolean }>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAddOrEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserErrorMsg(null);
    setUserSuccessMsg(null);

    if (!userFormName || !userFormEmail || !userFormPassword) {
      setUserErrorMsg('All fields are strictly required.');
      return;
    }

    if (userFormPassword.length < 6) {
      setUserErrorMsg('Password should be at least 6 characters long.');
      return;
    }

    try {
      if (isEditingUser) {
        await updateWorkspaceUser(isEditingUser, {
          name: userFormName,
          email: userFormEmail.toLowerCase().trim(),
          password: userFormPassword,
          role: userFormRole
        });
        setUserSuccessMsg('Workspace user account edited & saved successfully!');
      } else {
        const isDuplicate = workspaceUsers.some(
          u => u.email.toLowerCase().trim() === userFormEmail.toLowerCase().trim()
        );
        if (isDuplicate) {
          setUserErrorMsg('A collaborator with this email address already matches a database record.');
          return;
        }

        await addWorkspaceUser({
          name: userFormName,
          email: userFormEmail.toLowerCase().trim(),
          password: userFormPassword,
          role: userFormRole
        });
        setUserSuccessMsg('New workspace sub-user created successfully! They can log in easily.');
      }

      // Reset
      setUserFormName('');
      setUserFormEmail('');
      setUserFormPassword('');
      setUserFormRole('Supervisor');
      setIsEditingUser(null);
      setShowSubForm(false);

      setTimeout(() => {
        setUserSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      setUserErrorMsg(err.message || 'Failed to save workspace user.');
    }
  };

  const startEditUser = (user: any) => {
    setIsEditingUser(user.id);
    setUserFormName(user.name);
    setUserFormEmail(user.email);
    setUserFormPassword(user.password || '');
    setUserFormRole(user.role);
    setShowSubForm(true);
    setUserErrorMsg(null);
    setUserSuccessMsg(null);
  };

  const handleCancelUserEdit = () => {
    setIsEditingUser(null);
    setUserFormName('');
    setUserFormEmail('');
    setUserFormPassword('');
    setUserFormRole('Supervisor');
    setShowSubForm(false);
    setUserErrorMsg(null);
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

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

      {/* Workspace Users Management Card Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/85 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 animate-fade-in">
              <Users className="w-5 h-5 text-amber-500" />
              <span>Workspace Users & Collaborator Accounts</span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
              Create sub-user accounts (such as Supervisors or Estimators) so your team members can log into this layout workspace instantly with their own email.
            </p>
          </div>
          
          {!showSubForm && !currentSubUser && (
            <button
              type="button"
              onClick={() => { setShowSubForm(true); setIsEditingUser(null); }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase py-2 px-3.5 rounded-lg inline-flex items-center gap-1.5 transition-all shadow-sm shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Workspace User</span>
            </button>
          )}
        </div>

        {currentSubUser ? (
          <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">Collaborator View Mode</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                You are currently logged in as <b className="text-slate-850">{currentSubUser.name}</b> with role <b className="text-amber-600">{currentSubUser.role}</b>. Managing user credentials and workspace security lists is locked for your profile. Contact the workspace primary owner to edit accounts.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Success / Error Messages inside User Section */}
            {userSuccessMsg && (
              <div className="p-3 bg-emerald-55/65 border border-emerald-100 rounded-lg text-emerald-800 text-xs font-semibold animate-fade-in flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{userSuccessMsg}</span>
              </div>
            )}

            {userErrorMsg && (
              <div className="p-3 bg-rose-55/65 border border-rose-100 rounded-lg text-rose-800 text-xs font-semibold animate-fade-in flex items-center gap-1.5">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{userErrorMsg}</span>
              </div>
            )}

            {/* Add / Edit Form Drawer */}
            {showSubForm && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-4 animate-fade-in">
                <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <span>{isEditingUser ? 'Edit User Credentials & Access Option' : 'Create New Collaborator Account'}</span>
                </h4>
                
                <form onSubmit={handleAddOrEditUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Collaborator Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={userFormName}
                      onChange={(e) => setUserFormName(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Login Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@onsite.com"
                      disabled={!!isEditingUser}
                      value={userFormEmail}
                      onChange={(e) => setUserFormEmail(e.target.value)}
                      className="w-full bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Login Password * (Min 6 Characters)</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Set custom password"
                        value={userFormPassword}
                        onChange={(e) => setUserFormPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono tracking-wide"
                      />
                      <Key className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Access Role / Permission *</label>
                    <select
                      value={userFormRole}
                      onChange={(e: any) => setUserFormRole(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold"
                    >
                      <option value="Supervisor">Supervisor (Manage project operations & attendance)</option>
                      <option value="Estimator">Estimator (Prepare proposals & billing/materials)</option>
                      <option value="Admin">Co-Administrator (Full read/write permissions)</option>
                      <option value="Viewer">Viewer (Read-only project and dashboard metrics)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleCancelUserEdit}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] uppercase py-2 px-4 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-[10px] uppercase py-2 px-5 rounded-lg inline-flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isEditingUser ? 'Save Credentials' : 'Create User'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* User List Table */}
            {workspaceUsers.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 bg-slate-50/40 rounded-xl">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span className="font-bold text-slate-450 block text-[11px] uppercase tracking-wider mb-1">No collaborators configured yet</span>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto px-4">
                  Add supervisors, engineers, trackers, or partners who can co-manage the construction database easily from other screens.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-slate-800 font-sans border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 uppercase font-mono text-[9px] text-slate-500 tracking-wider">
                      <th className="py-3 px-4 font-bold">Collaborator</th>
                      <th className="py-3 px-4 font-bold">Email</th>
                      <th className="py-3 px-4 font-bold">Password</th>
                      <th className="py-3 px-4 font-bold">Workspace Role</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {workspaceUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors text-xs">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-550 font-black text-[10px] flex items-center justify-center shrink-0 uppercase">
                            {u.name.substring(0, 2)}
                          </div>
                          <span className="truncate">{u.name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 break-all">{u.email}</td>
                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-sans">
                              {showPasswords[u.id] ? u.password : '••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="text-[10px] text-amber-600 hover:text-amber-800 font-bold"
                            >
                              {showPasswords[u.id] ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] tracking-wide inline-flex items-center gap-1 ${
                            u.role === 'Admin' 
                              ? 'bg-purple-50 text-purple-750 border border-purple-100' 
                              : u.role === 'Supervisor'
                                ? 'bg-blue-50 text-blue-750 border border-blue-100'
                                : u.role === 'Estimator'
                                  ? 'bg-amber-50 text-amber-750 border border-amber-100'
                                  : 'bg-slate-50 text-slate-750 border border-slate-100'
                          }`}>
                            <Shield className="w-3 h-3" />
                            <span>{u.role}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {deleteConfirmId === u.id ? (
                            <div className="flex gap-1.5 justify-end items-center">
                              <span className="text-[9px] font-black uppercase text-rose-600">Sure?</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteWorkspaceUser(u.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase py-1 px-2 rounded shrink-0"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9px] uppercase py-1 px-2 rounded shrink-0"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEditUser(u)}
                                className="p-1 px-2 border border-slate-200 hover:border-amber-400 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-700 inline-flex items-center gap-1 text-[10px] font-bold"
                              >
                                <Edit2 className="w-3 h-3 text-amber-500" />
                                <span>Edit Option</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(u.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg shrink-0"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
