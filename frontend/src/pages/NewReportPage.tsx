import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  Upload, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  FileText, 
  Layers,
  Copy,
  Check,
  Building2,
  Calendar,
  User as UserIcon,
  Phone,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Search
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { MapView } from '../components/MapView';
import { NMCHandoffCard } from '../components/NMCHandoffCard';
import { QuickInspectResult } from '../types';

interface NagpurPreset {
  name: string;
  lat: number;
  lng: number;
  address: string;
  locality: string;
  landmark: string;
  roadClass: string;
}

const NAGPUR_LOCALITIES = [
  'Sitabuldi Central',
  'Dharampeth West',
  'Sadar Commercial',
  'Dhantoli Medical Zone',
  'Wardha Road Corridor',
  'Mahal Heritage Area',
  'Gandhibagh Market',
  'Lakadganj Industrial Area',
  'Mangalwari Zone',
  'Nehru Nagar East',
  'Hanuman Nagar',
  'Ashi Nagar North',
  'Satranjipura Zone',
  'Gayatri Nagar IT Park'
];

const NAGPUR_PRESETS: NagpurPreset[] = [
  { 
    name: 'Sitabuldi Interchange', 
    lat: 21.1458, 
    lng: 79.0882, 
    address: 'Sitabuldi Metro Station, Wardha Road Junction, Nagpur', 
    locality: 'Sitabuldi Central',
    landmark: 'Opposite Sitabuldi Metro Station Entrance Gate 2',
    roadClass: 'ARTERIAL' 
  },
  { 
    name: 'Dharampeth Shopping Hub', 
    lat: 21.1420, 
    lng: 79.0620, 
    address: 'West High Court Road, Dharampeth, Nagpur', 
    locality: 'Dharampeth West',
    landmark: 'Near Coffee House Square, WHC Road',
    roadClass: 'COLLECTOR' 
  },
  { 
    name: 'Sadar Commercial Zone', 
    lat: 21.1610, 
    lng: 79.0820, 
    address: 'Mount Road, Sadar, Nagpur', 
    locality: 'Sadar Commercial',
    landmark: 'Opposite Sadar Police Station, Mount Road',
    roadClass: 'COLLECTOR' 
  },
  { 
    name: 'Wardha Road Corridor', 
    lat: 21.1180, 
    lng: 79.0740, 
    address: 'Wardha Road, Near Rahate Colony Square, Nagpur', 
    locality: 'Wardha Road Corridor',
    landmark: 'Near Rahate Colony Square Metro Pillar 114',
    roadClass: 'HIGHWAY' 
  },
  { 
    name: 'Medical Square Trauma Area', 
    lat: 21.1280, 
    lng: 79.0960, 
    address: 'Medical Square, Near GMC Casualty Gate, Nagpur', 
    locality: 'Dhantoli Medical Zone',
    landmark: 'Outside GMC Casualty Gate, Medical Square',
    roadClass: 'ARTERIAL' 
  },
  { 
    name: 'Gayatri Nagar IT Park', 
    lat: 21.1230, 
    lng: 79.0510, 
    address: 'Gayatri Nagar IT Park Link Road, Nagpur', 
    locality: 'Gayatri Nagar IT Park',
    landmark: 'Adjacent to IT Park Main Security Arch',
    roadClass: 'LOCAL' 
  },
];

