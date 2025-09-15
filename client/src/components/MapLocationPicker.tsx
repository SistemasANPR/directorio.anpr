import { useEffect, useState, useRef } from "react";
import { MapPin, Search, Navigation, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader } from "@googlemaps/js-api-loader";

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
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

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
  const extractLocationInfo = (addressComponents: google.maps.GeocoderAddressComponent[]) => {
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

  // Función para geocodificar dirección usando Google Maps Geocoder
  const geocodeAddress = async (address: string): Promise<LocationInfo | null> => {
    if (!address || address.trim().length < 5 || !geocoderRef.current) return null;
    
    setIsGeocoding(true);
    try {
      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoderRef.current!.geocode(
          { address: address.trim() },
          (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      if (results && results.length > 0) {
        const result = results[0];
        
        // Extraer información detallada de ubicación
        const locationInfo = extractLocationInfo(result.address_components || []);
        
        const location: LocationInfo = {
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
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
        
        setMapLoaded(true);
        setMapError(null);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapError('Error al cargar Google Maps. Verifica la configuración de la API key.');
      }
    };

    loadGoogleMaps();
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    try {
      // Obtener coordenadas de referencia de la ciudad
      const cityRef = getCityReference();
      const center = selectedLocation ? 
        { lat: selectedLocation.lat, lng: selectedLocation.lng } : 
        { lat: cityRef.lat, lng: cityRef.lng };

      // Crear el mapa
      const map = new google.maps.Map(mapRef.current, {
        center: center,
        zoom: selectedLocation ? 15 : 10,
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

      // Agregar marcador si hay ubicación inicial
      if (selectedLocation) {
        const marker = new google.maps.Marker({
          position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
          map: map,
          title: selectedLocation.address || `${selectedLocation.lat}, ${selectedLocation.lng}`,
          animation: google.maps.Animation.DROP
        });
        markerRef.current = marker;
      }

      // Evento de clic en el mapa
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        // Remover marcador anterior
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        // Crear nuevo marcador
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: `Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          animation: google.maps.Animation.DROP
        });
        
        markerRef.current = marker;

        // Actualizar estado
        const location: LocationInfo = {
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

    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setMapError('Error al inicializar el mapa. Intenta recargar la página.');
    }
  }, [mapLoaded, selectedLocation]);

  // Actualizar marcador cuando cambie la ubicación inicial
  useEffect(() => {
    if (mapInstanceRef.current && initialLocation && mapLoaded) {
      // Remover marcador anterior
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // Crear nuevo marcador
      const marker = new google.maps.Marker({
        position: { lat: initialLocation.lat, lng: initialLocation.lng },
        map: mapInstanceRef.current,
        title: initialLocation.address || `${initialLocation.lat}, ${initialLocation.lng}`,
        animation: google.maps.Animation.DROP
      });
      
      markerRef.current = marker;
      mapInstanceRef.current.setCenter({ lat: initialLocation.lat, lng: initialLocation.lng });
      mapInstanceRef.current.setZoom(15);

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
          !isGeocoding &&
          geocoderRef.current) {
        
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
            mapInstanceRef.current.setCenter({ lat: location.lat, lng: location.lng });
            mapInstanceRef.current.setZoom(15);
            
            // Remover marcador anterior
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }

            // Crear nuevo marcador
            const marker = new google.maps.Marker({
              position: { lat: location.lat, lng: location.lng },
              map: mapInstanceRef.current,
              title: `📍 ${location.address}`,
              animation: google.maps.Animation.DROP
            });
            
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
      mapInstanceRef.current.setCenter({ lat, lng });
      mapInstanceRef.current.setZoom(15);
      
      // Remover marcador anterior
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // Crear nuevo marcador
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: location.address,
        animation: google.maps.Animation.DROP
      });
      
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
      mapInstanceRef.current.setCenter({ lat: ref.lat, lng: ref.lng });
      mapInstanceRef.current.setZoom(12);
      
      // Remover marcador anterior
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // Crear nuevo marcador
      const marker = new google.maps.Marker({
        position: { lat: ref.lat, lng: ref.lng },
        map: mapInstanceRef.current,
        title: `Centro de ${ciudad}`,
        animation: google.maps.Animation.DROP
      });
      
      markerRef.current = marker;
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, []);

  if (mapError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Error en el Mapa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50 text-red-500" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar el mapa</h3>
            <p className="text-sm text-red-600">{mapError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mapLoaded) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Cargando Mapa...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Inicializando Google Maps</h3>
            <p className="text-sm text-gray-500">Configurando mapa interactivo y geocodificación...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Seleccionar Ubicación - {ciudad}
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-auto">Google Maps</span>
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
            data-testid="map-location-picker"
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
                data-testid="input-latitude"
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
                data-testid="input-longitude"
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
              data-testid="input-address"
            />
          </div>

          <Button 
            onClick={handleManualLocationSubmit}
            className="w-full"
            type="button"
            disabled={!manualCoords.lat || !manualCoords.lng}
            data-testid="button-confirm-location"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Confirmar Ubicación
          </Button>
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