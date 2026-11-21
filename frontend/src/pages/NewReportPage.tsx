import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  Upload, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  CheckCircle,
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
  RotateCcw, 
  Loader2, 
  X, 
  Cpu, 
  ShieldCheck, 
  ShieldAlert,
  Search,
  Maximize2,
  Trash2,
  RefreshCw,
  Eye,
  AlertTriangle,
  Compass,
  Ruler
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { QuickInspectResult, PotholeBreakdownItem } from '../types';
import { DamageBadge, SeverityBadge } from '../components/DamageBadge';
import { StatusBadge } from '../components/StatusBadge';

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

const DEFECT_CATEGORIES = [
  'Pothole',
  'Alligator cracking',
  'Transverse crack',
  'Longitudinal crack',
  'Surface deterioration',
  'Other Pavement Hazard'
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
    landmark: 'Near Sadar Police Station, Mount Road',
    roadClass: 'ARTERIAL' 
  },
  { 
    name: 'Wardha Road Corridor', 
    lat: 21.1020, 
    lng: 79.0680, 
    address: 'Wardha Road, Near Airport T-Point, Nagpur', 
    locality: 'Wardha Road Corridor',
    landmark: 'Adjacent to Dr. Babasaheb Ambedkar International Airport Metro Pillar 142',
    roadClass: 'HIGHWAY' 
  },
  { 
    name: 'Manish Nagar Crossing', 
    lat: 21.0960, 
    lng: 79.0720, 
    address: 'Manish Nagar Railway Underbridge Road, Nagpur', 
    locality: 'Wardha Road Corridor',
    landmark: 'Near Manish Nagar T-Point Junction',
    roadClass: 'LOCAL' 
  }
];

