import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MapLocationPicker from "./MapLocationPicker";

interface Location {
  id?: number;
  lat: number;
  lng: number;
  address: string;
  country?: string;
  state?: string;
  city?: string;
  isPrincipal: boolean;
}

interface MultiLocationPickerProps {
  companyId?: number;
  initialLocations?: Location[];
  onChange: (locations: Location[]) => void;
}

export default function MultiLocationPicker({ 
  companyId, 
  initialLocations = [], 
  onChange 
}: MultiLocationPickerProps) {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [showAddLocation, setShowAddLocation] = useState(false);

  useEffect(() => {
    if (initialLocations.length > 0) {
      setLocations(initialLocations);
    } else {
      // Si no hay ubicaciones iniciales, agregar una ubicación principal vacía
      setLocations([{
        lat: 19.4326,
        lng: -99.1332,
        address: "",
        isPrincipal: true
      }]);
    }
  }, [initialLocations]);

  useEffect(() => {
    onChange(locations);
  }, [locations, onChange]);

  const addLocation = () => {
    const newLocation: Location = {
      lat: 19.4326,
      lng: -99.1332,
      address: "",
      isPrincipal: false
    };
    setLocations([...locations, newLocation]);
    setShowAddLocation(false);
  };

  const updateLocation = (index: number, updatedLocation: Partial<Location>) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], ...updatedLocation };
    setLocations(newLocations);
  };

  const removeLocation = (index: number) => {
    if (locations.length === 1) {
      return; // No permitir eliminar la última ubicación
    }
    
    const newLocations = locations.filter((_, i) => i !== index);
    
    // Si eliminamos la ubicación principal, hacer la primera ubicación la nueva principal
    if (locations[index].isPrincipal && newLocations.length > 0) {
      newLocations[0].isPrincipal = true;
    }
    
    setLocations(newLocations);
  };

  const setPrincipal = (index: number) => {
    const newLocations = locations.map((loc, i) => ({
      ...loc,
      isPrincipal: i === index
    }));
    setLocations(newLocations);
  };

  return (
    <div className="space-y-6">
      {locations.map((location, index) => (
        <Card 
          key={index} 
          className={`${location.isPrincipal ? 'border-2 border-blue-500 shadow-lg' : 'border border-gray-200'}`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {location.isPrincipal ? (
                  <span className="flex items-center gap-2">
                    Ubicación Principal
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </span>
                ) : (
                  <span>Ubicación {index + 1}</span>
                )}
              </CardTitle>
              <div className="flex gap-2">
                {!location.isPrincipal && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrincipal(index)}
                    className="text-blue-600 hover:text-blue-700"
                    title="Marcar como principal"
                  >
                    <StarOff className="h-4 w-4" />
                  </Button>
                )}
                {locations.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeLocation(index)}
                    className="text-red-600 hover:text-red-700"
                    title="Eliminar ubicación"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] bg-white border border-gray-200 rounded-lg overflow-hidden">
              <MapLocationPicker
                ciudad="México"
                onLocationSelect={(selectedLocation) => {
                  updateLocation(index, {
                    lat: selectedLocation.lat,
                    lng: selectedLocation.lng,
                    address: selectedLocation.address,
                    country: selectedLocation.country,
                    state: selectedLocation.state,
                    city: selectedLocation.city
                  });
                }}
                initialLocation={location}
              />
            </div>
            {location.address && (
              <div className="text-xs text-gray-600 mt-2">
                📍 {location.address}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addLocation}
          className="flex items-center gap-2"
          data-testid="button-add-location"
        >
          <Plus className="h-4 w-4" />
          Agregar ubicación
        </Button>
      </div>
    </div>
  );
}
