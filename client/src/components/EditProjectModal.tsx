import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ProjectWithDetails } from "@shared/schema";

const projectSchema = z.object({
  nombreProyecto: z.string().min(1, "El nombre del proyecto es requerido"),
  descripcionProyecto: z.string().min(1, "La descripción del proyecto es requerida"),
  categoryId: z.number().min(1, "La categoría es requerida"),
  clienteContratante: z.string().optional(),
  ubicacionPais: z.string().optional(),
  ubicacionEstado: z.string().optional(),
  ubicacionCiudad: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFinalizacion: z.string().optional(),
  areaSuperficie: z.string().optional(),
  videoUrl: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithDetails;
  companyId: number;
  onSuccess?: () => void;
}

export default function EditProjectModal({
  open,
  onOpenChange,
  project,
  companyId,
  onSuccess
}: EditProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      nombreProyecto: project.nombreProyecto || "",
      descripcionProyecto: project.descripcionProyecto || "",
      categoryId: project.categoryId || 0,
      clienteContratante: project.clienteContratante || "",
      ubicacionPais: project.ubicacionPais || "",
      ubicacionEstado: project.ubicacionEstado || "",
      ubicacionCiudad: project.ubicacionCiudad || "",
      fechaInicio: project.fechaInicio || "",
      fechaFinalizacion: project.fechaFinalizacion || "",
      areaSuperficie: project.areaSuperficie || "",
      videoUrl: project.videoUrl || "",
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await apiRequest("PUT", `/api/projects/${project.id}`, data);
      if (!response.ok) {
        throw new Error("Error al actualizar el proyecto");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Proyecto actualizado",
        description: "El proyecto se ha actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${companyId}/projects`] });
      queryClient.invalidateQueries({ queryKey: [`/api/companies`, companyId.toString()] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el proyecto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    updateProjectMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proyecto</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombreProyecto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Proyecto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Centro Comercial Plaza Norte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.nombreCategoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descripcionProyecto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del Proyecto *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe los detalles del proyecto..."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clienteContratante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente/Contratante</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Gobierno Municipal" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="areaSuperficie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área/Superficie</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 5,000 m²" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="ubicacionPais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: México" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ubicacionEstado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Ciudad de México" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ubicacionCiudad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Polanco" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fechaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaFinalizacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Finalización</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL del Video (YouTube/Vimeo)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://youtube.com/watch?v=..." 
                      type="url" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateProjectMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateProjectMutation.isPending}
                style={{ backgroundColor: '#bcce16' }}
                className="hover:bg-[#a8b814]"
              >
                {updateProjectMutation.isPending ? "Actualizando..." : "Actualizar Proyecto"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}