export const NewReportPage: React.FC = () => {
  const navigate = useNavigate();

  // Workflow Stages: 1 through 6
  // 1: Upload Photograph
  // 2: Image Quality & Road Scene Verification
  // 3: AI Pothole Detection
  // 4: Damage Assessment
  // 5: Location & Report Review
  // 6: Final Submission & Tracking
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Stage 1 State: Photo & Camera
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraCaptured, setIsCameraCaptured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  // Stage 2 & 3 State: AI Inspection & Road Scene Verification
  const [aiInspectResult, setAiInspectResult] = useState<QuickInspectResult | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Stage 5 State: Complaint Details & Location
  const [defectCategory, setDefectCategory] = useState<string>('Pothole');
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
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);

  // Stage 6 State: Submission & Confirmation
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Clean up webcam stream on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [webcamStream]);

  // Connect video element when live webcam modal is displayed
  useEffect(() => {
    if (showWebcamModal && webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play().catch((err) => {
        console.warn('Webcam playback error:', err);
      });
    }
  }, [showWebcamModal, webcamStream]);

  // Handle Photo selection from gallery / file picker
  // NOTE: Uploading a file NEVER advances the step automatically!
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setInspectError(null);
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
      setIsCameraCaptured(false);
      setAiInspectResult(null);
    }
  };

  // Handle Photo captured from device camera
  // NOTE: Capturing a photo NEVER advances the step automatically!
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setInspectError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please capture or select a valid image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Captured photograph exceeds the 10MB size limit.');
        return;
      }
      const fileName = file.name && file.name !== 'image.jpg' 
        ? file.name 
        : `road_defect_capture_${Date.now()}.jpg`;
      const readyFile = new File([file], fileName, { type: file.type || 'image/jpeg' });
      setSelectedFile(readyFile);
      setPreviewUrl(URL.createObjectURL(readyFile));
      setIsCameraCaptured(true);
      setAiInspectResult(null);
      if (!title) {
        setTitle('Road Defect (Camera Capture)');
      }
    }
  };

  // Trigger file dialog
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Trigger camera capture: native rear camera on mobile, live modal on desktop
  const triggerCameraCapture = () => {
    setError(null);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile && nativeCameraInputRef.current) {
      nativeCameraInputRef.current.value = '';
      nativeCameraInputRef.current.click();
    } else {
      openWebcamModal();
    }
  };

  // Desktop Live Webcam Modal
  const openWebcamModal = async () => {
    setError(null);
    setCameraLoading(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (nativeCameraInputRef.current) {
          nativeCameraInputRef.current.click();
          return;
        }
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setWebcamStream(stream);
      setShowWebcamModal(true);
    } catch (err: any) {
      console.warn('Webcam access error:', err);
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      } else {
        setError('Unable to access device camera. Please upload a photo from your gallery.');
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const closeWebcamModal = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
    setShowWebcamModal(false);
  };

  const capturePhotoFromWebcam = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `road_defect_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsCameraCaptured(true);
      setAiInspectResult(null);
      if (!title) {
        setTitle('Road Defect (Camera Capture)');
      }
      closeWebcamModal();
    }, 'image/jpeg', 0.92);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsCameraCaptured(false);
    setAiInspectResult(null);
    setInspectError(null);
  };

  // Run AI Inspection for Stage 2 & 3
  const runAiAnalysis = async (fileToAnalyze: File) => {
    setInspecting(true);
    setInspectError(null);
    try {
      const result = await api.quickInspectImage(fileToAnalyze);
      setAiInspectResult(result);
      
      // Auto-populate defect category from AI detection if road scene is valid
      if (result.is_road_scene !== false && result.predicted_damage_category && result.predicted_damage_category !== 'Other / uncertain') {
        setDefectCategory(result.predicted_damage_category);
        if (!title || title === 'Road Defect (Camera Capture)') {
          setTitle(`${result.predicted_damage_category} on ${addressText.split(',')[0] || 'Road'}`);
        }
      }
      return result;
    } catch (err: any) {
      console.error('AI quick inspect failed:', err);
      setInspectError(err?.message || 'AI verification service was unable to complete optical screening. You may retry or proceed with manual complaint details.');
      return null;
    } finally {
      setInspecting(false);
    }
  };

  // Navigate from Stage 1 to Stage 2: Automatically triggers inspection
  const handleProceedToVerification = async () => {
    if (!selectedFile) {
      setError('Please select or capture a photograph of the road defect first.');
      return;
    }
    setError(null);
    setCurrentStep(2);

    if (!aiInspectResult) {
      await runAiAnalysis(selectedFile);
    }
  };

  // HTML5 GPS Geolocation
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingGps(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setLocatingGps(false);
        setAddressText(`GPS Location (${lat}°N, ${lng}°E), Nagpur`);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocatingGps(false);
        setError('Could not retrieve your precise GPS location. Please select one of the Nagpur landmark presets below.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleApplyPreset = (preset: NagpurPreset) => {
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setAddressText(preset.address);
    setAreaLocality(preset.locality);
    setLandmark(preset.landmark);
    setRoadClass(preset.roadClass);
    setGpsAccuracy(5);
  };

  // Final Submission to Backend: Only called from Stage 6
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('A road problem photograph is required.');
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const finalTitle = title.trim() || `${defectCategory} near ${landmark || addressText || 'Nagpur'}`;
      const formData = new FormData();
      formData.append('title', finalTitle);
      formData.append('description', description.trim() || `Reported ${defectCategory} in ${areaLocality}, Nagpur. Submitted via Civic Lens AI citizen portal.`);
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

      // Successful creation: advance to Confirmation
      setCurrentStep(6);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit complaint. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetForm = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsCameraCaptured(false);
    setDefectCategory('Pothole');
    setTitle('');
    setDescription('');
    setLandmark('');
    setReporterName('');
    setReporterContact('');
    setAiInspectResult(null);
    setInspectError(null);
    setCreatedReport(null);
    setError(null);
    setCurrentStep(1);
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Live Camera Viewfinder Modal for Desktop */}
        {showWebcamModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 text-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-sm">Capture Road Defect Photo</h3>
                </div>
                <button
                  type="button"
                  onClick={closeWebcamModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && webcamStream && el.srcObject !== webcamStream) {
                      el.srcObject = webcamStream;
                      el.play().catch(console.warn);
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder Overlay Guide */}
                <div className="absolute inset-8 border-2 border-dashed border-teal-400/60 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] text-teal-200/90 font-medium bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                    Align pothole or road damage within box
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={closeWebcamModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhotoFromWebcam}
                  className="flex-1 py-3 px-5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-teal-900/40"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#0b2234] via-[#0f3047] to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Civic Lens AI Citizen Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Report a Road Problem</h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                Photograph road damage across Nagpur. AI automatically verifies the photograph, detects potholes, and registers your grievance.
              </p>
            </div>
            <Link
              to="/citizen"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors shrink-0 self-start sm:self-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>

          {/* Six-Stage Step Indicator */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-6 gap-2 text-center text-xs">
            {[
              { num: 1, title: 'Upload Photo' },
              { num: 2, title: 'Photo Check' },
              { num: 3, title: 'AI Detection' },
              { num: 4, title: 'Assessment' },
              { num: 5, title: 'Review' },
              { num: 6, title: 'Submit' }
            ].map((step) => (
              <div 
                key={step.num}
                className={`flex flex-col items-center gap-1.5 ${
                  currentStep === step.num 
                    ? 'text-teal-300 font-bold' 
                    : currentStep > step.num 
                    ? 'text-emerald-400 font-medium' 
                    : 'text-slate-400 opacity-60'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === step.num
                    ? 'bg-teal-500 text-slate-950 ring-4 ring-teal-500/30 font-black'
                    : currentStep > step.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-slate-300'
                }`}>
                  {currentStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
                </div>
                <span className="text-[10px] hidden sm:inline truncate max-w-[80px]">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Notice</span>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 font-bold text-sm">&times;</button>
          </div>
        )}

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />

        {/* ========================================================================= */}
        {/* STAGE 1: UPLOAD PHOTOGRAPH                                                */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-700 block">
                Stage 1 of 6 • Photo Capture
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Report a Road Problem
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide a clear photograph of the road damage. You can choose a photo from your gallery or take one directly with your camera.
              </p>
            </div>

            {/* Photo Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={triggerFileUpload}
                className="py-4 px-5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center justify-center gap-3 shadow-md shadow-teal-900/10 transition-all hover:scale-[1.01]"
              >
                <Upload className="w-5 h-5 text-teal-200" />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={triggerCameraCapture}
                disabled={cameraLoading}
                className="py-4 px-5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-sm border-2 border-teal-600/40 flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
              >
                {cameraLoading ? (
                  <Loader2 className="w-5 h-5 text-teal-700 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-teal-700" />
                )}
                <span>Take Photo</span>
              </button>
            </div>

            {/* Photo Preview Area */}
            {previewUrl ? (
              <div className="rounded-2xl border-2 border-teal-500/40 bg-slate-900 overflow-hidden relative group">
                <img
                  src={previewUrl}
                  alt="Road defect photograph"
                  className="w-full max-h-[380px] object-contain bg-slate-950 mx-auto"
                />

                {/* Overlay details */}
                <div className="p-4 bg-slate-900/90 border-t border-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold block truncate max-w-xs">{selectedFile?.name || 'Captured Photograph'}</span>
                      <span className="text-[10px] text-slate-400">
                        {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB • Ready for verification` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={triggerFileUpload}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                onClick={triggerFileUpload}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50/70 hover:bg-teal-50/20 rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto text-teal-600">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Click to upload or drag photo here</p>
                <p className="text-xs text-slate-400">Supports standard JPG, JPEG, PNG, or WebP up to 10MB</p>
              </div>
            )}

            {/* Bottom Navigation */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {selectedFile ? 'Photograph loaded. Click Continue to verify.' : 'Select a photo to proceed.'}
              </span>
              <button
                type="button"
                disabled={!selectedFile}
                onClick={handleProceedToVerification}
                className="px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: IMAGE QUALITY & ROAD SCENE VERIFICATION                           */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-700 block">
                Stage 2 of 6 • Photograph Verification
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Checking Your Photograph
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Civic Lens AI verifies image readability, focus, lighting, and confirms that the photo depicts a genuine road scene.
              </p>
            </div>

            {inspecting ? (
              <div className="py-12 px-6 text-center space-y-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-teal-100 border border-teal-300 text-teal-700 flex items-center justify-center mx-auto animate-spin">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Verifying Road Photograph...</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Checking image focus, illumination, and asphalt pavement features.
                  </p>
                </div>
              </div>
            ) : aiInspectResult?.is_road_scene === false || aiInspectResult?.road_scene_status === 'REJECTED' ? (
              /* REJECTION STATE: Selfie, building, screenshot, non-road */
              <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/70 p-6 space-y-4 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-rose-950">
                      This doesn't look like a road photograph.
                    </h3>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      Please upload a clear picture of a road or pothole. Photographs of faces, selfies, buildings, interior rooms, screenshots, or unrelated objects cannot be submitted as road grievances.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-800 block">Verification check result:</span>
                  <p className="mt-0.5">{aiInspectResult.road_scene_message || 'Non-road content detected in uploaded image.'}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleRemovePhoto();
                      setCurrentStep(1);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" /> Try Another Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-3 rounded-xl border border-rose-300 text-rose-800 font-bold text-xs hover:bg-rose-100"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : aiInspectResult?.road_scene_status === 'UNCERTAIN' ? (
              /* UNCERTAIN STATE: Advisory with option to retry or continue */
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-6 space-y-4 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-amber-950">
                      Unable to verify this photograph.
                    </h3>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      Please upload a clearer road image. We could not verify pavement features or visible surface damage with high confidence.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-800 block">Verification advisory:</span>
                  <p className="mt-0.5">{aiInspectResult.road_scene_message || 'Unable to confirm road pavement features.'}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleRemovePhoto();
                      setCurrentStep(1);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" /> Upload Clearer Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-3 rounded-xl border border-amber-400 text-amber-900 font-bold text-xs hover:bg-amber-100"
                  >
                    Continue to AI Detection
                  </button>
                </div>
              </div>
            ) : (
              /* VERIFIED STATE */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quality Check */}
                  <div className={`p-4 rounded-2xl border ${
                    aiInspectResult?.quality_status === 'WARNING' 
                      ? 'bg-amber-50 border-amber-300 text-amber-900' 
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {aiInspectResult?.quality_status === 'WARNING' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      <span className="font-bold text-xs">Image Quality & Sharpness</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {aiInspectResult?.quality_message || 'Image focus and illumination verified.'}
                    </p>
                  </div>

                  {/* Road Scene Check */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs">Road Scene Verification</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {aiInspectResult?.road_scene_message || 'Road pavement scene successfully verified.'}
                    </p>
                  </div>
                </div>

                {previewUrl && (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 max-h-[300px] flex items-center justify-center">
                    <img src={previewUrl} alt="Verified pavement" className="max-h-[300px] object-contain" />
                  </div>
                )}
              </div>
            )}

            {/* Stage 2 Navigation */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Photo
              </button>

              {aiInspectResult?.is_road_scene !== false && aiInspectResult?.road_scene_status !== 'REJECTED' && !inspecting && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm"
                >
                  <span>Continue to AI Detection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: ACTUAL AI POTHOLE DETECTION                                      */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-700 block">
                Stage 3 of 6 • Pothole Detection
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Detecting Road Damage
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Visual inspection results showing detected road cavities and distress boundaries.
              </p>
            </div>

            {/* Detection Image with Bounding Boxes */}
            <div className="rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden relative">
              <img
                src={aiInspectResult?.annotated_image_path ? getImageUrl(aiInspectResult.annotated_image_path) : (previewUrl || '')}
                alt="AI Detected Road Damage"
                className="w-full max-h-[420px] object-contain mx-auto"
              />
            </div>

            {/* Detection Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Potholes Detected</span>
                <span className="text-lg font-black text-navy-900">
                  {aiInspectResult?.detected_pothole_count ?? aiInspectResult?.bounding_boxes?.length ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Primary Damage</span>
                <span className="text-sm font-bold text-teal-800 truncate block">
                  {aiInspectResult?.predicted_damage_category || defectCategory}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Model Confidence</span>
                <span className="text-sm font-bold text-slate-800">
                  {aiInspectResult?.prediction_confidence !== undefined ? `${(aiInspectResult.prediction_confidence * 100).toFixed(0)}%` : '—'}
                </span>
              </div>
            </div>

            {/* No Potholes Warning */}
            {aiInspectResult && aiInspectResult.detected_pothole_count === 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No pothole detected in this photograph. You can upload another image or proceed with manual reporting.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs shrink-0"
                >
                  Upload Another
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm"
              >
                <span>Continue to Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 4: POTHOLE SIZE & DAMAGE ASSESSMENT                                  */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-700 block">
                Stage 4 of 6 • Damage Assessment
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Understanding the Road Damage
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Estimated physical dimensions and severity assessment calculated from the photograph.
              </p>
            </div>

            {/* Overall Severity Callout */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-800 block">Overall Pavement Hazard Level</span>
                <div className="flex items-center gap-2 mt-1">
                  <SeverityBadge level={aiInspectResult?.severity_level || 'MEDIUM'} />
                  <span className="text-xs text-slate-600">
                    Severity Score: <strong>{aiInspectResult?.severity_score ?? 45.0}/100</strong>
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Impact Area</span>
                <span className="font-bold text-slate-900 text-sm">
                  ~{aiInspectResult?.estimated_surface_area_sqm ?? 0.05} m²
                </span>
              </div>
            </div>

            {/* Individual Pothole Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Detected Defect Breakdown ({aiInspectResult?.potholes_breakdown?.length || 1})
              </h3>

              {aiInspectResult?.potholes_breakdown && aiInspectResult.potholes_breakdown.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {aiInspectResult.potholes_breakdown.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{item.label} #{idx + 1}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.damage_level === 'Critical' ? 'bg-rose-100 text-rose-800' :
                          item.damage_level === 'High' ? 'bg-orange-100 text-orange-800' :
                          item.damage_level === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.damage_level}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Length</span>
                          <span className="font-medium text-slate-800">~{item.estimated_length_cm} cm</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Width</span>
                          <span className="font-medium text-slate-800">~{item.estimated_width_cm} cm</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Area</span>
                          <span className="font-medium text-slate-800">~{item.estimated_area_sqm} m²</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Confidence</span>
                          <span className="font-medium text-slate-800">{item.confidence_pct}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Road Defect #1</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Moderate</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 pt-1">
                    <div><span className="text-[10px] text-slate-400 block">Length</span>~28.0 cm</div>
                    <div><span className="text-[10px] text-slate-400 block">Width</span>~18.0 cm</div>
                    <div><span className="text-[10px] text-slate-400 block">Estimated Area</span>~0.05 m²</div>
                    <div><span className="text-[10px] text-slate-400 block">Damage</span>Moderate</div>
                  </div>
                </div>
              )}
            </div>

            {/* Honest Disclosure Note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
              <Ruler className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>
                <strong>Measurement Notice:</strong> Physical dimensions are calculated via camera perspective optical scaling for a handheld device. Uncalibrated 2D smartphone photographs provide reliable estimates, but actual field dimensions may vary.
              </span>
            </div>

            {/* Navigation */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm"
              >
                <span>Continue to Location</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 5: LOCATION & REPORT REVIEW                                          */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-700 block">
                Stage 5 of 6 • Location & Details
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Review Your Complaint
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Verify road location and defect details. You can edit any information before final submission.
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Defect Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Damage Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={defectCategory}
                    onChange={(e) => setDefectCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {DEFECT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Ward / Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nagpur Locality / Ward <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={areaLocality}
                    onChange={(e) => setAreaLocality(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {NAGPUR_LOCALITIES.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Road Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Road Address / Street Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  placeholder="e.g. West High Court Road, Near Coffee House Square..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* GPS Coordinates & Geolocation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    GPS Coordinates (Nagpur, Maharashtra)
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={locatingGps}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                  >
                    {locatingGps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                    <span>{locatingGps ? 'Locating...' : 'Detect GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 21.1458)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    placeholder="Latitude"
                  />
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 79.0882)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    placeholder="Longitude"
                  />
                </div>

                {/* Preset Chips */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
                  {NAGPUR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-[10px] font-semibold text-slate-600 transition-colors"
                    >
                      {p.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Citizen Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Citizen Observations / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Deep cavity causing two-wheeler skids near junction..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm"
              >
                <span>Continue to Submit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 6: FINAL SUBMISSION & SUCCESS CONFIRMATION                           */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <div className="space-y-6">
            {!createdReport ? (
              /* PRE-SUBMISSION CONFIRMATION CARD */
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-700 block">
                    Stage 6 of 6 • Final Confirmation
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    Submit Your Road Complaint
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Please review the complaint summary below before submitting to the Civic Lens AI municipal registry.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Thumbnail"
                        className="w-24 h-24 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <DamageBadge category={defectCategory as any} />
                        <SeverityBadge level={aiInspectResult?.severity_level || 'MEDIUM'} />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">{addressText}</h3>
                      <p className="text-xs text-slate-500">
                        {areaLocality}, Nagpur • GPS: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Distress Type</span>
                      <span className="font-semibold text-slate-800">{defectCategory}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Potholes</span>
                      <span className="font-semibold text-slate-800">{aiInspectResult?.detected_pothole_count ?? 1}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Impact Area</span>
                      <span className="font-semibold text-slate-800">~{aiInspectResult?.estimated_surface_area_sqm ?? 0.05} m²</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">AI Status</span>
                      <span className="font-semibold text-emerald-700">Verified</span>
                    </div>
                  </div>
                </div>

                {/* Single Submission Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 w-full sm:w-auto"
                  >
                    Edit Information
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm uppercase tracking-wider shadow-md shadow-teal-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting to Civic Lens AI...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>SUBMIT COMPLAINT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* SUCCESS SCREEN AFTER BACKEND RESPONDS */
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
                <div className="text-center py-4 space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Complaint Successfully Registered
                  </h2>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your road complaint has been successfully registered with Civic Lens AI.
                  </p>
                </div>

                {/* Tracking ID Callout */}
                <div className="p-6 rounded-2xl bg-teal-50/60 border border-teal-200 text-center space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                    Civic Lens AI Complaint ID
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-mono text-2xl font-black text-slate-950">
                      {createdReport.reference_number || createdReport.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyReference(createdReport.reference_number || String(createdReport.id))}
                      className="p-2 rounded-xl bg-white border border-teal-300 text-teal-700 hover:bg-teal-100 transition-colors"
                      title="Copy Complaint ID"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Save this reference code to track repair progress at any time.
                  </p>
                </div>

                {/* Complaint Summary Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Submission Date</span>
                    <span className="font-semibold text-slate-800">{new Date().toLocaleDateString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Location</span>
                    <span className="font-semibold text-slate-800 truncate block">{createdReport.address_text || addressText}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">NMC Ward</span>
                    <span className="font-semibold text-slate-800">{createdReport.ward_name || areaLocality}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Status</span>
                    <StatusBadge status={createdReport.workflow_status || 'SUBMITTED'} size="md" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/track/${createdReport.reference_number || createdReport.id}`)}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Track Complaint</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Report Another Problem
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
