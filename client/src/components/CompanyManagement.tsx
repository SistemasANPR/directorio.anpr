import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Building, 
  Edit, 
  Save, 
  X, 
  Upload, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  Camera,
  FileText,
  Tag,
  Award,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DynamicSocialMedia from "@/components/DynamicSocialMedia";

const companyUpdateSchema = z.object({
  nombreEmpresa: z.string().min(1, "El nombre de la empresa es requerido"),
  email1: z.string().email("Email inválido"),
  email2: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono1: z.string().min(1, "El teléfono principal es requerido"),
  telefono2: z.string().optional(),
  sitioWeb: z.string().url("URL inválida").optional().or(z.literal("")),
  direccionFisica: z.string().min(1, "La dirección es requerida"),
  descripcionEmpresa: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  paisesPresencia: z.array(z.string()).optional(),
  estadosPresencia: z.array(z.string()).optional(),
  ciudadesPresencia: z.array(z.string()).optional(),
  ubicacionPrincipal: z.string().optional(),
  representantesVentas: z.array(z.string()).optional(),
  catalogoDigitalUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  redesSociales: z.record(z.string()).optional(),
});

type CompanyUpdateData = z.infer<typeof companyUpdateSchema>;

interface CompanyManagementProps {
  companyId: number;
}

export default function CompanyManagement({ companyId }: CompanyManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { toast } = useToast();

  // Fetch company data
  const { data: company, isLoading } = useQuery({
    queryKey: ["/api/companies", companyId],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch company");
      return response.json();
    },
  });

  // Fetch categories for selection
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Fetch certificates for selection
  const { data: certificates = [] } = useQuery({
    queryKey: ["/api/certificates"],
    queryFn: async () => {
      const response = await fetch("/api/certificates", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch certificates");
      return response.json();
    },
  });

  const form = useForm<CompanyUpdateData>({
    resolver: zodResolver(companyUpdateSchema),
    defaultValues: {
      nombreEmpresa: "",
      email1: "",
      email2: "",
      telefono1: "",
      telefono2: "",
      sitioWeb: "",
      direccionFisica: "",
      descripcionEmpresa: "",
      catalogoDigitalUrl: "",
      redesSociales: {
        facebook: "",
        twitter: "",
        instagram: "",
        linkedin: "",
        youtube: "",
        whatsapp: "",
      },
    },
  });

  // Reset form when company data loads
  useEffect(() => {
    if (company) {
      form.reset({
        nombreEmpresa: company.nombreEmpresa || "",
        email1: company.email1 || "",
        email2: company.email2 || "",
        telefono1: company.telefono1 || "",
        telefono2: company.telefono2 || "",
        sitioWeb: company.sitioWeb || "",
        direccionFisica: company.direccionFisica || "",
        descripcionEmpresa: company.descripcionEmpresa || "",
        catalogoDigitalUrl: company.catalogoDigitalUrl || "",
        redesSociales: company.redesSociales || {
          facebook: "",
          twitter: "",
          instagram: "",
          linkedin: "",
          youtube: "",
          whatsapp: "",
        },
      });
    }
  }, [company, form]);

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyUpdateData) => {
      const response = await apiRequest("PUT", `/api/companies/${companyId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empresa actualizada",
        description: "La información de tu empresa se ha actualizado correctamente",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la empresa",
        variant: "destructive",
      });
    },
  });

  // Upload images mutation
  const uploadImagesMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('galeriaImagenes', file);
      });

      const response = await fetch(`/api/companies/${companyId}/images`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error("Error al subir imágenes");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Imágenes subidas",
        description: "Las imágenes se han subido correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId] });
      setUploadingImages(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al subir imágenes",
        variant: "destructive",
      });
      setUploadingImages(false);
    },
  });

  const onSubmit = (data: CompanyUpdateData) => {
    updateCompanyMutation.mutate(data);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadingImages(true);
      uploadImagesMutation.mutate(files);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bcce16]"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontró información de la empresa</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-6 w-6" />
              {company.nombreEmpresa}
            </CardTitle>
            <p className="text-gray-600 mt-1">Información general de tu empresa</p>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
            className={isEditing ? "" : "bg-[#bcce16] hover:bg-[#a8b814] text-black"}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            /* View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Información de Contacto</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{company.email1}</span>
                    </div>
                    {company.email2 && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{company.email2}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{company.telefono1}</span>
                    </div>
                    {company.telefono2 && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{company.telefono2}</span>
                      </div>
                    )}
                    {company.sitioWeb && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a href={company.sitioWeb} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {company.sitioWeb}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Ubicación</Label>
                  <div className="mt-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <span className="text-sm">{company.direccionFisica}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Descripción</Label>
                  <p className="mt-2 text-sm text-gray-700">{company.descripcionEmpresa}</p>
                </div>

                {company.catalogoDigitalUrl && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Catálogo Digital</Label>
                    <div className="mt-2">
                      <a 
                        href={company.catalogoDigitalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Ver catálogo
                      </a>
                    </div>
                  </div>
                )}

                {/* Categories */}
                {company.categories && company.categories.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Categorías</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {company.categories.map((category: any) => (
                        <Badge key={category.id} variant="secondary">
                          <Tag className="h-3 w-3 mr-1" />
                          {category.nombreCategoria}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificates */}
                {company.certificates && company.certificates.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Certificados</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {company.certificates.map((certificate: any) => (
                        <Badge key={certificate.id} variant="secondary">
                          <Award className="h-3 w-3 mr-1" />
                          {certificate.nombreCertificado}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nombreEmpresa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Empresa</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Secundario (Opcional)</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefono1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono Principal</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefono2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono Secundario (Opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sitioWeb"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sitio Web (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="direccionFisica"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección Física</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
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
                            <Textarea {...field} rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="catalogoDigitalUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catálogo Digital (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.ejemplo.com/catalogo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Social Media Section */}
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="redesSociales"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <DynamicSocialMedia
                                value={field.value || {}}
                                onChange={field.onChange}
                                disabled={updateCompanyMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateCompanyMutation.isPending}
                    className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
                  >
                    {updateCompanyMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Image Gallery Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Galería de Productos
          </CardTitle>
          <p className="text-sm text-gray-600">Gestiona las imágenes de tus productos y servicios</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button 
                  asChild
                  variant="outline"
                  disabled={uploadingImages}
                  className="cursor-pointer"
                >
                  <span>
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Imágenes
                      </>
                    )}
                  </span>
                </Button>
              </label>
              <p className="text-sm text-gray-500">Máximo 4 imágenes, formatos JPG, PNG</p>
            </div>

            {company.galeriaProductosUrls && company.galeriaProductosUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {company.galeriaProductosUrls.map((url: string, index: number) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Producto ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}