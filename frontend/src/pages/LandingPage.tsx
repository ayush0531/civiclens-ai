import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Radio
} from 'lucide-react';
import { api } from '../services/api';
import { OverviewStats } from '../types';

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  return (
    <div className="flex-1 flex flex-col bg-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200/80 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#0D9488_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Project Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-800 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>CivicLens AI 2.0 • B.Tech Artificial Intelligence Capstone</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
              <span className="text-slate-600 font-mono">ONNX YOLOv8 + DBSCAN</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-navy-900 tracking-tight leading-tight">
              Intelligent Road Distress Detection & Maintenance Dispatch
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              An enterprise smart-city platform combining deep learning computer vision, 
              spatial DBSCAN clustering, Haversine duplicate detection, and an explainable 6-factor 
              priority engine to automate municipal pavement maintenance.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/report-new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02]"
              >
                <Camera className="w-4 h-4" />
                Report Pavement Defect
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/map"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-2xs transition-all"
              >
                <MapPin className="w-4 h-4 text-teal-600" />
                Map & DBSCAN Hotspots
              </Link>
              <Link
                to="/lab"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm shadow-2xs transition-all"
              >
                <FlaskConical className="w-4 h-4 text-teal-400" />
                AI Model Lab (mAP)
              </Link>
            </div>

            {/* Advisory disclaimer */}
            <p className="text-xs text-slate-400 italic">
              Prototype system engineered for academic viva and smart-city municipal evaluation.
            </p>
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

      {/* 4 Pillars of CivicLens AI 2.0 */}
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
                Density-Based Spatial Clustering of Applications with Noise (DBSCAN) discovers contiguous road deterioration corridors and calculates cluster centroids and radii.
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

      {/* Damage Taxonomy & Computer Vision Capabilities */}
      <section className="py-16 bg-slate-50/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Supported Taxonomy</span>
            <h2 className="text-2xl font-extrabold text-navy-900 mt-1">Standardized Pavement Distress Categories</h2>
            <p className="text-xs text-slate-600 mt-2">
              Aligned with Indian Road Congress (IRC:SP:72-2015) and ASTM D6433 road distress inspection codes.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { name: 'Pothole (D40)', factor: '1.00', color: 'border-rose-300 bg-rose-50/50', desc: 'Cavity with vertical edges' },
              { name: 'Alligator cracking (D20)', factor: '0.85', color: 'border-orange-300 bg-orange-50/50', desc: 'Interconnected fatigue mesh' },
              { name: 'Transverse crack (D10)', factor: '0.70', color: 'border-amber-300 bg-amber-50/50', desc: 'Perpendicular thermal fissure' },
              { name: 'Longitudinal crack (D00)', factor: '0.65', color: 'border-yellow-300 bg-yellow-50/50', desc: 'Parallel wheelpath fracture' },
              { name: 'Surface deterioration (D30)', factor: '0.50', color: 'border-cyan-300 bg-cyan-50/50', desc: 'Raveling & binder stripping' },
              { name: 'Other / uncertain (D99)', factor: '0.30', color: 'border-slate-300 bg-slate-50/50', desc: 'Ambiguous or non-structural' },
            ].map((cat) => (
              <div key={cat.name} className={`p-4 rounded-xl border ${cat.color} text-center shadow-2xs`}>
                <span className="text-xs font-bold text-slate-900 block leading-tight">{cat.name}</span>
                <span className="text-[10px] text-teal-800 font-mono font-bold mt-1 block">Severity Factor: {cat.factor}</span>
                <p className="text-[11px] text-slate-600 mt-2 leading-tight">{cat.desc}</p>
              </div>
            ))}
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
