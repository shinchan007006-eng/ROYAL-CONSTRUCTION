import React from 'react';
import { Calendar, User, Clock, CheckCircle, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { auth, logout } from '../lib/firebase';

interface TopBarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function TopBar({ isCollapsed, setIsCollapsed }: TopBarProps) {
  const { settings, authUser } = useApp();
  const [confirming, setConfirming] = React.useState(false);
  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const userDisplayName = authUser?.displayName || auth.currentUser?.displayName || 'Active Member';
  const userEmail = authUser?.email || auth.currentUser?.email || 'Logged In';
  const userInitial = userDisplayName.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase() || 'U';

  return (
    <header className="h-12 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between no-print shadow-xs">
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          id="btn-sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-all mr-1.5 cursor-pointer inline-flex items-center justify-center border border-slate-200 bg-slate-50"
          title={isCollapsed ? "Open Sidebar" : "Close Sidebar"}
          style={{ padding: '4px' }}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-amber-600" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-500" />
          )}
        </button>
        <span className="text-slate-400 text-xs font-semibold hidden sm:inline">Workspace:</span>
        <h2 id="topbar-project-sub" className="text-slate-800 font-bold text-xs flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-100 px-2.5 py-0.5 rounded">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-650" />
          <span>{settings.appName || 'Onsite Build-Pro'} Live DB</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div id="topbar-date" className="hidden md:flex items-center gap-2 text-slate-500 text-xs font-mono font-bold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
          <span>{formattedDate}</span>
        </div>

        {/* User Context */}
        <div className="flex items-center gap-2">
          <div id="topbar-user" className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <div className="w-5 h-5 bg-amber-500 rounded flex items-center justify-center font-black text-[10px] text-slate-950 uppercase">
              {userInitial}
            </div>
            <div className="flex flex-col text-left max-w-[110px] sm:max-w-[150px] overflow-hidden">
              <span className="text-[10px] font-bold text-slate-800 leading-none truncate block">
                {userDisplayName}
              </span>
              <span className="text-[8px] text-slate-400 font-mono leading-none mt-0.5 truncate block" title={userEmail}>
                {userEmail}
              </span>
            </div>
          </div>
          
          {confirming ? (
            <div className="flex items-center gap-1.5 transition-all">
              <button
                onClick={async () => {
                  await logout();
                  window.location.reload();
                }}
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all shadow-sm animate-pulse"
                title="Confirm Log Out"
              >
                <span>Confirm Logout ➔</span>
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 w-6 h-6 rounded-lg text-[10px] font-black cursor-pointer transition-all flex items-center justify-center"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-[10px] font-bold cursor-pointer transition-all"
              title="Log Out of Build-Pro Session"
            >
              <LogOut className="w-3 h-3 text-slate-500 hover:text-rose-600" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
