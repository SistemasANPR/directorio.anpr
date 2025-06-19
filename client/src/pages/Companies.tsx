import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Download, Upload, FileDown } from "lucide-react";
import CompanyTable from "@/components/CompanyTable";
import AddCompanyModal from "@/components/AddCompanyModal";
import EditCompanyModal from "@/components/EditCompanyModal";
import { CompanyWithDetails, Category, MembershipType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

export default function Companies() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMembership, setSelectedMembership] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { isAdmin, user, impersonateCompany } = useAuth();

  // Fetch companies with filters - use admin route to see all companies including inactive ones
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ["/api/admin/companies", { 
      search: searchTerm, 
      categoryId: selectedCategory,
      membershipTypeId: selectedMembership,
      estado: selectedStatus,
      page: currentPage 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10"
      });
      
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory && selectedCategory !== "all") params.append("categoryId", selectedCategory);
      if (selectedMembership && selectedMembership !== "all") params.append("membershipTypeId", selectedMembership);
      if (selectedStatus && selectedStatus !== "all") params.append("estado", selectedStatus);
      
      const response = await fetch(`/api/admin/companies?${params}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to fetch companies");
      return response.json();
    },
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch membership types for filter
  const { data: membershipTypes = [] } = useQuery<MembershipType[]>({
    queryKey: ["/api/membership-types"],
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: number) => {
      await apiRequest("DELETE", `/api/companies/${companyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Empresa eliminada",
        description: "La empresa ha sido eliminada exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la empresa",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (company: CompanyWithDetails) => {
    setSelectedCompany(company);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (companyId: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar empresa?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      deleteCompanyMutation.mutate(companyId);
    }
  };

  const handleView = (company: CompanyWithDetails) => {
    console.log("Viewing company:", company);
    toast({
      title: "Ver empresa",
      description: `Mostrando detalles de ${company.nombreEmpresa}`,
    });
  };

  const handleImpersonate = (company: CompanyWithDetails) => {
    impersonateCompany(company);
    toast({
      title: "Modo representante activado",
      description: `Ahora está actuando como representante de ${company.nombreEmpresa}`,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedMembership("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  const handleExport = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `empresas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exportación exitosa",
      description: "El archivo CSV ha sido descargado",
    });
  };

  const handleDownloadTemplate = () => {
    const templateHeaders = [
      'nombreEmpresa', 'descripcionEmpresa', 'categoriaId', 'membershipTypeId',
      'email1', 'email2', 'telefono1', 'telefono2', 'direccionFisica',
      'paisesPresencia', 'estadosPresencia', 'ciudadesPresencia', 'ubicacionPrincipal',
      'sitioWeb', 'catalogoDigitalUrl', 'galeriaProductosUrls', 'videosUrls',
      'redesSociales_facebook', 'redesSociales_instagram', 'redesSociales_linkedin',
      'redesSociales_twitter', 'redesSociales_youtube', 'redesSociales_whatsapp',
      'representantesVentas', 'ubicacionGeografica', 'membershipPeriodicidad',
      'formaPago', 'fechaInicioMembresia', 'fechaFinMembresia', 'notasMembresia',
      'estado', 'userId'
    ];

    const templateData = [
      templateHeaders,
      [
        'Empresa Ejemplo SA', 
        'Descripción completa de la empresa y sus servicios principales',
        '1', '1',
        'contacto@empresa.com', 'ventas@empresa.com',
        '+52 55 1234 5678', '+52 55 8765 4321',
        'Av. Principal 123, Col. Centro, CP 12345, Ciudad, Estado',
        'México,Estados Unidos', 'CDMX,Estado de México', 'Ciudad de México,Toluca',
        'Ciudad de México, México',
        'https://www.empresa.com', 'https://catalogo.empresa.com',
        'imagen1.jpg,imagen2.jpg,imagen3.jpg', 'https://youtube.com/watch?v=ejemplo',
        'https://facebook.com/empresa', 'https://instagram.com/empresa',
        'https://linkedin.com/company/empresa', 'https://twitter.com/empresa',
        'https://youtube.com/empresa', '+52 55 1234 5679',
        'Juan Pérez - Director General - juan@empresa.com - +52 55 1111 2222',
        '19.4326,-99.1332', 'anual', 'tarjeta',
        '2024-01-15', '2025-01-15', 'Empresa con buen historial crediticio',
        'activo', '1'
      ]
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    
    // Ajustar ancho de columnas
    const columnWidths = templateHeaders.map(() => ({ wch: 20 }));
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Empresas');
    
    // Crear archivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_importacion_empresas.xlsx');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Plantilla descargada",
      description: "La plantilla de Excel ha sido descargada exitosamente",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSV(text);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const generateCSV = () => {
    const headers = [
      'Nombre Empresa',
      'Descripción',
      'Categoría',
      'Membresía',
      'Email 1',
      'Email 2',
      'Email 3',
      'Teléfono 1',
      'Teléfono 2',
      'Teléfono 3',
      'Dirección',
      'Ciudad',
      'Estado',
      'País',
      'Código Postal',
      'Facebook',
      'Instagram',
      'LinkedIn',
      'Twitter',
      'YouTube',
      'TikTok',
      'Representante 1 - Nombre',
      'Representante 1 - Cargo',
      'Representante 1 - Email',
      'Representante 1 - Teléfono',
      'Representante 2 - Nombre',
      'Representante 2 - Cargo',
      'Representante 2 - Email',
      'Representante 2 - Teléfono',
      'Representante 3 - Nombre',
      'Representante 3 - Cargo',
      'Representante 3 - Email',
      'Representante 3 - Teléfono',
      'Video URL',
      'Notas Adicionales'
    ];

    const rows = companies.map(company => [
      company.nombreEmpresa || '',
      company.descripcionEmpresa?.replace(/<[^>]*>/g, '') || '', // Remove HTML tags
      company.category?.nombreCategoria || '',
      company.membershipType?.nombrePlan || '',
      company.email1 || '',
      company.email2 || '',
      company.email3 || '',
      company.telefono1 || '',
      company.telefono2 || '',
      company.telefono3 || '',
      company.direccion || '',
      company.ciudad || '',
      company.estado || '',
      company.pais || '',
      company.codigoPostal || '',
      company.facebook || '',
      company.instagram || '',
      company.linkedin || '',
      company.twitter || '',
      company.youtube || '',
      company.tiktok || '',
      company.representante1Nombre || '',
      company.representante1Cargo || '',
      company.representante1Email || '',
      company.representante1Telefono || '',
      company.representante2Nombre || '',
      company.representante2Cargo || '',
      company.representante2Email || '',
      company.representante2Telefono || '',
      company.representante3Nombre || '',
      company.representante3Cargo || '',
      company.representante3Email || '',
      company.representante3Telefono || '',
      company.videoUrl || '',
      company.notasAdicionales || ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  };

  const processCSV = async (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim());
      const dataRows = lines.slice(1);

      console.log('CSV data:', { headers, dataRows });

      // Mapear los datos del CSV a la estructura de empresa
      const companiesToCreate = dataRows.map(row => {
        const cells = row.split(';').map(cell => cell.replace(/"/g, '').trim());
        
        return {
          nombreEmpresa: cells[1] || '',
          email1: cells[3] || '',
          telefono1: cells[4] || '',
          sitioWeb: cells[5] || '',
          descripcionEmpresa: cells[6] || '',
          direccionFisica: cells[2] || '',
          paisesPresencia: cells[10] ? [cells[10]] : [],
          estadosPresencia: cells[11] ? [cells[11]] : [],
          ciudadesPresencia: cells[11] ? [cells[11]] : [],
          logotipoUrl: cells[8] || '',
          videoUrl1: cells[9] || '',
          catalogoDigitalUrl: cells[10] || '',
          representantesVentas: cells[7] ? [{ telefono: cells[7] }] : [],
          categoriesIds: [],
          membershipTypeId: null,
          certificateIds: [],
          userId: 1, // Usuario por defecto
          estado: 'activo'
        };
      });

      // Crear las empresas en la base de datos
      let successCount = 0;
      let errorCount = 0;

      for (const companyData of companiesToCreate) {
        try {
          if (companyData.nombreEmpresa && companyData.email1) {
            await apiRequest("POST", "/api/companies", companyData);
            successCount++;
          }
        } catch (error) {
          errorCount++;
          console.error('Error creating company:', error);
        }
      }

      // Refrescar la lista de empresas
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });

      toast({
        title: "Importación completada",
        description: `${successCount} empresas creadas exitosamente. ${errorCount} errores.`,
      });

    } catch (error) {
      toast({
        title: "Error en importación",
        description: "No se pudo procesar el archivo CSV",
        variant: "destructive",
      });
    }
  };

  const processExcel = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Usar la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          toast({
            title: "Error en importación",
            description: "El archivo Excel está vacío",
            variant: "destructive",
          });
          return;
        }

        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1);

        console.log('Excel data:', { headers, dataRows });

        // Mapear los datos del Excel a la estructura de empresa
        const companiesToCreate = dataRows.map((row: any[]) => {
          return {
            nombreEmpresa: row[1] || '',
            email1: row[3] || '',
            telefono1: row[4] || '',
            sitioWeb: row[5] || '',
            descripcionEmpresa: row[6] || '',
            direccionFisica: row[2] || '',
            paisesPresencia: row[10] ? [row[10]] : [],
            estadosPresencia: row[11] ? [row[11]] : [],
            ciudadesPresencia: row[11] ? [row[11]] : [],
            logotipoUrl: row[8] || '',
            videoUrl1: row[9] || '',
            catalogoDigitalUrl: row[10] || '',
            representantesVentas: row[7] ? [{ telefono: row[7] }] : [],
            categoriesIds: [],
            membershipTypeId: null,
            certificateIds: [],
            userId: 1, // Usuario por defecto
            estado: 'activo'
          };
        });

        // Crear las empresas en la base de datos
        let successCount = 0;
        let errorCount = 0;

        for (const companyData of companiesToCreate) {
          try {
            if (companyData.nombreEmpresa && companyData.email1) {
              await apiRequest("POST", "/api/companies", companyData);
              successCount++;
            }
          } catch (error) {
            errorCount++;
            console.error('Error creating company:', error);
          }
        }

        // Refrescar la lista de empresas
        queryClient.invalidateQueries({ queryKey: ["/api/companies"] });

        toast({
          title: "Importación completada",
          description: `${successCount} empresas creadas exitosamente. ${errorCount} errores.`,
        });

      } catch (error) {
        toast({
          title: "Error en importación",
          description: "No se pudo procesar el archivo Excel",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        processCSV(text);
      };
      reader.readAsText(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      processExcel(file);
    } else {
      toast({
        title: "Formato no compatible",
        description: "Solo se admiten archivos CSV y Excel (.xlsx, .xls)",
        variant: "destructive",
      });
    }
    
    event.target.value = '';
  };

  const companies = companiesData?.companies || [];
  const totalPages = companiesData?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Directorio de Empresas</h1>
          <p className="text-gray-600 mt-1">Gestiona y visualiza todas las empresas registradas</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón Plantilla */}
          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="flex items-center space-x-2 text-green-600 border-green-600 hover:bg-green-50"
          >
            <FileDown className="w-4 h-4" />
            <span>Plantilla</span>
          </Button>

          {/* Botón Exportar */}
          <Button 
            onClick={handleExport}
            variant="outline" 
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </Button>
          
          {/* Botón Importar */}
          <div className="relative">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="import-file"
            />
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              asChild
            >
              <label htmlFor="import-file" className="cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Importar</span>
              </label>
            </Button>
          </div>
          
          {/* Botón Nueva Empresa */}
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Plus className="w-4 h-4" />
            <span>Nueva Empresa</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros de búsqueda</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.nombreCategoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMembership} onValueChange={setSelectedMembership}>
              <SelectTrigger>
                <SelectValue placeholder="Membresía" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las membresías</SelectItem>
                {membershipTypes.map((membership) => (
                  <SelectItem key={membership.id} value={membership.id.toString()}>
                    {membership.nombrePlan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Empresas registradas ({companiesData?.total || 0})
            </CardTitle>
            <div className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {companiesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Cargando empresas...</div>
            </div>
          ) : (
            <>
              <CompanyTable
                companies={companies}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onImpersonate={isAdmin ? handleImpersonate : undefined}
              />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-700">
                    Mostrando {Math.min((currentPage - 1) * 10 + 1, companiesData?.total || 0)} a{" "}
                    {Math.min(currentPage * 10, companiesData?.total || 0)} de {companiesData?.total || 0} empresas
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      if (totalPages <= 5) {
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      return null;
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddCompanyModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <EditCompanyModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        company={selectedCompany}
      />
    </div>
  );
}
