import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, ArrowLeft, Map } from "lucide-react";
import { Link } from "wouter";
import CompanyRegistrationForm from "@/components/CompanyRegistrationForm";
import CompaniesMap from "@/components/CompaniesMap";

export default function AdminCompanyRegistration() {
  const [refreshMap, setRefreshMap] = useState(0);
  const [showMap, setShowMap] = useState(false);

  const handleRegistrationSuccess = () => {
    // Forzar refresco del mapa cuando se registra una nueva empresa
    setRefreshMap(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/empresas">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Empresas
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registro Manual de Empresas</h1>
            <p className="text-gray-600">Registra nuevas empresas en el directorio desde el panel de administración</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2"
        >
          <Map className="h-4 w-4" />
          {showMap ? "Ocultar Mapa" : "Ver Mapa"}
        </Button>
      </div>

      {/* Mapa (opcional) */}
      {showMap && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Empresas Registradas en el Mapa
            </CardTitle>
            <p className="text-sm text-gray-600">
              Vista de todas las empresas actualmente registradas en el sistema
            </p>
          </CardHeader>
          <CardContent>
            <CompaniesMap key={refreshMap} />
          </CardContent>
        </Card>
      )}

      {/* Formulario de registro */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <CompanyRegistrationForm onSuccess={handleRegistrationSuccess} />
        </div>
        
        {/* Panel de información para administradores */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información para Administradores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Registro Manual</h4>
                <p className="text-sm text-gray-600">
                  Este formulario permite registrar empresas manualmente en el sistema. 
                  Las empresas aparecerán automáticamente en el directorio público y en el mapa.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Validaciones</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Nombre de empresa único</li>
                  <li>• Email válido</li>
                  <li>• País y ciudad obligatorios</li>
                  <li>• Geocodificación automática</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Después del Registro</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• La empresa aparece en el directorio</li>
                  <li>• Se muestra en el mapa</li>
                  <li>• Estado: Activo por defecto</li>
                  <li>• Puede editarse desde Gestión de Empresas</li>
                </ul>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Nota:</strong> Las empresas registradas manualmente por administradores 
                  tienen los mismos permisos y funcionalidades que las empresas registradas 
                  por el formulario público.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/empresas">
                <Button variant="outline" className="w-full justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  Ver Todas las Empresas
                </Button>
              </Link>
              <Link href="/categorias">
                <Button variant="outline" className="w-full justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  Gestionar Categorías
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}