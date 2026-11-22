import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  Layers, 
  Cpu, 
  UserPlus, 
  FileCheck, 
  History, 
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  GitMerge,
  Copy,
  Check,
  Download,
  Phone
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { ReportDetail, User as UserType } from '../types';
import { useAuth } from '../context/AuthContext';
import { DamageBadge } from '../components/DamageBadge';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ImageModal } from '../components/ImageModal';
import { MapView } from '../components/MapView';
import { VerificationPipelineCard } from '../components/VerificationPipelineCard';
import { RepairComparisonCard } from '../components/RepairComparisonCard';

export const CaseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Workflow Action States
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigneeId, setAssigneeId] = useState<number>(4);
  const [assignNotes, setAssignNotes] = useState('');
  const [assignPriority, setAssignPriority] = useState('HIGH');

  // Resolve Modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveImage, setResolveImage] = useState<File | null>(null);
  const [linkingDup, setLinkingDup] = useState<number | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleCopySummary = async () => {
    if (!report) return;
    try {
      const summary = await api.getComplaintSummaryText(report.id);
      await navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      const text = `CivicLens AI Ref: ${report.reference_number}\nTitle: ${report.title}\nSeverity: ${report.severity_score}/100\nPriority: ${report.priority_score}/100`;
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }
  };

  const handleDownloadSummary = async () => {
    if (!report) return;
    try {
      const summary = await api.getComplaintSummaryText(report.id);
      const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Civic_Lens_AI_Case_${report.reference_number || report.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (id) {
      loadReport(Number(id));
    }
  }, [id]);

  useEffect(() => {
    if (user && (user.role === 'authority' || user.role === 'admin')) {
      loadAuthorityUsers();
    }
  }, [user]);

  const loadReport = async (reportId: number) => {
    setLoading(true);
    try {
      const data = await api.getReport(reportId);
      setReport(data);
    } catch (err) {
      console.error('Failed to load case details', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuthorityUsers = async () => {
    try {
      const users = await api.getAllUsers();
      setUsersList(users.filter((u) => u.role === 'authority' || u.role === 'admin'));
    } catch {
      // Fallback
    }
  };

  const handleStatusTransition = async (newStatus: string) => {
    if (!report) return;
    setActionError(null);
    setActionSuccess(null);
    setActionLoading(true);

    try {
      const updated = await api.transitionStatus(report.id, {
        new_status: newStatus,
        notes: `Status shifted to ${newStatus} via authority panel.`,
      });
      setReport(updated);
      setActionSuccess(`Workflow status updated to ${newStatus}.`);
    } catch (err: any) {
      setActionError(err.message || 'Transition rejected by server rules.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    setActionError(null);
    setActionLoading(true);

    try {
      await api.assignReport(report.id, {
        assigned_to_id: assigneeId,
        notes: assignNotes,
        priority_level: assignPriority,
      });
      setShowAssignModal(false);
      setActionSuccess('Maintenance crew work order successfully dispatched.');
      await loadReport(report.id);
    } catch (err: any) {
      setActionError(err.message || 'Assignment failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    if (resolveNotes.trim().length < 5) {
      setActionError('Resolution notes must be at least 5 characters.');
      return;
    }

    setActionError(null);
    setActionLoading(true);

    try {
      const formData = new FormData();
      formData.append('notes', resolveNotes.trim());
      if (resolveImage) {
        formData.append('evidence_image', resolveImage);
      }

      const updated = await api.resolveReport(report.id, formData);
      setReport(updated);
      setShowResolveModal(false);
      setActionSuccess('Case successfully marked as RESOLVED with audit evidence.');
    } catch (err: any) {
      setActionError(err.message || 'Failed to resolve case.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkDuplicate = async (targetId: number) => {
    if (!report) return;
    if (!window.confirm(`Link this case as duplicate of case #${targetId}? Priority score will recalculate based on citizen recurrence.`)) {
      return;
    }
    setLinkingDup(targetId);
    setActionError(null);
    try {
      const updated = await api.linkDuplicate(report.id, targetId);
      setReport(updated);
      setActionSuccess(`Case successfully linked as duplicate of case #${targetId}.`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to link duplicate.');
    } finally {
      setLinkingDup(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-50">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-50">
        <div className="text-center">
          <h2 className="text-base font-bold text-slate-800">Case Not Found</h2>
          <Link to="/authority" className="mt-2 text-xs text-teal-600 hover:underline block">
            Return to operations queue
          </Link>
        </div>
      </div>
    );
  }

  const isAuthorityOrAdmin = user && (user.role === 'authority' || user.role === 'admin');

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-2">
            <Link
              to={`/analysis/${report.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-100"
            >
              <Cpu className="w-3.5 h-3.5 text-teal-600" />
              <span>Inspect AI Computer Vision Overlays</span>
            </Link>
          </div>
        </div>

        {/* Action Feedback Alerts */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-700 font-bold">&times;</button>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-700 font-bold">&times;</button>
          </div>
        )}

        {/* Case Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                  {report.reference_number}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded border border-teal-200">
                  CivicLens AI Internal ID
                </span>
                <StatusBadge status={report.workflow_status} />
                <PriorityBadge score={report.priority_score} />
                {report.is_demo_data && (
                  <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Synthetic Nagpur Record
                  </span>
                )}
              </div>

              {/* Dual Status Bar */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Official Status:</span>
                {report.external_reference_id ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Official NMC Ref: {report.external_reference_id} ({report.external_submission_label || 'Registration reported by citizen — unverified'})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    <span>Not registered with NMC</span>
                  </span>
                )}
                <span className="text-[11px] font-bold text-slate-400 uppercase ml-2">Authority:</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {report.road_jurisdiction || 'NMC (Nagpur Municipal Corporation)'}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">{report.title}</h1>
              <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                {report.description || 'No detailed citizen notes provided.'}
              </p>

              {report.external_reference_notes && (
                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 max-w-2xl">
                  <strong>Citizen Handoff Filing Note:</strong> {report.external_reference_notes}
                </div>
              )}
            </div>

            {/* Quick Metadata Column */}
            <div className="text-xs space-y-1.5 md:text-right border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6 shrink-0">
              <div className="text-slate-500">
                Reporter: <strong className="text-slate-800">{report.reporter_name || 'Anonymous Citizen'}</strong>
              </div>
              <div className="text-slate-500">
                Logged: <strong className="text-slate-800">{new Date(report.created_at).toLocaleDateString()}</strong>
              </div>
              <div className="text-slate-500">
                Road Tier: <strong className="text-slate-800 font-mono">{report.road_classification}</strong>
              </div>
              {report.assigned_authority_name && (
                <div className="text-teal-700 font-semibold">
                  Assigned Crew: {report.assigned_authority_name}
                </div>
              )}
            </div>
          </div>

          {/* Quick Handoff Action Strip */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <a
              href="https://nmcnagpur.gov.in/grievance/complaint_form.php"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition-colors"
            >
              <span>Open Official NMC Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedSummary ? 'Summary Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download (.txt)</span>
            </button>

            <a
              href="tel:18002330080"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs ml-auto transition-colors"
              title="Maharashtra PWD Nagpur Regional Toll-Free Pothole Helpline"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>PWD Helpline: 1800 233 0080</span>
            </a>
          </div>
        </div>

        {/* Authority Maintenance Action Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          
          {/* Demonstration Notice Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>[Simulated Demonstration Workflow]</strong> Maintenance operations and status shifts executed here reflect internal CivicLens AI triage for college evaluation. Actions taken in this demonstration dashboard do not modify official government records on the NMC portal without an authorized municipal API gateway agreement.
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Municipal Maintenance Workflow Control
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enforce legal lifecycle state transitions: SUBMITTED &rarr; UNDER_REVIEW &rarr; ASSIGNED &rarr; IN_PROGRESS &rarr; RESOLVED
              </p>
            </div>

            {!isAuthorityOrAdmin && (
              <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-lg">
                View-Only Citizen Mode (Sign in as Authority to modify)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {report.workflow_status === 'SUBMITTED' && (
              <button
                onClick={() => handleStatusTransition('UNDER_REVIEW')}
                disabled={!isAuthorityOrAdmin || actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors disabled:opacity-40"
              >
                Mark Under Engineering Review
              </button>
            )}

            {report.workflow_status === 'UNDER_REVIEW' && (
              <button
                onClick={() => handleStatusTransition('ACTION_PLANNED')}
                disabled={!isAuthorityOrAdmin || actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-colors disabled:opacity-40"
              >
                Schedule Action Planned
              </button>
            )}

            {['SUBMITTED', 'UNDER_REVIEW', 'ACTION_PLANNED', 'ASSIGNED'].includes(report.workflow_status) && (
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={!isAuthorityOrAdmin || actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Assign Field Maintenance Crew
              </button>
            )}

            {['ASSIGNED', 'ACTION_PLANNED'].includes(report.workflow_status) && (
              <button
                onClick={() => handleStatusTransition('IN_PROGRESS')}
                disabled={!isAuthorityOrAdmin || actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-40"
              >
                Start Active Road Repairs
              </button>
            )}

            {['IN_PROGRESS', 'ASSIGNED', 'ACTION_PLANNED', 'UNDER_REVIEW'].includes(report.workflow_status) && (
              <button
                onClick={() => setShowResolveModal(true)}
                disabled={!isAuthorityOrAdmin || actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                Resolve Case with Proof
              </button>
            )}

            {report.workflow_status !== 'REJECTED' && report.workflow_status !== 'RESOLVED' && (
              <button
                onClick={() => handleStatusTransition('REJECTED')}
                disabled={!isAuthorityOrAdmin || actionLoading}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-40"
              >
                Reject / Non-Hazardous
              </button>
            )}

            {report.workflow_status === 'RESOLVED' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Resolved on {report.resolved_at ? new Date(report.resolved_at).toLocaleDateString() : 'NMC Record'}
                </span>
                <button
                  onClick={() => handleStatusTransition('UNDER_REVIEW')}
                  disabled={!isAuthorityOrAdmin || actionLoading}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300"
                >
                  Reopen on Recurrence
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Visual Media & Geolocation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Photos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Road Defect Imagery</span>
              <DamageBadge category={report.predicted_damage_category} size="sm" />
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setModalImage(getImageUrl(report.image_path))}
                className="cursor-pointer group relative h-48 rounded-xl overflow-hidden bg-slate-900 border border-slate-200"
              >
                <img
                  src={getImageUrl(report.image_path)}
                  alt="Original road damage"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur">
                  Citizen Upload
                </span>
              </div>

              <div
                onClick={() => setModalImage(getImageUrl(report.annotated_image_path || report.image_path))}
                className="cursor-pointer group relative h-48 rounded-xl overflow-hidden bg-slate-900 border border-teal-300"
              >
                <img
                  src={getImageUrl(report.annotated_image_path || report.image_path)}
                  alt="AI detection overlay"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-2 left-2 bg-teal-800/90 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur">
                  AI Bounding Overlay
                </span>
              </div>
            </div>

            {report.resolution_image_path && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-emerald-800 block mb-1.5">Maintenance Resolution Photo:</span>
                <div
                  onClick={() => setModalImage(getImageUrl(report.resolution_image_path!))}
                  className="cursor-pointer group relative h-36 rounded-xl overflow-hidden bg-slate-900 border border-emerald-300"
                >
                  <img
                    src={getImageUrl(report.resolution_image_path)}
                    alt="Resolution evidence"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-2 left-2 bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Post-Repair Verification
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Geospatial Map */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600" />
                Geocoded Location
              </h2>
              <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E
              </span>
            </div>

            <p className="text-xs text-slate-600">{report.address_text || 'Nagpur Metro Region'}</p>

            <div className="flex-1 min-h-[220px] rounded-xl overflow-hidden border border-slate-200">
              <MapView
                center={[report.latitude, report.longitude]}
                zoom={14}
                height="100%"
                selectedLocation={{ lat: report.latitude, lng: report.longitude }}
              />
            </div>
          </div>

        </div>

        {/* 5-Stage Automated Verification Pipeline Telemetry */}
        {report.verification_stages && report.verification_stages.length > 0 && (
          <VerificationPipelineCard stages={report.verification_stages} />
        )}

        {/* AI Before-and-After Photogrammetric Repair Verification */}
        {((report.repair_evidences && report.repair_evidences.length > 0) || report.resolution_image_path) && (
          <RepairComparisonCard
            evidence={report.repair_evidences?.[0]}
            beforeImagePath={report.image_path}
            afterImagePath={report.resolution_image_path || undefined}
          />
        )}

        {/* Duplicate Candidates Card */}
        {report.duplicate_candidates && report.duplicate_candidates.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Potential Nearby Duplicate Reports ({report.duplicate_candidates.length})
                </h3>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">Haversine GPS &lt; 120m</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nearby reports identified at this location. Linking duplicates merges citizen reports and increases priority score without redundant dispatch.
            </p>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {report.duplicate_candidates.map((dup) => (
                <div key={dup.candidate_report_id} className="p-3.5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{dup.reference_number}: </span>
                    <span className="font-semibold text-slate-800">{dup.title}</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span>Proximity: <strong>{dup.distance_meters}m</strong></span>
                      <span>&bull;</span>
                      <span>Visual Similarity: <strong>{(dup.visual_similarity * 100).toFixed(0)}%</strong></span>
                      <span>&bull;</span>
                      <span>Status: {dup.workflow_status}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/case/${dup.candidate_report_id}`}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                    >
                      Inspect
                    </Link>
                    {isAuthorityOrAdmin && !report.is_duplicate && (
                      <button
                        onClick={() => handleLinkDuplicate(dup.candidate_report_id)}
                        disabled={linkingDup === dup.candidate_report_id}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>{linkingDup === dup.candidate_report_id ? 'Linking...' : 'Link as Duplicate'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explainable Multi-Criteria Priority Engine Breakdown */}
        {report.priority_breakdown && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Multi-Criteria Priority Ranking Breakdown (Explainable Model)
                </h2>
                <p className="text-xs text-slate-500">
                  Formula: {report.priority_breakdown.formula}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-extrabold font-mono text-navy-900">
                  {report.priority_score.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-mono">/100.0</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Severity (40%)</span>
                <div className="text-base font-bold font-mono text-slate-800 mt-1">
                  +{report.priority_breakdown.breakdown?.severity_contribution?.weighted_points ?? 0} pts
                </div>
                <span className="text-[10px] text-slate-500">
                  Raw: {report.severity_score.toFixed(0)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Confidence (20%)</span>
                <div className="text-base font-bold font-mono text-slate-800 mt-1">
                  +{report.priority_breakdown.breakdown?.confidence_contribution?.weighted_points ?? 0} pts
                </div>
                <span className="text-[10px] text-slate-500">
                  Raw: {(report.prediction_confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Repeat Dups (15%)</span>
                <div className="text-base font-bold font-mono text-slate-800 mt-1">
                  +{report.priority_breakdown.breakdown?.duplicate_reports_contribution?.weighted_points ?? 0} pts
                </div>
                <span className="text-[10px] text-slate-500">
                  Dups: {report.priority_breakdown.breakdown?.duplicate_reports_contribution?.raw_count ?? 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Aging Factor (15%)</span>
                <div className="text-base font-bold font-mono text-slate-800 mt-1">
                  +{report.priority_breakdown.breakdown?.aging_contribution?.weighted_points ?? 0} pts
                </div>
                <span className="text-[10px] text-slate-500">
                  {report.priority_breakdown.breakdown?.aging_contribution?.days_waiting ?? 0} days
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400">Road Class (10%)</span>
                <div className="text-base font-bold font-mono text-slate-800 mt-1">
                  +{report.priority_breakdown.breakdown?.road_class_contribution?.weighted_points ?? 0} pts
                </div>
                <span className="text-[10px] text-slate-500">
                  {report.road_classification}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
              <span>
                <strong>Research Baseline Comparison:</strong> Severity-Only ranking gives{' '}
                <strong className="font-mono">{report.priority_breakdown.baseline_severity_score}</strong>. Multi-criteria adjusted priority by{' '}
                <strong className="font-mono">{report.priority_breakdown.rank_delta > 0 ? `+${report.priority_breakdown.rank_delta}` : report.priority_breakdown.rank_delta}</strong> points.
              </span>
            </div>
          </div>
        )}

        {/* Status History & Audit Log Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            Audit Trail & Status History
          </h2>

          <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 py-2">
            {report.status_history.map((sh, idx) => (
              <div key={sh.id || idx} className="relative pl-6">
                <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {sh.previous_status} &rarr; <span className="text-teal-700">{sh.new_status}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(sh.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Changed by: <strong>{sh.changed_by_name || 'System Authority'}</strong> ({sh.changed_by_role || 'user'})
                  </div>
                  {sh.notes && (
                    <div className="mt-1 text-slate-500 bg-white p-2 rounded border border-slate-200/70 italic">
                      "{sh.notes}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Maintenance Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Assign Maintenance Work Order</h3>
            <p className="text-xs text-slate-500">
              Dispatch municipal field engineer or asphalt repair contractor to this geocoded site.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Field Engineer / Supervisor</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.department || u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Urgency Level</label>
                <select
                  value={assignPriority}
                  onChange={(e) => setAssignPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="CRITICAL">Critical (Repair within 24 hours)</option>
                  <option value="HIGH">High (Repair within 48 hours)</option>
                  <option value="MEDIUM">Medium (Scheduled regular maintenance)</option>
                  <option value="LOW">Low (Routine periodic resurfacing)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Order Instructions / Material Notes</label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Requires 40mm bitumen cold patch, lane closure cones on Sitabuldi junction..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm"
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Resolve Modal with Photo Evidence */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Mark Case as RESOLVED</h3>
            <p className="text-xs text-slate-500">
              Record completion notes and optional post-repair verification photo for the municipal audit log.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="e.g. Pothole filled with dense bituminous macadam, leveled and rolled by NMC team..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Completion Evidence Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setResolveImage(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                >
                  {actionLoading ? 'Recording Closure...' : 'Verify & Close Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      <ImageModal
        isOpen={!!modalImage}
        onClose={() => setModalImage(null)}
        imageUrl={modalImage || ''}
        title={report.title}
        subtitle={`Case ${report.reference_number}`}
      />

    </div>
  );
};
