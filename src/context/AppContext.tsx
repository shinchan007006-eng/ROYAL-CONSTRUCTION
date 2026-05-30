import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, TeamMember, Attendance, FinanceEntry, Material, MeetingNote, CRMLead, Quotation, ProjectPhoto, AppSettings } from '../types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_TEAM, 
  INITIAL_ATTENDANCE, 
  INITIAL_FINANCE, 
  INITIAL_MATERIALS, 
  INITIAL_MEETINGS, 
  INITIAL_CRM, 
  INITIAL_QUOTATIONS, 
  INITIAL_PHOTOS, 
  DEFAULT_SETTINGS 
} from '../utils/initialData';
import { exportAllDataToExcel } from '../utils/excelExport';

interface AppContextType {
  projects: Project[];
  team: TeamMember[];
  attendance: Attendance[];
  finance: FinanceEntry[];
  materials: Material[];
  meetings: MeetingNote[];
  crmLeads: CRMLead[];
  quotations: Quotation[];
  photos: ProjectPhoto[];
  settings: AppSettings;
  
  // Custom setters or triggers
  addProject: (p: Omit<Project, 'id' | 'spent'>) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addTeamMember: (t: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (id: string, t: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;

  addAttendance: (a: Omit<Attendance, 'id' | 'wages'>) => void;
  updateAttendance: (id: string, a: Partial<Attendance>) => void;
  deleteAttendance: (id: string) => void;
  saveBulkAttendance: (date: string, records: Omit<Attendance, 'id' | 'wages'>[]) => void;

  addFinanceEntry: (f: Omit<FinanceEntry, 'id'>) => void;
  updateFinanceEntry: (id: string, f: Partial<FinanceEntry>) => void;
  deleteFinanceEntry: (id: string) => void;

  addMaterial: (m: Omit<Material, 'id' | 'totalCost'>) => void;
  updateMaterial: (id: string, m: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  addMeetingNote: (mn: Omit<MeetingNote, 'id'>) => void;
  updateMeetingNote: (id: string, mn: Partial<MeetingNote>) => void;
  deleteMeetingNote: (id: string) => void;

  addCRMLead: (c: Omit<CRMLead, 'id'>) => void;
  updateCRMLead: (id: string, c: Partial<CRMLead>) => void;
  convertLeadToProject: (leadId: string, budget: number, notes: string) => void;
  deleteCRMLead: (id: string) => void;

  addQuotation: (q: Omit<Quotation, 'id'>) => void;
  updateQuotation: (id: string, q: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;

  addPhoto: (photo: Omit<ProjectPhoto, 'id' | 'uploadedAt'>) => void;
  deletePhoto: (id: string) => void;

  updateSettings: (s: Partial<AppSettings>) => void;
  exportDataToExcel: () => void;
  clearAllData: () => void;
  importSetupData: (data: {
    projects?: Project[];
    team?: TeamMember[];
    attendance?: Attendance[];
    finance?: FinanceEntry[];
    materials?: Material[];
    meetings?: MeetingNote[];
    crmLeads?: CRMLead[];
    quotations?: Quotation[];
    photos?: ProjectPhoto[];
    settings?: AppSettings;
  }) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Load initial states from LocalStorage or leverage preset mock arrays
  const [projectsRaw, setProjectsRaw] = useState<Project[]>(() => {
    const val = localStorage.getItem('bt_projects');
    return val ? JSON.parse(val) : INITIAL_PROJECTS;
  });

  const [team, setTeam] = useState<TeamMember[]>(() => {
    const val = localStorage.getItem('bt_team');
    return val ? JSON.parse(val) : INITIAL_TEAM;
  });

  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    const val = localStorage.getItem('bt_attendance');
    return val ? JSON.parse(val) : INITIAL_ATTENDANCE;
  });

  const [finance, setFinance] = useState<FinanceEntry[]>(() => {
    const val = localStorage.getItem('bt_finance');
    return val ? JSON.parse(val) : INITIAL_FINANCE;
  });

  const [materials, setMaterials] = useState<Material[]>(() => {
    const val = localStorage.getItem('bt_materials');
    return val ? JSON.parse(val) : INITIAL_MATERIALS;
  });

  const [meetings, setMeetings] = useState<MeetingNote[]>(() => {
    const val = localStorage.getItem('bt_meetings');
    return val ? JSON.parse(val) : INITIAL_MEETINGS;
  });

  const [crmLeads, setCrmLeads] = useState<CRMLead[]>(() => {
    const val = localStorage.getItem('bt_crm');
    return val ? JSON.parse(val) : INITIAL_CRM;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const val = localStorage.getItem('bt_quotations');
    return val ? JSON.parse(val) : INITIAL_QUOTATIONS;
  });

  const [photos, setPhotos] = useState<ProjectPhoto[]>(() => {
    const val = localStorage.getItem('bt_photos');
    return val ? JSON.parse(val) : INITIAL_PHOTOS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const val = localStorage.getItem('bt_settings');
    return val ? JSON.parse(val) : DEFAULT_SETTINGS;
  });

  // Keep state sync'd to local storage
  useEffect(() => {
    localStorage.setItem('bt_projects', JSON.stringify(projectsRaw));
  }, [projectsRaw]);

  useEffect(() => {
    localStorage.setItem('bt_team', JSON.stringify(team));
  }, [team]);

  useEffect(() => {
    localStorage.setItem('bt_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('bt_finance', JSON.stringify(finance));
  }, [finance]);

  useEffect(() => {
    localStorage.setItem('bt_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('bt_meetings', JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem('bt_crm', JSON.stringify(crmLeads));
  }, [crmLeads]);

  useEffect(() => {
    localStorage.setItem('bt_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('bt_photos', JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    localStorage.setItem('bt_settings', JSON.stringify(settings));
  }, [settings]);

  // Compute DYNAMIC spent budget for projects
  // Total expenses of this project in FinanceEntries + Wages of this project in Attendance details
  const projects = projectsRaw.map(p => {
    const financeExpenses = finance
      .filter(f => f.projectId === p.id && f.category === 'Expense')
      .reduce((sum, f) => sum + f.amount, 0);

    const attendanceWages = attendance
      .filter(a => a.projectId === p.id && (a.status === 'Present' || a.status === 'Half Day'))
      .reduce((sum, a) => sum + a.wages, 0);

    return {
      ...p,
      spent: financeExpenses + attendanceWages
    };
  });

  // --- CRUD ACTIONS ---

  // Projects
  const addProject = (p: Omit<Project, 'id' | 'spent'>) => {
    const newId = `PROJ-${Math.floor(200 + Math.random() * 800)}`;
    setProjectsRaw(prev => [
      ...prev,
      { ...p, id: newId, spent: 0 }
    ]);
  };

  const updateProject = (id: string, updatedFields: Partial<Project>) => {
    setProjectsRaw(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const deleteProject = (id: string) => {
    setProjectsRaw(prev => prev.filter(p => p.id !== id));
  };

  // Team Members
  const addTeamMember = (t: Omit<TeamMember, 'id'>) => {
    const newId = `TEAM-${Math.floor(100 + Math.random() * 900)}`;
    setTeam(prev => [...prev, { ...t, id: newId }]);
  };

  const updateTeamMember = (id: string, updatedFields: Partial<TeamMember>) => {
    setTeam(prev => prev.map(t => t.id === id ? { ...t, ...updatedFields } : t));
  };

  const deleteTeamMember = (id: string) => {
    setTeam(prev => prev.filter(t => t.id !== id));
  };

  // Attendance
  const calculateWages = (status: 'Present' | 'Absent' | 'Half Day' | 'Leave', dailyRate: number) => {
    if (status === 'Present') return dailyRate;
    if (status === 'Half Day') return Math.round(dailyRate * 0.5);
    return 0;
  };

  const addAttendance = (a: Omit<Attendance, 'id' | 'wages'>) => {
    const newId = `ATT-${Math.floor(1000 + Math.random() * 9000)}`;
    const wages = calculateWages(a.status, a.dailyRate);
    setAttendance(prev => [...prev, { ...a, id: newId, wages }]);
  };

  const updateAttendance = (id: string, updatedFields: Partial<Attendance>) => {
    setAttendance(prev => prev.map(att => {
      if (att.id === id) {
        const nextStatus = updatedFields.status !== undefined ? updatedFields.status : att.status;
        const nextRate = updatedFields.dailyRate !== undefined ? updatedFields.dailyRate : att.dailyRate;
        const wages = calculateWages(nextStatus, nextRate);
        return {
          ...att,
          ...updatedFields,
          wages
        };
      }
      return att;
    }));
  };

  const deleteAttendance = (id: string) => {
    setAttendance(prev => prev.filter(att => att.id !== id));
  };

  const saveBulkAttendance = (date: string, records: Omit<Attendance, 'id' | 'wages'>[]) => {
    // Delete existing attendance records for this date first to prevent duplicates
    setAttendance(prev => {
      const filtered = prev.filter(a => a.date !== date);
      const formatted = records.map((rec, index) => ({
        ...rec,
        id: `ATT-${date}-${index}-${Math.floor(Math.random() * 1000)}`,
        wages: calculateWages(rec.status, rec.dailyRate)
      }));
      return [...filtered, ...formatted];
    });
  };

  // Finance Entries
  const addFinanceEntry = (f: Omit<FinanceEntry, 'id'>) => {
    const newId = `FIN-${Math.floor(300 + Math.random() * 700)}`;
    setFinance(prev => [...prev, { ...f, id: newId }]);
  };

  const updateFinanceEntry = (id: string, updatedFields: Partial<FinanceEntry>) => {
    setFinance(prev => prev.map(f => f.id === id ? { ...f, ...updatedFields } : f));
  };

  const deleteFinanceEntry = (id: string) => {
    setFinance(prev => prev.filter(f => f.id !== id));
  };

  // Materials
  const addMaterial = (m: Omit<Material, 'id' | 'totalCost'>) => {
    const newId = `MAT-${Math.floor(400 + Math.random() * 600)}`;
    const totalCost = m.quantityOrdered * m.unitCost;
    setMaterials(prev => [...prev, { ...m, id: newId, totalCost }]);
  };

  const updateMaterial = (id: string, updatedFields: Partial<Material>) => {
    setMaterials(prev => prev.map(m => {
      if (m.id === id) {
        const nextQty = updatedFields.quantityOrdered !== undefined ? updatedFields.quantityOrdered : m.quantityOrdered;
        const nextCost = updatedFields.unitCost !== undefined ? updatedFields.unitCost : m.unitCost;
        return {
          ...m,
          ...updatedFields,
          totalCost: nextQty * nextCost
        };
      }
      return m;
    }));
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  // Agenda/Meetings
  const addMeetingNote = (mn: Omit<MeetingNote, 'id'>) => {
    const newId = `MOM-${Math.floor(500 + Math.random() * 500)}`;
    setMeetings(prev => [...prev, { ...mn, id: newId }]);
  };

  const updateMeetingNote = (id: string, updatedFields: Partial<MeetingNote>) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updatedFields } : m));
  };

  const deleteMeetingNote = (id: string) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  // CRM
  const addCRMLead = (c: Omit<CRMLead, 'id'>) => {
    const newId = `CRM-${Math.floor(600 + Math.random() * 400)}`;
    setCrmLeads(prev => [...prev, { ...c, id: newId }]);
  };

  const updateCRMLead = (id: string, updatedFields: Partial<CRMLead>) => {
    setCrmLeads(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const convertLeadToProject = (leadId: string, budget: number, notes: string) => {
    const lead = crmLeads.find(c => c.id === leadId);
    if (!lead) return;

    // Create a new project based on lead
    const newProjId = `PROJ-${Math.floor(200 + Math.random() * 800)}`;
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // +6 months

    const newProject: Project = {
      id: newProjId,
      name: `${lead.company} - Retail/Structural Expansion`,
      client: lead.name,
      startDate,
      endDate,
      status: 'Active',
      budget,
      spent: 0,
      teamLead: 'Unassigned',
      description: `Project spun off from CRM proposal. Notes: ${notes}. Original Lead ID: ${leadId}`
    };

    setProjectsRaw(prev => [...prev, newProject]);

    // Update lead to Won and link Project ID
    setCrmLeads(prev => prev.map(c => c.id === leadId ? { ...c, stage: 'Won', projectId: newProjId } : c));
  };

  const deleteCRMLead = (id: string) => {
    setCrmLeads(prev => prev.filter(c => c.id !== id));
  };

  // Quotations
  const addQuotation = (q: Omit<Quotation, 'id'>) => {
    const newId = `QUOT-${Math.floor(700 + Math.random() * 300)}`;
    setQuotations(prev => [...prev, { ...q, id: newId }]);
  };

  const updateQuotation = (id: string, updatedFields: Partial<Quotation>) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updatedFields } : q));
  };

  const deleteQuotation = (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  };

  // Photos (Progress or Invoice Bill Scans)
  const addPhoto = (photo: Omit<ProjectPhoto, 'id' | 'uploadedAt'>) => {
    const newId = `PH-${Math.floor(1000 + Math.random() * 9000)}`;
    const uploadedAt = new Date().toISOString();
    setPhotos(prev => [...prev, { ...photo, id: newId, uploadedAt }]);
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Settings
  const updateSettings = (updatedSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updatedSettings }));
  };

