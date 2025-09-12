import { useEffect, useState, useRef } from "react";
import { MapPin, Plus, Trash2, Navigation, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "@googlemaps/js-api-loader";

interface UbicacionAdicional {
  address: string;
  lat: number;
  lng: number;
  name?: string;
}

interface MultiLocationManagerProps {
  value: UbicacionAdicional[];
  onChange: (locations: UbicacionAdicional[]) => void;
  disabled?: boolean;
}

export default function MultiLocationManager({ 
  value = [], 
  onChange, 
  disabled = false 
}: MultiLocationManagerProps) {
  const [locations, setLocations] = useState<UbicacionAdicional[]>(value);
  const [newAddress, setNewAddress] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

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
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        city = component.long_name;
      }
    }

    return { country, state, city };
  };

  // Geocodificación usando Google Maps API
  const geocodeAddress = async (address: string): Promise<UbicacionAdicional | null> => {
    if (!window.google?.maps) {
      console.error('Google Maps API no está cargada');
      return null;
    }

    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const result = results[0];
          const location = result.geometry.location;
          const locationInfo = extractLocationInfo(result.address_components);
          
          resolve({
            address: result.formatted_address,
            lat: location.lat(),
            lng: location.lng(),
            name: newLocationName || undefined
          });
        } else {
          console.error('Geocodificación fallida:', status);
          resolve(null);
        }
      });
    });
  };

  // Inicializar mapa
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        await loader.load();
        
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 19.4326, lng: -99.1332 }, // Ciudad de México por defecto
          zoom: 6,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);

        // Añadir marcadores existentes
        updateMapMarkers();
        
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError('Error al cargar Google Maps. Verifica tu conexión a internet.');
      }
    };

    initMap();

    return () => {
      // Cleanup
      if (mapInstanceRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
    };
  }, []);

  // Actualizar marcadores en el mapa
  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Agregar nuevos marcadores
    locations.forEach((location, index) => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: mapInstanceRef.current,
        title: location.name || location.address,
        label: (index + 1).toString()
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold">${location.name || 'Ubicación'}</h3>
            <p class="text-sm text-gray-600">${location.address}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Ajustar vista del mapa para mostrar todos los marcadores
    if (locations.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(location => {
        bounds.extend({ lat: location.lat, lng: location.lng });
      });
      mapInstanceRef.current.fitBounds(bounds);
      
      // Si solo hay un marcador, hacer zoom apropiado
      if (locations.length === 1) {
        mapInstanceRef.current.setZoom(15);
      }
    }
  };

  // Efectos para sincronizar con cambios externos
  useEffect(() => {
    setLocations(value);
  }, [value]);

  useEffect(() => {
    updateMapMarkers();
  }, [locations, mapLoaded]);

  // Agregar nueva ubicación
  const handleAddLocation = async () => {
    if (!newAddress.trim()) {
      setError('Por favor ingresa una dirección válida');
      return;
    }

    setIsGeocoding(true);
    setError(null);

    try {
      const geocodedLocation = await geocodeAddress(newAddress);
      
      if (geocodedLocation) {
        const newLocations = [...locations, geocodedLocation];
        setLocations(newLocations);
        onChange(newLocations);
        setNewAddress("");
        setNewLocationName("");
      } else {
        setError('No se pudo encontrar la dirección. Intenta con una dirección más específica.');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setError('Error al buscar la dirección. Intenta nuevamente.');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Eliminar ubicación
  const handleRemoveLocation = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index);
    setLocations(newLocations);
    onChange(newLocations);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Ubicaciones Adicionales de la Empresa
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Agrega múltiples direcciones donde se encuentra la empresa. Estas aparecerán en el mapa del directorio.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Formulario para agregar nueva ubicación */}
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <Label htmlFor="location-name">Nombre de la ubicación (opcional)</Label>
          <Input
            id="location-name"
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            placeholder="Ej: Oficina Principal, Sucursal Norte, etc."
            disabled={disabled || isGeocoding}
          />
          
          <Label htmlFor="new-address">Dirección *</Label>
          <div className="flex gap-2">
            <Input
              id="new-address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Ej: Av. Paseo de la Reforma 123, Ciudad de México"
              disabled={disabled || isGeocoding}
              onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
            />
            <Button 
              onClick={handleAddLocation}
              disabled={disabled || isGeocoding || !newAddress.trim()}
              className="shrink-0"
            >
              {isGeocoding ? (
                <Navigation className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isGeocoding ? 'Buscando...' : 'Agregar'}
            </Button>
          </div>
        </div>

        {/* Lista de ubicaciones */}
        {locations.length > 0 && (
          <div className="space-y-2">
            <Label>Ubicaciones agregadas ({locations.length})</Label>
            {locations.map((location, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border rounded-lg bg-white"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    {location.name && (
                      <span className="font-medium text-sm">{location.name}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                  <p className="text-xs text-gray-400">
                    Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveLocation(index)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Mapa */}
        <div className="space-y-2">
          <Label>Vista del mapa</Label>
          <div 
            ref={mapRef} 
            className="w-full h-64 border rounded-lg bg-gray-100 flex items-center justify-center"
          >
            {!mapLoaded && (
              <div className="text-center text-gray-500">
                <Navigation className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p>Cargando mapa...</p>
              </div>
            )}
          </div>
          {locations.length === 0 && mapLoaded && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Agrega ubicaciones para verlas en el mapa
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}