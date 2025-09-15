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
  const [searchValue, setSearchValue] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(
    initialLocation || null
  );
  const [manualCoords, setManualCoords] = useState({
    lat: initialLocation?.lat?.toString() || "",
    lng: initialLocation?.lng?.toString() || "",
    address: initialLocation?.address || ""
  });
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

  // Función para extraer información de ubicación de la respuesta de Nominatim
  const extractLocationInfoFromNominatim = (nominatimResult: any) => {
    let country = '';
    let state = '';
    let city = '';

    // Extraer información del campo address de Nominatim
    if (nominatimResult.address) {
      const addr = nominatimResult.address;
      country = addr.country || '';
      state = addr.state || addr.region || '';
      city = addr.city || addr.town || addr.municipality || addr.village || '';
    } else {
      // Fallback: extraer de display_name
      const displayParts = nominatimResult.display_name?.split(', ') || [];
      if (displayParts.length >= 3) {
        city = displayParts[displayParts.length - 3] || '';
        state = displayParts[displayParts.length - 2] || '';
        country = displayParts[displayParts.length - 1] || '';
      }
    }

    return { country, state, city };
  };

  // Función para geocodificar dirección usando OpenStreetMap Nominatim API
  const geocodeAddress = async (address: string): Promise<LocationInfo | null> => {
    if (!address || address.trim().length < 5) return null;
    
    setIsGeocoding(true);
    try {
      // Usar OpenStreetMap Nominatim API a través del endpoint del backend
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
      
      // Manejar respuesta de Nominatim (puede ser array directo o formato transformado)
      let result;
      if (Array.isArray(data) && data.length > 0) {
        // Respuesta directa de Nominatim: [{ lat: "string", lon: "string", display_name: "string" }]
        result = data[0];
      } else if (data.results && data.results.length > 0) {
        // Respuesta transformada a formato Google Maps API
        const googleResult = data.results[0];
        result = {
          lat: googleResult.geometry.location.lat.toString(),
          lon: googleResult.geometry.location.lng.toString(),
          display_name: googleResult.formatted_address,
          address: googleResult.address_components
        };
      } else {
        console.log('No results found in geocoding response:', data);
        return null;
      }
      
      if (result && result.lat && result.lon) {
        // Extraer información detallada de ubicación usando el método de Nominatim
        const locationInfo = extractLocationInfoFromNominatim(result);
        
        const location: LocationInfo = {
          lat: Number(result.lat),
          lng: Number(result.lon), // Nominatim usa 'lon', no 'lng'
          address: result.display_name || `${result.lat}, ${result.lon}`,
          country: locationInfo.country,
          state: locationInfo.state,
          city: locationInfo.city
        };
        
        console.log('Geocoding successful:', location);
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

      // Evento de clic en el mapa
      // MODO SOLO CONFIRMACIÓN VISUAL - Sin clicks en el mapa
      // El mapa solo muestra la ubicación geocodificada automáticamente
      // map.on('click', (e) => { ... }) - DESHABILITADO PARA SOLO CONFIRMACIÓN

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
      setManualCoords({
        lat: initialLocation.lat.toString(),
        lng: initialLocation.lng.toString(),
        address: initialLocation.address
      });
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
          setManualCoords({
            lat: location.lat.toString(),
            lng: location.lng.toString(),
            address: location.address
          });

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

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert("Por favor ingrese coordenadas válidas");
      return;
    }

    if (lat < -90 || lat > 90) {
      alert("La latitud debe estar entre -90 y 90");
      return;
    }

    if (lng < -180 || lng > 180) {
      alert("La longitud debe estar entre -180 y 180");
      return;
    }

    const location: LocationInfo = {
      lat,
      lng,
      address: manualCoords.address || `${lat}, ${lng} - ${ciudad}`
    };

    // Actualizar mapa si está disponible
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      
      // Remover marcador anterior
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Crear nuevo marcador
      const marker = L.marker([lat, lng])
        .addTo(mapInstanceRef.current)
        .bindPopup(location.address);
      
      markerRef.current = marker;
    }

    setSelectedLocation(location);
    onLocationSelect(location);
  };

  const useCityReference = () => {
    const ref = getCityReference();
    setManualCoords({
      lat: ref.lat.toString(),
      lng: ref.lng.toString(),
      address: ciudad
    });

    // Actualizar mapa si está disponible
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([ref.lat, ref.lng], 12);
      
      // Remover marcador anterior
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Crear nuevo marcador
      const marker = L.marker([ref.lat, ref.lng])
        .addTo(mapInstanceRef.current)
        .bindPopup(`Centro de ${ciudad}`);
      
      markerRef.current = marker;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Confirmación de Ubicación Automática
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información automática */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Ubicación Automática</span>
          </div>
          <p className="text-sm text-blue-700">
            La ubicación se actualiza automáticamente cuando escribes la dirección física. 
            El mapa te muestra dónde se agregará la empresa para confirmación visual.
          </p>
        </div>

        {/* Mapa */}
        <div className="space-y-2">
          <Label>Mapa de Confirmación</Label>
          <div 
            ref={mapRef} 
            className="w-full h-64 border rounded-lg"
            style={{ minHeight: '256px' }}
          />
          <p className="text-xs text-green-600 font-medium">
            ✅ Ubicación mostrada automáticamente desde la dirección física
          </p>
        </div>

        {/* Coordenadas de Solo Lectura */}
        {selectedLocation && (
          <div className="space-y-4">
            <Label>Coordenadas Detectadas</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitud</Label>
                <Input
                  type="text"
                  value={selectedLocation.lat.toFixed(6)}
                  readOnly
                  className="bg-gray-50 text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Longitud</Label>
                <Input
                  type="text"
                  value={selectedLocation.lng.toFixed(6)}
                  readOnly
                  className="bg-gray-50 text-gray-700"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              💡 Estas coordenadas fueron detectadas automáticamente desde la dirección física
            </p>
          </div>
        )}

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