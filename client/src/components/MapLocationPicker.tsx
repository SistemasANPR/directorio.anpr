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

interface MapLocationPickerProps {
  ciudad: string;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number; address: string } | null;
  direccionFisica?: string; // Nueva prop para geocodificación automática
}

export default function MapLocationPicker({ ciudad, onLocationSelect, initialLocation, direccionFisica }: MapLocationPickerProps) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(
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

  // Función para geocodificar dirección usando Google Maps API
  const geocodeAddress = async (address: string) => {
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
        const location = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          address: result.formatted_address
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

      // Evento de clic en el mapa
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        
        // Remover marcador anterior
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        // Crear nuevo marcador
        const marker = L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        
        markerRef.current = marker;

        // Actualizar estado
        const location = {
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)} - ${ciudad}`
        };

        setSelectedLocation(location);
        setManualCoords({
          lat: location.lat.toString(),
          lng: location.lng.toString(),
          address: location.address
        });

        // Notificar al componente padre
        onLocationSelect(location);
      });

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

    const location = {
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
          Seleccionar Ubicación - {ciudad}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botón de referencia de ciudad */}
        <div>
          <Button 
            onClick={useCityReference}
            variant="outline" 
            className="w-full"
            type="button"
          >
            <Globe className="h-4 w-4 mr-2" />
            Centrar en {ciudad.split(',')[0]}
          </Button>
        </div>

        {/* Mapa */}
        <div className="space-y-2">
          <Label>Mapa Interactivo</Label>
          <div 
            ref={mapRef} 
            className="w-full h-64 border rounded-lg"
            style={{ minHeight: '256px' }}
          />
          <p className="text-xs text-gray-500">
            Haz clic en el mapa para seleccionar una ubicación
          </p>
        </div>

        {/* Coordenadas manuales */}
        <div className="space-y-4">
          <Label>Coordenadas Manuales</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitud</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="19.4326"
                value={manualCoords.lat}
                onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
              />
              <p className="text-xs text-gray-500">Rango: -90 a 90</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitud</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="-99.1332"
                value={manualCoords.lng}
                onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
              />
              <p className="text-xs text-gray-500">Rango: -180 a 180</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección o Descripción</Label>
            <Input
              id="address"
              placeholder="Descripción de la ubicación"
              value={manualCoords.address}
              onChange={(e) => setManualCoords(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <Button 
            onClick={handleManualLocationSubmit}
            className="w-full"
            type="button"
            disabled={!manualCoords.lat || !manualCoords.lng}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Confirmar Ubicación
          </Button>
        </div>

        {/* Información actual */}
        {selectedLocation && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Ubicación seleccionada:</strong><br />
              Latitud: {selectedLocation.lat}<br />
              Longitud: {selectedLocation.lng}<br />
              {selectedLocation.address && (
                <>Descripción: {selectedLocation.address}</>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}