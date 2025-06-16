import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Crown,
  RefreshCw,
  Eye,
  Edit,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Award,
  Settings,
  History,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/representative/dashboard", user?.id],
    enabled: !!user?.id,
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

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="company">Mi Empresa</TabsTrigger>
          <TabsTrigger value="certificates">Certificados y Premios</TabsTrigger>
          <TabsTrigger value="membership">Plan de Membresía</TabsTrigger>
          <TabsTrigger value="payments">Historial de Pagos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Estado de la Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {primaryCompany ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{primaryCompany.nombreEmpresa}</h3>
                      <Badge 
                        className={primaryCompany.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {primaryCompany.estado === 'activo' ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Inicio de Membresía</p>
                        <p className="font-medium">
                          {format(new Date(primaryCompany.fechaInicioMembresia), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fin de Membresía</p>
                        <p className="font-medium">
                          {format(new Date(primaryCompany.fechaFinMembresia), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    {daysUntilRenewal !== null && daysUntilRenewal <= 30 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-800 text-sm">
                          <Clock className="inline w-4 h-4 mr-1" />
                          Tu membresía vence en {daysUntilRenewal} días. 
                          <Button variant="link" className="text-yellow-800 p-0 ml-1 h-auto">
                            Renovar ahora
                          </Button>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">No tienes empresas registradas.</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pagos Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">${parseFloat(payment.amount).toLocaleString()}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(payment.createdAt), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                    ))}
                    {payments.length > 3 && (
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("payments")}
                        className="w-full"
                      >
                        Ver todos los pagos
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">No hay pagos registrados.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Información de la Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {primaryCompany ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{primaryCompany.nombreEmpresa}</h2>
                      <Badge className={primaryCompany.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {primaryCompany.estado === 'activo' ? 'Empresa Activa' : 'Empresa Inactiva'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Perfil Público
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Detalles de Membresía</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Plan:</span>
                          <span className="font-medium">{currentMembership?.nombrePlan}</span>
                        </div>
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
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Acciones Rápidas</h3>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Edit className="w-4 h-4 mr-2" />
                          Actualizar Información
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Renovar Membresía
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Crown className="w-4 h-4 mr-2" />
                          Cambiar Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay empresa registrada</h3>
                  <p className="text-gray-600 mb-4">Registra tu primera empresa para comenzar.</p>
                  <Button style={{ backgroundColor: '#bcce16' }}>
                    Registrar Empresa
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
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#bcce16] bg-opacity-10 rounded-full flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-[#bcce16]" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">
                              ${parseFloat(payment.amount).toLocaleString()} {payment.currency.toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(payment.createdAt), 'dd MMMM yyyy, HH:mm', { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(payment.status)}
                          <p className="text-sm text-gray-600 mt-1">
                            ID: {payment.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay pagos registrados</h3>
                  <p className="text-gray-600">Tus pagos aparecerán aquí cuando realices transacciones.</p>
                </div>
              )}
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
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Add New Certificate Button */}
                <div className="flex justify-end">
                  <Button style={{ backgroundColor: '#bcce16' }}>
                    <Award className="w-4 h-4 mr-2" />
                    Agregar Certificado
                  </Button>
                </div>

                {/* Certificates List - Only user's own certificates */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Placeholder for user certificates */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Award className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="font-semibold text-gray-700 mb-2">Sin certificados</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Agrega certificados y premios para mostrar la credibilidad de tu empresa
                    </p>
                    <Button variant="outline" size="sm">
                      Subir Certificado
                    </Button>
                  </div>
                </div>

                {/* Info Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-1">Información importante</h4>
                      <p className="text-blue-700 text-sm">
                        Solo puedes ver y gestionar los certificados que has subido. Los certificados administrados por el sistema no aparecen aquí.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Membership Tab */}
        <TabsContent value="membership">
          <div className="space-y-6">
            {/* Current Plan Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Plan de Membresía Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentMembership ? (
                  <div className="space-y-6">
                    <div className="border-2 border-[#bcce16] rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold flex items-center gap-2">
                            <Crown className="h-6 w-6 text-[#bcce16]" />
                            {currentMembership.nombrePlan}
                          </h3>
                          <p className="text-gray-600">{currentMembership.descripcionPlan}</p>
                        </div>
                        <div className="text-right">
                          {currentMembership.opcionesPrecios?.map((precio, idx) => (
                            <div key={idx} className="mb-1">
                              <span className="text-2xl font-bold text-[#bcce16]">
                                ${precio.costo?.toLocaleString()}
                              </span>
                              <span className="text-sm text-gray-600 ml-1">
                                / {precio.periodicidad?.toLowerCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Membership Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Fecha de Inicio</p>
                          <p className="font-semibold">
                            {primaryCompany?.fechaInicioMembresia ? 
                              format(new Date(primaryCompany.fechaInicioMembresia), 'dd/MM/yyyy', { locale: es }) : 
                              'N/A'
                            }
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                          <p className="font-semibold">
                            {primaryCompany?.fechaFinMembresia ? 
                              format(new Date(primaryCompany.fechaFinMembresia), 'dd/MM/yyyy', { locale: es }) : 
                              'N/A'
                            }
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Periodicidad</p>
                          <p className="font-semibold capitalize">
                            {primaryCompany?.membershipPeriodicidad || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {currentMembership.beneficios && (
                        <div>
                          <h4 className="font-semibold mb-3">Beneficios Incluidos:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {currentMembership.beneficios.split('\n').map((benefit, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Star className="h-4 w-4 text-[#bcce16]" />
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Plan Management Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button style={{ backgroundColor: '#bcce16' }} className="w-full">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Renovar Membresía
                      </Button>
                      <Button variant="outline" className="w-full">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Cambiar Plan
                      </Button>
                      <Button variant="destructive" className="w-full">
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar Plan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Crown className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay plan activo</h3>
                    <p className="text-gray-600 mb-4">Selecciona un plan de membresía para comenzar.</p>
                    <Button style={{ backgroundColor: '#bcce16' }}>
                      Ver Planes Disponibles
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History within Membership Tab */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Pagos del Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#bcce16] bg-opacity-10 rounded-full flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-[#bcce16]" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                ${parseFloat(payment.amount).toLocaleString()} {payment.currency.toUpperCase()}
                              </p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(payment.status)}
                            <p className="text-xs text-gray-500 mt-1">ID: {payment.id}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay pagos registrados</h3>
                    <p className="text-gray-600">Tus pagos de membresía aparecerán aquí.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}