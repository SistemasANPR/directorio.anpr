import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap, ShoppingCart } from "lucide-react";
import type { MembershipType } from "@/../../shared/schema";
import headerDirectorioImage from "@assets/header_directorio.png";
import fondoHeaderDirectorioImage from "@assets/fondo_header_directorio.png";
import Footer from "@/components/Footer";

export default function PublicMemberships() {
  const [, setLocation] = useLocation();
  
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
      {/* Hero Section */}
      <div 
        className="relative min-h-[500px] bg-cover bg-center bg-no-repeat flex items-center"
        style={{
          backgroundImage: `url(${fondoHeaderDirectorioImage})`,
          backgroundPosition: 'center center',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white">
          <img 
            src={headerDirectorioImage}
            alt="Directorio de la Industria del Equipamiento Urbano"
            className="mx-auto mb-8 max-w-2xl w-full h-auto"
          />
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Planes de Membresía
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Únete al directorio más completo de América Latina y potencia tu negocio con nuestros planes exclusivos
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Membership Plans */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Elige el Plan Perfecto para tu Empresa
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada plan está diseñado para diferentes necesidades empresariales. 
              Selecciona el que mejor se adapte a tu empresa y comienza a crecer.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {memberships?.map((membership: MembershipType, index: number) => {
              const Icon = getIcon(index);
              const colorScheme = getColorScheme(index);
              
              let prices: Array<{ periodicidad: string; costo: number }> = [];
              try {
                if (membership.opcionesPrecios) {
                  if (typeof membership.opcionesPrecios === 'string') {
                    prices = JSON.parse(membership.opcionesPrecios);
                  } else if (Array.isArray(membership.opcionesPrecios)) {
                    prices = membership.opcionesPrecios;
                  }
                }
              } catch (error) {
                console.error('Error parsing prices:', error);
              }

              let benefits: string[] = [];
              try {
                if (membership.beneficios) {
                  if (typeof membership.beneficios === 'string') {
                    benefits = membership.beneficios.split('\n').filter(b => b.trim());
                  } else if (Array.isArray(membership.beneficios)) {
                    benefits = membership.beneficios;
                  }
                }
              } catch (error) {
                console.error('Error parsing benefits:', error);
              }

              return (
                <Card key={membership.id} className={`relative border-2 ${colorScheme.border} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`inline-flex items-center justify-center w-16 h-16 ${colorScheme.bg} text-white rounded-full mb-4 mx-auto`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">{membership.nombrePlan}</CardTitle>
                    {membership.descripcionPlan && (
                      <p className="text-gray-600 mt-2">{membership.descripcionPlan}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Pricing */}
                    <div className="text-center mb-6">
                      {prices.length > 0 ? (
                        <div className="space-y-2">
                          {prices.map((priceOption, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 capitalize">{priceOption.periodicidad}:</span>
                              <span className={`text-2xl font-bold ${colorScheme.accent}`}>
                                ${priceOption.costo?.toLocaleString('es-MX')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-lg text-gray-600">Precio por consultar</span>
                      )}
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3 mb-8">
                      <h4 className="font-semibold text-gray-900 text-center mb-4">Beneficios incluidos:</h4>
                      {benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                          <span className="text-gray-700 text-sm leading-relaxed">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button 
                      className={`w-full ${colorScheme.bg} hover:opacity-90 text-white font-semibold py-3 text-lg transition-all duration-300`}
                      onClick={() => setLocation('/register')}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Seleccionar Plan
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Divisor line */}
        <div className="flex justify-center mb-16">
          <div className="w-[70%] h-px bg-gray-300"></div>
        </div>

        {/* ¿Cómo funciona? Section */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                ¿Cómo funciona?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Elige tu plan</h3>
                    <p className="text-gray-600">Selecciona el plan de membresía que mejor se adapte a las necesidades de tu empresa.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Completa tu registro</h3>
                    <p className="text-gray-600">Proporciona la información de tu empresa y completa el proceso de registro.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-4">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Comienza a beneficiarte</h3>
                    <p className="text-gray-600">Una vez aprobada tu membresía, tendrás acceso a todos los beneficios de tu plan.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <img 
                src="/attached_assets/que_es_el_directorio.png" 
                alt="¿Cómo funciona el directorio?"
                className="w-full max-w-md h-auto mx-auto"
              />
            </div>
          </div>
        </div>

        {/* Divisor line */}
        <div className="flex justify-center mb-16">
          <div className="w-[70%] h-px bg-gray-300"></div>
        </div>

        {/* Bonos y promociones exclusivas */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 text-center">
              <img 
                src="/attached_assets/paso 1.png" 
                alt="Bonos y promociones exclusivas"
                className="w-full max-w-md h-auto mx-auto"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Bonos y promociones exclusivas
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Como miembro del directorio, tendrás acceso a beneficios exclusivos, descuentos especiales 
                en eventos, capacitaciones y servicios adicionales que te ayudarán a hacer crecer tu negocio.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Descuentos en eventos y conferencias de la industria
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Acceso prioritario a nuevos productos y servicios
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Capacitaciones especializadas sin costo adicional
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Networking exclusivo con líderes de la industria
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divisor line */}
        <div className="flex justify-center mb-16">
          <div className="w-[70%] h-px bg-gray-300"></div>
        </div>

        {/* Red de contactos Section */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Amplía tu red de contactos
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Conecta con empresas líderes del sector, encuentra nuevos socios comerciales 
                y expande tu alcance en el mercado del equipamiento urbano.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Directorio completo de empresas del sector
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Eventos de networking y ferias comerciales
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Plataforma de comunicación entre miembros
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Oportunidades de colaboración y alianzas
                </li>
              </ul>
            </div>
            <div className="text-center">
              <img 
                src="/attached_assets/paso 2.png" 
                alt="Red de contactos"
                className="w-full max-w-md h-auto"
              />
            </div>
          </div>
        </div>

        {/* Divisor line */}
        <div className="flex justify-center mb-16">
          <div className="w-[70%] h-px bg-gray-300"></div>
        </div>

        {/* Soporte y atención personalizada */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 text-center">
              <img 
                src="/attached_assets/paso 3.png" 
                alt="Soporte y atención personalizada"
                className="w-full max-w-md h-auto"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Soporte y atención personalizada
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Nuestro equipo de expertos está disponible para brindarte el soporte que necesitas 
                para maximizar los beneficios de tu membresía y hacer crecer tu negocio.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Asesoría especializada para tu industria
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Soporte técnico 24/7
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Consultoría en marketing digital
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Gestión de perfil empresarial optimizada
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Full width CTA section */}
      <div className="mt-16" style={{ background: 'linear-gradient(135deg, #0f2161 0%, #1a2f7a 100%)' }}>
        <div className="w-full py-16 text-white">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¡Súmate hoy al directorio más grande de América Latina!
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed" style={{ color: '#e5e7eb' }}>
              No dejes pasar la oportunidad de gozar de una herramienta que impulsa la calidad, 
              la innovación y las alianzas en el sector del espacio público. 
              Conecta, crece y transforma junto a la ANPR México.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 text-lg">
                Registrarse Ahora
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white font-semibold px-8 py-4 text-lg transition-colors"
                style={{ borderColor: '#ffffff' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.color = '#0f2161';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ffffff';
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
}