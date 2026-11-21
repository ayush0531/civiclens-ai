import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Map as MapIcon,
  SearchCode,
  ArrowRight,
  Camera,
  ShieldCheck
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { RoadDamageReport } from '../types';
import { useAuth } from '../context/AuthContext';
import { DamageBadge } from '../components/DamageBadge';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<RoadDamageReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [onlyMyReports, setOnlyMyReports] = useState<boolean>(false);
  const [trackInputId, setTrackInputId] = useState<string>('');

  useEffect(() => {
    fetchReports();
  }, [filterStatus, onlyMyReports]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports({
        workflow_status: filterStatus || undefined,
        my_reports_only: onlyMyReports,
        limit: 50,
      });
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInputId.trim()) {
      navigate(`/track/${trackInputId.trim()}`);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.title.toLowerCase().includes(term) ||
      r.reference_number.toLowerCase().includes(term) ||
      (r.address_text && r.address_text.toLowerCase().includes(term))
    );
  });

  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.workflow_status === 'SUBMITTED' || r.workflow_status === 'UNDER_REVIEW').length;
  const inProgressCount = reports.filter((r) => r.workflow_status === 'IN_PROGRESS' || r.workflow_status === 'ASSIGNED').length;
  const resolvedCount = reports.filter((r) => r.workflow_status === 'RESOLVED').length;

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Hero Section with Primary Action: Report a Pothole */}
        <div className="bg-gradient-to-r from-[#0b2234] via-[#0f3047] to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Civic Lens AI Citizen Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Nagpur Road Grievance Portal</h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Notice a road hazard or pothole? Photograph it directly or upload from your device to initiate automated AI inspection and register a civic grievance.
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                to="/report-new"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-900/30 transition-all hover:scale-[1.02]"
              >
                <Camera className="w-5 h-5 text-slate-950" />
                Report a Pothole
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
              >
                <MapIcon className="w-4 h-4 text-teal-300" />
                View Road Damage Map
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar: Track Complaint & Quick Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Track My Complaint Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <SearchCode className="w-4 h-4 text-teal-600" />
                Track My Complaint
              </span>
              <Link to="/track" className="text-[11px] font-bold text-teal-700 hover:underline">
                Advanced Tracking &rarr;
              </Link>
            </div>
            <form onSubmit={handleTrackSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Complaint ID (e.g. CVL-2026-0001 or NMC reference)..."
                value={trackInputId}
                onChange={(e) => setTrackInputId(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shrink-0"
              >
                Track
              </button>
            </form>
          </div>

          {/* Map Shortcut Card */}
          <Link
            to="/map"
            className="group bg-gradient-to-br from-teal-50 to-slate-100 p-5 rounded-2xl border border-teal-200 shadow-sm flex flex-col justify-between hover:border-teal-400 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600" />
                Nagpur Road Defect Map
              </span>
              <ArrowRight className="w-4 h-4 text-teal-700 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              Explore geocoded road defects and spatial DBSCAN severity clusters across Nagpur zones.
            </p>
          </Link>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Under Review</span>
            <div className="text-2xl font-bold font-mono text-amber-700 mt-1">{pendingCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Work in Progress</span>
            <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">{inProgressCount}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Repairs Resolved</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{resolvedCount}</div>
          </div>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by reference, street or landmark..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {user && (
              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={onlyMyReports}
                  onChange={(e) => setOnlyMyReports(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>My Reports Only</span>
              </label>
            )}
          </div>
        </div>

        {/* Reports Grid / Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Loading municipal reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Road Damage Reports Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no reports matching your current filter criteria. Try adjusting your search or submit a new case.
            </p>
            <Link
              to="/report-new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 text-white"
            >
              <PlusCircle className="w-4 h-4" />
              Report Road Defect
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((report) => (
              <Link
                key={report.id}
                to={`/case/${report.id}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col"
              >
                {/* Media Preview Header */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={getImageUrl(report.annotated_image_path || report.image_path)}
                    alt={report.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded backdrop-blur-sm">
                      {report.reference_number}
                    </span>
                    {report.is_demo_data && (
                      <span className="text-[9px] font-bold uppercase bg-amber-500/90 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                        Demo
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <StatusBadge status={report.workflow_status} size="sm" />
                  </div>
                  <div className="absolute bottom-2.5 right-2.5">
                    <PriorityBadge score={report.priority_score} />
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="mb-2">
                      <DamageBadge category={report.predicted_damage_category} size="sm" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-teal-700 transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {report.description || 'No description supplied.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{report.address_text || 'Nagpur'}</span>
                    </div>
                    <span className="shrink-0 flex items-center gap-1 text-teal-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Inspect &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
