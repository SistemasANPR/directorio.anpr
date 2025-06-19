import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings, 
  Palette, 
  Image, 
  Globe, 
  DollarSign,
  Save,
  Eye,
  Plus,
  Trash2,
  Mail,
  Phone
} from "lucide-react";
import { SiFacebook, SiX, SiInstagram, SiYoutube, SiLinkedin, SiWhatsapp, SiTiktok, SiTelegram } from "react-icons/si";
import Swal from "sweetalert2";

const socialMediaSchema = z.object({
  platform: z.string().min(1, "Plataforma requerida"),
  url: z.string().url("URL válida requerida"),
  iconColor: z.string().min(1, "Color de ícono requerido"),
});

const systemSettingsSchema = z.object({
  systemName: z.string().min(1, "Nombre del sistema es requerido"),
  systemDescription: z.string().optional(),
  primaryColor: z.string().min(1, "Color primario es requerido"),
  secondaryColor: z.string().min(1, "Color secundario es requerido"),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  currency: z.string().min(1, "Moneda es requerida"),
  contactEmail: z.string().email("Email válido requerido").optional(),
  contactPhone: z.string().optional(),
  socialMediaList: z.array(socialMediaSchema).optional(),
});

type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>;

interface SystemSettingsData {
  systemName?: string;
  systemDescription?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  currency?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialMedia?: string;
}

const socialMediaPlatforms = [
  { value: "facebook", label: "Facebook", icon: SiFacebook, defaultColor: "#1877F2" },
  { value: "twitter", label: "Twitter / X", icon: SiX, defaultColor: "#000000" },
  { value: "instagram", label: "Instagram", icon: SiInstagram, defaultColor: "#E4405F" },
  { value: "youtube", label: "YouTube", icon: SiYoutube, defaultColor: "#FF0000" },
  { value: "linkedin", label: "LinkedIn", icon: SiLinkedin, defaultColor: "#0077B5" },
  { value: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, defaultColor: "#25D366" },
  { value: "tiktok", label: "TikTok", icon: SiTiktok, defaultColor: "#000000" },
  { value: "telegram", label: "Telegram", icon: SiTelegram, defaultColor: "#0088CC" },
];

const currencies = [
  { value: "USD", label: "USD - Dólar Estadounidense", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "MXN", label: "MXN - Peso Mexicano", symbol: "$" },
  { value: "COP", label: "COP - Peso Colombiano", symbol: "$" },
  { value: "ARS", label: "ARS - Peso Argentino", symbol: "$" },
  { value: "CLP", label: "CLP - Peso Chileno", symbol: "$" },
  { value: "PEN", label: "PEN - Sol Peruano", symbol: "S/." },
  { value: "BRL", label: "BRL - Real Brasileño", symbol: "R$" },
  { value: "CAD", label: "CAD - Dólar Canadiense", symbol: "C$" },
  { value: "GBP", label: "GBP - Libra Esterlina", symbol: "£" },
  { value: "JPY", label: "JPY - Yen Japonés", symbol: "¥" },
  { value: "CNY", label: "CNY - Yuan Chino", symbol: "¥" },
];

