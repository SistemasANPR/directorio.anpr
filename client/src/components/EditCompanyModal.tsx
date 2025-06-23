import { useState, useCallback, useEffect } from "react";
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
import { insertCompanySchema, Category, MembershipType, Certificate, CompanyWithDetails } from "@shared/schema";
import TagSelector from "@/components/TagSelector";
import { paisesAmericaLatina, estadosMexico, ciudadesPorEstado } from "@/lib/locationData";
import { 
  Upload, X, Building, Phone, Mail, Plus, FileText, Trash2, Facebook, Instagram, Linkedin, Twitter, Youtube, Globe, MapPin,
  Tags, Building2, Car, Truck, Hammer, Factory, Cpu, Wrench, ShoppingBag,
  Briefcase, Heart, GraduationCap, Home, Coffee, Camera, Music,
  Gamepad2, Book, Palette, Plane, Ship, Train, Zap
} from "lucide-react";
import MapLocationPicker from "./MapLocationPicker";
import RichTextEditor from "./RichTextEditor";

// Schema simplificado para edición
const companySchema = z.object({
  nombreEmpresa: z.string().min(1, "El nombre de la empresa es requerido"),
  telefono1: z.string().min(1, "Teléfono principal es requerido"),
  telefono2: z.string().optional(),
  email1: z.string().email("Email principal inválido"),
  email2: z.string().email("Email secundario inválido").optional().or(z.literal("")),
  sitioWeb: z.string().url("URL inválida").optional().or(z.literal("")),
  direccionFisica: z.string().min(1, "Dirección física es requerida"),
  descripcionEmpresa: z.string().min(1, "Descripción es requerida"),
  ubicacionPrincipal: z.string().optional(),
  ubicacionGeografica: z.string().optional(),
  representantesVentas: z.string().optional(),
  catalogoDigitalUrl: z.string().optional(),
  categoriesIds: z.array(z.number()).optional(),
  certificateIds: z.array(z.number()).optional(),
  tagIds: z.array(z.number()).optional(),
  membershipTypeId: z.number().min(1, "Tipo de membresía es requerido"),
  membershipPeriodicidad: z.string().optional(),
  formaPago: z.string().optional(),
  fechaInicioMembresia: z.string().optional(),
  fechaFinMembresia: z.string().optional(),
  notasMembresia: z.string().optional(),
  paisesPresencia: z.array(z.string()).optional(),
  estadosPresencia: z.array(z.string()).optional(),
  ciudadesPresencia: z.array(z.string()).optional(),
  paisesPresenciaOtro: z.string().optional(),
  estadosPresenciaOtro: z.string().optional(),
  ciudadesPresenciaOtro: z.string().optional(),
  redesSociales: z.array(z.object({
    nombre: z.string(),
    url: z.string()
  })).optional(),
  videosUrls: z.array(z.string()).optional(),
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

export default function EditCompanyModal({ open, onOpenChange, company }: EditCompanyModalProps) {
  const { toast } = useToast();
  
  // Estados para manejar archivos y selecciones
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [selectedCiudades, setSelectedCiudades] = useState<string[]>([]);
  const [catalogoFile, setCatalogoFile] = useState<File | null>(null);
  const [redesSociales, setRedesSociales] = useState<Array<{nombre: string, url: string}>>([]);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaPreviews, setGaleriaPreviews] = useState<string[]>([]);
  const [emailsAdicionales, setEmailsAdicionales] = useState<string[]>([]);
  const [telefonosAdicionales, setTelefonosAdicionales] = useState<string[]>([]);
  const [representantes, setRepresentantes] = useState<Array<{nombre: string, cargo: string, telefono: string, email: string}>>([]);
  const [direccionesPorCiudad, setDireccionesPorCiudad] = useState<{[ciudad: string]: string}>({});
  const [ubicacionesPorCiudad, setUbicacionesPorCiudad] = useState<{[ciudad: string]: { lat: number; lng: number; address: string }}>({});
  const [videosUrls, setVideosUrls] = useState<string[]>([]);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nombreEmpresa: "",
      telefono1: "",
      telefono2: "",
      email1: "",
      email2: "",
      sitioWeb: "",
      direccionFisica: "",
      descripcionEmpresa: "",
      ubicacionPrincipal: "",
      ubicacionGeografica: "",
      representantesVentas: "",
      catalogoDigitalUrl: "",
      categoriesIds: [],
      certificateIds: [],
      tagIds: [],
      membershipTypeId: 1,
      membershipPeriodicidad: "",
      formaPago: "",
      fechaInicioMembresia: "",
      fechaFinMembresia: "",
      notasMembresia: "",
      paisesPresencia: [],
      estadosPresencia: [],
      ciudadesPresencia: [],
      paisesPresenciaOtro: "",
      estadosPresenciaOtro: "",
      ciudadesPresenciaOtro: "",
      redesSociales: [],
      videosUrls: [],
    },
  });

  // Function to render the correct icon for categories
  const renderCategoryIcon = (category: Category) => {
    if (category.iconoUrl) {
      return (
        <img
          src={category.iconoUrl}
          alt={category.nombreCategoria}
          className="w-5 h-5 object-cover rounded"
        />
      );
    }

    const iconName = category.icono || "Tags";
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Tags;
    return <IconComponent className="w-5 h-5 text-primary" />;
  };

  // Plataformas de redes sociales disponibles
  const socialPlatforms = [
    { name: "Facebook", icon: Facebook },
    { name: "Instagram", icon: Instagram },
    { name: "LinkedIn", icon: Linkedin },
    { name: "Twitter", icon: Twitter },
    { name: "YouTube", icon: Youtube },
    { name: "Sitio Web", icon: Globe },
  ];

  // Poblar formulario cuando se abre con empresa
  useEffect(() => {
    if (company && open) {
      const currentDate = new Date().toISOString().split('T')[0];
      form.reset({
        nombreEmpresa: company.nombreEmpresa || "",
        telefono1: company.telefono1 || "",
        telefono2: company.telefono2 || "",
        email1: company.email1 || "",
        email2: company.email2 || "",
        sitioWeb: company.sitioWeb || "",
        direccionFisica: company.direccionFisica || "",
        descripcionEmpresa: company.descripcionEmpresa || "",
        ubicacionPrincipal: company.ubicacionPrincipal || "",
        ubicacionGeografica: company.ubicacionGeografica || "",
        representantesVentas: company.representantesVentas || "",
        catalogoDigitalUrl: company.catalogoDigitalUrl || "",
        categoriesIds: company.categoriesIds || [],
        certificateIds: company.certificateIds || [],
        tagIds: company.tagIds || [],
        membershipTypeId: company.membershipTypeId || 1,
        membershipPeriodicidad: company.membershipPeriodicidad || "",
        formaPago: company.formaPago || "",
        fechaInicioMembresia: company.fechaInicioMembresia || currentDate,
        fechaFinMembresia: company.fechaFinMembresia || "",
        notasMembresia: company.notasMembresia || "",
        paisesPresencia: company.paisesPresencia || [],
        estadosPresencia: company.estadosPresencia || [],
        ciudadesPresencia: company.ciudadesPresencia || [],
        paisesPresenciaOtro: company.paisesPresenciaOtro || "",
        estadosPresenciaOtro: company.estadosPresenciaOtro || "",
        ciudadesPresenciaOtro: company.ciudadesPresenciaOtro || "",
        redesSociales: company.redesSociales || [],
        videosUrls: company.videosUrls || [],
      });
      
      // Set logo preview if exists
      if (company.logotipoUrl) {
        setLogoPreview(company.logotipoUrl);
      }
      
      // Set gallery previews if exist
      if (company.galeriaProductosUrls) {
        const urls = Array.isArray(company.galeriaProductosUrls) 
          ? company.galeriaProductosUrls 
          : [];
        setGaleriaPreviews(urls);
      }

      // Set redes sociales
      if (company.redesSociales) {
        setRedesSociales(Array.isArray(company.redesSociales) ? company.redesSociales : []);
      }

      // Set estados and ciudades if they exist
      if (company.estadosPresencia) {
        const estados = Array.isArray(company.estadosPresencia) ? company.estadosPresencia : [];
        setSelectedEstados(estados);
      }
      
      if (company.ciudadesPresencia) {
        const ciudades = Array.isArray(company.ciudadesPresencia) ? company.ciudadesPresencia : [];
        setSelectedCiudades(ciudades);
      }

      // Set videos URLs
      if (company.videosUrls) {
        setVideosUrls(Array.isArray(company.videosUrls) ? company.videosUrls : []);
      }
    }
  }, [company, open, form]);

  // Fetch data
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: open,
  });

  const { data: membershipTypes = [] } = useQuery<MembershipType[]>({
    queryKey: ["/api/membership-types"],
    enabled: open,
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    enabled: open,
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      if (!company) throw new Error("No hay empresa para actualizar");
      const response = await apiRequest("PUT", `/api/companies/${company.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empresa actualizada",
        description: "La información se ha actualizado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar empresa",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    updateCompanyMutation.mutate(data);
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Editar Información de la Empresa - {company.nombreEmpresa}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombreEmpresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Empresa *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nombre de la empresa"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefono1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono Principal</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="+52 777 123 4567"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Principal</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        type="email"
                        placeholder="contacto@empresa.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sitioWeb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitio Web</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      type="url"
                      placeholder="https://www.empresa.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direccionFisica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección Física</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="Dirección completa de la empresa"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcionEmpresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción de la Empresa</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Descripción detallada de la empresa"
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags Section */}
            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiquetas</FormLabel>
                  <FormControl>
                    <TagSelector
                      selectedTagIds={field.value || []}
                      onTagsChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateCompanyMutation.isPending}
                className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
              >
                {updateCompanyMutation.isPending ? "Actualizando..." : "Actualizar Empresa"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}