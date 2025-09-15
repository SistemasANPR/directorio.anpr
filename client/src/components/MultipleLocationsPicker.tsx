import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Plus, Trash2 } from "lucide-react";
import MapLocationPicker from "./MapLocationPicker";

interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
  country?: string;
  state?: string;
  city?: string;
  nombre?: string; // Nombre opcional para identificar la ubicación
}

interface MultipleLocationsPickerProps {
  locations: LocationInfo[];
  onLocationsChange: (locations: LocationInfo[]) => void;
  direccionFisica?: string; // Para geocodificación automática de la primera ubicación
}

export default function MultipleLocationsPicker({ 
  locations, 
  onLocationsChange, 
  direccionFisica 
}: MultipleLocationsPickerProps) {
  const [expandedLocation, setExpandedLocation] = useState<number | null>(null);

  const addLocation = () => {
    const newLocation: Partial<LocationInfo> = {
      nombre: `Ubicación ${locations.length + 1}`
    };
    onLocationsChange([...locations, newLocation as LocationInfo]);
    setExpandedLocation(locations.length); // Expandir la nueva ubicación
  };

  const removeLocation = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index);
    onLocationsChange(newLocations);
    if (expandedLocation === index) {
      setExpandedLocation(null);
    } else if (expandedLocation !== null && expandedLocation > index) {
      setExpandedLocation(expandedLocation - 1);
    }
  };

  const updateLocation = (index: number, updates: Partial<LocationInfo>) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], ...updates };
    onLocationsChange(newLocations);
  };

  const updateLocationName = (index: number, nombre: string) => {
    updateLocation(index, { nombre });
  };

  const handleLocationSelect = (index: number, location: Omit<LocationInfo, 'nombre'>) => {
    updateLocation(index, location);
  };

  return (
    <div className="space-y-4" data-testid="multiple-locations-picker">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4" />
          Ubicaciones de la Empresa
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLocation}
          className="flex items-center gap-2"
          data-testid="button-add-location"
        >
          <Plus className="h-4 w-4" />
          Agregar Ubicación
        </Button>
      </div>

      {locations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No hay ubicaciones agregadas</p>
          <p className="text-sm">Haz clic en "Agregar Ubicación" para empezar</p>
        </div>
      )}

      <div className="space-y-3">
        {locations.map((location, index) => (
          <Card key={index} className="relative" data-testid={`location-card-${index}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <Input
                    value={location.nombre || `Ubicación ${index + 1}`}
                    onChange={(e) => updateLocationName(index, e.target.value)}
                    className="h-7 border-none px-0 font-medium"
                    placeholder={`Ubicación ${index + 1}`}
                    data-testid={`input-location-name-${index}`}
                  />
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedLocation(expandedLocation === index ? null : index)}
                    data-testid={`button-toggle-location-${index}`}
                  >
                    {expandedLocation === index ? "Ocultar" : "Editar"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLocation(index)}
                    className="text-red-500 hover:text-red-700"
                    data-testid={`button-remove-location-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {location.lat && location.lng && (
                <div className="text-xs text-gray-600">
                  📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  {location.address && (
                    <span className="block mt-1">📍 {location.address}</span>
                  )}
                </div>
              )}
            </CardHeader>

            {expandedLocation === index && (
              <CardContent className="pt-0">
                <div className="border rounded-lg overflow-hidden h-64">
                  <MapLocationPicker
                    ciudad={"México"}
                    // Solo usar direccionFisica para la primera ubicación
                    direccionFisica={index === 0 ? direccionFisica : undefined}
                    onLocationSelect={(locationData) => handleLocationSelect(index, locationData)}
                    initialLocation={location.lat && location.lng ? {
                      lat: location.lat,
                      lng: location.lng,
                      address: location.address || "",
                      country: location.country,
                      state: location.state,
                      city: location.city
                    } : null}
                  />
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {index === 0 && direccionFisica ? (
                    "💡 Esta ubicación se geocodificará automáticamente usando la dirección física"
                  ) : (
                    "💡 Escribe una dirección o haz clic en el mapa para seleccionar la ubicación"
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {locations.length > 0 && (
        <div className="text-xs text-gray-500 mt-4">
          💡 Tip: Puedes agregar múltiples ubicaciones si tu empresa tiene oficinas, sucursales o puntos de venta en diferentes lugares.
        </div>
      )}
    </div>
  );
}