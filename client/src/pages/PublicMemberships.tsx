import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap, ShoppingCart } from "lucide-react";
import type { MembershipType } from "@/../../shared/schema";
import headerDirectorioImage from "@assets/header_directorio.png";
import fondoHeaderDirectorioImage from "@assets/fondo_header_directorio.png";


export default function PublicMemberships() {
  const [, setLocation] = useLocation();

  // Auto-scroll to membership plans section if hash is present
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#planes') {
      // Wait for content to load
      const timer = setTimeout(() => {
        const plansSection = document.getElementById('membership-plans');
        if (plansSection) {
          plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);
  
  const { data: memberships, isLoading } = useQuery({
    queryKey: ["/api/membership-types/public"],
    queryFn: async () => {
      const response = await fetch("/api/membership-types/public");
      if (!response.ok) throw new Error("Failed to fetch memberships");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando membresías...</p>
          </div>
        </div>
      </div>
    );
  }

  const getIcon = (index: number) => {
    const icons = [Star, Zap, Crown];
    const Icon = icons[index % icons.length];
    return Icon;
  };

  const getColorScheme = (index: number) => {
    const schemes = [
      { bg: "bg-blue-600", border: "border-blue-200", accent: "text-blue-600" },
      { bg: "bg-green-600", border: "border-green-200", accent: "text-green-600" },
      { bg: "bg-purple-600", border: "border-purple-200", accent: "text-purple-600" },
    ];
    return schemes[index % schemes.length];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ¿Quién puede formar parte? - Nueva sección */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Grid de categorías */}
            <div className="order-1 lg:order-1 flex justify-center items-start">
              <img 
                src="/attached_assets/categorias.png"
                alt="Categorías del directorio"
                className="w-full max-w-sm h-auto"
              />
            </div>
            
            {/* Contenido del texto */}
            <div className="order-2 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                ¿Quién puede formar parte?
              </h2>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                El Directorio está abierto a empresas de América Latina que ofrecen soluciones especializadas con sus productos o servicios para parques, espacios públicos y entornos urbanos.
              </p>
              
              <div className="grid grid-cols-2 gap-3 text-gray-700">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Juegos infantiles</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Mobiliario urbano</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Superficies deportivas</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Señalética y accesibilidad</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Tecnología de riego y landscaping</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Iluminación y energía limpia</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Mantenimiento de áreas verdes y manejo de residuos</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Seguridad, movilidad eléctrica y accesos automatizados</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Diseño, construcción y servicios para parques</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Uniformes, productos promocionales</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>y más...</span>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 italic font-medium">
                  Si tu empresa contribuye a mejorar la calidad, funcionalidad o sostenibilidad de los espacios públicos, este directorio es para ti.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Línea divisoria */}
      <div className="flex justify-center py-8">
        <div className="border-t border-gray-300 w-3/5"></div>
      </div>

      {/* ¿Por qué unirte al Directorio? - Nueva sección */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="hero-title text-3xl md:text-4xl text-gray-800 mb-12 text-center">
            ¿Por qué unirte al Directorio de Proveedores de Equipamiento Urbano?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Primera columna */}
            <div className="space-y-8">
              {/* Tu marca donde importa */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img 
                    src="/attached_assets/Rectangle 10.png"
                    alt="Tu marca donde importa"
                    className="w-12 h-12"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Tu marca donde importa:</h3>
                  <p className="text-gray-600">Llega a quienes toman decisiones reales.</p>
                </div>
              </div>

              {/* Presencia que convierte */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img 
                    src="/attached_assets/Rectangle 11.png"
                    alt="Presencia que convierte"
                    className="w-12 h-12"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Presencia que convierte:</h3>
                  <p className="text-gray-600">Transforma tu visibilidad digital en oportunidades de negocio.</p>
                </div>
              </div>

              {/* Visibilidad regional */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img 
                    src="/attached_assets/Rectangle 12.png"
                    alt="Visibilidad regional"
                    className="w-12 h-12"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Visibilidad regional:</h3>
                  <p className="text-gray-600">Desde México hasta Argentina, haz que te vean.</p>
                </div>
              </div>
            </div>

            {/* Segunda columna */}
            <div className="space-y-8">
              {/* Aparición en buscadores */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img 
                    src="/attached_assets/Rectangle 13.png"
                    alt="Aparición en buscadores"
                    className="w-12 h-12"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Aparición en buscadores:</h3>
                  <p className="text-gray-600">Aprovecha el SEO de tu micrositio especializado.</p>
                </div>
              </div>

              {/* Promoción cruzada */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img 
                    src="/attached_assets/Rectangle 14.png"
                    alt="Promoción cruzada"
                    className="w-12 h-12"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Promoción cruzada:</h3>
                  <p className="text-gray-600">Posible presencia en eventos, webinars y medios aliados.</p>
                </div>
              </div>

              {/* Atención personalizada */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img 
                    src="/attached_assets/Rectangle 15.png"
                    alt="Atención personalizada"
                    className="w-12 h-12"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Atención personalizada:</h3>
                  <p className="text-gray-600">Asesoría cercana para maximizar tu impacto.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Planes de Membresía */}
      <div id="membership-plans" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center mb-12">
          <h2 className="hero-title text-3xl text-gray-700 mb-4">
            Elige tu plan
          </h2>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Elige el plan que mejor se adapte a las necesidades de tu empresa. 
            Todos nuestros planes incluyen beneficios exclusivos para hacer crecer tu negocio.
          </p>
        </div>
      </div>

      {/* Memberships Section */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {memberships && memberships.length > 0 ? (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
              {memberships.map((membership: any, index: number) => {
                const Icon = getIcon(index);
                const colorScheme = getColorScheme(index);
                
                return (
                <Card key={membership.id} className={`relative hover:shadow-xl transition-all duration-300 border-2 ${colorScheme.border} group hover:-translate-y-2 flex flex-col h-full`}>
                  {/* Popular Badge based on database field */}
                  {(membership as any).masPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-600 text-white px-4 py-1">
                        Más Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 ${colorScheme.bg} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {membership.nombrePlan}
                    </CardTitle>
                    <div className="mt-4">
                      {membership.opcionesPrecios && Array.isArray(membership.opcionesPrecios) && membership.opcionesPrecios.length > 0 ? (
                        <div className="space-y-2">
                          {(membership.opcionesPrecios as any[])
                            .sort((a: any, b: any) => {
                              // Ordenar: anual primero, mensual después
                              if (a.periodicidad.toLowerCase() === 'anual') return -1;
                              if (b.periodicidad.toLowerCase() === 'anual') return 1;
                              return 0;
                            })
                            .map((opcion: any, idx: number) => (
                            <div key={idx} className="flex items-baseline justify-center gap-1">
                              <span className={`text-3xl font-bold ${colorScheme.accent}`}>
                                ${opcion.costo}
                              </span>
                              <span className="text-gray-600 text-sm">
                                {opcion.periodicidad.toLowerCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-600">
                          Contactar para precio
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 flex-1 flex flex-col">
                    {membership.descripcionPlan && (
                      <p className="text-gray-600 text-center mb-6">
                        {membership.descripcionPlan}
                      </p>
                    )}
                    
                    <div className="flex-1">
                      {/* Límites del Plan */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Crown className="h-4 w-4 mr-2" />
                          Límites del Plan
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Productos:</span>
                            <span className="font-medium text-gray-900">
                              {((membership as any).cantidadProductosAdmitidos === -1 || (membership as any).cantidadProductosAdmitidos === null) ? 'Ilimitado' : ((membership as any).cantidadProductosAdmitidos ?? 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Proyectos:</span>
                            <span className="font-medium text-gray-900">
                              {((membership as any).cantidadProyectosAdmitidos === -1 || (membership as any).cantidadProyectosAdmitidos === null) ? 'Ilimitado' : ((membership as any).cantidadProyectosAdmitidos ?? 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Fotos por proyecto:</span>
                            <span className="font-medium text-gray-900">
                              {((membership as any).cantidadFotosPorProyecto === -1 || (membership as any).cantidadFotosPorProyecto === null) ? 'Ilimitado' : ((membership as any).cantidadFotosPorProyecto ?? 5)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {membership.beneficios && (
                        <div className="space-y-3 mb-8">
                          <h4 className="font-semibold text-gray-900 mb-3">Beneficios Incluidos</h4>
                          {(typeof membership.beneficios === 'string' 
                            ? membership.beneficios.split('\n').filter((b: string) => b.trim())
                            : Array.isArray(membership.beneficios) 
                              ? membership.beneficios 
                              : []
                          ).map((beneficio: string, idx: number) => (
                            <div key={idx} className="flex items-start">
                              <Check className={`h-5 w-5 ${colorScheme.accent} mr-3 flex-shrink-0 mt-0.5`} />
                              <span className="text-gray-700 text-sm leading-relaxed">{beneficio.trim()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-auto">
                      <Button 
                        className={`w-full ${colorScheme.bg} hover:opacity-90 text-white font-semibold py-3`}
                        onClick={() => setLocation(`/registro-y-pago?plan=${membership.id}`)}
                      >
                        Elegir Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay planes disponibles
              </h3>
              <p className="text-gray-600">
                Actualmente no hay planes de membresía disponibles. 
                Por favor, contacta con nosotros para más información.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Call to Action Final - Full Width */}
      <div style={{ background: 'linear-gradient(135deg, #0f2161 0%, #1a2f7a 100%)' }} className="w-full py-16 text-white mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="hero-title text-3xl md:text-4xl mb-6">
            ¡Súmate hoy al directorio más grande de América Latina!
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed" style={{ color: '#e5e7eb' }}>
            No dejes pasar la oportunidad de gozar de una herramienta que impulsa la calidad, 
            la innovación y las alianzas en el sector del espacio público. 
            Conecta, crece y transforma junto a la ANPR México.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              className="text-white font-semibold px-8 py-4 text-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#bcce16' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#a8b814';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#bcce16';
              }}
              onClick={() => {
                const membershipPlansSection = document.getElementById('membership-plans');
                if (membershipPlansSection) {
                  membershipPlansSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                  const planesSection = document.getElementById('planes-section');
                  if (planesSection) {
                    planesSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
            >
              Registrarse Ahora
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-white font-semibold px-8 py-4 text-lg transition-colors rounded-lg"
              style={{ 
                borderColor: '#ffffff',
                borderWidth: '2px',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#1e3a8a';
                e.currentTarget.style.borderColor = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#ffffff';
              }}
              onClick={() => {
                window.location.href = 'mailto:vinculacion@anpr.org.mx';
              }}
            >
              Solicitar Información
            </Button>
          </div>
          
          <div className="border-t pt-8 mt-8" style={{ borderColor: '#ffffff40' }}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6" style={{ color: '#e5e7eb' }}>
              <div className="flex items-center gap-2">
                <span>📩</span>
                <a href="mailto:conexion@anpr.org.mx" className="hover:text-white transition-colors">
                  conexion@anpr.org.mx
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span>🔗</span>
                <a href="https://anpr.org.mx" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  anpr.org.mx
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span>📱</span>
                <span>@anprmexico</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}