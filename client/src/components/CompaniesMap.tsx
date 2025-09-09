import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para los iconos por defecto de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Company {
  id: number;
  nombreEmpresa: string;
  representantesVentas?: string[] | string;
  paisesPresencia?: string[];
  ciudadesPresencia?: string[];
  ubicacionGeografica?: { lat: number; lng: number };
  direccionFisica?: string;
  email1?: string;
  telefono1?: string;
}

export default function CompaniesMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Obtener todas las empresas registradas
  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies/public"],
    queryFn: async () => {
      const response = await fetch("/api/companies/public");
      if (!response.ok) {
        throw new Error("Error al cargar empresas");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.companies || [];
    },
  });

  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    // Destruir mapa existente si existe
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Crear nuevo mapa
    const initMap = () => {
      if (!mapRef.current) return;

      // Coordenadas de México como centro por defecto
      const defaultCenter: [number, number] = [19.4326, -99.1332];
      const defaultZoom = 5;

      // Crear el mapa
      const map = L.map(mapRef.current).setView(defaultCenter, defaultZoom);

      // Agregar capa de tiles de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Filtrar empresas que tienen ubicación geográfica
      const companiesWithLocation = companies.filter(company => 
        company.ubicacionGeografica && 
        company.ubicacionGeografica.lat && 
        company.ubicacionGeografica.lng
      );

      // Crear grupo de marcadores para ajustar el zoom automáticamente
      const markersGroup = L.featureGroup();

      // Agregar marcadores para cada empresa
      companiesWithLocation.forEach(company => {
        const ubicacion = company.ubicacionGeografica!;
        
        // Obtener información del representante
        let representante = "No especificado";
        if (company.representantesVentas) {
          if (Array.isArray(company.representantesVentas)) {
            representante = company.representantesVentas[0] || "No especificado";
          } else {
            representante = company.representantesVentas;
          }
        }

        // Obtener información de ubicación
        const pais = company.paisesPresencia?.[0] || "No especificado";
        const ciudad = company.ciudadesPresencia?.[0] || "No especificado";

        // Crear el contenido del popup según las especificaciones
        const popupContent = `
          <div style="text-align: center; min-width: 250px; max-width: 300px; padding: 8px;">
            <h3 style="margin: 0 0 12px 0; font-weight: bold; color: #1f2937; font-size: 16px; line-height: 1.2;">
              ${company.nombreEmpresa}
            </h3>
            
            <div style="margin-bottom: 8px; padding: 4px 8px; background: #f3f4f6; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #374151;">
                <strong>Representante:</strong> ${representante}
              </p>
            </div>
            
            <div style="margin-bottom: 8px; padding: 4px 8px; background: #f3f4f6; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #374151;">
                <strong>Ciudad:</strong> ${ciudad}
              </p>
            </div>
            
            <div style="margin-bottom: 12px; padding: 4px 8px; background: #f3f4f6; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #374151;">
                <strong>País:</strong> ${pais}
              </p>
            </div>
            
            ${company.email1 ? `
              <p style="margin: 4px 0; font-size: 12px; color: #0284c7;">
                ✉️ ${company.email1}
              </p>
            ` : ''}
            
            ${company.telefono1 ? `
              <p style="margin: 4px 0; font-size: 12px; color: #059669;">
                📞 ${company.telefono1}
              </p>
            ` : ''}
          </div>
        `;

        // Crear marcador con icono personalizado
        const marker = L.marker([ubicacion.lat, ubicacion.lng], {
          icon: L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).bindPopup(popupContent);

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
          console.warn('Error al ajustar bounds del mapa:', error);
          map.setView(defaultCenter, defaultZoom);
        }
      } else {
        // Si no hay empresas con ubicación, mostrar vista por defecto
        map.setView(defaultCenter, defaultZoom);
      }

      mapInstanceRef.current = map;
    };

    initMap();

    // Cleanup al desmontar
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [companies, isLoading]);

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border shadow-sm"
        style={{ minHeight: "400px" }}
      />
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          {companies.filter(c => c.ubicacionGeografica).length} empresas registradas en el mapa
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Haz clic en los marcadores para ver la información de cada empresa
        </p>
      </div>
    </div>
  );
}