import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { googleSignInWithDrive, getAccessToken } from '../lib/firebase';
import * as XLSX from 'xlsx';
import { 
  Cloud, 
  CloudDownload, 
  CloudUpload, 
  AlertTriangle, 
  Trash2, 
  RefreshCcw, 
  ShieldCheck, 
  User as UserIcon,
  Lock,
  CheckCircle2,
  HardDrive,
  FileSpreadsheet,
  Info
} from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime?: string;
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
    importSetupData,
    authUser
  } = useApp();

  const currentUser = authUser;

  // Google Drive token & status
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Status notifications
  const [status, setStatus] = useState<{ success?: string; error?: string }>({});
  const [backupFile, setBackupFile] = useState<DriveFile | null>(null);

  // Confirmation state
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // Initialize and check for existing Google Drive permission token
  useEffect(() => {
    const checkDriveAuth = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          setAccessToken(token);
          setIsConnected(true);
          loadDriveFiles(token);
        }
      } catch (err) {
        console.error('Error checking Drive auth:', err);
      }
    };
    if (currentUser) {
      checkDriveAuth();
    } else {
      setAccessToken(null);
      setIsConnected(false);
      setBackupFile(null);
    }
  }, [currentUser]);

  // Format bytes for display
  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return 'N/A';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return kb.toFixed(1) + ' KB';
    }
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  };

  // 1. Fetch the continuous backup file from Google Drive
  const loadDriveFiles = async (token: string) => {
    setIsLoading(true);
    setStatus({});
    try {
      const q = encodeURIComponent("name = 'Onsite_Build_Pro_ERP_Backup.xlsx' and trashed = false");
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,createdTime,modifiedTime,size)`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.status === 401) {
        setAccessToken(null);
        setIsConnected(false);
        localStorage.removeItem('bt_google_drive_access_token');
        throw new Error('Google Drive session expired. Please connect your account again.');
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Failed to search Google Drive');
      }

      const data = await response.json();
      if (data.files && data.files.length > 0) {
        setBackupFile(data.files[0]);
      } else {
        setBackupFile(null);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setStatus({ error: err.message || 'Could not fetch backup file from your Google Drive.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Connect/Authorize Google Drive using current logged-in Gmail account (with login_hint)
  const handleConnect = async () => {
    setStatus({});
    try {
      const result = await googleSignInWithDrive(currentUser?.email || undefined);
      if (result?.accessToken) {
        setAccessToken(result.accessToken);
        setIsConnected(true);
        await loadDriveFiles(result.accessToken);
        setStatus({ success: 'Successfully connected to Google Drive!' });
      }
    } catch (err: any) {
      console.error('Google Drive connection failed:', err);
      let errorMsg = err.message || String(err);
      if (errorMsg.includes('popup-closed-by-user')) {
        errorMsg = 'Google authorization popup closed before completion.';
      }
      setStatus({ error: `Drive connection failed: ${errorMsg}` });
    }
  };

  // Helper to split a long string into custom chunk arrays (max 30,000 chars per cell to bypass Excel limits)
  const chunkString = (str: string, size: number) => {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push([str.substring(i, i + size)]);
    }
    return chunks;
  };

  // 3. Create or update the single Excel backup in Google Drive
  const handleBackup = async () => {
    setStatus({});
    let activeToken = accessToken;

    // If not connected yet, automatically login/authorize using the same Gmail
    if (!activeToken) {
      setIsBackingUp(true);
      try {
        const result = await googleSignInWithDrive(currentUser?.email || undefined);
        if (result?.accessToken) {
          activeToken = result.accessToken;
          setAccessToken(activeToken);
          setIsConnected(true);
        } else {
          throw new Error('Authorization required to connect Google Drive.');
        }
      } catch (err: any) {
        let errorMsg = err.message || String(err);
        if (errorMsg.includes('popup-closed-by-user')) {
          errorMsg = 'Google authorization popup closed.';
        }
        setStatus({ error: `Connection failed: ${errorMsg}` });
        setIsBackingUp(false);
        return;
      }
    }

    setIsBackingUp(true);
    try {
      // Create a brand new Excel workbook with user ERP data
      const wb = XLSX.utils.book_new();

      // Sheet 1: Overview and Statistics
      const nowString = new Date().toLocaleString('en-IN');
      const overviewData = [
        { "Onsite Build-Pro Construction ERP": "System Backup Overview", "Stats / Details": "" },
        { "Onsite Build-Pro Construction ERP": "Backup Date", "Stats / Details": nowString },
        { "Onsite Build-Pro Construction ERP": "Authorized User", "Stats / Details": currentUser?.displayName || 'Authorized User' },
        { "Onsite Build-Pro Construction ERP": "Authorized Email", "Stats / Details": currentUser?.email || 'N/A' },
        { "Onsite Build-Pro Construction ERP": "", "Stats / Details": "" },
        { "Onsite Build-Pro Construction ERP": "MODULE DATA SUMMARY", "Stats / Details": "" },
        { "Onsite Build-Pro Construction ERP": "Total Projects Logged", "Stats / Details": projects?.length || 0 },
        { "Onsite Build-Pro Construction ERP": "Total Team Roster Size", "Stats / Details": team?.length || 0 },
        { "Onsite Build-Pro Construction ERP": "Total Labor Attendance Logs", "Stats / Details": attendance?.length || 0 },
        { "Onsite Build-Pro Construction ERP": "Total Finance Entries", "Stats / Details": finance?.length || 0 },
        { "Onsite Build-Pro Construction ERP": "Total Materials Inventory Logs", "Stats / Details": materials?.length || 0 },
        { "Onsite Build-Pro Construction ERP": "Total MoM Meetings Scheduled", "Stats / Details": meetings?.length || 0 },
        { "Onsite Build-Pro Construction ERP": "Total CRM Business Leads", "Stats / Details": crmLeads?.length || 0 },
        { "Onsite Build-Pro Construction ERP": "Total Estimations / Quotations", "Stats / Details": quotations?.length || 0 }
      ];
      const wsOverview = XLSX.utils.json_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

      // Custom sheet generator to sanitize & flatten nested structures safely
      const createSanitizedSheet = (arr: any[]) => {
        if (!arr || !Array.isArray(arr) || arr.length === 0) {
          return XLSX.utils.json_to_sheet([{ "Status": "No data logged in this module" }]);
        }
        const flattened = arr.map(item => {
          const flat: any = {};
          for (const key in item) {
            if (typeof item[key] === 'object' && item[key] !== null) {
              flat[key] = JSON.stringify(item[key]);
            } else {
              flat[key] = item[key];
            }
          }
          return flat;
        });
        return XLSX.utils.json_to_sheet(flattened);
      };

      // Add actual human-readable spreadsheets
      XLSX.utils.book_append_sheet(wb, createSanitizedSheet(projects), "Projects");
      XLSX.utils.book_append_sheet(wb, createSanitizedSheet(team), "Team");
      XLSX.utils.book_append_sheet(wb, createSanitizedSheet(attendance), "Attendance");
      XLSX.utils.book_append_sheet(wb, createSanitizedSheet(finance), "Finance");
      XLSX.utils.book_append_sheet(wb, createSanitizedSheet(materials), "Materials");
      XLSX.utils.book_append_sheet(wb, createSanitizedSheet(meetings), "Meetings");
      XLSX.utils.book_append_sheet(wb, createSanitizedSheet(crmLeads), "CRM Leads");
      XLSX.utils.book_append_sheet(wb, createSanitizedSheet(quotations), "Quotations");
      if (photos && photos.length > 0) {
        XLSX.utils.book_append_sheet(wb, createSanitizedSheet(photos), "Photos Log");
      }

      // Add actual JSON backup chunked row-by-row inside __ERP_SYSTEM_BACKUP__ to allow perfect restoration
      const rawPayload = JSON.stringify({
        source: 'Onsite Build-Pro Construction ERP Backup',
        timestamp: new Date().toISOString(),
        projects: projects || [],
        team: team || [],
        attendance: attendance || [],
        finance: finance || [],
        materials: materials || [],
        meetings: meetings || [],
        crmLeads: crmLeads || [],
        quotations: quotations || [],
        photos: photos || [],
        settings: settings || {}
      });

      // Split JSON string into 30,000 character rows (bypass Excel 32K cell character length restrictions)
      const chunkedAoa = chunkString(rawPayload, 30000);
      const wsSystem = XLSX.utils.aoa_to_sheet(chunkedAoa);
      XLSX.utils.book_append_sheet(wb, wsSystem, "__ERP_SYSTEM_BACKUP__");

      // Generate spreadsheet binary output
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      let targetFileId = backupFile?.id;

      // If continuous backup file does not exist, initialize file creation first
      if (!targetFileId) {
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Onsite_Build_Pro_ERP_Backup.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })
        });

        if (!createResponse.ok) {
          const errText = await createResponse.text();
          throw new Error(`Failed to create backup placeholder: ${errText}`);
        }
        const createData = await createResponse.json();
        targetFileId = createData.id;
      }

      // Upload binary blob payload using simple media upload PATCH
      const uploadResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${targetFileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${activeToken}`,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
          body: blob,
        }
      );

      if (uploadResponse.status === 401) {
        setAccessToken(null);
        setIsConnected(false);
        localStorage.removeItem('bt_google_drive_access_token');
        throw new Error('Google Drive session expired. Please connect and back up again.');
      }

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        throw new Error(`Google Drive backup content update failed: ${errText}`);
      }

      setStatus({ success: `Successfully updated your single continuous Excel backup sheet in Google Drive!` });
      await loadDriveFiles(activeToken);

      setTimeout(() => setStatus(prev => ({ ...prev, success: undefined })), 5000);
    } catch (err: any) {
      console.error('Backup error:', err);
      setStatus({ error: err.message || 'Failed to complete continuous Google Drive backup.' });
    } finally {
      setIsBackingUp(false);
    }
  };

  // 4. Download and restore ERP parameters snapshot from the Excel file
  const handleRestore = async () => {
    if (!backupFile?.id || !accessToken) return;
    setIsRestoring(true);
    setStatus({});
    setShowRestoreConfirm(false);
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${backupFile.id}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        setAccessToken(null);
        setIsConnected(false);
        localStorage.removeItem('bt_google_drive_access_token');
        throw new Error('Google Drive session expired. Please connect your account again to authorize.');
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google Drive download failed: ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(fileData, { type: 'array' });

      const systemSheet = workbook.Sheets['__ERP_SYSTEM_BACKUP__'];
      if (!systemSheet) {
        throw new Error('The selected Excel spreadsheet does not contain a valid Onsite Build-Pro backup worksheet.');
      }

      // Reconstruct serialized JSON from chunked rows
      const range = XLSX.utils.decode_range(systemSheet['!ref'] || 'A1:A1');
      const chunkList: string[] = [];
      for (let r = range.s.r; r <= range.e.r; r++) {
        const cellRef = XLSX.utils.encode_cell({ r, c: 0 });
        const cell = systemSheet[cellRef];
        if (cell && cell.v !== undefined) {
          chunkList.push(String(cell.v));
        }
      }

      const rawBackupString = chunkList.join('');
      const backupObj = JSON.parse(rawBackupString);

      // Verify backup objects
      if (!backupObj.projects && !backupObj.team) {
        throw new Error('The excel backup structure is invalid or corrupt.');
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
        settings: backupObj.settings || {}
      });

      setStatus({ success: 'Successfully restored and synchronized your ERP construction database parameters from Google Drive Excel sheet!' });
      setTimeout(() => setStatus(prev => ({ ...prev, success: undefined })), 5000);
    } catch (err: any) {
      console.error('Restore error:', err);
      setStatus({ error: err.message || 'Could not complete database restoration from Excel file.' });
    } finally {
      setIsRestoring(false);
    }
  };

  // 5. Delete continuous backup file from Google Drive
  const handleDelete = async () => {
    if (!backupFile?.id || !accessToken) return;
    const isConfirmed = window.confirm('Are you absolutely sure you want to permanently delete the Excel backup spreadsheet from your Google Drive? All archived records will be lost.');
    if (!isConfirmed) return;

    setIsLoading(true);
    setStatus({});
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${backupFile.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        setAccessToken(null);
        setIsConnected(false);
        localStorage.removeItem('bt_google_drive_access_token');
        throw new Error('Google Drive session expired. Please reconnect your account.');
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to delete the backup spreadsheet: ${errText}`);
      }

      setStatus({ success: 'Successfully deleted the backup Excel file from your Google Drive.' });
      setBackupFile(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      setStatus({ error: err.message || 'Failed to delete snapshot.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="cloudsync-page" className="space-y-6 max-w-4xl font-sans text-xs">
      
      {/* Page Title */}
      <div>
        <h1 id="cloudsync-title" className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Cloud className="w-7 h-7 text-amber-500" />
          <span>Google Drive continuous Excel Sync</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Synchronize your projects, estimate sheets, financial transactions, and labor wages continuously into a single Microsoft Excel file on Google Drive.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Connection Status Summary Bar */}
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
              <div className="font-bold text-sm text-slate-100">{currentUser?.displayName || 'Authorized User'}</div>
              <div className="text-[10px] text-slate-400">{currentUser?.email || 'N/A'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2 bg-emerald-950 border border-emerald-900 px-3 py-1.5 rounded-lg text-emerald-400 text-[10px] uppercase font-mono font-bold tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Drive Connected</span>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-slate-950" />
                <span>Authorize Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* Unified Status Notifications */}
        {status.success && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 font-semibold text-[11px] leading-relaxed flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{status.success}</span>
          </div>
        )}
        {status.error && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-800 font-bold text-[11px] leading-relaxed flex items-start gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{status.error}</p>
              {status.error.includes('verified') && (
                <p className="text-[10px] text-rose-700 font-normal mt-1">
                  Google Drive integration requires registering this Gmail account as a Test User in Google Cloud project: <strong>phat-retina-drtgb</strong> under "OAuth consent screen".
                </p>
              )}
            </div>
          </div>
        )}

        {/* FEATURE INFO NOTICE */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-blue-900 text-[11px] leading-relaxed">
            <h4 className="font-bold text-blue-950">How Continuous Excel Sync Works:</h4>
            <ul className="list-disc list-inside space-y-1 font-medium">
              <li>Creates exactly <strong>one single</strong> Excel workbook named <code className="bg-blue-100 px-1 rounded text-blue-950">Onsite_Build_Pro_ERP_Backup.xlsx</code> in your Google Drive.</li>
              <li>When you add projects, materials, or attendance, clicking <strong>Sync Backup</strong> will update the same file continuously instead of uploading separate worksheets.</li>
              <li>You can download and open this backup sheet in Microsoft Excel or Google Sheets to inspect formatted tabs like Projects, Labor rosters, Wages, and Estimates!</li>
              <li>The file contains a secure machine-readable sheet to instantly restore your data at any time.</li>
            </ul>
          </div>
        </div>

        {/* MAIN SYNC PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CONTROL BOX: SYNC NOW */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs border-slate-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm border-b pb-2 border-slate-150">
                <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span>Synchronize ERP to Excel</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Generate a beautifully formatted Excel workbook with tabbed pages for every database module, then save it to your secure Google Drive. Existing files are overwritten dynamically.
              </p>
            </div>

            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 disabled:opacity-60 text-white font-bold text-xs py-2.5 px-4 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.99] transition-all"
            >
              <CloudUpload className="w-4 h-4" />
              <span>{isBackingUp ? 'Uploading Excel...' : backupFile ? 'Update Sync File (Sync Now)' : 'Create Excel Backup file'}</span>
            </button>
          </div>

          {/* STATUS BOX: ACTIVE BACKUP IN DRIVE */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs border-slate-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm border-b pb-2 border-slate-150">
                <HardDrive className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                <span>Google Drive File Status</span>
              </div>

              {!isConnected ? (
                <div className="text-slate-400 italic text-[11px] py-4">
                  Please connect Google Drive to scan for backup.
                </div>
              ) : isLoading ? (
                <div className="text-slate-500 animate-pulse text-[11px] py-4 flex items-center gap-1.5 font-medium">
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  Scanning your Google Drive space...
                </div>
              ) : backupFile ? (
                <div className="space-y-1.5 py-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">File Name:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[180px]" title={backupFile.name}>
                      {backupFile.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Synced:</span>
                    <span className="font-bold text-slate-700">
                      {new Date(backupFile.modifiedTime || backupFile.createdTime).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">File Size:</span>
                    <span className="font-mono text-slate-700">{formatSize(backupFile.size)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Status:</span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                      ACTIVE &amp; LIVE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 italic text-[11px] py-4">
                  No active Excel backup file found. Press "Create Excel Backup" to initialize!
                </div>
              )}
            </div>

            {backupFile && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowRestoreConfirm(true)}
                  disabled={isRestoring || isLoading}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all"
                >
                  <CloudDownload className="w-4 h-4 text-slate-600" />
                  <span>Restore</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isRestoring || isLoading}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-150 transition-all"
                  title="Delete backup from Drive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => loadDriveFiles(accessToken!)}
                  disabled={isLoading}
                  className="p-2 hover:bg-slate-50 text-slate-500 rounded-lg border border-slate-250 transition-all"
                  title="Refresh status"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* RESTORE CONFIRMATION BANNER */}
        {showRestoreConfirm && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3 shadow-xs text-left">
            <div className="flex items-center gap-2 text-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
              <span className="font-extrabold uppercase tracking-wide text-amber-950">CRITICAL WARNING: Irreversible Local Data Overwrite</span>
            </div>
            <p className="text-amber-900 leading-relaxed text-[11px] font-medium">
              Restoring this Excel database snapshot will <strong className="text-rose-700">PERMANENTLY OVERWRITE</strong> all your current local estimation entries, wages ledgers, labor logs, client CRM pipelines, and materials inventories with the historical data from this snapshot.
            </p>
            
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleRestore}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] uppercase px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
              >
                Confirm Overwrite &amp; Restore
              </button>
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] uppercase px-4 py-2 rounded-lg cursor-pointer transition-all"
              >
                Cancel Restore
              </button>
            </div>
          </div>
        )}

      </div>
      
    </div>
  );
}