export const NewReportPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Step (1: Upload, 2: Incident Details, 3: AI Analysis, 4: Review & Submit, 5: Confirmation)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Photo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Step 2: Incident Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [landmark, setLandmark] = useState('');
  const [areaLocality, setAreaLocality] = useState('Sitabuldi Central');
  const [city] = useState('Nagpur');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [latitude, setLatitude] = useState<number>(21.1458);
  const [longitude, setLongitude] = useState<number>(79.0882);
  const [addressText, setAddressText] = useState('Sitabuldi Interchange, Nagpur');
  const [roadClass, setRoadClass] = useState('ARTERIAL');

  // Step 3: Quick AI Inspection
  const [aiInspectResult, setAiInspectResult] = useState<QuickInspectResult | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Step 4 & 5: Submission & Confirmation
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Handle Photo selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Please upload a valid JPEG, PNG, or WebP image.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file size exceeds the 10MB limit.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAiInspectResult(null); // Reset quick inspection if file changed
    }
  };

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setLatitude(Number(lat.toFixed(6)));
    setLongitude(Number(lng.toFixed(6)));
    setAddressText(`GPS Coordinate: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Nagpur)`);
  };

  const applyPreset = (preset: NagpurPreset) => {
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setAddressText(preset.address);
    setAreaLocality(preset.locality);
    setLandmark(preset.landmark);
    setRoadClass(preset.roadClass);
    if (!title) {
      setTitle(`Pavement Distress at ${preset.name}`);
    }
  };

  // Run quick AI inspection on photo
  const runQuickInspection = async () => {
    if (!selectedFile) return;
    setInspecting(true);
    setInspectError(null);
    try {
      const result = await api.quickInspectImage(selectedFile);
      setAiInspectResult(result);
    } catch (err: any) {
      console.warn('Quick inspect fallback', err);
      setInspectError(err.message || 'Instant AI inspection temporarily delayed. Proceeding will still analyze upon submission.');
    } finally {
      setInspecting(false);
    }
  };

  // Advance to Step 3 and trigger AI inspect
  const handleGoToStep3 = () => {
    if (!title.trim() || title.trim().length < 5) {
      setError('Please provide a descriptive title of at least 5 characters.');
      return;
    }
    setError(null);
    setCurrentStep(3);
    // Run the expensive model only once, during final report creation.
    // The previous flow ran quickInspect here and repeated the same inference
    // again in create_report, doubling the wait for citizens.
  };

  // Final Submission
  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please attach an image of the road damage.');
      setCurrentStep(1);
      return;
    }
    if (!title.trim()) {
      setError('Please provide a report title.');
      setCurrentStep(2);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('landmark', landmark.trim() || addressText);
      formData.append('area_locality', areaLocality);
      formData.append('city', city);
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('address_text', addressText.trim());
      formData.append('road_classification', roadClass);
      formData.append('reporter_name', reporterName.trim() || 'Anonymous Nagpur Citizen');
      formData.append('reporter_contact', reporterContact.trim());
      formData.append('incident_date', incidentDate);
      formData.append('auto_analyze', 'true');
      formData.append('image', selectedFile);

      const created = await api.createReport(formData);
      setCreatedReport(created);

      // Save reference to recent complaints in localStorage
      try {
        const stored = localStorage.getItem('civiclens_recent_complaints');
        const list = stored ? JSON.parse(stored) : [];
        const ref = created.reference_number || String(created.id);
        const updated = [ref, ...list.filter((x: string) => x !== ref)].slice(0, 5);
        localStorage.setItem('civiclens_recent_complaints', JSON.stringify(updated));
      } catch {
        // ignore
      }

      setCurrentStep(5); // Go to Confirmation
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const primaryAnalysis = createdReport?.analyses?.[0];
  const analysisIsDemo = primaryAnalysis?.is_demo_result ?? primaryAnalysis?.inference_mode !== 'REAL';

  const handleResetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTitle('');
    setDescription('');
    setLandmark('');
    setReporterName('');
    setReporterContact('');
    setAiInspectResult(null);
    setCreatedReport(null);
    setCurrentStep(1);
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Wizard Header & Progress Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Citizen Reporting Wizard • Nagpur Municipal Corporation
                </span>
              </div>
              <h1 className="text-2xl font-black text-navy-900 tracking-tight">
                Report Road Defect
              </h1>
            </div>

            {/* Step Counter Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200">
              <span>Step {currentStep} of 5</span>
              <span className="text-slate-400">•</span>
              <span>
                {currentStep === 1 && 'Upload Photo'}
                {currentStep === 2 && 'Incident Details'}
                {currentStep === 3 && 'Evidence Check'}
                {currentStep === 4 && 'Review & Submit'}
                {currentStep === 5 && 'Confirmation'}
              </span>
            </div>
          </div>

          {/* Stepper Dots / Bars */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div key={stepNum} className="flex flex-col gap-1">
                <div 
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep >= stepNum ? 'bg-teal-600' : 'bg-slate-200'
                  }`}
                />
                <span className={`text-[10px] font-semibold text-center hidden sm:block ${
                  currentStep === stepNum ? 'text-teal-900 font-bold' : 'text-slate-400'
                }`}>
                  {stepNum === 1 && '1. Photo'}
                  {stepNum === 2 && '2. Details'}
                  {stepNum === 3 && '3. Evidence'}
                  {stepNum === 4 && '4. Review'}
                  {stepNum === 5 && '5. Success'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: PHOTO UPLOAD */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-600" />
                Step 1: Upload Road Defect Photograph
              </h2>
              <p className="text-xs text-slate-500">
                Provide a clear photograph of the pavement defect (pothole, crack, surface failure). Our AI models analyze edge density, contrast, and depth.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Drag/Browse Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-teal-500 transition-colors bg-slate-50/60">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Upload Pavement Image</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Drag and drop image here or click browse below.
                </p>
                <label className="cursor-pointer">
                  <span className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2.5 rounded-xl shadow-xs transition-colors">
                    {selectedFile ? 'Change Selected File' : 'Browse Files'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-400 mt-3 font-mono">
                  Supported: JPG, PNG, WebP (Max 10MB)
                </span>
              </div>

              {/* Preview Window */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center min-h-[220px] relative">
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Field Preview"
                      className="w-full h-64 object-cover object-center"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-1 rounded">
                      Selected: {selectedFile?.name} ({(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">No Image Uploaded Yet</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Photographing the pothole from a 45° angle with part of the surrounding road lane produces the highest AI accuracy.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {selectedFile ? '✓ Image attached ready for details' : 'Attach photo to proceed'}
              </span>
              <button
                type="button"
                disabled={!selectedFile}
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span>Next: Incident Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: INCIDENT & LOCATION DETAILS */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Step 2: Incident & Locality Details
              </h2>
              <p className="text-xs text-slate-500">
                Pinpoint the defect within Nagpur municipal jurisdiction. Select a locality or click on the map to pin precise coordinates.
              </p>
            </div>

            {/* Quick Evaluator Nagpur Presets */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-navy-900 block">
                Quick Nagpur Landmark Presets (for College Evaluator Demo):
              </span>
              <div className="flex flex-wrap gap-2">
                {NAGPUR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-800 transition-colors"
                  >
                    📍 {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Report Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep Pothole Cluster near Sitabuldi Metro Station"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Locality / Ward Zone <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={areaLocality}
                    onChange={(e) => setAreaLocality(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium"
                  >
                    {NAGPUR_LOCALITIES.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City Jurisdiction
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Nagpur, Maharashtra (NMC)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prominent Landmark or Cross-Street
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite NMC Zonal Office / Pillar 42"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Road Classification
                  </label>
                  <select
                    value={roadClass}
                    onChange={(e) => setRoadClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="LOCAL">Local / Residential Street (Low Speed)</option>
                    <option value="COLLECTOR">Collector Road (Connecting Neighborhoods)</option>
                    <option value="ARTERIAL">Arterial Road (Major Commercial Corridor)</option>
                    <option value="HIGHWAY">Expressway / Highway (High Speed Multi-Lane)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe depth, water accumulation, traffic slowdown, or hazardous edges..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Citizen Information & Privacy Notice */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Reporter Name (Optional)</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Citizen Name"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Phone (Optional)</label>
                  <input
                    type="text"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    placeholder="+91 98XXXXXXXX"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Incident Date</label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none bg-white"
                  />
                </div>
                <div className="col-span-full text-[10px] text-slate-400 italic">
                  Note: Reporter identity is stored securely for municipal verification and is withheld from public tracking pages.
                </div>
              </div>

              {/* Interactive Map Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Geospatial Pin (Click Map to Adjust Coordinates):
                  </label>
                  <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
                  </span>
                </div>
                <div className="h-60 rounded-xl overflow-hidden border border-slate-200">
                  <MapView
                    center={[latitude, longitude]}
                    zoom={14}
                    height="100%"
                    selectedLocation={{ lat: latitude, lng: longitude }}
                    onLocationSelect={handleMapLocationSelect}
                  />
                </div>
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Photo</span>
              </button>

              <button
                type="button"
                onClick={handleGoToStep3}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
              >
                <span>Next: AI Road Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: INSTANT AI ROAD-DEFECT ANALYSIS */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  Step 3: Evidence & Location Validation
                </h2>
                <p className="text-xs text-slate-500">
                  Confirm that the photograph and coordinates are correct. The final submission runs the server-side analysis once and stores the results with your report.
                </p>
              </div>

              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Pre-check complete · Analysis runs once on submit</span>
              </span>
            </div>

            {/* Fast pre-flight checks — model inference runs once on final submission. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  Evidence attached
                </div>
                {previewUrl && (
                  <img src={previewUrl} alt="Uploaded road evidence preview" className="mt-3 h-40 w-full rounded-lg object-cover" />
                )}
                <p className="mt-2 text-xs text-slate-600">
                  {selectedFile ? selectedFile.name : 'No image selected'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · ${selectedFile.type}` : 'Attach a JPEG, PNG or WebP image.'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Location captured
                </div>
                <p className="text-sm font-semibold text-slate-800">{addressText || 'Address not provided'}</p>
                <p className="font-mono text-xs text-slate-500">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                <p className="text-xs text-slate-600">{areaLocality} · {roadClass}</p>
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs leading-relaxed text-teal-900">
                  <strong>Next:</strong> On final submission, CivicLens runs image inference, severity estimation, duplicate screening and maintenance-priority calculation once, then saves the report.
                </div>
              </div>
            </div>
            {/* Step 3 Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Details</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
              >
                <span>Next: Review & Submit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: REVIEW AND SUBMIT */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                Step 4: Review & Submit to CivicLens
              </h2>
              <p className="text-xs text-slate-500">
                Confirm the evidence and incident details before CivicLens performs its final server-side analysis and saves the report.
              </p>
            </div>

            {/* Honest NMC Demonstration Environment Banner */}
            <div className="bg-gradient-to-r from-teal-900 to-navy-900 text-white rounded-2xl p-5 shadow-xs border border-teal-700/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded">
                    Demonstration Scope Notice
                  </span>
                  <span className="text-xs font-bold text-slate-200">Nagpur Municipal Corporation</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Demonstration environment: This report is recorded in CivicLens AI for review within this application. Official submission to Nagpur Municipal Corporation is not enabled or confirmed.
                </p>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
              
              {/* Row 1: Photo & Title */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50/50">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-900">
                  <img
                    src={previewUrl || ''}
                    alt="Summary thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Complaint Title</span>
                  <h3 className="text-base font-extrabold text-navy-900 mt-0.5">{title}</h3>
                  {description && <p className="text-slate-600 text-xs mt-1">{description}</p>}
                </div>
              </div>

              {/* Row 2: Location details */}
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Locality</span>
                  <span className="font-bold text-slate-800 text-xs">{areaLocality}, Nagpur</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Landmark</span>
                  <span className="font-bold text-slate-800 text-xs truncate block">{landmark || addressText}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">GPS Coordinates</span>
                  <span className="font-mono text-slate-700 text-xs">{latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E</span>
                </div>
              </div>

              {/* Row 3: AI Diagnosis & Road Type */}
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/30">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Analysis Classification</span>
                  <span className="font-bold text-teal-800 text-xs">
                    {aiInspectResult?.predicted_damage_category || 'Calculated during final analysis'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Estimated Severity</span>
                  <span className="font-bold text-rose-600 text-xs font-mono">
                    {aiInspectResult ? `${aiInspectResult.severity_score.toFixed(1)} / 100 (${aiInspectResult.severity_level})` : 'Calculated on Submit'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Road Classification</span>
                  <span className="font-bold text-slate-800 text-xs">{roadClass}</span>
                </div>
              </div>

            </div>

            {/* Step 4 Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Evidence Check</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing once & saving report...</span>
                  </>
                ) : (
                  <>
                    <span>Submit CivicLens Report</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: CIVICLENS REPORT & OFFICIAL NMC HANDOFF */}
        {/* ========================================================= */}
        {currentStep === 5 && createdReport && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 inline-block">
                ✓ Report Successfully Saved in CivicLens.AI
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-navy-900">
CivicLens Report Created • NMC Registration Not Yet Confirmed
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                Your CivicLens report has been processed and saved. The analysis engine and its operating mode are shown below. NMC registration is a separate, citizen-assisted step until an authorized government integration is available.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Analysis engine</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{primaryAnalysis?.model_identifier || 'Analysis unavailable'}</p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${analysisIsDemo ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
                  {analysisIsDemo ? 'Research / heuristic mode' : 'ONNX model mode'}
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Detected category</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{createdReport.predicted_damage_category || 'Pending'}</p>
                <span className="text-xs text-slate-500">Confidence: {((createdReport.prediction_confidence || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Severity / priority</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{Number(createdReport.severity_score || 0).toFixed(1)} / 100 · {createdReport.severity_level || 'Pending'}</p>
                <span className="text-xs text-slate-500">Priority score: {Number(createdReport.priority_score || 0).toFixed(1)} / 100</span>
              </div>
            </div>
            {analysisIsDemo && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
                <strong>Research-mode disclosure:</strong> This deployment is using the deterministic image-feature heuristic because trained ONNX weights are not loaded. Its category and confidence are experimental and must not be represented as validated deep-learning predictions.
              </div>
            )}

            <NMCHandoffCard
              report={createdReport}
              onOfficialReferenceSaved={(updated) => setCreatedReport(updated)}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
              <Link
                to={`/track/${encodeURIComponent(createdReport.reference_number || createdReport.id)}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Go to Live Complaint Tracking Page</span>
              </Link>

              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
              >
                Submit Another Report
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
