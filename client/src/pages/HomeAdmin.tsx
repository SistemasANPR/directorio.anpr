import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, Eye, Settings, Image, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HomeConfigForm } from "@/components/HomeConfigForm";
import { HomeHighlightsForm } from "@/components/HomeHighlightsForm";
import { HomeBannersForm } from "@/components/HomeBannersForm";
import type { HomeConfiguration, HomeHighlights, HomeBanners } from "@shared/schema";

export default function HomeAdmin() {
  const [selectedConfig, setSelectedConfig] = useState<HomeConfiguration | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<HomeHighlights | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<HomeBanners | null>(null);
  const [activeTab, setActiveTab] = useState("configuration");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: configurations = [] } = useQuery({
    queryKey: ["/api/home-config"],
  });

  const { data: highlights = [] } = useQuery({
    queryKey: ["/api/home-highlights"],
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["/api/home-banners"],
  });

  // Mutations
  const deleteConfigMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/home-config/${id}`),
    onSuccess: () => {
      toast({ title: "Configuración eliminada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/home-config"] });
    },
    onError: () => {
      toast({ title: "Error al eliminar configuración", variant: "destructive" });
    },
  });

  const deleteHighlightMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/home-highlights/${id}`),
    onSuccess: () => {
      toast({ title: "Elemento destacado eliminado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/home-highlights"] });
    },
    onError: () => {
      toast({ title: "Error al eliminar elemento destacado", variant: "destructive" });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/home-banners/${id}`),
    onSuccess: () => {
      toast({ title: "Banner eliminado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/home-banners"] });
    },
    onError: () => {
      toast({ title: "Error al eliminar banner", variant: "destructive" });
    },
  });

  const handleEdit = (item: any, type: string) => {
    if (type === "config") {
      setSelectedConfig(item);
      setActiveTab("configuration");
    } else if (type === "highlight") {
      setSelectedHighlight(item);
      setActiveTab("highlights");
    } else if (type === "banner") {
      setSelectedBanner(item);
      setActiveTab("banners");
    }
    setIsFormOpen(true);
  };

  const handleDelete = (id: number, type: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este elemento?")) {
      if (type === "config") {
        deleteConfigMutation.mutate(id);
      } else if (type === "highlight") {
        deleteHighlightMutation.mutate(id);
      } else if (type === "banner") {
        deleteBannerMutation.mutate(id);
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedConfig(null);
    setSelectedHighlight(null);
    setSelectedBanner(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Administración de Home
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona la configuración visual y contenido de la página principal
          </p>
        </div>
        <Button 
          onClick={() => setIsFormOpen(true)}
          className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Elemento
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="highlights" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Destacados
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Banners
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {configurations.map((config: HomeConfiguration) => (
              <Card key={config.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{config.seccion}</CardTitle>
                      <CardDescription>{config.titulo}</CardDescription>
                    </div>
                    <Badge variant={config.activo ? "default" : "secondary"}>
                      {config.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {config.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {config.descripcion}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Orden: {config.orden}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(config, "config")}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(config.id, "config")}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="highlights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map((highlight: HomeHighlights) => (
              <Card key={highlight.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{highlight.titulo}</CardTitle>
                      <CardDescription>Tipo: {highlight.tipo}</CardDescription>
                    </div>
                    <Badge variant={highlight.activo ? "default" : "secondary"}>
                      {highlight.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {highlight.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {highlight.descripcion}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Orden: {highlight.orden}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(highlight, "highlight")}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(highlight.id, "highlight")}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="banners" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner: HomeBanners) => (
              <Card key={banner.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{banner.nombre}</CardTitle>
                      <CardDescription>{banner.titulo}</CardDescription>
                    </div>
                    <Badge variant={banner.activo ? "default" : "secondary"}>
                      {banner.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {banner.imagenUrl && (
                    <img 
                      src={banner.imagenUrl} 
                      alt={banner.nombre}
                      className="w-full h-24 object-cover rounded mb-3"
                    />
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Posición: {banner.posicion} | Orden: {banner.orden}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(banner, "banner")}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(banner.id, "banner")}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {isFormOpen && activeTab === "configuration" && (
        <HomeConfigForm
          config={selectedConfig}
          onClose={handleFormClose}
        />
      )}

      {isFormOpen && activeTab === "highlights" && (
        <HomeHighlightsForm
          highlight={selectedHighlight}
          onClose={handleFormClose}
        />
      )}

      {isFormOpen && activeTab === "banners" && (
        <HomeBannersForm
          banner={selectedBanner}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}