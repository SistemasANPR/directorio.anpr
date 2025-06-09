import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Category, MembershipType, CompanyWithDetails, Certificate } from "@shared/schema";
import { paisesAmericaLatina, estadosMexico, ciudadesPorEstado } from "@/lib/locationData";
import { Building, MapPin, Globe, Phone, Mail, Users, FileText, Video, Image, Plus, Trash2, Facebook, Linkedin, Twitter, Instagram, Youtube, Award, Tags, Building2, Car, Truck, Hammer, Factory, Cpu, Wrench, ShoppingBag, Briefcase, Heart, GraduationCap, Home, Coffee, Camera, Music, Gamepad2, Book, Palette, Plane, Ship, Train, Zap } from "lucide-react";
import MapLocationPicker from "./MapLocationPicker";
import RichTextEditor from "./RichTextEditor";

const companySchema = z.object({
  nombreEmpresa: z.string().min(1, "El nombre de la empresa es requerido"),
  email1: z.string().email("Email inválido"),
  telefono1: z.string().optional(),
  telefono2: z.string().optional(),
  email2: z.string().email("Email inválido").optional().or(z.literal("")),
  logotipoUrl: z.string().optional().or(z.literal("")),
  sitioWeb: z.string().url("URL inválida").optional().or(z.literal("")),

  catalogoDigitalUrl: z.string().optional().or(z.literal("")),
  direccionFisica: z.string().optional(),
  galeriaProductosUrls: z.array(z.string()).optional(),
  paisesPresencia: z.array(z.string()).min(1, "Selecciona al menos un país"),
  estadosPresencia: z.array(z.string()).min(1, "Selecciona al menos un estado"),
  ciudadesPresencia: z.array(z.string()).min(1, "Selecciona al menos una ciudad"),
  ubicacionPrincipal: z.string().optional().nullable(),
  descripcionEmpresa: z.string().optional(),
  categoriesIds: z.array(z.number()).min(1, "Selecciona al menos una categoría"),
  certificateIds: z.array(z.number()).optional(),
  membershipTypeId: z.number({
    required_error: "El tipo de membresía es requerido",
    invalid_type_error: "Debe seleccionar un tipo de membresía válido"
  }),
  redesSociales: z.array(z.object({
    plataforma: z.string(),
    url: z.string().url()
  })).optional(),
  representantesVentas: z.array(z.string()).optional(),
  ubicacionGeografica: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }).optional().nullable(),
  // Campos de membresía
  membershipPeriodicidad: z.string({
    required_error: "La periodicidad es requerida",
    invalid_type_error: "Debe seleccionar una periodicidad válida"
  }).refine((val) => ["mensual", "anual", "Mensual", "Anual"].includes(val), {
    message: "La periodicidad debe ser mensual o anual"
  }),
  formaPago: z.enum(["efectivo", "transferencia", "otro"], {
    required_error: "La forma de pago es requerida",
    invalid_type_error: "Debe seleccionar una forma de pago válida"
  }),
  fechaInicioMembresia: z.string().min(1, "La fecha de inicio es requerida"),
  fechaFinMembresia: z.string().min(1, "La fecha de fin es requerida"),
  notasMembresia: z.string().optional(),
  estado: z.enum(["activo", "inactivo"], {
    required_error: "El estado es requerido"
  }),
});

type CompanyFormData = z.infer<typeof companySchema>;

// Map of icon names to components
const iconMap = {
  Tags, Building2, Car, Truck, Hammer, Factory, Cpu, Wrench, ShoppingBag,
  Briefcase, Heart, GraduationCap, Home, Coffee, Camera, Music,
  Gamepad2, Book, Palette, MapPin, Plane, Ship, Train, Zap
};

interface EditCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyWithDetails | null;
}

// Function to render category icon
const renderCategoryIcon = (category: Category) => {
  // If category has iconoUrl, use it as an image
  if (category.iconoUrl) {
    return (
      <img 
        src={category.iconoUrl} 
        alt={category.nombreCategoria}
        className="h-4 w-4 mr-2 object-contain"
      />
    );
  }
  
  // Otherwise use the icon name from the iconMap
  const iconName = category.icono as keyof typeof iconMap;
  const IconComponent = iconMap[iconName] || Tags;
  return <IconComponent className="h-4 w-4 mr-2" />;
};

