import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Camera, Save, User, Mail, Shield } from "lucide-react";
import { Link } from "wouter";

// Schema para validación del formulario - solo campos básicos
const accountSchema = z.object({
  displayName: z.string().min(1, "El nombre es requerido").max(100, "El nombre es muy largo"),
  email: z.string().email("Email inválido"),
  photoURL: z.string().url("URL inválida").optional().or(z.literal("")),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function ConfigurarCuenta() {
  const { toast } = useToast();
  const { user, isAdmin, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  // No necesitamos query adicional, usamos datos del contexto
  const isLoading = false;

  // Mutation para actualizar cuenta
  const updateAccountMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      const response = await apiRequest("PATCH", "/api/users/me", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cuenta actualizada",
        description: "Tu información de cuenta ha sido actualizada correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      refreshUser();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la cuenta",
        variant: "destructive",
      });
    },
  });

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
      photoURL: user?.photoURL || "",
    },
  });

  // Reset form when user data loads
  useState(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
      });
    }
  });

  const onSubmit = (data: AccountFormData) => {
    updateAccountMutation.mutate(data);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen válida",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "profile");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir la imagen");
      }

      const result = await response.json();
      form.setValue("photoURL", result.url);
      
      toast({
        title: "Imagen subida",
        description: "Imagen de perfil actualizada correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bcce16] mx-auto mb-4"></div>
          <p>Cargando información de cuenta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-8">
          <Link href={isAdmin ? "/dashboard" : "/representative-dashboard"}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Regresar al Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Cuenta</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        {/* Información del usuario */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu información de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Foto de perfil */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage 
                      src={form.watch("photoURL") || user?.photoURL || ""} 
                      alt="Foto de perfil" 
                    />
                    <AvatarFallback className="text-lg">
                      {user?.displayName?.[0] || user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" disabled={isUploading} asChild>
                        <span>
                          <Camera className="w-4 h-4 mr-2" />
                          {isUploading ? "Subiendo..." : "Cambiar Foto"}
                        </span>
                      </Button>
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG hasta 2MB
                    </p>
                  </div>
                </div>

                {/* Nombre completo */}
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ingresa tu nombre completo"
                          {...field}
                          data-testid="input-display-name"
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
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="correo@ejemplo.com"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* URL de foto manual */}
                <FormField
                  control={form.control}
                  name="photoURL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Foto de Perfil (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://ejemplo.com/foto.jpg"
                          {...field}
                          data-testid="input-photo-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Botón de guardar */}
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateAccountMutation.isPending}
                    data-testid="button-save-account"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateAccountMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Información de la cuenta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Información de la Cuenta
            </CardTitle>
            <CardDescription>
              Detalles de tu cuenta y permisos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Rol</label>
                <p className="text-sm text-gray-900 mt-1">
                  {user?.role === 'admin' ? 'Administrador' : 
                   user?.role === 'representante' ? 'Representante' : 'Usuario'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">ID de Usuario</label>
                <p className="text-sm text-gray-900 mt-1 font-mono">{user?.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha de Creación</label>
                <p className="text-sm text-gray-900 mt-1">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'No disponible'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}