export type ProjectStatus = 'Planned' | 'Active' | 'Completed';

export interface Project {
  id: string;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  budget: number;
  spent: number; // base spent (manual finance entries) + attendance daily cost automatic updates
  teamLead: string;
  description: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string; // e.g. Project Manager, Supervisor, Mason, Painter, Welder, Carpenter, Electrician, Labourer
  contact: string;
  dailyRate: number; // in INR (wage per day)
  assignedProjectId: string; // Project ID
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Leave';

export interface Attendance {
  id: string;
  date: string; // YYYY-MM-DD
  memberId: string; // references TeamMember id
  projectId: string; // references Project id
  status: AttendanceStatus;
  dailyRate: number; // stored daily rate at the time of recording
  wages: number; // calculated: Present = dailyRate, Half Day = dailyRate * 0.5, Absent/Leave = 0
  notes?: string;
}

export interface FinanceEntry {
  id: string;
  date: string;
  projectId: string;
  category: 'Expense' | 'Income';
  description: string;
  amount: number;
  vendor: string;
  paid: boolean;
}

export interface Material {
  id: string;
  name: string;
  projectId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalCost: number; // calculated quantityOrdered * unitCost
  supplier: string;
  status: 'Ordered' | 'Received' | 'Pending';
}

export interface MeetingNote {
  id: string;
  date: string;
  projectId: string;
  title: string;
  minutes: string;
  attendees: string;
  actionItems: string;
}

export interface CRMLead {
  id: string;
  name: string;
  company: string;
  contact: string;
  stage: 'Lead' | 'Proposal' | 'Won' | 'Lost';
  value: number;
  followUpDate: string;
  notes: string;
  projectId?: string; // set when Won and connected
}

export interface QuotationItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  clientEmail?: string;
  date: string;
  items: QuotationItem[];
  gstRate: number; // percentage, e.g. 18% for standard GST in India
  notes: string;
  logoAttached?: string; // base64 or url
  projectId?: string;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  title: string;
  type: 'Progress' | 'Bill';
  imageUrl: string; // base64 representation or default asset URL
  uploadedAt: string;
  description: string;
}

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Estimator' | 'Supervisor' | 'Viewer';
  isAddedUser?: boolean;
}

export interface AppSettings {
  appName: string;
  appSubtitle: string;
  logoUrl?: string; // Base64 or standard asset
}
