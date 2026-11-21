import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight, 
  Wrench, 
  FileText, 
  Sparkles, 
  Layers,
  ChevronRight,
  Info,
  Building2,
  Lock,
  Camera
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { PublicTrackReport, WorkflowStatus } from '../types';
import { NMCHandoffCard } from '../components/NMCHandoffCard';
import { StatusBadge } from '../components/StatusBadge';
import { VerificationPipelineCard } from '../components/VerificationPipelineCard';
import { RepairComparisonCard } from '../components/RepairComparisonCard';

interface StepDefinition {
  key: WorkflowStatus;
  label: string;
  description: string;
  stepNumber: number;
}

const LIFECYCLE_STEPS: StepDefinition[] = [
  { key: 'SUBMITTED', label: 'Submitted', description: 'Complaint logged with initial photo & coordinates', stepNumber: 1 },
  { key: 'UNDER_REVIEW', label: 'Under Review', description: 'NMC triage assessment & severity verification', stepNumber: 2 },
  { key: 'ACTION_PLANNED', label: 'Action Planned', description: 'Repair scheduled with designated work crew', stepNumber: 3 },
  { key: 'IN_PROGRESS', label: 'In Progress', description: 'On-site maintenance & asphalt patching underway', stepNumber: 4 },
  { key: 'RESOLVED', label: 'Resolved', description: 'Pavement restored with photo inspection proof', stepNumber: 5 }
];

