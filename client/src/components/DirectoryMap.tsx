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
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

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
        setIsMapLoaded(true);
        setMapError(null);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapError('Error al cargar Google Maps. Verifica la configuración de la API key.');
      }
    };

    loadGoogleMaps();
  }, []);

  // Inicializar mapa y marcadores
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || companiesWithLocation.length === 0) {
      return;
    }

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    try {
      // Coordenadas de México como centro por defecto
      const defaultCenter = { lat: 19.4326, lng: -99.1332 };

      // Crear el mapa
      const map = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 6,
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

      // Crear InfoWindow para mostrar información de las empresas
      const infoWindow = new google.maps.InfoWindow();
      infoWindowRef.current = infoWindow;

      // Crear bounds para ajustar el zoom automáticamente
      const bounds = new google.maps.LatLngBounds();

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
          title: company.nombreEmpresa,
          animation: google.maps.Animation.DROP
        });

        // Crear el contenido del popup
        const popupContent = `
          <div style="text-align: center; min-width: 200px; max-width: 250px; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937; font-size: 16px;">${company.nombreEmpresa}</h3>
            ${company.direccionFisica ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">${company.direccionFisica}</p>` : ''}
            ${company.categories && company.categories.length > 0 ? 
              `<p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af;">
                ${company.categories.map(cat => cat.nombreCategoria).join(', ')}
              </p>` : ''
            }
            ${company.telefono1 ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #059669;">📞 ${company.telefono1}</p>` : ''}
            ${company.email1 ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #0284c7;">✉️ ${company.email1}</p>` : ''}
            ${ubicacion.address ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #9ca3af;">${ubicacion.address}</p>` : ''}
            <button 
              onclick="window.open('/company/${company.id}', '_blank')" 
              style="margin-top: 8px; padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;"
            >
              Ver detalles
            </button>
          </div>
        `;

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

      // Ajustar zoom para mostrar todos los marcadores
      if (companiesWithLocation.length > 0) {
        try {
          map.fitBounds(bounds);
          
          // Evitar zoom excesivo si hay solo un marcador
          const listener = google.maps.event.addListener(map, 'idle', () => {
            if (map.getZoom()! > 15) {
              map.setZoom(15);
            }
            google.maps.event.removeListener(listener);
          });
        } catch (error) {
          // Si hay error al calcular bounds, usar vista por defecto
          map.setCenter(defaultCenter);
          map.setZoom(6);
        }
      }

    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setMapError('Error al inicializar el mapa. Intenta recargar la página.');
    }
  }, [isMapLoaded, companiesWithLocation]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  if (mapError) {
    return (
      <div className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center border-2 border-dashed border-red-300">
        <div className="text-center text-red-600">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Error en el mapa</h3>
          <p className="text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  if (!isMapLoaded) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <h3 className="text-lg font-medium mb-2">Cargando mapa...</h3>
          <p className="text-sm">Google Maps se está inicializando</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Mostrando {companiesWithLocation.length} empresa{companiesWithLocation.length !== 1 ? 's' : ''} en el mapa
          </span>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span>Haz clic en los marcadores para ver más información</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Google Maps</span>
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full h-96 border rounded-lg shadow-sm"
        style={{ minHeight: '384px' }}
        data-testid="directory-map"
      />
    </div>
  );
}