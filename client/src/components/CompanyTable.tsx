import { useState } from "react";
import { useLocation } from "wouter";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit, Trash2, MoreHorizontal, Building, UserCheck } from "lucide-react";
import { CompanyWithDetails } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface CompanyTableProps {
  companies: CompanyWithDetails[];
  onEdit: (company: CompanyWithDetails) => void;
  onDelete: (companyId: number) => void;
  onView: (company: CompanyWithDetails) => void;
}

const getMembershipBadgeColor = (membershipType?: string) => {
  switch (membershipType?.toLowerCase()) {
    case "enterprise":
      return "bg-orange-100 text-orange-800";
    case "premium":
      return "bg-yellow-100 text-yellow-800";
    case "básico":
    case "basico":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getCategoryBadgeColor = (category?: string) => {
  switch (category?.toLowerCase()) {
    case "tecnología":
    case "tecnologia":
      return "bg-blue-100 text-blue-800";
    case "manufactura":
      return "bg-green-100 text-green-800";
    case "servicios":
      return "bg-purple-100 text-purple-800";
    case "comercio":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function CompanyTable({ companies, onEdit, onDelete, onView }: CompanyTableProps) {
  const { isAdmin, user } = useAuth();
  const [, setLocation] = useLocation();

  if (companies.length === 0) {
    return (
      <div className="text-center py-8">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No se encontraron empresas</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left py-3 px-4 font-semibold text-gray-700">
              Empresa
            </TableHead>
            <TableHead className="text-left py-3 px-4 font-semibold text-gray-700">
              Categoría
            </TableHead>
            <TableHead className="text-left py-3 px-4 font-semibold text-gray-700">
              Ubicación
            </TableHead>
            <TableHead className="text-left py-3 px-4 font-semibold text-gray-700">
              Membresía
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
          {companies.map((company) => {
            const canEdit = isAdmin || company.userId === user?.id;
            
            return (
              <TableRow key={company.id} className="hover:bg-gray-50">
                <TableCell className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={company.logotipoUrl || ""} alt={company.nombreEmpresa} />
                      <AvatarFallback>
                        <Building className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{company.nombreEmpresa}</p>
                      <p className="text-sm text-gray-500">{company.email1}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-4">
                  {company.category && (
                    <Badge className={getCategoryBadgeColor(company.category.nombreCategoria)}>
                      {company.category.nombreCategoria}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="py-4 px-4 text-gray-600">
                  {Array.isArray(company.ciudadesPresencia) && company.ciudadesPresencia.length > 0
                    ? company.ciudadesPresencia[0]
                    : "No especificada"}
                </TableCell>
                <TableCell className="py-4 px-4">
                  {company.membershipType && (
                    <Badge className={getMembershipBadgeColor(company.membershipType.nombrePlan)}>
                      {company.membershipType.nombrePlan}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="py-4 px-4">
                  <Badge className="bg-green-100 text-green-800">
                    {company.estado === "activo" ? "Activo" : company.estado}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setLocation(`/empresa/${company.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </DropdownMenuItem>
                      {canEdit && (
                        <DropdownMenuItem onClick={() => onEdit(company)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {isAdmin && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(company.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
