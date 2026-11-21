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
  ChevronRight, 
  TrendingUp, 
  MapPin, 
  ArrowUpDown, 
  Download, 
  Flame, 
  Radio,
  Camera,
  ShieldCheck,
  Sparkles,
  Upload,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { RoadDamageReport, OverviewStats, SpatialCluster } from '../types';
import { DamageBadge } from '../components/DamageBadge';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { SeverityBadge } from '../components/DamageBadge';

const NAGPUR_ZONES = [
  'Laxmi Nagar',
  'Dharampeth',
  'Hanuman Nagar',
  'Dhantoli',
  'Nehru Nagar',
  'Gandhibagh',
  'Satranjipura',
  'Lakadganj',
  'Ashi Nagar',
  'Mangalwari'
];

export const AuthorityDashboard: React.FC = () => {
  const [reports, setReports] = useState<RoadDamageReport[]>([]);
  const [clusters, setClusters] = useState<SpatialCluster[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<'urgent' | 'pending' | 'assigned' | 'resolved' | 'all'>('urgent');
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [wardFilter, setWardFilter] = useState<string>('all');

  // AI Repair Verification Modal State
  const [verifyModalReport, setVerifyModalReport] = useState<RoadDamageReport | null>(null);
  const [repairPhoto, setRepairPhoto] = useState<File | null>(null);
  const [repairNotes, setRepairNotes] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsData, statsData, clusterData] = await Promise.all([
        api.getReports({ sort_by: 'priority_score', order: 'desc', limit: 50 }),
        api.getOverviewStats(),
        api.getSpatialClusters(450.0, 2),
      ]);
      setReports(reportsData);
      setStats(statsData);
      setClusters(clusterData);
    } catch (err) {
      console.error('Failed to load authority dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = reports.filter((r) => {
    // Cluster filter
    if (selectedClusterId !== null) {
      const cl = clusters.find(c => c.cluster_id === selectedClusterId);
      if (cl && !cl.report_ids.includes(r.id)) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && r.predicted_damage_category !== categoryFilter) {
      return false;
    }

    // Ward zone filter
    if (wardFilter !== 'all') {
      const wName = (r.ward_name || r.area_locality || '').toLowerCase();
      if (!wName.includes(wardFilter.toLowerCase())) return false;
    }

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

  const handleExportCSV = () => {
    const headers = [
      'Reference',
      'Title',
      'Address',
      'Category',
      'SeverityScore',
      'PriorityScore',
      'InternalStatus',
      'OfficialStatus',
      'OfficialRefID',
      'Jurisdiction',
      'AssignedTo'
    ];
    const rows = filteredQueue.map(r => [
      r.reference_number,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${(r.address_text || '').replace(/"/g, '""')}"`,
      r.predicted_damage_category,
      r.severity_score,
      r.priority_score,
      r.workflow_status,
      r.external_submission_status || 'NOT_REGISTERED',
      `"${(r.external_reference_id || 'None').replace(/"/g, '""')}"`,
      r.road_jurisdiction || 'NMC',
      `"${(r.assigned_authority_name || 'Unassigned').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Civic_Lens_AI_Maintenance_Queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVerifyRepairSubmit = async () => {
    if (!verifyModalReport || !repairPhoto) {
      setVerifyError('Please upload a post-repair verification photograph.');
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await api.verifyRepair(verifyModalReport.id, repairPhoto, repairNotes);
      setVerifyResult(res);
      await fetchDashboardData();
    } catch (err: any) {
      setVerifyError(err.message || 'Repair verification inspection failed.');
    } finally {
      setVerifying(false);
    }
  };

  const openVerifyModal = (report: RoadDamageReport) => {
    setVerifyModalReport(report);
    setRepairPhoto(null);
    setRepairNotes('');
    setVerifyResult(null);
    setVerifyError(null);
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Municipal Operations Hub</span>
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Authority Triage & Maintenance Queue</h1>
            <p className="text-xs text-slate-500 mt-1">
              Nagpur Municipal Corporation • Pavement Distress Triage • Explainable 6-Factor Priority Engine
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <Link
              to="/map"
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-teal-200 bg-teal-50/80 hover:bg-teal-100 text-teal-800 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>Map View</span>
            </Link>
            <Link
              to="/analytics"
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors"
            >
              Analytics
            </Link>
          </div>
        </div>

        {/* Demonstration Operations Center Notice Banner */}
        <div className="bg-gradient-to-r from-teal-900 to-navy-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-teal-700/50 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded">
                Simulated Demonstration Operations Center
              </span>
              <span className="text-xs font-bold text-slate-200">Nagpur Municipal Corridor (Pilot)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Triage, prioritization, and field assignments performed in this dashboard represent an internal engineering simulation. Citizen handoffs to the official NMC grievance channel require external verification.
            </p>
          </div>
        </div>

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Queue Total</span>
            <div className="text-2xl font-black font-mono text-navy-900 mt-1">{stats?.total_reports ?? '--'}</div>
            <span className="text-[10px] text-slate-400">Total reported defects</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Review</span>
            <div className="text-2xl font-black font-mono text-amber-800 mt-1">{stats?.pending_review ?? '--'}</div>
            <span className="text-[10px] text-amber-600">Needs authority triage</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Critical Urgency</span>
            <div className="text-2xl font-black font-mono text-rose-800 mt-1">{stats?.critical_severity_count ?? '--'}</div>
            <span className="text-[10px] text-rose-600">Immediate hazard risk</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-2xs">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Active Repairs</span>
            <div className="text-2xl font-black font-mono text-indigo-800 mt-1">{stats?.in_progress_count ?? '--'}</div>
            <span className="text-[10px] text-indigo-600">Field crew on site</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Repairs Verified</span>
            <div className="text-2xl font-black font-mono text-emerald-800 mt-1">{stats?.resolved_count ?? '--'}</div>
            <span className="text-[10px] text-emerald-600">Resolved with audit proof</span>
          </div>
        </div>

        {/* Spatial DBSCAN Hotspot Alerts Strip */}
        {clusters.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  DBSCAN Spatial Hotspots Discovered ({clusters.length} Active Corridors)
                </span>
              </div>
              {selectedClusterId !== null && (
                <button
                  onClick={() => setSelectedClusterId(null)}
                  className="text-[11px] text-teal-700 font-bold hover:underline"
                >
                  Clear Hotspot Filter
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {clusters.map((cl) => {
                const isSelected = selectedClusterId === cl.cluster_id;
                return (
                  <button
                    key={cl.cluster_id}
                    onClick={() => setSelectedClusterId(isSelected ? null : cl.cluster_id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all text-left flex items-center gap-2 ${
                      isSelected
                        ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      cl.hazard_level === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    <span className="font-bold">{cl.area_name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10">
                      {cl.report_count} defects ({cl.dominant_category})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Queue Management Toolbar & Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setTab('urgent')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  tab === 'urgent' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                High Priority Queue (P ≥ 50)
              </button>
              <button
                onClick={() => setTab('pending')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  tab === 'pending' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Awaiting Review
              </button>
              <button
                onClick={() => setTab('assigned')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  tab === 'assigned' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Active Assignments
              </button>
              <button
                onClick={() => setTab('resolved')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  tab === 'resolved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Resolved History
              </button>
              <button
                onClick={() => setTab('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  tab === 'all' ? 'bg-navy-900 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                All Records
              </button>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Ward Filter */}
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
              >
                <option value="all">All Nagpur Zones (10)</option>
                {NAGPUR_ZONES.map((zone) => (
                  <option key={zone} value={zone}>Zone: {zone}</option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
              >
                <option value="all">All Distress Types</option>
                <option value="Pothole">Pothole</option>
                <option value="Alligator cracking">Alligator Cracking</option>
                <option value="Longitudinal crack">Longitudinal Crack</option>
                <option value="Transverse crack">Transverse Crack</option>
                <option value="Surface deterioration">Surface Deterioration</option>
              </select>

              <div className="relative w-full md:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by street or ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
              </div>
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
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Case Ref</th>
                    <th className="px-4 py-3">Pavement Defect & Location</th>
                    <th className="px-4 py-3">Distress Class</th>
                    <th className="px-4 py-3 text-center">Priority Score</th>
                    <th className="px-4 py-3 text-center">Severity</th>
                    <th className="px-4 py-3">Workflow Status</th>
                    <th className="px-4 py-3">SLA Status</th>
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
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          {item.address_text || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <DamageBadge category={item.predicted_damage_category} size="sm" />
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <PriorityBadge score={item.priority_score} />
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <SeverityBadge level={item.severity_level} size="sm" />
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {item.severity_score.toFixed(0)}/100
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <StatusBadge status={item.workflow_status} size="sm" />
                          {item.external_reference_id ? (
                            <span className="block text-[10px] font-bold text-amber-700 font-mono">
                              NMC: {item.external_reference_id}
                            </span>
                          ) : (
                            <span className="block text-[10px] text-slate-400">
                              Unregistered (NMC)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.is_sla_breached ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            ⚠️ Breached
                          </span>
                        ) : item.sla_deadline_at ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700">
                            <Clock className="w-3 h-3 text-teal-600" />
                            {new Date(item.sla_deadline_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Standard</span>
                        )}
                        {item.reopened_count && item.reopened_count > 0 ? (
                          <span className="block text-[9px] font-mono font-bold text-amber-700 mt-0.5">
                            Reopened x{item.reopened_count}
                          </span>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {item.assigned_authority_name || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openVerifyModal(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold text-xs transition-colors mr-1.5"
                          title="Run AI Before/After Repair Inspection"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          <span>Verify AI</span>
                        </button>
                        <Link
                          to={`/case/${item.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-teal-700 hover:bg-teal-50 font-semibold text-xs transition-colors shadow-2xs"
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

      {/* AI Repair Verification Modal */}
      {verifyModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-navy-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <span>AI Repair Quality Verification (Computer Vision)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload post-patching photo for case <span className="font-mono font-bold text-slate-800">{verifyModalReport.reference_number}</span> ({verifyModalReport.title}).
                </p>
              </div>
              <button
                onClick={() => setVerifyModalReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {verifyError && (
              <div className="p-3 rounded-xl text-xs bg-rose-50 text-rose-800 border border-rose-200">
                {verifyError}
              </div>
            )}

            {verifyResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border space-y-2 ${
                  verifyResult.verification_status === 'VERIFIED_REPAIRED'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : verifyResult.verification_status === 'PARTIAL_REPAIR_DETECTED'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">AI Inspection Verdict:</span>
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-full bg-white/80 border">
                      {verifyResult.verification_status}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    Residual Defect Index: <strong>{verifyResult.residual_damage_index.toFixed(1)}/100</strong> • Resolution Confidence: <strong>{(verifyResult.confidence_score * 100).toFixed(0)}%</strong>
                  </p>
                  <p className="text-[11px] opacity-90">
                    {verifyResult.verification_status === 'VERIFIED_REPAIRED'
                      ? '✓ Pavement surface successfully restored. Defect cavity neutralized. Case transitioned to RESOLVED.'
                      : verifyResult.verification_status === 'PARTIAL_REPAIR_DETECTED'
                      ? '⚠️ Partial repair detected. Surface uneven or remaining minor cavity. Crew notified for re-inspection.'
                      : '❌ Defect remains active! Road damage void persists in uploaded evidence.'}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setVerifyModalReport(null)}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Post-Repair Road Photograph <span className="text-rose-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 text-center bg-slate-50">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setRepairPhoto(e.target.files[0]);
                        }
                      }}
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
                    />
                    {repairPhoto && (
                      <span className="text-xs text-teal-700 font-medium block mt-2">
                        ✓ Selected: {repairPhoto.name}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Field Inspection Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    placeholder="e.g. Cold mix asphalt compacted with 2-ton vibratory roller on WHC Road lane..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setVerifyModalReport(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={verifying || !repairPhoto}
                    onClick={handleVerifyRepairSubmit}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {verifying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Evaluating Computer Vision...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run AI Resolution Inspection</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
