import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, CheckCircle, XCircle, Clock, Eye, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TestimonialsAdmin() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("pendiente");

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ["/api/opinions", { tipo: "plataforma", estado: selectedTab }],
    queryFn: () => fetch(`/api/opinions?tipo=plataforma&estado=${selectedTab}`).then(res => res.json()),
  });

  const approveTestimonialMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PUT", `/api/opinions/${id}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Testimonio aprobado",
        description: "El testimonio ha sido aprobado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo aprobar el testimonio.",
        variant: "destructive",
      });
    },
  });

  const rejectTestimonialMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PUT", `/api/opinions/${id}/reject`, {});
    },
    onSuccess: () => {
      toast({
        title: "Testimonio rechazado",
        description: "El testimonio ha sido rechazado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opinions"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo rechazar el testimonio.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number) => {
    approveTestimonialMutation.mutate(id);
  };

  const handleReject = (id: number) => {
    rejectTestimonialMutation.mutate(id);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "aprobada":
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
      case "rechazada":
        return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Testimonios</h1>
          <p className="text-muted-foreground">
            Administre los testimonios de la plataforma enviados por los usuarios
          </p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pendiente" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="aprobada" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Aprobados
          </TabsTrigger>
          <TabsTrigger value="rechazada" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Rechazados
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {testimonials?.opinions?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay testimonios {selectedTab === "pendiente" ? "pendientes" : selectedTab === "aprobada" ? "aprobados" : "rechazados"}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {testimonials?.opinions?.map((testimonial: any) => (
                <Card key={testimonial.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{testimonial.nombre}</CardTitle>
                          {getStatusBadge(testimonial.estado)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>{testimonial.cargo}</p>
                          <p>{testimonial.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {renderStars(testimonial.calificacion)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {testimonial.calificacion}/5
                          </span>
                        </div>
                      </div>
                      
                      {selectedTab === "pendiente" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(testimonial.id)}
                            disabled={approveTestimonialMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(testimonial.id)}
                            disabled={rejectTestimonialMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Testimonio:</h4>
                        <p className="text-gray-700 leading-relaxed">{testimonial.comentario}</p>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                        <span>
                          Enviado el {new Date(testimonial.fechaCreacion).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        
                        {testimonial.fechaAprobacion && (
                          <span>
                            {testimonial.estado === "aprobada" ? "Aprobado" : "Revisado"} el{" "}
                            {new Date(testimonial.fechaAprobacion).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}