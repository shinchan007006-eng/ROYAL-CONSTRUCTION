import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  FolderKanban, 
  Users, 
  CalendarDays, 
  IndianRupee, 
  HardHat, 
  FileSpreadsheet, 
  FileText, 
  Camera, 
  Settings as SettingsIcon,
  Download,
  ClipboardList,
  Cloud
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ currentTab, setCurrentTab, isCollapsed, setIsCollapsed }: SidebarProps) {
  const { settings, exportDataToExcel } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'teams', label: 'Labour Directory', icon: Users },
    { id: 'attendance', label: 'Daily Attendance', icon: HardHat },
    { id: 'finance', label: 'Finance Ledger', icon: IndianRupee },
    { id: 'materials', label: 'Materials Log', icon: ClipboardList },
    { id: 'crm', label: 'CRM Pipeline', icon: CalendarDays },
    { id: 'schedule', label: 'Schedule / MOM', icon: FileText },
    { id: 'quotations', label: 'Quotation Engine', icon: FileSpreadsheet },
    { id: 'photos', label: 'Site Photo Vault', icon: Camera },
    { id: 'cloudsync', label: 'Cloud Backups', icon: Cloud },
    { id: 'settings', label: 'App Settings', icon: SettingsIcon },
  ];

  return (
    <div 
      id="app-sidebar" 
      className={`bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 no-print transition-all duration-300 ease-in-out shrink-0 select-none ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Branding Header with Uploaded Logo Preview */}
      <div className={`p-3 border-b border-slate-800 flex items-center bg-slate-950/50 ${
        isCollapsed ? 'justify-center' : 'gap-2.5'
      }`}>
        {settings.logoUrl ? (
          <img 
            id="sidebar-logo" 
            src={settings.logoUrl} 
            alt="Logo" 
            className="w-8 h-8 object-cover rounded border border-amber-400/80 shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center text-slate-950 font-bold shrink-0">
            <Building2 className="w-4 h-4 stroke-[2.5]" />
          </div>
        )}
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden animate-fade-in text-left">
            <span id="sidebar-app-name" className="font-bold text-amber-500 text-sm leading-tight truncate tracking-tight">
              {settings.appName || 'Onsite Build-Pro'}
            </span>
            <span id="sidebar-app-sub" className="text-[9px] text-slate-500 font-mono tracking-wide truncate">
              {settings.appSubtitle || 'Construction ERP'}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'projects' && currentTab.startsWith('project-detail'));
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center rounded transition-all font-mono text-[10.5px] uppercase tracking-wider font-semibold ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-1.5'
              } ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/5' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'stroke-[2.5]' : ''}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Excel Data Exporter inside Sidebar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
        <button
          id="btn-sidebar-excel-export"
          onClick={exportDataToExcel}
          className={`w-full flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 rounded text-[11px] font-bold border border-slate-700/60 transition-all cursor-pointer ${
            isCollapsed ? 'p-2' : 'gap-1.5 py-1.5 px-2.5'
          }`}
          title={isCollapsed ? "Export Excel" : undefined}
        >
          <Download className="w-3.5 h-3.5" />
          {!isCollapsed && <span>Export Excel</span>}
        </button>
        {!isCollapsed && (
          <p className="text-[8px] text-center text-slate-500 mt-1 font-mono uppercase tracking-wider">
            Multi-Sheet XLSX Book
          </p>
        )}
      </div>
    </div>
  );
}
