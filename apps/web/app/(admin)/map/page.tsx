'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getSupabaseClient } from '@serviceflow/api';

// Leaflet touches `window`, so it must never be part of the server render.
const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

interface TechnicianMarker {
  technician_id: string;
  latitude: number;
  longitude: number;
  name: string;
  status: string;
}

const STATUS_FILTERS = ['available', 'busy', 'offline', 'on_the_way', 'completed'] as const;
const STATUS_COLOR: Record<string, string> = {
  available: '#10b981',
  busy: '#f59e0b',
  offline: '#6b7280',
  on_the_way: '#3b82f6',
  completed: '#bef264',
};

export default function LiveOperationsMapPage() {
  const [markers, setMarkers] = useState<TechnicianMarker[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function loadAndSubscribe() {
      const supabase = getSupabaseClient();

      const { data } = await supabase
        .from('technician_current_location')
        .select('technician_id, latitude, longitude, technicians(rating, is_available, users(full_name))');

      setMarkers(
        (data ?? []).map((row: any) => ({
          technician_id: row.technician_id,
          latitude: row.latitude,
          longitude: row.longitude,
          name: row.technicians?.users?.full_name ?? 'Technician',
          status: row.technicians?.is_available ? 'available' : 'busy',
        }))
      );

      const channel = supabase
        .channel('technician_locations_live')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'technician_locations' },
          (payload: any) => {
            setMarkers((prev) => {
              const exists = prev.some((m) => m.technician_id === payload.new.technician_id);
              if (exists) {
                return prev.map((m) =>
                  m.technician_id === payload.new.technician_id
                    ? { ...m, latitude: payload.new.latitude, longitude: payload.new.longitude }
                    : m
                );
              }
              return [
                ...prev,
                {
                  technician_id: payload.new.technician_id,
                  latitude: payload.new.latitude,
                  longitude: payload.new.longitude,
                  name: 'Technician',
                  status: 'available',
                },
              ];
            });
          }
        )
        .subscribe();

      cleanup = () => supabase.removeChannel(channel);
    }

    loadAndSubscribe();
    return () => cleanup?.();
  }, []);

  const filtered = activeFilter ? markers.filter((m) => m.status === activeFilter) : markers;
  const avgLat = filtered.length ? filtered.reduce((s, m) => s + m.latitude, 0) / filtered.length : undefined;
  const avgLng = filtered.length ? filtered.reduce((s, m) => s + m.longitude, 0) / filtered.length : undefined;

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-3">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold dark:text-offwhite mr-4">Live Operations Map</h1>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(activeFilter === f ? null : f)}
            className={`rounded-full px-3 py-1 text-xs capitalize ${
              activeFilter === f ? 'bg-emerald-600 text-white' : 'glass dark:text-offwhite'
            }`}
          >
            {f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="relative flex-1 overflow-hidden rounded-xl">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-graphite/10 text-sm text-graphite/50 dark:text-offwhite/50">
            No technicians online right now
          </div>
        ) : (
          <LiveMap
            markers={filtered.map((m) => ({
              id: m.technician_id,
              latitude: m.latitude,
              longitude: m.longitude,
              label: `${m.name} · ${m.status.replace(/_/g, ' ')}`,
              color: STATUS_COLOR[m.status],
            }))}
            center={avgLat && avgLng ? [avgLat, avgLng] : undefined}
            className="h-full w-full"
          />
        )}
      </div>
      <p className="text-xs text-graphite/50 dark:text-offwhite/50">
        Map tiles from OpenStreetMap — free, no API key required.
      </p>
    </div>
  );
}
