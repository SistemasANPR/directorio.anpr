import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Package, Briefcase, Crown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MembershipLimitsDisplayProps {
  companyId: number;
}

interface LimitsData {
  planName: string;
  projects: {
    limit: number;
    current: number;
    available: number;
  };
  products: {
    limit: number;
    current: number;
    available: number;
  };
}

export default function MembershipLimitsDisplay({ companyId }: MembershipLimitsDisplayProps) {
  const { data: limits, isLoading, error } = useQuery<LimitsData>({
    queryKey: [`/api/companies/${companyId}/limits`],
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Límites del Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !limits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Límites del Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No se pudieron cargar los límites del plan de membresía.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (current: number, limit: number) => {
    if (limit === 0) return "bg-gray-400"; // Sin límite
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getUsageStatus = (current: number, limit: number, available: number) => {
    if (limit === 0) return { text: "Sin límite", variant: "secondary" as const };
    if (available === 0) return { text: "Límite alcanzado", variant: "destructive" as const };
    if (available <= 2) return { text: "Casi lleno", variant: "destructive" as const };
    return { text: "Disponible", variant: "default" as const };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-[#bcce16]" />
          Límites del Plan: {limits.planName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Proyectos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Proyectos</span>
            </div>
            <Badge variant={getUsageStatus(limits.projects.current, limits.projects.limit, limits.projects.available).variant}>
              {getUsageStatus(limits.projects.current, limits.projects.limit, limits.projects.available).text}
            </Badge>
          </div>
          
          {limits.projects.limit > 0 ? (
            <>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{limits.projects.current} de {limits.projects.limit} usados</span>
                <span>{limits.projects.available} disponibles</span>
              </div>
              <Progress 
                value={(limits.projects.current / limits.projects.limit) * 100} 
                className="h-2"
                style={{
                  background: `linear-gradient(to right, ${getProgressColor(limits.projects.current, limits.projects.limit)} 0%, ${getProgressColor(limits.projects.current, limits.projects.limit)} ${(limits.projects.current / limits.projects.limit) * 100}%, #e5e7eb ${(limits.projects.current / limits.projects.limit) * 100}%, #e5e7eb 100%)`
                }}
              />
              {limits.projects.available === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Has alcanzado el límite de proyectos. Actualiza tu plan para agregar más proyectos.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-600">
              Sin límite de proyectos en este plan
            </div>
          )}
        </div>

        {/* Productos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              <span className="font-medium">Productos</span>
            </div>
            <Badge variant={getUsageStatus(limits.products.current, limits.products.limit, limits.products.available).variant}>
              {getUsageStatus(limits.products.current, limits.products.limit, limits.products.available).text}
            </Badge>
          </div>
          
          {limits.products.limit > 0 ? (
            <>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{limits.products.current} de {limits.products.limit} usados</span>
                <span>{limits.products.available} disponibles</span>
              </div>
              <Progress 
                value={(limits.products.current / limits.products.limit) * 100} 
                className="h-2"
                style={{
                  background: `linear-gradient(to right, ${getProgressColor(limits.products.current, limits.products.limit)} 0%, ${getProgressColor(limits.products.current, limits.products.limit)} ${(limits.products.current / limits.products.limit) * 100}%, #e5e7eb ${(limits.products.current / limits.products.limit) * 100}%, #e5e7eb 100%)`
                }}
              />
              {limits.products.available === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Has alcanzado el límite de productos. Actualiza tu plan para agregar más productos.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-600">
              Sin límite de productos en este plan
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}