import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Map, Info } from "lucide-react";
import CompanyRegistrationForm from "@/components/CompanyRegistrationForm";
import CompaniesMap from "@/components/CompaniesMap";

export default function CompanyRegistration() {
  const [refreshMap, setRefreshMap] = useState(0);

  const handleRegistrationSuccess = () => {
    // Forzar refresco del mapa cuando se registra una nueva empresa
    setRefreshMap(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Directorio de Empresas
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Registra tu empresa en nuestro directorio y aparecer en el mapa para que más personas puedan encontrarte.
          </p>
        </div>

        {/* Tabs para alternar entre formulario y mapa */}
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="register" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Registrar Empresa
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Ver Mapa
            </TabsTrigger>
          </TabsList>

          {/* Tab de Registro */}
          <TabsContent value="register" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulario */}
              <div className="lg:col-span-2">
                <CompanyRegistrationForm onSuccess={handleRegistrationSuccess} />
              </div>
              
              {/* Información lateral */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Info className="h-5 w-5" />
                      Información
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Campos Obligatorios
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Nombre de la empresa</li>
                        <li>• Nombre del representante</li>
                        <li>• País</li>
                        <li>• Ciudad</li>
                        <li>• Email de contacto</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        ¿Qué pasa después?
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Tu empresa aparecerá en el mapa</li>
                        <li>• Los usuarios podrán encontrarte por ubicación</li>
                        <li>• Tu información de contacto será visible</li>
                      </ul>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Nota:</strong> La ubicación en el mapa se determina automáticamente 
                        basándose en la ciudad y país que proporciones.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab del Mapa */}
          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Mapa de Empresas Registradas
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Explora todas las empresas registradas en nuestro directorio. 
                  Haz clic en los marcadores para ver la información de contacto.
                </p>
              </CardHeader>
              <CardContent>
                <CompaniesMap key={refreshMap} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}