import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  Upload, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  Navigation,
  FileText,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { MapView } from '../components/MapView';

interface NagpurPreset {
  name: string;
  lat: number;
  lng: number;
  address: string;
  roadClass: string;
}

const NAGPUR_PRESETS: NagpurPreset[] = [
  { name: 'Sitabuldi Interchange', lat: 21.1458, lng: 79.0882, address: 'Sitabuldi Metro Station, Wardha Road Junction, Nagpur', roadClass: 'ARTERIAL' },
  { name: 'Dharampeth Shopping Hub', lat: 21.1420, lng: 79.0620, address: 'West High Court Road, Dharampeth, Nagpur', roadClass: 'COLLECTOR' },
  { name: 'Sadar Commercial Zone', lat: 21.1610, lng: 79.0820, address: 'Mount Road, Sadar, Nagpur', roadClass: 'COLLECTOR' },
  { name: 'Wardha Road Bus Corridor', lat: 21.1180, lng: 79.0740, address: 'Wardha Road, Near Rahate Colony Square, Nagpur', roadClass: 'HIGHWAY' },
  { name: 'Medical Square Trauma Area', lat: 21.1280, lng: 79.0960, address: 'Medical Square, Near GMC Casualty Gate, Nagpur', roadClass: 'ARTERIAL' },
  { name: 'Gayatri Nagar IT Park', lat: 21.1230, lng: 79.0510, address: 'Gayatri Nagar IT Park Link Road, Nagpur', roadClass: 'LOCAL' },
];

export const NewReportPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number>(21.1458);
  const [longitude, setLongitude] = useState<number>(79.0882);
  const [addressText, setAddressText] = useState('Sitabuldi Interchange, Nagpur');
  const [roadClass, setRoadClass] = useState('ARTERIAL');
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validation
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
    setRoadClass(preset.roadClass);
    if (!title) {
      setTitle(`Pavement Defect at ${preset.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please attach an image of the road damage.');
      return;
    }
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('address_text', addressText.trim());
      formData.append('road_classification', roadClass);
      formData.append('auto_analyze', String(autoAnalyze));
      formData.append('image', selectedFile);

      const created = await api.createReport(formData);

      // Redirect to AI Analysis results page
      navigate(`/analysis/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Citizen Submission</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Report Road Damage</h1>
          <p className="text-xs text-slate-500 mt-1">
            Capture or upload roadway photo. AI engine will estimate distress category and compute an explainable severity index.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Image Upload */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-teal-600" />
              1. Photographic Evidence
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Box */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-teal-500 transition-colors bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <label className="cursor-pointer">
                  <span className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
                    Browse Image File
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-2">JPEG, PNG, WebP up to 10MB</p>
              </div>

              {/* Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center min-h-[160px]">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <p className="text-xs text-slate-400 font-medium">No image selected</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Upload a photo showing clear pavement damage</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Defect Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              2. Defect Description
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Report Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep Pothole outside Sitabuldi Metro Station"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Observations (Optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe traffic risk, depth, lane obstruction, or water accumulation..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Roadway Classification</label>
                <select
                  value={roadClass}
                  onChange={(e) => setRoadClass(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="LOCAL">Local / Residential Street (Low Speed)</option>
                  <option value="COLLECTOR">Collector Road (Connecting Neighborhoods)</option>
                  <option value="ARTERIAL">Arterial Road (Major Commercial Corridor)</option>
                  <option value="HIGHWAY">Expressway / Highway (High Speed Multi-Lane)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address or Landmark</label>
                <input
                  type="text"
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  placeholder="Street name or nearby landmark..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Geospatial Coordinates & Map Picker */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                3. Precise Geolocation (Click on Map)
              </h2>
              <span className="font-mono text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
              </span>
            </div>

            {/* Quick Nagpur Landmark Presets for Evaluator */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-2">Evaluator Quick Presets (Nagpur Landmarks):</p>
              <div className="flex flex-wrap gap-1.5">
                {NAGPUR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-slate-700 hover:text-teal-800 transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Leaflet Map for coordinate selection */}
            <div className="h-[280px]">
              <MapView
                center={[latitude, longitude]}
                zoom={14}
                height="100%"
                selectedLocation={{ lat: latitude, lng: longitude }}
                onLocationSelect={handleMapLocationSelect}
              />
            </div>
          </div>

          {/* Section 4: AI Execution Toggle & Submit */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={(e) => setAutoAnalyze(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Auto-Execute AI Analysis Pipeline
                </span>
                <p className="text-[11px] text-slate-500">
                  Runs edge feature detection, computes severity score, and checks for duplicate reports immediately.
                </p>
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing & Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Damage Report</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
