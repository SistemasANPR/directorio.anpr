import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";

interface CompanyLocationMapProps {
  ubicacionGeografica?: { lat: number; lng: number; address?: string } | null;
  direccionFisica?: string;
  nombreEmpresa: string;
  ciudadesPresencia?: string[];
}

interface LocationData {
  lat: number;
  lng: number;
  name: string;
  address: string;
  isMain: boolean;
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
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Función para geocodificar ciudades usando Google Geocoder
  const geocodeCity = async (city: string): Promise<{ lat: number; lng: number; address: string } | null> => {
    if (!geocoderRef.current) return null;
    
    try {
      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoderRef.current!.geocode(
          { address: city },
          (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed for ${city}: ${status}`));
            }
          }
        );
      });

      if (results && results.length > 0) {
        const result = results[0];
        return {
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
          address: result.formatted_address
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding city:', city, error);
      return null;
    }
  };

  // Cargar Google Maps
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        await loader.load();

        // Inicializar geocoder
        geocoderRef.current = new google.maps.Geocoder();
        
        setIsMapLoaded(true);
        setMapError(null);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapError('Error al cargar Google Maps. Verifica la configuración de la API key.');
      }
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    const initializeMap = async () => {
      if (!isMapLoaded || !mapRef.current) return;

      // Limpiar marcadores existentes
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      try {
        // Geocodificar todas las ubicaciones
        const locations: LocationData[] = [];
        
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
                  address: location.address,
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

        // Crear el mapa
        const map = new google.maps.Map(mapRef.current, {
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        mapInstanceRef.current = map;

        // Crear InfoWindow para mostrar información
        const infoWindow = new google.maps.InfoWindow();

        // Crear bounds para ajustar el zoom automáticamente
        const bounds = new google.maps.LatLngBounds();

        // Crear marcadores para todas las ubicaciones
        locations.forEach((location) => {
          const popupContent = `
            <div style="text-align: center; min-width: 200px; padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${nombreEmpresa}</h3>
              <p style="margin: 0 0 4px 0; font-size: 14px; color: ${location.isMain ? '#dc2626' : '#059669'}; font-weight: 600;">
                ${location.name}
              </p>
              ${location.address ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${location.address}</p>` : ''}
            </div>
          `;

          // Crear marcador con icono diferente para oficina principal
          const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: `${nombreEmpresa} - ${location.name}`,
            animation: google.maps.Animation.DROP,
            icon: location.isMain ? 
              {
                url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS4xMjcgMCAyNC41IDUuMzczIDI0LjUgMTJDMjQuNSAxOC42MjcgMTkuMTI3IDI0IDEyLjUgMjRDNS44NzMgMjQgMC41IDE4LjYyNyAwLjUgMTJDMC41IDUuMzczIDUuODczIDAgMTIuNSAwWiIgZmlsbD0iI2RjMjYyNiIvPgo8Y2lyY2xlIGN4PSIxMi41IiBjeT0iMTIiIHI9IjQiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMi41IDI0TDIwIDQxTDEyLjUgMzdMNSA0MUwxMi41IDI0WiIgZmlsbD0iI2RjMjYyNiIvPgo8L3N2Zz4K',
                scaledSize: new google.maps.Size(25, 41),
                anchor: new google.maps.Point(12, 41)
              } :
              {
                url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS4xMjcgMCAyNC41IDUuMzczIDI0LjUgMTJDMjQuNSAxOC42MjcgMTkuMTI3IDI0IDEyLjUgMjRDNS44NzMgMjQgMC41IDE4LjYyNyAwLjUgMTJDMC41IDUuMzczIDUuODczIDAgMTIuNSAwWiIgZmlsbD0iIzA1OTY2OSIvPgo8Y2lyY2xlIGN4PSIxMi41IiBjeT0iMTIiIHI9IjQiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMi41IDI0TDIwIDQxTDEyLjUgMzdMNSA0MUwxMi41IDI0WiIgZmlsbD0iIzA1OTY2OSIvPgo8L3N2Zz4K',
                scaledSize: new google.maps.Size(25, 41),
                anchor: new google.maps.Point(12, 41)
              }
          });

          // Agregar listener para mostrar InfoWindow al hacer clic
          marker.addListener('click', () => {
            infoWindow.setContent(popupContent);
            infoWindow.open(map, marker);
          });

          // Agregar marcador al array para limpieza posterior
          markersRef.current.push(marker);

          // Extender bounds para incluir este marcador
          bounds.extend(marker.getPosition()!);
        });

        // Ajustar vista del mapa para mostrar todos los marcadores
        if (locations.length === 1) {
          map.setCenter({ lat: locations[0].lat, lng: locations[0].lng });
          map.setZoom(15);
        } else if (locations.length > 1) {
          map.fitBounds(bounds);
          
          // Evitar zoom excesivo
          const listener = google.maps.event.addListener(map, 'idle', () => {
            if (map.getZoom()! > 15) {
              map.setZoom(15);
            }
            google.maps.event.removeListener(listener);
          });
        }

      } catch (error) {
        console.error('Error initializing company location map:', error);
        setMapError('Error al inicializar el mapa de ubicaciones.');
      }
    };

    initializeMap();

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [isMapLoaded, ubicacionGeografica, direccionFisica, nombreEmpresa, ciudadesPresencia]);

  if (mapError) {
    return (
      <div className="w-full h-64 bg-red-50 rounded-lg flex items-center justify-center border-2 border-dashed border-red-300">
        <div className="text-center text-red-600">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Error al cargar el mapa</p>
          <p className="text-xs mt-1">{mapError}</p>
        </div>
      </div>
    );
  }

  if (!isMapLoaded) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
          <p className="text-sm">Cargando mapa...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="w-full">
      <div 
        ref={mapRef} 
        className="w-full h-64 border rounded-lg"
        style={{ minHeight: '256px' }}
        data-testid="company-location-map"
      />
      {direccionFisica && (
        <div className="flex items-center gap-2 mt-2">
          <p className="text-sm text-gray-600">
            <MapPin className="h-4 w-4 inline mr-1" />
            {direccionFisica}
          </p>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Google Maps</span>
        </div>
      )}
    </div>
  );
}