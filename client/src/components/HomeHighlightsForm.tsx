import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertHomeHighlightsSchema, type HomeHighlights } from "@shared/schema";
import { X } from "lucide-react";

const formSchema = insertHomeHighlightsSchema.extend({
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
});

interface HomeHighlightsFormProps {
  highlight?: HomeHighlights | null;
  onClose: () => void;
}

export function HomeHighlightsForm({ highlight, onClose }: HomeHighlightsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get companies and categories for selection
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: highlight?.tipo || "company",
      entityId: highlight?.entityId || 0,
      titulo: highlight?.titulo || "",
      descripcion: highlight?.descripcion || "",
      imagenUrl: highlight?.imagenUrl || "",
      orden: highlight?.orden || 0,
      fechaInicio: highlight?.fechaInicio ? new Date(highlight.fechaInicio).toISOString().split('T')[0] : "",
      fechaFin: highlight?.fechaFin ? new Date(highlight.fechaFin).toISOString().split('T')[0] : "",
      activo: highlight?.activo ?? true,
    },
  });

  const watchedTipo = form.watch("tipo");

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      const submitData = {
        ...data,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
      };
      return apiRequest("POST", "/api/home-highlights", submitData);
    },
    onSuccess: () => {
      toast({ title: "Elemento destacado creado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/home-highlights"] });
      onClose();
    },
    onError: () => {
      toast({ title: "Error al crear elemento destacado", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      const submitData = {
        ...data,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
      };
      return apiRequest("PATCH", `/api/home-highlights/${highlight?.id}`, submitData);
    },
    onSuccess: () => {
      toast({ title: "Elemento destacado actualizado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/home-highlights"] });
      onClose();
    },
    onError: () => {
      toast({ title: "Error al actualizar elemento destacado", variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (highlight) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const getEntityOptions = () => {
    switch (watchedTipo) {
      case "company":
        return companies.map((company: any) => ({
          value: company.id.toString(),
          label: company.nombreEmpresa,
        }));
      case "category":
        return categories.map((category: any) => ({
          value: category.id.toString(),
          label: category.nombre,
        }));
      case "project":
        return projects.map((project: any) => ({
          value: project.id.toString(),
          label: project.nombreProyecto,
        }));
      default:
        return [];
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>
              {highlight ? "Editar Elemento Destacado" : "Nuevo Elemento Destacado"}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Elemento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="company">Empresa</SelectItem>
                        <SelectItem value="category">Categoría</SelectItem>
                        <SelectItem value="project">Proyecto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seleccionar {watchedTipo === "company" ? "Empresa" : watchedTipo === "category" ? "Categoría" : "Proyecto"}</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`Selecciona ${watchedTipo === "company" ? "empresa" : watchedTipo === "category" ? "categoría" : "proyecto"}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getEntityOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título Personalizado</FormLabel>
                  <FormControl>
                    <Input placeholder="Título para mostrar (opcional)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Si se deja vacío, se usará el nombre del elemento seleccionado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción destacada del elemento..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="imagenUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de Imagen</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Imagen personalizada (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orden"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Orden de aparición
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    <FormDescription>
                      Cuándo empezar a mostrar (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaFin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Cuándo dejar de mostrar (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Estado Activo</FormLabel>
                    <FormDescription>
                      Mostrar este elemento en la página principal
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {highlight ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}