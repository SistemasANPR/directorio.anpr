import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SeedResults {
  membershipTypes: number;
  categories: number;
  users: number;
  companies: number;
  tags: number;
  certificates: number;
  errors: string[];
}

export default function ForceSeeding() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResults, setSeedResults] = useState<SeedResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const forceSeeding = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);

    try {
      const response = await fetch('/api/seed/force', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Seed-Token': 'anpr_seed_2025'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al poblar la base de datos');
      }

      setSeedResults(data.results);
      toast({
        title: "✅ Base de datos poblada",
        description: "Todas las empresas y datos han sido cargados exitosamente",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/seed/status');
      const data = await response.json();
      
      toast({
        title: "📊 Estado de la base de datos",
        description: `${data.companies} empresas, ${data.categories} categorías, ${data.membershipTypes} planes`,
      });
    } catch (err) {
      toast({
        title: "❌ Error",
        description: "No se pudo verificar el estado de la base de datos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Database className="h-6 w-6" />
            Implementación de Base de Datos
          </CardTitle>
          <CardDescription>
            Herramientas para poblar la base de datos con empresas y categorías
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Botones principales */}
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={forceSeeding} 
              disabled={isSeeding}
              size="lg"
              className="min-w-[200px]"
              data-testid="button-force-seed"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Poblando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Poblar Base de Datos
                </>
              )}
            </Button>

            <Button 
              onClick={checkStatus} 
              variant="outline"
              size="lg"
              data-testid="button-check-status"
            >
              <Database className="h-4 w-4 mr-2" />
              Verificar Estado
            </Button>
          </div>

          {/* Instrucciones */}
          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">📋 Instrucciones:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Haz clic en "Poblar Base de Datos" para cargar todas las empresas</li>
                <li>Espera a que el proceso termine (puede tardar 1-2 minutos)</li>
                <li>Verifica que todo funcionó con "Verificar Estado"</li>
                <li>Si hay errores, intenta de nuevo</li>
              </ol>
            </CardContent>
          </Card>

          {/* Resultados del seeding */}
          {seedResults && (
            <Card className="bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  Poblado Exitoso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {seedResults.companies}
                    </Badge>
                    <p className="text-sm mt-1">Empresas</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {seedResults.categories}
                    </Badge>
                    <p className="text-sm mt-1">Categorías</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {seedResults.membershipTypes}
                    </Badge>
                    <p className="text-sm mt-1">Planes</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {seedResults.users}
                    </Badge>
                    <p className="text-sm mt-1">Usuarios</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {seedResults.tags}
                    </Badge>
                    <p className="text-sm mt-1">Etiquetas</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {seedResults.certificates}
                    </Badge>
                    <p className="text-sm mt-1">Certificados</p>
                  </div>
                </div>

                {seedResults.errors && seedResults.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2">
                      Errores encontrados:
                    </h4>
                    <ul className="text-sm space-y-1">
                      {seedResults.errors.map((error, index) => (
                        <li key={index} className="text-orange-600 dark:text-orange-400">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card className="bg-red-50 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertCircle className="h-5 w-5" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Información adicional */}
          <Card className="bg-gray-50 dark:bg-gray-950">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">ℹ️ Información importante:</h3>
              <ul className="text-sm space-y-1">
                <li>• Este proceso carga <strong>20 empresas reales</strong> como Productos Jumbo, ANPR, Grupo Bugy</li>
                <li>• Incluye <strong>25 categorías</strong> de equipamiento urbano</li>
                <li>• Configura <strong>3 planes de membresía</strong> con precios de Stripe</li>
                <li>• Es seguro ejecutar múltiples veces</li>
                <li>• Los datos duplicados son ignorados automáticamente</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}