  // Export
  const exportDataToExcel = () => {
    exportAllDataToExcel({
      projects,
      teams: team,
      attendance,
      finance,
      materials,
      meetings,
      crm: crmLeads,
      quotations
    });
  };

  // Clear all data
  const clearAllData = () => {
    setProjectsRaw([]);
    setTeam([]);
    setAttendance([]);
    setFinance([]);
    setMaterials([]);
    setMeetings([]);
    setCrmLeads([]);
    setQuotations([]);
    setPhotos([]);
    
    localStorage.removeItem('bt_projects');
    localStorage.removeItem('bt_team');
    localStorage.removeItem('bt_attendance');
    localStorage.removeItem('bt_finance');
    localStorage.removeItem('bt_materials');
    localStorage.removeItem('bt_meetings');
    localStorage.removeItem('bt_crm');
    localStorage.removeItem('bt_quotations');
    localStorage.removeItem('bt_photos');
  };

  // Bulk restore workspace state
  const importSetupData = (data: {
    projects?: Project[];
    team?: TeamMember[];
    attendance?: Attendance[];
    finance?: FinanceEntry[];
    materials?: Material[];
    meetings?: MeetingNote[];
    crmLeads?: CRMLead[];
    quotations?: Quotation[];
    photos?: ProjectPhoto[];
    settings?: AppSettings;
  }) => {
    if (Array.isArray(data.projects)) setProjectsRaw(data.projects);
    if (Array.isArray(data.team)) setTeam(data.team);
    if (Array.isArray(data.attendance)) setAttendance(data.attendance);
    if (Array.isArray(data.finance)) setFinance(data.finance);
    if (Array.isArray(data.materials)) setMaterials(data.materials);
    if (Array.isArray(data.meetings)) setMeetings(data.meetings);
    if (Array.isArray(data.crmLeads)) setCrmLeads(data.crmLeads);
    if (Array.isArray(data.quotations)) setQuotations(data.quotations);
    if (Array.isArray(data.photos)) setPhotos(data.photos);
    if (data.settings && typeof data.settings === 'object') setSettings(data.settings);
  };

  return (
    <AppContext.Provider value={{
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
      addProject,
      updateProject,
      deleteProject,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      addAttendance,
      updateAttendance,
      deleteAttendance,
      saveBulkAttendance,
      addFinanceEntry,
      updateFinanceEntry,
      deleteFinanceEntry,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addMeetingNote,
      updateMeetingNote,
      deleteMeetingNote,
      addCRMLead,
      updateCRMLead,
      convertLeadToProject,
      deleteCRMLead,
      addQuotation,
      updateQuotation,
      deleteQuotation,
      addPhoto,
      deletePhoto,
      updateSettings,
      exportDataToExcel,
      clearAllData,
      importSetupData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside an AppProvider');
  return context;
}
