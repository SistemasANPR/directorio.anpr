import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Mail, Lock, Shield } from "lucide-react";

const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
  adminKey: z.string().min(1, "La clave de administrador es requerida"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function AdminRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      confirmPassword: "",
      adminKey: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      // Verify admin key first
      if (data.adminKey !== "ANPR_ADMIN_2025") {
        throw new Error("Clave de administrador incorrecta");
      }

      // First create Firebase account
      const firebaseUser = await createUserWithEmail(data.email, data.password);
      
      // Then create user in our database with admin role
      const response = await apiRequest("POST", "/api/users", {
        firebaseUid: firebaseUser.uid,
        email: data.email,
        displayName: data.nombre,
        photoURL: "",
        role: "admin",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        autoRenewal: false
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cuenta de administrador creada exitosamente",
        description: "Ya puedes iniciar sesión con tus credenciales.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Redirect to login page
      setTimeout(() => setLocation("/login"), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear cuenta",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerMutation.mutateAsync(data);
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" data-testid="admin-register-page">
      <div className="w-full max-w-md">
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="space-y-1">
            {/* Icono AdminPlat */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-[#1e40af] rounded-lg flex items-center justify-center">
                <Shield className="text-white text-xl" />
              </div>
            </div>
            
            {/* Título */}
            <CardTitle className="text-2xl text-center font-semibold text-gray-900">
              Registro de Administrador
            </CardTitle>
            
            {/* Subtítulo */}
            <p className="text-center text-gray-600 text-sm">
              Crea una cuenta con privilegios de administrador
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Campo Nombre */}
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Nombre completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="text" 
                            placeholder="Tu nombre completo" 
                            className="pl-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 rounded-md"
                            {...field} 
                            data-testid="input-nombre"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="email" 
                            placeholder="admin@ejemplo.com" 
                            className="pl-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 rounded-md"
                            {...field} 
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Contraseña */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 rounded-md"
                            {...field} 
                            data-testid="input-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Confirmar Contraseña */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Confirmar contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 rounded-md"
                            {...field} 
                            data-testid="input-confirm-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo Clave de Administrador */}
                <FormField
                  control={form.control}
                  name="adminKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Clave de administrador</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="password" 
                            placeholder="Clave secreta de administrador" 
                            className="pl-10 h-12 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 rounded-md"
                            {...field} 
                            data-testid="input-admin-key"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Botón Crear cuenta */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#1e40af] text-white hover:bg-[#1d4ed8] font-medium rounded-md" 
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading && <span className="mr-2 animate-spin">⏳</span>}
                  Crear cuenta de administrador
                </Button>
              </form>
            </Form>

            {/* Links de navegación */}
            <div className="space-y-4">
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="inline-flex items-center text-gray-600 hover:text-gray-800 hover:underline"
                  disabled={isLoading}
                  data-testid="link-back-to-login"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}