import { useEffect, useRef, useState } from "react";
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
  const apiKeyRef = useRef<string | null>(null); // Cache para API key
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para geocodificar ciudades usando nuestro endpoint
  const geocodeCity = async (city: string): Promise<{ lat: number; lng: number; address: string } | null> => {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: city }),
      });

      if (!response.ok) {
        console.error(`Error geocoding city ${city}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          address: result.formatted_address
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding city:', city, error);
      return null;
    }
  };

  // Función para obtener la API key de Google Maps (con cache)
  const getGoogleMapsApiKey = async (): Promise<string | null> => {
    if (apiKeyRef.current) return apiKeyRef.current;
    
    try {
      const response = await fetch('/api/google-maps-key');
      if (!response.ok) {
        throw new Error(`Error fetching API key: ${response.status}`);
      }
      const data = await response.json();
      apiKeyRef.current = data.apiKey;
      return data.apiKey;
    } catch (error) {
      console.error('Error fetching Google Maps API key:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeMap = async () => {
      // Verificar que el div del mapa esté disponible
      if (!mapRef.current) {
        console.warn('CompanyLocationMap: MapDiv no disponible aún, reintentando...');
        setTimeout(initializeMap, 100);
        return;
      }

      // Evitar re-inicializar si ya hay un mapa
      if (mapInstanceRef.current) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Obtener API key (con cache)
        const apiKey = await getGoogleMapsApiKey();
        if (!apiKey) {
          setError('No se pudo obtener la API key de Google Maps');
          setIsLoading(false);
          return;
        }

        // Limpiar marcadores existentes
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Cargar Google Maps API
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places']
        });

        const google = await loader.load();
        
        // Geocodificar todas las ubicaciones
        const locations: Array<{
          lat: number;
          lng: number;
          name: string;
          address: string;
          isMain: boolean;
        }> = [];
        
        // Agregar ubicación principal si existe
        if (ubicacionGeografica?.lat && ubicacionGeografica?.lng) {
          locations.push({
            lat: ubicacionGeografica.lat,
            lng: ubicacionGeografica.lng,
            name: 'Oficina Principal',
            address: direccionFisica || ubicacionGeografica.address || '',
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
                  address: location.address,
                  isMain: false
                });
              }
            }
          }
        }

        // Si no hay ubicaciones, mostrar mensaje
        if (locations.length === 0) {
          setError('No hay ubicaciones disponibles para mostrar');
          setIsLoading(false);
          return;
        }

        // Crear el mapa
        const map = new google.maps.Map(mapRef.current, {
          zoom: 15,
          center: { lat: locations[0].lat, lng: locations[0].lng },
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true
        });

        // Crear marcadores para todas las ubicaciones
        const bounds = new google.maps.LatLngBounds();
        
        locations.forEach((location) => {
          const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: `${nombreEmpresa} - ${location.name}`,
            icon: location.isMain ? {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            } : {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            }
          });

          // Crear InfoWindow para el marcador
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="max-width: 250px; padding: 8px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937; font-size: 16px;">${nombreEmpresa}</h3>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: ${location.isMain ? '#dc2626' : '#059669'}; font-weight: 600;">
                  ${location.name}
                </p>
                ${location.address ? `<p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.4;">${location.address}</p>` : ''}
              </div>
            `
          });

          // Agregar evento click al marcador
          marker.addListener('click', () => {
            // Cerrar todas las InfoWindows abiertas
            markersRef.current.forEach((m: any) => {
              if (m.infoWindow) {
                m.infoWindow.close();
              }
            });
            infoWindow.open(map, marker);
          });

          // Guardar referencia a la InfoWindow en el marcador
          (marker as any).infoWindow = infoWindow;
          
          // Agregar marcador a la lista y bounds
          markersRef.current.push(marker);
          bounds.extend({ lat: location.lat, lng: location.lng });
        });

        // Ajustar vista del mapa
        if (locations.length === 1) {
          map.setCenter({ lat: locations[0].lat, lng: locations[0].lng });
          map.setZoom(15);
        } else if (locations.length > 1) {
          map.fitBounds(bounds);
          // Asegurar un zoom mínimo
          const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
            if (map.getZoom()! > 15) map.setZoom(15);
            google.maps.event.removeListener(listener);
          });
        }

        mapInstanceRef.current = map;
        setIsLoading(false);

      } catch (error) {
        console.error('Error inicializando mapa:', error);
        setError('Error al cargar el mapa');
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      // Limpiar marcadores al desmontar
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [ubicacionGeografica, direccionFisica, nombreEmpresa, ciudadesPresencia]);

  if (!ubicacionGeografica?.lat || !ubicacionGeografica?.lng) {
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

  if (error) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center text-red-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-64 border rounded-lg bg-gray-100"
          style={{ minHeight: '256px' }}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm">Cargando mapa...</p>
            </div>
          </div>
        )}
      </div>
      {direccionFisica && (
        <p className="text-sm text-gray-600 mt-2">
          <MapPin className="h-4 w-4 inline mr-1" />
          {direccionFisica}
        </p>
      )}
    </div>
  );
}