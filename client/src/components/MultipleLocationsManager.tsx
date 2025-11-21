import { useState } from "react";
import { MapPin, Plus, Trash2, Edit2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MapLocationPicker from "@/components/MapLocationPicker";
import { useToast } from "@/hooks/use-toast";

interface Location {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  address: string;
  isPrimary: boolean;
}

interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
  country?: string;
  state?: string;
  city?: string;
}

interface MultipleLocationsManagerProps {
  ubicaciones: Location[];
  ciudad: string;
  onChange: (ubicaciones: Location[]) => void;
}

export default function MultipleLocationsManager({
  ubicaciones,
  ciudad,
  onChange,
}: MultipleLocationsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocationName, setNewLocationName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const { toast } = useToast();

  const handleAddLocation = () => {
    if (!selectedLocation) {
      toast({
        title: "Error",
        description: "Por favor selecciona una ubicación en el mapa",
        variant: "destructive",
      });
      return;
    }

    const newLocation: Location = {
      id: crypto.randomUUID(),
      nombre: newLocationName.trim() || "Ubicación sin nombre",
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: selectedLocation.address,
      isPrimary: ubicaciones.length === 0, // Primera ubicación es principal por defecto
    };

    onChange([...ubicaciones, newLocation]);
    setIsAddDialogOpen(false);
    setNewLocationName("");
    setSelectedLocation(null);
    toast({
      title: "Ubicación agregada",
      description: "La nueva ubicación ha sido agregada correctamente",
    });
  };

  const handleEditLocation = () => {
    if (!editingLocation || !selectedLocation) {
      return;
    }

    const updatedLocations = ubicaciones.map((loc) =>
      loc.id === editingLocation.id
        ? {
            ...loc,
            nombre: newLocationName.trim() || loc.nombre,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            address: selectedLocation.address,
          }
        : loc
    );

    onChange(updatedLocations);
    setIsEditDialogOpen(false);
    setEditingLocation(null);
    setNewLocationName("");
    setSelectedLocation(null);
    toast({
      title: "Ubicación actualizada",
      description: "La ubicación ha sido actualizada correctamente",
    });
  };

  const handleDeleteLocation = (id: string) => {
    const locationToDelete = ubicaciones.find((loc) => loc.id === id);
    
    if (locationToDelete?.isPrimary && ubicaciones.length > 1) {
      toast({
        title: "No se puede eliminar",
        description: "No puedes eliminar la ubicación principal. Primero marca otra ubicación como principal.",
        variant: "destructive",
      });
      return;
    }

    const updatedLocations = ubicaciones.filter((loc) => loc.id !== id);
    onChange(updatedLocations);
    setDeleteLocationId(null);
    toast({
      title: "Ubicación eliminada",
      description: "La ubicación ha sido eliminada correctamente",
    });
  };

  const handleSetPrimary = (id: string) => {
    const updatedLocations = ubicaciones.map((loc) => ({
      ...loc,
      isPrimary: loc.id === id,
    }));
    onChange(updatedLocations);
    toast({
      title: "Ubicación principal actualizada",
      description: "Se ha marcado la nueva ubicación principal",
    });
  };

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setNewLocationName(location.nombre);
    setSelectedLocation({
      lat: location.lat,
      lng: location.lng,
      address: location.address,
    });
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    setNewLocationName("");
    setSelectedLocation(null);
    setIsAddDialogOpen(true);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicaciones de la Empresa
            </span>
            <Button
              type="button"
              onClick={openAddDialog}
              size="sm"
              data-testid="button-add-location"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Ubicación
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ubicaciones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay ubicaciones registradas</p>
              <p className="text-sm mt-1">Agrega al menos una ubicación para tu empresa</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ubicaciones.map((location) => (
                <div
                  key={location.id}
                  className={`p-4 rounded-lg border ${
                    location.isPrimary
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                  data-testid={`location-item-${location.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {location.nombre}
                        </h4>
                        {location.isPrimary && (
                          <span className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                            <Star className="h-3 w-3" />
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {location.address}
                      </p>
                      <p className="text-xs text-gray-500">
                        Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!location.isPrimary && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(location.id)}
                          data-testid={`button-set-primary-${location.id}`}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Marcar como principal
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(location)}
                        data-testid={`button-edit-${location.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteLocationId(location.id)}
                        data-testid={`button-delete-${location.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {ubicaciones.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> La ubicación principal se mostrará en el directorio.
                Las demás ubicaciones solo se verán en el perfil de la empresa.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar ubicación */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nueva Ubicación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="location-name">Nombre de la ubicación</Label>
              <Input
                id="location-name"
                placeholder="Ej: Oficina Principal, Sucursal Centro, etc."
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                data-testid="input-location-name"
              />
            </div>
            <MapLocationPicker
              ciudad={ciudad}
              onLocationSelect={setSelectedLocation}
              initialLocation={selectedLocation}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddLocation}
              data-testid="button-confirm-add-location"
            >
              Agregar Ubicación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar ubicación */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ubicación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-location-name">Nombre de la ubicación</Label>
              <Input
                id="edit-location-name"
                placeholder="Ej: Oficina Principal, Sucursal Centro, etc."
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                data-testid="input-edit-location-name"
              />
            </div>
            <MapLocationPicker
              ciudad={ciudad}
              onLocationSelect={setSelectedLocation}
              initialLocation={selectedLocation}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleEditLocation}
              data-testid="button-confirm-edit-location"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para confirmar eliminación */}
      <AlertDialog
        open={deleteLocationId !== null}
        onOpenChange={() => setDeleteLocationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente esta ubicación.
              No podrás deshacer esta acción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLocationId && handleDeleteLocation(deleteLocationId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
