import { Project, TeamMember, Attendance, FinanceEntry, Material, MeetingNote, CRMLead, Quotation, ProjectPhoto, AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  appName: "Onsite Build-Pro",
  appSubtitle: "Construction ERP Dashboard",
  logoUrl: "" // Empty will fallback to elegant SVG logo
};

export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_TEAM: TeamMember[] = [];
export const INITIAL_ATTENDANCE: Attendance[] = [];
export const INITIAL_FINANCE: FinanceEntry[] = [];
export const INITIAL_MATERIALS: Material[] = [];
export const INITIAL_MEETINGS: MeetingNote[] = [];
export const INITIAL_CRM: CRMLead[] = [];
export const INITIAL_QUOTATIONS: Quotation[] = [];
export const INITIAL_PHOTOS: ProjectPhoto[] = [];
