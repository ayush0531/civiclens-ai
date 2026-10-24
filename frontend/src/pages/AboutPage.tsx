import React from 'react';
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
  CheckCircle2
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Academic Header */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              B.Tech Artificial Intelligence Capstone Project
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            CivicLens AI: Intelligent Road Damage Detection & Maintenance Prioritization
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
            A comprehensive engineering system combining computer vision distress detection, spatial duplicate elimination, and explainable multi-criteria priority ranking for municipal road maintenance.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-slate-500">
            <span className="bg-slate-100 px-2.5 py-1 rounded">Pilot Region: Nagpur Metro</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded">Framework: FastAPI + React + SQLite</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded">Inference: EdgeCV Heuristics & Weights</span>
          </div>
        </div>

        {/* 1. Problem Statement & Motivation */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-5 h-5 text-teal-600" />
            1. Problem Statement & Motivation
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            In urban Indian municipal corporations like Nagpur, road maintenance traditionally suffers from two systemic bottlenecks:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-rose-700 uppercase">Bottleneck A: Subjective Triage</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizen complaints arrive as unstructured text or photos without objective measurement of defect size or road hazard severity, leading to arbitrary dispatch.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-amber-700 uppercase">Bottleneck B: Duplicate Overload</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dozens of citizens report the exact same pothole on major corridors (e.g. Wardha Road or Sitabuldi), overwhelming municipal staff with redundant tickets.
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
            CivicLens AI introduces an objective, reproducible pipeline that couples automated bounding box image analysis with an explainable multi-criteria ranking engine to generate transparent maintenance priority scores.
          </p>
        </div>

        {/* 2. Computer Vision Damage Taxonomy */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-5 h-5 text-teal-600" />
            2. Pavement Distress Taxonomy & Class Weights
          </h2>
          <p className="text-xs text-slate-600">
            Defect classes are mapped to civil engineering pavement condition indexes:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Physical Definition</th>
                  <th className="px-4 py-2.5 text-center">Class Hazard Factor</th>
                  <th className="px-4 py-2.5">Typical Repair Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-rose-700">Pothole</td>
                  <td className="px-4 py-2.5 text-slate-600">Cavity in asphalt surface with sharp vertical edges and depth &gt; 25mm.</td>
                  <td className="px-4 py-2.5 text-center font-mono font-bold">1.00</td>
                  <td className="px-4 py-2.5 text-slate-600">Immediate hot/cold mix asphalt patch within 24h.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-orange-700">Alligator cracking</td>
                  <td className="px-4 py-2.5 text-slate-600">Interconnected fatigue mesh resembling reptile skin caused by subgrade failure.</td>
                  <td className="px-4 py-2.5 text-center font-mono font-bold">0.85</td>
                  <td className="px-4 py-2.5 text-slate-600">Full-depth structural patch and base stabilization.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-amber-700">Transverse crack</td>
                  <td className="px-4 py-2.5 text-slate-600">Fissure perpendicular to roadway centerline caused by thermal shrinkage.</td>
                  <td className="px-4 py-2.5 text-center font-mono font-bold">0.70</td>
                  <td className="px-4 py-2.5 text-slate-600">Polymeric crack routing and hot-pour sealing.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-yellow-800">Longitudinal crack</td>
                  <td className="px-4 py-2.5 text-slate-600">Cracks parallel to pavement centerline in heavy wheelpaths or paving seams.</td>
                  <td className="px-4 py-2.5 text-center font-mono font-bold">0.65</td>
                  <td className="px-4 py-2.5 text-slate-600">Joint sealing and bituminous slurry surfacing.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-cyan-800">Surface deterioration</td>
                  <td className="px-4 py-2.5 text-slate-600">Raveling, stripping of bitumen binder, and loose coarse aggregate dislodgement.</td>
                  <td className="px-4 py-2.5 text-center font-mono font-bold">0.50</td>
                  <td className="px-4 py-2.5 text-slate-600">Surface dressing or micro-surfacing overlay.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-slate-700">Other / uncertain</td>
                  <td className="px-4 py-2.5 text-slate-600">Ambiguous surface markings, shadows, or construction expansion spalls.</td>
                  <td className="px-4 py-2.5 text-center font-mono font-bold">0.30</td>
                  <td className="px-4 py-2.5 text-slate-600">Manual engineering field inspection.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Mathematical Models: Severity & Priority */}
        <div id="severity" className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-5 h-5 text-teal-600" />
            3. Mathematical Models & Scoring Algorithms
          </h2>

          {/* Model A: Severity Estimation */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">A. Physical Severity Estimation Formulation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unlike black-box models, CivicLens AI estimates physical severity through an explainable multi-factor formula combining bounding box area ratio, detection count, and maximum distress severity multiplier:
            </p>
            <div className="p-3 bg-slate-900 text-teal-300 font-mono text-xs rounded-xl overflow-x-auto">
              Severity = min(100, 0.50 * AreaRatioScore + 0.20 * CountScore + 0.30 * ClassMultiplier * 100)
            </div>
            <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 pt-1">
              <li><strong>AreaRatioScore:</strong> Normalized pixel area occupied by detections relative to total image frame area.</li>
              <li><strong>CountScore:</strong> Multiple concurrent defects penalize score additively (<code className="font-mono">min(100, count * 33.3)</code>).</li>
              <li><strong>ClassMultiplier:</strong> Peak distress hazard factor from the taxonomy table.</li>
            </ul>
          </div>

          {/* Model B: Priority Ranking Engine */}
          <div id="priority" className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">B. Explainable Multi-Criteria Priority Ranking Formula</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              To prioritize maintenance queues equitably, the priority engine calculates:
            </p>
            <div className="p-3 bg-slate-900 text-teal-300 font-mono text-xs rounded-xl overflow-x-auto">
              Priority = 0.40 * Severity + 0.20 * Confidence*100 + 0.15 * DupSignal + 0.15 * Aging + 0.10 * RoadTier
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <strong>DupSignal (15%):</strong> Multiple citizens reporting nearby amplifies public grievance priority.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <strong>Aging (15%):</strong> Unattended cases gain +5 pts per day waiting, preventing neglected backlog.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <strong>RoadTier (10%):</strong> Highways (100 pts) and Arterials (85 pts) prioritized over local lanes (40 pts).
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <strong>Confidence (20%):</strong> High-clarity detection images take precedence over blurry photos.
              </div>
            </div>
          </div>

          {/* Model C: Duplicate Candidate Algorithm */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">C. Haversine Spatial & Visual Perceptual Duplicate Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Candidate duplicates are detected using Haversine great-circle distance (<code className="font-mono">&lt; 120m</code>), difference hash (64-bit dHash) Hamming similarity on image textures, and temporal proximity decay.
            </p>
          </div>
        </div>

        {/* 4. Prototype Limitations & Honest Evaluation Disclaimers */}
        <div className="bg-amber-50/80 border border-amber-200 p-8 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <h2 className="text-base font-bold text-amber-950 uppercase tracking-wide">
              4. Engineering Limitations & Academic Integrity Disclaimers
            </h2>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            As required by rigorous engineering evaluation principles, the project acknowledges the following boundaries:
          </p>
          <ul className="text-xs text-amber-800 space-y-2 list-disc list-inside leading-relaxed">
            <li>
              <strong>2D Monocular Photogrammetry Limitation:</strong> Ordinary smartphone photos lack physical stereoscopic depth. True pothole depth (in millimeters) cannot be physically measured without LiDAR, stereo vision, or a known ground scale reference. CivicLens AI explicitly reports preliminary heuristic area estimates.
            </li>
            <li>
              <strong>Decision Support Nature:</strong> The application recommendations assist human municipal supervisors in triage; it does not dispatch heavy equipment automatically without review.
            </li>
            <li>
              <strong>Demo vs Real Inference Transparency:</strong> When trained YOLO/ONNX weights are absent, the system activates an honest deterministic computer vision fallback labeled: <em>"DEMO ANALYSIS — NOT A VALIDATED AI PREDICTION"</em>, preserving academic honesty.
            </li>
          </ul>
        </div>

        {/* 5. College Evaluation Guide */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-teal-600" />
            5. Evaluator Walkthrough & Live Presentation Script
          </h2>
          <ol className="text-xs sm:text-sm text-slate-600 space-y-3 list-decimal list-inside leading-relaxed">
            <li>
              <strong>Step 1 (Citizen Intake):</strong> Navigate to <em>Report Damage</em>, upload a road photo or pick a sample, click a Nagpur preset landmark on the interactive map, and submit with auto-analysis enabled.
            </li>
            <li>
              <strong>Step 2 (AI Analysis Verification):</strong> Observe the AI Analysis Results Page showing side-by-side original and bounding-box overlay, predicted class, and transparent explainability breakdown.
            </li>
            <li>
              <strong>Step 3 (Geographic Visualization):</strong> Open <em>Damage Map</em> to see 25 geocoded records distributed across Sitabuldi, Dharampeth, Sadar, and Wardha Road color-coded by severity.
            </li>
            <li>
              <strong>Step 4 (Authority Operations):</strong> Switch to <em>Authority</em> using the top Demo Switcher, inspect the prioritized maintenance queue, assign a work order, and resolve a case with photo verification.
            </li>
            <li>
              <strong>Step 5 (Admin & Analytics):</strong> Open <em>Analytics</em> to inspect Recharts distributions and <em>Admin</em> to demonstrate role governance and database re-seeding.
            </li>
          </ol>
        </div>

      </div>
    </div>
  );
};
