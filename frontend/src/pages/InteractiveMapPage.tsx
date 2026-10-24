import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Filter, 
  Layers, 
  ExternalLink, 
  AlertCircle, 
  X,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { MapMarkerItem } from '../types';
import { MapView } from '../components/MapView';
import { DamageBadge } from '../components/DamageBadge';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

export const InteractiveMapPage: React.FC = () => {
  const navigate = useNavigate();

  const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerItem | null>(null);

  useEffect(() => {
    fetchMarkers();
  }, [selectedCategory, selectedSeverity, selectedStatus]);

  const fetchMarkers = async () => {
    setLoading(true);
    try {
      const data = await api.getMapMarkers({
        category: selectedCategory || undefined,
        severity_level: selectedSeverity || undefined,
        workflow_status: selectedStatus || undefined,
      });
      setMarkers(data);
    } catch (err) {
      console.error('Failed to load map markers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (id: number) => {
    const found = markers.find((m) => m.id === id);
    if (found) {
      setSelectedMarker(found);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] relative bg-slate-100">
      
      {/* Top Filter Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-navy-900 leading-tight">Nagpur Road Damage Geographic Map</h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Displaying <strong className="text-slate-800 font-mono">{markers.length}</strong> geocoded municipal records
            </p>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Categories</option>
            <option value="Pothole">Pothole</option>
            <option value="Alligator cracking">Alligator Cracking</option>
            <option value="Transverse crack">Transverse Crack</option>
            <option value="Longitudinal crack">Longitudinal Crack</option>
            <option value="Surface deterioration">Surface Deterioration</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical (&gt;=75)</option>
            <option value="HIGH">High (50-74)</option>
            <option value="MEDIUM">Medium (25-49)</option>
            <option value="LOW">Low (&lt;25)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {(selectedCategory || selectedSeverity || selectedStatus) && (
            <button
              onClick={() => { setSelectedCategory(''); setSelectedSeverity(''); setSelectedStatus(''); }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Map Body */}
      <div className="flex-1 w-full h-full">
        <MapView
          markers={markers}
          center={[21.1458, 79.0882]}
          zoom={13}
          height="100%"
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-5 right-5 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 pointer-events-none">
        <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Severity Legend</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <span className="text-slate-600">Critical (&gt;=75)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          <span className="text-slate-600">High (50-74)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-slate-600">Medium (25-49)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-slate-600">Low (&lt;25)</span>
        </div>
      </div>

      {/* Case Preview Drawer / Slide-Over when Marker Clicked */}
      {selectedMarker && (
        <div className="absolute bottom-5 left-5 z-30 max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {selectedMarker.reference_number}
              </span>
              <h3 className="font-bold text-slate-900 text-sm mt-1 leading-snug">{selectedMarker.title}</h3>
            </div>
            <button
              onClick={() => setSelectedMarker(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-32 rounded-xl overflow-hidden mb-3 bg-slate-100">
            <img
              src={selectedMarker.image_path}
              alt={selectedMarker.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <DamageBadge category={selectedMarker.predicted_damage_category} size="sm" />
            <StatusBadge status={selectedMarker.workflow_status} size="sm" />
            <PriorityBadge score={selectedMarker.priority_score} />
          </div>

          <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{selectedMarker.address_text || 'Nagpur'}</span>
          </p>

          <button
            onClick={() => navigate(`/case/${selectedMarker.id}`)}
            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Inspect Full Case & Workflow</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
