import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, Shield, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WordPressMembershipTest() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [testUserId, setTestUserId] = useState<string>("");
  const [searchUsername, setSearchUsername] = useState<string>("villalpandoluz");
  const { toast } = useToast();

  // Obtener lista de usuarios de WordPress
  const { data: wpUsers, isLoading: wpUsersLoading } = useQuery({
    queryKey: ["/api/wordpress-users"],
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Obtener información de membresía del usuario seleccionado
  const { 
    data: membershipData, 
    isLoading: membershipLoading, 
    error: membershipError,
    refetch: refetchMembership 
  } = useQuery({
    queryKey: [`/api/wordpress-user-membership/${testUserId}`],
    enabled: !!testUserId,
    staleTime: 30 * 1000, // Cache por 30 segundos
  });

  // Obtener información de membresía por username
  const { 
    data: usernameMembershipData, 
    isLoading: usernameMembershipLoading, 
    error: usernameMembershipError,
    refetch: refetchUsernameMembership 
  } = useQuery({
    queryKey: [`/api/find-user-membership/${searchUsername}`],
    enabled: !!searchUsername && searchUsername.trim().length > 0,
    staleTime: 30 * 1000, // Cache por 30 segundos
  });

  const handleTestUser = () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un usuario para probar",
        variant: "destructive",
      });
      return;
    }
    setTestUserId(selectedUserId);
  };

  const renderPluginResponse = (pluginData: any, pluginKey: string) => {
    if (!pluginData) return null;
    
    const { plugin, status, data, error } = pluginData;
    const hasData = data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);
    
    return (
      <div key={pluginKey} className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">{plugin}</h4>
          <Badge variant={status === 200 ? "default" : "destructive"}>
            {status || "Error"}
          </Badge>
        </div>
        
        {error ? (
          <div className="flex items-center text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </div>
        ) : hasData ? (
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            Datos encontrados: {Array.isArray(data) ? `${data.length} registros` : "Objeto con datos"}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Plugin responde pero sin datos de membresía
          </div>
        )}
        
        {hasData && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-blue-600">Ver datos</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prueba de Membresías WordPress</h1>
        <p className="text-gray-600 mt-2">
          Herramienta para verificar si podemos obtener información de membresías desde WordPress
        </p>
      </div>

      {/* Búsqueda por Username - NUEVA FUNCIONALIDAD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Buscar Usuario por Username
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="usernameSearch">Username de WordPress</Label>
              <Input
                id="usernameSearch"
                type="text"
                placeholder="ej: villalpandoluz"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => refetchUsernameMembership()} 
                disabled={!searchUsername || usernameMembershipLoading}
              >
                <Search className="w-4 h-4 mr-2" />
                {usernameMembershipLoading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>

          {/* Resultados de búsqueda por username */}
          {usernameMembershipData && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Información de {usernameMembershipData.username}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>ID</Label>
                    <p className="font-mono">{usernameMembershipData.user_id}</p>
                  </div>
                  <div>
                    <Label>Nombre</Label>
                    <p>{usernameMembershipData.name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p>{usernameMembershipData.email}</p>
                  </div>
                  <div>
                    <Label>Estado de Membresía</Label>
                    <Badge variant={usernameMembershipData.has_active_membership ? "default" : "secondary"}>
                      {usernameMembershipData.member_status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label>Membresías Activas</Label>
                    <p className="text-2xl font-bold text-green-600">
                      {usernameMembershipData.active_memberships?.length || 0}
                    </p>
                  </div>
                  <div>
                    <Label>Suscripciones</Label>
                    <p className="text-2xl font-bold text-blue-600">
                      {usernameMembershipData.subscription_ids?.length || 0}
                    </p>
                  </div>
                  <div>
                    <Label>Transacciones</Label>
                    <p className="text-2xl font-bold text-purple-600">
                      {usernameMembershipData.transaction_ids?.length || 0}
                    </p>
                  </div>
                </div>

                {usernameMembershipData.memberpress_meta && Object.keys(usernameMembershipData.memberpress_meta).length > 0 && (
                  <div>
                    <Label>Metadatos de MemberPress encontrados</Label>
                    <div className="mt-2">
                      <ScrollArea className="h-40">
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded">
                          {JSON.stringify(usernameMembershipData.memberpress_meta, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {usernameMembershipError && (
            <div className="flex items-center text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">
              <AlertCircle className="w-4 h-4 mr-2" />
              Error: {usernameMembershipError.message}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Selector de Usuario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Seleccionar Usuario de WordPress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userSelect">Seleccionar de la lista</Label>
              <select
                id="userSelect"
                className="w-full p-2 border rounded-md"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={wpUsersLoading}
              >
                <option value="">-- Seleccionar usuario --</option>
                {wpUsers?.users?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - ID: {user.id}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="userIdInput">O escribir ID directamente</Label>
              <Input
                id="userIdInput"
                type="number"
                placeholder="ID del usuario"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleTestUser} 
            disabled={!selectedUserId || membershipLoading}
            className="w-full"
          >
            <Search className="w-4 h-4 mr-2" />
            {membershipLoading ? "Probando..." : "Probar Membresía"}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {testUserId && (
        <div className="space-y-6">
          {/* Información Básica del Usuario */}
          {membershipData?.user_basic_info && (
            <Card>
              <CardHeader>
                <CardTitle>Información Básica del Usuario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>ID</Label>
                    <p className="font-mono">{membershipData.user_basic_info.id}</p>
                  </div>
                  <div>
                    <Label>Nombre</Label>
                    <p>{membershipData.user_basic_info.name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p>{membershipData.user_basic_info.email}</p>
                  </div>
                  <div>
                    <Label>Username</Label>
                    <p>{membershipData.user_basic_info.username}</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Roles</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {membershipData.user_basic_info.roles?.map((role: string) => (
                        <Badge key={role} variant="outline">{role}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Capabilities</Label>
                    <p className="text-sm text-gray-500">
                      {Object.keys(membershipData.user_basic_info.capabilities || {}).length} permisos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Análisis de Membresía */}
          {membershipData?.membership_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Análisis de Membresía
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Análisis de Roles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className={`p-2 rounded ${membershipData.membership_analysis.roles_analysis.has_member_role ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <span className="text-sm">Rol de Miembro: </span>
                        <Badge variant={membershipData.membership_analysis.roles_analysis.has_member_role ? "default" : "outline"}>
                          {membershipData.membership_analysis.roles_analysis.has_member_role ? "Sí" : "No"}
                        </Badge>
                      </div>
                      <div className={`p-2 rounded ${membershipData.membership_analysis.roles_analysis.has_subscriber_role ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <span className="text-sm">Suscriptor: </span>
                        <Badge variant={membershipData.membership_analysis.roles_analysis.has_subscriber_role ? "default" : "outline"}>
                          {membershipData.membership_analysis.roles_analysis.has_subscriber_role ? "Sí" : "No"}
                        </Badge>
                      </div>
                      <div className="p-2 rounded bg-gray-100">
                        <span className="text-sm">Roles Personalizados: </span>
                        <span className="font-mono text-xs">
                          {membershipData.membership_analysis.roles_analysis.custom_roles?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {Object.keys(membershipData.membership_analysis.potential_membership_meta || {}).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Campos Meta Relacionados con Membresía</h4>
                      <ScrollArea className="h-32 border rounded p-2">
                        <pre className="text-xs">
                          {JSON.stringify(membershipData.membership_analysis.potential_membership_meta, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Respuestas de Plugins */}
          {membershipData?.plugin_responses && (
            <Card>
              <CardHeader>
                <CardTitle>Respuestas de Plugins de Membresía</CardTitle>
                <p className="text-sm text-gray-600">
                  Probando diferentes plugins comunes de membresías en WordPress
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(membershipData.plugin_responses).map(([key, pluginData]) => 
                    renderPluginResponse(pluginData, key)
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recomendaciones */}
          {membershipData?.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4">
                  {membershipData.recommendations.note}
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium">Plugins Comunes de Membresía:</h4>
                  <ul className="text-sm space-y-1">
                    {membershipData.recommendations.common_plugins?.map((plugin: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {plugin}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {membershipError && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600">{membershipError.message}</p>
                <Button 
                  onClick={() => refetchMembership()} 
                  variant="outline" 
                  className="mt-2"
                >
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}