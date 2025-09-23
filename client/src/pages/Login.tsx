import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Building, Mail, Lock, Loader2 } from "lucide-react";
import { signInWithEmail, createUserWithEmail } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
        // Try temporary login first (for newly registered users)
        const tempResponse = await fetch('/api/login-temp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: data.email,
            password: data.password
          })
        });

        const tempResult = await tempResponse.json();

        if (tempResponse.ok && tempResult.success) {
          // Store user data for session management
          localStorage.setItem('tempUser', JSON.stringify(tempResult.user));
          
          toast({
            title: "Bienvenido",
            description: data.rememberMe 
              ? "Has iniciado sesión exitosamente. Tu sesión será recordada."
              : "Has iniciado sesión exitosamente",
          });
          
          // Redirect based on user role with a small delay to ensure state update
          const userRole = tempResult.user.role?.id || tempResult.user.roleId;
          const roleString = tempResult.user.role;
          console.log("User role detected:", userRole, "Role string:", roleString, "Full user:", tempResult.user);
          
          // Force page reload to ensure proper state initialization
          setTimeout(() => {
            // Check if user is admin (roleId 1 or role string "admin")
            if (userRole === 1 || roleString === 'admin') {
              console.log("Redirecting to admin dashboard");
              window.location.href = "/dashboard";
            } else if (userRole === 2 || roleString === 'representante') { // Representative role
              console.log("Redirecting to representative dashboard");
              window.location.href = "/representative-dashboard?tab=overview";
            } else {
              console.log("Unknown role, defaulting to admin dashboard");
              window.location.href = "/dashboard";
            }
          }, 500);
          return;
        }

        // If temporary login failed, try Firebase (without Google)
        if (tempResult.error === "Please use Firebase login") {
          try {
            await signInWithEmail(data.email, data.password, data.rememberMe);
            toast({
              title: "Bienvenido",
              description: data.rememberMe 
                ? "Has iniciado sesión exitosamente. Tu sesión será recordada."
                : "Has iniciado sesión exitosamente",
            });
            setTimeout(() => setLocation("/dashboard"), 1000);
            return;
          } catch (firebaseError: any) {
            throw firebaseError;
          }
        }

        // For all other temp login failures, show the error message
        throw new Error(tempResult.error || "Credenciales incorrectas");
    } catch (error: any) {
      let errorMessage = "Ha ocurrido un error";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "No existe una cuenta con este email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Contraseña incorrecta";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "Ya existe una cuenta con este email";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "La contraseña es muy débil";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" data-testid="login-page">
      <Card className="w-full max-w-md bg-white border border-gray-200 shadow-lg">
        <CardHeader className="space-y-1">
          {/* Icono AdminPlat */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-[#1e40af] rounded-lg flex items-center justify-center">
              <Building className="text-white text-xl" />
            </div>
          </div>
          
          {/* Título AdminPlat */}
          <CardTitle className="text-2xl text-center font-semibold text-gray-900">
            AdminPlat
          </CardTitle>
          
          {/* Subtítulo */}
          <CardDescription className="text-center text-gray-600 text-sm">
            Inicia sesión en tu cuenta
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                          placeholder="tu@email.com" 
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

              {/* Checkbox Recordar sesión */}
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-remember"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm text-gray-700">
                        Recordar mi sesión
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Botón Iniciar sesión */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#1e40af] text-white hover:bg-[#1d4ed8] font-medium rounded-md" 
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar sesión
              </Button>
            </form>
          </Form>

          {/* Link inferior para crear cuenta */}
          <div className="text-center text-sm space-y-2">
            <div>
              <span className="text-gray-600">¿No tienes cuenta? </span>
              <button
                type="button"
                onClick={() => window.location.href = "/planes#elige-tu-plan"}
                className="text-blue-600 hover:text-blue-800 hover:underline"
                disabled={isLoading}
                data-testid="link-signup"
              >
                Crea aquí
              </button>
            </div>
            
            {/* Enlace discreto para administradores */}
            <div>
              <button
                type="button"
                onClick={() => setLocation("/admin-register")}
                className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
                disabled={isLoading}
                data-testid="link-admin-register"
              >
                Acceso de administrador
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}