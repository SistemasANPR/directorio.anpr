import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Shield, UserCheck, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Role {
  id: number;
  nombre: string;
  descripcion: string;
  permisos: string[];
  esRolSistema: boolean;
  estado: string;
}

const DEFAULT_ROLES = [
  {
    id: 1,
    nombre: "Administrador",
    descripcion: "Acceso completo al sistema con todos los permisos administrativos",
    permisos: [
      "gestionar_empresas",
      "gestionar_usuarios", 
      "gestionar_roles",
      "gestionar_categorias",
      "gestionar_membresias",
      "gestionar_certificados",
      "gestionar_opinions",
      "ver_estadisticas",
      "configurar_sistema",
      "gestionar_pagos"
    ],
    esRolSistema: true,
    estado: "activo"
  },
  {
    id: 2,
    nombre: "Representante", 
    descripcion: "Representante de empresa con permisos para gestionar información empresarial",
    permisos: [
      "gestionar_empresa_propia",
      "gestionar_proyectos_propios", 
      "ver_opiniones_empresa",
      "editar_perfil_empresa"
    ],
    esRolSistema: true,
    estado: "activo"
  },
  {
    id: 3,
    nombre: "Usuario",
    descripcion: "Usuario básico con acceso de solo lectura",
    permisos: [
      "ver_empresas",
      "ver_directorio"
    ],
    esRolSistema: true,
    estado: "activo"
  }
];

const PERMISSION_LABELS: Record<string, string> = {
  gestionar_empresas: "Gestionar empresas",
  gestionar_usuarios: "Gestionar usuarios",
  gestionar_roles: "Gestionar roles",
  gestionar_categorias: "Gestionar categorías", 
  gestionar_membresias: "Gestionar membresías",
  gestionar_certificados: "Gestionar certificados",
  gestionar_opinions: "Gestionar opiniones",
  ver_estadisticas: "Ver estadísticas",
  configurar_sistema: "Configurar sistema",
  gestionar_pagos: "Gestionar pagos",
  gestionar_empresa_propia: "Gestionar empresa propia",
  gestionar_proyectos_propios: "Gestionar proyectos propios", 
  ver_opiniones_empresa: "Ver opiniones empresa",
  editar_perfil_empresa: "Editar perfil empresa",
  ver_empresas: "Ver empresas",
  ver_directorio: "Ver directorio"
};

const getRoleIcon = (nombre: string) => {
  switch (nombre.toLowerCase()) {
    case 'administrador':
      return <Shield className="h-5 w-5 text-blue-600" />;
    case 'representante':
      return <UserCheck className="h-5 w-5 text-green-600" />;
    case 'usuario':
      return <User className="h-5 w-5 text-gray-600" />;
    default:
      return <User className="h-5 w-5 text-gray-600" />;
  }
};

const getPermissionColor = (permission: string) => {
  if (permission.includes('gestionar') || permission.includes('configurar')) {
    return "bg-blue-100 text-blue-800 hover:bg-blue-200";
  }
  if (permission.includes('ver')) {
    return "bg-green-100 text-green-800 hover:bg-green-200";
  }
  return "bg-gray-100 text-gray-800 hover:bg-gray-200";
};

// Función para limpiar HTML y mostrar solo texto
const stripHtmlTags = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

export default function RolePermissions() {
  const { data: roles = DEFAULT_ROLES, isLoading, error } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-6 bg-gray-200 rounded w-20"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    // En caso de error, usar roles por defecto
    console.warn("Error cargando roles desde API, usando roles por defecto:", error);
  }

  const activeRoles = roles.filter(role => role.estado === 'activo');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="title-role-permissions">
            Roles y Permisos del Sistema
          </h2>
          <p className="text-gray-600 mt-1">
            Gestiona los roles y permisos de usuarios en el sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeRoles.map((role) => (
          <Card 
            key={role.id} 
            className="relative border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200"
            data-testid={`card-role-${role.nombre.toLowerCase()}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getRoleIcon(role.nombre)}
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {role.nombre}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-blue-100 text-blue-800"
                        data-testid={`badge-system-${role.nombre.toLowerCase()}`}
                      >
                        Sistema
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-green-100 text-green-800 border-green-300"
                        data-testid={`badge-status-${role.nombre.toLowerCase()}`}
                      >
                        activo
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <CardDescription className="text-sm text-gray-600 mt-2">
                {stripHtmlTags(role.descripcion)}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Permisos ({role.permisos?.length || 0})
                    </span>
                    {role.permisos?.length > 4 && (
                      <span className="text-xs text-blue-600 font-medium">
                        +{role.permisos.length - 3} más
                      </span>
                    )}
                  </div>

                  <ScrollArea className="h-24">
                    <div className="flex flex-wrap gap-1.5">
                      {role.permisos?.slice(0, role.permisos.length).map((permission, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className={`text-xs px-2 py-1 ${getPermissionColor(permission)}`}
                          data-testid={`permission-${permission}-${role.nombre.toLowerCase()}`}
                        >
                          {PERMISSION_LABELS[permission] || permission}
                        </Badge>
                      )) || []}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Solo lectura</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay roles configurados
          </h3>
          <p className="text-gray-600">
            Los roles del sistema se configurarán automáticamente.
          </p>
        </div>
      )}
    </div>
  );
}