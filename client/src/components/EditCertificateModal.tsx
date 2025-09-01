import { useEffect } from "react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { insertCertificateSchema, Certificate } from "@shared/schema";
import { Award } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";

interface EditCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: Certificate | null;
}

const formSchema = insertCertificateSchema.extend({
  fechaEmision: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  asignacionAutomatica: z.boolean().optional(),
  membershipPlanIds: z.array(z.number()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditCertificateModal({ open, onOpenChange, certificate }: EditCertificateModalProps) {
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  
  // Debug: Log para verificar el estado del usuario y admin
  console.log("EditCertificateModal RENDER - User:", user);
  console.log("EditCertificateModal RENDER - IsAdmin:", isAdmin);
  console.log("EditCertificateModal RENDER - Open:", open);
  console.log("EditCertificateModal RENDER - Certificate:", certificate);
  
  // Log específico para verificar si la sección se renderiza
  console.log("EditCertificateModal - Will render admin section:", isAdmin && open);

  // Obtener tipos de membresía para la selección
  const { data: membershipTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/membership-types"],
    enabled: isAdmin // Solo cargar si es admin
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombreCertificado: "",
      descripcion: "",
      entidadEmisora: "",
      fechaEmision: "",
      fechaVencimiento: "",
      imagenUrl: "",
      estado: "activo",
      asignacionAutomatica: false,
      membershipPlanIds: [],
    },
  });

  useEffect(() => {
    if (certificate && open) {
      const fechaEmision = certificate.fechaEmision 
        ? new Date(certificate.fechaEmision).toISOString().split('T')[0]
        : "";
      const fechaVencimiento = certificate.fechaVencimiento 
        ? new Date(certificate.fechaVencimiento).toISOString().split('T')[0]
        : "";

      form.reset({
        nombreCertificado: certificate.nombreCertificado || "",
        descripcion: certificate.descripcion || "",
        entidadEmisora: certificate.entidadEmisora || "",
        fechaEmision,
        fechaVencimiento,
        imagenUrl: certificate.imagenUrl || "",
        estado: certificate.estado || "activo",
        asignacionAutomatica: certificate.asignacionAutomatica || false,
        membershipPlanIds: Array.isArray(certificate.membershipPlanIds) ? certificate.membershipPlanIds : [],
      });
    }
  }, [certificate, open, form]);

  const updateCertificateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!certificate) throw new Error("No certificate selected");
      
      const certificateData = {
        ...data,
        fechaEmision: data.fechaEmision ? new Date(data.fechaEmision).toISOString() : null,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento).toISOString() : null,
        membershipPlanIds: data.membershipPlanIds || [],
      };
      return apiRequest("PUT", `/api/certificates/${certificate.id}`, certificateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Certificado actualizado",
        description: "El certificado ha sido actualizado exitosamente",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar certificado",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateCertificateMutation.mutate(data);
  };

  if (!certificate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Editar Certificado
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombreCertificado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Certificado *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Certificación ISO 9001"
                    />
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
                      {...field}
                      value={field.value || ""}
                      placeholder="Descripción del certificado o premio obtenido"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="entidadEmisora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entidad Emisora</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="Organización que emitió el certificado"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fechaEmision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Emisión</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaVencimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Vencimiento</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        type="date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imagenUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la Imagen del Certificado</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      type="url"
                      placeholder="https://ejemplo.com/certificado.jpg"
                    />
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
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DEBUG: Test section always visible */}
            <div className="space-y-4 border-t pt-4 bg-red-100 p-4 rounded-lg border-red-500 border-2">
              <h3 className="text-lg font-semibold text-red-900">⚠️ SECCIÓN DE PRUEBA - SIEMPRE VISIBLE</h3>
              <p className="text-sm text-red-600">Esta sección roja debe ser siempre visible para depuración</p>
            </div>

            {/* Campos de asignación automática - Solo para administradores */}
            {isAdmin ? (
              <div className="space-y-4 border-t pt-4 bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900">🔧 Asignación Automática (isAdmin: {String(isAdmin)})</h3>
                <p className="text-sm text-gray-600">Esta sección es visible solo para administradores</p>
                
                <FormField
                  control={form.control}
                  name="asignacionAutomatica"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Asignar automáticamente a planes de membresía
                        </FormLabel>
                        <div className="text-sm text-gray-500">
                          Si está habilitado, este certificado se asignará automáticamente a las empresas de los planes seleccionados
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("asignacionAutomatica") && (
                  <FormField
                    control={form.control}
                    name="membershipPlanIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planes de Membresía</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {membershipTypes.map((membershipType: any) => (
                            <div key={membershipType.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-plan-${membershipType.id}`}
                                checked={Array.isArray(field.value) && field.value.includes(membershipType.id)}
                                onCheckedChange={(checked) => {
                                  const currentValues = Array.isArray(field.value) ? field.value : [];
                                  if (checked) {
                                    field.onChange([...currentValues, membershipType.id]);
                                  } else {
                                    field.onChange(currentValues.filter((id: number) => id !== membershipType.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`edit-plan-${membershipType.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {membershipType.nombrePlan}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4 border-t pt-4 bg-gray-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900">❌ NO ADMIN</h3>
                <p className="text-sm text-gray-600">isAdmin es: {String(isAdmin)}</p>
              </div>
            )}

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
                disabled={updateCertificateMutation.isPending}
                className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
              >
                {updateCertificateMutation.isPending ? "Actualizando..." : "Actualizar Certificado"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}