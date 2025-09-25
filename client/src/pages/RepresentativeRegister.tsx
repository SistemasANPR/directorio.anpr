import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Lock, Building, Camera, Upload } from "lucide-react";

const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
  photoURL: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RepresentativeRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signInWithFirebase } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      confirmPassword: "",
      photoURL: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      // First create Firebase account
      const firebaseUser = await signInWithFirebase(data.email, data.password, true);
      
      // Then create user in our database
      const response = await apiRequest("POST", "/api/users", {
        nombre: data.nombre,
        email: data.email,
        firebaseUid: firebaseUser.uid,
        rol: "representante",
        photoURL: data.photoURL || null,
      });
      
      // Update Firebase profile with photo if provided
      if (data.photoURL && firebaseUser) {
        try {
          await updateProfile(firebaseUser, {
            photoURL: data.photoURL
          });
        } catch (error) {
          console.warn('Error updating Firebase profile photo:', error);
        }
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cuenta creada exitosamente",
        description: "Ya puedes proceder con la compra de tu membresía.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      // Redirect back to checkout or dashboard
      setLocation("/representative-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear cuenta",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Error", 
        description: "La imagen no puede ser mayor a 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploadingPhoto(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }
      
      const data = await response.json();
      
      // Set photo URL in form
      form.setValue('photoURL', data.imageUrl);
      
      // Set preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Foto subida exitosamente",
        description: "Tu foto de perfil ha sido guardada",
      });
    } catch (error: any) {
      toast({
        title: "Error al subir foto",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const onSubmit = (data: RegisterFormData) => {
    setIsLoading(true);
    registerMutation.mutate(data);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Crear Cuenta de Representante</h1>
              <p className="text-sm text-gray-600">Regístrate para gestionar tu empresa y membresías</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>Registro de Representante</CardTitle>
            <p className="text-sm text-gray-600">
              Como representante podrás gestionar tu empresa, aprobar comentarios y administrar membresías
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Tu nombre completo"
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="email"
                            placeholder="tu@email.com"
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Photo Upload Field */}
                <FormField
                  control={form.control}
                  name="photoURL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto de Perfil (Opcional)</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {/* Photo Preview */}
                          <div className="flex justify-center">
                            <div className="relative">
                              <Avatar className="w-24 h-24">
                                <AvatarImage 
                                  src={photoPreview || undefined} 
                                  alt="Vista previa de foto"
                                  data-testid="img-photo-preview"
                                />
                                <AvatarFallback className="bg-gray-100 text-gray-400">
                                  <Camera className="w-8 h-8" />
                                </AvatarFallback>
                              </Avatar>
                              {isUploadingPhoto && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                  <div 
                                    className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                                    data-testid="status-uploading"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Upload Button */}
                          <div className="flex justify-center">
                            <label className="relative cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handlePhotoUpload(file);
                                  }
                                }}
                                disabled={isUploadingPhoto}
                                data-testid="input-photo"
                              />
                              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
                                <Upload className="w-4 h-4" />
                                {photoPreview ? 'Cambiar foto' : 'Subir foto'}
                              </div>
                            </label>
                          </div>
                          
                          <p className="text-xs text-gray-500 text-center">
                            Formatos: JPG, PNG, WEBP. Máximo 10MB
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="password"
                            placeholder="Confirma tu contraseña"
                            className="pl-10"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || registerMutation.isPending}
                >
                  {isLoading || registerMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : null}
                  Crear Cuenta
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{" "}
                <button 
                  onClick={() => setLocation("/login-representante")}
                  className="text-blue-600 hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}