import React, { useState } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Clock, 
  MapPin, 
  Phone, 
  ShieldAlert, 
  Image as ImageIcon,
  Sparkles,
  Info,
  Layers,
  HelpCircle,
  Save
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { StatusBadge } from './StatusBadge';

interface Props {
  report: any;
  onOfficialReferenceSaved?: (updatedReport: any) => void;
  showContinueTrackingButton?: boolean;
}

export const NMCHandoffCard: React.FC<Props> = ({ 
  report, 
  onOfficialReferenceSaved,
  showContinueTrackingButton = true 
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [officialRefInput, setOfficialRefInput] = useState(report.external_reference_id || '');
  const [refNotesInput, setRefNotesInput] = useState(report.external_reference_notes || '');
  const [jurisdictionInput, setJurisdictionInput] = useState(report.road_jurisdiction || 'NMC');
  const [savingRef, setSavingRef] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPmcGuide, setShowPmcGuide] = useState(false);

  const officialPortalUrl = "https://nmcnagpur.gov.in/grievance/complaint_form.php";
  const pwdTollFree = "1800 233 0080";
  const pwdOfficialUrl = "https://pwd.maharashtra.gov.in/en/toll-free-numbers-for-registering-pothole-complaints-on-pwd-roads/";

  const latestAnalysis = report.analyses?.length ? report.analyses[report.analyses.length - 1] : null;
  const preflightOnly = !latestAnalysis || latestAnalysis.is_demo_result || latestAnalysis.analysis_metadata?.analysis_method === 'IMAGE_QUALITY_PREFLIGHT_ONLY';

  // Generate plain-text complaint summary
  const generateSummaryText = () => {
    const createdStr = new Date(report.created_at).toLocaleString('en-IN');
    const incidentStr = report.incident_date ? new Date(report.incident_date).toLocaleDateString('en-IN') : 'Not specified';
    const lat = report.latitude ? Number(report.latitude).toFixed(6) : '0.000000';
    const lon = report.longitude ? Number(report.longitude).toFixed(6) : '0.000000';

    return `CIVIC LENS AI — ROAD DEFECT COMPLAINT SUMMARY
============================================================
CivicLens AI Internal Reference ID : ${report.reference_number}
Date Recorded in CivicLens AI      : ${createdStr}
Incident Observation Date           : ${incidentStr}

1. LOCATION & ROADWAY
------------------------------------------------------------
City Jurisdiction   : ${report.city || 'Nagpur'}, Maharashtra
Locality / Ward     : ${report.area_locality || 'Nagpur Central'}
Prominent Landmark  : ${report.landmark || report.address_text || 'Not specified'}
Street Address      : ${report.address_text || 'Nagpur'}
GPS Coordinates     : ${lat}°N, ${lon}°E
Road Classification : ${report.road_classification || 'LOCAL'}
Target Authority    : ${report.road_jurisdiction || 'NMC'}

2. CITIZEN DESCRIPTION
------------------------------------------------------------
${report.description || report.title || 'Road defect requiring maintenance.'}

3. AI COMPUTER VISION TELEMETRY
------------------------------------------------------------
Distress Category   : ${preflightOnly ? 'NOT ASSESSED — validated detector unavailable' : (report.predicted_damage_category || 'Unanalyzed')}
Model Confidence    : ${preflightOnly ? 'NOT AVAILABLE' : (Number(report.prediction_confidence || 0) * 100).toFixed(1) + '% (uncalibrated)'}
Physical Severity   : ${preflightOnly ? 'NOT ASSESSED' : Number(report.severity_score || 0).toFixed(1) + '/100 (' + (report.severity_level || 'PENDING') + ')'}
Maintenance Priority: ${preflightOnly ? 'NOT ASSIGNED' : Number(report.priority_score || 0).toFixed(1) + '/100'}

4. OFFICIAL SUBMISSION INSTRUCTIONS
------------------------------------------------------------
Submit on official NMC Portal: ${officialPortalUrl}
Complete mobile OTP verification, paste the details above, upload your photo,
and record your official NMC complaint number in CivicLens AI.

State PWD Nagpur Regional Helpline: ${pwdTollFree}
(${pwdOfficialUrl})
============================================================`;
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(report.reference_number);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopySummary = () => {
    const text = generateSummaryText();
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleDownloadSummary = () => {
    const text = generateSummaryText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Civic_Lens_AI_Complaint_${report.reference_number || report.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveOfficialReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialRefInput.trim()) {
      setSaveError('Please enter the official complaint number issued by NMC.');
      return;
    }

    setSavingRef(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updated = await api.recordExternalReference(report.id, {
        external_reference_id: officialRefInput.trim(),
        notes: refNotesInput.trim() || undefined,
        road_jurisdiction: jurisdictionInput
      });

      setSaveSuccess(`Official reference "${officialRefInput.trim()}" linked successfully! Marked as: Registration reported by citizen — unverified.`);
      if (onOfficialReferenceSaved) {
        onOfficialReferenceSaved(updated);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save official reference.');
    } finally {
      setSavingRef(false);
    }
  };

  const externalStatus = report.external_submission_status || 'NOT_REGISTERED';
  const hasOfficialRef = Boolean(report.external_reference_id);

  return (
    <div className="space-y-6">

      {/* ========================================================= */}
      {/* SECTION A: CIVIC LENS AI INTERNAL REPORT */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Section A Banner Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-300">
                Section A • CivicLens AI Report Record
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-300">CivicLens AI Complaint ID:</span>
              <span className="font-mono text-lg font-black text-white bg-slate-800 px-3 py-0.5 rounded-lg border border-slate-700">
                {report.reference_number}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Copy CivicLens AI Complaint ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>
            <p className="text-[11px] text-amber-300/90 mt-1.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Internal CivicLens AI Reference ID — this is <strong>not</strong> an official NMC complaint number.</span>
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">CivicLens AI Workflow:</span>
              <StatusBadge status={report.workflow_status || 'SAVED'} size="sm" />
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              Logged: {new Date(report.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Section A Body */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Thumbnail Image + Download Access */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 relative group flex flex-col justify-between">
              <img
                src={getImageUrl(report.annotated_image_path || report.image_path)}
                alt="Defect Evidence"
                className="w-full h-44 object-cover object-center"
              />
              <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-mono">Original Photograph</span>
                <a
                  href={getImageUrl(report.image_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:text-teal-300"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>View / Download</span>
                </a>
              </div>
            </div>

            {/* Location & Incident Description */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-base font-extrabold text-navy-900">{report.title}</h3>
              {report.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {report.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Locality</span>
                  <span className="font-semibold text-slate-800">{report.area_locality || 'Nagpur Central'}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Landmark</span>
                  <span className="font-semibold text-slate-800 truncate block">{report.landmark || report.address_text || 'Sitabuldi'}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">GPS Coordinates</span>
                  <span className="font-mono text-slate-700 text-[11px]">
                    {Number(report.latitude).toFixed(4)}°N, {Number(report.longitude).toFixed(4)}°E
                  </span>
                </div>
              </div>

              {/* AI Telemetry Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {preflightOnly ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-[11px]">
                    <Info className="w-3 h-3" />
                    <span>AI detector: not available · image preflight only</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-semibold text-[11px]">
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Raw model score: {(Number(report.prediction_confidence || 0) * 100).toFixed(0)}% · uncalibrated</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                  <span>Severity: {preflightOnly ? 'Not assessed' : Number(report.severity_score || 0).toFixed(0) + '/100'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                  <span>Priority: {preflightOnly ? 'Not assigned' : Number(report.priority_score || 0).toFixed(0) + '/100'}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px]">
                  <span>Road: {report.road_classification || 'LOCAL'}</span>
                </span>
              </div>
            </div>

          </div>

          {/* Transfer Tools: Copy Details & Download Summary */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Information Transfer Tools for Official Portals:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-900 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-teal-700" />}
                <span>{copiedSummary ? 'Summary Copied to Clipboard!' : 'Copy Complaint Details'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSummary}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download Summary (.txt)</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* SECTION B: AUTHORIZED GOVERNMENT INTEGRATION STATUS */}
      {/* ========================================================= */}
      <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
              <ShieldAlert className="h-3.5 w-3.5" /> Government integration status
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              CivicLens AI report saved · NMC registration pending
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              CivicLens AI has completed its own report workflow. This deployment does not have an authorized NMC API connection, so it cannot submit the grievance, complete OTP verification, or retrieve an official government acknowledgement on your behalf.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Citizen action required
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">1 · CivicLens AI</span>
            <p className="mt-1 text-sm font-bold text-slate-900">Analysis and case record</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Image analysis, location, severity and internal reference are stored in this application.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">2 · Official channel</span>
            <p className="mt-1 text-sm font-bold text-slate-900">Citizen-assisted registration</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Open NMC's portal separately and complete the verification and submission required by the authority.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">3 · Link records</span>
            <p className="mt-1 text-sm font-bold text-slate-900">Record the official reference</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Enter the reference issued by NMC below. CivicLens AI labels citizen-entered references as unverified.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-teal-950">Ready to use the official NMC channel?</p>
            <p className="mt-1 text-xs text-teal-900">Your CivicLens AI record remains available here. The link opens the government website in a separate tab.</p>
          </div>
          <a href={officialPortalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-xs font-extrabold text-white transition hover:bg-teal-800">
            Open NMC grievance portal <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION C: CITIZEN OFFICIAL REFERENCE RECORDING FORM */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-700 block">
              Section C • Post-Registration Tracking Link
            </span>
            <h3 className="text-base font-extrabold text-navy-900 mt-0.5">
              Record Official NMC Complaint Number
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Once you submit on NMC's portal and receive an official complaint number, record it here to connect both systems.
            </p>
          </div>

          {hasOfficialRef && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Registration reported by citizen — unverified
            </span>
          )}
        </div>

        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
            <button onClick={() => setSaveSuccess(null)} className="text-emerald-700 font-bold">&times;</button>
          </div>
        )}

        {saveError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
            <button onClick={() => setSaveError(null)} className="text-rose-700 font-bold">&times;</button>
          </div>
        )}

        {/* Form to Record Reference */}
        <form onSubmit={handleSaveOfficialReference} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official NMC Grievance Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={officialRefInput}
                onChange={(e) => setOfficialRefInput(e.target.value)}
                placeholder="e.g. NMC-2026-98124 or CGRS reference issued by NMC..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Found in the SMS confirmation or on-screen confirmation upon completing the NMC portal form.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Road Jurisdiction
              </label>
              <select
                value={jurisdictionInput}
                onChange={(e) => setJurisdictionInput(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="NMC">NMC (Municipal Corporation)</option>
                <option value="PWD_MAHARASHTRA">Maharashtra State PWD</option>
                <option value="NHAI">NHAI (National Highway)</option>
                <option value="NMRDA">NMRDA (Metropolitan Region)</option>
                <option value="UNKNOWN">Uncertain / To Be Verified</option>
              </select>
            </div>

          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Submission Notes / Zone (Optional)
            </label>
            <input
              type="text"
              value={refNotesInput}
              onChange={(e) => setRefNotesInput(e.target.value)}
              placeholder="e.g. Submitted via mobile OTP under Dharampeth Zone 2 / Ward 14..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-400 italic">
              Note: CivicLens AI records your reference and monitors it. Manually recorded numbers are labeled as citizen-reported unverified until confirmed via authorized integration.
            </p>

            <button
              type="submit"
              disabled={savingRef || !officialRefInput.trim()}
              className="px-6 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 shadow-sm"
            >
              {savingRef ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Official Reference</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* ========================================================= */}
      {/* SECTION D: ROAD OWNERSHIP & ALTERNATIVE CONTACTS (PWD) */}
      {/* ========================================================= */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-teal-700 shrink-0" />
            <h4 className="font-extrabold text-navy-900 text-xs">
              Road Ownership Guidance: Is this road maintained by Maharashtra PWD or NHAI?
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowPmcGuide(!showPmcGuide)}
            className="text-[11px] font-bold text-teal-700 hover:underline shrink-0"
          >
            {showPmcGuide ? 'Hide Guidance' : 'View Alternative Contacts'}
          </button>
        </div>

        <p className="text-slate-600 leading-relaxed text-[11px]">
          Not all roads in the Nagpur metropolitan area are under Nagpur Municipal Corporation (NMC) jurisdiction. 
          State highways (SH), major district roads (MDR), and bypass corridors are maintained by the <strong>Maharashtra Public Works Department (PWD)</strong> or National Highways Authority of India (NHAI).
        </p>

        {showPmcGuide && (
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 block text-xs">Maharashtra PWD Nagpur Regional Helpline:</span>
                <span className="text-[11px] text-slate-500">Official toll-free number for reporting potholes on PWD-maintained state highways and MDRs.</span>
              </div>
              <a
                href={`tel:${pwdTollFree.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono font-bold text-xs shrink-0 hover:bg-emerald-100"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{pwdTollFree}</span>
              </a>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Official Source Verification:</span>
              <a
                href={pwdOfficialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 hover:text-teal-800 font-bold inline-flex items-center gap-1"
              >
                <span>pwd.maharashtra.gov.in Pothole Complaints</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
