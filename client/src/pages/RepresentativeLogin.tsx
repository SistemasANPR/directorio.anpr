import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Mail, Lock, Building } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function RepresentativeLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signInWithFirebase } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      // First try the temporary login for newly registered users
      const tempLoginResponse = await fetch("/api/login-temp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (tempLoginResponse.ok) {
        const userData = await tempLoginResponse.json();
        
        // Store user data in localStorage for session management
        localStorage.setItem('tempUser', JSON.stringify(userData.user));
        
        console.log("User role detected:", userData.user.roleId, "Full user:", userData.user);
        console.log("Redirecting to representative dashboard");
        
        toast({
          title: "Sesión iniciada exitosamente",
          description: "Bienvenido de vuelta",
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        // Force immediate redirect using window.location
        window.location.href = "/representative-dashboard?tab=overview";
        return;
      }

      // If temp login fails, try Firebase authentication
      try {
        await signInWithFirebase(data.email, data.password, false);
        
        toast({
          title: "Sesión iniciada exitosamente",
          description: "Bienvenido de vuelta",
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setLocation("/representative-dashboard?tab=overview");
      } catch (firebaseError) {
        throw new Error("Email o contraseña incorrectos");
      }
      
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Email o contraseña incorrectos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
              <h1 className="text-xl font-bold text-gray-900">Iniciar Sesión</h1>
              <p className="text-sm text-gray-600">Accede a tu cuenta de representante</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>Acceso para Representantes</CardTitle>
            <p className="text-sm text-gray-600">
              Inicia sesión para gestionar tu empresa y membresías
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            placeholder="Tu contraseña"
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
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : null}
                  Iniciar Sesión
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{" "}
                <button 
                  onClick={() => setLocation("/registro-representante")}
                  className="text-blue-600 hover:underline"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}