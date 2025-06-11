import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { insertHomeConfigurationSchema, type HomeConfiguration } from "@shared/schema";
import { X } from "lucide-react";

const formSchema = insertHomeConfigurationSchema.extend({
  configuracionJson: z.any().optional(),
});

interface HomeConfigFormProps {
  config?: HomeConfiguration | null;
  onClose: () => void;
}

export function HomeConfigForm({ config, onClose }: HomeConfigFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      seccion: config?.seccion || "",
      titulo: config?.titulo || "",
      subtitulo: config?.subtitulo || "",
      descripcion: config?.descripcion || "",
      imagenUrl: config?.imagenUrl || "",
      videoUrl: config?.videoUrl || "",
      enlaceBoton: config?.enlaceBoton || "",
      textoBoton: config?.textoBoton || "",
      orden: config?.orden || 0,
      activo: config?.activo ?? true,
      configuracionJson: config?.configuracionJson || undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => 
      apiRequest("POST", "/api/home-config", data),
    onSuccess: () => {
      toast({ title: "Configuración creada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/home-config"] });
      onClose();
    },
    onError: () => {
      toast({ title: "Error al crear configuración", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) =>
      apiRequest("PATCH", `/api/home-config/${config?.id}`, data),
    onSuccess: () => {
      toast({ title: "Configuración actualizada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/home-config"] });
      onClose();
    },
    onError: () => {
      toast({ title: "Error al actualizar configuración", variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (config) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const sectionOptions = [
    { value: "hero", label: "Sección Hero" },
    { value: "about", label: "Acerca de" },
    { value: "services", label: "Servicios" },
    { value: "companies", label: "Empresas Destacadas" },
    { value: "categories", label: "Categorías" },
    { value: "statistics", label: "Estadísticas" },
    { value: "contact", label: "Contacto" },
    { value: "footer", label: "Pie de página" },
    { value: "custom", label: "Personalizada" },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>
              {config ? "Editar Configuración" : "Nueva Configuración"}
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
                name="seccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sección</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una sección" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sectionOptions.map((option) => (
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
                      Orden de aparición en la página
                    </FormDescription>
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
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo</FormLabel>
                  <FormControl>
                    <Input placeholder="Subtítulo opcional" {...field} />
                  </FormControl>
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
                      placeholder="Descripción del contenido..."
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de Video</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="textoBoton"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto del Botón</FormLabel>
                    <FormControl>
                      <Input placeholder="Ver más..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enlaceBoton"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enlace del Botón</FormLabel>
                    <FormControl>
                      <Input placeholder="/ruta o https://..." {...field} />
                    </FormControl>
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
                      Mostrar esta configuración en la página principal
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
                {config ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}