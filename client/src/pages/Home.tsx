import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Link } from "wouter";
import * as LucideIcons from "lucide-react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Función para limpiar HTML tags
function stripHtml(html: string): string {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function CategoryIcon({ category, className = "w-5 h-5" }: { category: any; className?: string }) {
  // Si hay una URL de icono personalizado, usarla
  if (category.iconoUrl) {
    return <img src={category.iconoUrl} alt={category.nombreCategoria} className={className} />;
  }
  
  // Si hay un nombre de icono de Lucide, usarlo
  if (category.icono) {
    const IconComponent = (LucideIcons as any)[category.icono];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
  }
  
  // Fallback a icono genérico
  const Building = LucideIcons.Building;
  return <Building className={className} />;
}

function TestimonialsSection() {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["/api/opinions", { tipo: "plataforma", estado: "aprobada" }],
    queryFn: () => fetch("/api/opinions?tipo=plataforma&estado=aprobada").then(res => res.json()),
  });

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ 
          color: i <= rating ? "#bcce16" : "#d1d5db", 
          fontSize: "1.2rem" 
        }}>
          ★
        </span>
      );
    }
    return stars;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div style={{ padding: "4rem 2rem", backgroundColor: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "1.2rem", color: "#6b7280" }}>
            Cargando reseñas...
          </div>
        </div>
      </div>
    );
  }

  const approvedReviews = reviews?.opinions || [];
  const displayReviews = approvedReviews.slice(0, 6); // Mostrar máximo 6 reseñas

  if (displayReviews.length === 0) {
    return (
      <div style={{ padding: "4rem 2rem", backgroundColor: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            textAlign: "center",
            color: "#0f2161",
            fontFamily: "'Montserrat', sans-serif"
          }}>
            Escuche a Nuestra Comunidad: Proyectos Reales, Experiencias Auténticas
          </h2>
          
          <p style={{
            fontSize: "1.1rem",
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "3rem",
            maxWidth: "900px",
            margin: "0 auto 3rem auto"
          }}>
            Lea reseñas auténticas de productos y proveedores, comparta sus opiniones y conéctese con sus pares.
          </p>

          <div style={{
            textAlign: "center",
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            padding: "3rem",
            border: "1px solid #e5e7eb"
          }}>
            <p style={{ 
              fontSize: "1.1rem", 
              color: "#6b7280",
              marginBottom: "1rem" 
            }}>
              Próximamente aparecerán aquí las reseñas de nuestra comunidad
            </p>
            <p style={{ 
              fontSize: "0.9rem", 
              color: "#9ca3af" 
            }}>
              Sea el primero en compartir su experiencia con la plataforma
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "4rem 2rem", backgroundColor: "white" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{
          fontSize: "2rem",
          fontWeight: "bold",
          marginBottom: "1rem",
          textAlign: "center",
          color: "#0f2161",
          fontFamily: "'Montserrat', sans-serif"
        }}>
          Historias reales, resultados comprobados.
        </h2>
        
        <p style={{
          fontSize: "1.1rem",
          textAlign: "center",
          color: "#6b7280",
          marginBottom: "3rem",
          maxWidth: "900px",
          margin: "0 auto 3rem auto"
        }}>
          Lee opiniones de profesionales como tú, comparte tu experiencia y contribuye a construir una comunidad que eleva los estándares del sector.
        </p>

        {/* Grid de reseñas */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "2rem",
          marginBottom: "3rem"
        }}>
          {displayReviews.map((review: any, index: number) => (
            <div key={review.id || index} style={{
              backgroundColor: "#f8fafc",
              borderRadius: "12px",
              padding: "2rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: "1px solid #e5e7eb"
            }}>
              <div style={{
                display: "flex",
                marginBottom: "1rem"
              }}>
                {renderStars(review.calificacion || 5)}
              </div>
              
              <p style={{
                fontSize: "1rem",
                lineHeight: "1.6",
                color: "#374151",
                marginBottom: "1.5rem",
                fontStyle: "italic"
              }}>
                "{review.comentario}"
              </p>
              
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  backgroundColor: "#0f2161",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "1.2rem",
                  fontWeight: "bold"
                }}>
                  {getInitials(review.nombre || "Usuario")}
                </div>
                <div>
                  <div style={{
                    fontWeight: "600",
                    color: "#0f2161",
                    fontSize: "0.9rem"
                  }}>
                    {review.nombre}
                  </div>
                  <div style={{
                    color: "#6b7280",
                    fontSize: "0.8rem"
                  }}>
                    {review.cargo || "Miembro de la comunidad"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enlace a ver más reseñas */}
        {approvedReviews.length > 6 && (
          <div style={{ textAlign: "center" }}>
            <Link href="/testimonials">
              <button style={{
                backgroundColor: "#bcce16",
                color: "#0f2161",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s ease"
              }}
              onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#a8b814"}
              onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = "#bcce16"}
              >
                Ver Más Reseñas
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CompanyCard({ company }: { company: any }) {
  return (
    <Link href={`/empresa/${company.id}`}>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          overflow: "hidden",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
          aspectRatio: "1",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
        }}
      >
        <div
          style={{
            height: "100%",
            background: company.galeriaProductosUrls && company.galeriaProductosUrls.length > 0
              ? `url(${company.galeriaProductosUrls[0]}) center/cover`
              : company.imagenPortada
              ? `url(${company.imagenPortada}) center/cover`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            position: "relative",
          }}
        >
          {/* Logo sobrepuesto */}
          {company.logotipoUrl && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "120px",
                height: "120px",
                backgroundImage: `url(${company.logotipoUrl})`,
                backgroundPosition: "center",
                backgroundSize: "120px",
                backgroundRepeat: "no-repeat",
              }}
            />
          )}
          {!company.galeriaProductosUrls?.length && !company.imagenPortada && !company.logotipoUrl && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "60px",
                height: "60px",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "white",
              }}
            >
              {company.nombreEmpresa?.charAt(0) || "?"}
            </div>
          )}

          {company.membershipType && (
            <div
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "0.75rem",
                backgroundColor: company.membershipType.nombreTipo === "Premium" 
                  ? "#eab308" : company.membershipType.nombreTipo === "Pro" 
                  ? "#3b82f6" : "#6b7280",
                color: "white",
                padding: "0.25rem 0.5rem",
                borderRadius: "12px",
                fontSize: "0.7rem",
                fontWeight: "600",
              }}
            >
              {company.membershipType.nombreTipo}
            </div>
          )}
        </div>


      </div>
    </Link>
  );
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const sliderRef = useRef<HTMLDivElement>(null);
  const categorySliderRef = useRef<HTMLDivElement>(null);

  const {
    data: companiesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/companies", { premiumOnly: true }],
    queryFn: () => fetch("/api/companies?premiumOnly=true").then(res => res.json()),
  });

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Separate query for "Empresas líderes" slider - all companies, random selection
  const {
    data: allCompaniesResponse,
    isLoading: allCompaniesLoading,
  } = useQuery({
    queryKey: ["/api/companies", { allCompanies: true }],
    queryFn: () => fetch("/api/companies?limit=100").then(res => res.json()),
  });

  const companies = (companiesResponse as any)?.companies || [];
  const categories = (categoriesResponse as any) || [];
  const allCompanies = (allCompaniesResponse as any)?.companies || [];
  
  // Random selection of up to 15 companies for "Empresas líderes" slider
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  const leaderCompanies = shuffleArray(allCompanies).slice(0, 15);
  
  // Obtener estados únicos de las empresas registradas
  const allStates: string[] = [];
  companies.forEach((company: any) => {
    if (company.estadosPresencia && Array.isArray(company.estadosPresencia) && company.estadosPresencia.length > 0) {
      company.estadosPresencia.forEach((estado: string) => {
        if (estado && estado.trim() !== "" && !allStates.includes(estado)) {
          allStates.push(estado);
        }
      });
    }
  });
  
  const mexicanStates = allStates.sort();
  const hasValidStates = mexicanStates.length > 0;

  const searchResults = companies.filter((company: any) => {
    const matchesSearch = searchTerm.trim() === "" || 
      company.nombreEmpresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.descripcionEmpresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.categories?.some((cat: any) => cat.nombreCategoria?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "" || 
      company.categories?.some((cat: any) => cat.id?.toString() === selectedCategory);
    
    const matchesLocation = selectedLocation === "" || 
      (company.estadosPresencia && company.estadosPresencia.includes(selectedLocation));
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -350, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 350, behavior: "smooth" });
    }
  };

  const scrollCategoryLeft = () => {
    if (categorySliderRef.current) {
      categorySliderRef.current.scrollBy({ left: -620, behavior: "smooth" });
    }
  };

  const scrollCategoryRight = () => {
    if (categorySliderRef.current) {
      categorySliderRef.current.scrollBy({ left: 620, behavior: "smooth" });
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div
        className="relative text-center text-white"
        style={{
          background: `linear-gradient(rgba(15, 33, 97, 0.9), rgba(15, 33, 97, 0.7)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          padding: "5rem 1rem 3rem 1rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 1,
          }}
        ></div>

        <div style={{ position: "relative", zIndex: 2, maxWidth: "900px", marginLeft: "2rem", paddingRight: "2rem" }}>
          <h1
            className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4"
            style={{
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              textAlign: "left",
            }}
          >
            El Directorio de Equipamiento Urbano de México
          </h1>
          <p
            className="text-sm md:text-lg lg:text-xl mb-8 opacity-95"
            style={{
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
              textAlign: "left",
            }}
          >
            Encuentra en un solo lugar a los mejores proveedores del sector. Explora productos, compara soluciones y conecta con quienes pueden llevar tu proyecto al siguiente nivel. ¡Empieza ahora!
          </p>

          <div>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Campo de búsqueda con lupa */}
              <div className="relative flex-1 md:flex-[2]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-white/95 backdrop-blur-sm border-gray-200"
                  style={{
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                  }}
                />
              </div>
              
              {/* Filtro de categoría */}
              <div className="flex-1">
                <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
                  <SelectTrigger className="h-12 bg-white/95 backdrop-blur-sm border-gray-200" style={{
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                  }}>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.nombreCategoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Filtro de ubicación - solo mostrar si hay estados registrados */}
              {hasValidStates && (
                <div className="flex-1">
                  <Select value={selectedLocation || "all"} onValueChange={(value) => setSelectedLocation(value === "all" ? "" : value)}>
                    <SelectTrigger className="h-12 bg-white/95 backdrop-blur-sm border-gray-200" style={{
                      boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                    }}>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      {mexicanStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      <div className="py-8 md:py-16 px-4 max-w-6xl mx-auto">
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">
              Cargando empresas...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">
              Error al cargar las empresas: {String(error)}
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 text-center text-gray-700 font-['Montserrat'] leading-tight">
              Cada gran proyecto comienza con los mejores aliados
            </h2>
            
            <p className="text-sm md:text-lg text-center text-gray-500 mb-8 md:mb-12 max-w-4xl mx-auto px-4">
              {searchTerm
                ? `Resultados de búsqueda (${searchResults.length})`
                : `Conoce a las empresas líderes que transforman espacios públicos`}
            </p>

            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg md:text-xl">
                  {searchTerm
                    ? "No se encontraron empresas que coincidan con tu búsqueda."
                    : "No hay empresas registradas."}
                </p>
              </div>
            ) : (
              <div className="relative">
                {companies.length > 3 && (
                  <button
                    onClick={scrollLeft}
                    className="hidden md:flex absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border-2 border-gray-200 rounded-full w-12 h-12 items-center justify-center cursor-pointer shadow-lg text-xl text-blue-500 hover:bg-gray-50"
                  >
                    ‹
                  </button>
                )}

                <div
                  ref={sliderRef}
                  className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide px-0 md:px-5"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {searchResults.slice(0, 5).map((company: any) => (
                    <div
                      key={company.id}
                      className="min-w-[280px] md:min-w-[320px] lg:min-w-[280px] max-w-[280px] md:max-w-[320px] lg:max-w-[280px] flex-shrink-0"
                    >
                      <CompanyCard company={company} />
                    </div>
                  ))}
                </div>

                {companies.length > 3 && (
                  <button
                    onClick={scrollRight}
                    className="hidden md:flex absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border-2 border-gray-200 rounded-full w-12 h-12 items-center justify-center cursor-pointer shadow-lg text-xl text-blue-500 hover:bg-gray-50"
                  >
                    ›
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Nueva sección: Empresas líderes por categoría */}
      <div className="py-8 md:py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-center text-[#0f2161] font-['Montserrat']">
            Empresas líderes en las que puede confiar
          </h2>
          
          <p className="text-sm md:text-lg text-center text-gray-500 mb-8 md:mb-12 max-w-4xl mx-auto px-4">
            Haz clic y descubre más sobre las empresas líderes y cómo colaborar con ellas.
          </p>

          {/* Slider de empresas por categoría */}
          <div className="relative">
            {/* Botones de navegación */}
            <button
              onClick={scrollCategoryLeft}
              className="hidden md:flex absolute left-0 top-1/2 transform -translate-y-1/2 bg-white border-2 border-gray-200 rounded-full w-10 h-10 items-center justify-center cursor-pointer shadow-lg z-10 text-[#0f2161] hover:bg-gray-50"
            >
              ‹
            </button>

            <button
              onClick={scrollCategoryRight}
              className="hidden md:flex absolute right-0 top-1/2 transform -translate-y-1/2 bg-white border-2 border-gray-200 rounded-full w-10 h-10 items-center justify-center cursor-pointer shadow-lg z-10 text-[#0f2161] hover:bg-gray-50"
            >
              ›
            </button>

            <div 
              ref={categorySliderRef}
              className="flex gap-4 md:gap-8 overflow-x-auto scroll-smooth pb-4 px-0 md:px-5"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch"
              }}>
              {leaderCompanies.map((categoryCompany: any, index: number) => {
                if (!categoryCompany) return null;
                
                return (
                  <div key={categoryCompany.id} className="min-w-[320px] md:min-w-[500px] lg:min-w-[600px] max-w-[320px] md:max-w-[500px] lg:max-w-[600px] flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row h-auto md:h-72">
                      {/* Imagen del producto */}
                      <div style={{
                        width: "50%",
                        background: categoryCompany.galeriaProductosUrls && categoryCompany.galeriaProductosUrls.length > 0
                          ? `url(${categoryCompany.galeriaProductosUrls[0]}) center/cover`
                          : categoryCompany.imagenPortada
                          ? `url(${categoryCompany.imagenPortada}) center/cover`
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        position: "relative"
                      }}>
                        
                        {!categoryCompany.galeriaProductosUrls?.length && !categoryCompany.imagenPortada && (
                          <div style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "80px",
                            height: "80px",
                            backgroundColor: "rgba(255,255,255,0.2)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2rem",
                            fontWeight: "bold",
                            color: "white"
                          }}>
                            {categoryCompany.nombreEmpresa?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                      
                      {/* Ficha técnica de la empresa */}
                      <div style={{
                        width: "50%",
                        padding: "2rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}>
                        <div>
                          <h3 style={{
                            fontSize: "1.4rem",
                            fontWeight: "700",
                            color: "#0f2161",
                            marginBottom: "0.5rem",
                            fontFamily: "'Montserrat', sans-serif"
                          }}>
                            {categoryCompany.nombreEmpresa}
                          </h3>
                          
                          <div style={{
                            color: "#6b7280",
                            fontSize: "0.9rem",
                            lineHeight: "1.5",
                            marginBottom: "1rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}>
                            {categoryCompany.descripcionEmpresa ? stripHtml(categoryCompany.descripcionEmpresa) : "Empresa especializada en soluciones innovadoras"}
                          </div>
                          
                          {/* Información de contacto */}
                          <div style={{ marginBottom: "1rem" }}>
                            {categoryCompany.estadosPresencia && categoryCompany.estadosPresencia.length > 0 && (
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "0.5rem",
                                fontSize: "0.8rem",
                                color: "#6b7280"
                              }}>
                                <span style={{ marginRight: "0.5rem" }}>📍</span>
                                <span>{categoryCompany.estadosPresencia.slice(0, 2).join(', ')}</span>
                              </div>
                            )}
                            
                            {categoryCompany.telefono1 && (
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                fontSize: "0.8rem",
                                color: "#6b7280"
                              }}>
                                <span style={{ marginRight: "0.5rem" }}>📞</span>
                                <span>{categoryCompany.telefono1}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Botón ver detalles */}
                        <Link href={`/empresa/${categoryCompany.id}`}>
                          <button style={{
                            backgroundColor: "#bcce16",
                            color: "#0f2161",
                            border: "none",
                            borderRadius: "50px",
                            padding: "0.8rem 1.5rem",
                            fontSize: "0.9rem",
                            fontFamily: "'Montserrat', sans-serif",
                            fontWeight: "700",
                            cursor: "pointer",
                            width: "100%",
                            transition: "background-color 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#a8b914";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#bcce16";
                          }}>
                            Ver Detalles
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de reseñas */}
      <TestimonialsSection />

      {/* Sección de registro para proveedores */}
      <div style={{ 
        padding: "4rem 2rem", 
        backgroundColor: "#0f2161",
        color: "white" 
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            fontFamily: "'Montserrat', sans-serif",
            color: "white"
          }}>
            ¿Eres proveedor de equipamiento urbano o soluciones para parques?
          </h2>
          
          <p style={{
            fontSize: "1.2rem",
            lineHeight: "1.6",
            marginBottom: "2.5rem",
            color: "#e5e7eb"
          }}>
            Regístrate y conecta con cientos de profesionales, proyectos y clientes potenciales en toda América Latina.
            Muestra tus productos, comparte tus innovaciones y haz crecer tu presencia en la industria.
          </p>

          <Link href="/planes">
            <button style={{
              backgroundColor: "#bcce16",
              color: "#0f2161",
              border: "none",
              borderRadius: "50px",
              padding: "1.2rem 2.5rem",
              fontSize: "1.1rem",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: "700",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              boxShadow: "0 4px 6px rgba(0,0,0,0.2)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#a8b914";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#bcce16";
            }}>
              Regístrate como empresa
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}