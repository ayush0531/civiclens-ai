import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  RefreshCw, 
  Layers, 
  ZoomIn, 
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { ReportDetail } from '../types';
import { DamageBadge } from '../components/DamageBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ImageModal } from '../components/ImageModal';

export const AnalysisResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

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
    try {
      await api.runAnalysis(report.id);
      await loadReport(report.id);
    } catch (err) {
      console.error('Re-analysis failed', err);
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-700">Running AI Road Defect Analysis...</p>
          <p className="text-xs text-slate-400">Extracting morphology features and calculating multi-criteria priority</p>
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
          <Link to="/citizen" className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const latestAnalysis = report.analyses && report.analyses.length > 0 ? report.analyses[report.analyses.length - 1] : null;

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb & Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                {report.reference_number}
              </span>
              <StatusBadge status={report.workflow_status} size="sm" />
              {report.is_demo_data && (
                <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  Demo Fixture
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">{report.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{report.address_text || 'Nagpur Area'}</span>
              <span>&bull;</span>
              <span>{report.road_classification} Roadway</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>{reanalyzing ? 'Processing...' : 'Re-run Inference'}</span>
            </button>
            <Link
              to={`/case/${report.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
            >
              <span>Full Case Workflow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* AI Disclaimer Alert Banner (Section 7 Requirement) */}
        {latestAnalysis?.is_demo_result ? (
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                DEMO ANALYSIS — NOT A VALIDATED AI PREDICTION
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                {latestAnalysis.disclaimer || 'This result was produced using deterministic image morphology heuristics for capstone workflow evaluation. Model weights should be fine-tuned on real road datasets before municipal dispatch.'}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[11px] font-mono text-amber-700">
                <span>Engine: {latestAnalysis.model_identifier}</span>
                <span>Duration: {latestAnalysis.inference_duration_ms}ms</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-teal-900">VERIFIED MODEL INFERENCE</h4>
              <p className="text-xs text-teal-800">
                Processed via {latestAnalysis?.model_identifier} in {latestAnalysis?.inference_duration_ms}ms.
              </p>
            </div>
          </div>
        )}

        {/* Side-by-Side Visual Inspection: Uploaded vs Annotated Overlay */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Visual Computer Vision Bounding Box Inspection
            </h2>
            <span className="text-xs text-slate-500">Click image to inspect fullscreen</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Raw Image */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950/5 flex flex-col">
              <div className="p-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Original Citizen Upload</span>
                <span className="text-[10px] text-slate-400">Raw Input</span>
              </div>
              <div
                onClick={() => setModalImage(report.image_path)}
                className="relative cursor-pointer group h-64 overflow-hidden bg-slate-900 flex items-center justify-center"
              >
                <img
                  src={report.image_path}
                  alt="Raw uploaded photo"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 bg-white/90 rounded-lg text-xs font-bold text-slate-900 shadow">
                    Expand Original
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
                <span className="text-[10px] text-teal-700 font-mono">Annotated</span>
              </div>
              <div
                onClick={() => setModalImage(report.annotated_image_path || report.image_path)}
                className="relative cursor-pointer group h-64 overflow-hidden bg-slate-900 flex items-center justify-center"
              >
                <img
                  src={report.annotated_image_path || report.image_path}
                  alt="Annotated detection"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 bg-white/90 rounded-lg text-xs font-bold text-slate-900 shadow">
                    Expand Bounding Boxes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Prediction & Severity Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Primary Detection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Predicted Damage Category</span>
            <div>
              <DamageBadge category={report.predicted_damage_category} size="lg" />
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500">Heuristic Confidence</span>
                <span className="font-mono font-bold text-slate-900">{(report.prediction_confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, report.prediction_confidence * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Severity Score */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Severity Index</span>
              <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                report.severity_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                report.severity_level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                report.severity_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {report.severity_level}
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900">{report.severity_score.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-mono">/ 100.0</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Computed via 50% Bounding Area Ratio + 20% Defect Count + 30% Damage Class Factor.
            </p>
          </div>

          {/* Card 3: Prioritization Engine Rank */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Maintenance Priority</span>
              <PriorityBadge score={report.priority_score} />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-navy-900">{report.priority_score.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-mono">/ 100.0</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Combines physical severity, confidence, waiting aging, repeat citizens, and road classification tier.
            </p>
          </div>

        </div>

        {/* Duplicate Candidate Warnings (Section 7 Requirement) */}
        {report.duplicate_candidates && report.duplicate_candidates.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Spatial & Visual Duplicate Candidates Detected ({report.duplicate_candidates.length})
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              The duplicate detection algorithm flagged existing nearby reports within 120 meters. Municipal authorities can link them to avoid duplicate repair dispatch.
            </p>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {report.duplicate_candidates.map((dup) => (
                <div key={dup.candidate_report_id} className="p-3.5 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{dup.reference_number}: </span>
                    <span className="font-medium text-slate-700">{dup.title}</span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span>Proximity: <strong>{dup.distance_meters}m</strong> away</span>
                      <span>&bull;</span>
                      <span>Visual Similarity: <strong>{(dup.visual_similarity * 100).toFixed(0)}%</strong></span>
                      <span>&bull;</span>
                      <span>Status: {dup.workflow_status}</span>
                    </div>
                  </div>
                  <Link
                    to={`/case/${dup.candidate_report_id}`}
                    className="px-3 py-1.5 rounded bg-white border border-slate-300 text-teal-700 hover:bg-teal-50 font-semibold text-xs"
                  >
                    Compare Case
                  </Link>
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
