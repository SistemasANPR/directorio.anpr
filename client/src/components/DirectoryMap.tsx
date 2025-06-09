import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CompanyWithDetails } from "@shared/schema";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DirectoryMapProps {
  companies: CompanyWithDetails[];
}

export default function DirectoryMap({ companies }: DirectoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Filtrar empresas que tienen ubicación geográfica válida
  const companiesWithLocation = companies.filter(company => 
    company.ubicacionGeografica && 
    typeof company.ubicacionGeografica === 'object' &&
    'lat' in company.ubicacionGeografica &&
    'lng' in company.ubicacionGeografica &&
    company.ubicacionGeografica.lat &&
    company.ubicacionGeografica.lng
  );

  useEffect(() => {
    if (!mapRef.current || companiesWithLocation.length === 0) {
      return;
    }

    // Limpiar mapa anterior si existe
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Usar setTimeout para asegurar que el DOM esté listo
    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      try {
        // Coordenadas de México como centro por defecto
        const defaultCenter: [number, number] = [19.4326, -99.1332];
        const defaultZoom = 6;

        // Crear el mapa
        const map = L.map(mapRef.current).setView(defaultCenter, defaultZoom);

        // Agregar capa de tiles de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Crear grupo de marcadores para ajustar el zoom automáticamente
        const markersGroup = L.featureGroup();

        // Agregar marcadores para cada empresa
        companiesWithLocation.forEach(company => {
          const ubicacion = company.ubicacionGeografica as { lat: number; lng: number; address?: string };
          
          // Crear el contenido del popup
          const popupContent = `
            <div style="text-align: center; min-width: 200px; max-width: 250px;">
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

          // Crear marcador
          const marker = L.marker([ubicacion.lat, ubicacion.lng])
            .bindPopup(popupContent);

          // Agregar al grupo de marcadores
          markersGroup.addLayer(marker);
        });

        // Agregar grupo de marcadores al mapa
        markersGroup.addTo(map);

        // Ajustar zoom para mostrar todos los marcadores
        if (companiesWithLocation.length > 0) {
          try {
            map.fitBounds(markersGroup.getBounds(), {
              padding: [20, 20],
              maxZoom: 15
            });
          } catch (error) {
            // Si hay error al calcular bounds, usar vista por defecto
            map.setView(defaultCenter, defaultZoom);
          }
        }

        mapInstanceRef.current = map;
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
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
      />
    </div>
  );
}