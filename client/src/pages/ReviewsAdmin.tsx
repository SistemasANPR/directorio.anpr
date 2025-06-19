import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, Check, X, Trash2, Search, Star, MessageSquare, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: number;
  comentario: string;
  calificacion: number;
  estado: string;
  tipo: string;
  companyId: number | null;
  userId: number;
  approvedBy: number | null;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: number;
    nombreEmpresa: string;
  };
  user: {
    id: number;
    displayName: string;
    email: string;
  };
  approver?: {
    id: number;
    displayName: string;
  };
}

interface ReviewsResponse {
  opinions: Review[];
  total: string;
}

export default function ReviewsAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [calificationFilter, setCalificationFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [moderationComment, setModerationComment] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch platform reviews (tipo: "plataforma")
  const { data: reviewsData, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['/api/opinions', { 
      page: currentPage, 
      limit: pageSize,
      search: searchTerm,
      estado: statusFilter !== "all" ? statusFilter : undefined,
      calificacion: calificationFilter !== "all" ? calificationFilter : undefined,
      tipo: "plataforma" // Only platform reviews
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        tipo: "plataforma"
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== "all") params.append('estado', statusFilter);
      if (calificationFilter !== "all") params.append('calificacion', calificationFilter);
      
      const response = await fetch(`/api/opinions?${params}`);
      if (!response.ok) throw new Error('Error fetching reviews');
      return response.json();
    },
  });

  // Moderate review mutation
  const moderateReviewMutation = useMutation({
    mutationFn: async ({ id, estado, comentarioModerador }: { id: number; estado: string; comentarioModerador?: string }) => {
      const response = await fetch(`/api/opinions/${id}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, comentarioModerador })
      });
      if (!response.ok) throw new Error('Error moderating review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opinions'] });
      toast({
        title: "Reseña moderada",
        description: "La reseña ha sido moderada exitosamente.",
      });
      setSelectedReview(null);
      setModerationComment("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo moderar la reseña. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/opinions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error deleting review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/opinions'] });
      toast({
        title: "Reseña eliminada",
        description: "La reseña ha sido eliminada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la reseña. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const reviews = reviewsData?.opinions || [];
  const totalReviews = parseInt(reviewsData?.total || "0");
  const totalPages = Math.ceil(totalReviews / pageSize);

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case "aprobada":
        return <Badge variant="default" className="bg-green-100 text-green-800">Aprobada</Badge>;
      case "rechazada":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rechazada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const handleApprove = (review: Review) => {
    moderateReviewMutation.mutate({
      id: review.id,
      estado: "aprobada",
      comentarioModerador: moderationComment || undefined
    });
  };

  const handleReject = (review: Review) => {
    moderateReviewMutation.mutate({
      id: review.id,
      estado: "rechazada",
      comentarioModerador: moderationComment || undefined
    });
  };

  const handleDelete = (reviewId: number) => {
    deleteReviewMutation.mutate(reviewId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Reseñas de la Plataforma</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MessageSquare className="w-4 h-4" />
          <span>Total: {totalReviews} reseñas</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por comentario o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="aprobada">Aprobadas</SelectItem>
                <SelectItem value="rechazada">Rechazadas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={calificationFilter} onValueChange={setCalificationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Calificación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las calificaciones</SelectItem>
                <SelectItem value="5">5 estrellas</SelectItem>
                <SelectItem value="4">4 estrellas</SelectItem>
                <SelectItem value="3">3 estrellas</SelectItem>
                <SelectItem value="2">2 estrellas</SelectItem>
                <SelectItem value="1">1 estrella</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCalificationFilter("all");
                  setCurrentPage(1);
                }}
                variant="outline"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Cargando reseñas...</div>
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                No se encontraron reseñas con los filtros aplicados.
              </div>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{review.user.displayName}</span>
                        <span className="text-sm text-gray-500">({review.user.email})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {renderStars(review.calificacion)}
                        <span className="text-sm text-gray-600 ml-2">
                          {review.calificacion}/5
                        </span>
                      </div>
                      {getStatusBadge(review.estado)}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-800">{review.comentario}</p>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(review.createdAt), "PPP", { locale: es })}
                        </span>
                      </div>
                      {review.approver && (
                        <span>
                          Moderada por: {review.approver.displayName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReview(review)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalle de la Reseña</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Usuario:</label>
                              <p className="text-sm">{selectedReview?.user.displayName} ({selectedReview?.user.email})</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Calificación:</label>
                              <div className="flex items-center space-x-1">
                                {selectedReview && renderStars(selectedReview.calificacion)}
                                <span className="text-sm ml-2">{selectedReview?.calificacion}/5</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700">Comentario:</label>
                            <p className="text-sm bg-gray-50 p-3 rounded mt-1">{selectedReview?.comentario}</p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700">Estado actual:</label>
                            <div className="mt-1">
                              {selectedReview && getStatusBadge(selectedReview.estado)}
                            </div>
                          </div>

                          {selectedReview?.estado === "pendiente" && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Comentario de moderación (opcional):</label>
                              <Textarea
                                value={moderationComment}
                                onChange={(e) => setModerationComment(e.target.value)}
                                placeholder="Agregar comentario de moderación..."
                                className="mt-1"
                              />
                            </div>
                          )}

                          {selectedReview?.estado === "pendiente" && (
                            <div className="flex space-x-2 pt-4">
                              <Button
                                onClick={() => selectedReview && handleApprove(selectedReview)}
                                disabled={moderateReviewMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Aprobar
                              </Button>
                              <Button
                                onClick={() => selectedReview && handleReject(selectedReview)}
                                disabled={moderateReviewMutation.isPending}
                                variant="destructive"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {review.estado === "pendiente" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReview(review);
                            handleApprove(review);
                          }}
                          disabled={moderateReviewMutation.isPending}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReview(review);
                            handleReject(review);
                          }}
                          disabled={moderateReviewMutation.isPending}
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La reseña será eliminada permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(review.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalReviews)} de {totalReviews} reseñas
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    onClick={() => setCurrentPage(pageNum)}
                    size="sm"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}