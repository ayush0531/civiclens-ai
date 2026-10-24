import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Layers, 
  ExternalLink, 
  X,
  Flame,
  Radio,
  Sliders,
  CheckCircle2,
  Info
} from 'lucide-react';
import { api, getImageUrl } from '../services/api';
import { MapMarkerItem, SpatialCluster } from '../types';
import { MapView } from '../components/MapView';
import { DamageBadge, SeverityBadge } from '../components/DamageBadge';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

export const InteractiveMapPage: React.FC = () => {
  const navigate = useNavigate();

  const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
  const [clusters, setClusters] = useState<SpatialCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<'all' | 'markers' | 'clusters'>('all');
  const [clusterRadius, setClusterRadius] = useState<number>(450.0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerItem | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<SpatialCluster | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedSeverity, selectedStatus, clusterRadius]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [markerData, clusterData] = await Promise.all([
        api.getMapMarkers({
          category: selectedCategory || undefined,
          severity_level: selectedSeverity || undefined,
          workflow_status: selectedStatus || undefined,
        }),
        api.getSpatialClusters(clusterRadius, 2),
      ]);
      setMarkers(markerData);
      setClusters(clusterData);
    } catch (err) {
      console.error('Failed to load map data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (id: number) => {
    setSelectedCluster(null);
    const found = markers.find((m) => m.id === id);
    if (found) {
      setSelectedMarker(found);
    }
  };

  const handleClusterClick = (clusterId: number) => {
    setSelectedMarker(null);
    const found = clusters.find((c) => c.cluster_id === clusterId);
    if (found) {
      setSelectedCluster(found);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] relative bg-slate-100">
      
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-navy-900 leading-tight">Nagpur Pavement Geospatial Intelligence</h1>
              <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded">
                DBSCAN Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              <strong className="text-slate-800 font-mono">{markers.length}</strong> geocoded defect pins •{' '}
              <strong className="text-teal-700 font-mono">{clusters.length}</strong> spatial clusters discovered
            </p>
          </div>
        </div>

        {/* Layer Toggles & Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Layer Mode Pills */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveLayer('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeLayer === 'all' ? 'bg-white text-navy-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Layers
            </button>
            <button
              onClick={() => setActiveLayer('markers')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                activeLayer === 'markers' ? 'bg-white text-navy-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pins Only
            </button>
            <button
              onClick={() => setActiveLayer('clusters')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                activeLayer === 'clusters' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3 h-3 text-orange-500" />
              <span>Clusters Only</span>
            </button>
          </div>

          {/* DBSCAN Radius Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={clusterRadius}
              onChange={(e) => setClusterRadius(parseFloat(e.target.value))}
              className="bg-transparent text-slate-700 font-medium outline-none text-xs"
              title="DBSCAN Epsilon Radius in meters"
            >
              <option value="300">Radius: 300m</option>
              <option value="450">Radius: 450m (Std)</option>
              <option value="600">Radius: 600m</option>
              <option value="800">Radius: 800m</option>
            </select>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Distress Types</option>
            <option value="Pothole">Pothole</option>
            <option value="Alligator cracking">Alligator Cracking</option>
            <option value="Transverse crack">Transverse Crack</option>
            <option value="Longitudinal crack">Longitudinal Crack</option>
            <option value="Surface deterioration">Surface Deterioration</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical (&ge;75)</option>
            <option value="HIGH">High (50-74)</option>
            <option value="MEDIUM">Medium (25-49)</option>
            <option value="LOW">Low (&lt;25)</option>
          </select>

          {(selectedCategory || selectedSeverity || selectedStatus) && (
            <button
              onClick={() => { setSelectedCategory(''); setSelectedSeverity(''); setSelectedStatus(''); }}
              className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 w-full h-full">
        <MapView
          markers={markers}
          clusters={clusters}
          center={[21.1458, 79.0882]}
          zoom={13}
          height="100%"
          activeLayer={activeLayer}
          onMarkerClick={handleMarkerClick}
          onClusterClick={handleClusterClick}
        />
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-5 right-5 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-sm text-xs space-y-2 pointer-events-none">
        <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">Map Legend</span>
        
        <div className="space-y-1 text-slate-600 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
            <span>Critical Severity (&ge;75)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
            <span>High Severity (50-74)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
            <span>Medium Severity (25-49)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Low Severity (&lt;25)</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-[10px] text-teal-800 flex items-center gap-1.5 font-semibold">
          <span className="w-3 h-3 rounded-full border-2 border-teal-500 bg-teal-500/20 shrink-0"></span>
          <span>DBSCAN Density Cluster Ring</span>
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
              src={getImageUrl(selectedMarker.image_path)}
              alt={selectedMarker.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <DamageBadge category={selectedMarker.predicted_damage_category} size="sm" />
            <SeverityBadge level={selectedMarker.severity_level} size="sm" />
            <PriorityBadge score={selectedMarker.priority_score} />
          </div>

          <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{selectedMarker.address_text || `${selectedMarker.latitude.toFixed(4)}, ${selectedMarker.longitude.toFixed(4)}`}</span>
          </p>

          <button
            onClick={() => navigate(`/case/${selectedMarker.id}`)}
            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Inspect Full Case & Workflow</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Spatial Cluster Drawer when Cluster Clicked */}
      {selectedCluster && (
        <div className="absolute bottom-5 left-5 z-30 max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 animate-in slide-in-from-bottom-3 duration-200 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  Spatial DBSCAN Hotspot #{selectedCluster.cluster_id}
                </span>
              </div>
              <h3 className="font-extrabold text-navy-900 text-base mt-1">{selectedCluster.area_name}</h3>
            </div>
            <button
              onClick={() => setSelectedCluster(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Defect Density</span>
              <span className="text-base font-black text-navy-900 font-mono mt-0.5 block">{selectedCluster.report_count}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Severity</span>
              <span className="text-base font-black text-rose-700 font-mono mt-0.5 block">{selectedCluster.average_severity.toFixed(0)}/100</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Radius</span>
              <span className="text-base font-black text-slate-800 font-mono mt-0.5 block">{selectedCluster.radius_meters.toFixed(0)}m</span>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Dominant Pavement Distress:</span>
              <span className="font-bold text-slate-800">{selectedCluster.dominant_category}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Hazard Rating:</span>
              <span className="font-bold text-rose-700">{selectedCluster.hazard_level}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Corridor Centroid:</span>
              <span className="font-mono text-slate-700">{selectedCluster.centroid_latitude.toFixed(4)}, {selectedCluster.centroid_longitude.toFixed(4)}</span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Associated Incident Cases ({selectedCluster.reference_numbers.length})
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {selectedCluster.reference_numbers.map((ref, idx) => (
                <button
                  key={ref}
                  onClick={() => navigate(`/case/${selectedCluster.report_ids[idx]}`)}
                  className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-mono text-[11px] font-bold rounded border border-teal-200 transition-colors"
                >
                  {ref} &rarr;
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
