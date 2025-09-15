import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";
import type { CompanyWithDetails } from "@shared/schema";

interface DirectoryMapProps {
  companies: CompanyWithDetails[];
}

export default function DirectoryMap({ companies }: DirectoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para sanitizar títulos (prevenir XSS)
  const sanitizeTitle = (title: string): string => {
    return title.replace(/[<>\"'&]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match];
    });
  };

  // Filtrar empresas que tienen ubicación geográfica válida
  const companiesWithLocation = companies.filter(company => {
    try {
      // Verificar que ubicacionGeografica existe y no es null/undefined
      if (!company.ubicacionGeografica) return false;
      
      let ubicacion;
      
      // Si es string, intentar parsearlo como JSON
      if (typeof company.ubicacionGeografica === 'string') {
        // Ignorar strings vacíos o que solo contengan comillas
        if (company.ubicacionGeografica.trim() === '' || 
            company.ubicacionGeografica.trim() === '""' || 
            company.ubicacionGeografica.trim() === "''") {
          return false;
        }
        
        try {
          ubicacion = JSON.parse(company.ubicacionGeografica);
        } catch {
          return false;
        }
      } else if (typeof company.ubicacionGeografica === 'object') {
        ubicacion = company.ubicacionGeografica;
      } else {
        return false;
      }
      
      // Verificar que tiene propiedades lat y lng válidas
      return ubicacion && 
             typeof ubicacion.lat === 'number' && 
             typeof ubicacion.lng === 'number' && 
             !isNaN(ubicacion.lat) && 
             !isNaN(ubicacion.lng) &&
             ubicacion.lat !== 0 && 
             ubicacion.lng !== 0;
    } catch (error) {
      console.warn(`Error filtering company ${company.id} (${company.nombreEmpresa}):`, error);
      return false;
    }
  });

  // Función para obtener la API key de Google Maps
  const getGoogleMapsApiKey = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/google-maps-key');
      if (!response.ok) {
        throw new Error(`Error fetching API key: ${response.status}`);
      }
      const data = await response.json();
      return data.apiKey;
    } catch (error) {
      console.error('Error fetching Google Maps API key:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!mapRef.current || companiesWithLocation.length === 0) {
      setIsLoading(false);
      return;
    }

    const initializeMap = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Obtener API key
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

        // Coordenadas de México como centro por defecto
        const defaultCenter = { lat: 19.4326, lng: -99.1332 };
        const defaultZoom = 6;

        // Crear el mapa
        const map = new google.maps.Map(mapRef.current!, {
          zoom: defaultZoom,
          center: defaultCenter,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true
        });

        // Crear bounds para ajustar el zoom automáticamente
        const bounds = new google.maps.LatLngBounds();
        let validMarkers = 0;

        // Agregar marcadores para cada empresa
        companiesWithLocation.forEach(company => {
          // Parsear ubicación (puede ser string o objeto)
          let ubicacion: { lat: number; lng: number; address?: string };
          
          if (typeof company.ubicacionGeografica === 'string') {
            try {
              ubicacion = JSON.parse(company.ubicacionGeografica);
            } catch {
              return; // Skip this company if parsing fails
            }
          } else {
            ubicacion = company.ubicacionGeografica as { lat: number; lng: number; address?: string };
          }
          
          // Crear marcador
          const marker = new google.maps.Marker({
            position: { lat: ubicacion.lat, lng: ubicacion.lng },
            map: map,
            title: sanitizeTitle(`${company.nombreEmpresa}${company.direccionFisica ? ' - ' + company.direccionFisica : ''}`),
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            }
          });

          // Crear el contenido del InfoWindow
          const infoWindowContent = `
            <div style="max-width: 280px; padding: 12px; font-family: system-ui, sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937; font-size: 16px; line-height: 1.2;">
                ${sanitizeTitle(company.nombreEmpresa)}
              </h3>
              ${company.direccionFisica ? 
                `<p style="margin: 0 0 6px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">
                  📍 ${sanitizeTitle(company.direccionFisica)}
                </p>` : ''
              }
              ${company.categories && company.categories.length > 0 ? 
                `<p style="margin: 0 0 6px 0; font-size: 12px; color: #9ca3af; line-height: 1.3;">
                  🏷️ ${company.categories.map(cat => sanitizeTitle(cat.nombreCategoria)).join(', ')}
                </p>` : ''
              }
              ${company.telefono1 ? 
                `<p style="margin: 0 0 4px 0; font-size: 12px; color: #059669; line-height: 1.3;">
                  📞 ${sanitizeTitle(company.telefono1)}
                </p>` : ''
              }
              ${company.email1 ? 
                `<p style="margin: 0 0 6px 0; font-size: 12px; color: #0284c7; line-height: 1.3; word-break: break-word;">
                  ✉️ ${sanitizeTitle(company.email1)}
                </p>` : ''
              }
              ${ubicacion.address ? 
                `<p style="margin: 6px 0 0 0; font-size: 11px; color: #9ca3af; line-height: 1.3; border-top: 1px solid #e5e7eb; padding-top: 6px;">
                  ${sanitizeTitle(ubicacion.address)}
                </p>` : ''
              }
              <div style="margin-top: 10px; text-align: center;">
                <button 
                  onclick="window.open('/company/${company.id}', '_blank')" 
                  style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500; transition: background 0.2s;"
                  onmouseover="this.style.background='#2563eb'"
                  onmouseout="this.style.background='#3b82f6'"
                >
                  Ver detalles
                </button>
              </div>
            </div>
          `;

          // Crear InfoWindow
          const infoWindow = new google.maps.InfoWindow({
            content: infoWindowContent
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
          bounds.extend({ lat: ubicacion.lat, lng: ubicacion.lng });
          validMarkers++;
        });

        // Ajustar zoom para mostrar todos los marcadores
        if (validMarkers > 0) {
          try {
            if (validMarkers === 1) {
              // Si solo hay un marcador, centrarlo con zoom apropiado
              const firstMarker = markersRef.current[0];
              map.setCenter(firstMarker.getPosition()!);
              map.setZoom(12);
            } else {
              // Si hay múltiples marcadores, ajustar bounds
              map.fitBounds(bounds);
              // Asegurar un zoom máximo
              const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
                if (map.getZoom()! > 15) map.setZoom(15);
                google.maps.event.removeListener(listener);
              });
            }
          } catch (error) {
            console.warn('Error ajustando bounds del mapa:', error);
            map.setCenter(defaultCenter);
            map.setZoom(defaultZoom);
          }
        }

        mapInstanceRef.current = map;
        setIsLoading(false);

      } catch (error) {
        console.error('Error inicializando mapa del directorio:', error);
        setError('Error al cargar el mapa');
        setIsLoading(false);
      }
    };

    // Usar setTimeout para asegurar que el DOM esté listo
    const timer = setTimeout(initializeMap, 100);

    return () => {
      clearTimeout(timer);
      // Limpiar marcadores al desmontar
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [companiesWithLocation]);

  if (companiesWithLocation.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Sin ubicaciones disponibles</h3>
          <p className="text-sm">
            No hay empresas con ubicación geográfica registrada para mostrar en el mapa.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center text-red-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Error al cargar el mapa</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Mostrando {companiesWithLocation.length} empresa{companiesWithLocation.length !== 1 ? 's' : ''} en el mapa
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Haz clic en los marcadores para ver más información
        </div>
      </div>
      
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-96 border rounded-lg shadow-sm bg-gray-100"
          style={{ minHeight: '384px' }}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm">Cargando mapa del directorio...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}