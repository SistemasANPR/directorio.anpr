import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building, MapPin, User, Globe } from "lucide-react";

// Lista de países comunes
const paises = [
  "México",
  "Estados Unidos",
  "Guatemala", 
  "Belice",
  "Honduras",
  "El Salvador",
  "Nicaragua",
  "Costa Rica",
  "Panamá",
  "Colombia",
  "Venezuela",
  "Argentina",
  "Brasil",
  "Chile",
  "Perú",
  "Ecuador",
  "Bolivia",
  "Uruguay",
  "Paraguay",
  "España",
  "Otros"
];

// Esquema de validación con campos obligatorios
const registrationSchema = z.object({
  nombreEmpresa: z.string().min(1, "El nombre de la empresa es obligatorio"),
  representante: z.string().min(1, "El nombre del representante es obligatorio"),
  pais: z.string().min(1, "El país es obligatorio"),
  ciudad: z.string().min(1, "La ciudad es obligatoria"),
  email: z.string().email("Email inválido").min(1, "El email es obligatorio"),
  telefono: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface CompanyRegistrationFormProps {
  onSuccess?: () => void;
}

// Función para geocodificar ciudad y país
const geocodeLocation = async (ciudad: string, pais: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const query = `${ciudad}, ${pais}`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
};

export default function CompanyRegistrationForm({ onSuccess }: CompanyRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      nombreEmpresa: "",
      representante: "",
      pais: "",
      ciudad: "",
      email: "",
      telefono: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      setIsLoading(true);
      
      // Geocodificar la ubicación
      const location = await geocodeLocation(data.ciudad, data.pais);
      
      // Preparar datos para enviar al servidor
      const companyData = {
        nombreEmpresa: data.nombreEmpresa,
        email1: data.email,
        telefono1: data.telefono || "",
        paisesPresencia: [data.pais],
        ciudadesPresencia: [data.ciudad],
        ubicacionGeografica: location ? { lat: location.lat, lng: location.lng } : null,
        direccionFisica: `${data.ciudad}, ${data.pais}`,
        representantesVentas: [data.representante], // Array con el representante
        descripcionEmpresa: "Empresa registrada a través del formulario de registro público",
        estado: "activo",
      };

      const response = await apiRequest("POST", "/api/companies/register", companyData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Empresa registrada exitosamente!",
        description: "Tu empresa ha sido agregada al directorio y aparecerá en el mapa.",
      });
      
      // Limpiar formulario
      form.reset();
      
      // Invalidar cache para actualizar el mapa
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrar empresa",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = (data: RegistrationFormData) => {
    // Validación adicional de campos obligatorios
    if (!data.pais || !data.ciudad) {
      toast({
        title: "Campos obligatorios faltantes",
        description: "País y ciudad son campos obligatorios",
        variant: "destructive",
      });
      return;
    }
    
    registerMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Registro de Empresa
        </CardTitle>
        <p className="text-sm text-gray-600">
          Registra tu empresa en nuestro directorio. Los campos marcados con * son obligatorios.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nombre de la empresa */}
            <FormField
              control={form.control}
              name="nombreEmpresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Nombre de la Empresa *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Constructora ABC S.A."
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Representante */}
            <FormField
              control={form.control}
              name="representante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nombre del Representante *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Juan Pérez"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* País */}
            <FormField
              control={form.control}
              name="pais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    País *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un país" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paises.map((pais) => (
                        <SelectItem key={pais} value={pais}>
                          {pais}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ciudad */}
            <FormField
              control={form.control}
              name="ciudad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ciudad *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Ciudad de México, Guadalajara, Monterrey"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de contacto *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="contacto@empresa.com"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Teléfono (opcional) */}
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+52 55 1234 5678"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botón de envío */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || registerMutation.isPending}
            >
              {isLoading || registerMutation.isPending ? "Registrando..." : "Registrar Empresa"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}