import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import AuthWall from './components/AuthWall';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

// Pages import
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Teams from './pages/Teams';
import Attendance from './pages/Attendance';
import Finance from './pages/Finance';
import Materials from './pages/Materials';
import CRM from './pages/CRM';
import Schedule from './pages/Schedule';
import Quotations from './pages/Quotations';
import Photos from './pages/Photos';
import SitePhotos from './pages/SitePhotos';
import BillPhotos from './pages/BillPhotos';
import CloudSync from './pages/CloudSync';
import Settings from './pages/Settings';

function MainLayout() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderActiveTab = () => {
    // Check detail page router
    if (currentTab.startsWith('project-detail-') && selectedProjectId) {
      return (
        <ProjectDetail 
          projectId={selectedProjectId} 
          onBack={() => {
            setSelectedProjectId(null);
            setCurrentTab('projects');
          }}
          setCurrentTab={setCurrentTab}
        />
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard 
            setCurrentTab={setCurrentTab} 
            setSelectedProjectId={setSelectedProjectId} 
          />
        );
      case 'projects':
        return (
          <Projects 
            setCurrentTab={setCurrentTab} 
            setSelectedProjectId={setSelectedProjectId} 
          />
        );
      case 'teams':
        return <Teams />;
      case 'attendance':
        return <Attendance />;
      case 'finance':
        return <Finance />;
      case 'materials':
        return <Materials />;
      case 'crm':
        return <CRM />;
      case 'schedule':
        return <Schedule />;
      case 'quotations':
        return <Quotations />;
      case 'photos':
        return <Photos />;
      case 'site-photos':
        return <SitePhotos />;
      case 'bill-photos':
        return <BillPhotos />;
      case 'cloudsync':
        return <CloudSync />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} setSelectedProjectId={setSelectedProjectId} />;
    }
  };

  const isQuotationPrintView = currentTab === 'quotations' && window.location.hash.includes('print');

  return (
    <div id="onsite-app-root" className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased overflow-hidden">
      {/* 
        Visual Sidebar Navigation:
        Hidden entirely during quotation printing processes using standard CSS class no-print!
      */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />

      {/* Main workplace canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <TopBar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
        
        {/* Module Content Area */}
        <main id="app-canvas-container" className="p-4 flex-1 overflow-y-auto">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const isOffline = localStorage.getItem('bt_offline_mode') === 'true';
    if (isOffline) {
      let offlineUser: any = null;
      try {
        offlineUser = JSON.parse(localStorage.getItem('bt_offline_user') || 'null');
      } catch (e) {}

      setCurrentUser({
        uid: localStorage.getItem('bt_workspace_owner_id') || 'local-demo-workspace',
        email: offlineUser?.email || 'local-demo@onsitebuildpro.com',
        displayName: offlineUser?.displayName || 'Demo Administrator',
        isAnonymous: true
      });
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        const isStillOffline = localStorage.getItem('bt_offline_mode') === 'true';
        if (isStillOffline) {
          let offlineUser: any = null;
          try {
            offlineUser = JSON.parse(localStorage.getItem('bt_offline_user') || 'null');
          } catch (e) {}
          setCurrentUser({
            uid: localStorage.getItem('bt_workspace_owner_id') || 'local-demo-workspace',
            email: offlineUser?.email || 'local-demo@onsitebuildpro.com',
            displayName: offlineUser?.displayName || 'Demo Administrator',
            isAnonymous: true
          });
        } else {
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold animate-pulse">
          Validating Security Credentials...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthWall onLoginSuccess={() => {}} />;
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
