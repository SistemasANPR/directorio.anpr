import { useEffect, useRef, useState } from "react";
import { MapPin, AlertCircle } from "lucide-react";
import { Loader } from "@googlemaps/js-api-loader";
import type { CompanyWithDetails } from "@shared/schema";

interface DirectoryMapProps {
  companies: CompanyWithDetails[];
}

export default function DirectoryMap({ companies }: DirectoryMapProps) {
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

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || companiesWithLocation.length === 0) {
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

        // Coordenadas de México como centro por defecto
        const defaultCenter = { lat: 19.4326, lng: -99.1332 };
        const defaultZoom = 6;

        // Crear el mapa con Google Maps
        const map = new google.maps.Map(mapRef.current, {
          zoom: companiesWithLocation.length === 1 ? 15 : defaultZoom,
          center: defaultCenter,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          language: "es",
          region: "MX"
        });

        const bounds = new google.maps.LatLngBounds();
        const infoWindow = new google.maps.InfoWindow();

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

          // Crear contenido del popup de forma segura para prevenir XSS
          const popupDiv = document.createElement('div');
          popupDiv.style.cssText = 'text-align: center; min-width: 200px; max-width: 250px; font-family: Inter, sans-serif;';
          
          const titleEl = document.createElement('h3');
          titleEl.style.cssText = 'margin: 0 0 8px 0; font-weight: bold; color: #1f2937; font-size: 16px;';
          titleEl.textContent = company.nombreEmpresa;
          popupDiv.appendChild(titleEl);

          // Dirección física
          if (company.direccionFisica) {
            const addressEl = document.createElement('p');
            addressEl.style.cssText = 'margin: 0 0 4px 0; font-size: 14px; color: #6b7280;';
            addressEl.textContent = company.direccionFisica;
            popupDiv.appendChild(addressEl);
          }

          // Categorías
          if (company.categories && company.categories.length > 0) {
            const categoriesEl = document.createElement('p');
            categoriesEl.style.cssText = 'margin: 0 0 4px 0; font-size: 12px; color: #9ca3af;';
            categoriesEl.textContent = company.categories.map(cat => cat.nombreCategoria).join(', ');
            popupDiv.appendChild(categoriesEl);
          }

          // Teléfono
          if (company.telefono1) {
            const phoneEl = document.createElement('p');
            phoneEl.style.cssText = 'margin: 0 0 4px 0; font-size: 12px; color: #059669;';
            phoneEl.textContent = `📞 ${company.telefono1}`;
            popupDiv.appendChild(phoneEl);
          }

          // Email
          if (company.email1) {
            const emailEl = document.createElement('p');
            emailEl.style.cssText = 'margin: 0 0 4px 0; font-size: 12px; color: #0284c7;';
            emailEl.textContent = `✉️ ${company.email1}`;
            popupDiv.appendChild(emailEl);
          }

          // Dirección de ubicación
          if (ubicacion.address) {
            const locationEl = document.createElement('p');
            locationEl.style.cssText = 'margin: 4px 0 0 0; font-size: 11px; color: #9ca3af;';
            locationEl.textContent = ubicacion.address;
            popupDiv.appendChild(locationEl);
          }

          // Botón para ver detalles
          const detailsButton = document.createElement('button');
          detailsButton.style.cssText = 'margin-top: 8px; padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;';
          detailsButton.textContent = 'Ver detalles';
          detailsButton.onclick = () => {
            window.open(`/company/${company.id}`, '_blank');
          };
          popupDiv.appendChild(detailsButton);

          // Crear marcador con título sanitizado para prevenir XSS
          const sanitizedTitle = escapeHtml(company.nombreEmpresa);
          const marker = new google.maps.Marker({
            position: { lat: ubicacion.lat, lng: ubicacion.lng },
            map,
            title: sanitizedTitle,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(32, 32)
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
        if (companiesWithLocation.length === 1) {
          map.setCenter(bounds.getCenter());
          map.setZoom(15);
        } else if (companiesWithLocation.length > 1) {
          map.fitBounds(bounds, { padding: 20 });
          // Establecer zoom máximo para evitar acercamiento excesivo
          const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
            if (map.getZoom()! > 15) {
              map.setZoom(15);
            }
            google.maps.event.removeListener(listener);
          });
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

  // Mostrar error si hubo problemas cargando el mapa
  if (mapError) {
    return (
      <div className="w-full h-96 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
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
      <div className="w-full h-96 bg-gray-50 rounded-lg flex items-center justify-center border">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm">Cargando mapa...</p>
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
      
      <div 
        ref={mapRef} 
        className="w-full h-96 border rounded-lg shadow-sm"
        style={{ minHeight: '384px' }}
        data-testid="directory-map"
      />
    </div>
  );
}