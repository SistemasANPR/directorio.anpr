import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  MessageSquare, 
  Check, 
  X, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle,
  Building,
  User,
  Mail,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Opinion } from "@/../../shared/schema";

export default function OpinionsAdmin() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener opiniones sobre empresas únicamente
  const { data: opinions = [], isLoading } = useQuery({
    queryKey: ["/api/opinions", { tipo: "empresa" }],
    queryFn: async () => {
      const response = await fetch("/api/opinions?tipo=empresa");
      if (!response.ok) throw new Error("Failed to fetch opinions");
      const data = await response.json();
      return data.opinions || [];
    },
  });

  // Query para obtener empresas para mostrar nombres
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      if (!response.ok) throw new Error("Failed to fetch companies");
      const data = await response.json();
      return data.companies || [];
    },
  });

  // Mutación para aprobar reseña
  const approveMutation = useMutation({
    mutationFn: async (opinionId: number) => {
      const response = await fetch(`/api/opinions/${opinionId}/approve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to approve opinion");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reseña aprobada",
        description: "La reseña ha sido aprobada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo aprobar la reseña.",
        variant: "destructive",
      });
    },
  });

  // Mutación para rechazar reseña
  const rejectMutation = useMutation({
    mutationFn: async (opinionId: number) => {
      const response = await fetch(`/api/opinions/${opinionId}/reject`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reject opinion");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reseña rechazada",
        description: "La reseña ha sido rechazada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo rechazar la reseña.",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar reseña
  const deleteMutation = useMutation({
    mutationFn: async (opinionId: number) => {
      const response = await fetch(`/api/opinions/${opinionId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete opinion");
    },
    onSuccess: () => {
      toast({
        title: "Reseña eliminada",
        description: "La reseña ha sido eliminada permanentemente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la reseña.",
        variant: "destructive",
      });
    },
  });

  // Filtrar opiniones según el estado seleccionado
  const filteredOpinions = opinions.filter((opinion: Opinion) => {
    if (statusFilter === "all") return true;
    return opinion.estado === statusFilter;
  });

  const getCompanyName = (companyId: number | null) => {
    if (!companyId) return "Empresa no especificada";
    const company = companies.find((c: any) => c.id === companyId);
    return company?.nombreEmpresa || "Empresa no encontrada";
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "aprobada":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprobada</Badge>;
      case "rechazada":
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Opiniones sobre empresas</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Opiniones sobre empresas</h1>
        <div className="flex items-center space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las opiniones</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="aprobada">Aprobadas</SelectItem>
              <SelectItem value="rechazada">Rechazadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Opiniones</p>
                <p className="text-2xl font-bold">{opinions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold">
                  {opinions.filter((o: Opinion) => o.estado === "pendiente").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold">
                  {opinions.filter((o: Opinion) => o.estado === "aprobada").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold">
                  {opinions.filter((o: Opinion) => o.estado === "rechazada").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Reseñas */}
      <div className="space-y-4">
        {filteredOpinions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay reseñas
              </h3>
              <p className="text-gray-600">
                {statusFilter === "all" 
                  ? "No se han recibido reseñas aún." 
                  : `No hay reseñas con estado "${statusFilter}".`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOpinions.map((opinion: Opinion) => (
            <Card key={opinion.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Building className="h-5 w-5 text-gray-500" />
                      <span className="font-semibold text-lg">
                        {getCompanyName(opinion.companyId)}
                      </span>
                      {getStatusBadge(opinion.estado)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {opinion.nombre}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {opinion.email}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(opinion.fechaCreacion), "dd MMM yyyy, HH:mm", { locale: es })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {opinion.estado === "pendiente" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => approveMutation.mutate(opinion.id)}
                          disabled={approveMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => rejectMutation.mutate(opinion.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(opinion.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-3">Calificación:</span>
                    {renderStars(opinion.calificacion)}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Comentario:</span>
                    <p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded-lg">
                      {opinion.comentario}
                    </p>
                  </div>
                  {opinion.fechaAprobacion && (
                    <div className="text-xs text-gray-500">
                      {opinion.estado === "aprobada" ? "Aprobada" : "Rechazada"} el{" "}
                      {format(new Date(opinion.fechaAprobacion), "dd MMM yyyy, HH:mm", { locale: es })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}