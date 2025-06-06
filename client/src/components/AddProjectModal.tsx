import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema } from "@shared/schema";
import type { ProjectWithDetails, Category } from "@shared/schema";

const projectFormSchema = insertProjectSchema.extend({
  galeriaImagenes: z.array(z.instanceof(File)).max(4, "Máximo 4 imágenes").optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  project?: ProjectWithDetails;
  onSuccess?: () => void;
}

export default function AddProjectModal({ 
  open, 
  onOpenChange, 
  companyId, 
  project, 
  onSuccess 
}: AddProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    enabled: open,
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      companyId,
      nombreProyecto: project?.nombreProyecto || "",
      descripcionProyecto: project?.descripcionProyecto || "",
      categoryId: project?.categoryId || undefined,
      fechaInicio: project?.fechaInicio || "",
      fechaFinalizacion: project?.fechaFinalizacion || "",
      ubicacionPais: project?.ubicacionPais || "",
      ubicacionEstado: project?.ubicacionEstado || "",
      ubicacionCiudad: project?.ubicacionCiudad || "",
      clienteContratante: project?.clienteContratante || "",
      areaSuperficie: project?.areaSuperficie || "",
      serviciosProductos: project?.serviciosProductos || [],
      videoUrl: project?.videoUrl || "",
      estado: project?.estado || "borrador",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const formData = new FormData();
      
      // Agregar campos del proyecto
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'galeriaImagenes') return; // Se maneja por separado
        if (key === 'serviciosProductos') {
          formData.append(key, JSON.stringify(value || []));
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Agregar imágenes
      imageFiles.forEach((file) => {
        formData.append('galeriaImagenes', file);
      });

      const url = project ? `/api/projects/${project.id}` : "/api/projects";
      const method = project ? "PATCH" : "POST";
      
      return apiRequest(method, url, formData);
    },
    onSuccess: () => {
      toast({
        title: project ? "Proyecto actualizado" : "Proyecto creado",
        description: project 
          ? "El proyecto se ha actualizado exitosamente." 
          : "El proyecto se ha creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onOpenChange(false);
      form.reset();
      setImageFiles([]);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al procesar el proyecto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    mutation.mutate(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 4) {
      toast({
        title: "Error",
        description: "Máximo 4 imágenes permitidas",
        variant: "destructive",
      });
      return;
    }
    setImageFiles(files);
  };

  const addServiceProduct = () => {
    const currentServices = form.getValues("serviciosProductos") || [];
    form.setValue("serviciosProductos", [...currentServices, ""]);
  };

  const removeServiceProduct = (index: number) => {
    const currentServices = form.getValues("serviciosProductos") || [];
    form.setValue("serviciosProductos", currentServices.filter((_, i) => i !== index));
  };

  const updateServiceProduct = (index: number, value: string) => {
    const currentServices = form.getValues("serviciosProductos") || [];
    currentServices[index] = value;
    form.setValue("serviciosProductos", currentServices);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? "Editar Proyecto" : "Agregar Nuevo Proyecto"}
          </DialogTitle>
          <DialogDescription>
            {project 
              ? "Modifica la información del proyecto." 
              : "Agrega un nuevo proyecto a tu empresa. Máximo 5 proyectos por empresa."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Básica</h3>
                
                <FormField
                  control={form.control}
                  name="nombreProyecto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Proyecto *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Modernización Plaza Central" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descripcionProyecto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del Proyecto</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe los detalles del proyecto..."
                          rows={4}
                        />
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
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fechaInicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Información de Ubicación y Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ubicación y Cliente</h3>
                
                <FormField
                  control={form.control}
                  name="clienteContratante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente/Contratante</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nombre del cliente o empresa contratante" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="ubicacionPais"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="México" />
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
                          <Input {...field} placeholder="Ej: CDMX" />
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
                          <Input {...field} placeholder="Ej: Benito Juárez" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="areaSuperficie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área/Superficie</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: 5000 m², 2 hectáreas" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado del Proyecto</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="borrador">Borrador</SelectItem>
                          <SelectItem value="publicado">Publicado</SelectItem>
                          <SelectItem value="archivado">Archivado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Servicios/Productos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Servicios/Productos Utilizados</h3>
                <Button type="button" variant="outline" onClick={addServiceProduct}>
                  Agregar Servicio
                </Button>
              </div>
              
              {form.watch("serviciosProductos")?.map((service, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={service}
                    onChange={(e) => updateServiceProduct(index, e.target.value)}
                    placeholder="Ej: Mobiliario urbano, Iluminación LED..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeServiceProduct(index)}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>

            {/* Multimedia */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contenido Multimedia</h3>
              
              <div>
                <Label htmlFor="images">Galería de Imágenes (máximo 4)</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="mt-1"
                />
                {imageFiles.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {imageFiles.length} imagen(es) seleccionada(s)
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del Video (YouTube/Vimeo)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        type="url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending 
                  ? (project ? "Actualizando..." : "Creando...") 
                  : (project ? "Actualizar Proyecto" : "Crear Proyecto")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}