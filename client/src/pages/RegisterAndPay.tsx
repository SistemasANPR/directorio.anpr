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
  MapPin
} from "lucide-react";

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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const companySchema = z.object({
  nombreEmpresa: z.string().min(2, "El nombre de la empresa es requerido"),
  email1: z.string().email("Email inválido"),
  telefono1: z.string().min(10, "Teléfono debe tener al menos 10 dígitos"),
  direccionFisica: z.string().min(10, "La dirección es requerida"),
  descripcionEmpresa: z.string().min(20, "La descripción debe tener al menos 20 caracteres"),
  sitioWeb: z.string().url("URL inválida").optional().or(z.literal("")),
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
  isProcessing 
}: { 
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
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
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
        style={{ backgroundColor: '#bcce16' }}
      >
        {isProcessing ? "Procesando..." : "Completar Pago"}
      </Button>
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
    },
  });

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nombreEmpresa: "",
      email1: "",
      telefono1: "",
      direccionFisica: "",
      descripcionEmpresa: "",
      sitioWeb: "",
    },
  });

  // Efecto para limpiar campos cuando se llega al paso 2
  useEffect(() => {
    if (currentStep === 2) {
      companyForm.reset({
        nombreEmpresa: "",
        email1: "",
        telefono1: "",
        direccionFisica: "",
        descripcionEmpresa: "",
        sitioWeb: "",
      });
    }
  }, [currentStep, companyForm]);

  // Fetch membership types
  const { data: memberships = [] } = useQuery<MembershipType[]>({
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
        const errorData = await response.text();
        throw new Error(`Error en el servidor: ${errorData}`);
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
        title: "Error",
        description: error.message || "Error al completar el registro",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleUserSubmit = (data: UserFormData) => {
    setUserData(data);
    setCurrentStep(2);
  };

  const handleCompanySubmit = (data: CompanyFormData) => {
    setCompanyData(data);
    // Si ya hay un plan preseleccionado, ir directamente al pago
    if (selectedMembership) {
      createPaymentMutation.mutate();
    } else {
      setCurrentStep(3);
    }
  };

  const handleMembershipSelect = (membership: MembershipType) => {
    setSelectedMembership(membership);
    createPaymentMutation.mutate();
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

              <FormField
                control={companyForm.control}
                name="direccionFisica"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección Física</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Dirección completa de la empresa" 
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
              <h3 className="text-xl font-semibold mb-2">Selecciona tu Plan de Membresía</h3>
              <p className="text-gray-600">Elige el plan que mejor se adapte a tus necesidades</p>
            </div>

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
              // Mostrar plan preseleccionado
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm font-medium">
                    ✓ Plan seleccionado desde la vista de membresías
                  </p>
                </div>
                
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
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#bcce16]">
                          ${getSelectedPrice(selectedMembership).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedPeriod === "anual" ? "por año" : "por mes"}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  {selectedMembership.beneficios && (
                    <CardContent>
                      <div className="space-y-2">
                        {selectedMembership.beneficios.split('\n').map((benefit: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Star className="h-4 w-4 text-[#bcce16]" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedMembership(null);
                      window.history.replaceState({}, '', '/registro-y-pago');
                    }}
                    className="flex-1"
                  >
                    Cambiar Plan
                  </Button>
                  <Button 
                    onClick={() => createPaymentMutation.mutate()}
                    className="flex-1"
                    style={{ backgroundColor: '#bcce16' }}
                  >
                    Continuar con este Plan
                  </Button>
                </div>
              </div>
            ) : (
              // Mostrar todos los planes para selección
              <div className="grid gap-4">
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
                      {membership.beneficios && (
                        <CardContent>
                          <div className="space-y-2">
                            {membership.beneficios.split('\n').map((benefit: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Star className="h-4 w-4 text-[#bcce16]" />
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(2)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Datos de Empresa
            </Button>
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