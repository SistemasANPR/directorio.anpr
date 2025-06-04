import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Link } from "wouter";
import * as LucideIcons from "lucide-react";

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
            height: "75%",
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
                width: "60px",
                height: "60px",
                background: `url(${company.logotipoUrl}) center/contain no-repeat`,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "8px",
                padding: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
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

        <div
          style={{
            height: "25%",
            padding: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#1f2937",
              textAlign: "center",
              lineHeight: "1.2",
              margin: "0",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {company.nombreEmpresa}
          </h3>
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
    queryKey: ["/api/companies"],
  });

  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["/api/categories"],
  });

  const companies = (companiesResponse as any)?.companies || [];
  const categories = (categoriesResponse as any) || [];
  
  // Lista de estados mexicanos para el selector de ubicaciones
  const mexicanStates = [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", 
    "Chiapas", "Chihuahua", "Coahuila", "Colima", "Ciudad de México", 
    "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", 
    "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", 
    "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", 
    "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
  ];

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

        <div style={{ position: "relative", zIndex: 2 }}>
          <h1
            className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4"
            style={{
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            Directorio de Proveedores
          </h1>
          <p
            className="text-sm md:text-lg lg:text-xl mb-8 opacity-95 max-w-4xl mx-auto px-4"
            style={{
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            Conéctese con fabricantes, distribuidores y especialistas líderes. Descubra soluciones innovadoras y haga crecer su red de proyectos. ¡Comience su búsqueda hoy mismo!
          </p>

          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Campo de búsqueda - SIN LUPA */}
              <div className="flex-1 md:flex-2 relative">
                <input
                  type="text"
                  placeholder="empresas, servicios o categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 text-sm md:text-lg rounded-lg border-none outline-none text-gray-700"
                  style={{
                    height: "52px",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "8px",
                  }}
                />
              </div>
              
              {/* Filtro de categoría */}
              <div className="flex-1">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 text-sm md:text-lg rounded-lg border-none outline-none text-gray-700 cursor-pointer"
                  style={{
                    height: "52px",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "8px",
                  }}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.nombreCategoria}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Filtro de ubicación */}
              <div className="flex-1">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 text-sm md:text-lg rounded-lg border-none outline-none text-gray-700 cursor-pointer"
                  style={{
                    height: "52px",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "8px",
                  }}
                >
                  <option value="">Todas las ubicaciones</option>
                  {mexicanStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slider de categorías - Diseño con contenedor blanco */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="hero-title text-2xl md:text-3xl text-gray-800 mb-2">Explora por Categorías</h3>
            <p className="text-gray-600">Encuentra empresas especializadas en cada sector</p>
          </div>
          
          {/* Contenedor blanco con padding */}
          <div className="bg-white rounded-xl shadow-sm p-8 pb-16 relative">
            {/* Botón izquierdo */}
            <button
              onClick={() => {
                const slider = document.getElementById('categorySlider');
                if (slider) slider.scrollBy({ left: -400, behavior: 'smooth' });
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-300 hover:bg-gray-400 rounded-full p-2 transition-all duration-300"
            >
              <LucideIcons.ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>

            {/* Botón derecho */}
            <button
              onClick={() => {
                const slider = document.getElementById('categorySlider');
                if (slider) slider.scrollBy({ left: 400, behavior: 'smooth' });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-300 hover:bg-gray-400 rounded-full p-2 transition-all duration-300"
            >
              <LucideIcons.ChevronRight className="w-4 h-4 text-gray-700" />
            </button>

            {/* Contenedor del slider - Mostrar 12 iconos inicialmente */}
            <div 
              id="categorySlider"
              className="flex gap-4 overflow-x-auto scroll-smooth px-12 py-4 scrollbar-hide"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {/* Todas las empresas */}
              <Link href="/directorio">
                <div className="flex-shrink-0 group cursor-pointer">
                  <div className="text-center relative min-w-[80px]">
                    <div className="flex items-center justify-center group-hover:scale-110 transition-transform duration-300 h-16">
                      <LucideIcons.Building className="w-10 h-10 text-orange-500" />
                    </div>
                    <h4 className="font-medium text-gray-800 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                      Todas
                    </h4>
                  </div>
                </div>
              </Link>

              {/* Categorías individuales */}
              {categories.map((category: any) => (
                <Link 
                  key={category.id} 
                  href={`/directorio?categoryId=${category.id}`}
                >
                  <div className="flex-shrink-0 group cursor-pointer">
                    <div className="text-center relative min-w-[80px]">
                      <div className="flex items-center justify-center group-hover:scale-110 transition-transform duration-300 h-16">
                        <CategoryIcon category={category} className="w-10 h-10 text-orange-500" />
                      </div>
                      <h4 className="font-medium text-gray-800 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                        {category.nombreCategoria}
                      </h4>
                    </div>
                  </div>
                </Link>
              ))}
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
              Encuentre Exactamente lo que Necesita para su Proyecto
            </h2>
            
            <p className="text-sm md:text-lg text-center text-gray-500 mb-8 md:mb-12 max-w-4xl mx-auto px-4">
              {searchTerm
                ? `Resultados de búsqueda (${searchResults.length})`
                : `Descubra ${companies.length} empresas líderes en diferentes sectores`}
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
            Descubra empresas mejor valoradas, soluciones innovadoras y proyectos inspiradores. 
            Haga clic para explorar sus perfiles y conectarse directamente.
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
              {categories.slice(0, 6).map((category: any, index: number) => {
                // Asignar una empresa aleatoria de la lista para mostrar variedad
                const categoryCompany = companies[index % companies.length];
                
                if (!categoryCompany) return null;
                
                return (
                  <div key={category.id} className="min-w-[320px] md:min-w-[500px] lg:min-w-[600px] max-w-[320px] md:max-w-[500px] lg:max-w-[600px] flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row h-auto md:h-72">
                      {/* Imagen del producto */}
                      <div style={{
                        width: "50%",
                        background: categoryCompany.imagenPortada
                          ? `url(${categoryCompany.imagenPortada}) center/cover`
                          : categoryCompany.logotipoUrl
                          ? `url(${categoryCompany.logotipoUrl}) center/contain no-repeat #f8fafc`
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        position: "relative"
                      }}>
                        {/* Badge de categoría en la imagen */}
                        <div style={{
                          position: "absolute",
                          top: "1rem",
                          left: "1rem",
                          backgroundColor: "#0f2161",
                          color: "white",
                          padding: "0.5rem 1rem",
                          borderRadius: "20px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}>
                          <CategoryIcon category={category} /> {category.nombreCategoria}
                        </div>
                        
                        {!categoryCompany.imagenPortada && !categoryCompany.logotipoUrl && (
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
                            {categoryCompany.descripcionEmpresa || "Empresa especializada en soluciones innovadoras"}
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
            Su retroalimentación da forma a nuestra red de confianza y excelencia.
          </p>

          {/* Grid de reseñas */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "2rem",
            marginBottom: "3rem"
          }}>
            {/* Reseña 1 */}
            <div style={{
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
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: "#bcce16", fontSize: "1.2rem" }}>★</span>
                ))}
              </div>
              
              <p style={{
                fontSize: "1rem",
                lineHeight: "1.6",
                color: "#374151",
                marginBottom: "1.5rem",
                fontStyle: "italic"
              }}>
                "Excelente experiencia trabajando con EcoTech Solutions. Su equipo técnico resolvió nuestros problemas de automatización de manera eficiente y profesional. Definitivamente los recomendaría."
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
                  MR
                </div>
                <div>
                  <div style={{
                    fontWeight: "600",
                    color: "#0f2161",
                    fontSize: "0.9rem"
                  }}>
                    María Rodríguez
                  </div>
                  <div style={{
                    color: "#6b7280",
                    fontSize: "0.8rem"
                  }}>
                    Gerente de Operaciones - Industrias del Norte
                  </div>
                </div>
              </div>
            </div>

            {/* Reseña 2 */}
            <div style={{
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
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: "#bcce16", fontSize: "1.2rem" }}>★</span>
                ))}
              </div>
              
              <p style={{
                fontSize: "1rem",
                lineHeight: "1.6",
                color: "#374151",
                marginBottom: "1.5rem",
                fontStyle: "italic"
              }}>
                "La calidad de los productos de MarketPro es excepcional. Hemos trabajado con ellos durante 3 años y siempre superan nuestras expectativas. Su servicio al cliente es de primera clase."
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
                  CL
                </div>
                <div>
                  <div style={{
                    fontWeight: "600",
                    color: "#0f2161",
                    fontSize: "0.9rem"
                  }}>
                    Carlos López
                  </div>
                  <div style={{
                    color: "#6b7280",
                    fontSize: "0.8rem"
                  }}>
                    Director de Compras - Comercial Metropolitana
                  </div>
                </div>
              </div>
            </div>

            {/* Reseña 3 */}
            <div style={{
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
                {[...Array(4)].map((_, i) => (
                  <span key={i} style={{ color: "#bcce16", fontSize: "1.2rem" }}>★</span>
                ))}
                <span style={{ color: "#d1d5db", fontSize: "1.2rem" }}>★</span>
              </div>
              
              <p style={{
                fontSize: "1rem",
                lineHeight: "1.6",
                color: "#374151",
                marginBottom: "1.5rem",
                fontStyle: "italic"
              }}>
                "Muy buena experiencia con TechnoSoft. Sus soluciones de software nos ayudaron a optimizar nuestros procesos internos. El soporte técnico es rápido y efectivo."
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
                  AS
                </div>
                <div>
                  <div style={{
                    fontWeight: "600",
                    color: "#0f2161",
                    fontSize: "0.9rem"
                  }}>
                    Ana Silva
                  </div>
                  <div style={{
                    color: "#6b7280",
                    fontSize: "0.8rem"
                  }}>
                    Coordinadora TI - Servicios Integrales
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            ¿Es Usted un Proveedor de Equipamiento Urbano o Parques?
          </h2>
          
          <p style={{
            fontSize: "1.2rem",
            lineHeight: "1.6",
            marginBottom: "2.5rem",
            color: "#e5e7eb"
          }}>
            Regístrese y conecte con miles de proyectos y clientes potenciales en todo América Latina. 
            Muestre sus soluciones a la audiencia correcta.
          </p>

          <Link href="/login">
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