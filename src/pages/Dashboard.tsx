import React from 'react';
import { useApp } from '../context/AppContext';
import { formatRupees, formatRupeesShorthand } from '../utils/format';
import { 
  Building, 
  IndianRupee, 
  Users, 
  TrendingUp, 
  Briefcase, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
  setSelectedProjectId: (id: string) => void;
}

export default function Dashboard({ setCurrentTab, setSelectedProjectId }: DashboardProps) {
  const { projects, team, attendance, finance, crmLeads } = useApp();

  // 1. Calculate General Metrics
  const activeProjectsCount = projects.filter(p => p.status === 'Active').length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  
  // Today's attendance strength
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const laborStrengthToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day').length;

  const totalCRMValue = crmLeads
    .filter(c => c.stage === 'Lead' || c.stage === 'Proposal')
    .reduce((sum, c) => sum + c.value, 0);

  // 2. Format a couple of charts directly in beautiful responsive SVG charts
  const activeProjsData = projects.filter(p => p.status === 'Active').slice(0, 4);

  return (
    <div id="dashboard-page" className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 id="dashboard-header-title" className="text-2xl font-bold text-slate-800 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Overview of all construction projects
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            id="btn-dash-fast-attendance"
            onClick={() => setCurrentTab('attendance')}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-amber-500" />
            <span>Mark Labor</span>
          </button>
          <button 
            id="btn-dash-fast-quote"
            onClick={() => setCurrentTab('quotations')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-amber-500/10"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS GRID */}
      <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Projects */}
        <div id="kpi-card-sites" className="bg-white p-5 rounded-xl border border-slate-200/85 hover:border-slate-300 transition-all shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Projects</span>
            <span id="stat-active-sites" className="text-3xl font-extrabold text-slate-900 block font-sans leading-none">{projects.length}</span>
            <span className="text-[10px] text-slate-500">{activeProjectsCount} active</span>
          </div>
          <div className="w-11 h-11 bg-indigo-900 rounded-xl flex items-center justify-center text-white shrink-0">
            <Briefcase className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* KPI 2: Total Budget */}
        <div id="kpi-card-budget" className="bg-white p-5 rounded-xl border border-slate-200/85 hover:border-slate-300 transition-all shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Budget</span>
            <span id="stat-total-budget" className="text-3xl font-extrabold text-slate-900 block font-sans leading-none">
              {formatRupeesShorthand(totalBudget)}
            </span>
            <span className="text-[10px] text-slate-500 truncate block">
              {formatRupeesShorthand(totalSpent)} spent
            </span>
          </div>
          <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0">
            <span className="text-lg font-black font-sans">₹</span>
          </div>
        </div>

        {/* KPI 3: Team Members */}
        <div id="kpi-card-spent" className="bg-white p-5 rounded-xl border border-slate-200/85 hover:border-slate-300 transition-all shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Team Members</span>
            <span id="stat-total-spent" className="text-3xl font-extrabold text-slate-900 block font-sans leading-none">
              {team.length}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Active members
            </span>
          </div>
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* KPI 4: Avg Progress */}
        <div id="kpi-card-attendance" className="bg-white p-5 rounded-xl border border-slate-200/85 hover:border-slate-300 transition-all shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Avg Progress</span>
            <span id="stat-labor-strength" className="text-3xl font-extrabold text-slate-900 block font-sans leading-none">
              {projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0}%
            </span>
            <span className="text-[10px] text-slate-500 block">
              Across all projects
            </span>
          </div>
          <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

      </div>

      {/* CHARTS CONTAINER - BUDGET UTILIZATION & DETAILS */}
      <div id="dashboard-visuals-row" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Cost Comparison Chart */}
        <div id="panel-budget-chart" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-md">Budget vs. Actual Spent (₹ INR)</h3>
              <p className="text-xs text-slate-400">Dynamic expenditure comparison of top active projects</p>
            </div>
            <span className="text-[10px] bg-slate-100 font-bold px-2 py-1 rounded">Live Real-time calculation</span>
          </div>

          <div className="pt-4 h-64 w-full flex flex-col justify-end">
            {activeProjsData.length > 0 ? (
              <div className="flex items-end justify-around h-48 pb-2 border-b border-slate-100 relative">
                {/* Chart Bars loop */}
                {activeProjsData.map(proj => {
                  const budgetHeight = Math.min(100, Math.max(10, Math.round((proj.budget / 150000000) * 100)));
                  const spentHeight = Math.min(100, Math.max(5, Math.round((proj.spent / 150000000) * 100)));
                  return (
                    <div key={proj.id} className="flex flex-col items-center gap-2 group w-24">
                      {/* Interactive hover values */}
                      <div className="flex items-end gap-1.5 h-36 w-14 justify-center relative">
                        {/* Budget Bar - Slate */}
                        <div 
                          style={{ height: `${budgetHeight}%` }} 
                          className="w-4 bg-slate-200 group-hover:bg-slate-300 rounded-t transition-all relative"
                          title={`Budget: ${formatRupees(proj.budget)}`}
                        ></div>
                        {/* Spent Bar - Amber/Gold */}
                        <div 
                          style={{ height: `${spentHeight}%` }} 
                          className="w-4 bg-amber-500 group-hover:bg-amber-600 rounded-t transition-all relative"
                          title={`Spent: ${formatRupees(proj.spent)}`}
                        ></div>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-600 truncate max-w-[90px] block text-center" title={proj.name}>
                        {proj.name.split(' ')[0]}..
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1 text-slate-400 text-xs gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>No active projects to compare</span>
              </div>
            )}
            
            {/* Chart Legend */}
            <div className="flex justify-center gap-6 mt-4 text-[10px] font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-200 rounded"></span>
                <span className="text-slate-500">Scheduled Budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded"></span>
                <span className="text-slate-500">Spent to Date (₹)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Ring & Short statistics */}
        <div id="panel-stats-summary" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-md">General Work Status</h3>
            <p className="text-xs text-slate-400">Project status breaks & CRM targets</p>
          </div>

          <div className="flex items-center justify-center py-2">
            {/* SVG Donut representation of site statuses */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                {/* Progress bar represent completed projects ratio */}
                {projects.length > 0 ? (
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke="#eab308" 
                    strokeWidth="3.2" 
                    strokeDasharray={`${Math.round((projects.filter(p => p.status === 'Completed').length / projects.length) * 100)} ${100 - Math.round((projects.filter(p => p.status === 'Completed').length / projects.length) * 100)}`}
                    strokeDashoffset="0"
                  />
                ) : null}
              </svg>
              <div className="absolute text-center">
                <span id="summary-completed-count" className="text-2xl font-bold text-slate-900 block font-mono">
                  {projects.filter(p => p.status === 'Completed').length}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase block">Done Sites</span>
              </div>
            </div>
          </div>

          <hr className="border-t border-slate-100" />

          {/* Core Mini Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] block font-semibold text-slate-400 uppercase tracking-wider">CRM Pipeline</span>
              <span id="summary-crm-value" className="text-sm font-bold text-slate-800 font-mono">
                {formatRupeesShorthand(totalCRMValue)}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] block font-semibold text-slate-400 uppercase tracking-wider">Labor Strength</span>
              <span id="summary-total-workers" className="text-sm font-bold text-slate-800 font-mono">
                {team.length} Workers
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* CORE WORKPLACES SUMMARY TABULAR */}
      <div id="panel-dash-active-workplaces" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-md">Active Structural Sites</h3>
            <p className="text-xs text-slate-400">Track dynamic cost curves and schedule completion timelines</p>
          </div>
          <button 
            id="btn-goto-projects-site"
            onClick={() => setCurrentTab('projects')}
            className="text-amber-600 hover:text-amber-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>Configure All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase bg-slate-50/50">
                <th className="py-3 px-4 rounded-l-lg">Project Reference</th>
                <th className="py-3 px-4">Supervising Contact</th>
                <th className="py-3 px-4">Schedule Timeline</th>
                <th className="py-3 px-4 text-right">Portfolio Budget</th>
                <th className="py-3 px-4 text-right">Cumulative Spent</th>
                <th className="py-3 px-4">Financial Burn Ratio</th>
                <th className="py-3 px-4 text-center rounded-r-lg">Manage</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map(proj => {
                const burnPct = Math.round((proj.spent / proj.budget) * 100);
                const isOverBudget = proj.spent > proj.budget;
                
                return (
                  <tr key={proj.id} id={`dash-proj-row-${proj.id}`} className="border-b border-slate-100 hover:bg-slate-50/70 transition-all font-sans">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 leading-snug">{proj.name}</div>
                      <div className="text-[10px] font-mono text-amber-500 font-semibold">{proj.id} • {proj.client}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{proj.teamLead}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-500 font-mono">
                      {proj.startDate} <span className="text-[9px] text-slate-400">to</span> {proj.endDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      {formatRupees(proj.budget)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupees(proj.spent)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${Math.min(100, burnPct)}%` }} 
                            className={`h-full ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          ></div>
                        </div>
                        <span className={`text-[10px] font-bold font-mono ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {burnPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        id={`btn-dash-inspect-${proj.id}`}
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setCurrentTab(`project-detail-${proj.id}`);
                        }}
                        className="text-slate-700 hover:text-amber-500 font-bold text-xs bg-slate-100 hover:bg-slate-200 hover:shadow-xs px-2.5 py-1.5 rounded transition-all cursor-pointer"
                      >
                        Inspect Site
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