export const TrackComplaintPage: React.FC = () => {
  const { identifier: urlIdentifier } = useParams<{ identifier?: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(urlIdentifier || '');
  const [report, setReport] = useState<PublicTrackReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Dispute & Reopen Grievance State
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState<'DEFECT_NOT_REPAIRED' | 'POOR_QUALITY_REPAIR' | 'SURFACE_UNEVEN' | 'OTHER'>('DEFECT_NOT_REPAIRED');
  const [reopenComments, setReopenComments] = useState('');
  const [reopening, setReopening] = useState(false);
  const [reopenMsg, setReopenMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('civiclens_recent_complaints');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToRecent = (id: string) => {
    try {
      const current = recentSearches.filter(s => s.toLowerCase() !== id.toLowerCase());
      const updated = [id, ...current].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('civiclens_recent_complaints', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const fetchComplaint = async (targetId: string) => {
    if (!targetId || !targetId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.trackReport(targetId.trim());
      setReport(data);
      saveToRecent(data.reference_number || String(data.id));
    } catch (err: any) {
      setReport(null);
      setError(err.message || `No complaint found matching "${targetId}". Please verify your reference number.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlIdentifier) {
      setSearchQuery(urlIdentifier);
      fetchComplaint(urlIdentifier);
    }
  }, [urlIdentifier]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/track/${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReopenSubmit = async () => {
    if (!report) return;
    if (!reopenComments.trim()) {
      setReopenMsg({ text: 'Please explain why the resolution is disputed.', error: true });
      return;
    }
    setReopening(true);
    setReopenMsg(null);
    try {
      await api.reopenComplaint(report.id, {
        reason: reopenReason,
        comments: reopenComments.trim(),
        citizen_name: 'Concerned Citizen'
      });
      setReopenMsg({ text: 'Dispute submitted. Complaint status has been reopened for municipal review.', error: false });
      // Refresh report data
      await fetchComplaint(report.reference_number || String(report.id));
      setTimeout(() => setShowReopenModal(false), 2000);
    } catch (err: any) {
      setReopenMsg({ text: err.message || 'Failed to submit dispute.', error: true });
    } finally {
      setReopening(false);
    }
  };

  // Determine stage progression index (0 to 4, or -1 if rejected)
  const getStepStatus = (stepKey: WorkflowStatus) => {
    if (!report) return 'pending';
    if (report.workflow_status === 'REJECTED') {
      return stepKey === 'SUBMITTED' ? 'completed' : 'rejected';
    }

    const order: WorkflowStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'ACTION_PLANNED', 'IN_PROGRESS', 'RESOLVED'];
    const currentIndex = order.indexOf(report.workflow_status);
    const targetIndex = order.indexOf(stepKey);

    if (targetIndex < currentIndex) return 'completed';
    if (targetIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStatusBadgeStyle = (status: WorkflowStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ACTION_PLANNED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Citizen Public Portal • Nagpur Municipal Corridor
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
                Track Road Defect Complaint
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Check the real-time review, AI telemetry, and maintenance status of your submitted road defect using your unique reference number.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/report-new"
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Report New Defect</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Search Bar Form */}
          <form onSubmit={handleSearchSubmit} className="mt-6">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Reference Number (e.g. CVL-2025-0001 or ID #1)..."
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track Complaint</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Shortcuts */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Quick Samples (Nagpur Pilot):</span>
            {['CVL-2025-0001', 'CVL-2025-0002', 'CVL-2025-0003', 'CVL-2025-0005'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setSearchQuery(sample);
                  navigate(`/track/${sample}`);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-800 font-mono text-[11px] transition-colors"
              >
                {sample}
              </button>
            ))}

            {recentSearches.length > 0 && (
              <span className="ml-auto text-[11px] text-slate-400">
                Recent: {recentSearches.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">Complaint Not Found</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
            <p className="text-[11px] text-slate-500">
              Please double check the format (e.g. <span className="font-mono font-bold">CVL-2025-0001</span> or integer ID <span className="font-mono font-bold">1</span>).
            </p>
          </div>
        )}

        {/* Report Details Container */}
        {report && (
          <div className="space-y-6">

            {/* Honest NMC Demonstration Notice Banner */}
            <div className="bg-gradient-to-r from-teal-900 to-navy-900 text-white rounded-2xl p-5 shadow-sm border border-teal-700/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded">
                    Demonstration Workflow
                  </span>
                  <span className="text-xs font-bold text-slate-200">Nagpur Municipal Corporation (NMC) Scope</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.external_submission_notice}
                </p>
              </div>
            </div>

            {/* Complaint Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Civic Lens AI Ref:</span>
                    <span className="font-mono text-base sm:text-lg font-black text-navy-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                      {report.reference_number}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded border border-teal-200">
                      Internal ID
                    </span>
                    <button
                      onClick={() => handleCopyReference(report.reference_number)}
                      className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Copy Reference ID"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <h2 className="text-xl font-black text-navy-900 mt-2">{report.title}</h2>
                  {report.description && (
                    <p className="text-xs text-slate-600 mt-1">{report.description}</p>
                  )}
                </div>

                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <div className="flex flex-col sm:items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Internal:</span>
                      <StatusBadge status={report.workflow_status} size="sm" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Official:</span>
                      {report.external_reference_id ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>NMC Ref: {report.external_reference_id} (Unverified)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <span>Not registered with NMC</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Submitted: {new Date(report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Location & Locality Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Locality / Zone</span>
                    <span className="font-semibold text-slate-800">{report.area_locality || 'Nagpur Central'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Landmark</span>
                    <span className="font-semibold text-slate-800 truncate">{report.landmark || report.address_text || 'Sitabuldi Junction'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Layers className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Road Classification</span>
                    <span className="font-semibold text-slate-800">{report.road_classification}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Jurisdiction Authority</span>
                    <span className="font-semibold text-teal-900">{report.road_jurisdiction || 'NMC (Nagpur)'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assisted Citizen Handoff to Official NMC Grievance Portal */}
            <NMCHandoffCard
              report={report}
              onOfficialReferenceSaved={(updated) => setReport((prev) => prev ? ({ ...prev, ...updated }) : updated)}
              showContinueTrackingButton={false}
            />

            {/* SLA Status Banner */}
            {report.sla_deadline_at && (
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                report.is_sla_breached
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-teal-50 border-teal-200 text-teal-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="font-bold block">
                      Municipal SLA Resolution Target:{' '}
                      {new Date(report.sla_deadline_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[11px] opacity-80">
                      Standard NMC Road Pavement Service Level Agreement
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {report.reopened_count && report.reopened_count > 0 ? (
                    <span className="px-2.5 py-1 rounded-full font-mono font-bold text-[10px] uppercase bg-amber-100 text-amber-900 border border-amber-300">
                      Reopened x{report.reopened_count}
                    </span>
                  ) : null}
                  <span className={`px-3 py-1 rounded-full font-mono font-bold text-xs uppercase ${
                    report.is_sla_breached
                      ? 'bg-rose-200 text-rose-900 border border-rose-300'
                      : 'bg-teal-200 text-teal-900 border border-teal-300'
                  }`}>
                    {report.is_sla_breached ? '⚠️ SLA Breached' : '✓ SLA Active'}
                  </span>
                </div>
              </div>
            )}

            {/* 5-Stage Automated Verification Pipeline Audit Card */}
            {report.verification_stages && report.verification_stages.length > 0 && (
              <VerificationPipelineCard stages={report.verification_stages} />
            )}

            {/* AI Before-and-After Repair Verification Comparison */}
            {(report.repair_evidences && report.repair_evidences.length > 0) || report.resolution_image_path ? (
              <RepairComparisonCard
                evidence={report.repair_evidences?.[0]}
                beforeImagePath={report.image_path}
                afterImagePath={report.resolution_image_path || undefined}
              />
            ) : null}

            {/* Dispute Resolution Card for Citizens if Resolved */}
            {report.workflow_status === 'RESOLVED' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-amber-900">
                      Pavement Defect Marked Resolved: Disagree with the Repair Quality?
                    </h4>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed max-w-xl">
                    If asphalt patching is incomplete, the cavity has recurred, or the road surface remains uneven, citizens can dispute the repair to trigger secondary municipal inspection.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                >
                  Dispute Resolution / Reopen Grievance
                </button>
              </div>
            )}

            {/* Lifecycle Progress Stepper (5 Municipal Steps) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    Municipal Resolution Stepper [Internal Demonstration Lifecycle]
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Milestone tracking through the internal Civic Lens AI simulated triage and dispatch cycle
                  </p>
                </div>
                {report.workflow_status === 'RESOLVED' && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Case Fully Closed
                  </span>
                )}
                {report.workflow_status === 'REJECTED' && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Complaint Rejected / Duplicate
                  </span>
                )}
              </div>

              {/* Stepper Graphic */}
              <div className="relative">
                {/* Horizontal line behind steps (desktop) */}
                <div className="hidden md:block absolute top-6 left-8 right-8 h-1 bg-slate-100 -z-0"></div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                  {LIFECYCLE_STEPS.map((step) => {
                    const status = getStepStatus(step.key);
                    const isCompleted = status === 'completed';
                    const isCurrent = status === 'current';
                    const isRejected = status === 'rejected';

                    return (
                      <div 
                        key={step.key} 
                        className={`p-3.5 rounded-xl border transition-all ${
                          isCurrent 
                            ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-500/20 shadow-xs' 
                            : isCompleted 
                            ? 'bg-slate-50 border-emerald-200' 
                            : isRejected
                            ? 'bg-rose-50/50 border-rose-200 opacity-60'
                            : 'bg-white border-slate-200 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCompleted 
                              ? 'bg-emerald-600 text-white' 
                              : isCurrent 
                              ? 'bg-teal-600 text-white animate-pulse' 
                              : isRejected
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isCompleted ? <Check className="w-4 h-4" /> : step.stepNumber}
                          </div>
                          <div>
                            <span className={`text-xs font-bold block ${isCurrent ? 'text-teal-900' : isCompleted ? 'text-emerald-900' : 'text-slate-800'}`}>
                              {step.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {step.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Visual Photographic Evidence & AI Telemetry */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Column: Photos */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-teal-600" />
                  Photographic Evidence & AI Inspection
                </h3>

                <div className="space-y-4">
                  {/* Citizen / AI Annotated Photo */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 relative group">
                    <img
                      src={getImageUrl(report.annotated_image_path || report.image_path)}
                      alt="Road Defect Evidence"
                      className="w-full h-64 object-cover object-center"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border border-white/20">
                      {report.annotated_image_path ? 'AI Bounding Box Overlay' : 'Original Field Capture'}
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      GPS: {report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E
                    </div>
                  </div>

                  {/* Resolution Photo if Resolved */}
                  {report.resolution_image_path && (
                    <div className="border border-emerald-300 rounded-xl overflow-hidden bg-slate-900 relative">
                      <img
                        src={getImageUrl(report.resolution_image_path)}
                        alt="Resolution Verification Proof"
                        className="w-full h-52 object-cover object-center"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-emerald-600/90 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-md">
                        ✓ Verified Repair Closure Proof
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AI Telemetry & Mathematical Severity */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    AI Telemetry & Severity Analysis
                  </h3>
                  <span className="text-[10px] font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200 font-bold">
                    {report.analyses?.[0]?.model_identifier || (report.prediction_confidence ? 'AI Detection' : 'Heuristic Screening')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Damage Category</span>
                    <span className="text-sm font-black text-navy-900 mt-1 block">
                      {report.predicted_damage_category || 'Pending Triage'}
                    </span>
                    <span className="text-[11px] text-teal-700 font-mono mt-0.5 block">
                      Classified Defect
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">AI Confidence</span>
                    <span className="text-sm font-black text-teal-700 font-mono mt-1 block">
                      {report.prediction_confidence ? `${(report.prediction_confidence * 100).toFixed(1)}%` : 'Pending'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Model Confidence
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Physical Severity</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-black text-rose-600 font-mono">
                        {report.severity_score.toFixed(1)} / 100
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        report.severity_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                        report.severity_level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        report.severity_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {report.severity_level}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Dispatch Priority</span>
                    <span className="text-sm font-black text-indigo-700 font-mono mt-1 block">
                      {report.priority_score.toFixed(1)} / 100
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      6-Factor Weighted Index
                    </span>
                  </div>
                </div>

                {/* Resolution Notes if Available */}
                {report.resolution_notes && (
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                    <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Official Resolution Remarks:
                    </span>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {report.resolution_notes}
                    </p>
                    {report.resolved_at && (
                      <span className="text-[10px] text-emerald-700 font-mono block pt-1">
                        Completed: {new Date(report.resolved_at).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                )}

                {/* Citizen Privacy Disclaimer */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-[11px] text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Citizen Privacy Guarantee:</strong> In accordance with civic disclosure policies, the citizen's personal phone number and private contact records are masked in this public view.
                  </span>
                </div>
              </div>

            </div>

            {/* Chronological Audit Trail & Status History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Audit Trail & Review History
              </h3>

              {report.status_history && report.status_history.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {report.status_history.map((hist, idx) => (
                    <div key={idx} className="relative flex items-start gap-3 pl-1">
                      <div className="w-6 h-6 rounded-full bg-teal-500 border-2 border-white shadow-2xs flex items-center justify-center shrink-0 z-10">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-1 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-900">
                            Status changed to <span className="font-mono text-teal-700">{hist.new_status}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(hist.timestamp).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {hist.notes && (
                          <p className="text-slate-600 text-xs mt-1 bg-white p-2 rounded-lg border border-slate-100">
                            {hist.notes}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Recorded by: {hist.changed_by_name || 'System / Field Crew'} ({hist.changed_by_role || 'Municipal Officer'})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  Complaint registered. Awaiting initial municipal review notes.
                </div>
              )}
            </div>

          </div>
        )}

        {/* Dispute & Reopen Grievance Modal */}
        {showReopenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-navy-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span>Dispute Repair & Reopen Grievance</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Submit secondary inspection request to NMC zonal triage team for case{' '}
                    <span className="font-mono font-bold text-slate-800">{report?.reference_number}</span>.
                  </p>
                </div>
                <button
                  onClick={() => setShowReopenModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  &times;
                </button>
              </div>

              {reopenMsg && (
                <div className={`p-3 rounded-xl text-xs ${
                  reopenMsg.error ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {reopenMsg.text}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dispute Reason Category
                  </label>
                  <select
                    value={reopenReason}
                    onChange={(e: any) => setReopenReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="DEFECT_NOT_REPAIRED">Defect Not Repaired (Cavity still fully active)</option>
                    <option value="POOR_QUALITY_REPAIR">Substandard Patch Quality (Gravel loose / eroding)</option>
                    <option value="SURFACE_UNEVEN">Dangerous Surface Level Disparity (Vehicle bumper scrape risk)</option>
                    <option value="OTHER">Other Ground Reality Deficiency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Citizen Field Feedback & Remarks <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={reopenComments}
                    onChange={(e) => setReopenComments(e.target.value)}
                    placeholder="Describe specific defects observed post-repair (e.g. 'Patch sank after rain, 4-inch dip remains in left lane')..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reopening || !reopenComments.trim()}
                  onClick={handleReopenSubmit}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {reopening ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Dispute...</span>
                    </>
                  ) : (
                    <span>Confirm & Reopen Complaint</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
