import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  CreditCard, 
  Calendar, 
  Crown,
  Award,
  BarChart3,
  Briefcase,
  Check,
  Plus,
  Eye,
  Edit,
  Trash2,
  Package,
  X,
  Download,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import RepresentativeCompanyManagementComplete from "@/components/RepresentativeCompanyManagementComplete";
import RepresentativeCertificateTable from "@/components/RepresentativeCertificateTable";
import AddCertificateModal from "@/components/AddCertificateModal";
import EditCertificateModal from "@/components/EditCertificateModal";
import AddProjectModal from "@/components/AddProjectModal";
import EditProjectModal from "@/components/EditProjectModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Certificate, ProjectWithDetails } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Swal from 'sweetalert2';

export default function RepresentativeDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  console.log("RepresentativeDashboard - Current user:", user);
  
  // Certificate management states
  const [isAddCertificateModalOpen, setIsAddCertificateModalOpen] = useState(false);
  const [isEditCertificateModalOpen, setIsEditCertificateModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  
  // Project management states
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithDetails | null>(null);
  
  // Plan management states
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [isCancelPlanModalOpen, setIsCancelPlanModalOpen] = useState(false);
  
  const { toast } = useToast();

  // Handle URL parameters for direct tab navigation
  useEffect(() => {
    const updateTab = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['overview', 'company', 'projects', 'certificates', 'membership', 'payments'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };
    
    updateTab();
    window.addEventListener('popstate', updateTab);
    return () => window.removeEventListener('popstate', updateTab);
  }, []);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: [`/api/representative/dashboard/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch membership types
  const { data: membershipTypes } = useQuery({
    queryKey: ['/api/membership-types'],
  });

  // Fetch certificates for this company
  const { data: certificates = [], isLoading: certificatesLoading } = useQuery({
    queryKey: ["/api/certificates"],
  });

  // Extract company data
  const primaryCompany = (dashboardData as any)?.companies?.[0];
  const currentMembership = (dashboardData as any)?.currentMembership;
  const payments = (dashboardData as any)?.payments || [];

  // Fetch projects for the company
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: [`/api/companies/${primaryCompany?.id}/projects`],
    enabled: !!primaryCompany?.id,
  });

  // Type projects data properly
  const typedProjects = Array.isArray(projects) ? projects as ProjectWithDetails[] : [];
  
  // Type the responses properly
  const typedCertificates = Array.isArray(certificates) ? certificates as Certificate[] : [];
  const typedMembershipTypes = Array.isArray(membershipTypes) ? membershipTypes as any[] : [];

  // Delete certificate mutation
  const deleteCertificateMutation = useMutation({
    mutationFn: async (certificateId: number) => {
      return apiRequest("DELETE", `/api/certificates/${certificateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Certificado eliminado",
        description: "El certificado ha sido eliminado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el certificado",
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiRequest("DELETE", `/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Error al eliminar el proyecto");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/companies/${primaryCompany?.id}/projects`] });
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto se ha eliminado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el proyecto",
        variant: "destructive",
      });
    },
  });

  // Cancel plan mutation
  const cancelPlanMutation = useMutation({
    mutationFn: async () => {
      // Implementation for plan cancellation
      const response = await apiRequest("PATCH", `/api/companies/${primaryCompany?.id}`, {
        estado: "cancelado"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/representative/dashboard/${user?.id}`] });
      toast({
        title: "Plan cancelado",
        description: "Tu plan ha sido cancelado exitosamente",
      });
      setIsCancelPlanModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cancelar el plan",
        variant: "destructive",
      });
    },
  });

  const handleEditCertificate = (certificate: Certificate) => {
    // Check if this is an admin-assigned certificate
    const adminCertificateNames = [
      "Miembro Oficial ANPR México 2025",
      "Certificación ANPR",
      "Miembro Activo ANPR",
      "Reconocimiento ANPR"
    ];
    
    const isAdminCertificate = adminCertificateNames.some(name => 
      certificate.nombreCertificado.toLowerCase().includes(name.toLowerCase())
    );
    
    if (isAdminCertificate) {
      Swal.fire({
        title: 'Certificado protegido',
        text: 'Este certificado fue asignado por ANPR y no puede ser editado',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    setSelectedCertificate(certificate);
    setIsEditCertificateModalOpen(true);
  };

  const handleDeleteCertificate = async (certificateId: number) => {
    // Check if this is an admin-assigned certificate
    const certificate = typedCertificates.find(cert => cert.id === certificateId);
    if (certificate) {
      const adminCertificateNames = [
        "Miembro Oficial ANPR México 2025",
        "Certificación ANPR",
        "Miembro Activo ANPR",
        "Reconocimiento ANPR"
      ];
      
      const isAdminCertificate = adminCertificateNames.some(name => 
        certificate.nombreCertificado.toLowerCase().includes(name.toLowerCase())
      );
      
      if (isAdminCertificate) {
        await Swal.fire({
          title: 'Certificado protegido',
          text: 'Este certificado fue asignado por ANPR y no puede ser eliminado',
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
        return;
      }
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el certificado permanentemente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      deleteCertificateMutation.mutate(certificateId);
    }
  };

  const handleEditProject = (project: ProjectWithDetails) => {
    setSelectedProject(project);
    setIsEditProjectModalOpen(true);
  };

  const handleDeleteProject = async (projectId: number) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el proyecto permanentemente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  const handleCancelPlan = async () => {
    const result = await Swal.fire({
      title: '¿Cancelar plan?',
      text: 'Esta acción cancelará tu membresía actual',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      cancelPlanMutation.mutate();
    }
  };

  const exportPaymentHistory = () => {
    // Create CSV content
    const csvContent = [
      ['Fecha', 'Monto', 'Estado', 'Plan'],
      ...payments.map((payment: any) => [
        format(new Date(payment.createdAt), 'dd/MM/yyyy', { locale: es }),
        `$${payment.amount} ${payment.currency.toUpperCase()}`,
        payment.status === 'succeeded' ? 'Exitoso' : payment.status,
        currentMembership?.nombrePlan || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_pagos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Download individual payment receipt
  const downloadPaymentReceipt = (payment: any) => {
    const membershipType = typedMembershipTypes.find((mt: any) => mt.id === payment.membershipTypeId);
    const paymentDate = format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es });
    const company = primaryCompany;

    // Create HTML content for the receipt
    const receiptHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo de Pago - ${payment.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          .header {
            border-bottom: 3px solid #bcce16;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .company-info {
            flex: 1;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2d3748;
            margin: 0;
          }
          .company-subtitle {
            color: #718096;
            margin: 5px 0;
          }
          .receipt-info {
            text-align: right;
          }
          .receipt-title {
            font-size: 28px;
            font-weight: bold;
            color: #2d3748;
            margin: 0;
          }
          .receipt-number {
            color: #718096;
            margin: 5px 0;
          }
          .details-section {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .detail-item {
            margin-bottom: 15px;
          }
          .detail-label {
            font-weight: bold;
            color: #4a5568;
            display: block;
            margin-bottom: 5px;
          }
          .detail-value {
            color: #2d3748;
          }
          .amount-section {
            background: #bcce16;
            color: #000;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
          }
          .amount-label {
            font-size: 14px;
            margin-bottom: 5px;
          }
          .amount-value {
            font-size: 36px;
            font-weight: bold;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
          }
          .status-success {
            background: #c6f6d5;
            color: #22543d;
          }
          .status-pending {
            background: #fed7d7;
            color: #742a2a;
          }
          .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            margin-top: 30px;
            text-align: center;
            color: #718096;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <div class="company-info">
              <h1 class="company-name">ANPR México</h1>
              <p class="company-subtitle">Asociación Nacional de Profesionales en Relaciones Públicas</p>
            </div>
            <div class="receipt-info">
              <h2 class="receipt-title">RECIBO</h2>
              <p class="receipt-number"># ${payment.id}</p>
              <p class="receipt-number">${paymentDate}</p>
            </div>
          </div>
        </div>

        <div class="details-section">
          <h3 style="margin-top: 0; color: #2d3748;">Información del Cliente</h3>
          <div class="details-grid">
            <div>
              <div class="detail-item">
                <span class="detail-label">Empresa:</span>
                <span class="detail-value">${company?.nombreEmpresa || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${company?.email1 || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value">${company?.telefono1 || 'N/A'}</span>
              </div>
            </div>
            <div>
              <div class="detail-item">
                <span class="detail-label">Plan contratado:</span>
                <span class="detail-value">${membershipType?.nombrePlan || 'Plan básico'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">ID de transacción:</span>
                <span class="detail-value">${payment.stripePaymentIntentId || 'N/A'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Estado:</span>
                <span class="status-badge ${payment.status === 'succeeded' ? 'status-success' : 'status-pending'}">
                  ${payment.status === 'succeeded' ? 'Exitoso' : 
                    payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="amount-section">
          <div class="amount-label">MONTO TOTAL PAGADO</div>
          <div class="amount-value">$${parseFloat(payment.amount || '0').toFixed(2)} ${payment.currency?.toUpperCase() || 'MXN'}</div>
        </div>

        <div class="details-section">
          <h3 style="margin-top: 0; color: #2d3748;">Descripción del Servicio</h3>
          <p style="margin: 0; line-height: 1.6;">
            ${membershipType?.beneficios || 'Servicios de membresía empresarial en el directorio ANPR México.'}
          </p>
        </div>

        <div class="footer">
          <p>Este recibo fue generado automáticamente el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
          <p>ANPR México - Directorio Empresarial | www.anpr.org.mx</p>
        </div>
      </body>
      </html>
    `;

    // Create and download the receipt
    const blob = new Blob([receiptHTML], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `recibo-pago-${payment.id}-${format(new Date(payment.createdAt), 'yyyy-MM-dd')}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Recibo descargado",
      description: "El recibo de pago se ha descargado correctamente",
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel del Representante</h1>
          <p className="text-gray-600 mt-2">
            Bienvenido, {user?.displayName || user?.email}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="company">
              <Building className="h-4 w-4 mr-2" />
              Mi Empresa
            </TabsTrigger>
            <TabsTrigger value="projects">
              <Briefcase className="h-4 w-4 mr-2" />
              Proyectos
            </TabsTrigger>
            <TabsTrigger value="certificates">
              <Award className="h-4 w-4 mr-2" />
              Certificados
            </TabsTrigger>
            <TabsTrigger value="membership">
              <Crown className="h-4 w-4 mr-2" />
              Mi Plan
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="h-4 w-4 mr-2" />
              Pagos
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Empresa Activa</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {primaryCompany ? '1' : '0'}
                      </p>
                    </div>
                    <Building className="h-8 w-8 text-[#bcce16]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Plan Actual</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {currentMembership?.nombrePlan || 'Sin plan'}
                      </p>
                    </div>
                    <Crown className="h-8 w-8 text-[#bcce16]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Estado</p>
                      <Badge variant={primaryCompany?.estado === 'activo' ? 'default' : 'secondary'}>
                        {primaryCompany?.estado === 'activo' ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <Check className="h-8 w-8 text-[#bcce16]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vencimiento</p>
                      <p className="text-sm font-medium text-gray-900">
                        {primaryCompany?.fechaFinMembresia 
                          ? format(new Date(primaryCompany.fechaFinMembresia), 'dd/MM/yyyy', { locale: es })
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-[#bcce16]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Welcome Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Bienvenido a tu Panel de Representante</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Desde aquí puedes gestionar toda la información de tu empresa, proyectos, certificados y plan de membresía.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setActiveTab('company')}
                    className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Ver Mi Empresa
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('membership')}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Gestionar Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Management Tab - Using dedicated representative component */}
          <TabsContent value="company">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>
                  Mi Empresa
                </h2>
                <p className="text-gray-600 mt-2">
                  Gestiona la información básica de tu empresa
                </p>
              </div>
              
              {primaryCompany ? (
                <RepresentativeCompanyManagementComplete company={primaryCompany} />
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No hay empresa registrada</h3>
                    <p className="text-gray-600 mb-6">Registra tu empresa para completar tu perfil</p>
                    <Button className="bg-[#bcce16] hover:bg-[#a8b814] text-black">
                      Registrar empresa
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Gestión de Proyectos
                  </CardTitle>
                  <p className="text-gray-600">Administra el portafolio de proyectos de tu empresa</p>
                </div>
                {primaryCompany && (
                  <Button
                    onClick={() => setIsAddProjectModalOpen(true)}
                    className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proyecto
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Cargando proyectos...</div>
                  </div>
                ) : typedProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {typedProjects.map((project: ProjectWithDetails) => (
                      <div key={project.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                        {/* Imagen de portada */}
                        <div 
                          className="h-48 bg-gradient-to-br from-yellow-400 to-yellow-500 relative"
                          style={{
                            backgroundImage: project.galeriaImagenes && project.galeriaImagenes.length > 0 
                              ? `url(${project.galeriaImagenes[0]})`
                              : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          <div className="absolute top-3 right-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleEditProject(project)}
                              className="bg-white/90 hover:bg-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteProject(project.id)}
                              disabled={deleteProjectMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Información del proyecto */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                              {project.nombreProyecto}
                            </h3>
                            <Badge variant={project.estado === 'publicado' ? 'default' : 'secondary'}>
                              {project.estado}
                            </Badge>
                          </div>
                          
                          {project.descripcionProyecto && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {project.descripcionProyecto}
                            </p>
                          )}
                          
                          <div className="space-y-2 text-sm text-gray-500">
                            {project.clienteContratante && (
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span>{project.clienteContratante}</span>
                              </div>
                            )}
                            
                            {project.fechaInicio && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(project.fechaInicio), 'MMM yyyy', { locale: es })}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 pt-2 border-t">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{project.vistas || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Sin proyectos</h3>
                    <p className="text-gray-600 mb-6">
                      Agrega tu primer proyecto para mostrar tu portafolio
                    </p>
                    {primaryCompany && (
                      <Button 
                        onClick={() => setIsAddProjectModalOpen(true)}
                        className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Proyecto
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab - Using exact admin component */}
          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certificados y Premios
                  </CardTitle>
                  <Button 
                    onClick={() => setIsAddCertificateModalOpen(true)}
                    className="bg-[#bcce16] hover:bg-[#a8b814] text-black"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Certificado
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {certificatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Cargando certificados...</div>
                  </div>
                ) : (
                  <RepresentativeCertificateTable
                    certificates={typedCertificates}
                    onEdit={handleEditCertificate}
                    onDelete={handleDeleteCertificate}
                    userCompanyId={primaryCompany?.id}
                  />
                )}
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
                <p className="text-gray-600">Información de tu plan actual</p>
              </CardHeader>
              <CardContent>
                {currentMembership && primaryCompany ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-[#bcce16]/10 to-[#bcce16]/5 p-6 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{currentMembership.nombrePlan}</h3>
                          <p className="text-gray-600">Plan actual</p>
                        </div>
                        <Badge className="bg-[#bcce16] text-black">Activo</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Periodicidad</p>
                          <p className="font-semibold">{primaryCompany.membershipPeriodicidad}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Inicio</p>
                          <p className="font-semibold">
                            {format(new Date(primaryCompany.fechaInicioMembresia), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Vencimiento</p>
                          <p className="font-semibold">
                            {format(new Date(primaryCompany.fechaFinMembresia), 'dd/MM/yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <h4 className="font-semibold mb-3">Beneficios incluidos:</h4>
                      <div className="space-y-2">
                        {currentMembership.beneficios.split('\n').map((benefit: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#bcce16] mt-2 flex-shrink-0" />
                            <p className="text-gray-700">{benefit}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver en Directorio
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsChangePlanModalOpen(true)}
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Cambiar Plan
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleCancelPlan}
                        disabled={cancelPlanMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar Plan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Crown className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Sin plan activo</h3>
                    <p className="text-gray-600">No se encontró información del plan</p>
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
                <p className="text-gray-600">Historial completo de transacciones</p>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-6">
                    {/* Payment Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Pagos Exitosos</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900 mt-1">
                          {payments.filter((p: any) => p.status === 'succeeded').length}
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Total Pagado</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900 mt-1">
                          ${payments
                            .filter((p: any) => p.status === 'succeeded')
                            .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)
                            .toFixed(2)} MXN
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">Último Pago</span>
                        </div>
                        <p className="text-lg font-semibold text-purple-900 mt-1">
                          {payments.length > 0 ? 
                            format(new Date(payments[0].createdAt), 'dd/MM/yyyy', { locale: es }) : 
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Payment History Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Transacciones</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={exportPaymentHistory}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Exportar CSV
                        </Button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monto
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Plan
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {payments.map((payment: any, index: number) => (
                              <tr key={payment.id || index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  ${parseFloat(payment.amount || '0').toFixed(2)} {payment.currency?.toUpperCase() || 'MXN'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    variant={payment.status === 'succeeded' ? 'default' : 
                                            payment.status === 'pending' ? 'secondary' : 'destructive'}
                                  >
                                    {payment.status === 'succeeded' ? 'Exitoso' : 
                                     payment.status === 'pending' ? 'Pendiente' : 'Fallido'}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {typedMembershipTypes.find((mt: any) => mt.id === payment.membershipTypeId)?.nombrePlan || 'Plan básico'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => downloadPaymentReceipt(payment)}
                                    className="gap-2"
                                  >
                                    <Download className="h-4 w-4" />
                                    Descargar
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Sin historial de pagos</h3>
                    <p className="text-gray-600">No se han registrado pagos en tu cuenta</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals - Using exact admin modals */}
        <AddCertificateModal
          open={isAddCertificateModalOpen}
          onOpenChange={setIsAddCertificateModalOpen}
        />

        <EditCertificateModal
          open={isEditCertificateModalOpen}
          onOpenChange={setIsEditCertificateModalOpen}
          certificate={selectedCertificate}
        />

        {primaryCompany && (
          <>
            <AddProjectModal
              open={isAddProjectModalOpen}
              onOpenChange={setIsAddProjectModalOpen}
              companyId={primaryCompany.id}
            />

            {selectedProject && isEditProjectModalOpen && (
              <EditProjectModal
                open={isEditProjectModalOpen}
                onOpenChange={setIsEditProjectModalOpen}
                project={selectedProject}
                companyId={primaryCompany.id}
              />
            )}
          </>
        )}

        {/* Plan Change Modal */}
        <Dialog open={isChangePlanModalOpen} onOpenChange={setIsChangePlanModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Cambiar Plan de Membresía</DialogTitle>
              <DialogDescription>
                Selecciona un nuevo plan para tu empresa
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
              {typedMembershipTypes.map((plan: any) => (
                <div 
                  key={plan.id} 
                  className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                    plan.id === currentMembership?.id ? 'border-[#bcce16] bg-[#bcce16]/5' : 'border-gray-200'
                  }`}
                >
                  <div className="text-center">
                    <h3 className="font-bold text-xl mb-2">{plan.nombrePlan}</h3>
                    <div className="text-3xl font-bold text-[#bcce16] mb-4">
                      ${plan.precioMensual}
                      <span className="text-sm text-gray-500 font-normal">/mes</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                      {plan.beneficios.split('\n').slice(0, 4).map((benefit: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                    
                    {plan.id === currentMembership?.id ? (
                      <Badge className="bg-[#bcce16] text-black">Plan Actual</Badge>
                    ) : (
                      <Button 
                        className="w-full bg-[#bcce16] hover:bg-[#a8b814] text-black"
                        onClick={() => {
                          // Implement plan change logic
                          toast({
                            title: "Funcionalidad próximamente",
                            description: "El cambio de plan estará disponible pronto",
                          });
                          setIsChangePlanModalOpen(false);
                        }}
                      >
                        Cambiar a este plan
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}