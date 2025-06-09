import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Building2, 
  Search, 
  ExternalLink,
  Grid3X3
} from "lucide-react";
import DirectoryMap from "@/components/DirectoryMap";
import type { CompanyWithDetails, Category } from "@/../../shared/schema";

// Función para limpiar HTML
const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

// Función para renderizar iconos de categorías
const CategoryIcon = ({ category }: { category: Category }) => {
  if (category.iconoUrl) {
    return (
      <img 
        src={category.iconoUrl} 
        alt={category.nombreCategoria}
        className="w-5 h-5 object-contain"
      />
    );
  }

  // Fallback a iconos por defecto si no hay icono en la BD
  const iconProps = {
    size: 20,
    className: "text-gray-600"
  };

  switch (category.nombreCategoria?.toLowerCase()) {
    case 'mobiliario urbano':
      return <Grid3X3 {...iconProps} />;
    case 'iluminación':
      return <Building2 {...iconProps} />;
    case 'señalización':
      return <MapPin {...iconProps} />;
    case 'jardinería':
      return <Building2 {...iconProps} />;
    case 'pavimentación':
      return <Grid3X3 {...iconProps} />;
    case 'seguridad':
      return <Building2 {...iconProps} />;
    default:
      return <Building2 {...iconProps} />;
  }
};

export default function Directory() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");

  // Parse URL parameters and set initial filter states
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const categoryId = urlParams.get('categoria');
    
    if (categoryId) {
      setSelectedCategory(categoryId);
    }
  }, [location]);

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies");
      if (!response.ok) throw new Error("Failed to fetch companies");
      return response.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const companies = companiesData?.companies || [];
  const filteredCompanies = companies.filter((company: CompanyWithDetails) => {
    const matchesSearch = company.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.descripcionEmpresa && company.descripcionEmpresa.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || selectedCategory === "all" || 
                           (company.categoriesIds && Array.isArray(company.categoriesIds) && 
                            company.categoriesIds.includes(parseInt(selectedCategory)));
    
    const matchesState = !selectedState || selectedState === "all" || 
                        (company.estadosPresencia && Array.isArray(company.estadosPresencia) && 
                         company.estadosPresencia.includes(selectedState));
    
    return matchesSearch && matchesCategory && matchesState;
  });

  // Unique states from companies (extract from estadosPresencia)
  const allStates = companies.flatMap((company: CompanyWithDetails) => 
    Array.isArray(company.estadosPresencia) ? company.estadosPresencia : []
  );
  const states = Array.from(new Set(allStates)).filter(Boolean).sort();

  if (companiesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando directorio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white' }}>
            Directorio de Empresas
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl leading-relaxed">
            Explora todas las empresas registradas en nuestra plataforma. 
            Encuentra proveedores, servicios y oportunidades de negocio.
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories?.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.nombreCategoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {states.map((state: any) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="default" size="sm">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Lista
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? 's' : ''} encontrada{filteredCompanies.length !== 1 ? 's' : ''}
            </p>
            {(searchTerm || (selectedCategory && selectedCategory !== "all") || (selectedState && selectedState !== "all")) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                  setSelectedState("");
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company: CompanyWithDetails) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow group">
              <CardHeader className="pb-4">
                <div className="flex items-start space-x-4">
                  {company.logotipoUrl ? (
                    <img
                      src={company.logotipoUrl}
                      alt={`Logo de ${company.nombreEmpresa}`}
                      className="w-16 h-16 rounded-lg object-cover border-2 border-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {company.nombreEmpresa}
                    </CardTitle>

                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {company.descripcionEmpresa && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {stripHtml(company.descripcionEmpresa)}
                  </p>
                )}
                
                <div className="space-y-2 mb-4">
                  {company.telefono1 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{company.telefono1}</span>
                    </div>
                  )}
                  {company.email1 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{company.email1}</span>
                    </div>
                  )}
                  {Array.isArray(company.estadosPresencia) && company.estadosPresencia.length > 0 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>
                        {company.estadosPresencia.slice(0, 2).join(', ')}
                        {company.estadosPresencia.length > 2 && ` +${company.estadosPresencia.length - 2}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Iconos de categorías */}
                {Array.isArray(company.categories) && company.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {company.categories.slice(0, 4).map((category: Category) => (
                      <div key={category.id} className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" title={category.nombreCategoria}>
                        <CategoryIcon category={category} />
                      </div>
                    ))}
                    {company.categories.length > 4 && (
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-xs text-gray-600">
                        +{company.categories.length - 4}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-center mt-4">
                  <Link href={`/empresa/${company.id}`}>
                    <Button className="w-full" size="sm">
                      Ver Detalles
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron empresas
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Intenta ajustar los filtros de búsqueda o explora diferentes categorías.
            </p>
          </div>
        )}
      </div>

      {/* Map Section */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Mapa de Empresas
            </h2>
            <p className="text-gray-600 mb-8">
              Visualiza la ubicación de todas las empresas registradas
            </p>
            <DirectoryMap companies={filteredCompanies} />
          </div>
        </div>
      </div>
    </div>
  );
}