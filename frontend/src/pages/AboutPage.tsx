import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Cpu, 
  Calculator, 
  Layers, 
  ShieldAlert, 
  MapPin, 
  ExternalLink, 
  AlertTriangle,
  GraduationCap,
  Sparkles,
  GitBranch,
  CheckCircle2,
  FlaskConical,
  Flame,
  Sliders,
  HelpCircle
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Academic Capstone Header */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Final-Year B.Tech Artificial Intelligence Engineering Capstone
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
              CivicLens AI 2.0
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy-900 tracking-tight leading-tight">
            Intelligent Road Damage Detection and Maintenance Prioritization System
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            A comprehensive smart-city infrastructure intelligence platform combining deep learning 
            computer vision (YOLOv8-RDD2022 via ONNX Runtime), spatial density clustering (DBSCAN), 
            Haversine duplicate elimination, and an explainable 6-factor multi-criteria priority dispatch engine.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-slate-500">
            <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">Pilot Region: Nagpur Municipal Corporation</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">Inference: ONNX Runtime (CPUExecutionProvider)</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">CV Benchmark: 74.2% mAP@0.50 (14.8 ms)</span>
          </div>
        </div>

        {/* 1. Problem Statement & Motivation */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-navy-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-5 h-5 text-teal-600" />
            1. Problem Statement & Research Motivation
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            In urban Indian municipal corporations like Nagpur, roadway maintenance departments face three systemic engineering challenges:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-rose-700 uppercase">A. Subjective Visual Triage</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizen photos arrive without geometric measurement of surface area or physical distress severity, resulting in arbitrary dispatch.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-amber-700 uppercase">B. Duplicate Complaint Floods</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                High-traffic corridors (e.g. Wardha Road) generate dozens of redundant complaints for the exact same defect, overwhelming municipal staff.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-teal-700 uppercase">C. Black-Box Opacity</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Municipal budgets require auditable criteria. Black-box deep learning scores cannot be justified during public works fiscal audits.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Computer Vision Pipeline Architecture */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-extrabold text-navy-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-teal-600" />
              2. Deep Learning Pipeline Architecture (YOLOv8-RDD2022)
            </h2>
            <Link to="/lab" className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1">
              <span>View Benchmark Lab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            CivicLens AI 2.0 deploys an optimized anchor-free object detector trained on the Road Damage Dataset (RDD2022) India subset 
            and localized Nagpur road imagery, serialized to ONNX and executed natively via <code>onnxruntime</code>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-navy-900 block">Backbone & Neck</span>
              <p className="text-slate-600 text-[11px] mt-1">
                Modified CSPDarknet53 with C2f modules and Path Aggregation Network (PANet) Feature Pyramid.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-navy-900 block">Decoupled Head</span>
              <p className="text-slate-600 text-[11px] mt-1">
                Anchor-free regression branch with Complete IoU (CIoU) loss and classification branch with BCE loss.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-navy-900 block">Runtime Telemetry</span>
              <p className="text-slate-600 text-[11px] mt-1">
                640×640 float32 input tensors running via CPUExecutionProvider with 14.8 ms latency (~67 FPS).
              </p>
            </div>
          </div>
        </div>

        {/* 3. Mathematical Models: Severity, Priority, DBSCAN */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <h2 className="text-lg font-extrabold text-navy-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-5 h-5 text-teal-600" />
            3. Mathematical Formulations & Algorithms
          </h2>

          {/* Model A: Physical Severity Estimation */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">A. Physical Severity Estimation (S_phys)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Separates AI detection confidence from engineering physical distress. Aligned with Indian Road Congress (IRC:SP:72-2015):
            </p>
            <div className="p-3.5 bg-slate-900 text-teal-300 font-mono text-xs rounded-xl overflow-x-auto">
              S_phys = min(100.0, 0.50 · AreaRatioScore + 0.20 · CountScore + 0.30 · ClassMultiplier · 100)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <strong>AreaRatioScore (50%):</strong> Total bounding box area normalized to image pixels (capped at 100).
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <strong>CountScore (20%):</strong> Multiple co-located defects penalized (<code className="font-mono">count · 33.3</code>).
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <strong>ClassMultiplier (30%):</strong> Hazard weight: Pothole (1.00), Alligator (0.85), Transverse (0.70).
              </div>
            </div>
          </div>

          {/* Model B: Explainable 6-Factor Priority */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">B. Explainable 6-Factor Maintenance Priority Engine (P_maint)</h3>
              <Link to="/admin" className="text-xs font-bold text-teal-700 hover:text-teal-800">
                Configure Weights &rarr;
              </Link>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Linear multi-criteria decision analysis (MCDA) combining engineering distress, citizen voice, SLA deadlines, and corridor risk:
            </p>
            <div className="p-3.5 bg-slate-900 text-teal-300 font-mono text-xs rounded-xl overflow-x-auto">
              P_maint = w_sev · S_phys + w_conf · C_ai + w_dup · D_rep + w_age · A_sla + w_road · R_class + w_traffic · T_vuln
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px] text-slate-600 pt-1">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <strong>w_sev (0.35):</strong> Physical severity index
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <strong>w_conf (0.15):</strong> Model certainty score
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <strong>w_dup (0.15):</strong> Citizen recurrence signal
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <strong>w_age (0.15):</strong> SLA waiting time aging
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <strong>w_road (0.10):</strong> Highway vs Local road tier
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <strong>w_traffic (0.10):</strong> Congestion & transit exposure
              </div>
            </div>
          </div>

          {/* Model C: DBSCAN Spatial Clustering */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">C. DBSCAN Geospatial Hotspot Discovery</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Identifies continuous pavement failure zones across arterial roads. Uses Haversine great-circle distance:
            </p>
            <div className="p-3.5 bg-slate-900 text-teal-300 font-mono text-xs rounded-xl overflow-x-auto">
              d(p, q) = 2R · arcsin(√(sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2))) ≤ ε = 450 meters (MinPts = 2)
            </div>
          </div>
        </div>

        {/* 4. Viva-Voce Defense Guide for College Examiners */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HelpCircle className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-extrabold text-navy-900">
              4. College Viva-Voce Defense Q&A Guide
            </h2>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-navy-900 block">
                Q1: "Why not use end-to-end black-box deep learning for maintenance dispatch?"
              </span>
              <p className="text-slate-600 text-xs leading-relaxed">
                <strong>Answer:</strong> End-to-end black-box models conflate camera conditions with physical urgency and cannot be explained to civic audit bodies. By decoupling computer vision detection (C_ai) from physical distress (S_phys) and multi-criteria priority (P_maint), every point in the final dispatch score has an auditable, transparent engineering derivation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-navy-900 block">
                Q2: "How do you handle duplicate complaints and prevent civic spam?"
              </span>
              <p className="text-slate-600 text-xs leading-relaxed">
                <strong>Answer:</strong> CivicLens AI utilizes spatial Haversine proximity (&lt; 120 meters) combined with 64-bit perceptual difference hashing (dHash) on defect textures. When a duplicate is detected, rather than spawning redundant work orders, the citizen signal elevates the original case's duplicate count factor (w_dup), appropriately raising priority without duplicating contractor billing.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-navy-900 block">
                Q3: "Can monocular smartphone photos measure true millimeter pothole depth?"
              </span>
              <p className="text-slate-600 text-xs leading-relaxed">
                <strong>Answer:</strong> No, ordinary 2D smartphone cameras lack stereoscopic depth and absolute scale reference. True depth requires LiDAR, stereo photogrammetry, or structured light. CivicLens AI explicitly reports estimated visual area ratio and class severity factor, maintaining rigorous academic integrity rather than claiming non-existent 3D depth measurements.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-navy-900 block">
                Q4: "Why use ONNX Runtime instead of a raw PyTorch server?"
              </span>
              <p className="text-slate-600 text-xs leading-relaxed">
                <strong>Answer:</strong> ONNX (Open Neural Network Exchange) separates training from inference. ONNX Runtime applies graph optimizations (constant folding, operator fusion) and runs on commodity CPU hardware with minimal memory footprint (~4.8MB model size, 14.8ms latency), making it feasible for low-cost municipal edge deployments or dashcams without requiring expensive GPU servers.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Live Evaluator Presentation Walkthrough */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white p-8 rounded-2xl shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-extrabold uppercase tracking-wide">
              5. Live Evaluation Demonstration Script (5-Minute Walkthrough)
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs text-slate-200">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
              <span className="font-mono font-bold text-teal-300 block">1. Citizen Intake</span>
              <p className="text-[11px] text-slate-300">Submit a photo with GPS coordinates on Sitabuldi / Wardha Road.</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
              <span className="font-mono font-bold text-teal-300 block">2. AI Inference</span>
              <p className="text-[11px] text-slate-300">View ONNX bounding box overlay, 14.8ms latency, and severity breakdown.</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
              <span className="font-mono font-bold text-teal-300 block">3. Model Lab</span>
              <p className="text-[11px] text-slate-300">Open `/lab` to show 74.2% mAP@0.5, PR curves, and 6×6 confusion matrix.</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
              <span className="font-mono font-bold text-teal-300 block">4. Map & DBSCAN</span>
              <p className="text-[11px] text-slate-300">Show Nagpur map pins and contiguous DBSCAN corridor hotspots.</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
              <span className="font-mono font-bold text-teal-300 block">5. Admin Policy</span>
              <p className="text-[11px] text-slate-300">Adjust w_sev slider in `/admin` and watch all open cases recalculate.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
