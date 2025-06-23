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

type FormData = z.infer<typeof formSchema>;

export default function EditCompanyModal({ open, onOpenChange, company }: EditCompanyModalProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombreEmpresa: "",
      telefono1: "",
      email1: "",
      sitioWeb: "",
      direccionFisica: "",
      descripcionEmpresa: "",
      tagIds: [],
    },
  });

  useEffect(() => {
    if (company && open) {
      form.reset({
        nombreEmpresa: company.nombreEmpresa || "",
        telefono1: company.telefono1 || "",
        email1: company.email1 || "",
        sitioWeb: company.sitioWeb || "",
        direccionFisica: company.direccionFisica || "",
        descripcionEmpresa: company.descripcionEmpresa || "",
        tagIds: company.tags?.map(tag => tag.id) || [],
      });
    }
  }, [company, open, form]);

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!company) throw new Error("No company selected");
      return apiRequest("PUT", `/api/companies/${company.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/by-user"] });
      toast({
        title: "Empresa actualizada",
        description: "La información de la empresa ha sido actualizada exitosamente",
      });
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

  const onSubmit = (data: FormData) => {
    updateCompanyMutation.mutate(data);
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Editar Información de la Empresa
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