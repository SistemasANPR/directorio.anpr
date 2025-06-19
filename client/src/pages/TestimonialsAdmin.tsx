import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, CheckCircle, XCircle, Clock, Eye, MessageSquare, Building, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TestimonialsAdmin() {
  const { toast } = useToast();
  const [selectedTestimonialType, setSelectedTestimonialType] = useState("empresa");
  const [selectedTab, setSelectedTab] = useState("pendiente");

  // Testimonios sobre empresas
  const { data: companyTestimonials, isLoading: loadingCompany } = useQuery({
    queryKey: ["/api/opinions", { tipo: "empresa", estado: selectedTab }],
    queryFn: () => fetch(`/api/opinions?tipo=empresa&estado=${selectedTab}`).then(res => res.json()),
    enabled: selectedTestimonialType === "empresa",
  });

  // Testimonios sobre la plataforma
  const { data: platformTestimonials, isLoading: loadingPlatform } = useQuery({
    queryKey: ["/api/opinions", { tipo: "plataforma", estado: selectedTab }],
    queryFn: () => fetch(`/api/opinions?tipo=plataforma&estado=${selectedTab}`).then(res => res.json()),
    enabled: selectedTestimonialType === "plataforma",
  });

  const currentTestimonials = selectedTestimonialType === "empresa" ? companyTestimonials : platformTestimonials;
  const isLoading = selectedTestimonialType === "empresa" ? loadingCompany : loadingPlatform;

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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>;
      case "aprobada":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprobado</Badge>;
      case "rechazada":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazado</Badge>;
      default:
        return null;
    }
  };

  const getCompanyName = (testimonial: any) => {
    if (testimonial.company) {
      return testimonial.company.nombreEmpresa;
    }
    return "Empresa no especificada";
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
            Administre los testimonios de usuarios y representantes
          </p>
        </div>
      </div>

      {/* Tabs para tipo de testimonio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Tipos de Testimonios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={selectedTestimonialType === "empresa" ? "default" : "outline"}
              onClick={() => setSelectedTestimonialType("empresa")}
              className={`h-auto p-4 flex flex-col items-center gap-2 ${
                selectedTestimonialType === "empresa" 
                  ? "text-white [&>*]:text-white [&_*]:text-white" 
                  : ""
              }`}
            >
              <Building className={`h-6 w-6 ${
                selectedTestimonialType === "empresa" ? "text-white" : ""
              }`} />
              <div className="text-center">
                <div className={`font-medium ${
                  selectedTestimonialType === "empresa" ? "text-white" : ""
                }`}>Testimonios sobre Empresas</div>
                <div className={`text-sm ${
                  selectedTestimonialType === "empresa" 
                    ? "text-white/90" 
                    : "text-muted-foreground"
                }`}>
                  Evaluaciones de usuarios sobre servicios empresariales
                </div>
              </div>
            </Button>
            <Button
              variant={selectedTestimonialType === "plataforma" ? "default" : "outline"}
              onClick={() => setSelectedTestimonialType("plataforma")}
              className={`h-auto p-4 flex flex-col items-center gap-2 ${
                selectedTestimonialType === "plataforma" 
                  ? "text-white [&>*]:text-white [&_*]:text-white" 
                  : ""
              }`}
            >
              <Users className={`h-6 w-6 ${
                selectedTestimonialType === "plataforma" ? "text-white" : ""
              }`} />
              <div className="text-center">
                <div className={`font-medium ${
                  selectedTestimonialType === "plataforma" ? "text-white" : ""
                }`}>Testimonios sobre la Plataforma</div>
                <div className={`text-sm ${
                  selectedTestimonialType === "plataforma" 
                    ? "text-white/90" 
                    : "text-muted-foreground"
                }`}>
                  Feedback de representantes sobre el directorio
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para estado */}
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
          {!currentTestimonials?.opinions || currentTestimonials.opinions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay testimonios {selectedTab === "pendiente" ? "pendientes" : selectedTab === "aprobada" ? "aprobados" : "rechazados"} para {selectedTestimonialType === "empresa" ? "empresas" : "la plataforma"}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {currentTestimonials.opinions.map((testimonial: any) => (
                <Card key={testimonial.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{testimonial.nombre}</CardTitle>
                          {getStatusBadge(testimonial.estado)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Email:</span> {testimonial.email}
                          </p>
                          {testimonial.cargo && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Cargo:</span> {testimonial.cargo}
                            </p>
                          )}
                          {selectedTestimonialType === "empresa" && (
                            <p className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              <span className="font-medium">Empresa:</span> {getCompanyName(testimonial)}
                            </p>
                          )}
                          <p className="flex items-center gap-2">
                            <span className="font-medium">Tipo:</span> 
                            <Badge variant="secondary">
                              {selectedTestimonialType === "empresa" ? "Sobre Empresa" : "Sobre Plataforma"}
                            </Badge>
                          </p>
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
                        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                          {testimonial.comentario}
                        </p>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium">Fecha:</span>{" "}
                          {new Date(testimonial.fechaCreacion).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        {testimonial.fechaAprobacion && (
                          <p>
                            <span className="font-medium">Fecha de aprobación:</span>{" "}
                            {new Date(testimonial.fechaAprobacion).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
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