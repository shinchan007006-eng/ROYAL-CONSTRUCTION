import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  googleSignIn, 
  logout, 
  initAuth, 
  getAccessToken,
  db 
} from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { 
  Cloud, 
  CloudDownload, 
  CloudUpload, 
  CheckCircle, 
  AlertTriangle, 
  FolderSync, 
  Trash2, 
  Database, 
  FolderLock, 
  Smartphone, 
  Download, 
  RefreshCcw, 
  ExternalLink,
  ShieldCheck,
  User as UserIcon,
  RotateCcw
} from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size?: string;
}

export default function CloudSync() {
  const { 
    projects, 
    team, 
    attendance, 
    finance, 
    materials, 
    meetings, 
    crmLeads, 
    quotations, 
    photos, 
    settings, 
    importSetupData 
  } = useApp();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Status & loading indicators
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);
  const [isFirebaseRestoring, setIsFirebaseRestoring] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<{ success?: string; error?: string }>({});
  
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveStatus, setDriveStatus] = useState<{ success?: string; error?: string }>({});
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);

  // Modals / Confirmations
  const [confirmRestoreSource, setConfirmRestoreSource] = useState<'firebase' | 'drive' | null>(null);
  const [restoreDriveFileId, setRestoreDriveFileId] = useState<string | null>(null);

  // Initialize Auth listeners
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        setNeedsAuth(false);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Whenever we get a valid access token, auto-fetch files list from Google Drive
  useEffect(() => {
    if (accessToken) {
      loadDriveBackups();
    } else {
      setDriveFiles([]);
    }
  }, [accessToken]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setFirebaseStatus({});
    setDriveStatus({});
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setFirebaseStatus({ error: `Authentication failed: ${err.message || err}` });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
      setDriveFiles([]);
    } catch (err: any) {
      console.error('Logout failed:', err);
    }
  };

  // ==================== FIREBASE BACKUP & RESTORE ====================

  const backupToFirebase = async () => {
    if (!currentUser) return;
    setIsFirebaseSyncing(true);
    setFirebaseStatus({});
    try {
      const docRef = doc(db, 'workspaces', currentUser.uid);
      const payload = {
        projects,
        team,
        attendance,
        finance,
        materials,
        meetings,
        crmLeads,
        quotations,
        photos,
        settings,
        syncedAt: new Date().toISOString(),
        ownerEmail: currentUser.email,
        ownerName: currentUser.displayName
      };

      await setDoc(docRef, payload);
      setFirebaseStatus({ success: 'Successfully saved entire workspace database backup to Firebase Firestore!' });
      
      // Clear message after 5s
      setTimeout(() => setFirebaseStatus(prev => ({ ...prev, success: undefined })), 5000);
    } catch (err: any) {
      console.error('Firebase save error:', err);
      setFirebaseStatus({ error: `Firestore Backup Failed: ${err.message || err}` });
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const restoreFromFirebase = async () => {
    if (!currentUser) return;
    setIsFirebaseRestoring(true);
    setFirebaseStatus({});
    setConfirmRestoreSource(null);
    try {
      const docRef = doc(db, 'workspaces', currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setFirebaseStatus({ error: 'No backup found in Firestore. Please sync/backup first!' });
        setIsFirebaseRestoring(false);
        return;
      }

      const data = docSnap.data();
      importSetupData({
        projects: data.projects || [],
        team: data.team || [],
        attendance: data.attendance || [],
        finance: data.finance || [],
        materials: data.materials || [],
        meetings: data.meetings || [],
        crmLeads: data.crmLeads || [],
        quotations: data.quotations || [],
        photos: data.photos || [],
        settings: data.settings
      });

      setFirebaseStatus({ success: 'Workspace database fully restored from Firebase Firestore snapshot!' });
      setTimeout(() => setFirebaseStatus(prev => ({ ...prev, success: undefined })), 5000);
    } catch (err: any) {
      console.error('Firebase load error:', err);
      setFirebaseStatus({ error: `Firestore Restore Failed: ${err.message || err}` });
    } finally {
      setIsFirebaseRestoring(false);
    }
  };

  // ==================== GOOGLE DRIVE BACUP & RESTORE ====================

  const loadDriveBackups = async () => {
    if (!accessToken) return;
    setIsDriveLoading(true);
    try {
      // Query specific file metadata
      const query = encodeURIComponent("name contains 'onsite_build_pro_backup' and trashed = false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,size)&orderBy=createdTime%20desc`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file list: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.error('Drive listing error:', err);
      setDriveStatus({ error: `Failed to load Drive backups: ${err.message}` });
    } finally {
      setIsDriveLoading(false);
    }
  };

  const backupToDrive = async () => {
    if (!accessToken) return;
    setIsDriveSyncing(true);
    setDriveStatus({});
    try {
      const timestamp = new Date().toLocaleString('en-IN').replace(/[/,:]/g, '-');
      const backupFilename = `onsite_build_pro_backup_${timestamp}.json`;
      
      const fileData = {
        source: 'Onsite Build-Pro Construction ERP Backup',
        timestamp: new Date().toISOString(),
        projects,
        team,
        attendance,
        finance,
        materials,
        meetings,
        crmLeads,
        quotations,
        photos,
        settings
      };

      const metadata = {
        name: backupFilename,
        mimeType: 'application/json',
        description: 'Auto-generated backup from Onsite Build-Pro Construction ERP Dashboard'
      };

      const boundary = 'onsite_build_pro_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;
      
      const mediaBody = JSON.stringify(fileData);
      const compositeBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        mediaBody +
        closeDelimiter;

      const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: compositeBody
      });

      if (!response.ok) {
        throw new Error(`Google Drive API returned error code ${response.status}`);
      }

      setDriveStatus({ success: `Successfully created Google Drive cloud backup: ${backupFilename}` });
      loadDriveBackups(); // Refresh files list
      setTimeout(() => setDriveStatus(prev => ({ ...prev, success: undefined })), 5000);
    } catch (err: any) {
      console.error('Drive upload aborted:', err);
      setDriveStatus({ error: `Google Drive upload failed: ${err.message || err}` });
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const restoreFromDriveFile = async (fileId: string) => {
    if (!accessToken) return;
    setIsDriveLoading(true);
    setDriveStatus({});
    setConfirmRestoreSource(null);
    setRestoreDriveFileId(null);
    try {
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download backup file: ${response.statusText}`);
      }

      const backupObj = await response.json();
      
      // Simple validation of file structure
      if (!backupObj.source && !backupObj.projects && !backupObj.team) {
        throw new Error('Downloaded backup file does not appear to be a valid Onsite Build-Pro configuration file.');
      }

      importSetupData({
        projects: backupObj.projects || [],
        team: backupObj.team || [],
        attendance: backupObj.attendance || [],
        finance: backupObj.finance || [],
        materials: backupObj.materials || [],
        meetings: backupObj.meetings || [],
        crmLeads: backupObj.crmLeads || [],
        quotations: backupObj.quotations || [],
        photos: backupObj.photos || [],
        settings: backupObj.settings
      });

      setDriveStatus({ success: 'Successfully downloaded and restored workspace data from Google Drive backup!' });
      setTimeout(() => setDriveStatus(prev => ({ ...prev, success: undefined })), 5000);
    } catch (err: any) {
      console.error('Drive backup restoration failed:', err);
      setDriveStatus({ error: `Restore aborted: ${err.message || err}` });
    } finally {
      setIsDriveLoading(false);
    }
  };

  const deleteDriveFile = async (fileId: string) => {
    if (!accessToken) return;
    const isConfirmed = window.confirm('Are choosing to permanently delete this backup document from your Google Drive? This cannot be undone.');
    if (!isConfirmed) return;

    setIsDriveLoading(true);
    setDriveStatus({});
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete Google Drive file. Code: ${response.status}`);
      }

      setDriveStatus({ success: 'Successfully erased backup file from Google Drive.' });
      loadDriveBackups(); // Refresh files list
      setTimeout(() => setDriveStatus(prev => ({ ...prev, success: undefined })), 5000);
    } catch (err: any) {
      console.error('Drive delete error:', err);
      setDriveStatus({ error: `Could not delete file: ${err.message || err}` });
    } finally {
      setIsDriveLoading(false);
    }
  };

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return 'N/A';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return 'N/A';
    const kb = bytes / 1024;
    return kb.toFixed(1) + ' KB';
  };

  return (
    <div id="cloudsync-page" className="space-y-6 max-w-4xl font-sans text-xs">
      
      {/* 1. Introductory Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 id="cloudsync-title" className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cloud className="w-7 h-7 text-amber-500 animate-pulse" />
            <span>Cloud Sync & Backup Hub</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Securely back up estimate worksheets, finances, project parameters, and team rosters onto Firebase and Google Drive.
          </p>
        </div>

        {currentUser && (
          <button
            onClick={handleLogout}
            className="self-start md:self-auto bg-slate-105 border border-slate-200 hover:bg-slate-200 font-bold px-4 py-1.5 rounded-lg text-slate-700 cursor-pointer text-[10px] uppercase tracking-wider transition-all"
          >
            Disconnect Account
          </button>
        )}
      </div>

      {/* 2. AUTHENTICATION / CONNECTION WALL GRID */}
      {needsAuth ? (
        <div className="bg-white border rounded-2xl p-8 shadow-xs flex flex-col items-center justify-center text-center space-y-5 max-w-xl mx-auto py-12 border-dashed">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <FolderLock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-sm">Google Workspace & Cloud Sync Required</h3>
            <p className="text-slate-500 leading-relaxed max-w-md text-[11px]">
              Onsite Build-Pro requests your permission to sync company databases and export client estimation documents directly to your own secure virtual locker in Firebase and Google Drive.
            </p>
          </div>

          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="gsi-material-button cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.01] transition-all"
            style={{ width: 'auto', minWidth: '220px' }}
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents font-sans font-bold text-xs" style={{ paddingLeft: '12px' }}>
                {isLoggingIn ? 'Connecting Accounts...' : 'Connect to Google Drive & Firebase'}
              </span>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* PROFILE SUMMARY BAR */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Avatar" 
                  className="w-10 h-10 object-cover rounded-full border border-amber-400" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              <div className="text-left font-sans">
                <div className="font-bold text-sm text-slate-100">{currentUser?.displayName || 'Authorized Member'}</div>
                <div className="text-[10px] text-slate-450">{currentUser?.email || 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-900 px-3 py-1.5 rounded-lg text-emerald-350 text-[10px] uppercase font-mono font-bold tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Drive & Firebase Connected</span>
            </div>
          </div>

          {/* DUAL WORKSPACE CLOUD MODULES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* MODULE A: FIREBASE REALTIME CORESET BACKUP */}
            <div className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 border-slate-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm border-b pb-2 border-slate-150">
                  <Database className="w-4.5 h-4.5 text-orange-500 shrink-0" />
                  <span>Firebase Firestore Backups</span>
                </div>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Instantly capture your local state — housing Projects, Attendance wages logs, and CRM deals — and register it in Firestore under your authenticated user record. Relational writes update instantly in high-performance cloud storage.
                </p>

                {firebaseStatus.success && (
                  <div className="bg-emerald-50 border border-emerald-150 p-2.5 rounded-lg text-emerald-800 font-semibold text-[10px] leading-relaxed my-2">
                    {firebaseStatus.success}
                  </div>
                )}
                {firebaseStatus.error && (
                  <div className="bg-rose-50 border border-rose-150 p-2.5 rounded-lg text-rose-800 font-bold text-[10px] my-2">
                    {firebaseStatus.error}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3.5 pt-2">
                <button
                  onClick={backupToFirebase}
                  disabled={isFirebaseSyncing}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-60 text-slate-950 font-black text-xs py-2 px-4 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:brightness-105 active:brightness-95 transition-all"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{isFirebaseSyncing ? 'Backing Up...' : 'Save to Firestore'}</span>
                </button>

                <button
                  onClick={() => setConfirmRestoreSource('firebase')}
                  disabled={isFirebaseRestoring}
                  className="bg-slate-50 hover:bg-slate-100 disabled:opacity-60 border border-slate-250 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>Restore</span>
                </button>
              </div>
            </div>

            {/* MODULE B: GOOGLE DRIVE BACKUPS */}
            <div className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 border-slate-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm border-b pb-2 border-slate-150">
                  <FolderSync className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                  <span>Google Drive File Locker</span>
                </div>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Write workspace backups as JSON entities directly onto your personal Google Drive account. Ideal for offline exports, security verification, and loading specific snapshot timestamps back into Onsite Build-Pro.
                </p>

                {driveStatus.success && (
                  <div className="bg-emerald-50 border border-emerald-150 p-2.5 rounded-lg text-emerald-800 font-semibold text-[10px] leading-relaxed my-2">
                    {driveStatus.success}
                  </div>
                )}
                {driveStatus.error && (
                  <div className="bg-rose-50 border border-rose-150 p-2.5 rounded-lg text-rose-800 font-bold text-[10px] my-2">
                    {driveStatus.error}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3.5 pt-2">
                <button
                  onClick={backupToDrive}
                  disabled={isDriveSyncing}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:opacity-60 text-white font-bold text-xs py-2 px-4 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:brightness-105 active:brightness-95 transition-all"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{isDriveSyncing ? 'Uploading...' : 'Save Backup to Drive'}</span>
                </button>

                <button
                  onClick={loadDriveBackups}
                  disabled={isDriveLoading}
                  className="bg-slate-50 hover:bg-slate-100 disabled:opacity-60 border border-slate-250 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  title="List backup logs inside drive repository"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* 3. DYNAMIC WORKSPACE RESTORE NOTIFICATIONS / CONFIRS */}
          {confirmRestoreSource && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3 shadow-xs animate-fade-in text-left">
              <div className="flex items-center gap-2 text-amber-850">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="font-extrabold uppercase tracking-wide">CAUTION: Destructive Workspace Restoration</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                Restoring a snapshot will <strong className="text-amber-955">IRREVERSIBLY OVERWRITE</strong> all local workspace data (Projects, Expenses, Labour rosters, Wages, CRM pipeline, Materials, and Estimates) with the selected snapshot.
              </p>
              
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => {
                    if (confirmRestoreSource === 'firebase') {
                      restoreFromFirebase();
                    } else if (confirmRestoreSource === 'drive' && restoreDriveFileId) {
                      restoreFromDriveFile(restoreDriveFileId);
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] uppercase px-4 py-2 rounded-lg cursor-pointer transition-all"
                >
                  Confirm Overwrite & Restore
                </button>
                <button
                  onClick={() => {
                    setConfirmRestoreSource(null);
                    setRestoreDriveFileId(null);
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] uppercase px-4 py-2 rounded-lg cursor-pointer transition-all"
                >
                  Abort Action
                </button>
              </div>
            </div>
          )}

          {/* 4. GOOGLE DRIVE BACKUPS DEPOSITORY LIST */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-150">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FolderSync className="w-4 h-4 text-blue-500" />
                <span>Drive Backups Ledger</span>
              </h3>
              <p className="text-slate-400 text-[10px]">Total items found: {driveFiles.length}</p>
            </div>

            {isDriveLoading ? (
              <div className="py-8 text-center text-slate-500 animate-pulse font-medium">
                Syncing with Google Drive file locker...
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="py-8 text-center text-slate-400 italic">
                No Onsite Build-Pro cloud backups were found on your Google Drive. Press <strong>"Save Backup to Drive"</strong> above to launch your first file timestamp!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="py-2">Backup Document Name</th>
                      <th className="py-2">Created Date (IST)</th>
                      <th className="py-2 text-right">Size</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {driveFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50/80 transition-all font-medium text-slate-700">
                        <td className="py-2.5 font-bold truncate max-w-[280px]" title={file.name}>
                          {file.name}
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {new Date(file.createdTime).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-500">
                          {formatSize(file.size)}
                        </td>
                        <td className="py-2.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              setConfirmRestoreSource('drive');
                              setRestoreDriveFileId(file.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded cursor-pointer transition-all duration-150"
                            title="Restore workspace snapshot from this specific Drive backup file"
                          >
                            Restore Data
                          </button>
                          
                          <button
                            onClick={() => deleteDriveFile(file.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 bg-rose-50 hover:bg-rose-100 rounded inline-flex items-center justify-center cursor-pointer transition-all duration-150"
                            title="Delete this backup from Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
      
    </div>
  );
}
