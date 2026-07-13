import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Navigation } from 'lucide-react';

interface MapPickerProps {
  value: string; // "latitude, longitude"
  onChange: (value: string) => void;
}

export function MapPicker({ value, onChange }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: -8.0142, // Default: SMK Negeri 1 Nglegok Blitar
    lng: 112.1901,
  });

  // Parse existing coordinate value if any
  useEffect(() => {
    if (value) {
      const parts = value.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        setCurrentCoords({ lat: parts[0], lng: parts[1] });
      }
    }
  }, [value]);

  // Load Leaflet CSS and JS dynamically from CDN
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      // 1. Load CSS from CDN
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // 2. Load JS from CDN
      if (!(window as any).L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Gagal memuat skrip Leaflet'));
          document.head.appendChild(script);
        });
      }

      if (!isMounted) return;

      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      // Initialize the Map if not already initialized
      if (!mapRef.current) {
        const initialLat = currentCoords.lat;
        const initialLng = currentCoords.lng;

        const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Custom marker icon to prevent Vite relative asset loading issues
        const customIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });

        const marker = L.marker([initialLat, initialLng], {
          draggable: true,
          icon: customIcon
        }).addTo(map);
        markerRef.current = marker;

        // On dragging marker end, update parent coordinate state
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          const newVal = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
          onChange(newVal);
        });

        // On map clicked, move marker and update coordinates
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          const newVal = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          onChange(newVal);
        });
      } else {
        // Update the map and marker location if coordinates change externally
        const map = mapRef.current;
        const marker = markerRef.current;
        if (map && marker) {
          const currentCenter = map.getCenter();
          const dist = Math.abs(currentCenter.lat - currentCoords.lat) + Math.abs(currentCenter.lng - currentCoords.lng);
          if (dist > 0.0001) {
            marker.setLatLng([currentCoords.lat, currentCoords.lng]);
            map.panTo([currentCoords.lat, currentCoords.lng]);
          }
        }
      }
    };

    loadLeaflet().catch((err) => {
      console.error(err);
      setError('Gagal memuat peta interaktif. Hubungkan ke internet untuk memuat peta.');
    });

    return () => {
      isMounted = false;
    };
  }, [currentCoords]);

  // Clean up Leaflet map instance on component unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Search Address using Nominatim OpenStreetMap Search API
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !(window as any).L || !mapRef.current || !markerRef.current) return;

    setSearchLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        markerRef.current.setLatLng([newLat, newLng]);
        mapRef.current.setView([newLat, newLng], 15);

        const newVal = `${newLat.toFixed(6)}, ${newLng.toFixed(6)}`;
        onChange(newVal);
      } else {
        setError('Lokasi tidak ditemukan. Coba ketik nama kelurahan atau desa secara spesifik.');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal melakukan pencarian lokasi.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Get current device GPS coordinate
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser Anda tidak mendukung deteksi lokasi (Geolocation).');
      return;
    }

    setSearchLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 16);
          onChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
        setSearchLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Gagal mendeteksi lokasi GPS Anda. Harap beri izin akses lokasi di browser.');
        setSearchLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <div id="osm-map-picker" className="space-y-3 bg-[#FDFCF8] p-4 rounded-2xl border border-[#D6D6C2] shadow-xs">
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari desa, jalan, kecamatan, atau kota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-[#D6D6C2] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#0C2B64] text-[#33332D]"
            />
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A70]" />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-4 py-2 bg-[#0C2B64] hover:bg-[#081F48] disabled:bg-[#8A8A70] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
          >
            Cari
          </button>
        </form>
        
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={searchLoading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-[#8A8A70] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          Gunakan Lokasi Saya
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-red-600 font-medium bg-red-50 border border-red-100 p-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Map Element */}
      <div 
        ref={mapContainerRef} 
        className="w-full rounded-xl border border-[#D6D6C2] relative z-10 overflow-hidden"
        style={{ height: '300px', minHeight: '300px' }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#D6D6C2]/40">
        <p className="text-[11px] text-[#8A8A70] leading-normal flex items-start gap-1 max-w-md">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0 mt-1" />
          <span>Geser penanda merah atau klik langsung pada peta untuk memposisikan letak rumah Anda secara presisi.</span>
        </p>
        <div className="text-right shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-[#F5F5F0] border border-[#D6D6C2] px-3 py-1.5 rounded-lg text-[#0C2B64]">
            <MapPin className="w-3.5 h-3.5 text-[#0C2B64]" />
            {value || 'Belum dipilih'}
          </span>
        </div>
      </div>
    </div>
  );
}
