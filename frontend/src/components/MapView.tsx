import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, RefreshCw, WifiOff, MapPin, Navigation } from 'lucide-react';
import { MapMarkerItem, SpatialCluster, NagpurWard } from '../types';

interface Props {
  markers?: MapMarkerItem[];
  clusters?: SpatialCluster[];
  wards?: NagpurWard[];
  showWards?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  onMarkerClick?: (id: number) => void;
  onClusterClick?: (clusterId: number) => void;
  interactive?: boolean;
  activeLayer?: 'all' | 'markers' | 'clusters';
  fitBoundsOnData?: boolean;
}

// Multi-tier resilient tile providers (Public & Authorized Academic Providers — No Watermarks, No API Key Required)
interface TileProvider {
  name: string;
  url: string;
  subdomains?: string;
  maxZoom: number;
  attribution: string;
}

const TILE_PROVIDERS: TileProvider[] = [
  {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  },
  {
    name: 'Esri World Street Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    subdomains: '',
    maxZoom: 19,
    attribution: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, METI, TomTom',
  },
  {
    name: 'Esri Light Gray Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    subdomains: '',
    maxZoom: 16,
    attribution: 'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
  },
];

export const MapView: React.FC<Props> = ({
  markers = [],
  clusters = [],
  wards = [],
  showWards = false,
  center = [21.1458, 79.0882],
  zoom = 13,
  height = '500px',
  selectedLocation = null,
  onLocationSelect,
  onMarkerClick,
  onClusterClick,
  interactive = true,
  activeLayer = 'all',
  fitBoundsOnData = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clustersLayerRef = useRef<L.LayerGroup | null>(null);
  const wardsLayerRef = useRef<L.LayerGroup | null>(null);
  const selectionMarkerRef = useRef<L.Marker | null>(null);

  const [activeProviderIndex, setActiveProviderIndex] = useState(0);
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const [hasFitInitialBounds, setHasFitInitialBounds] = useState(false);
  const tileErrorCounterRef = useRef(0);

  // Helper to safely invalidate map size
  const triggerResize = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  }, []);

  // Attach a tile layer given a provider index
  const attachTileLayer = useCallback((map: L.Map, providerIndex: number) => {
    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
      currentTileLayerRef.current = null;
    }

    const provider = TILE_PROVIDERS[providerIndex];
    if (!provider) {
      setTilesUnavailable(true);
      return;
    }

    tileErrorCounterRef.current = 0;

    const layer = L.tileLayer(provider.url, {
      subdomains: provider.subdomains || 'abc',
      maxZoom: provider.maxZoom,
      attribution: provider.attribution,
    });

    layer.on('tileerror', () => {
      tileErrorCounterRef.current += 1;
      // If 5 or more tiles fail, automatically switch to fallback provider
      if (tileErrorCounterRef.current >= 5) {
        if (providerIndex + 1 < TILE_PROVIDERS.length) {
          console.warn(`[Civic Lens AI Map] Tile errors detected on ${provider.name}. Failing over to ${TILE_PROVIDERS[providerIndex + 1].name}...`);
          setActiveProviderIndex(providerIndex + 1);
        } else {
          console.warn('[Civic Lens AI Map] All tile providers failed. Entering offline tile mode.');
          setTilesUnavailable(true);
        }
      }
    });

    layer.on('tileload', () => {
      setTilesUnavailable(false);
    });

    layer.addTo(map);
    currentTileLayerRef.current = layer;
  }, []);

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (!mapInstanceRef.current) {
      // Create map with explicit options
      const map = L.map(container, {
        center,
        zoom,
        zoomControl: false, // Positioned on topright
        scrollWheelZoom: interactive,
        attributionControl: true,
      });

      // Controls placement
      L.control.zoom({ position: 'topright' }).addTo(map);
      L.control.scale({ position: 'bottomleft', imperial: false, metric: true }).addTo(map);

      // Layer groups for markers, clusters & wards
      wardsLayerRef.current = L.layerGroup().addTo(map);
      clustersLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      // Attach tile layer
      attachTileLayer(map, activeProviderIndex);

      if (onLocationSelect) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
    }

    // ResizeObserver to automatically recover from flex layout shifts
    const resizeObserver = new ResizeObserver(() => {
      triggerResize();
    });
    resizeObserver.observe(container);

    // Staggered invalidations to handle font-loading and CSS rendering
    const t1 = setTimeout(triggerResize, 60);
    const t2 = setTimeout(triggerResize, 250);
    const t3 = setTimeout(triggerResize, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        clustersLayerRef.current = null;
        wardsLayerRef.current = null;
        currentTileLayerRef.current = null;
      }
    };
  }, []);

  // Switch tile provider when activeProviderIndex changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      attachTileLayer(mapInstanceRef.current, activeProviderIndex);
    }
  }, [activeProviderIndex, attachTileLayer]);

  // Update center when explicitly changed
  useEffect(() => {
    if (mapInstanceRef.current && center && !hasFitInitialBounds) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom, hasFitInitialBounds]);

  // Update Ward Boundaries Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !wardsLayerRef.current) return;
    wardsLayerRef.current.clearLayers();

    if (!showWards || !wards || wards.length === 0) return;

    wards.forEach((w) => {
      if (!w.boundary_coordinates_json) return;
      try {
        const geojson = JSON.parse(w.boundary_coordinates_json);
        const geoLayer = L.geoJSON(geojson, {
          style: {
            color: '#0D9488',
            weight: 2,
            dashArray: '4, 4',
            fillColor: '#14B8A6',
            fillOpacity: 0.12,
          },
          onEachFeature: (_, layer) => {
            const wardPopup = `
              <div style="font-family: inherit; font-size: 12px; padding: 2px;">
                <div style="font-weight: 800; color: #0F172A; font-size: 13px;">Zone ${w.zone_number}: ${w.ward_name}</div>
                <div style="font-size: 11px; color: #0D9488; font-weight: 700; margin-top: 2px;">Active Defects: ${w.active_defects_count}</div>
                <div style="font-size: 10px; color: #64748B; margin-top: 2px;">Zonal Officer: ${w.zonal_officer_name || 'NMC Zonal Office'}</div>
                <div style="font-size: 10px; color: #64748B;">Contact: ${w.contact_phone || '0712-2567000'}</div>
              </div>
            `;
            layer.bindPopup(wardPopup);
            layer.bindTooltip(`<strong>${w.ward_name} (Zone ${w.zone_number})</strong>`, {
              sticky: true,
            });
          },
        });
        wardsLayerRef.current?.addLayer(geoLayer);
      } catch (e) {
        // ignore polygon parse error
      }
    });
  }, [wards, showWards]);

  // Update Cluster Circles (Hotspot Density Zones)
  useEffect(() => {
    if (!mapInstanceRef.current || !clustersLayerRef.current) return;

    clustersLayerRef.current.clearLayers();

    if (activeLayer === 'markers') return;

    clusters.forEach((cl) => {
      if (typeof cl.centroid_latitude !== 'number' || typeof cl.centroid_longitude !== 'number' || isNaN(cl.centroid_latitude) || isNaN(cl.centroid_longitude)) {
        return;
      }

      const colorHex = cl.hazard_level === 'CRITICAL' ? '#EF4444' : cl.hazard_level === 'HIGH' ? '#F97316' : '#F59E0B';

      const circle = L.circle([cl.centroid_latitude, cl.centroid_longitude], {
        color: colorHex,
        fillColor: colorHex,
        fillOpacity: 0.22,
        radius: cl.radius_meters || 100,
        weight: 2.5,
        dashArray: '5, 6',
      });

      const clusterPopup = `
        <div style="font-family: inherit; font-size: 12px; max-width: 240px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${colorHex}; letter-spacing: 0.5px;">Spatial Cluster #${cl.cluster_id}</span>
            <span style="background: ${colorHex}20; color: ${colorHex}; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">${cl.hazard_level}</span>
          </div>
          <div style="font-weight: 800; color: #0F172A; font-size: 13px; margin-bottom: 4px;">${cl.area_name}</div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            Density: <strong>${cl.report_count} defects</strong> within ${Math.round(cl.radius_meters || 100)}m
          </div>
          <div style="display: flex; gap: 4px; font-size: 10px; margin-bottom: 8px; flex-wrap: wrap;">
            <span style="background: #F1F5F9; color: #334155; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Dominant: ${cl.dominant_category}</span>
            <span style="background: #F1F5F9; color: #334155; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Avg Sev: ${Math.round(cl.average_severity)}</span>
          </div>
          ${onClusterClick ? `<button id="btn-cluster-${cl.cluster_id}" style="width: 100%; background: #0F172A; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">View Hotspot Details &rarr;</button>` : ''}
        </div>
      `;

      circle.bindPopup(clusterPopup);

      circle.on('popupopen', () => {
        if (onClusterClick) {
          const btn = document.getElementById(`btn-cluster-${cl.cluster_id}`);
          if (btn) {
            btn.onclick = () => onClusterClick(cl.cluster_id);
          }
        }
      });

      circle.on('click', () => {
        if (onClusterClick) onClusterClick(cl.cluster_id);
      });

      clustersLayerRef.current?.addLayer(circle);
    });
  }, [clusters, activeLayer, onClusterClick]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (activeLayer === 'clusters') return;

    const validMarkers = markers.filter(
      (m) => typeof m.latitude === 'number' && typeof m.longitude === 'number' && !isNaN(m.latitude) && !isNaN(m.longitude) && m.latitude !== 0 && m.longitude !== 0
    );

    validMarkers.forEach((m) => {
      let colorHex = '#10B981'; // LOW
      if (m.severity_level === 'CRITICAL' || m.severity_score >= 75) {
        colorHex = '#EF4444';
      } else if (m.severity_level === 'HIGH' || m.severity_score >= 50) {
        colorHex = '#F97316';
      } else if (m.severity_level === 'MEDIUM' || m.severity_score >= 25) {
        colorHex = '#F59E0B';
      }

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: ${colorHex}; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s ease;">
            <div style="width: 7px; height: 7px; border-radius: 50%; background: white;"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([m.latitude, m.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; max-width: 220px; padding: 2px;">
          <div style="font-weight: 800; color: #0F172A; margin-bottom: 2px; line-height: 1.3;">${m.title}</div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 6px; font-family: monospace;">Ref: ${m.reference_number}</div>
          <div style="display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap;">
            <span style="background: #F1F5F9; color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">${m.predicted_damage_category}</span>
            <span style="background: ${colorHex}22; color: ${colorHex}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800;">Sev: ${m.severity_score.toFixed(0)}</span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">${m.address_text || 'Nagpur Corridor'}</div>
          ${onMarkerClick ? `<button id="btn-inspect-${m.id}" style="width: 100%; background: #0D9488; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s; margin-bottom: 4px;">Inspect Defect Case &rarr;</button>` : ''}
          <div style="text-align: center; margin-top: 4px;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}" target="_blank" rel="noopener noreferrer" style="color: #0F766E; font-size: 11px; font-weight: 700; text-decoration: underline;">
              Get Directions via Google Maps &nearr;
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        if (onMarkerClick) {
          const btn = document.getElementById(`btn-inspect-${m.id}`);
          if (btn) {
            btn.onclick = () => onMarkerClick(m.id);
          }
        }
      });

      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(m.id);
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // Automatically fit bounds to available defect data on first load
    if (fitBoundsOnData && !hasFitInitialBounds && validMarkers.length > 0 && mapInstanceRef.current) {
      try {
        const coords: [number, number][] = validMarkers.map((m) => [m.latitude, m.longitude]);
        clusters.forEach((cl) => {
          if (typeof cl.centroid_latitude === 'number' && typeof cl.centroid_longitude === 'number' && !isNaN(cl.centroid_latitude)) {
            coords.push([cl.centroid_latitude, cl.centroid_longitude]);
          }
        });
        const bounds = L.latLngBounds(coords);
        mapInstanceRef.current.fitBounds(bounds.pad(0.12), { maxZoom: 15, animate: false });
        setHasFitInitialBounds(true);
      } catch (err) {
        console.warn('[Civic Lens AI Map] fitBounds notice:', err);
      }
    }
  }, [markers, clusters, activeLayer, onMarkerClick, fitBoundsOnData, hasFitInitialBounds]);

  // Selected Location Picker (for new report or case inspect)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
      selectionMarkerRef.current = null;
    }

    if (selectedLocation && typeof selectedLocation.lat === 'number' && typeof selectedLocation.lng === 'number') {
      const pinIcon = L.divIcon({
        className: 'selection-pin',
        html: `
          <div style="background-color: #0D9488; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.5); display: flex; align-items: center; justify-content: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      selectionMarkerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: pinIcon,
      }).addTo(mapInstanceRef.current);
    }
  }, [selectedLocation]);

  const handleRetryTiles = () => {
    setTilesUnavailable(false);
    tileErrorCounterRef.current = 0;
    setActiveProviderIndex(0);
    if (mapInstanceRef.current) {
      attachTileLayer(mapInstanceRef.current, 0);
      triggerResize();
    }
  };

  const hasNoMarkers = markers.length === 0 && clusters.length === 0;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 min-h-[300px]"
      style={{ height, minHeight: height === '100%' ? '500px' : height }}
    >
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: height === '100%' ? '500px' : height }}
      />

      {/* Coordinate Picker Guide Banner */}
      {onLocationSelect && (
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          <span>Click on map to position damage coordinate</span>
        </div>
      )}

      {/* Offline Tiles Notification Banner */}
      {tilesUnavailable && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] max-w-md w-11/12 bg-amber-50/95 backdrop-blur-md border border-amber-300 p-3 rounded-xl shadow-md text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Map tiles temporarily unavailable. Geocoded defect pins remain fully interactive.</span>
          </div>
          <button
            onClick={handleRetryTiles}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State Banner when filtered out */}
      {hasNoMarkers && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none p-4">
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-lg text-center max-w-sm pointer-events-auto space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
              <MapPin className="w-5 h-5 text-slate-400" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Defect Markers Found</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              No road defects currently match the active filter criteria. Adjust your filters to view Nagpur road distress records.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
