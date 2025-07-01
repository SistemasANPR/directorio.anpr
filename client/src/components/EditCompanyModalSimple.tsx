import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CompanyWithDetails } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Schema simplificado para el formulario
const editCompanySchema = z.object({
  nombreEmpresa: z.string().min(1, "El nombre de la empresa es requerido"),
  telefono1: z.string().optional(),
  email1: z.string().email("Email inválido").min(1, "El email es requerido"),
  sitioWeb: z.string().url("URL inválida").optional().or(z.literal("")),
  descripcionEmpresa: z.string().optional(),
  direccionFisica: z.string().optional(),
});

type EditCompanyFormData = z.infer<typeof editCompanySchema>;

interface EditCompanyModalSimpleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyWithDetails | null;
  userRole?: 'admin' | 'representante';
}

export default function EditCompanyModalSimple({ 
  open, 
  onOpenChange, 
  company, 
  userRole = 'admin' 
}: EditCompanyModalSimpleProps) {
  const { toast } = useToast();

  const form = useForm<EditCompanyFormData>({
    resolver: zodResolver(editCompanySchema),
    defaultValues: {
      nombreEmpresa: "",
      telefono1: "",
      email1: "",
      sitioWeb: "",
      descripcionEmpresa: "",
      direccionFisica: "",
    },
  });

  // Populate form when company data changes
  useEffect(() => {
    if (company) {
      form.reset({
        nombreEmpresa: company.nombreEmpresa || "",
        telefono1: company.telefono1 || "",
        email1: company.email1 || "",
        sitioWeb: company.sitioWeb || "",
        descripcionEmpresa: company.descripcionEmpresa || "",
        direccionFisica: company.direccionFisica || "",
      });
    }
  }, [company, form]);

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: EditCompanyFormData) => {
      const response = await apiRequest("PUT", `/api/companies/${company?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empresa actualizada",
        description: "La información de la empresa ha sido actualizada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: [`/api/representative/dashboard/${company?.userId}`] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "Hubo un error al actualizar la empresa.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditCompanyFormData) => {
    updateCompanyMutation.mutate(data);
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {userRole === 'admin' ? 'Editar Empresa' : 'Editar Mi Empresa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombreEmpresa">Nombre de la Empresa *</Label>
                  <Input
                    id="nombreEmpresa"
                    {...form.register("nombreEmpresa")}
                    disabled={updateCompanyMutation.isPending}
                  />
                  {form.formState.errors.nombreEmpresa && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.nombreEmpresa.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email1">Email Principal *</Label>
                  <Input
                    id="email1"
                    type="email"
                    {...form.register("email1")}
                    disabled={updateCompanyMutation.isPending}
                  />
                  {form.formState.errors.email1 && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.email1.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="telefono1">Teléfono Principal</Label>
                  <Input
                    id="telefono1"
                    {...form.register("telefono1")}
                    disabled={updateCompanyMutation.isPending}
                  />
                </div>

                <div>
                  <Label htmlFor="sitioWeb">Sitio Web</Label>
                  <Input
                    id="sitioWeb"
                    placeholder="https://ejemplo.com"
                    {...form.register("sitioWeb")}
                    disabled={updateCompanyMutation.isPending}
                  />
                  {form.formState.errors.sitioWeb && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.sitioWeb.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="descripcionEmpresa">Descripción de la Empresa</Label>
                <Textarea
                  id="descripcionEmpresa"
                  rows={4}
                  placeholder="Describe tu empresa, servicios y especialidades..."
                  {...form.register("descripcionEmpresa")}
                  disabled={updateCompanyMutation.isPending}
                />
              </div>

              <div>
                <Label htmlFor="direccionFisica">Dirección Física</Label>
                <Input
                  id="direccionFisica"
                  placeholder="Calle, número, colonia, ciudad, estado"
                  {...form.register("direccionFisica")}
                  disabled={updateCompanyMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateCompanyMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
              disabled={updateCompanyMutation.isPending}
            >
              {updateCompanyMutation.isPending ? "Actualizando..." : "Actualizar Empresa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}