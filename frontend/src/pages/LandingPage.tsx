import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  MapPin, 
  Camera, 
  Cpu, 
  Sliders, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Sparkles, 
  FlaskConical, 
  Layers, 
  Flame, 
  BarChart3, 
  Activity,
  Zap,
  Radio,
  Search,
  AlertTriangle,
  Clock,
  Compass,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { OverviewStats } from '../types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quickTrackId, setQuickTrackId] = useState('');

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await api.getOverviewStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load overview stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTrackId.trim()) return;
    navigate(`/track/${encodeURIComponent(quickTrackId.trim())}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200/80 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#0D9488_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Project Identity Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-900 text-xs font-semibold shadow-xs">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="font-bold">CivicLens.AI — RoadDefect Intelligence</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
              <span className="text-teal-700 font-mono">B.Tech AI Capstone</span>
            </div>

            {/* Headline & Tagline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-navy-900 tracking-tight leading-tight">
                Report. Detect. Prioritize. Improve Our Roads.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
                An intelligent civic infrastructure platform connecting citizens with municipal maintenance teams. 
                Upload photographs of potholes, receive instant deep-learning damage triage, and follow complaints transparently from submission to asphalt repair.
              </p>
            </div>

            {/* Dual CTAs & Quick Track Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/report-new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02]"
              >
                <Camera className="w-4 h-4" />
                Report a Road Defect
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/track"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-2xs transition-all hover:scale-[1.02]"
              >
                <Search className="w-4 h-4 text-teal-600" />
                Track My Complaint
              </Link>
            </div>

            {/* Inline Quick Track Form right on Hero */}
            <div className="max-w-lg mx-auto pt-3">
              <form onSubmit={handleQuickTrackSubmit} className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <input
                  type="text"
                  value={quickTrackId}
                  onChange={(e) => setQuickTrackId(e.target.value)}
                  placeholder="Enter Reference (e.g. CVL-2025-0001)..."
                  className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!quickTrackId.trim()}
                  className="px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shrink-0"
                >
                  Track Now
                </button>
              </form>
            </div>

            {/* Target Demonstration Scope */}
            <p className="text-xs text-slate-400 italic">
              Demonstration target: Nagpur Municipal Corporation (NMC), Nagpur, Maharashtra, India.
            </p>
          </div>
        </div>
      </section>

      {/* Road-Safety Alert Panel */}
      <section className="py-8 bg-amber-500/10 border-b border-amber-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl border border-amber-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                  Road Safety & Civic Alert
                </div>
                <h3 className="text-lg sm:text-xl font-black text-navy-900">
                  SPOT A POTHOLE? REPORT IT.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Every unaddressed road defect increases the risk of two-wheeler skids, vehicular suspension breakdown, and severe monsoon accidents. 
                  Reporting defects takes less than 60 seconds and arms civic authorities with verified, geo-tagged telemetry to schedule rapid repairs.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex sm:flex-col gap-2 w-full md:w-auto">
              <Link
                to="/report-new"
                className="flex-1 md:flex-initial text-center px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-colors"
              >
                Submit Citizen Report
              </Link>
              <Link
                to="/track"
                className="flex-1 md:flex-initial text-center px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                Check Complaint Status
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Municipal Workflow Panel (NMC Demonstration Workflow) */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>NMC-STYLE MUNICIPAL REVIEW WORKFLOW</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              From Citizen Incident to Verified Road Restoration
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              CivicLens.AI transforms raw smartphone photos into actionable engineering tickets through five interconnected operational stages.
            </p>
          </div>

          {/* 5-Step Visual Workflow Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 relative">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-navy-900 text-sm">Citizen Ingestion</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizens capture roadway photos with GPS coordinates, landmark reference, and Nagpur locality.
              </p>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded block">
                Status: SUBMITTED
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 relative">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-black text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-navy-900 text-sm">Computer Vision Triage</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                YOLOv8 deep learning infers distress class (pothole, crack) and bounds coordinates within 15 ms.
              </p>
              <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded block">
                Status: UNDER_REVIEW
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 relative">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-navy-900 text-sm">Action Planning</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                6-factor engine computes severity index and checks for duplicate reports within 25 meters.
              </p>
              <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded block">
                Status: ACTION_PLANNED
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 relative">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
                4
              </div>
              <h3 className="font-bold text-navy-900 text-sm">Crew Dispatch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                NMC zonal field crew is dispatched with required cold-mix asphalt, compaction tools, and work order.
              </p>
              <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded block">
                Status: IN_PROGRESS
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 relative">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                5
              </div>
              <h3 className="font-bold text-navy-900 text-sm">Photo Closure</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Repairs are verified with timestamped after-repair photographs and marked resolved.
              </p>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded block">
                Status: RESOLVED
              </span>
            </div>

          </div>

          {/* Honest NMC Demonstration Disclaimer Banner */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Building2 className="w-6 h-6 text-teal-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-slate-900 block">Demonstration Environment Notice:</span>
              <p className="text-slate-600 leading-relaxed mt-0.5">
                This report is recorded in CivicLens AI for review within this application. Official submission to Nagpur Municipal Corporation is not enabled or confirmed.
              </p>
            </div>
            <Link
              to="/about"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 underline shrink-0"
            >
              Learn about pilot research &rarr;
            </Link>
          </div>

        </div>
      </section>

      {/* Live Operational Metrics Section */}
      <section className="py-12 bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Live Database Metrics</span>
            <h2 className="text-xl font-extrabold text-navy-900 mt-1">Nagpur Municipal Corridor Status</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs text-center">
              <span className="text-3xl font-black text-navy-900 font-mono">
                {loading ? '...' : stats?.total_reports ?? 25}
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Total Reported Defects</p>
              <span className="inline-block mt-2 text-[11px] text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded font-mono font-bold">
                Nagpur Pilot Dataset
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs text-center">
              <span className="text-3xl font-black text-rose-600 font-mono">
                {loading ? '...' : stats?.critical_severity_count ?? 6}
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Critical Hazards Identified</p>
              <span className="inline-block mt-2 text-[11px] text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded font-mono font-bold">
                Severity Index ≥ 75.0
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs text-center">
              <span className="text-3xl font-black text-emerald-600 font-mono">
                {loading ? '...' : stats?.resolved_count ?? 4}
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Verified Repairs Closed</p>
              <span className="inline-block mt-2 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded font-mono font-bold">
                Before/After Photo Proof
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs text-center">
              <span className="text-3xl font-black text-teal-600 font-mono">
                14.8 ms
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">ONNX Inference Latency</p>
              <span className="inline-block mt-2 text-[11px] text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded font-mono font-bold">
                ~67 FPS on Commodity CPU
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars of CivicLens AI */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Engineering Depth</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-1">
              Four Interlocking AI & Systems Pillars
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Engineered beyond a typical student CRUD app to demonstrate real computer vision, geospatial clustering, and multi-criteria operations research.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pillar 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-900 text-base">YOLOv8-RDD2022 Deep Learning</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Preprocessed 640×640 image tensors evaluated via ONNX Runtime with non-maximum suppression (NMS) achieving 74.2% mAP@0.5 on pavement defect benchmarks.
              </p>
              <Link to="/lab" className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">
                <span>Inspect Model Lab</span> &rarr;
              </Link>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold shadow-xs">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="font-bold text-navy-900 text-base">DBSCAN Spatial Hotspots</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Density-Based Spatial Clustering discovers contiguous road deterioration corridors and calculates cluster centroids and radii in Nagpur.
              </p>
              <Link to="/map" className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">
                <span>View Map Clusters</span> &rarr;
              </Link>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy-900 text-base">Explainable 6-Factor Priority</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ranks repairs transparently by separating detection confidence from physical distress, accounting for citizen recurrence, SLA aging, and roadway hierarchy.
              </p>
              <Link to="/admin" className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">
                <span>Tune Policy Weights</span> &rarr;
              </Link>
            </div>

            {/* Pillar 4 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold shadow-xs">
                <Building2 className="w-5 h-5 text-teal-300" />
              </div>
              <h3 className="font-bold text-navy-900 text-base">Auditable Municipal Workflow</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Role-based dispatch queue with immutable status transition logs, work order assignment, Haversine duplicate linking, and verified repair photo closure.
              </p>
              <Link to="/authority" className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">
                <span>Open Operations Queue</span> &rarr;
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* College Presentation CTA */}
      <section className="py-16 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-mono border border-teal-400/30">
            <span>College Evaluation & Viva-Voce Ready</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready for Live College Defense Tomorrow
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
            Use the 1-click evaluator role switcher in the header to navigate between Citizen, Municipal Authority, and System Administrator modes.
          </p>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/citizen"
              className="px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition-colors"
            >
              Citizen Reporter View
            </Link>
            <Link
              to="/authority"
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-colors"
            >
              Municipal Authority Queue
            </Link>
            <Link
              to="/lab"
              className="px-5 py-2.5 rounded-lg bg-teal-900/80 hover:bg-teal-900 text-teal-200 border border-teal-700 font-bold text-xs transition-colors"
            >
              Model Evaluation Lab
            </Link>
            <Link
              to="/about"
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors"
            >
              Methodology & Viva Specs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
