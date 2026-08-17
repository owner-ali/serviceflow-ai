'use client';

import { useEffect, useRef } from 'react';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  color?: string;
}

interface LiveMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

/**
 * Free, key-free live map using Leaflet + OpenStreetMap tiles (no Google Maps
 * or Mapbox API key required — OSM tiles are free for reasonable-volume use
 * under their tile usage policy). Loaded dynamically since Leaflet needs a
 * real DOM/window and can't run during Next.js server rendering.
 *
 * Markers re-render (with smooth position updates) whenever the `markers`
 * prop changes — the admin map page feeds this from a Supabase Realtime
 * subscription on `technician_locations`, so pins move live with zero paid
 * map provider.
 */
export default function LiveMap({ markers, center = [30.2672, -97.7431], zoom = 12, className }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<Map<string, any>>(new Map());
  const leafletRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = await import('leaflet');
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapRef.current = map;
      renderMarkers();
    }

    init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderMarkers() {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const seen = new Set<string>();
    markers.forEach((m) => {
      seen.add(m.id);
      const existing = markerLayerRef.current.get(m.id);
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${m.color ?? '#10b981'};box-shadow:0 0 0 4px ${m.color ?? '#10b981'}33;border:2px solid white;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      if (existing) {
        // Smoothly move the marker rather than snapping — small CSS transition
        // on the divIcon's transform gives a live-tracking feel.
        existing.setLatLng([m.latitude, m.longitude]);
        existing.setIcon(icon);
        existing.setTooltipContent(m.label);
      } else {
        const marker = L.marker([m.latitude, m.longitude], { icon }).addTo(map).bindTooltip(m.label, { permanent: false });
        markerLayerRef.current.set(m.id, marker);
      }
    });

    // remove markers no longer present
    markerLayerRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove();
        markerLayerRef.current.delete(id);
      }
    });
  }

  useEffect(() => {
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  return <div ref={containerRef} className={className ?? 'h-full w-full rounded-xl'} />;
}
