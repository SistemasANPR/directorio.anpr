import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CompanyLocationMapProps {
  ubicacionGeografica?: { lat: number; lng: number; address?: string } | null;
  direccionFisica?: string;
  nombreEmpresa: string;
  ciudadesPresencia?: string[];
}

export default function CompanyLocationMap({ 
  ubicacionGeografica, 
  direccionFisica, 
  nombreEmpresa,
  ciudadesPresencia = []
}: CompanyLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // Normalizar ubicacionGeografica (igual que en DirectoryMap)
  const normalizedUbicacion = (() => {
    if (!ubicacionGeografica) return null;
    
    // Si ya es un objeto con lat y lng válidos, usarlo directamente
    if (typeof ubicacionGeografica === 'object' && 
        ubicacionGeografica !== null &&
        typeof ubicacionGeografica.lat === 'number' && 
        typeof ubicacionGeografica.lng === 'number' && 
        !isNaN(ubicacionGeografica.lat) && 
        !isNaN(ubicacionGeografica.lng) &&
        ubicacionGeografica.lat !== 0 && 
        ubicacionGeografica.lng !== 0) {
      return ubicacionGeografica;
    }
    
    // Si es string, intentar parsearlo
    if (typeof ubicacionGeografica === 'string' &&
        ubicacionGeografica.trim() !== '' && 
        ubicacionGeografica.trim() !== '""' && 
        ubicacionGeografica.trim() !== "''") {
      try {
        const parsed = JSON.parse(ubicacionGeografica);
        if (parsed && 
            typeof parsed.lat === 'number' && 
            typeof parsed.lng === 'number' && 
            !isNaN(parsed.lat) && 
            !isNaN(parsed.lng) &&
            parsed.lat !== 0 && 
            parsed.lng !== 0) {
          return parsed;
        }
      } catch (error) {
        console.warn('Error parsing location data:', error);
      }
    }
    
    return null;
  })();

  // Función para geocodificar ciudades usando Nominatim
  const geocodeCity = async (city: string): Promise<{ lat: number; lng: number; display_name: string } | null> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding city:', city, error);
      return null;
    }
  };

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      // Limpiar mapa existente
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Geocodificar todas las ubicaciones
      const locations = [];
      
      // Agregar ubicación principal si existe
      if (normalizedUbicacion?.lat && normalizedUbicacion?.lng) {
        locations.push({
          lat: normalizedUbicacion.lat,
          lng: normalizedUbicacion.lng,
          name: 'Oficina Principal',
          address: direccionFisica || normalizedUbicacion.address || '',
          isMain: true
        });
      }

      // Geocodificar ciudades de presencia (máximo 10 para evitar sobrecarga)
      if (ciudadesPresencia && ciudadesPresencia.length > 0) {
        const ciudadesAGeocod = ciudadesPresencia.slice(0, 10);
        for (const ciudad of ciudadesAGeocod) {
          const location = await geocodeCity(ciudad);
          if (location) {
            // Evitar duplicados muy cercanos a la oficina principal (más de 5km de distancia)
            const isDuplicate = locations.some(loc => {
              const distance = Math.sqrt(
                Math.pow((loc.lat - location.lat) * 111000, 2) + 
                Math.pow((loc.lng - location.lng) * 111000 * Math.cos(location.lat * Math.PI / 180), 2)
              );
              return distance < 5000; // 5km en metros
            });
            
            if (!isDuplicate) {
              locations.push({
                lat: location.lat,
                lng: location.lng,
                name: ciudad,
                address: location.display_name,
                isMain: false
              });
            }
          }
        }
      }

      // Si no hay ubicaciones, no mostrar mapa
      if (locations.length === 0) {
        return;
      }

      // Crear el mapa con configuración mejorada
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true,
        preferCanvas: false
      });

      // Agregar capa de tiles de OpenStreetMap con configuración optimizada
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3,
        crossOrigin: true
      }).addTo(map);

      // Crear marcadores para todas las ubicaciones
      const markers: L.Marker[] = [];
      
      locations.forEach((location) => {
        const popupContent = `
          <div style="text-align: center; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${nombreEmpresa}</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: ${location.isMain ? '#dc2626' : '#059669'}; font-weight: 600;">
              ${location.name}
            </p>
            ${location.address ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${location.address}</p>` : ''}
          </div>
        `;

        // Crear marcador con icono diferente para oficina principal
        const marker = L.marker([location.lat, location.lng], {
          icon: location.isMain ? 
            L.icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            }) :
            L.icon({
              iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS4xMjcgMCAyNC41IDUuMzczIDI0LjUgMTJDMjQuNSAxOC42MjcgMTkuMTI3IDI0IDEyLjUgMjRDNS44NzMgMjQgMC41IDE4LjYyNyAwLjUgMTJDMC41IDUuMzczIDUuODczIDAgMTIuNSAwWiIgZmlsbD0iIzA1OTY2OSIvPgo8Y2lyY2xlIGN4PSIxMi41IiBjeT0iMTIiIHI9IjQiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMi41IDI0TDIwIDQxTDEyLjUgMzdMNSA0MUwxMi41IDI0WiIgZmlsbD0iIzA1OTY2OSIvPgo8L3N2Zz4K',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34]
            })
        })
          .addTo(map)
          .bindPopup(popupContent);

        markers.push(marker);
      });

      // Ajustar vista del mapa para mostrar todos los marcadores
      if (markers.length === 1) {
        map.setView([locations[0].lat, locations[0].lng], 15);
      } else if (markers.length > 1) {
        const group = new L.FeatureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      }

      mapInstanceRef.current = map;
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [normalizedUbicacion, direccionFisica, nombreEmpresa, ciudadesPresencia]);

  if (!normalizedUbicacion?.lat || !normalizedUbicacion?.lng) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Ubicación no disponible</p>
          {direccionFisica && (
            <p className="text-xs mt-1 text-gray-400">{direccionFisica}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        ref={mapRef} 
        className="w-full h-64 border rounded-lg"
        style={{ minHeight: '256px' }}
      />
      {direccionFisica && (
        <p className="text-sm text-gray-600 mt-2">
          <MapPin className="h-4 w-4 inline mr-1" />
          {direccionFisica}
        </p>
      )}
    </div>
  );
}