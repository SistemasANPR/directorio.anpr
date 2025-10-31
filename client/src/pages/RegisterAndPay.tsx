import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Building, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Crown,
  Star,
  Mail,
  Phone,
  MapPin,
  Camera,
  Upload
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MapLocationPicker from "@/components/MapLocationPicker";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('VITE_STRIPE_PUBLIC_KEY no está configurada');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Schemas for each step
const userSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(10, "Teléfono debe tener al menos 10 dígitos"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
  photoURL: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const companySchema = z.object({
  nombreEmpresa: z.string().min(2, "El nombre de la empresa es requerido"),
  email1: z.string().email("Email inválido"),
  telefono1: z.string().min(10, "Teléfono debe tener al menos 10 dígitos"),
  descripcionEmpresa: z.string().min(20, "La descripción debe tener al menos 20 caracteres"),
  sitioWeb: z.string().url("URL inválida").optional().or(z.literal("")),
  ubicacionGeografica: z.any().refine((val) => val && val.lat && val.lng, {
    message: "Debes seleccionar una ubicación en el mapa haciendo clic",
  }),
});

type UserFormData = z.infer<typeof userSchema>;
type CompanyFormData = z.infer<typeof companySchema>;

interface MembershipType {
  id: number;
  nombrePlan: string;
  descripcionPlan: string;
  opcionesPrecios: Array<{
    periodicidad: string;
    costo: number;
  }>;
  beneficios: string;
}

const steps = [
  { id: 1, title: "Datos Personales", icon: User },
  { id: 2, title: "Datos de Empresa", icon: Building },
  { id: 3, title: "Seleccionar Plan", icon: Crown },
  { id: 4, title: "Pago", icon: CreditCard },
  { id: 5, title: "Confirmación", icon: CheckCircle },
];

function PaymentForm({ 
  clientSecret, 
  onSuccess, 
  onError, 
  isProcessing,
  onGoBack
}: { 
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  onGoBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Sistema de pago no disponible. Por favor, recarga la página.");
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/registro-exitoso`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Stripe payment error:", error);
        onError(error.message || "Error en el proceso de pago");
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      } else {
        onError("El pago no se completó correctamente. Por favor, inténtalo de nuevo.");
      }
    } catch (err) {
      console.error("Payment confirmation error:", err);
      onError("Error inesperado durante el pago. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          type="button"
          variant="outline"
          onClick={onGoBack}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Editar
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="w-full sm:flex-1"
          style={{ backgroundColor: '#bcce16' }}
        >
          {isProcessing ? "Procesando..." : "Completar Pago"}
        </Button>
      </div>
    </form>
  );
}

export default function RegisterAndPay() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState<UserFormData | null>(null);
  const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);
  const [selectedMembership, setSelectedMembership] = useState<MembershipType | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"mensual" | "anual">("anual");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [ubicacionGeografica, setUbicacionGeografica] = useState<any>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Detectar si viene con un plan preseleccionado
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedPlanId = urlParams.get('plan');

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      password: "",
      confirmPassword: "",
      photoURL: "",
    },
  });

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nombreEmpresa: "",
      email1: "",
      telefono1: "",
      descripcionEmpresa: "",
      sitioWeb: "",
      ubicacionGeografica: null,
    },
  });

  // Efecto para limpiar campos cuando se llega al paso 2
  useEffect(() => {
    if (currentStep === 2) {
      companyForm.reset({
        nombreEmpresa: "",
        email1: "",
        telefono1: "",
        descripcionEmpresa: "",
        sitioWeb: "",
        ubicacionGeografica: null,
      });
      setUbicacionGeografica(null);
    }
  }, [currentStep, companyForm]);

  // Fetch membership types
  const { data: memberships = [], isLoading: isLoadingMemberships } = useQuery<MembershipType[]>({
    queryKey: ["/api/membership-types/public"],
  });

  // Effect para manejar plan preseleccionado
  useEffect(() => {
    if (preselectedPlanId && memberships.length > 0 && !selectedMembership) {
      const preselectedPlan = memberships.find((m: MembershipType) => m.id.toString() === preselectedPlanId);
      if (preselectedPlan) {
        setSelectedMembership(preselectedPlan);
      }
    }
  }, [preselectedPlanId, memberships, selectedMembership]);

  // Create payment intent
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMembership) throw new Error("No membership selected");
      
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        membershipTypeId: selectedMembership.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setCurrentStep(4);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el pago",
        variant: "destructive",
      });
    },
  });

  // Complete registration
  const completeRegistrationMutation = useMutation({
    mutationFn: async () => {
      if (!userData || !companyData || !selectedMembership) {
        throw new Error("Datos incompletos");
      }

      const paymentIntentId = clientSecret.includes('_secret_') 
        ? clientSecret.split('_secret_')[0] 
        : clientSecret;

      console.log("Completing registration with:", {
        userData,
        companyData,
        membershipTypeId: selectedMembership.id,
        selectedPeriod,
        paymentIntentId
      });

      const response = await apiRequest("POST", "/api/complete-registration", {
        userData,
        companyData,
        membershipTypeId: selectedMembership.id,
        selectedPeriod,
        paymentIntentId,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.userMessage || errorData.error || "Error al completar el registro";
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      setCurrentStep(5);
      toast({
        title: "¡Registro Exitoso!",
        description: "Tu cuenta y empresa han sido creadas correctamente",
      });
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
      toast({
        title: "Error en el Registro",
        description: error.message || "Error al completar el registro",
        variant: "destructive",
      });
      setIsProcessing(false);
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
      userForm.setValue('photoURL', data.imageUrl);
      
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

  const handleUserSubmit = async (data: UserFormData) => {
    try {
      // Verificar si el correo ya está registrado
      const checkResponse = await apiRequest("POST", "/api/check-email", {
        email: data.email
      });
      
      const checkData = await checkResponse.json();
      
      if (checkData.exists) {
        toast({
          title: "Correo Electrónico Ya Registrado",
          description: "Ya existe una cuenta con este correo electrónico. Si ya tienes una cuenta, inicia sesión en lugar de registrarte nuevamente.",
          variant: "destructive",
        });
        return;
      }
      
      setUserData(data);
      setCurrentStep(2);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo verificar el correo electrónico. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleCompanySubmit = (data: CompanyFormData) => {
    const companyDataWithLocation = {
      ...data,
      direccionFisica: data.ubicacionGeografica?.address || "Ubicación seleccionada en el mapa",
      ubicacionGeografica: data.ubicacionGeografica,
    };
    setCompanyData(companyDataWithLocation);
    // Siempre ir al paso 3 para verificación del plan
    setCurrentStep(3);
  };

  const handleMembershipSelect = (membership: MembershipType) => {
    setSelectedMembership(membership);
    // No ir automáticamente al pago, dejar que el usuario verifique primero
  };

  const handlePaymentSuccess = () => {
    setIsProcessing(true);
    completeRegistrationMutation.mutate();
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Error en el Pago",
      description: error,
      variant: "destructive",
    });
  };

  const getSelectedPrice = (membership: MembershipType) => {
    const option = membership.opcionesPrecios.find(
      opt => opt.periodicidad.toLowerCase() === selectedPeriod
    ) || membership.opcionesPrecios[0];
    return option?.costo || 0;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+52 777 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Photo Upload Field */}
              <FormField
                control={userForm.control}
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
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Repite tu contraseña" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" style={{ backgroundColor: '#bcce16' }}>
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        );

      case 2:
        return (
          <Form {...companyForm}>
            {/* Campos falsos para engañar al navegador */}
            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
              <input type="text" name="fake_name" tabIndex={-1} autoComplete="off" />
              <input type="email" name="fake_email" tabIndex={-1} autoComplete="off" />
              <input type="tel" name="fake_phone" tabIndex={-1} autoComplete="off" />
            </div>
            <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)} className="space-y-4" autoComplete="new-password">
              <FormField
                control={companyForm.control}
                name="nombreEmpresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nombre de tu empresa" 
                        autoComplete="nope"
                        readOnly
                        onFocus={(e) => {
                          e.target.removeAttribute('readonly');
                          if (e.target.value && e.target.value !== '') {
                            e.target.value = '';
                            field.onChange('');
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={companyForm.control}
                name="email1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de la Empresa</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="contacto@empresa.com" 
                        autoComplete="nope"
                        readOnly
                        onFocus={(e) => {
                          e.target.removeAttribute('readonly');
                          if (e.target.value && e.target.value !== '') {
                            e.target.value = '';
                            field.onChange('');
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={companyForm.control}
                name="telefono1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de la Empresa</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+52 777 123 4567" 
                        autoComplete="nope"
                        readOnly
                        onFocus={(e) => {
                          e.target.removeAttribute('readonly');
                          if (e.target.value && e.target.value !== '') {
                            e.target.value = '';
                            field.onChange('');
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sección de Selección de Ubicación en Mapa */}
              <FormField
                control={companyForm.control}
                name="ubicacionGeografica"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Ubicación de la Empresa
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* Instrucciones */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            📍 Haz clic en el mapa para seleccionar la ubicación exacta de tu empresa. Puedes mover el marcador haciendo clic en otra posición.
                          </p>
                        </div>

                        {/* Mapa */}
                        <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                          <MapLocationPicker
                            ciudad="México"
                            onLocationSelect={(location) => {
                              setUbicacionGeografica(location);
                              field.onChange(location);
                            }}
                            initialLocation={ubicacionGeografica}
                          />
                        </div>

                        {/* Mostrar ubicación seleccionada */}
                        {ubicacionGeografica && (
                          <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                              ✓ Ubicación seleccionada:
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {ubicacionGeografica.address || `${ubicacionGeografica.lat}, ${ubicacionGeografica.lng}`}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Coordenadas: {ubicacionGeografica.lat.toFixed(6)}, {ubicacionGeografica.lng.toFixed(6)}
                            </p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={companyForm.control}
                name="descripcionEmpresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción de la Empresa</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe tu empresa, servicios o productos..." 
                        rows={4}
                        autoComplete="nope"
                        readOnly
                        onFocus={(e) => {
                          e.target.removeAttribute('readonly');
                          if (e.target.value && e.target.value !== '') {
                            e.target.value = '';
                            field.onChange('');
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={companyForm.control}
                name="sitioWeb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sitio Web (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://www.empresa.com" 
                        autoComplete="nope"
                        readOnly
                        onFocus={(e) => {
                          e.target.removeAttribute('readonly');
                          if (e.target.value && e.target.value !== '') {
                            e.target.value = '';
                            field.onChange('');
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button type="submit" className="flex-1" style={{ backgroundColor: '#bcce16' }}>
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Verificar y Seleccionar Plan de Membresía</h3>
              <p className="text-gray-600">Confirma tu plan y elige la periodicidad de pago</p>
            </div>

            {isLoadingMemberships ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-[#bcce16] border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-600">Cargando planes de membresía...</p>
              </div>
            ) : (
              <>
                <div className="flex gap-4 justify-center mb-6">
                  <Button
                    variant={selectedPeriod === "mensual" ? "default" : "outline"}
                    onClick={() => setSelectedPeriod("mensual")}
                  >
                    Mensual
                  </Button>
                  <Button
                    variant={selectedPeriod === "anual" ? "default" : "outline"}
                    onClick={() => setSelectedPeriod("anual")}
                    style={{ backgroundColor: selectedPeriod === "anual" ? '#bcce16' : undefined }}
                  >
                    Anual <Badge variant="secondary" className="ml-2">Ahorra 15%</Badge>
                  </Button>
                </div>

                {selectedMembership ? (
              // Mostrar plan preseleccionado con verificación
              <div className="space-y-6">
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-blue-800 font-semibold">
                      Plan Preseleccionado - Verificar Antes de Pagar
                    </p>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    Revisa los detalles y cambia la periodicidad si lo deseas
                  </p>
                </div>
                
                {/* Verificación del plan seleccionado - NUEVA FUNCIONALIDAD */}
                <Card className="border-4 border-orange-400 bg-orange-50 shadow-lg">
                  <CardHeader className="bg-orange-100">
                    <CardTitle className="text-orange-800 flex items-center gap-2 text-lg">
                      <CheckCircle className="h-6 w-6" />
                      🔍 VERIFICAR TU SELECCIÓN
                    </CardTitle>
                    <p className="text-orange-700 text-sm">Confirma los detalles antes del pago</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4 bg-white p-4 rounded-lg">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Plan:</span>
                        <span className="text-[#bcce16] font-bold">{selectedMembership.nombrePlan}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Periodicidad:</span>
                        <span className="capitalize font-bold text-blue-600">{selectedPeriod}</span>
                      </div>
                      <div className="flex justify-between text-xl">
                        <span className="font-bold">Precio Final:</span>
                        <span className="font-bold text-[#bcce16] text-2xl">
                          ${getSelectedPrice(selectedMembership).toLocaleString()} {selectedPeriod === "anual" ? "MXN/año" : "MXN/mes"}
                        </span>
                      </div>
                      {selectedPeriod === "anual" && (
                        <div className="bg-green-100 p-3 rounded-lg">
                          <div className="text-green-800 font-bold text-center">
                            🎉 AHORRO ESPECIAL: 15% de descuento pagando anualmente
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                
                <Card className="border-2 border-[#bcce16] shadow-lg">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-[#bcce16]" />
                          {selectedMembership.nombrePlan}
                        </CardTitle>
                        <p className="text-gray-600 mt-1">{selectedMembership.descripcionPlan}</p>
                      </div>
                    </div>
                  </CardHeader>
                  {selectedMembership.beneficios && (
                    <CardContent>
                      <div className="space-y-2">
                        {(Array.isArray(selectedMembership.beneficios) ? selectedMembership.beneficios : selectedMembership.beneficios ? selectedMembership.beneficios.toString().split('\n') : []).map((benefit: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Star className="h-4 w-4 text-[#bcce16]" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>


              </div>
            ) : (
              // Mostrar todos los planes para selección
              <div className="grid gap-6">
                {(memberships as MembershipType[]).map((membership: MembershipType) => {
                  const price = getSelectedPrice(membership);
                  return (
                    <Card 
                      key={membership.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-[#bcce16]"
                      onClick={() => handleMembershipSelect(membership)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Crown className="h-5 w-5 text-[#bcce16]" />
                              {membership.nombrePlan}
                            </CardTitle>
                            <p className="text-gray-600 mt-1">{membership.descripcionPlan}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#bcce16]">
                              ${price.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {selectedPeriod === "anual" ? "por año" : "por mes"}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {/* Opciones de precios disponibles */}
                      <CardContent className="pt-0">
                        <div className="space-y-3 mb-4">
                          <h4 className="text-sm font-medium text-gray-700">Opciones de Pago:</h4>
                          <div className="grid gap-2">
                            {membership.opcionesPrecios.map((opcion, index) => (
                              <div 
                                key={index}
                                className={`p-2 rounded border text-sm ${
                                  selectedPeriod === opcion.periodicidad 
                                    ? 'border-[#bcce16] bg-green-50 text-green-800' 
                                    : 'border-gray-200 text-gray-600'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="capitalize font-medium">{opcion.periodicidad}</span>
                                  <span className="font-bold">${opcion.costo.toLocaleString()}</span>
                                </div>
                                {opcion.periodicidad === "anual" && (
                                  <div className="text-xs text-green-600 mt-1">
                                    Ahorro recomendado
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {membership.beneficios && (
                          <div className="space-y-2 border-t pt-3">
                            <h4 className="text-sm font-medium text-gray-700">Beneficios incluidos:</h4>
                            {(Array.isArray(membership.beneficios) 
                              ? membership.beneficios 
                              : membership.beneficios?.split('\n') || []
                            ).map((benefit: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Star className="h-4 w-4 text-[#bcce16]" />
                                {benefit}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(2)}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Datos de Empresa
              </Button>
              {selectedMembership && (
                <Button 
                  onClick={() => createPaymentMutation.mutate()}
                  className="flex-1"
                  style={{ backgroundColor: '#bcce16' }}
                  disabled={createPaymentMutation.isPending}
                >
                  {createPaymentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Preparando...
                    </>
                  ) : (
                    <>
                      Proceder al Pago
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Completa tu Pago</h3>
              <p className="text-gray-600">
                Plan: {selectedMembership?.nombrePlan} - ${getSelectedPrice(selectedMembership!).toLocaleString()} {selectedPeriod}
              </p>
            </div>

            {clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  isProcessing={isProcessing}
                  onGoBack={() => setCurrentStep(3)}
                />
              </Elements>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bcce16] mx-auto mb-4"></div>
                <p className="text-gray-600">Preparando el sistema de pago...</p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-2xl font-semibold mb-2">¡Registro Completado!</h3>
              <p className="text-gray-600 mb-4">
                Tu cuenta y empresa han sido creadas exitosamente
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Usuario:</strong> {userData?.nombre}<br />
                  <strong>Empresa:</strong> {companyData?.nombreEmpresa}<br />
                  <strong>Plan:</strong> {selectedMembership?.nombrePlan}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setLocation("/login-representante")}
              className="w-full"
              style={{ backgroundColor: '#bcce16' }}
            >
              Iniciar Sesión
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isCompleted
                        ? "bg-[#bcce16] border-[#bcce16] text-white"
                        : isActive
                        ? "border-[#bcce16] text-[#bcce16]"
                        : "border-gray-300 text-gray-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-0.5 ml-2 ${
                        isCompleted ? "bg-[#bcce16]" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {steps.find(s => s.id === currentStep)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}