import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CreditCard, 
  Key, 
  Globe, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Copy,
  RefreshCw,
  Settings
} from "lucide-react";

const stripeConfigSchema = z.object({
  publicKey: z.string().min(1, "La clave pública es requerida").startsWith("pk_", "Debe comenzar con 'pk_'"),
  secretKey: z.string().min(1, "La clave secreta es requerida").startsWith("sk_", "Debe comenzar con 'sk_'"),
  webhookSecret: z.string().optional(),
  environment: z.enum(["test", "live"]),
  isActive: z.boolean(),
});

type StripeConfigForm = z.infer<typeof stripeConfigSchema>;

interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: {
    accountId?: string;
    businessName?: string;
    country?: string;
    currency?: string;
  };
}

export default function StripeConfiguration() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<TestConnectionResult | null>(null);
  const [webhookEndpoint, setWebhookEndpoint] = useState("");

  const { data: stripeConfig, isLoading } = useQuery({
    queryKey: ["/api/stripe-configuration"],
    queryFn: async () => {
      const response = await fetch("/api/stripe-configuration");
      if (!response.ok) throw new Error("Failed to fetch configuration");
      return response.json();
    },
  });

  const form = useForm<StripeConfigForm>({
    resolver: zodResolver(stripeConfigSchema),
    defaultValues: {
      publicKey: "",
      secretKey: "",
      webhookSecret: "",
      environment: "test",
      isActive: true,
    },
  });

  useEffect(() => {
    if (stripeConfig) {
      form.reset({
        publicKey: stripeConfig.publicKey || "",
        secretKey: stripeConfig.secretKey || "",
        webhookSecret: stripeConfig.webhookSecret || "",
        environment: stripeConfig.environment || "test",
        isActive: stripeConfig.isActive ?? true,
      });
    }
    
    // Generate webhook endpoint URL
    setWebhookEndpoint(window.location.origin + "/api/webhooks/stripe");
  }, [stripeConfig, form]);

  const saveConfigMutation = useMutation({
    mutationFn: async (data: StripeConfigForm) => {
      const response = await apiRequest("POST", "/api/stripe-configuration", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "La configuración de Stripe se ha guardado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stripe-configuration"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (data: StripeConfigForm) => {
      const response = await apiRequest("POST", "/api/stripe-configuration/test", data);
      return response.json();
    },
    onSuccess: (result: TestConnectionResult) => {
      setConnectionResult(result);
      if (result.success) {
        toast({
          title: "Conexión exitosa",
          description: "La conexión con Stripe se estableció correctamente.",
        });
      } else {
        toast({
          title: "Error de conexión",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error al probar conexión",
        description: error.message || "No se pudo probar la conexión.",
        variant: "destructive",
      });
    },
  });

  const syncProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe-configuration/sync-products", {});
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Sincronización completada",
        description: `Se sincronizaron ${result.synced} productos con Stripe.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error en sincronización",
        description: error.message || "No se pudo sincronizar con Stripe.",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = async () => {
    setIsConnecting(true);
    const formData = form.getValues();
    await testConnectionMutation.mutateAsync(formData);
    setIsConnecting(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "URL copiada al portapapeles.",
    });
  };

  const onSubmit = (data: StripeConfigForm) => {
    saveConfigMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Stripe</h1>
          <p className="text-gray-600">Configura las claves de API y webhooks para procesar pagos con Stripe</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario Principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Configuración de API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Ambiente */}
                  <FormField
                    control={form.control}
                    name="environment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Ambiente
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el ambiente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="test">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">Test</Badge>
                                <span>Ambiente de pruebas</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="live">
                              <div className="flex items-center gap-2">
                                <Badge variant="default">Live</Badge>
                                <span>Ambiente de producción</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Usa "Test" para desarrollo y "Live" para producción
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Clave Pública */}
                  <FormField
                    control={form.control}
                    name="publicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Clave Pública (Publishable Key)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="pk_test_..."
                            {...field}
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormDescription>
                          Comienza con "pk_test_" para pruebas o "pk_live_" para producción
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Clave Secreta */}
                  <FormField
                    control={form.control}
                    name="secretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Clave Secreta (Secret Key)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="sk_test_..."
                            {...field}
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormDescription>
                          Comienza con "sk_test_" para pruebas o "sk_live_" para producción
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Webhook Secret */}
                  <FormField
                    control={form.control}
                    name="webhookSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook Secret (Opcional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="whsec_..."
                            {...field}
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormDescription>
                          Para verificar la autenticidad de los webhooks de Stripe
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Estado Activo */}
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Configuración Activa</FormLabel>
                          <FormDescription>
                            Habilita esta configuración para procesar pagos
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isConnecting || testConnectionMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {isConnecting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Probar Conexión
                    </Button>

                    <Button
                      type="submit"
                      disabled={saveConfigMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {saveConfigMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Settings className="h-4 w-4" />
                      )}
                      Guardar Configuración
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Estado de Conexión */}
          {connectionResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {connectionResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  Estado de Conexión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className={connectionResult.success ? "border-green-200" : "border-red-200"}>
                  <AlertDescription>
                    {connectionResult.message}
                  </AlertDescription>
                </Alert>

                {connectionResult.success && connectionResult.details && (
                  <div className="mt-4 space-y-2 text-sm">
                    <div><strong>Account ID:</strong> {connectionResult.details.accountId}</div>
                    {connectionResult.details.businessName && (
                      <div><strong>Negocio:</strong> {connectionResult.details.businessName}</div>
                    )}
                    <div><strong>País:</strong> {connectionResult.details.country}</div>
                    <div><strong>Moneda:</strong> {connectionResult.details.currency?.toUpperCase()}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Configuración de Webhooks */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Webhooks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Endpoint URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={webhookEndpoint}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookEndpoint)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Eventos requeridos:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• customer.subscription.created</li>
                  <li>• customer.subscription.updated</li>
                  <li>• customer.subscription.deleted</li>
                  <li>• invoice.payment_succeeded</li>
                  <li>• invoice.payment_failed</li>
                </ul>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open("https://dashboard.stripe.com/webhooks", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Configurar en Stripe
              </Button>
            </CardContent>
          </Card>

          {/* Sincronización de Productos */}
          <Card>
            <CardHeader>
              <CardTitle>Sincronización</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => syncProductsMutation.mutate()}
                disabled={syncProductsMutation.isPending}
              >
                {syncProductsMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sincronizar Productos
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Sincroniza los planes de membresía con los productos de Stripe
              </p>
            </CardContent>
          </Card>

          {/* Guía Rápida */}
          <Card>
            <CardHeader>
              <CardTitle>Guía Rápida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium">1. Obtener claves de API</h4>
                <p className="text-gray-600">Ve a tu dashboard de Stripe → Developers → API keys</p>
              </div>
              
              <div>
                <h4 className="font-medium">2. Configurar webhooks</h4>
                <p className="text-gray-600">Crea un endpoint con la URL mostrada arriba</p>
              </div>
              
              <div>
                <h4 className="font-medium">3. Probar conexión</h4>
                <p className="text-gray-600">Usa el botón "Probar Conexión" para verificar</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => window.open("https://dashboard.stripe.com", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Stripe Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}