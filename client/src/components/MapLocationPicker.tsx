import { useEffect, useState, useRef } from "react";
import { MapPin, Search, Navigation, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
  country?: string;
  state?: string;
  city?: string;
}

interface MapLocationPickerProps {
  ciudad: string;
  onLocationSelect: (location: LocationInfo) => void;
  initialLocation?: LocationInfo | null;
  direccionFisica?: string; // Nueva prop para geocodificación automática
}

export default function MapLocationPicker({ ciudad, onLocationSelect, initialLocation, direccionFisica }: MapLocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(
    initialLocation || null
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [lastGeocodedAddress, setLastGeocodedAddress] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Coordenadas de referencia para ciudades mexicanas
  const cityReferences = {
    "Ciudad de México": { lat: 19.4326, lng: -99.1332 },
    "México": { lat: 19.4326, lng: -99.1332 },
    "Guadalajara": { lat: 20.6597, lng: -103.3496 },
    "Monterrey": { lat: 25.6866, lng: -100.3161 },
    "Puebla": { lat: 19.0414, lng: -98.2063 },
    "Tijuana": { lat: 32.5149, lng: -117.0382 },
    "León": { lat: 21.1619, lng: -101.6974 },
    "Juárez": { lat: 31.6904, lng: -106.4245 },
    "Torreón": { lat: 25.5428, lng: -103.4068 },
    "Querétaro": { lat: 20.5888, lng: -100.3899 },
    "Mérida": { lat: 20.9674, lng: -89.5926 },
    "Cancún": { lat: 21.1619, lng: -86.8515 },
    "Acapulco": { lat: 16.8531, lng: -99.8237 },
    "Veracruz": { lat: 19.1738, lng: -96.1342 }
  };

  const getCityReference = () => {
    const cityName = ciudad.split(',')[0];
    return cityReferences[cityName as keyof typeof cityReferences] || cityReferences["México"];
  };

  // Función para extraer información de ubicación de los componentes de Google Maps
  const extractLocationInfo = (addressComponents: any[]) => {
    let country = '';
    let state = '';
    let city = '';

    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('country')) {
        country = component.long_name;
      }
      else if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        if (!city) city = component.long_name;
      }
      else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
        if (!city) city = component.long_name;
      }
    }

    return { country, state, city };
  };

  // Función para geocodificar dirección usando Google Maps API
  const geocodeAddress = async (address: string): Promise<LocationInfo | null> => {
    if (!address || address.trim().length < 5) return null;
    
    setIsGeocoding(true);
    try {
      // Usar Google Maps Geocoding API a través del endpoint del backend
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: address.trim() }),
      });

      if (!response.ok) {
        throw new Error('Error en geocodificación');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        
        // Extraer información detallada de ubicación
        const locationInfo = extractLocationInfo(result.address_components || []);
        
        const location: LocationInfo = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          address: result.formatted_address,
          country: locationInfo.country,
          state: locationInfo.state,
          city: locationInfo.city
        };
        
        return location;
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Obtener coordenadas de referencia de la ciudad
      const cityRef = getCityReference();
      const center = selectedLocation ? 
        [selectedLocation.lat, selectedLocation.lng] as [number, number] : 
        [cityRef.lat, cityRef.lng] as [number, number];

      // Crear el mapa
      const map = L.map(mapRef.current).setView(center, selectedLocation ? 15 : 10);

      // Agregar capa de tiles de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;

      // Agregar marcador si hay ubicación inicial
      if (selectedLocation) {
        const marker = L.marker([selectedLocation.lat, selectedLocation.lng])
          .addTo(map)
          .bindPopup(selectedLocation.address || `${selectedLocation.lat}, ${selectedLocation.lng}`);
        markerRef.current = marker;
      }

      // Clic en el mapa DESACTIVADO - Solo selección por dirección física

      setMapLoaded(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Actualizar marcador cuando cambie la ubicación inicial
  useEffect(() => {
    if (mapInstanceRef.current && initialLocation && mapLoaded) {
      // Remover marcador anterior
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Crear nuevo marcador
      const marker = L.marker([initialLocation.lat, initialLocation.lng])
        .addTo(mapInstanceRef.current)
        .bindPopup(initialLocation.address || `${initialLocation.lat}, ${initialLocation.lng}`);
      
      markerRef.current = marker;
      mapInstanceRef.current.setView([initialLocation.lat, initialLocation.lng], 15);

      setSelectedLocation(initialLocation);
    }
  }, [initialLocation, mapLoaded]);

  // Geocodificar automáticamente cuando cambie la dirección física
  useEffect(() => {
    const handleAddressGeocoding = async () => {
      // Solo geocodificar si:
      // 1. Hay una dirección física
      // 2. Es diferente a la última geocodificada
      // 3. Tiene más de 10 caracteres (para evitar geocodificar fragmentos)
      if (direccionFisica && 
          direccionFisica.trim().length > 10 && 
          direccionFisica !== lastGeocodedAddress &&
          !isGeocoding) {
        
        const location = await geocodeAddress(direccionFisica);
        
        if (location) {
          setLastGeocodedAddress(direccionFisica);
          
          // Actualizar estado
          setSelectedLocation(location);

          // Actualizar mapa si está disponible
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([location.lat, location.lng], 15);
            
            // Remover marcador anterior
            if (markerRef.current) {
              mapInstanceRef.current.removeLayer(markerRef.current);
            }

            // Crear nuevo marcador
            const marker = L.marker([location.lat, location.lng])
              .addTo(mapInstanceRef.current)
              .bindPopup(`📍 ${location.address}`);
            
            markerRef.current = marker;
          }

          // Notificar al componente padre
          onLocationSelect(location);
        }
      }
    };

    // Agregar un pequeño delay para evitar llamadas excesivas
    const timer = setTimeout(handleAddressGeocoding, 1000);
    return () => clearTimeout(timer);
  }, [direccionFisica, lastGeocodedAddress, isGeocoding, onLocationSelect]);


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Ubicación en el Mapa (Opcional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mapa */}
        <div className="space-y-2">
          <Label>Vista del Mapa</Label>
          <div 
            ref={mapRef} 
            className="w-full h-64 border rounded-lg"
            style={{ minHeight: '256px' }}
          />
          <p className="text-xs text-gray-500">
            La ubicación se actualiza automáticamente cuando escribas la dirección física arriba.
          </p>
        </div>

        {/* Estado de geocodificación */}
        {isGeocoding && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>🔍 Geocodificando dirección...</strong><br />
              Buscando coordenadas y datos de ubicación automáticamente...
            </p>
          </div>
        )}

        {/* Información actual */}
        {selectedLocation && !isGeocoding && (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✅ Ubicación encontrada automáticamente:</strong><br />
              Latitud: {selectedLocation.lat}<br />
              Longitud: {selectedLocation.lng}<br />
              {selectedLocation.address && (
                <>📍 Dirección: {selectedLocation.address}<br /></>
              )}
              {selectedLocation.country && (
                <>🌍 País: {selectedLocation.country}<br /></>
              )}
              {selectedLocation.state && (
                <>🏛️ Estado: {selectedLocation.state}<br /></>
              )}
              {selectedLocation.city && (
                <>🏙️ Ciudad: {selectedLocation.city}</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}