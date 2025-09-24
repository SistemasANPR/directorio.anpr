import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExportData {
  timestamp: string;
  environment: string;
  counts: {
    companies: number;
    users: number;
    membershipTypes: number;
    categories: number;
    opinions: number;
    membershipPayments: number;
    projects: number;
    certificates: number;
  };
}

interface DatabaseStatus {
  companies: string;
  membershipTypes: number;
  categories: number;
  users: number;
}

export default function DatabaseMigration() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const { toast } = useToast();

  // Query para obtener el estado actual de la base de datos
  const { data: dbStatus, refetch: refetchStatus } = useQuery<DatabaseStatus>({
    queryKey: ['/api/seed/status'],
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/database/export');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setExportData(data);
      
      // Descargar archivo JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-export-${data.environment}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportación completada",
        description: `Base de datos de ${data.environment} exportada correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error en exportación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const importData = JSON.parse(text);

      const response = await fetch('/api/database/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: importData,
          clearFirst: true, // Limpiar base de datos antes de importar
          onlyTables: ['companies', 'opinions', 'membershipPayments', 'projects']
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      await refetchStatus();

      toast({
        title: "Importación completada",
        description: `Datos importados: ${Object.entries(result.results).filter(([k,v]) => typeof v === 'number').map(([k,v]) => `${v} ${k}`).join(', ')}`,
      });
    } catch (error) {
      toast({
        title: "Error en importación",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const currentEnvironment = window.location.hostname.includes('replit.app') ? 'production' : 'development';

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-database-migration">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Migración de Base de Datos</h1>
        <Badge variant={currentEnvironment === 'production' ? 'destructive' : 'secondary'}>
          {currentEnvironment === 'production' ? 'Producción' : 'Desarrollo'}
        </Badge>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Esta herramienta permite sincronizar datos entre las bases de datos de desarrollo y producción.
          Usa con precaución ya que puede sobrescribir datos existentes.
        </AlertDescription>
      </Alert>

      {/* Estado actual de la base de datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Estado Actual de la Base de Datos
          </CardTitle>
          <CardDescription>
            Entorno: {currentEnvironment}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dbStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dbStatus.companies}</div>
                <div className="text-sm text-blue-600">Empresas</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dbStatus.membershipTypes}</div>
                <div className="text-sm text-green-600">Planes</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dbStatus.categories}</div>
                <div className="text-sm text-purple-600">Categorías</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{dbStatus.users}</div>
                <div className="text-sm text-orange-600">Usuarios</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exportar datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Base de Datos
          </CardTitle>
          <CardDescription>
            Descarga todos los datos de la base de datos actual como archivo JSON
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            data-testid="button-export-database"
          >
            {isExporting ? 'Exportando...' : 'Exportar Datos'}
          </Button>
          
          {exportData && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Última exportación:</h4>
              <div className="text-sm space-y-1">
                <div>Entorno: <Badge>{exportData.environment}</Badge></div>
                <div>Fecha: {new Date(exportData.timestamp).toLocaleString()}</div>
                <div>Empresas: {exportData.counts.companies}</div>
                <div>Usuarios: {exportData.counts.users}</div>
                <div>Opiniones: {exportData.counts.opinions}</div>
                <div>Proyectos: {exportData.counts.projects}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Importar datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Base de Datos
          </CardTitle>
          <CardDescription>
            Sube un archivo JSON exportado desde otro entorno. ⚠️ Esto reemplazará las empresas, opiniones y proyectos existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              data-testid="input-import-file"
            />
            {isImporting && (
              <div className="text-sm text-blue-600">Importando datos... Por favor espera.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Para sincronizar de Producción a Desarrollo:</h4>
            <ol className="list-decimal list-inside text-sm space-y-1 ml-4">
              <li>Ve a la versión de producción de esta página</li>
              <li>Haz clic en "Exportar Datos" para descargar el archivo JSON</li>
              <li>Regresa a la versión de desarrollo</li>
              <li>Usa "Importar Base de Datos" para subir el archivo</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold">Para sincronizar de Desarrollo a Producción:</h4>
            <ol className="list-decimal list-inside text-sm space-y-1 ml-4">
              <li>En desarrollo, haz clic en "Exportar Datos"</li>
              <li>Ve a la versión de producción</li>
              <li>Usa "Importar Base de Datos" para subir el archivo</li>
            </ol>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Nota:</strong> La importación solo afecta empresas, opiniones, proyectos y pagos de membresía. 
              No modifica usuarios, categorías, planes de membresía o certificados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}