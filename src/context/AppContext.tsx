import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, TeamMember, Attendance, FinanceEntry, Material, MeetingNote, CRMLead, Quotation, ProjectPhoto, AppSettings, WorkspaceUser } from '../types';
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
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

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
  workspaceUsers: WorkspaceUser[];
  currentSubUser: WorkspaceUser | null;
  logoutSubUser: () => void;
  authUser: any;
  workspaceOwnerId: string | null;
  
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
  addWorkspaceUser: (u: Omit<WorkspaceUser, 'id'>) => Promise<void>;
  updateWorkspaceUser: (id: string, u: Partial<WorkspaceUser>) => Promise<void>;
  deleteWorkspaceUser: (id: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  // States initialized empty, populated immediately via Firestore onSnapshot
  const [projectsRaw, setProjectsRaw] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [finance, setFinance] = useState<FinanceEntry[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Auth owner sync states
  const [workspaceOwnerId, setWorkspaceOwnerId] = useState<string | null>(() => {
    return localStorage.getItem('bt_workspace_owner_id');
  });

  const [currentSubUser, setCurrentSubUser] = useState<WorkspaceUser | null>(() => {
    const val = localStorage.getItem('bt_sub_user');
    return val ? JSON.parse(val) : null;
  });

  const [authUser, setAuthUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Track state sync to localStorage for owner info
  useEffect(() => {
    const isOffline = localStorage.getItem('bt_offline_mode') === 'true';
    if (isOffline) {
      const storedId = localStorage.getItem('bt_workspace_owner_id') || 'local-demo-workspace';
      let offlineUser: any = null;
      try {
        offlineUser = JSON.parse(localStorage.getItem('bt_offline_user') || 'null');
      } catch (e) {}

      setAuthUser({
        uid: storedId,
        email: offlineUser?.email || 'local-demo@onsitebuildpro.com',
        displayName: offlineUser?.displayName || 'Demo Administrator',
        isAnonymous: true
      });
      setWorkspaceOwnerId(storedId);
      setAuthChecked(true);
      return;
    }

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthUser(user);
        setAuthChecked(true);
        
        // Differentiate between sub-user and main contractor/admin
        const isSubUser = localStorage.getItem('bt_sub_user');
        if (isSubUser) {
          const storedOwnerId = localStorage.getItem('bt_workspace_owner_id');
          if (storedOwnerId) {
            setWorkspaceOwnerId(storedOwnerId);
          } else {
            localStorage.setItem('bt_workspace_owner_id', user.uid);
            setWorkspaceOwnerId(user.uid);
          }
        } else {
          // Standard admin user MUST always connect to their own Firebase UID!
          // This ensures if they login to the same Google Account on another device,
          // they connect to their correct Firebase user database.
          localStorage.setItem('bt_workspace_owner_id', user.uid);
          setWorkspaceOwnerId(user.uid);
        }
      } else {
        const isStillOffline = localStorage.getItem('bt_offline_mode') === 'true';
        if (isStillOffline) {
          const storedId = localStorage.getItem('bt_workspace_owner_id') || 'local-demo-workspace';
          let offlineUser: any = null;
          try {
            offlineUser = JSON.parse(localStorage.getItem('bt_offline_user') || 'null');
          } catch (e) {}

          setAuthUser({
            uid: storedId,
            email: offlineUser?.email || 'local-demo@onsitebuildpro.com',
            displayName: offlineUser?.displayName || 'Demo Administrator',
            isAnonymous: true
          });
          setWorkspaceOwnerId(storedId);
          setAuthChecked(true);
        } else {
          localStorage.removeItem('bt_workspace_owner_id');
          localStorage.removeItem('bt_sub_user');
          setWorkspaceOwnerId(null);
          setCurrentSubUser(null);
          setAuthUser(null);
          setAuthChecked(true);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Firestore workspace update helper
  const updateWorkspaceInFirestore = async (newWorkspaceState: any) => {
    const isOffline = localStorage.getItem('bt_offline_mode') === 'true';
    if (isOffline) {
      // Local storage useEffect handles saving, so we just return!
      return;
    }
    const ownerId = workspaceOwnerId || authUser?.uid || auth.currentUser?.uid;
    if (!ownerId) return;
    const docRef = doc(db, 'workspaces', ownerId);
    try {
      await setDoc(docRef, {
        ...newWorkspaceState,
        userId: ownerId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `workspaces/${ownerId}`);
    }
  };

  // Subscribe to real-time changes inside the current logged-in user workspace document in Firestore
  useEffect(() => {
    if (!authChecked) return;

    if (!authUser) {
      setLoading(false);
      return;
    }

    const ownerId = workspaceOwnerId || authUser.uid;
    const cacheKey = `bt_workspace_data_${ownerId}`;
    const isOffline = localStorage.getItem('bt_offline_mode') === 'true';

    // 1. Instantly load from cache to make loading instantaneous (Offline-First/Cache-First)
    let hasLoadedFromCache = false;
    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
      try {
        const data = JSON.parse(cachedStr);
        setProjectsRaw(data.projects || []);
        setTeam(data.team || []);
        setAttendance(data.attendance || []);
        setFinance(data.finance || []);
        setMaterials(data.materials || []);
        setMeetings(data.meetings || []);
        setCrmLeads(data.crmLeads || []);
        setQuotations(data.quotations || []);
        setPhotos(data.photos || []);
        setWorkspaceUsers(data.workspaceUsers || []);
        setSettings(data.settings || DEFAULT_SETTINGS);
        setLoading(false);
        hasLoadedFromCache = true;
      } catch (e) {
        console.error("Error parsing cached workspace data:", e);
      }
    }

    // If no cache exists, pre-populate with default initial data so it's still instant!
    if (!hasLoadedFromCache) {
      setProjectsRaw(INITIAL_PROJECTS);
      setTeam(INITIAL_TEAM);
      setAttendance(INITIAL_ATTENDANCE);
      setFinance(INITIAL_FINANCE);
      setMaterials(INITIAL_MATERIALS);
      setMeetings(INITIAL_MEETINGS);
      setCrmLeads(INITIAL_CRM);
      setQuotations(INITIAL_QUOTATIONS);
      setPhotos(INITIAL_PHOTOS);
      setWorkspaceUsers([]);
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
    }

    // If we are in offline sandbox mode, do not connect to Firestore at all!
    if (isOffline) {
      return;
    }

    // 2. Set up background listener for silent remote updates (Stale-While-Revalidate)
    const docRef = doc(db, 'workspaces', ownerId);
    
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProjectsRaw(data.projects || []);
        setTeam(data.team || []);
        setAttendance(data.attendance || []);
        setFinance(data.finance || []);
        setMaterials(data.materials || []);
        setMeetings(data.meetings || []);
        setCrmLeads(data.crmLeads || []);
        setQuotations(data.quotations || []);
        setPhotos(data.photos || []);
        setWorkspaceUsers(data.workspaceUsers || []);
        setSettings(data.settings || DEFAULT_SETTINGS);
        
        // Cache the latest data locally for future instant loads
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
          console.error("Failed to write to localStorage cache:", e);
        }
        setLoading(false);
      } else {
        // First-time signup/login on Firestore. We seed initial database record in the background!
        if (ownerId === authUser.uid) {
          const initialData = {
            userId: authUser.uid,
            projects: INITIAL_PROJECTS,
            team: INITIAL_TEAM,
            attendance: INITIAL_ATTENDANCE,
            finance: INITIAL_FINANCE,
            materials: INITIAL_MATERIALS,
            meetings: INITIAL_MEETINGS,
            crmLeads: INITIAL_CRM,
            quotations: INITIAL_QUOTATIONS,
            photos: INITIAL_PHOTOS,
            workspaceUsers: [],
            settings: DEFAULT_SETTINGS,
            updatedAt: new Date().toISOString()
          };
          try {
            await setDoc(docRef, initialData);
            // Cache locally too
            localStorage.setItem(cacheKey, JSON.stringify(initialData));
          } catch (error) {
            console.warn('Could not write initial seed data to remote Firestore (it might be disabled/unconfigured):', error);
          }
        }
        setLoading(false);
      }
    }, (error) => {
      console.warn('Firestore subscription warning (app will continue using local cache):', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [workspaceOwnerId, authUser, authChecked]);

  // Real-time synchronization of local state changes back to localStorage cache
  useEffect(() => {
    if (!authChecked || loading) return;
    const ownerId = workspaceOwnerId || authUser?.uid;
    if (!ownerId) return;

    const cacheKey = `bt_workspace_data_${ownerId}`;
    const stateObj = {
      projects: projectsRaw,
      team,
      attendance,
      finance,
      materials,
      meetings,
      crmLeads,
      quotations,
      photos,
      workspaceUsers,
      settings
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(stateObj));
      // Keep old offline fallback sync for compatibility
      const isOffline = localStorage.getItem('bt_offline_mode') === 'true';
      if (isOffline) {
        localStorage.setItem('bt_offline_workspace_data', JSON.stringify(stateObj));
      }
    } catch (e) {
      console.error("Failed to sync current state to localStorage:", e);
    }
  }, [
    projectsRaw,
    team,
    attendance,
    finance,
    materials,
    meetings,
    crmLeads,
    quotations,
    photos,
    workspaceUsers,
    settings,
    loading,
    authChecked,
    workspaceOwnerId,
    authUser
  ]);

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
    const updated = [...projectsRaw, { ...p, id: newId, spent: 0 }];
    setProjectsRaw(updated);
    updateWorkspaceInFirestore({ projects: updated });
  };

  const updateProject = (id: string, updatedFields: Partial<Project>) => {
    const updated = projectsRaw.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    setProjectsRaw(updated);
    updateWorkspaceInFirestore({ projects: updated });
  };

  const deleteProject = (id: string) => {
    const updated = projectsRaw.filter(p => p.id !== id);
    setProjectsRaw(updated);
    updateWorkspaceInFirestore({ projects: updated });
  };

  // Team Members
  const addTeamMember = (t: Omit<TeamMember, 'id'>) => {
    const newId = `TEAM-${Math.floor(100 + Math.random() * 900)}`;
    const updated = [...team, { ...t, id: newId }];
    setTeam(updated);
    updateWorkspaceInFirestore({ team: updated });
  };

  const updateTeamMember = (id: string, updatedFields: Partial<TeamMember>) => {
    const updated = team.map(t => t.id === id ? { ...t, ...updatedFields } : t);
    setTeam(updated);
    updateWorkspaceInFirestore({ team: updated });
  };

  const deleteTeamMember = (id: string) => {
    const updated = team.filter(t => t.id !== id);
    setTeam(updated);
    updateWorkspaceInFirestore({ team: updated });
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
    const updated = [...attendance, { ...a, id: newId, wages }];
    setAttendance(updated);
    updateWorkspaceInFirestore({ attendance: updated });
  };

  const updateAttendance = (id: string, updatedFields: Partial<Attendance>) => {
    const updated = attendance.map(att => {
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
    });
    setAttendance(updated);
    updateWorkspaceInFirestore({ attendance: updated });
  };

  const deleteAttendance = (id: string) => {
    const updated = attendance.filter(att => att.id !== id);
    setAttendance(updated);
    updateWorkspaceInFirestore({ attendance: updated });
  };

  const saveBulkAttendance = (date: string, records: Omit<Attendance, 'id' | 'wages'>[]) => {
    const filtered = attendance.filter(a => a.date !== date);
    const formatted = records.map((rec, index) => ({
      ...rec,
      id: `ATT-${date}-${index}-${Math.floor(Math.random() * 1000)}`,
      wages: calculateWages(rec.status, rec.dailyRate)
    }));
    const updated = [...filtered, ...formatted];
    setAttendance(updated);
    updateWorkspaceInFirestore({ attendance: updated });
  };

  // Finance Entries
  const addFinanceEntry = (f: Omit<FinanceEntry, 'id'>) => {
    const newId = `FIN-${Math.floor(300 + Math.random() * 700)}`;
    const updated = [...finance, { ...f, id: newId }];
    setFinance(updated);
    updateWorkspaceInFirestore({ finance: updated });
  };

  const updateFinanceEntry = (id: string, updatedFields: Partial<FinanceEntry>) => {
    const updated = finance.map(f => f.id === id ? { ...f, ...updatedFields } : f);
    setFinance(updated);
    updateWorkspaceInFirestore({ finance: updated });
  };

  const deleteFinanceEntry = (id: string) => {
    const updated = finance.filter(f => f.id !== id);
    setFinance(updated);
    updateWorkspaceInFirestore({ finance: updated });
  };

  // Materials
  const addMaterial = (m: Omit<Material, 'id' | 'totalCost'>) => {
    const newId = `MAT-${Math.floor(400 + Math.random() * 600)}`;
    const totalCost = m.quantityOrdered * m.unitCost;
    const updated = [...materials, { ...m, id: newId, totalCost }];
    setMaterials(updated);
    updateWorkspaceInFirestore({ materials: updated });
  };

  const updateMaterial = (id: string, updatedFields: Partial<Material>) => {
    const updated = materials.map(m => {
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
    });
    setMaterials(updated);
    updateWorkspaceInFirestore({ materials: updated });
  };

  const deleteMaterial = (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    updateWorkspaceInFirestore({ materials: updated });
  };

  // Agenda/Meetings
  const addMeetingNote = (mn: Omit<MeetingNote, 'id'>) => {
    const newId = `MOM-${Math.floor(500 + Math.random() * 500)}`;
    const updated = [...meetings, { ...mn, id: newId }];
    setMeetings(updated);
    updateWorkspaceInFirestore({ meetings: updated });
  };

  const updateMeetingNote = (id: string, updatedFields: Partial<MeetingNote>) => {
    const updated = meetings.map(m => m.id === id ? { ...m, ...updatedFields } : m);
    setMeetings(updated);
    updateWorkspaceInFirestore({ meetings: updated });
  };

  const deleteMeetingNote = (id: string) => {
    const updated = meetings.filter(m => m.id !== id);
    setMeetings(updated);
    updateWorkspaceInFirestore({ meetings: updated });
  };

  // CRM
  const addCRMLead = (c: Omit<CRMLead, 'id'>) => {
    const newId = `CRM-${Math.floor(600 + Math.random() * 400)}`;
    const updated = [...crmLeads, { ...c, id: newId }];
    setCrmLeads(updated);
    updateWorkspaceInFirestore({ crmLeads: updated });
  };

  const updateCRMLead = (id: string, updatedFields: Partial<CRMLead>) => {
    const updated = crmLeads.map(c => c.id === id ? { ...c, ...updatedFields } : c);
    setCrmLeads(updated);
    updateWorkspaceInFirestore({ crmLeads: updated });
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

    const nextProjects = [...projectsRaw, newProject];
    const nextLeads = crmLeads.map(c => c.id === leadId ? { ...c, stage: 'Won' as const, projectId: newProjId } : c);

    setProjectsRaw(nextProjects);
    setCrmLeads(nextLeads);
    updateWorkspaceInFirestore({ 
      projects: nextProjects,
      crmLeads: nextLeads 
    });
  };

  const deleteCRMLead = (id: string) => {
    const updated = crmLeads.filter(c => c.id !== id);
    setCrmLeads(updated);
    updateWorkspaceInFirestore({ crmLeads: updated });
  };

  // Quotations
  const addQuotation = (q: Omit<Quotation, 'id'>) => {
    const newId = `QUOT-${Math.floor(700 + Math.random() * 300)}`;
    const updated = [...quotations, { ...q, id: newId }];
    setQuotations(updated);
    updateWorkspaceInFirestore({ quotations: updated });
  };

  const updateQuotation = (id: string, updatedFields: Partial<Quotation>) => {
    const updated = quotations.map(q => q.id === id ? { ...q, ...updatedFields } : q);
    setQuotations(updated);
    updateWorkspaceInFirestore({ quotations: updated });
  };

  const deleteQuotation = (id: string) => {
    const updated = quotations.filter(q => q.id !== id);
    setQuotations(updated);
    updateWorkspaceInFirestore({ quotations: updated });
  };

  // Photos (Progress or Invoice Bill Scans)
  const addPhoto = (photo: Omit<ProjectPhoto, 'id' | 'uploadedAt'>) => {
    const newId = `PH-${Math.floor(1000 + Math.random() * 9000)}`;
    const uploadedAt = new Date().toISOString();
    const updated = [...photos, { ...photo, id: newId, uploadedAt }];
    setPhotos(updated);
    updateWorkspaceInFirestore({ photos: updated });
  };

  const deletePhoto = (id: string) => {
    const updated = photos.filter(p => p.id !== id);
    setPhotos(updated);
    updateWorkspaceInFirestore({ photos: updated });
  };

  // Settings
  const updateSettings = (updatedSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...updatedSettings };
    setSettings(updated);
    updateWorkspaceInFirestore({ settings: updated });
  };

  // Workspace Users
  const addWorkspaceUser = async (u: Omit<WorkspaceUser, 'id'>) => {
    const newId = `USER-${Math.floor(100 + Math.random() * 900)}`;
    const newUser: WorkspaceUser = { ...u, id: newId, isAddedUser: true };
    const updated = [...workspaceUsers, newUser];
    setWorkspaceUsers(updated);
    
    await updateWorkspaceInFirestore({ workspaceUsers: updated });

    const ownerId = workspaceOwnerId || auth.currentUser?.uid;
    if (ownerId && u.email && u.password) {
      try {
        const sharedUserRef = doc(db, 'shared_users', u.email.toLowerCase().trim());
        await setDoc(sharedUserRef, {
          id: newId,
          email: u.email.toLowerCase().trim(),
          password: u.password,
          name: u.name,
          role: u.role,
          workspaceOwnerId: ownerId,
          ownerEmail: auth.currentUser?.email || ''
        });
      } catch (error) {
        console.error("Failed to write to shared_users:", error);
      }
    }
  };

  const updateWorkspaceUser = async (id: string, updatedFields: Partial<WorkspaceUser>) => {
    const updated = workspaceUsers.map(u => u.id === id ? { ...u, ...updatedFields } : u);
    setWorkspaceUsers(updated);
    await updateWorkspaceInFirestore({ workspaceUsers: updated });

    const userToUpdate = updated.find(u => u.id === id);
    const ownerId = workspaceOwnerId || auth.currentUser?.uid;
    if (userToUpdate && ownerId && userToUpdate.email && userToUpdate.password) {
      try {
        const sharedUserRef = doc(db, 'shared_users', userToUpdate.email.toLowerCase().trim());
        await setDoc(sharedUserRef, {
          id: userToUpdate.id,
          email: userToUpdate.email.toLowerCase().trim(),
          password: userToUpdate.password,
          name: userToUpdate.name,
          role: userToUpdate.role,
          workspaceOwnerId: ownerId,
          ownerEmail: auth.currentUser?.email || ''
        });
      } catch (error) {
        console.error("Failed to update in shared_users:", error);
      }
    }
  };

  const deleteWorkspaceUser = async (id: string) => {
    const userToDelete = workspaceUsers.find(u => u.id === id);
    const updated = workspaceUsers.filter(u => u.id !== id);
    setWorkspaceUsers(updated);
    await updateWorkspaceInFirestore({ workspaceUsers: updated });

    if (userToDelete?.email) {
      try {
        const sharedUserRef = doc(db, 'shared_users', userToDelete.email.toLowerCase().trim());
        await deleteDoc(sharedUserRef);
      } catch (error) {
        console.error("Failed to delete shared_users:", error);
      }
    }
  };

  const logoutSubUser = () => {
    localStorage.removeItem('bt_workspace_owner_id');
    localStorage.removeItem('bt_sub_user');
    localStorage.removeItem('bt_offline_mode');
    setWorkspaceOwnerId(null);
    setCurrentSubUser(null);
    auth.signOut();
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
    setSettings(DEFAULT_SETTINGS);
    
    updateWorkspaceInFirestore({
      projects: [],
      team: [],
      attendance: [],
      finance: [],
      materials: [],
      meetings: [],
      crmLeads: [],
      quotations: [],
      photos: [],
      settings: DEFAULT_SETTINGS
    });
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
    const updatedPayload: any = {};
    if (Array.isArray(data.projects)) {
      setProjectsRaw(data.projects);
      updatedPayload.projects = data.projects;
    }
    if (Array.isArray(data.team)) {
      setTeam(data.team);
      updatedPayload.team = data.team;
    }
    if (Array.isArray(data.attendance)) {
      setAttendance(data.attendance);
      updatedPayload.attendance = data.attendance;
    }
    if (Array.isArray(data.finance)) {
      setFinance(data.finance);
      updatedPayload.finance = data.finance;
    }
    if (Array.isArray(data.materials)) {
      setMaterials(data.materials);
      updatedPayload.materials = data.materials;
    }
    if (Array.isArray(data.meetings)) {
      setMeetings(data.meetings);
      updatedPayload.meetings = data.meetings;
    }
    if (Array.isArray(data.crmLeads)) {
      setCrmLeads(data.crmLeads);
      updatedPayload.crmLeads = data.crmLeads;
    }
    if (Array.isArray(data.quotations)) {
      setQuotations(data.quotations);
      updatedPayload.quotations = data.quotations;
    }
    if (Array.isArray(data.photos)) {
      setPhotos(data.photos);
      updatedPayload.photos = data.photos;
    }
    if (data.settings && typeof data.settings === 'object') {
      setSettings(data.settings);
      updatedPayload.settings = data.settings;
    }

    updateWorkspaceInFirestore(updatedPayload);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold animate-pulse">
          Synchronizing Real-time Workspace Cloud...
        </p>
      </div>
    );
  }

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
      workspaceUsers,
      currentSubUser,
      logoutSubUser,
      authUser,
      workspaceOwnerId,
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
      addWorkspaceUser,
      updateWorkspaceUser,
      deleteWorkspaceUser,
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
