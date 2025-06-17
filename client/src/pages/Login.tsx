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
import { Separator } from "@/components/ui/separator";
import { Building, Mail, Lock, Loader2 } from "lucide-react";
import { signInWithEmail, signInWithGoogle, createUserWithEmail } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
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
      if (isSignUp) {
        await createUserWithEmail(data.email, data.password);
        toast({
          title: "Cuenta creada",
          description: "Tu cuenta ha sido creada exitosamente",
        });
        // Redirigir al dashboard después de crear cuenta
        setTimeout(() => setLocation("/dashboard"), 1000);
      } else {
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
          
          // Redirect based on user role
          const userRole = tempResult.user.role?.id || tempResult.user.roleId;
          console.log("User role detected:", userRole, "Full user:", tempResult.user);
          
          if (userRole === 2) { // Representative role
            console.log("Redirecting to representative dashboard");
            setLocation("/representative-dashboard");
          } else {
            console.log("Redirecting to admin dashboard");
            setLocation("/dashboard");
          }
          return;
        }

        // If temporary login failed, check error type
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
      }
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión con Google exitosamente",
      });
      // Redirigir al dashboard después del login con Google
      setTimeout(() => setLocation("/dashboard"), 1000);
    } catch (error: any) {
      console.error("Error detallado de Google Sign-In:", error);
      let errorMessage = "No se pudo iniciar sesión con Google";
      
      if (error.code === "auth/popup-blocked") {
        errorMessage = "El navegador bloqueó la ventana emergente. Permitir ventanas emergentes para este sitio.";
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Ventana de inicio de sesión cerrada por el usuario.";
      } else if (error.code === "auth/unauthorized-domain") {
        errorMessage = "Este dominio no está autorizado para usar Firebase Auth.";
      } else if (error.code === "auth/configuration-not-found") {
        errorMessage = "Configuración de Firebase no encontrada.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Error de autenticación",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <Card className="w-full max-w-md bg-white border border-gray-200 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Building className="text-white text-xl" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center text-primary">AdminPlat</CardTitle>
          <CardDescription className="text-center text-gray-600">
            {isSignUp ? "Crea tu cuenta para comenzar" : "Inicia sesión en tu cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          type="email" 
                          placeholder="tu@email.com" 
                          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
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
                    <FormLabel className="text-gray-700">Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isSignUp && (
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
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
              )}

              <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">O continúa con</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            type="button" 
            className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </Button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gray-600 hover:text-gray-800 hover:underline"
              disabled={isLoading}
            >
              {isSignUp 
                ? "¿Ya tienes cuenta? Inicia sesión" 
                : "¿No tienes cuenta? Créala aquí"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
