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

  // Fetch membership types (only public plans for non-admin users)
  const { data: membershipTypes } = useQuery({
    queryKey: ['/api/membership-types/public'],
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

  // Download individual payment receipt as PDF
  const downloadPaymentReceipt = async (payment: any) => {
    const membershipType = typedMembershipTypes.find((mt: any) => mt.id === payment.membershipTypeId);
    const paymentDate = format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es });
    const company = primaryCompany;

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      
      // Create new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Set font
      pdf.setFont('helvetica');
      
      // Header section
      pdf.setFillColor(188, 206, 22); // #bcce16
      pdf.rect(0, 0, 210, 30, 'F');
      
      // Company name
      pdf.setFontSize(22);
      pdf.setTextColor(0, 0, 0);
      pdf.text('ANPR México', 20, 20);
      
      // Subtitle
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Asociación Nacional de Profesionales en Relaciones Públicas', 20, 26);
      
      // Receipt title and number
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('RECIBO', 150, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`# ${payment.id}`, 150, 26);
      pdf.text(paymentDate, 150, 30);
      
      // Customer information section
      let yPos = 50;
      pdf.setFillColor(247, 250, 252); // #f7fafc
      pdf.rect(20, yPos, 170, 40, 'F');
      
      pdf.setFontSize(14);
      pdf.setTextColor(45, 55, 72);
      pdf.text('Información del Cliente', 25, yPos + 10);
      
      pdf.setFontSize(10);
      pdf.setTextColor(74, 85, 104);
      
      // Left column
      pdf.text('Empresa:', 25, yPos + 20);
      pdf.setTextColor(45, 55, 72);
      pdf.text(company?.nombreEmpresa || 'N/A', 25, yPos + 25);
      
      pdf.setTextColor(74, 85, 104);
      pdf.text('Email:', 25, yPos + 32);
      pdf.setTextColor(45, 55, 72);
      pdf.text(company?.email1 || 'N/A', 25, yPos + 37);
      
      // Right column
      pdf.setTextColor(74, 85, 104);
      pdf.text('Plan contratado:', 110, yPos + 20);
      pdf.setTextColor(45, 55, 72);
      pdf.text(membershipType?.nombrePlan || 'Plan básico', 110, yPos + 25);
      
      pdf.setTextColor(74, 85, 104);
      pdf.text('Estado:', 110, yPos + 32);
      pdf.setTextColor(45, 55, 72);
      const statusText = payment.status === 'succeeded' ? 'Exitoso' : 
                        payment.status === 'pending' ? 'Pendiente' : 'Fallido';
      pdf.text(statusText, 110, yPos + 37);
      
      // Amount section
      yPos += 60;
      pdf.setFillColor(188, 206, 22); // #bcce16
      pdf.rect(20, yPos, 170, 25, 'F');
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('MONTO TOTAL PAGADO', 105, yPos + 8, { align: 'center' });
      
      pdf.setFontSize(24);
      const amountText = `$${parseFloat(payment.amount || '0').toFixed(2)} ${payment.currency?.toUpperCase() || 'MXN'}`;
      pdf.text(amountText, 105, yPos + 20, { align: 'center' });
      
      // Transaction details
      yPos += 40;
      pdf.setFillColor(247, 250, 252); // #f7fafc
      pdf.rect(20, yPos, 170, 30, 'F');
      
      pdf.setFontSize(12);
      pdf.setTextColor(45, 55, 72);
      pdf.text('Detalles de la Transacción', 25, yPos + 10);
      
      pdf.setFontSize(10);
      pdf.setTextColor(74, 85, 104);
      pdf.text('ID de transacción:', 25, yPos + 18);
      pdf.setTextColor(45, 55, 72);
      pdf.text(payment.stripePaymentIntentId || 'N/A', 25, yPos + 23);
      
      pdf.setTextColor(74, 85, 104);
      pdf.text('Teléfono:', 110, yPos + 18);
      pdf.setTextColor(45, 55, 72);
      pdf.text(company?.telefono1 || 'N/A', 110, yPos + 23);
      
      // Service description
      yPos += 45;
      pdf.setFillColor(247, 250, 252); // #f7fafc
      pdf.rect(20, yPos, 170, 35, 'F');
      
      pdf.setFontSize(12);
      pdf.setTextColor(45, 55, 72);
      pdf.text('Descripción del Servicio', 25, yPos + 10);
      
      pdf.setFontSize(10);
      pdf.setTextColor(45, 55, 72);
      const serviceDescription = membershipType?.beneficios || 'Servicios de membresía empresarial en el directorio ANPR México.';
      
      // Split long text into multiple lines
      const lines = pdf.splitTextToSize(serviceDescription, 160);
      let lineY = yPos + 18;
      lines.forEach((line: string) => {
        if (lineY < yPos + 30) { // Keep within the box
          pdf.text(line, 25, lineY);
          lineY += 5;
        }
      });
      
      // Footer
      yPos += 50;
      pdf.setDrawColor(226, 232, 240); // #e2e8f0
      pdf.line(20, yPos, 190, yPos);
      
      pdf.setFontSize(9);
      pdf.setTextColor(113, 128, 150);
      const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
      pdf.text(`Este recibo fue generado automáticamente el ${currentDate}`, 105, yPos + 8, { align: 'center' });
      pdf.text('ANPR México - Directorio Empresarial | www.anpr.org.mx', 105, yPos + 15, { align: 'center' });
      
      // Save the PDF
      const fileName = `recibo-pago-${payment.id}-${format(new Date(payment.createdAt), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Recibo descargado",
        description: "El recibo de pago PDF se ha descargado correctamente",
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el recibo PDF",
        variant: "destructive",
      });
    }
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
                                    Descargar PDF
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