import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Edit, Trash2, Crown, Eye, EyeOff } from "lucide-react";
import { MembershipType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const membershipSchema = z.object({
  nombrePlan: z.string().min(1, "El nombre del plan es requerido"),
  descripcionPlan: z.string().optional(),
  opcionesPrecios: z.array(z.object({
    periodicidad: z.string().min(1, "La periodicidad es requerida"),
    costo: z.number().min(0, "El costo debe ser mayor a 0")
  })).min(1, "Debe agregar al menos una opción de precio"),
  beneficios: z.string().optional(),
  visibilidad: z.enum(["publica", "privada"]).default("publica"),
  cantidadProductosAdmitidos: z.number().min(0, "La cantidad debe ser mayor o igual a 0").default(0),
  cantidadProyectosAdmitidos: z.number().min(0, "La cantidad debe ser mayor o igual a 0").default(0),
  productosIlimitados: z.boolean().default(false),
  proyectosIlimitados: z.boolean().default(false),
});

type MembershipFormData = z.infer<typeof membershipSchema>;

export default function MembershipsNew() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<MembershipType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<MembershipFormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      nombrePlan: "",
      descripcionPlan: "",
      opcionesPrecios: [{ periodicidad: "", costo: 0 }],
      beneficios: "",
      visibilidad: "publica",
      cantidadProductosAdmitidos: 0,
      cantidadProyectosAdmitidos: 0,
    },
  });

  const editForm = useForm<MembershipFormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      nombrePlan: "",
      descripcionPlan: "",
      opcionesPrecios: [{ periodicidad: "", costo: 0 }],
      beneficios: "",
      visibilidad: "publica",
      cantidadProductosAdmitidos: 0,
      cantidadProyectosAdmitidos: 0,
    },
  });

  // Fetch memberships
  const { data: memberships = [], isLoading } = useQuery<MembershipType[]>({
    queryKey: ["/api/membership-types"],
  });

  // Create membership mutation
  const createMutation = useMutation({
    mutationFn: async (data: MembershipFormData) => {
      const response = await apiRequest("POST", "/api/membership-types", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/membership-types"] });
      toast({ title: "Plan de membresía creado exitosamente" });
      setIsAddModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al crear plan de membresía", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Update membership mutation
  const updateMutation = useMutation({
    mutationFn: async (data: MembershipFormData) => {
      const response = await apiRequest("PUT", `/api/membership-types/${selectedMembership?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/membership-types"] });
      toast({ title: "Plan de membresía actualizado exitosamente" });
      setIsEditModalOpen(false);
      setSelectedMembership(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al actualizar plan de membresía", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Delete membership mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/membership-types/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/membership-types"] });
      toast({ title: "Plan de membresía eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al eliminar plan de membresía", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: MembershipFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: MembershipFormData) => {
    updateMutation.mutate(data);
  };

  const handleEdit = (membership: MembershipType) => {
    setSelectedMembership(membership);
    const opcionesPrecios = Array.isArray(membership.opcionesPrecios) 
      ? membership.opcionesPrecios 
      : [{ periodicidad: "", costo: 0 }];
    
    editForm.reset({
      nombrePlan: membership.nombrePlan,
      descripcionPlan: membership.descripcionPlan || "",
      opcionesPrecios,
      beneficios: Array.isArray(membership.beneficios) ? membership.beneficios.join('\n') : "",
      visibilidad: (membership as any).visibilidad || "publica",
      cantidadProductosAdmitidos: (membership as any).cantidadProductosAdmitidos || 0,
      cantidadProyectosAdmitidos: (membership as any).cantidadProyectosAdmitidos || 0,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este plan?")) {
      deleteMutation.mutate(id);
    }
  };

  const addPriceOption = (formInstance: typeof form | typeof editForm) => {
    const currentOptions = formInstance.getValues("opcionesPrecios");
    formInstance.setValue("opcionesPrecios", [...currentOptions, { periodicidad: "", costo: 0 }]);
  };

  const removePriceOption = (formInstance: typeof form | typeof editForm, index: number) => {
    const currentOptions = formInstance.getValues("opcionesPrecios");
    if (currentOptions.length > 1) {
      formInstance.setValue("opcionesPrecios", currentOptions.filter((_, i) => i !== index));
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-32">Cargando planes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#4a4a49]">Planes de Membresía</h1>
          <p className="text-gray-600">Gestiona los planes de membresía de la plataforma</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0f2161] hover:bg-[#0f2161]/90">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Plan de Membresía</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombrePlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Plan *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Básico, Premium, Enterprise..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descripcionPlan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descripción del plan..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibilidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibilidad *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la visibilidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="publica">
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-2" />
                              Pública - Visible para todos
                            </div>
                          </SelectItem>
                          <SelectItem value="privada">
                            <div className="flex items-center">
                              <EyeOff className="h-4 w-4 mr-2" />
                              Privada - Solo administradores
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Opciones de Precios *</FormLabel>
                  {form.watch("opcionesPrecios").map((_, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <FormField
                        control={form.control}
                        name={`opcionesPrecios.${index}.periodicidad`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona periodicidad" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Mensual">Mensual</SelectItem>
                                <SelectItem value="Anual">Anual</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`opcionesPrecios.${index}.costo`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Precio" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removePriceOption(form, index)}
                        disabled={form.watch("opcionesPrecios").length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPriceOption(form)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar opción
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cantidadProductosAdmitidos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Límite de Productos</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            value={field.value || 0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cantidadProyectosAdmitidos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Límite de Proyectos</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            value={field.value || 0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="beneficios"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beneficios</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Lista los beneficios del plan (uno por línea)..." 
                          {...field} 
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creando..." : "Crear Plan"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Planes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Precios</TableHead>
                <TableHead>Visibilidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((membership) => (
                <TableRow key={membership.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      {membership.nombrePlan}
                    </div>
                  </TableCell>
                  <TableCell>
                    {membership.descripcionPlan || "Sin descripción"}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(membership.opcionesPrecios) ? (
                      <div className="space-y-1">
                        {membership.opcionesPrecios.map((precio: any, index: number) => (
                          <Badge key={index} variant="outline">
                            {precio.periodicidad}: ${precio.costo}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="outline">No configurado</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={(membership as any).visibilidad === "privada" ? "secondary" : "default"}>
                      {(membership as any).visibilidad === "privada" ? (
                        <><EyeOff className="h-3 w-3 mr-1" /> Privada</>
                      ) : (
                        <><Eye className="h-3 w-3 mr-1" /> Pública</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(membership)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(membership.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plan de Membresía</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nombrePlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Plan *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Básico, Premium, Enterprise..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="descripcionPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción del plan..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="visibilidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibilidad *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la visibilidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="publica">
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            Pública - Visible para todos
                          </div>
                        </SelectItem>
                        <SelectItem value="privada">
                          <div className="flex items-center">
                            <EyeOff className="h-4 w-4 mr-2" />
                            Privada - Solo administradores
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Opciones de Precios *</FormLabel>
                {editForm.watch("opcionesPrecios").map((_, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <FormField
                      control={editForm.control}
                      name={`opcionesPrecios.${index}.periodicidad`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona periodicidad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mensual">Mensual</SelectItem>
                              <SelectItem value="Anual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name={`opcionesPrecios.${index}.costo`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Precio" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removePriceOption(editForm, index)}
                      disabled={editForm.watch("opcionesPrecios").length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addPriceOption(editForm)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar opción
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="cantidadProductosAdmitidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Límite de Productos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="cantidadProyectosAdmitidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Límite de Proyectos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          value={field.value || 0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="beneficios"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beneficios</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Lista los beneficios del plan (uno por línea)..." 
                        {...field} 
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Actualizando..." : "Actualizar Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}