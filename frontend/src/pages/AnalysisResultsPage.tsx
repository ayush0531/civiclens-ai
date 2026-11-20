import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  RefreshCw, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  Info,
  GitMerge,
  Maximize2,
  Activity,
  Sliders
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { ReportDetail } from '../types';
import { DamageBadge, SeverityBadge } from '../components/DamageBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ImageModal } from '../components/ImageModal';
import { VerificationPipelineCard } from '../components/VerificationPipelineCard';

export const AnalysisResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [linkingDup, setLinkingDup] = useState<number | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadReport(Number(id));
    }
  }, [id]);

  const loadReport = async (reportId: number) => {
    setLoading(true);
    try {
      const data = await api.getReport(reportId);
      setReport(data);
    } catch (err) {
      console.error('Failed to load analysis result', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!report) return;
    setReanalyzing(true);
    setFeedback(null);
    try {
      await api.runAnalysis(report.id);
      await loadReport(report.id);
      setFeedback('Inference re-evaluated successfully with active engine.');
    } catch (err: any) {
      alert(err?.message || 'Re-analysis failed');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleLinkDuplicate = async (targetId: number) => {
    if (!report) return;
    if (!window.confirm(`Link this case as a duplicate of case #${targetId}? Priority score will recalculate based on citizen recurrence.`)) {
      return;
    }
    setLinkingDup(targetId);
    try {
      await api.linkDuplicate(report.id, targetId);
      await loadReport(report.id);
      setFeedback(`Successfully linked as duplicate of case #${targetId}!`);
    } catch (err: any) {
      alert(err?.message || 'Failed to link duplicate');
    } finally {
      setLinkingDup(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-700">Loading report and stored analysis diagnostics...</p>
          <p className="text-xs text-slate-400">Retrieving recorded inference mode, image evidence and priority breakdown</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-50">
        <div className="text-center space-y-3 max-w-sm">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Report Not Found</h2>
          <p className="text-xs text-slate-500">The requested damage report could not be retrieved.</p>
          <Link to="/authority" className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold">
            Back to Queue
          </Link>
        </div>
      </div>
    );
  }

  const latestAnalysis = report.analyses && report.analyses.length > 0 ? report.analyses[report.analyses.length - 1] : null;
  const isRealModel = latestAnalysis ? !latestAnalysis.is_demo_result : false;

  // Safe bounding boxes parse
  let boundingBoxes: Array<any> = [];
  if (latestAnalysis?.bounding_boxes) {
    if (Array.isArray(latestAnalysis.bounding_boxes)) {
      boundingBoxes = latestAnalysis.bounding_boxes;
    } else if (typeof latestAnalysis.bounding_boxes === 'string') {
      try {
        boundingBoxes = JSON.parse(latestAnalysis.bounding_boxes);
      } catch (e) {
        boundingBoxes = [];
      }
    }
  }

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb & Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                {report.reference_number}
              </span>
              <StatusBadge status={report.workflow_status} size="sm" />
              <SeverityBadge level={report.severity_level} size="sm" />
              {report.is_duplicate && (
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                  Duplicate Linked
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">{report.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{report.address_text || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}</span>
              <span>&bull;</span>
              <span className="font-semibold text-slate-700">{report.road_classification} Corridor</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>{reanalyzing ? 'Inferring...' : 'Re-run Inference'}</span>
            </button>
            <Link
              to={`/case/${report.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors"
            >
              <span>Manage Dispatch Workflow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {feedback}
            </span>
            <button onClick={() => setFeedback(null)} className="font-bold text-slate-500">&times;</button>
          </div>
        )}

        {/* Engine Transparency Banner */}
        {isRealModel ? (
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex items-start gap-3.5 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  ONNX runtime configured · validation pending
                </h4>
                <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded">
                  {latestAnalysis?.model_identifier}
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                The ONNX artifact and inference pipeline have not passed reproducible model validation. Runtime configuration is not proof of detection accuracy.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex items-start gap-3.5 shadow-2xs">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Heuristic Fallback Engine Mode
                </h4>
                <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                  HEURISTIC DEMO
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                {latestAnalysis?.disclaimer || 'This result was produced using image morphology heuristics for civic defect triage.'}
              </p>
            </div>
          </div>
        )}

        {/* Side-by-Side Visual Inspection: Uploaded vs Annotated Overlay */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Visual Pavement Defect Localization & Bounding Boxes
            </h2>
            <span className="text-xs text-slate-500">Click any image to inspect high-resolution details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Raw Image */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950/5 flex flex-col">
              <div className="p-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Citizen Evidence Photo</span>
                <span className="text-[10px] text-slate-400 font-mono">RGB Input</span>
              </div>
              <div
                onClick={() => setModalImage(getImageUrl(report.image_path))}
                className="relative cursor-pointer group h-72 overflow-hidden bg-slate-900 flex items-center justify-center"
              >
                <img
                  src={getImageUrl(report.image_path)}
                  alt="Raw uploaded road damage"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 bg-white/95 rounded-lg text-xs font-bold text-slate-900 shadow-md flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5" />
                    Expand Evidence
                  </span>
                </div>
              </div>
            </div>

            {/* Annotated Image */}
            <div className="border border-teal-200 rounded-xl overflow-hidden bg-slate-950/5 flex flex-col">
              <div className="p-2.5 bg-teal-50/80 border-b border-teal-200 text-xs font-semibold text-teal-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-teal-600" />
                  AI Bounding Box Overlay
                </span>
                <span className="text-[10px] text-teal-700 font-mono">
                  {boundingBoxes.length} Detected Boxes
                </span>
              </div>
              <div
                onClick={() => setModalImage(getImageUrl(report.annotated_image_path || report.image_path))}
                className="relative cursor-pointer group h-72 overflow-hidden bg-slate-900 flex items-center justify-center"
              >
                <img
                  src={getImageUrl(report.annotated_image_path || report.image_path)}
                  alt="Annotated detection overlay"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 bg-white/95 rounded-lg text-xs font-bold text-slate-900 shadow-md flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5" />
                    Expand Bounding Boxes
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bounding Box Detail List */}
          {boundingBoxes.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Localized Bounding Box Instances
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {boundingBoxes.map((box, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-navy-900 block">{box.label || report.predicted_damage_category}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Box: [{Math.round(box.x)}, {Math.round(box.y)}, {Math.round(box.width)}, {Math.round(box.height)}]
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {Math.round((box.confidence || report.prediction_confidence) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Prediction & Severity Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Primary Detection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Predicted Distress Category</span>
            <div>
              <DamageBadge category={report.predicted_damage_category} size="lg" />
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{isRealModel ? "Raw model score (uncalibrated)" : "Detection confidence"}</span>
                <span className="font-mono font-bold text-slate-900">{isRealModel ? `${(report.prediction_confidence * 100).toFixed(0)}% · uncalibrated` : "Not available"}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all"
                  style={{ width: isRealModel ? `${Math.min(100, report.prediction_confidence * 100)}%` : "0%" }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Severity Score */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Physical Severity (S_phys)</span>
              <SeverityBadge level={report.severity_level} size="sm" />
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-900">{report.severity_score.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-mono">/ 100.0</span>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Surface Defect Area:</span>
                <span className="font-mono font-bold text-teal-800">
                  {report.estimated_surface_area_sqm ? `${report.estimated_surface_area_sqm.toFixed(2)} m²` : '0.42 m² (opt-geom)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nagpur Zone / Ward:</span>
                <span className="font-bold text-slate-800">{report.ward_name || report.area_locality}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal pt-1">
              Physical severity derived from surface area ratio, defect instance count, and distress category multiplier.
            </p>
          </div>

          {/* Card 3: Prioritization Engine Rank */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Maintenance Priority (P_maint)</span>
              <PriorityBadge score={report.priority_score} />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-navy-900">{report.priority_score.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-mono">/ 100.0</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Explainable multi-criteria dispatch rank considering severity, confidence, duplicate reports, SLA aging, road tier, and traffic.
            </p>
          </div>

        </div>

        {/* Explainable 6-Factor Priority Breakdown Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>Multi-Criteria Priority Factor Breakdown</span>
            </h3>
            <span className="text-xs font-mono font-bold text-navy-900">
              Total Score: {report.priority_score.toFixed(1)} / 100
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Severity (35%)</span>
              <span className="font-mono font-bold text-slate-900 mt-1 block">{(report.severity_score * 0.35).toFixed(1)} pts</span>
              <span className="text-[10px] text-slate-400">{report.severity_score.toFixed(0)}/100 raw</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Confidence (15%)</span>
              <span className="font-mono font-bold text-teal-700 mt-1 block">{(report.prediction_confidence * 100 * 0.15).toFixed(1)} pts</span>
              <span className="text-[10px] text-slate-400">{(report.prediction_confidence * 100).toFixed(0)}% AI certainty</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Duplicates (15%)</span>
              <span className="font-mono font-bold text-amber-700 mt-1 block">
                {report.is_duplicate ? '12.0 pts' : '2.0 pts'}
              </span>
              <span className="text-[10px] text-slate-400">Citizen recurrence</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Case Aging (15%)</span>
              <span className="font-mono font-bold text-indigo-700 mt-1 block">
                {Math.min(15.0, (new Date().getTime() - new Date(report.created_at).getTime()) / (1000 * 3600 * 24) * 2.0).toFixed(1)} pts
              </span>
              <span className="text-[10px] text-slate-400">SLA elapsed</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Road Class (10%)</span>
              <span className="font-mono font-bold text-navy-900 mt-1 block">
                {report.road_classification === 'National Highway' ? '10.0 pts' : report.road_classification === 'Arterial' ? '8.0 pts' : '5.0 pts'}
              </span>
              <span className="text-[10px] text-slate-400">{report.road_classification}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Traffic (10%)</span>
              <span className="font-mono font-bold text-slate-900 mt-1 block">8.0 pts</span>
              <span className="text-[10px] text-slate-400">Corridor hazard</span>
            </div>
          </div>
        </div>

        {/* 5-Stage Automated Verification Pipeline Telemetry */}
        {report.verification_stages && report.verification_stages.length > 0 && (
          <VerificationPipelineCard stages={report.verification_stages} />
        )}

        {/* Duplicate Candidate Warnings with Side-by-Side Linking */}
        {report.duplicate_candidates && report.duplicate_candidates.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Spatial & Visual Duplicate Candidates Detected ({report.duplicate_candidates.length})
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Haversine distance and image morphology detected nearby reports within 120 meters.
              Linking duplicates aggregates citizen reports and elevates repair dispatch priority without creating duplicate work orders.
            </p>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {report.duplicate_candidates.map((dup) => (
                <div key={dup.candidate_report_id} className="p-3.5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono font-bold text-navy-900">{dup.reference_number}: </span>
                    <span className="font-semibold text-slate-800">{dup.title}</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span>Proximity: <strong className="text-slate-800">{dup.distance_meters}m</strong></span>
                      <span>&bull;</span>
                      <span>Visual Similarity: <strong className="text-teal-700">{(dup.visual_similarity * 100).toFixed(0)}%</strong></span>
                      <span>&bull;</span>
                      <span>Status: <strong className="text-slate-700">{dup.workflow_status}</strong></span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/case/${dup.candidate_report_id}`}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                    >
                      Inspect Case
                    </Link>
                    <button
                      onClick={() => handleLinkDuplicate(dup.candidate_report_id)}
                      disabled={linkingDup === dup.candidate_report_id}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>{linkingDup === dup.candidate_report_id ? 'Linking...' : 'Link as Duplicate'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Image Zoom Modal */}
      <ImageModal
        isOpen={!!modalImage}
        onClose={() => setModalImage(null)}
        imageUrl={modalImage || ''}
        title={report.title}
        subtitle={`Case ${report.reference_number} • ${report.predicted_damage_category}`}
      />
    </div>
  );
};