export default function SystemSettings() {
  const { toast } = useToast();
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const { data: settings, isLoading } = useQuery<SystemSettingsData>({
    queryKey: ["/api/system-settings"],
  });

  // Parse existing social media data
  const parseSocialMedia = (socialMediaJson: string) => {
    try {
      if (!socialMediaJson) return [];
      const parsed = JSON.parse(socialMediaJson);
      return Object.entries(parsed).map(([platform, url]) => ({
        platform,
        url: url as string,
        iconColor: socialMediaPlatforms.find(p => p.value === platform)?.defaultColor || "#000000"
      }));
    } catch {
      return [];
    }
  };

  const form = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
    values: settings ? {
      systemName: settings.systemName || "Mi Organización",
      systemDescription: settings.systemDescription || "",
      primaryColor: settings.primaryColor || "#3b82f6",
      secondaryColor: settings.secondaryColor || "#64748b",
      logoUrl: settings.logoUrl || "",
      faviconUrl: settings.faviconUrl || "",
      currency: settings.currency || "USD",
      contactEmail: settings.contactEmail || "",
      contactPhone: settings.contactPhone || "",
      socialMediaList: parseSocialMedia(settings.socialMedia || ""),
    } : {
      systemName: "Mi Organización",
      systemDescription: "",
      primaryColor: "#3b82f6",
      secondaryColor: "#64748b",
      logoUrl: "",
      faviconUrl: "",
      currency: "USD",
      contactEmail: "",
      contactPhone: "",
      socialMediaList: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "socialMediaList",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SystemSettingsFormData) => {
      // Convert socialMediaList back to JSON format for backend compatibility
      const socialMediaJson = data.socialMediaList?.reduce((acc, item) => {
        acc[item.platform] = item.url;
        return acc;
      }, {} as Record<string, string>);

      const apiData = {
        ...data,
        socialMedia: JSON.stringify(socialMediaJson || {}),
        socialMediaList: undefined, // Remove this field from API call
      };

      const response = await apiRequest("PUT", "/api/system-settings", apiData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      Swal.fire({
        title: "¡Éxito!",
        text: "Configuración actualizada correctamente",
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#10b981",
      });
    },
    onError: (error: any) => {
      Swal.fire({
        title: "Error",
        text: error.message || "Error al actualizar la configuración",
        icon: "error",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#ef4444",
      });
    },
  });

  const onSubmit = (data: SystemSettingsFormData) => {
    updateMutation.mutate(data);
  };

  const handleImageUpload = async (file: File, field: 'logoUrl' | 'faviconUrl') => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = () => {
        const size = field === 'faviconUrl' ? 32 : 200;
        canvas.width = size;
        canvas.height = size;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        form.setValue(field, dataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al procesar la imagen",
        variant: "destructive",
      });
    }
  };

  const addSocialMedia = () => {
    append({
      platform: "facebook",
      url: "",
      iconColor: "#1877F2"
    });
  };

  const applyPreview = () => {
    const formData = form.getValues();
    const root = document.documentElement;
    
    if (isPreviewMode) {
      root.style.setProperty('--primary', formData.primaryColor);
      root.style.setProperty('--secondary', formData.secondaryColor);
      document.title = formData.systemName;
      
      if (formData.faviconUrl) {
        let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = formData.faviconUrl;
      }
    } else {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
      document.title = settings?.systemName || "Mi Organización";
    }
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
    setTimeout(applyPreview, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configuración del Sistema
          </h1>
          <p className="text-muted-foreground mt-2">
            Personaliza la apariencia y configuración de tu organización
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isPreviewMode ? "default" : "outline"}
            onClick={togglePreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? "Aplicando Vista Previa" : "Vista Previa"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Información General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Información General
                </CardTitle>
                <CardDescription>
                  Configura la información básica de tu organización
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="systemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Sistema</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mi Organización" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="systemDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Descripción de tu organización"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Apariencia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Apariencia
                </CardTitle>
                <CardDescription>
                  Personaliza los colores y tema visual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Primario</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            {...field} 
                            type="color" 
                            className="w-16 h-10 p-1 rounded"
                          />
                          <Input 
                            {...field} 
                            placeholder="#3b82f6"
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Secundario</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            {...field} 
                            type="color" 
                            className="w-16 h-10 p-1 rounded"
                          />
                          <Input 
                            {...field} 
                            placeholder="#64748b"
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Moneda
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{currency.symbol}</span>
                                <span>{currency.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Imágenes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Imágenes
                </CardTitle>
                <CardDescription>
                  Logo y favicon de tu organización
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, 'logoUrl');
                              }
                            }}
                          />
                          {field.value && (
                            <img 
                              src={field.value} 
                              alt="Logo preview" 
                              className="w-16 h-16 object-contain border rounded"
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="faviconUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Favicon</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, 'faviconUrl');
                              }
                            }}
                          />
                          {field.value && (
                            <img 
                              src={field.value} 
                              alt="Favicon preview" 
                              className="w-8 h-8 object-contain border rounded"
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Información de Contacto
                </CardTitle>
                <CardDescription>
                  Datos de contacto de la organización
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Contacto</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contacto@mi-organizacion.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono de Contacto</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1 234 567 8900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Redes Sociales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Redes Sociales
              </CardTitle>
              <CardDescription>
                Configura las redes sociales de tu organización con colores personalizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => {
                const selectedPlatform = socialMediaPlatforms.find(p => p.value === form.watch(`socialMediaList.${index}.platform`));
                const IconComponent = selectedPlatform?.icon;

                return (
                  <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg">
                    <FormField
                      control={form.control}
                      name={`socialMediaList.${index}.platform`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Plataforma</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              const platform = socialMediaPlatforms.find(p => p.value === value);
                              if (platform) {
                                form.setValue(`socialMediaList.${index}.iconColor`, platform.defaultColor);
                              }
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona plataforma" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {socialMediaPlatforms.map((platform) => (
                                <SelectItem key={platform.value} value={platform.value}>
                                  <div className="flex items-center gap-2">
                                    <platform.icon className="h-4 w-4" />
                                    <span>{platform.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`socialMediaList.${index}.url`}
                      render={({ field }) => (
                        <FormItem className="flex-2">
                          <FormLabel>URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`socialMediaList.${index}.iconColor`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2 items-center">
                              <Input 
                                {...field} 
                                type="color" 
                                className="w-12 h-10 p-1 rounded"
                              />
                              {IconComponent && (
                                <IconComponent 
                                  className="h-5 w-5" 
                                  style={{ color: field.value }}
                                />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                onClick={addSocialMedia}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Red Social
              </Button>
            </CardContent>
          </Card>

          {/* Información sobre Vista Previa */}
          {isPreviewMode && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-blue-800">
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">Modo Vista Previa Activo</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Los cambios de colores y título se están aplicando temporalmente. 
                  Guarda los cambios para aplicarlos permanentemente.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="min-w-32"
            >
              {updateMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}