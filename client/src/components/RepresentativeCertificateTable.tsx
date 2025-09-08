import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreHorizontal, Award, Shield, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Certificate } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface RepresentativeCertificateTableProps {
  certificates: Certificate[];
  onEdit: (certificate: Certificate) => void;
  onDelete: (certificateId: number) => void;
  userCompanyId?: number;
}

const getVisibilityBadgeColor = (visibility?: string) => {
  switch (visibility?.toLowerCase()) {
    case "publico":
      return "bg-green-100 text-green-800";
    case "privado":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const isAdminAssignedCertificate = (certificate: Certificate) => {
  // Check if certificate was created by admin using the new database field
  return (certificate as any).creadoPorAdmin === true;
};

export default function RepresentativeCertificateTable({ 
  certificates, 
  onEdit, 
  onDelete, 
  userCompanyId 
}: RepresentativeCertificateTableProps) {
  const { user } = useAuth();

  if (certificates.length === 0) {
    return (
      <div className="text-center py-8">
        <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay certificados registrados</p>
        <p className="text-sm text-gray-400 mt-2">Agrega tu primer certificado o premio</p>
      </div>
    );
  }

  return (
    <>
      {/* Vista móvil - Cards */}
      <div className="block lg:hidden space-y-4">
        {certificates.map((certificate) => {
          const isAdminCertificate = isAdminAssignedCertificate(certificate);
          const canEdit = !isAdminCertificate;
          
          return (
            <Card key={certificate.id} className="p-4">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  {certificate.imagenUrl ? (
                    <div className="flex-shrink-0">
                      <img 
                        src={certificate.imagenUrl} 
                        alt={certificate.nombreCertificado}
                        className="h-16 w-16 rounded-lg object-cover border shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                        {isAdminCertificate ? (
                          <Shield className="h-8 w-8 text-blue-600" />
                        ) : (
                          <Award className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                            {certificate.nombreCertificado}
                          </h3>
                          {isAdminCertificate && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 flex-shrink-0">
                              <Shield className="h-3 w-3 mr-1" />
                              ANPR
                            </Badge>
                          )}
                        </div>
                        {certificate.descripcion && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {certificate.descripcion}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className={isAdminCertificate ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                            {isAdminCertificate ? "Oficial ANPR" : "Personal"}
                          </Badge>
                          <Badge className={getVisibilityBadgeColor(certificate.estado)}>
                            {certificate.estado?.charAt(0).toUpperCase() + certificate.estado?.slice(1) || "Activo"}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          {certificate.fechaEmision && (
                            <p>Emitido: {new Date(certificate.fechaEmision).toLocaleDateString()}</p>
                          )}
                          {certificate.entidadEmisora && (
                            <p className="truncate">{certificate.entidadEmisora}</p>
                          )}
                        </div>
                      </div>
                      {canEdit ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(certificate)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDelete(certificate.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="flex items-center text-gray-400 flex-shrink-0">
                          <Lock className="h-4 w-4 mr-1" />
                          <span className="text-xs">Protegido</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Vista desktop - Tabla */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left py-3 px-4 font-semibold text-gray-700">
                Nombre del Certificado
              </TableHead>
              <TableHead className="text-left py-3 px-4 font-semibold text-gray-700">
                Descripción
              </TableHead>
              <TableHead className="text-left py-3 px-4 font-semibold text-gray-700">
                Tipo
              </TableHead>
              <TableHead className="text-left py-3 px-4 font-semibold text-gray-700">
                Estado
              </TableHead>
              <TableHead className="text-left py-3 px-4 font-semibold text-gray-700">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {certificates.map((certificate) => {
            const isAdminCertificate = isAdminAssignedCertificate(certificate);
            const canEdit = !isAdminCertificate;
            
            return (
              <TableRow key={certificate.id} className="hover:bg-gray-50">
                <TableCell className="py-4 px-4">
                  <div className="flex items-center space-x-4">
                    {certificate.imagenUrl ? (
                      <div className="flex-shrink-0">
                        <img 
                          src={certificate.imagenUrl} 
                          alt={certificate.nombreCertificado}
                          className="h-12 w-12 rounded-lg object-cover border shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          {isAdminCertificate ? (
                            <Shield className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Award className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">{certificate.nombreCertificado}</p>
                        {isAdminCertificate && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 flex-shrink-0">
                            <Shield className="h-3 w-3 mr-1" />
                            ANPR
                          </Badge>
                        )}
                      </div>
                      {certificate.fechaEmision && (
                        <p className="text-sm text-gray-500">
                          Emitido: {new Date(certificate.fechaEmision).toLocaleDateString()}
                        </p>
                      )}
                      {certificate.entidadEmisora && (
                        <p className="text-xs text-gray-400 truncate">
                          {certificate.entidadEmisora}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-4">
                  <div className="max-w-xs">
                    <p className="text-gray-600 truncate">
                      {certificate.descripcion || "Sin descripción"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-4">
                  <Badge className={isAdminCertificate ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                    {isAdminCertificate ? "Oficial ANPR" : "Personal"}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 px-4">
                  <Badge className={getVisibilityBadgeColor(certificate.estado)}>
                    {certificate.estado?.charAt(0).toUpperCase() + certificate.estado?.slice(1) || "Activo"}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 px-4">
                  {canEdit ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(certificate)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(certificate.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <Lock className="h-4 w-4 mr-1" />
                      <span className="text-xs">Protegido</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}