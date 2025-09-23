import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestAdminRegister() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAdminRegistration = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: "admin.test@anpr.org.mx",
          password: "AdminTest123!",
          displayName: "Administrador Test"
        })
      });

      const data = await response.json();
      
      setResult({
        status: response.status,
        success: response.ok,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setResult({
        status: 'error',
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🧪 Test de Registro de Administrador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p>Este test verifica que el endpoint <code>/api/register-admin</code> funciona correctamente.</p>
            
            <Button 
              onClick={testAdminRegistration}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Probando..." : "🚀 Probar Registro de Admin"}
            </Button>
          </div>

          {result && (
            <Card className={`border-2 ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <CardHeader>
                <CardTitle className={`text-lg ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.success ? '✅ Éxito' : '❌ Error'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Estado HTTP:</strong> {result.status}
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {result.timestamp}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <strong>Respuesta completa:</strong>
                    <pre className="mt-2 p-3 bg-gray-800 text-green-400 rounded-md text-xs overflow-auto max-h-64">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Datos de prueba:</strong></p>
            <p>• Email: admin.test@anpr.org.mx</p>
            <p>• Password: AdminTest123!</p>
            <p>• Display Name: Administrador Test</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}