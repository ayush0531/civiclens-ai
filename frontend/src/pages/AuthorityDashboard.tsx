import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  UserCheck, 
  ChevronRight,
  TrendingUp,
  MapPin,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';
import { RoadDamageReport, OverviewStats } from '../types';
import { DamageBadge } from '../components/DamageBadge';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

export const AuthorityDashboard: React.FC = () => {
  const [reports, setReports] = useState<RoadDamageReport[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<'all' | 'pending' | 'urgent' | 'assigned' | 'resolved'>('urgent');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsData, statsData] = await Promise.all([
        api.getReports({ sort_by: 'priority_score', order: 'desc', limit: 50 }),
        api.getOverviewStats(),
      ]);
      setReports(reportsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load authority dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = reports.filter((r) => {
    // Tab filter
    if (tab === 'pending' && !['SUBMITTED', 'UNDER_REVIEW'].includes(r.workflow_status)) return false;
    if (tab === 'urgent' && r.priority_score < 50.0) return false;
    if (tab === 'assigned' && !['ASSIGNED', 'IN_PROGRESS'].includes(r.workflow_status)) return false;
    if (tab === 'resolved' && r.workflow_status !== 'RESOLVED') return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        r.title.toLowerCase().includes(term) ||
        r.reference_number.toLowerCase().includes(term) ||
        (r.address_text && r.address_text.toLowerCase().includes(term))
      );
    }

    return true;
  });

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Municipal Operations</span>
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Authority Triage & Maintenance Queue</h1>
            <p className="text-xs text-slate-500 mt-1">
              Nagpur Municipal Corporation • Road Maintenance Division • Explainable Priority Dispatch
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/map"
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
            >
              Open Geographic Map
            </Link>
            <Link
              to="/analytics"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
            >
              View Strategic Analytics
            </Link>
          </div>
        </div>

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue Total</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{stats?.total_reports ?? '--'}</div>
            <span className="text-[10px] text-slate-400">Total reported defects</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Review</span>
            <div className="text-2xl font-bold font-mono text-amber-800 mt-1">{stats?.pending_review ?? '--'}</div>
            <span className="text-[10px] text-amber-600">Needs authority triage</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">High/Critical Urgency</span>
            <div className="text-2xl font-bold font-mono text-rose-800 mt-1">{stats?.critical_severity_count ?? '--'}</div>
            <span className="text-[10px] text-rose-600">Immediate hazard risk</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-sm">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Under Active Repair</span>
            <div className="text-2xl font-bold font-mono text-indigo-800 mt-1">{stats?.in_progress_count ?? '--'}</div>
            <span className="text-[10px] text-indigo-600">Field crew on site</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Repairs Verified</span>
            <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">{stats?.resolved_count ?? '--'}</div>
            <span className="text-[10px] text-emerald-600">Resolved with proof</span>
          </div>
        </div>

        {/* Queue Management Toolbar & Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setTab('urgent')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  tab === 'urgent' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                High Priority Queue (Prio &gt;= 50)
              </button>
              <button
                onClick={() => setTab('pending')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  tab === 'pending' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Awaiting Review
              </button>
              <button
                onClick={() => setTab('assigned')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  tab === 'assigned' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Active Assignments
              </button>
              <button
                onClick={() => setTab('resolved')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  tab === 'resolved' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Resolved History
              </button>
              <button
                onClick={() => setTab('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  tab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Records
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter queue by street or ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

          </div>

          {/* Prioritized Maintenance Table */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500">Ranking cases with multi-criteria engine...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800">No cases currently in this queue view.</p>
              <p className="text-[11px] text-slate-400">All corresponding tasks have been addressed or triaged.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Case Ref</th>
                    <th className="px-4 py-3">Pavement Defect & Location</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">Priority Score</th>
                    <th className="px-4 py-3 text-center">Severity</th>
                    <th className="px-4 py-3">Workflow Status</th>
                    <th className="px-4 py-3">Assigned Crew</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <Link to={`/case/${item.id}`} className="hover:text-teal-600 hover:underline">
                          {item.reference_number}
                        </Link>
                        {item.is_duplicate && (
                          <span className="block text-[9px] text-amber-700 font-sans font-bold">
                            Possible Dup
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <span className="font-bold text-slate-900 block truncate">{item.title}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {item.address_text || 'Nagpur'}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <DamageBadge category={item.predicted_damage_category} size="sm" />
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <PriorityBadge score={item.priority_score} />
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-800">
                          {item.severity_score.toFixed(0)}/100
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={item.workflow_status} size="sm" />
                      </td>

                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {item.assigned_authority_name || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          to={`/case/${item.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-teal-700 hover:bg-teal-50 font-semibold text-xs transition-colors"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
