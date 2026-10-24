import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapMarkerItem } from '../types';

interface Props {
  markers?: MapMarkerItem[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  onMarkerClick?: (id: number) => void;
  interactive?: boolean;
}

export const MapView: React.FC<Props> = ({
  markers = [],
  center = [21.1458, 79.0882], // Default Nagpur center
  zoom = 12,
  height = '500px',
  selectedLocation = null,
  onLocationSelect,
  onMarkerClick,
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
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

      // Standard OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Layer group for report markers
      markersLayerRef.current = L.layerGroup().addTo(map);

      // Location click handler for picker
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

  // Update center when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((m) => {
      // Pick marker color based on severity
      let colorHex = '#10B981'; // LOW
      if (m.severity_level === 'CRITICAL' || m.severity_score >= 75) {
        colorHex = '#EF4444';
      } else if (m.severity_level === 'HIGH' || m.severity_score >= 50) {
        colorHex = '#F97316';
      } else if (m.severity_level === 'MEDIUM' || m.severity_score >= 25) {
        colorHex = '#F59E0B';
      }

      // Custom SVG Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: ${colorHex}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s ease;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([m.latitude, m.longitude], { icon: customIcon });

      // Popup Content
      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; max-width: 220px;">
          <div style="font-weight: 700; color: #0F172A; margin-bottom: 2px;">${m.title}</div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">Ref: ${m.reference_number}</div>
          <div style="display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap;">
            <span style="background: #F1F5F9; color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">${m.predicted_damage_category}</span>
            <span style="background: ${colorHex}22; color: ${colorHex}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">Sev: ${m.severity_score.toFixed(0)}</span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">${m.address_text || 'Nagpur Area'}</div>
          ${onMarkerClick ? `<button id="btn-inspect-${m.id}" style="width: 100%; background: #0D9488; color: white; border: none; padding: 5px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">Inspect Case &rarr;</button>` : ''}
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
  }, [markers, onMarkerClick]);

  // Update Selected Location (Coordinate Picker Marker)
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
          <div style="background-color: #0D9488; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(13, 148, 136, 0.4); display: flex; align-items: center; justify-content: center; animation: bounce 1s infinite alternate;">
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
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {onLocationSelect && (
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 shadow-sm pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          Click anywhere on map to position damage coordinate
        </div>
      )}
    </div>
  );
};
