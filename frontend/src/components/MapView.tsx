import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapMarkerItem, SpatialCluster } from '../types';

interface Props {
  markers?: MapMarkerItem[];
  clusters?: SpatialCluster[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  onMarkerClick?: (id: number) => void;
  onClusterClick?: (clusterId: number) => void;
  interactive?: boolean;
  activeLayer?: 'all' | 'markers' | 'clusters';
}

export const MapView: React.FC<Props> = ({
  markers = [],
  clusters = [],
  center = [21.1458, 79.0882],
  zoom = 13,
  height = '500px',
  selectedLocation = null,
  onLocationSelect,
  onMarkerClick,
  onClusterClick,
  interactive = true,
  activeLayer = 'all',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clustersLayerRef = useRef<L.LayerGroup | null>(null);
  const selectionMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: interactive,
      });

      // CartoDB Positron / OSM clean tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      clustersLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      if (onLocationSelect) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when changed
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Update Cluster Circles (Hotspot Density Zones)
  useEffect(() => {
    if (!mapInstanceRef.current || !clustersLayerRef.current) return;

    clustersLayerRef.current.clearLayers();

    if (activeLayer === 'markers') return;

    clusters.forEach((cl) => {
      const colorHex = cl.hazard_level === 'CRITICAL' ? '#EF4444' : cl.hazard_level === 'HIGH' ? '#F97316' : '#F59E0B';

      const circle = L.circle([cl.centroid_latitude, cl.centroid_longitude], {
        color: colorHex,
        fillColor: colorHex,
        fillOpacity: 0.18,
        radius: cl.radius_meters,
        weight: 2,
        dashArray: '4, 6',
      });

      const clusterPopup = `
        <div style="font-family: inherit; font-size: 12px; max-width: 240px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${colorHex}; letter-spacing: 0.5px;">Spatial Cluster #${cl.cluster_id}</span>
            <span style="background: ${colorHex}20; color: ${colorHex}; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">${cl.hazard_level}</span>
          </div>
          <div style="font-weight: 800; color: #0F172A; font-size: 13px; margin-bottom: 4px;">${cl.area_name}</div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            Density: <strong>${cl.report_count} defects</strong> within ${cl.radius_meters}m
          </div>
          <div style="display: flex; gap: 4px; font-size: 10px; margin-bottom: 8px;">
            <span style="background: #F1F5F9; color: #334155; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Dominant: ${cl.dominant_category}</span>
            <span style="background: #F1F5F9; color: #334155; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Avg Sev: ${cl.average_severity}</span>
          </div>
        </div>
      `;

      circle.bindPopup(clusterPopup);
      clustersLayerRef.current?.addLayer(circle);
    });
  }, [clusters, activeLayer]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (activeLayer === 'clusters') return;

    markers.forEach((m) => {
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
          <div style="background-color: ${colorHex}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s ease;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([m.latitude, m.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; max-width: 220px;">
          <div style="font-weight: 700; color: #0F172A; margin-bottom: 2px;">${m.title}</div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">Ref: ${m.reference_number}</div>
          <div style="display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap;">
            <span style="background: #F1F5F9; color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">${m.predicted_damage_category}</span>
            <span style="background: ${colorHex}22; color: ${colorHex}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">Sev: ${m.severity_score.toFixed(0)}</span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">${m.address_text || 'Nagpur Area'}</div>
          ${onMarkerClick ? `<button id="btn-inspect-${m.id}" style="width: 100%; background: #0D9488; color: white; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s;">Inspect Case &rarr;</button>` : ''}
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

      markersLayerRef.current?.addLayer(marker);
    });
  }, [markers, activeLayer, onMarkerClick]);

  // Selected Location Picker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
      selectionMarkerRef.current = null;
    }

    if (selectedLocation) {
      const pinIcon = L.divIcon({
        className: 'selection-pin',
        html: `
          <div style="background-color: #0D9488; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.45); display: flex; align-items: center; justify-content: center;">
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

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {onLocationSelect && (
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          Click on map to position damage coordinate
        </div>
      )}
    </div>
  );
};
