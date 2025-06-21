import { useState, useEffect } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CreditCard, 
  CheckCircle, 
  Zap, 
  Shield,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionFormProps {
  planDetails: any;
  selectedOption: any;
  autoRenewal: boolean;
}

const SubscriptionForm = ({ planDetails, selectedOption, autoRenewal }: SubscriptionFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/representative-dashboard?tab=membership",
        },
      });

      if (error) {
        toast({
          title: "Error en el pago",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Suscripción exitosa!",
          description: "Tu membresía se ha activado correctamente.",
        });
        setLocation("/representative-dashboard?tab=membership");
      }
    } catch (error) {
      toast({
        title: "Error procesando pago",
        description: "Hubo un problema al procesar tu pago. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Resumen de tu Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{planDetails.nombrePlan}</h3>
              <p className="text-sm text-gray-600">{selectedOption.periodicidad}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${selectedOption.costo.toLocaleString()} MXN
              </div>
              <div className="text-sm text-gray-600">
                por {selectedOption.periodicidad === "mensual" ? "mes" : "año"}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Renovación automática</span>
              <Badge variant={autoRenewal ? "default" : "secondary"}>
                {autoRenewal ? "Activada" : "Desactivada"}
              </Badge>
            </div>
            
            {autoRenewal && (
              <p className="text-xs text-gray-600">
                Tu membresía se renovará automáticamente cada {selectedOption.periodicidad === "mensual" ? "mes" : "año"}
              </p>
            )}
          </div>

          {planDetails.beneficios && planDetails.beneficios.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Beneficios incluidos:</h4>
                <ul className="space-y-1">
                  {planDetails.beneficios.map((benefit: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Información de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentElement />
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-green-600" />
            <div className="text-sm">
              <div className="font-medium">Pago seguro con Stripe</div>
              <div className="text-gray-600">
                Tu información de pago está protegida con encriptación de nivel bancario
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocation("/planes")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Planes
        </Button>

        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Activar Suscripción
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default function SubscriptionCheckout() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planId = params.get('planId');
    const periodicidad = params.get('periodicidad');
    const autoRenewalParam = params.get('autoRenewal');

    if (!planId || !periodicidad) {
      toast({
        title: "Error",
        description: "Información del plan no encontrada",
        variant: "destructive",
      });
      return;
    }

    setAutoRenewal(autoRenewalParam === 'true');

    // Fetch plan details and create subscription
    const initializeCheckout = async () => {
      try {
        setIsLoading(true);

        // Get plan details
        const planResponse = await fetch(`/api/membership-types/${planId}`);
        if (!planResponse.ok) throw new Error("Failed to fetch plan");
        const plan = await planResponse.json();

        const option = plan.opcionesPrecios?.find((opt: any) => opt.periodicidad === periodicidad);
        if (!option) throw new Error("Pricing option not found");

        setPlanDetails(plan);
        setSelectedOption(option);

        // Create subscription
        const subscriptionResponse = await apiRequest("POST", "/api/create-subscription", {
          planId: parseInt(planId),
          periodicidad,
          autoRenewal: autoRenewalParam === 'true',
        });

        const subscriptionData = await subscriptionResponse.json();
        setClientSecret(subscriptionData.clientSecret);

      } catch (error: any) {
        console.error("Error initializing checkout:", error);
        toast({
          title: "Error",
          description: error.message || "No se pudo inicializar el checkout",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeCheckout();
  }, [location, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Preparando tu suscripción...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret || !planDetails || !selectedOption) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">No se pudo cargar la información del plan</p>
            <Button onClick={() => window.location.href = "/planes"}>
              Volver a Planes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Completar Suscripción
          </h1>
          <p className="text-gray-600">
            Finaliza tu registro y activa tu membresía
          </p>
        </div>

        <Elements 
          stripe={stripePromise} 
          options={{ 
            clientSecret,
            appearance: {
              theme: 'stripe',
            },
          }}
        >
          <SubscriptionForm 
            planDetails={planDetails}
            selectedOption={selectedOption}
            autoRenewal={autoRenewal}
          />
        </Elements>
      </div>
    </div>
  );
}