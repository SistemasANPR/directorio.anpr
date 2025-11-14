/// <reference types="@types/google.maps" />
import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";

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
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Normalizar ubicacionGeografica - puede venir como string JSON o como objeto
  const normalizeUbicacion = (ubicacion: any): { lat: number; lng: number; address?: string } | null => {
    if (!ubicacion) return null;
    
    // Si es string, intentar parsear como JSON
    if (typeof ubicacion === 'string') {
      try {
        const parsed = JSON.parse(ubicacion);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing ubicacionGeografica:', e);
        return null;
      }
    }
    
    // Si ya es objeto, validar que tenga lat y lng válidos
    if (typeof ubicacion === 'object') {
      const lat = Number(ubicacion.lat);
      const lng = Number(ubicacion.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return {
          lat,
          lng,
          address: ubicacion.address
        };
      }
    }
    
    return null;
  };

  const normalizedUbicacion = normalizeUbicacion(ubicacionGeografica);

  // Función para geocodificar ciudades usando Google Geocoding API
  const geocodeCity = async (city: string, geocoder: google.maps.Geocoder): Promise<{ lat: number; lng: number; display_name: string } | null> => {
    try {
      const result = await geocoder.geocode({ address: city });
      
      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng(),
          display_name: result.results[0].formatted_address
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding city:', city, error);
      return null;
    }
  };

  useEffect(() => {
    if (!mapRef.current || !normalizedUbicacion) {
      return;
    }

    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
      libraries: ["places", "geocoding"]
    });

    let isMounted = true;

    const initializeMap = async () => {
      try {
        await loader.load();
        
        if (!isMounted || !mapRef.current) return;

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

        // Crear geocoder
        const geocoder = new google.maps.Geocoder();

        // Geocodificar ciudades de presencia (máximo 10 para evitar sobrecarga)
        if (ciudadesPresencia && ciudadesPresencia.length > 0) {
          const ciudadesAGeocod = ciudadesPresencia.slice(0, 10);
          for (const ciudad of ciudadesAGeocod) {
            const location = await geocodeCity(ciudad, geocoder);
            if (location) {
              // Evitar duplicados muy cercanos a la oficina principal (más de 5km de distancia)
              const isDuplicate = locations.some(loc => {
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(loc.lat, loc.lng),
                  new google.maps.LatLng(location.lat, location.lng)
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

        if (locations.length === 0) return;

        // Crear el mapa solo si no existe
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: { lat: locations[0].lat, lng: locations[0].lng },
            zoom: 15,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          });
        }

        const map = mapInstanceRef.current;

        // Limpiar marcadores anteriores
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Crear bounds para ajustar el zoom
        const bounds = new google.maps.LatLngBounds();

        // Crear marcadores para todas las ubicaciones
        locations.forEach((location) => {
          const position = { lat: location.lat, lng: location.lng };

          const infoContent = `
            <div style="text-align: center; min-width: 200px; max-width: 250px; padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937; font-size: 16px;">${nombreEmpresa}</h3>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: ${location.isMain ? '#dc2626' : '#059669'}; font-weight: 600;">
                ${location.name}
              </p>
              ${location.address ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${location.address}</p>` : ''}
            </div>
          `;

          // Crear marcador con color diferente para oficina principal
          const marker = new google.maps.Marker({
            position,
            map,
            title: `${nombreEmpresa} - ${location.name}`,
            animation: google.maps.Animation.DROP,
            icon: location.isMain ? undefined : {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#059669',
              fillOpacity: 0.8,
              strokeColor: '#047857',
              strokeWeight: 2,
              scale: 8
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: infoContent,
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });

          markersRef.current.push(marker);
          bounds.extend(position);
        });

        // Ajustar el mapa para mostrar todos los marcadores
        if (locations.length === 1) {
          map.setCenter(bounds.getCenter());
          map.setZoom(15);
        } else if (locations.length > 1) {
          map.fitBounds(bounds);
        }

      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [normalizedUbicacion, direccionFisica, nombreEmpresa, ciudadesPresencia]);

  if (!normalizedUbicacion) {
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
    <div className="w-full" style={{ position: 'relative', zIndex: 1 }}>
      <div 
        ref={mapRef} 
        className="w-full h-64 border rounded-lg"
        style={{ minHeight: '256px', position: 'relative', zIndex: 1 }}
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
