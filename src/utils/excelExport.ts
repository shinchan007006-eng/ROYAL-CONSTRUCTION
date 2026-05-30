import * as XLSX from 'xlsx';
import { Project, TeamMember, Attendance, FinanceEntry, Material, MeetingNote, CRMLead, Quotation } from '../types';

export function exportAllDataToExcel(data: {
  projects: Project[];
  teams: TeamMember[];
  attendance: Attendance[];
  finance: FinanceEntry[];
  materials: Material[];
  meetings: MeetingNote[];
  crm: CRMLead[];
  quotations: Quotation[];
}) {
  const wb = XLSX.utils.book_new();

  // 1. Projects Worksheet
  const projectsData = data.projects.map(p => ({
    'Project ID': p.id,
    'Project Name': p.name,
    'Client Name': p.client,
    'Start Date': p.startDate,
    'End Date': p.endDate,
    'Status': p.status,
    'Budget (INR)': p.budget,
    'Total Spent (INR)': p.spent, // includes automated attendance wages + finance expenses
    'Team Lead': p.teamLead,
    'Description': p.description
  }));
  const wsProjects = XLSX.utils.json_to_sheet(projectsData);
  XLSX.utils.book_append_sheet(wb, wsProjects, 'Projects');

  // 2. Teams Worksheet
  const teamsData = data.teams.map(t => {
    const projName = data.projects.find(p => p.id === t.assignedProjectId)?.name || 'Unassigned';
    return {
      'Member ID': t.id,
      'Name': t.name,
      'Role': t.role,
      'Contact Info': t.contact,
      'Daily Wage (INR)': t.dailyRate,
      'Assigned Project': projName
    };
  });
  const wsTeams = XLSX.utils.json_to_sheet(teamsData);
  XLSX.utils.book_append_sheet(wb, wsTeams, 'Teams');

  // 3. Daily Attendance Worksheet
  const attendanceData = data.attendance.map(a => {
    const memberName = data.teams.find(t => t.id === a.memberId)?.name || 'Unknown';
    const projName = data.projects.find(p => p.id === a.projectId)?.name || 'Unknown';
    return {
      'Date': a.date,
      'Worker Name': memberName,
      'Project': projName,
      'Status': a.status,
      'Daily Base Rate (INR)': a.dailyRate,
      'Wages Earned (INR)': a.wages,
      'Remarks': a.notes || ''
    };
  });
  const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
  XLSX.utils.book_append_sheet(wb, wsAttendance, 'Daily Attendance');

  // 4. Finance Logs Worksheet
  const financeData = data.finance.map(f => {
    const projName = data.projects.find(p => p.id === f.projectId)?.name || 'All Company';
    return {
      'Voucher ID': f.id,
      'Date': f.date,
      'Category': f.category,
      'Associated Project': projName,
      'Description': f.description,
      'Amount (INR)': f.amount,
      'Vendor / Client': f.vendor,
      'Payment Cleared': f.paid ? 'Yes' : 'No'
    };
  });
  const wsFinance = XLSX.utils.json_to_sheet(financeData);
  XLSX.utils.book_append_sheet(wb, wsFinance, 'Finance Log');

  // 5. Materials Worksheet
  const materialsData = data.materials.map(m => {
    const projName = data.projects.find(p => p.id === m.projectId)?.name || 'Unknown';
    return {
      'Material ID': m.id,
      'Material Name': m.name,
      'Attached Project': projName,
      'Qty Ordered': m.quantityOrdered,
      'Qty Received': m.quantityReceived,
      'Unit Price (INR)': m.unitCost,
      'Total Base Cost (INR)': m.totalCost,
      'Supplier Account': m.supplier,
      'Status': m.status
    };
  });
  const wsMaterials = XLSX.utils.json_to_sheet(materialsData);
  XLSX.utils.book_append_sheet(wb, wsMaterials, 'Materials Log');

  // 6. Agenda/Meetings MOM Worksheet
  const meetingsData = data.meetings.map(m => {
    const projName = data.projects.find(p => p.id === m.projectId)?.name || 'Unknown';
    return {
      'MOM ID': m.id,
      'Meeting Date': m.date,
      'Project': projName,
      'Topic / Agenda': m.title,
      'Attendees': m.attendees,
      'Discussion Minutes': m.minutes,
      'Action Items / Directives': m.actionItems
    };
  });
  const wsMeetings = XLSX.utils.json_to_sheet(meetingsData);
  XLSX.utils.book_append_sheet(wb, wsMeetings, 'Meeting Notes (MOM)');

  // 7. CRM Worksheet
  const crmData = data.crm.map(c => ({
    'Lead ID': c.id,
    'Client/Contact Name': c.name,
    'Company': c.company,
    'Contact': c.contact,
    'Workflow Stage': c.stage,
    'Project Value (INR)': c.value,
    'Next Follow-Up Date': c.followUpDate,
    'Discussion Notes': c.notes
  }));
  const wsCRM = XLSX.utils.json_to_sheet(crmData);
  XLSX.utils.book_append_sheet(wb, wsCRM, 'CRM Leads');

  // 8. Quotations Worksheet
  const quotationsData = data.quotations.map(q => {
    const totalItemsCost = q.items.reduce((sum, item) => sum + item.lineTotal, 0);
    const gstTotal = Math.round(totalItemsCost * (q.gstRate / 100));
    return {
      'Quotation ID': q.id,
      'Quote Ref #': q.quoteNumber,
      'Generated Date': q.date,
      'Client / Firm Name': q.clientName,
      'Billing Address': q.clientAddress,
      'Item Subtotal (INR)': totalItemsCost,
      'GST Tax Rate %': q.gstRate,
      'Tax Amount (INR)': gstTotal,
      'Gross Total (INR)': (totalItemsCost + gstTotal),
      'Memo': q.notes
    };
  });
  const wsQuotations = XLSX.utils.json_to_sheet(quotationsData);
  XLSX.utils.book_append_sheet(wb, wsQuotations, 'Quotations');

  // Write file out and prompt download
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Onsite_BuildPro_Export_${dateStr}.xlsx`);
}
