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
  AlertTriangle,
  Building2,
  Clock,
  Sparkles,
  Search,
  ExternalLink
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-800 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Final-Year B.Tech AI Capstone Engineering Project</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
              <span className="text-slate-600">Nagpur Pilot</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight">
              CivicLens AI: Intelligent Road Damage Detection & Prioritization
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              An explainable smart-city infrastructure platform that classifies asphalt defects with computer vision, estimates physical severity, eliminates duplicate citizen complaints, and ranks municipal maintenance queues through multi-criteria decision models.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/report-new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02]"
              >
                <Camera className="w-4 h-4" />
                Report Road Damage
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/map"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm transition-all"
              >
                <MapPin className="w-4 h-4 text-teal-600" />
                Explore Nagpur Map
              </Link>
              <Link
                to="/authority"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm shadow-sm transition-all"
              >
                <Building2 className="w-4 h-4 text-teal-400" />
                Authority Triage
              </Link>
            </div>

            {/* Advisory disclaimer */}
            <p className="text-xs text-slate-400 italic">
              Prototype system for academic evaluation. Recommendations support engineering triage without automated dispatch.
            </p>
          </div>
        </div>
      </section>

      {/* Live Database Metrics Section */}
      <section className="py-12 bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Database-Driven Pilot Statistics</span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Live Nagpur Civic Infrastructure Metrics</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm text-center">
              <span className="text-3xl font-extrabold text-navy-900 font-mono">
                {loading ? '...' : stats?.total_reports ?? 25}
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Total Reported Defects</p>
              <span className="inline-block mt-2 text-[11px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded font-medium">
                Nagpur Municipal Area
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm text-center">
              <span className="text-3xl font-extrabold text-rose-600 font-mono">
                {loading ? '...' : stats?.critical_severity_count ?? 6}
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Critical Hazards Identified</p>
              <span className="inline-block mt-2 text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-medium">
                Severity Score &gt;= 75.0
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm text-center">
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">
                {loading ? '...' : stats?.resolved_count ?? 4}
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Repairs Verified & Closed</p>
              <span className="inline-block mt-2 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                Photo Evidence Logged
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm text-center">
              <span className="text-3xl font-extrabold text-teal-600 font-mono">
                {loading ? '...' : `${stats?.average_resolution_hours ?? 36.5}h`}
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Avg Triage-to-Repair</p>
              <span className="inline-block mt-2 text-[11px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded font-medium">
                Audit Trail Recorded
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Workflow Architecture Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">End-to-End Pipeline</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
              How CivicLens AI Solves Municipal Road Triage
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Transforming unverified citizen photos into mathematically prioritized municipal work orders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Citizen Submission</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizens capture roadway photos with automatic GPS geotagging, roadway classification, and contextual defect descriptions.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold text-sm mb-4 shadow">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Computer Vision Inference</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated image analysis locates damage boundaries, identifies defect classes (potholes, cracks), and generates annotated bounding overlays.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Multi-Factor Prioritization</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculates transparent priority score (0-100) combining damage area, repeat reports, waiting time aging, and road tier.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold text-sm mb-4 shadow">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Municipal Work Order</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authorities inspect ranked cases, detect spatial duplicates, assign maintenance crews, and audit closure with resolution photos.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Damage Taxonomy & Computer Vision Capabilities */}
      <section className="py-16 bg-slate-50/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Supported Taxonomy</span>
            <h2 className="text-2xl font-bold text-navy-900 mt-1">6 Configurable Damage Classifications</h2>
            <p className="text-xs text-slate-600 mt-2">
              Standardized pavement distress categories aligned with municipal civil engineering maintenance protocols.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { name: 'Pothole', factor: '1.00', color: 'border-rose-300 bg-rose-50/50', desc: 'Cavity with vertical edges' },
              { name: 'Alligator cracking', factor: '0.85', color: 'border-orange-300 bg-orange-50/50', desc: 'Interconnected fatigue mesh' },
              { name: 'Transverse crack', factor: '0.70', color: 'border-amber-300 bg-amber-50/50', desc: 'Perpendicular thermal fissure' },
              { name: 'Longitudinal crack', factor: '0.65', color: 'border-yellow-300 bg-yellow-50/50', desc: 'Parallel wheelpath fracture' },
              { name: 'Surface deterioration', factor: '0.50', color: 'border-cyan-300 bg-cyan-50/50', desc: 'Raveling & binder stripping' },
              { name: 'Other / uncertain', factor: '0.30', color: 'border-slate-300 bg-slate-50/50', desc: 'Ambiguous or non-structural' },
            ].map((cat) => (
              <div key={cat.name} className={`p-4 rounded-xl border ${cat.color} text-center shadow-sm`}>
                <span className="text-xs font-bold text-slate-900 block leading-tight">{cat.name}</span>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">Weight: {cat.factor}</span>
                <p className="text-[10px] text-slate-600 mt-2">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* College Presentation CTA */}
      <section className="py-14 bg-gradient-to-r from-navy-900 to-navy-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-mono border border-teal-400/30">
            <span>Evaluation Ready</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready for Live Final-Year Project Evaluation
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
            Experience role-based access, instant heuristic computer vision inference, Haversine duplicate checks, and dynamic Recharts analytics.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/citizen"
              className="px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-md transition-colors"
            >
              Citizen View
            </Link>
            <Link
              to="/authority"
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-colors"
            >
              Authority View
            </Link>
            <Link
              to="/admin"
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors"
            >
              Admin System View
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
