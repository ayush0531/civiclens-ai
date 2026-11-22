import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Camera, 
  Cpu, 
  MapPin, 
  ClipboardList, 
  ArrowRight, 
  Building2, 
  BarChart3, 
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  Workflow
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header / Hero */}
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Civic Infrastructure Intelligence Platform
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
            About Civic Lens AI
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-3xl">
            Civic Lens AI is an AI-powered municipal infrastructure intelligence platform designed to streamline road defect reporting, automated triage, and maintenance prioritization for the city of Nagpur, Maharashtra.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/report-new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Camera className="w-4 h-4" />
              Report Road Damage
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
            >
              <MapPin className="w-4 h-4 text-teal-600" />
              Explore Defect Map
            </Link>
            <Link
              to="/track"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
            >
              <Search className="w-4 h-4 text-teal-600" />
              Track Complaint
            </Link>
          </div>
        </div>

        {/* 1. What Civic Lens AI Does */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">1. What Civic Lens AI Does</h2>
              <p className="text-xs text-slate-500">Transforming citizen photographs into actionable municipal work orders</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Civic Lens AI bridges the gap between citizens reporting road hazards and municipal public works departments responsible for road maintenance. The platform automates the entire intake lifecycle: it verifies submitted images for authenticity, identifies damage categories using computer vision, measures surface defect dimensions, detects duplicate complaints on the same road segment, and computes an explainable maintenance priority score to help municipal teams deploy repair resources efficiently.
          </p>
        </section>

        {/* 2. How Citizens Report Road Damage */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">2. How Citizens Report Road Damage</h2>
              <p className="text-xs text-slate-500">Simple, transparent 4-step reporting workflow</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-mono font-bold text-teal-700 block">Step 01</span>
              <h3 className="text-sm font-bold text-slate-900">Capture or Upload</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take a photo directly with your phone camera or upload an existing road image from your device gallery.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-mono font-bold text-teal-700 block">Step 02</span>
              <h3 className="text-sm font-bold text-slate-900">Location Context</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Provide GPS coordinates automatically or select from preset Nagpur localities and major transit corridors.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-mono font-bold text-teal-700 block">Step 03</span>
              <h3 className="text-sm font-bold text-slate-900">Automated Triage</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The platform runs a 5-stage verification audit to assess quality, detect defects, estimate severity, and check duplicates.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-mono font-bold text-teal-700 block">Step 04</span>
              <h3 className="text-sm font-bold text-slate-900">Track & Handoff</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive an instant tracking reference and an official grievance package formatted for the NMC portal.
              </p>
            </div>
          </div>
        </section>

        {/* 3. How AI Assists in Identifying Road Defects */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">3. How AI Assists in Identifying Road Defects</h2>
              <p className="text-xs text-slate-500">Computer vision and image processing pipeline</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Civic Lens AI applies automated image processing and machine learning inference to analyze pavement distress:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">Defect Localization</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Detects potholes, alligator cracking, and linear cracks, generating precise bounding boxes around distress areas.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">Dimension Estimation</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculates pixel coverage ratios to estimate physical surface area (m²) and classifies depth risk into Low, Medium, High, or Critical.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">Image Quality Verification</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Screens photos for blur (Laplacian variance), illumination (brightness histogram), and minimum resolution before processing.
              </p>
            </div>
          </div>
        </section>

        {/* 4. How Complaints Are Tracked and Prioritized */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">4. How Complaints Are Tracked & Prioritized</h2>
              <p className="text-xs text-slate-500">Auditable, multi-criteria dispatch prioritization</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every submitted complaint receives a unique tracking code (e.g. <code className="font-mono font-bold text-teal-800">REP-2026-XXXX</code>) that citizens can track in real time without creating an account. Rather than first-come-first-served scheduling, Civic Lens AI calculates an explainable Maintenance Priority Score based on:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">Physical Severity (35%)</strong>
              <span className="text-slate-600">Surface area distress, multiple co-located defect counts, and damage type hazard weight.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">Citizen Recurrence (15%)</strong>
              <span className="text-slate-600">Elevated priority when multiple citizens report the same defect via Haversine duplicate screening.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">Road Classification (10%)</strong>
              <span className="text-slate-600">Higher urgency weighting for arterial roads and major transit corridors versus local residential streets.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">SLA Deadline Aging (15%)</strong>
              <span className="text-slate-600">Dynamic score escalation as unresolved cases approach or exceed their target resolution window.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">Traffic Vulnerability (10%)</strong>
              <span className="text-slate-600">Transit density score accounting for bus routes, school zones, and heavy commercial vehicle volume.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">Detection Confidence (15%)</strong>
              <span className="text-slate-600">Model certainty factor ensuring high-confidence detections receive immediate triage focus.</span>
            </div>
          </div>
        </section>

        {/* 5. How Municipal Authorities Review Reported Issues */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">5. How Municipal Authorities Review Reported Issues</h2>
              <p className="text-xs text-slate-500">Dedicated operational dashboard for engineers and zonal triage teams</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Geospatial Cluster Analysis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authorities view interactive heatmaps and DBSCAN spatial clusters across Nagpur's 10 administrative zones to group contiguous repairs into single road-resurfacing tenders.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Triage & Case Lifecycle</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Engineers review cases by priority rank, assign work crews, set SLA deadlines, and transition status from Submitted to In Progress to Resolved.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Before & After Closure Audit</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Repairs require post-work closure photographs. The system runs comparative texture verification to ensure defects are genuinely restored before case closure.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Navigation CTA */}
        <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ready to explore Civic Lens AI?</h3>
            <p className="text-xs text-slate-500 mt-0.5">Submit a test road damage report or explore real geocoded defects across Nagpur.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/report-new"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <span>Report Damage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/authority"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-colors"
            >
              Authority Dashboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
