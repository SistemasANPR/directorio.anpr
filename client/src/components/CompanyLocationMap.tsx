import { useEffect, useRef, useState } from "react";
import { MapPin, AlertCircle } from "lucide-react";
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
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Función para escapar HTML y prevenir XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Función para geocodificar ciudades usando Google Maps Geocoding API
  const geocodeCity = async (city: string): Promise<{ lat: number; lng: number; display_name: string } | null> => {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: city }),
      });

      if (!response.ok) {
        throw new Error('Error en geocodificación');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          display_name: result.formatted_address
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

      // Verificar si hay datos para mostrar
      const hasMainLocation = ubicacionGeografica?.lat && ubicacionGeografica?.lng;
      const hasCities = ciudadesPresencia && ciudadesPresencia.length > 0;
      
      if (!hasMainLocation && !hasCities) {
        setMapError(null);
        return;
      }

      setIsLoading(true);
      setMapError(null);

      // Limpiar marcadores existentes
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      try {
        // Cargar Google Maps API
        let apiKey = '';
        try {
          const response = await fetch('/api/google-maps-key');
          if (!response.ok) {
            throw new Error('Failed to fetch API key');
          }
          const data = await response.json();
          apiKey = data.apiKey || '';
          if (!apiKey) {
            throw new Error('API key is empty');
          }
        } catch (error) {
          console.error('Error obteniendo API key:', error);
          setMapError('No se pudo obtener la clave de API para Google Maps');
          setIsLoading(false);
          return;
        }

        const loader = new Loader({
          apiKey,
          version: "weekly",
          language: "es",
          region: "MX"
        });

        try {
          await loader.load();
        } catch (error) {
          console.error('Error loading Google Maps:', error);
          setMapError('No se pudo cargar Google Maps. Verifica tu conexión a internet.');
          setIsLoading(false);
          return;
        }

        // Geocodificar todas las ubicaciones
        const locations = [];
        
        // Agregar ubicación principal si existe
        if (hasMainLocation) {
          locations.push({
            lat: ubicacionGeografica.lat,
            lng: ubicacionGeografica.lng,
            name: 'Oficina Principal',
            address: direccionFisica || ubicacionGeografica.address || '',
            isMain: true
          });
        }

        // Geocodificar ciudades de presencia (máximo 10 para evitar sobrecarga)
        if (hasCities) {
          const ciudadesAGeocod = ciudadesPresencia.slice(0, 10);
          for (const ciudad of ciudadesAGeocod) {
            const location = await geocodeCity(ciudad);
            if (location) {
              // Evitar duplicados muy cercanos a cualquier ubicación existente (más de 5km de distancia)
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

        // Si después de la geocodificación no hay ubicaciones, mostrar error
        if (locations.length === 0) {
          setMapError('No se pudieron obtener las coordenadas de las ubicaciones especificadas');
          setIsLoading(false);
          return;
        }

        // Crear el mapa con Google Maps
        const map = new google.maps.Map(mapRef.current, {
          zoom: locations.length === 1 ? 15 : 6,
          center: {
            lat: locations[0].lat,
            lng: locations[0].lng
          },
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          language: "es",
          region: "MX"
        });

        const bounds = new google.maps.LatLngBounds();
        const infoWindow = new google.maps.InfoWindow();

        // Crear marcadores para todas las ubicaciones
        locations.forEach((location) => {
          // Crear contenido del popup de forma segura para prevenir XSS
          const popupDiv = document.createElement('div');
          popupDiv.style.cssText = 'text-align: center; min-width: 200px; font-family: Inter, sans-serif;';
          
          const titleEl = document.createElement('h3');
          titleEl.style.cssText = 'margin: 0 0 8px 0; font-weight: bold; color: #1f2937; font-size: 16px;';
          titleEl.textContent = nombreEmpresa;
          
          const nameEl = document.createElement('p');
          nameEl.style.cssText = `margin: 0 0 4px 0; font-size: 14px; color: ${location.isMain ? '#dc2626' : '#059669'}; font-weight: 600;`;
          nameEl.textContent = location.name;
          
          popupDiv.appendChild(titleEl);
          popupDiv.appendChild(nameEl);
          
          if (location.address) {
            const addressEl = document.createElement('p');
            addressEl.style.cssText = 'margin: 0 0 4px 0; font-size: 12px; color: #6b7280; line-height: 1.4;';
            addressEl.textContent = location.address;
            popupDiv.appendChild(addressEl);
          }

          // Crear marcador con icono diferente para oficina principal
          // Sanitizar el título del marcador para prevenir XSS
          const sanitizedTitle = `${escapeHtml(nombreEmpresa)} - ${escapeHtml(location.name)}`;
          const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map,
            title: sanitizedTitle,
            icon: location.isMain ? {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            } : {
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', 
              scaledSize: new google.maps.Size(28, 28)
            }
          });

          marker.addListener('click', () => {
            infoWindow.setContent(popupDiv);
            infoWindow.open(map, marker);
          });

          markersRef.current.push(marker);
          bounds.extend(marker.getPosition()!);
        });

        // Ajustar vista del mapa para mostrar todos los marcadores
        if (locations.length === 1) {
          map.setCenter({ lat: locations[0].lat, lng: locations[0].lng });
          map.setZoom(15);
        } else if (locations.length > 1) {
          map.fitBounds(bounds);
        }

        mapInstanceRef.current = map;
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Error inesperado al cargar el mapa. Por favor, intenta de nuevo.');
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      // Limpiar marcadores
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [ubicacionGeografica, direccionFisica, nombreEmpresa, ciudadesPresencia]);

  // Verificar si hay datos para mostrar
  const hasMainLocation = ubicacionGeografica?.lat && ubicacionGeografica?.lng;
  const hasCities = ciudadesPresencia && ciudadesPresencia.length > 0;
  
  if (!hasMainLocation && !hasCities) {
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

  // Mostrar error si hubo problemas cargando el mapa
  if (mapError) {
    return (
      <div className="w-full h-64 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-red-600">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Error al cargar el mapa</p>
          <p className="text-xs mt-1 text-red-500">{mapError}</p>
        </div>
      </div>
    );
  }

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="w-full h-64 bg-gray-50 rounded-lg flex items-center justify-center border">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm">Cargando mapa...</p>
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