export default function EditCompanyModal({ open, onOpenChange, company }: EditCompanyModalProps) {
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [selectedCiudades, setSelectedCiudades] = useState<string[]>([]);
  const [redesSociales, setRedesSociales] = useState<Array<{plataforma: string, url: string}>>([]);
  const [emailsAdicionales, setEmailsAdicionales] = useState<string[]>([]);
  const [telefonosAdicionales, setTelefonosAdicionales] = useState<string[]>([]);
  const [representantes, setRepresentantes] = useState<string[]>([]);
  const [direccionesPorCiudad, setDireccionesPorCiudad] = useState<{[ciudad: string]: string}>({});
  const [ubicacionesPorCiudad, setUbicacionesPorCiudad] = useState<{[ciudad: string]: { lat: number; lng: number; address: string }}>({});
  const [galeriaImagenes, setGaleriaImagenes] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [catalogoFile, setCatalogoFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [videosUrls, setVideosUrls] = useState<string[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();

  // Funciones de validación de imágenes
  const validateImage = (file: File): boolean => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe pesar más de 10MB",
        variant: "destructive",
      });
      return false;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadImageToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al subir la imagen');
    }

    const result = await response.json();
    return result.imageUrl;
  };

  // Función para subir documentos PDF al servidor
  const uploadDocumentToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch('/api/upload-document', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al subir documento');
    }

    const result = await response.json();
    return result.documentUrl;
  };

  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await fetch('/api/upload-images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al subir las imágenes');
    }

    const result = await response.json();
    return result.images.map((img: any) => img.imageUrl);
  };

  const handleLogoChange = async (file: File) => {
    try {
      if (!validateImage(file)) return;

      setLogoFile(file);
      const imageUrl = await uploadImageToServer(file);
      form.setValue("logotipoUrl", imageUrl);
      
      toast({
        title: "Éxito",
        description: "Logotipo actualizado correctamente",
      });
    } catch (error) {
      console.error("Error procesando imagen:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen seleccionada",
        variant: "destructive",
      });
    }
  };

  const handleGaleriaChange = async (files: FileList) => {
    try {
      const validFiles: File[] = [];
      
      for (let i = 0; i < Math.min(files.length, 10 - galeriaFiles.length); i++) {
        const file = files[i];
        
        if (validateImage(file)) {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      const imageUrls = await uploadMultipleImages(validFiles);
      
      setGaleriaFiles([...galeriaFiles, ...validFiles]);
      setGaleriaImagenes([...galeriaImagenes, ...imageUrls]);
      form.setValue("galeriaProductosUrls", [...galeriaImagenes, ...imageUrls]);
      
      toast({
        title: "Éxito",
        description: `Se agregaron ${validFiles.length} imágenes a la galería`,
      });
    } catch (error) {
      console.error("Error procesando galería:", error);
      toast({
        title: "Error",
        description: "No se pudieron procesar todas las imágenes seleccionadas",
        variant: "destructive",
      });
    }
  };

  // Plataformas de redes sociales disponibles
  const socialPlatforms = [
    { name: "Facebook", icon: Facebook },
    { name: "LinkedIn", icon: Linkedin },
    { name: "Twitter", icon: Twitter },
    { name: "Instagram", icon: Instagram },
    { name: "YouTube", icon: Youtube },
  ];

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nombreEmpresa: "",
      email1: "",
      telefono1: "",
      sitioWeb: "",
      videosUrls: [],
      paisesPresencia: [],
      estadosPresencia: [],
      ciudadesPresencia: [],
      ubicacionPrincipal: "",
      descripcionEmpresa: "",
      categoriesIds: [],
      certificateIds: [],
      membershipTypeId: undefined,
    },
  });

  // Function to calculate end date automatically
  const calculateEndDate = (startDate: string, periodicidad: string) => {
    if (!startDate || !periodicidad) return "";
    
    const start = new Date(startDate);
    const end = new Date(start);
    
    if (periodicidad.toLowerCase() === "mensual") {
      end.setMonth(end.getMonth() + 1);
    } else if (periodicidad.toLowerCase() === "anual") {
      end.setFullYear(end.getFullYear() + 1);
    }
    
    return end.toISOString().split('T')[0];
  };

  // Watch for changes in membership fields to auto-calculate dates
  const watchedFechaInicio = form.watch("fechaInicioMembresia");
  const watchedPeriodicidad = form.watch("membershipPeriodicidad");

  useEffect(() => {
    if (watchedFechaInicio && watchedPeriodicidad) {
      console.log("Calculando fecha de fin:", { watchedFechaInicio, watchedPeriodicidad });
      const endDate = calculateEndDate(watchedFechaInicio, watchedPeriodicidad);
      console.log("Fecha de fin calculada:", endDate);
      form.setValue("fechaFinMembresia", endDate);
    }
  }, [watchedFechaInicio, watchedPeriodicidad, form]);

  // Cargar categorías
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Cargar tipos de membresía
  const { data: membershipTypes = [] } = useQuery<MembershipType[]>({
    queryKey: ["/api/membership-types"],
  });

  // Cargar certificados
  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  // Cargar datos de la empresa en el formulario
  useEffect(() => {
    if (company && open) {
      // Resetear estados
      setSelectedEstados((company.estadosPresencia as string[]) || []);
      setSelectedCiudades((company.ciudadesPresencia as string[]) || []);
      // Convertir redesSociales a array para el formulario
      let redesSocialesArray = [];
      if (company.redesSociales) {
        try {
          // Si es un string JSON, parsearlo
          if (typeof company.redesSociales === 'string') {
            const parsed = JSON.parse(company.redesSociales);
            if (Array.isArray(parsed)) {
              redesSocialesArray = parsed;
            } else {
              // Si es un objeto, convertir a array
              redesSocialesArray = Object.entries(parsed).map(([plataforma, url]) => ({ plataforma, url }));
            }
          } 
          // Si ya es un array, usarlo directamente
          else if (Array.isArray(company.redesSociales)) {
            redesSocialesArray = company.redesSociales;
          } 
          // Si es un objeto, convertir a array
          else if (typeof company.redesSociales === 'object') {
            redesSocialesArray = Object.entries(company.redesSociales).map(([plataforma, url]) => ({ plataforma, url }));
          }
        } catch (error) {
          console.error("Error parsing redesSociales:", error);
          redesSocialesArray = [];
        }
      }
      setRedesSociales(redesSocialesArray);
      setEmailsAdicionales([]);
      setTelefonosAdicionales([]);
      setRepresentantes((company.representantesVentas as string[]) || []);
      setDireccionesPorCiudad({});
      setGaleriaImagenes((company.galeriaProductosUrls as string[]) || []);
      
      // Cargar videos promocionales en el estado
      const videos = (company.videosUrls as string[]) || [];
      setVideosUrls([
        videos[0] || "",
        videos[1] || "",
        videos[2] || ""
      ]);
      
      // La ubicación se cargará después cuando se actualicen las ciudades

      // Cargar datos en el formulario
      form.reset({
        nombreEmpresa: company.nombreEmpresa,
        logotipoUrl: company.logotipoUrl || "",
        telefono1: company.telefono1 || "",
        telefono2: company.telefono2 || "",
        email1: company.email1,
        email2: company.email2 || "",
        sitioWeb: company.sitioWeb || "",
        paisesPresencia: (company.paisesPresencia as string[]) || [],
        estadosPresencia: (company.estadosPresencia as string[]) || [],
        ciudadesPresencia: (company.ciudadesPresencia as string[]) || [],
        ubicacionPrincipal: company.ubicacionPrincipal || "",
        direccionFisica: company.direccionFisica || "",
        descripcionEmpresa: company.descripcionEmpresa || "",
        catalogoDigitalUrl: company.catalogoDigitalUrl || "",
        categoriesIds: (company.categoriesIds as number[]) || [],
        membershipTypeId: company.membershipTypeId || membershipTypes[0]?.id || 1,
        certificateIds: (company.certificateIds as number[]) || [],
        galeriaProductosUrls: (company.galeriaProductosUrls as string[]) || [],
        // Campos de membresía
        membershipPeriodicidad: company.membershipPeriodicidad ? company.membershipPeriodicidad.toLowerCase() : "anual",
        formaPago: (company.formaPago as "efectivo" | "transferencia" | "otro") || "efectivo",
        fechaInicioMembresia: company.fechaInicioMembresia || new Date().toISOString().split('T')[0],
        fechaFinMembresia: company.fechaFinMembresia || "",
        notasMembresia: company.notasMembresia || "",
        estado: (company.estado as "activo" | "inactivo") || "activo",
      });
    }
  }, [company, open, form, membershipTypes]);

  // Efecto separado para cargar la ubicación existente cuando las ciudades están disponibles
  useEffect(() => {
    if (company && selectedCiudades.length > 0 && company.ubicacionGeografica) {
      const primeraUbicacion = selectedCiudades[0];
      setUbicacionesPorCiudad({
        [primeraUbicacion]: company.ubicacionGeografica as { lat: number; lng: number; address: string }
      });
    }
  }, [company, selectedCiudades]);

  // Mutación para actualizar empresa
  const updateMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      try {
        if (!company) throw new Error("No company selected");
        
        // Limpiar y validar redes sociales
        const redesSocialesLimpias = redesSociales
          .filter(social => social.plataforma && social.url && social.url.trim() !== "")
          .map(social => ({
            plataforma: social.plataforma,
            url: social.url
          }));

        const updateData = {
          ...data,
          // Convertir membershipTypeId a null si es undefined o string vacío
          membershipTypeId: data.membershipTypeId && data.membershipTypeId !== "" ? Number(data.membershipTypeId) : null,
          ubicacionPrincipal: data.ubicacionPrincipal || (selectedCiudades.length === 1 ? selectedCiudades[0] : null),
          redesSociales: redesSocialesLimpias,
          representantesVentas: representantes.filter(r => r.trim() !== ""),
          galeriaProductosUrls: galeriaImagenes.filter(img => img.trim() !== ""),
        };

        console.log("Datos a enviar:", updateData);

        const response = await apiRequest("PUT", `/api/companies/${company.id}`, updateData);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al actualizar la empresa");
        }

        return response.json();
      } catch (error) {
        console.error("Error en mutationFn:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Éxito",
        description: "Empresa actualizada correctamente",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la empresa",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    try {
      // Filtrar y validar videos
      const videosValidos = videosUrls
        .filter(video => video && video.trim() !== "")
        .filter(video => {
          try {
            new URL(video);
            return true;
          } catch {
            return false;
          }
        });

      // Determinar la ubicación principal
      // Si hay ubicaciones por ciudad, usar la primera como ubicación principal
      const ubicacionPrincipal = Object.keys(ubicacionesPorCiudad).length > 0 
        ? Object.values(ubicacionesPorCiudad)[0] 
        : data.ubicacionGeografica;

      const companyData = {
        ...data,
        videosUrls: videosValidos,
        ubicacionGeografica: ubicacionPrincipal
      };
      

      
      updateMutation.mutate(companyData);
    } catch (error) {
      console.error("Error al procesar datos de la empresa:", error);
    }
  };

  // Funciones para redes sociales
  const addSocialMedia = () => {
    if (redesSociales.length < 5) {
      const newSocial = redesSociales.length === 0 
        ? { plataforma: "Sitio Web", url: "" }
        : { plataforma: "", url: "" };
      setRedesSociales([...redesSociales, newSocial]);
    }
  };

  const removeSocialMedia = (index: number) => {
    const newSocials = redesSociales.filter((_, i) => i !== index);
    setRedesSociales(newSocials);
  };

  const updateSocialMedia = (index: number, field: string, value: string) => {
    const newSocials = [...redesSociales];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setRedesSociales(newSocials);
  };

  // Funciones para emails adicionales
  const addEmail = () => {
    if (emailsAdicionales.length < 2) {
      setEmailsAdicionales([...emailsAdicionales, ""]);
    }
  };

  const removeEmail = (index: number) => {
    const newEmails = emailsAdicionales.filter((_, i) => i !== index);
    setEmailsAdicionales(newEmails);
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emailsAdicionales];
    newEmails[index] = value;
    setEmailsAdicionales(newEmails);
  };

  // Funciones para teléfonos adicionales
  const addTelefono = () => {
    if (telefonosAdicionales.length < 2) {
      setTelefonosAdicionales([...telefonosAdicionales, ""]);
    }
  };

  const removeTelefono = (index: number) => {
    const newTelefonos = telefonosAdicionales.filter((_, i) => i !== index);
    setTelefonosAdicionales(newTelefonos);
  };

  const updateTelefono = (index: number, value: string) => {
    const newTelefonos = [...telefonosAdicionales];
    newTelefonos[index] = value;
    setTelefonosAdicionales(newTelefonos);
  };

  // Funciones para representantes
  const addRepresentante = () => {
    if (representantes.length < 3) {
      setRepresentantes([...representantes, ""]);
    }
  };

  const removeRepresentante = (index: number) => {
    const newRepresentantes = representantes.filter((_, i) => i !== index);
    setRepresentantes(newRepresentantes);
  };

  const updateRepresentante = (index: number, value: string) => {
    const newRepresentantes = [...representantes];
    newRepresentantes[index] = value;
    setRepresentantes(newRepresentantes);
  };

  // Funciones para manejar videos
  const addVideo = () => {
    if (videosUrls.length < 5) {
      setVideosUrls([...videosUrls, ""]);
    }
  };

  const removeVideo = (index: number) => {
    const newVideos = videosUrls.filter((_, i) => i !== index);
    setVideosUrls(newVideos);
  };

  const updateVideo = (index: number, value: string) => {
    const newVideos = [...videosUrls];
    newVideos[index] = value;
    setVideosUrls(newVideos);
  };

  // Función para direcciones por ciudad
  const updateDireccionCiudad = (ciudad: string, direccion: string) => {
    setDireccionesPorCiudad(prev => ({
      ...prev,
      [ciudad]: direccion
    }));
  };

  // Función para ubicaciones del mapa
  const updateUbicacionCiudad = (ciudad: string, ubicacion: { lat: number; lng: number; address: string }) => {
    setUbicacionesPorCiudad(prev => ({
      ...prev,
      [ciudad]: ubicacion
    }));
  };

  // Obtener ciudades disponibles basadas en estados seleccionados
  const getAvailableCiudades = () => {
    return selectedEstados.flatMap(estado => 
      ciudadesPorEstado[estado]?.map(ciudad => `${ciudad}, ${estado}`) || []
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Editar Empresa
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Sección: Información de la Empresa */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-primary">Información de la Empresa</h3>
                <p className="text-sm text-gray-600">Datos generales de la empresa</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre de la empresa */}
                <FormField
                  control={form.control}
                  name="nombreEmpresa"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Nombre de la Empresa *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre completo de la empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                {/* Logotipo */}
                <FormField
                  control={form.control}
                  name="logotipoUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Logotipo de la Empresa
                      </FormLabel>
                      <div className="space-y-4">
                        {/* Vista previa del logotipo actual */}
                        {field.value && (
                          <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                            <img 
                              src={field.value} 
                              alt="Logotipo actual" 
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Logotipo actual</p>
                              <p className="text-xs text-gray-500">Arrastra una nueva imagen o usa la URL para cambiar</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Zona de drag and drop */}
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                          }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                            const files = e.dataTransfer.files;
                            if (files.length > 0) {
                              await handleLogoChange(files[0]);
                            }
                          }}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = async (e) => {
                              const files = (e.target as HTMLInputElement).files;
                              if (files && files[0]) {
                                await handleLogoChange(files[0]);
                              }
                            };
                            input.click();
                          }}
                        >
                          <Image className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Clic para subir</span> o arrastra y suelta
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG hasta 5MB (recomendado: 800x800px)</p>
                        </div>
                        
                        {/* Campo de URL alternativo */}
                        <div className="space-y-2">
                          <FormLabel className="text-sm text-gray-600">O ingresa una URL:</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://ejemplo.com/logo.png" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value && !logoFile) {
                                  // Si se ingresa una URL, limpiar el archivo subido
                                  setLogoFile(null);
                                }
                              }}
                            />
                          </FormControl>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sitio Web */}
                <FormField
                  control={form.control}
                  name="sitioWeb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Sitio Web
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.empresa.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Videos Promocionales */}
                <div className="space-y-4">
                  <FormLabel className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Videos Promocionales
                  </FormLabel>
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="space-y-2">
                      <label className="text-sm font-medium">
                        Video Promocional {index + 1}
                      </label>
                      <Input 
                        placeholder="https://youtube.com/watch?v=..." 
                        value={videosUrls[index] || ""}
                        onChange={(e) => {
                          const newVideos = [...videosUrls];
                          newVideos[index] = e.target.value;
                          setVideosUrls(newVideos);
                        }}
                        type="url"
                      />
                    </div>
                  ))}
                </div>

                {/* Catálogo Digital */}
                <FormField
                  control={form.control}
                  name="catalogoDigitalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Catálogo Digital (PDF)
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div
                            className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors ${
                              isDragActive ? 'border-blue-400 bg-blue-50' : ''
                            }`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragActive(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              setIsDragActive(false);
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              setIsDragActive(false);
                              const files = Array.from(e.dataTransfer.files);
                              const pdfFile = files.find(file => file.type === 'application/pdf');
                              if (pdfFile) {
                                try {
                                  const catalogUrl = await uploadDocumentToServer(pdfFile);
                                  field.onChange(catalogUrl);
                                  toast({ title: "Catálogo subido exitosamente" });
                                } catch (error) {
                                  toast({ 
                                    title: "Error al subir catálogo", 
                                    description: "Por favor intenta de nuevo",
                                    variant: "destructive" 
                                  });
                                }
                              } else {
                                toast({ 
                                  title: "Archivo no válido", 
                                  description: "Solo se permiten archivos PDF",
                                  variant: "destructive" 
                                });
                              }
                            }}
                          >
                            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-sm text-gray-600 mb-2">
                              Arrastra y suelta tu catálogo PDF aquí
                            </p>
                            <p className="text-xs text-gray-500 mb-4">
                              O ingresa la URL manualmente abajo
                            </p>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file && file.type === 'application/pdf') {
                                  try {
                                    const catalogUrl = await uploadDocumentToServer(file);
                                    field.onChange(catalogUrl);
                                    toast({ title: "Catálogo subido exitosamente" });
                                  } catch (error) {
                                    toast({ 
                                      title: "Error al subir catálogo", 
                                      description: "Por favor intenta de nuevo",
                                      variant: "destructive" 
                                    });
                                  }
                                }
                              }}
                              className="hidden"
                              id="catalog-upload"
                            />
                            <label
                              htmlFor="catalog-upload"
                              className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                            >
                              Seleccionar archivo
                            </label>
                          </div>
                          <Input 
                            placeholder="https://ejemplo.com/catalogo.pdf" 
                            {...field} 
                            className="mt-2"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Galería de Productos */}
                <FormField
                  control={form.control}
                  name="galeriaProductosUrls"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Galería de Productos ({galeriaImagenes.length}/10)
                      </FormLabel>
                      <div className="space-y-4">
                        {/* Vista previa de imágenes actuales */}
                        {galeriaImagenes.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {galeriaImagenes.map((imagen, index) => (
                              <div key={index} className="relative group">
                                <img 
                                  src={imagen} 
                                  alt={`Producto ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    const newGaleria = galeriaImagenes.filter((_, i) => i !== index);
                                    const newFiles = galeriaFiles.filter((_, i) => i !== index);
                                    setGaleriaImagenes(newGaleria);
                                    setGaleriaFiles(newFiles);
                                    field.onChange(newGaleria);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Zona de drag and drop para múltiples imágenes */}
                        {galeriaImagenes.length < 10 && (
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                              const files = e.dataTransfer.files;
                              if (files.length > 0) {
                                await handleGaleriaChange(files);
                              }
                            }}
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.multiple = true;
                              input.onchange = async (e) => {
                                const files = (e.target as HTMLInputElement).files;
                                if (files) {
                                  await handleGaleriaChange(files);
                                }
                              };
                              input.click();
                            }}
                          >
                            <Image className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Clic para subir</span> o arrastra y suelta múltiples imágenes
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG hasta 5MB cada una. Máximo {10 - galeriaImagenes.length} imágenes más.
                            </p>
                          </div>
                        )}
                        
                        {/* Campos manuales para URLs */}
                        <div className="space-y-3">
                          <FormLabel className="text-sm text-gray-600">O agrega URLs manualmente:</FormLabel>
                          {galeriaImagenes.map((imagen, index) => (
                            <div key={index} className="flex gap-3 items-start">
                              <Input
                                placeholder="https://ejemplo.com/imagen.jpg"
                                value={imagen}
                                onChange={(e) => {
                                  const newGaleria = [...galeriaImagenes];
                                  newGaleria[index] = e.target.value;
                                  setGaleriaImagenes(newGaleria);
                                  field.onChange(newGaleria);
                                }}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newGaleria = galeriaImagenes.filter((_, i) => i !== index);
                                  setGaleriaImagenes(newGaleria);
                                  field.onChange(newGaleria);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {galeriaImagenes.length < 10 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const newGaleria = [...galeriaImagenes, ""];
                                setGaleriaImagenes(newGaleria);
                                field.onChange(newGaleria);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Agregar URL
                            </Button>
                          )}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Categorías */}
                <FormField
                  control={form.control}
                  name="categoriesIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categorías *</FormLabel>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={field.value?.includes(category.id) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, category.id]);
                                } else {
                                  field.onChange(currentValues.filter(id => id !== category.id));
                                }
                              }}
                            />
                            <label
                              htmlFor={`category-${category.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                            >
                              {renderCategoryIcon(category)}
                              {category.nombreCategoria}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Certificados */}
                <FormField
                  control={form.control}
                  name="certificateIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Certificados
                      </FormLabel>
                      <div className="grid grid-cols-1 gap-3 mt-2">
                        {certificates.map((certificate) => (
                          <div key={certificate.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`certificate-${certificate.id}`}
                              checked={field.value?.includes(certificate.id) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, certificate.id]);
                                } else {
                                  field.onChange(currentValues.filter(id => id !== certificate.id));
                                }
                              }}
                            />
                            <label
                              htmlFor={`certificate-${certificate.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {certificate.nombreCertificado}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Países de presencia */}
                <FormField
                  control={form.control}
                  name="paisesPresencia"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Países de Presencia *</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-32 overflow-y-auto border rounded-lg p-4">
                        {paisesAmericaLatina.map((pais) => (
                          <div key={pais} className="flex items-center space-x-2">
                            <Checkbox
                              id={`pais-${pais}`}
                              checked={field.value?.includes(pais) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  field.onChange([...currentValues, pais]);
                                } else {
                                  field.onChange(currentValues.filter(p => p !== pais));
                                }
                              }}
                            />
                            <label htmlFor={`pais-${pais}`} className="text-sm cursor-pointer">
                              {pais}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estados de presencia */}
                <FormField
                  control={form.control}
                  name="estadosPresencia"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Estados de México *</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4">
                        {estadosMexico.map((estado) => (
                          <div key={estado} className="flex items-center space-x-2">
                            <Checkbox
                              id={`estado-${estado}`}
                              checked={field.value?.includes(estado) || false}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                if (checked) {
                                  const newValues = [...currentValues, estado];
                                  field.onChange(newValues);
                                  setSelectedEstados(prev => [...prev, estado]);
                                } else {
                                  const newValues = currentValues.filter(e => e !== estado);
                                  field.onChange(newValues);
                                  setSelectedEstados(prev => prev.filter(e => e !== estado));
                                }
                              }}
                            />
                            <label htmlFor={`estado-${estado}`} className="text-sm cursor-pointer">
                              {estado}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ciudades de presencia */}
                {selectedEstados.length > 0 && (
                  <FormField
                    control={form.control}
                    name="ciudadesPresencia"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Ciudades de México</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4">
                          {getAvailableCiudades().map((ciudad) => (
                            <div key={ciudad} className="flex items-center space-x-2">
                              <Checkbox
                                id={`ciudad-${ciudad}`}
                                checked={field.value?.includes(ciudad) || false}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  let newValues;
                                  if (checked) {
                                    newValues = [...currentValues, ciudad];
                                    setSelectedCiudades(prev => [...prev, ciudad]);
                                  } else {
                                    newValues = currentValues.filter(c => c !== ciudad);
                                    setSelectedCiudades(prev => prev.filter(c => c !== ciudad));
                                    setDireccionesPorCiudad(prev => {
                                      const newDirecciones = { ...prev };
                                      delete newDirecciones[ciudad];
                                      return newDirecciones;
                                    });
                                  }
                                  field.onChange(newValues);
                                }}
                              />
                              <label htmlFor={`ciudad-${ciudad}`} className="text-sm cursor-pointer">
                                {ciudad}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Ubicación Principal - Solo cuando hay múltiples ciudades */}
                {selectedCiudades.length > 1 && (
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="ubicacionPrincipal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Ubicación Principal
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona la ciudad principal de operaciones" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedCiudades.map((ciudad) => (
                                <SelectItem key={ciudad} value={ciudad}>
                                  {ciudad}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Esta será la ubicación principal mostrada en el directorio y utilizada como referencia principal.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Descripción */}
                <FormField
                  control={form.control}
                  name="descripcionEmpresa"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Descripción de la Empresa
                      </FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Describe detalladamente los productos o servicios que ofrece la empresa, su historia, misión, valores y cualquier información relevante para los clientes..."
                          height={250}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Redes sociales */}
                <div className="md:col-span-2 space-y-4">
                  <FormLabel>Redes Sociales</FormLabel>
                  {redesSociales.map((social, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <Select
                        value={social.plataforma}
                        onValueChange={(value) => updateSocialMedia(index, "plataforma", value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Plataforma" />
                        </SelectTrigger>
                        <SelectContent>
                          {socialPlatforms.map((platform) => (
                            <SelectItem key={platform.name} value={platform.name}>
                              <div className="flex items-center gap-2">
                                <platform.icon className="h-4 w-4" />
                                {platform.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="URL de la red social"
                        value={social.url}
                        onChange={(e) => updateSocialMedia(index, "url", e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSocialMedia(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {redesSociales.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSocialMedia}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Red Social
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Información de Contacto */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-primary">Información de Contacto</h3>
                <p className="text-sm text-gray-600">Datos de contacto y ubicación</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teléfono principal */}
                <FormField
                  control={form.control}
                  name="telefono1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Teléfono Principal
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+52-55-1234-5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Teléfono secundario */}
                <FormField
                  control={form.control}
                  name="telefono2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Teléfono Secundario
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+52-55-1234-5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email principal */}
                <FormField
                  control={form.control}
                  name="email1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Principal *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="contacto@empresa.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email secundario */}
                <FormField
                  control={form.control}
                  name="email2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Secundario
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="ventas@empresa.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dirección física */}
                <FormField
                  control={form.control}
                  name="direccionFisica"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Dirección o Descripción
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Calle, número, colonia, ciudad, estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Emails adicionales */}
                <div className="md:col-span-2 space-y-3">
                  <FormLabel>Emails Adicionales</FormLabel>
                  {emailsAdicionales.map((email, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <Input
                        placeholder={`email${index + 2}@empresa.com`}
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        type="email"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmail(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {emailsAdicionales.length < 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addEmail}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Email Adicional
                    </Button>
                  )}
                </div>

                {/* Teléfono principal */}
                <FormField
                  control={form.control}
                  name="telefono1"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Teléfono Principal
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+52 55 1234 5678" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Teléfonos adicionales */}
                <div className="md:col-span-2 space-y-3">
                  <FormLabel>Teléfonos Adicionales</FormLabel>
                  {telefonosAdicionales.map((telefono, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <Input
                        placeholder={`+52 55 1234 567${index + 8}`}
                        value={telefono}
                        onChange={(e) => updateTelefono(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTelefono(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {telefonosAdicionales.length < 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTelefono}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Teléfono Adicional
                    </Button>
                  )}
                </div>



                {/* Representantes */}
                <div className="md:col-span-2 space-y-3">
                  <FormLabel>Representantes de Ventas (URLs)</FormLabel>
                  {representantes.map((representante, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <Input
                        placeholder="https://perfil-representante.com/usuario"
                        value={representante}
                        onChange={(e) => updateRepresentante(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRepresentante(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {representantes.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRepresentante}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Representante
                    </Button>
                  )}
                </div>

                {/* Direcciones por ciudad */}
                {selectedCiudades.length > 0 && (
                  <div className="md:col-span-2 space-y-6">
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Ubicaciones por Ciudad
                    </FormLabel>
                    {selectedCiudades.map((ciudad) => (
                      <div key={ciudad} className="space-y-4 border rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700">
                          Ubicación en {ciudad}
                        </h4>
                        
                        {/* Componente de mapa */}
                        <MapLocationPicker
                          ciudad={ciudad}
                          onLocationSelect={(location) => updateUbicacionCiudad(ciudad, location)}
                          initialLocation={ubicacionesPorCiudad[ciudad] || null}
                        />
                        
                        {/* Campo de dirección adicional */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Dirección adicional (opcional)
                          </label>
                          <Textarea
                            placeholder={`Información adicional de la dirección en ${ciudad}...`}
                            value={direccionesPorCiudad[ciudad] || ""}
                            onChange={(e) => updateDireccionCiudad(ciudad, e.target.value)}
                            className="min-h-[60px]"
                          />
                          <p className="text-xs text-gray-500">
                            Ej: Edificio, piso, suite, referencias adicionales
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sección: Información de Membresía */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-primary">Información de Membresía</h3>
                <p className="text-sm text-gray-600">Configuración de la membresía y método de pago</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Membresía */}
                <FormField
                  control={form.control}
                  name="membershipTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Membresía</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value ? parseInt(value) : undefined);
                        // Reset periodicidad when membership type changes
                        form.setValue("membershipPeriodicidad", "");
                        form.setValue("fechaFinMembresia", "");
                      }} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo de membresía" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {membershipTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.nombrePlan}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Periodicidad de Membresía */}
                <FormField
                  control={form.control}
                  name="membershipPeriodicidad"
                  render={({ field }) => {
                    const selectedMembershipId = form.watch("membershipTypeId");
                    const selectedMembership = membershipTypes.find(m => m.id === selectedMembershipId);
                    let opcionesPrecios = [];
                    if (selectedMembership && selectedMembership.opcionesPrecios) {
                      try {
                        if (typeof selectedMembership.opcionesPrecios === 'string') {
                          opcionesPrecios = JSON.parse(selectedMembership.opcionesPrecios);
                        } else if (Array.isArray(selectedMembership.opcionesPrecios)) {
                          opcionesPrecios = selectedMembership.opcionesPrecios;
                        }
                      } catch (error) {
                        console.error("Error parsing opcionesPrecios:", error);
                        opcionesPrecios = [];
                      }
                    }

                    // Auto-select if only one option available
                    useEffect(() => {
                      if (opcionesPrecios.length === 1 && !field.value) {
                        const singleOption = opcionesPrecios[0];
                        field.onChange(singleOption.periodicidad.toLowerCase());
                        console.log("Auto-selecting single periodicidad option:", singleOption.periodicidad.toLowerCase());
                      }
                    }, [opcionesPrecios, field.value, field.onChange]);

                    return (
                      <FormItem>
                        <FormLabel>Periodicidad</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedMembershipId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona periodicidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {opcionesPrecios.map((opcion: any, index: number) => (
                              <SelectItem key={index} value={opcion.periodicidad.toLowerCase()}>
                                {opcion.periodicidad.charAt(0).toUpperCase() + opcion.periodicidad.slice(1)} - ${opcion.costo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Forma de Pago */}
                <FormField
                  control={form.control}
                  name="formaPago"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pago</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona forma de pago" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha de Inicio */}
                <FormField
                  control={form.control}
                  name="fechaInicioMembresia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Inicio</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha de Finalización */}
                <FormField
                  control={form.control}
                  name="fechaFinMembresia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Finalización</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notas de Membresía */}
                <FormField
                  control={form.control}
                  name="notasMembresia"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notas de Membresía</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notas adicionales sobre la membresía, condiciones especiales, etc."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estado de la Empresa */}
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Estado de la Empresa</FormLabel>
                          <FormDescription>
                            Controla si la empresa aparece activa en el directorio público
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value === "activo"}
                            onCheckedChange={(checked) => field.onChange(checked ? "activo" : "inactivo")}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Actualizando..." : "Actualizar Empresa"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}