import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
  Building, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Crown,
  Edit,
  TrendingUp,
  DollarSign,
  Star,
  Award,
  Settings,
  History,
  AlertTriangle,
  FileText,
  BarChart3,
  MessageSquare,
  Package,
  Target,
  Briefcase,
  Zap,
  ArrowUpRight,
  Download,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import CompanyManagement from "@/components/CompanyManagement";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Swal from 'sweetalert2';

interface DashboardData {
  companies: Array<{
    id: number;
    nombreEmpresa: string;
    membershipTypeId: number;
    fechaInicioMembresia: string;
    fechaFinMembresia: string;
    estado: string;
    membershipPeriodicidad: string;
  }>;
  payments: Array<{
    id: number;
    amount: string;
    currency: string;
    status: string;
    createdAt: string;
    membershipTypeId: number;
  }>;
  currentMembership: {
    id: number;
    nombrePlan: string;
    descripcionPlan: string;
    opcionesPrecios: Array<{
      periodicidad: string;
      costo: number;
    }>;
    beneficios: string;
  } | null;
  stats: {
    totalCompanies: number;
    activePayments: number;
    nextRenewal: string | null;
  };
}

export default function RepresentativeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/representative/dashboard", user?.id],
    enabled: !!user?.id,
  });

  // Fetch membership types for plan changes
  const { data: availablePlans = [] } = useQuery({
    queryKey: ["/api/membership-types"],
    queryFn: async () => {
      const response = await fetch("/api/membership-types", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch plans");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#bcce16]"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No hay datos disponibles</h2>
          <p className="text-gray-600">No se encontró información de tu cuenta.</p>
        </div>
      </div>
    );
  }

  const { companies, payments, currentMembership, stats } = dashboardData;
  const primaryCompany = companies[0];

  // Cancel membership mutation
  const cancelMembershipMutation = useMutation({
    mutationFn: async () => {
      if (!primaryCompany) throw new Error("No company found");
      const response = await apiRequest("POST", `/api/companies/${primaryCompany.id}/cancel-membership`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Membresía cancelada",
        description: "Tu membresía se ha cancelado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/representative/dashboard"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al cancelar la membresía",
        variant: "destructive",
      });
    },
  });

  const handleCancelMembership = () => {
    Swal.fire({
      title: '¿Cancelar membresía?',
      text: 'Esta acción cancelará tu membresía actual. ¿Estás seguro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        cancelMembershipMutation.mutate();
      }
    });
  };

  const handleChangePlan = () => {
    window.location.href = '/register-and-pay?change=true';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Exitoso</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Fallido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDaysUntilRenewal = () => {
    if (!primaryCompany?.fechaFinMembresia) return null;
    const renewalDate = new Date(primaryCompany.fechaFinMembresia);
    const today = new Date();
    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilRenewal = getDaysUntilRenewal();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>
          Panel de Representante
        </h1>
        <p className="text-gray-600">
          Bienvenido, {user?.displayName || user?.email}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-[#bcce16]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Empresas</p>
                <div className="text-2xl font-bold">{stats.totalCompanies}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-[#bcce16]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pagos Exitosos</p>
                <div className="text-2xl font-bold">{stats.activePayments}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-[#bcce16]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Plan Actual</p>
                <div className="text-2xl font-bold">{currentMembership?.nombrePlan || 'N/A'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-[#bcce16]" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Renovación</p>
                <div className="text-2xl font-bold">
                  {daysUntilRenewal !== null ? `${daysUntilRenewal}d` : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renewal Warning */}
      {daysUntilRenewal !== null && daysUntilRenewal <= 30 && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Renovación próxima</AlertTitle>
          <AlertDescription>
            Tu membresía vence en {daysUntilRenewal} días. Renueva antes del {format(new Date(primaryCompany?.fechaFinMembresia || ''), 'dd/MM/yyyy', { locale: es })} para evitar interrupciones.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="company">Mi Empresa</TabsTrigger>
          <TabsTrigger value="projects">Proyectos</TabsTrigger>
          <TabsTrigger value="certificates">Certificados</TabsTrigger>
          <TabsTrigger value="membership">Mi Plan</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Mi Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {primaryCompany ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{primaryCompany.nombreEmpresa}</h3>
                      <Badge variant="outline" className="mt-1">
                        {primaryCompany.estado === 'activo' ? '✓ Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>Contacto principal configurado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>Teléfono registrado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>Dirección configurada</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setActiveTab("company")}
                      className="w-full bg-[#bcce16] hover:bg-[#a8b814] text-black"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Completar información
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No hay empresa registrada</p>
                    <Button 
                      onClick={() => setActiveTab("company")}
                      className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
                    >
                      Registrar empresa
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Estado del Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentMembership ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-[#bcce16]">
                        {currentMembership.nombrePlan}
                      </h3>
                      <p className="text-sm text-gray-600">{currentMembership.descripcionPlan}</p>
                    </div>
                    
                    {primaryCompany && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Periodicidad:</span>
                          <span className="font-medium">{primaryCompany.membershipPeriodicidad}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Inicio:</span>
                          <span className="font-medium">
                            {format(new Date(primaryCompany.fechaInicioMembresia), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vencimiento:</span>
                          <span className="font-medium">
                            {format(new Date(primaryCompany.fechaFinMembresia), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setActiveTab("membership")}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Gestionar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleChangePlan}
                      >
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        Cambiar plan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Crown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Sin plan activo</p>
                    <Button onClick={handleChangePlan} className="bg-[#bcce16] hover:bg-[#a8b814] text-black">
                      Seleccionar plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab("projects")}
                >
                  <Briefcase className="h-6 w-6" />
                  <span className="text-sm">Mis Proyectos</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab("certificates")}
                >
                  <Award className="h-6 w-6" />
                  <span className="text-sm">Certificados</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab("payments")}
                >
                  <History className="h-6 w-6" />
                  <span className="text-sm">Historial</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => window.open('/directorio', '_blank')}
                >
                  <ExternalLink className="h-6 w-6" />
                  <span className="text-sm">Ver Directorio</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Pago de membresía</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${parseFloat(payment.amount).toLocaleString()}</p>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4"
                    onClick={() => setActiveTab("payments")}
                  >
                    Ver historial completo
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Management Tab */}
        <TabsContent value="company">
          {primaryCompany ? (
            <CompanyManagement companyId={primaryCompany.id} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hay empresa registrada</h3>
                  <p className="text-gray-600 mb-6">Registra tu empresa para completar tu perfil</p>
                  <Button 
                    onClick={handleChangePlan}
                    className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
                  >
                    Registrar empresa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Gestión de Proyectos
              </CardTitle>
              <p className="text-gray-600">Administra el portafolio de proyectos de tu empresa</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-semibold">Mis Proyectos</h3>
                    <p className="text-sm text-gray-600">Gestiona y muestra tus proyectos destacados</p>
                  </div>
                  <Button className="bg-[#bcce16] hover:bg-[#a8b814] text-black">
                    <Package className="h-4 w-4 mr-2" />
                    Agregar Proyecto
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Próximamente: Gestión de Proyectos</h3>
                  <p className="text-gray-600 mb-4">
                    Podrás agregar, editar y gestionar el portafolio de proyectos de tu empresa
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Target className="h-6 w-6 text-gray-400 mb-2" />
                      <h4 className="font-medium">Portafolio Visual</h4>
                      <p className="text-sm text-gray-600">Galería de imágenes de tus proyectos</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <FileText className="h-6 w-6 text-gray-400 mb-2" />
                      <h4 className="font-medium">Descripciones Detalladas</h4>
                      <p className="text-sm text-gray-600">Información completa de cada proyecto</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificados y Premios
              </CardTitle>
              <p className="text-gray-600">Gestiona los certificados y reconocimientos de tu empresa</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-semibold">Mis Certificados</h3>
                    <p className="text-sm text-gray-600">Muestra tus certificaciones y reconocimientos</p>
                  </div>
                  <Button className="bg-[#bcce16] hover:bg-[#a8b814] text-black">
                    <Award className="h-4 w-4 mr-2" />
                    Agregar Certificado
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión de Certificados</h3>
                  <p className="text-gray-600 mb-4">
                    Agrega y gestiona los certificados que validan la calidad de tu empresa
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Star className="h-6 w-6 text-gray-400 mb-2" />
                      <h4 className="font-medium">Certificaciones ISO</h4>
                      <p className="text-sm text-gray-600">Estándares de calidad</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Award className="h-6 w-6 text-gray-400 mb-2" />
                      <h4 className="font-medium">Premios y Reconocimientos</h4>
                      <p className="text-sm text-gray-600">Logros destacados</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Settings className="h-6 w-6 text-gray-400 mb-2" />
                      <h4 className="font-medium">Certificados Técnicos</h4>
                      <p className="text-sm text-gray-600">Especializaciones</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Membership Tab */}
        <TabsContent value="membership">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Plan de Membresía
              </CardTitle>
              <p className="text-gray-600">Gestiona tu plan actual y opciones de cambio</p>
            </CardHeader>
            <CardContent>
              {currentMembership && primaryCompany ? (
                <div className="space-y-6">
                  {/* Current Plan Info */}
                  <div className="bg-gradient-to-r from-[#bcce16]/10 to-[#bcce16]/5 p-6 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#bcce16]">{currentMembership.nombrePlan}</h3>
                        <p className="text-gray-600">{currentMembership.descripcionPlan}</p>
                      </div>
                      <Badge className="bg-[#bcce16] text-black text-sm px-3 py-1">
                        Plan Activo
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-white rounded-lg">
                        <Calendar className="h-6 w-6 text-[#bcce16] mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Periodicidad</p>
                        <p className="font-semibold">{primaryCompany.membershipPeriodicidad}</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <Clock className="h-6 w-6 text-[#bcce16] mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Inicio</p>
                        <p className="font-semibold">
                          {format(new Date(primaryCompany.fechaInicioMembresia), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-[#bcce16] mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Vencimiento</p>
                        <p className="font-semibold">
                          {format(new Date(primaryCompany.fechaFinMembresia), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>

                    {/* Plan Benefits */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3">Beneficios incluidos:</h4>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-line">{currentMembership.beneficios}</p>
                      </div>
                    </div>
                    
                    {/* Plan Actions */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleChangePlan}
                        className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
                      >
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Cambiar Plan
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleCancelMembership}
                        disabled={cancelMembershipMutation.isPending}
                      >
                        {cancelMembershipMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Cancelando...
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar Membresía
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Available Plans Preview */}
                  <div>
                    <h4 className="font-semibold mb-4">Planes Disponibles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availablePlans.map((plan: any) => (
                        <div key={plan.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h5 className="font-semibold text-lg mb-2">{plan.nombrePlan}</h5>
                          <p className="text-sm text-gray-600 mb-3">{plan.descripcionPlan}</p>
                          {plan.opcionesPrecios && plan.opcionesPrecios.length > 0 && (
                            <div className="space-y-1">
                              {plan.opcionesPrecios.map((precio: any, index: number) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>{precio.periodicidad}</span>
                                  <span className="font-medium">${precio.costo}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {plan.id !== currentMembership.id && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full mt-3"
                              onClick={handleChangePlan}
                            >
                              Seleccionar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Crown className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Sin Plan Activo</h3>
                  <p className="text-gray-600 mb-6">Selecciona un plan para acceder a todos los beneficios</p>
                  <Button 
                    onClick={handleChangePlan}
                    className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
                  >
                    Explorar Planes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Historial de Pagos
              </CardTitle>
              <p className="text-gray-600">Revisa todos tus pagos y transacciones</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Download/Export Actions */}
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-semibold">Historial Completo</h3>
                    <p className="text-sm text-gray-600">Todos tus pagos y transacciones realizadas</p>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>

                {/* Payments Table */}
                {payments && payments.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">Pago de membresía</p>
                                <p className="text-sm text-gray-500">ID: {payment.id}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">
                                ${parseFloat(payment.amount).toLocaleString()} {payment.currency.toUpperCase()}
                              </span>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(payment.status)}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sin historial de pagos</h3>
                    <p className="text-gray-600 mb-4">
                      No se encontraron pagos realizados
                    </p>
                    <Button 
                      onClick={handleChangePlan}
                      className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
                    >
                      Realizar primer pago
                    </Button>
                  </div>
                )}

                {/* Payment Summary */}
                {payments && payments.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Resumen de Pagos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#bcce16]">{payments.length}</p>
                        <p className="text-sm text-gray-600">Total de Pagos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {payments.filter(p => p.status === 'succeeded').length}
                        </p>
                        <p className="text-sm text-gray-600">Pagos Exitosos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-600">
                          ${payments
                            .filter(p => p.status === 'succeeded')
                            .reduce((total, p) => total + parseFloat(p.amount), 0)
                            .toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Total Pagado</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}