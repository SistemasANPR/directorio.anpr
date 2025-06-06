import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Video, FileText, Award, Star, MessageSquare, Calculator, Building, Grid3x3, Facebook, Linkedin, Twitter, Instagram, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CompanyLocationMap from "@/components/CompanyLocationMap";
import ReviewModal from "@/components/ReviewModal";
import QuotationModal from "@/components/QuotationModal";
import type { CompanyWithDetails } from "@/../../shared/schema";

export default function CompanyDetails() {
  const { id } = useParams();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: company, isLoading } = useQuery({
    queryKey: ["/api/companies", id],
    queryFn: async () => {
      const response = await fetch(`/api/companies/${id}`);
      if (!response.ok) throw new Error("Company not found");
      return response.json();
    },
  });

  // Query para certificados
  const { data: certificates = [] } = useQuery({
    queryKey: ["/api/certificates"],
  });

  // Query para empresas relacionadas
  const { data: relatedCompanies = [] } = useQuery({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies?limit=4");
      if (!response.ok) throw new Error("Failed to fetch companies");
      const data = await response.json();
      return data.companies.filter((c: any) => c.id !== parseInt(id || "0"));
    },
  });



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de la empresa...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Empresa no encontrada</h1>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }



  const telefonos = [company.telefono1, company.telefono2].filter(Boolean);
  const emails = [company.email1, company.email2].filter(Boolean);
  const galeria = company.galeriaProductosUrls || [];
  const videos = company.videosUrls || [];
  const representantes = company.representantesVentas || [];
  const redesSociales = company.redesSociales || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al directorio
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden text-white">
        {/* Fondo con imagen de producto */}
        <div className="absolute inset-0">
          {company.galeriaProductosUrls && company.galeriaProductosUrls.length > 0 ? (
            <img
              src={company.galeriaProductosUrls[0]}
              alt={`Producto de ${company.nombreEmpresa}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-700"></div>
          )}
        </div>
        
        {/* Overlay azul marino transparente */}
        <div className="absolute inset-0 bg-slate-900/70"></div>
        
        {/* Contenido del header */}
        <div className="relative max-w-5xl mx-auto px-4 py-16">
          <div className="text-center">
            {/* Logo de la empresa como primer elemento */}
            <div className="flex justify-center mb-8">
              {company.logotipoUrl ? (
                <img
                  src={company.logotipoUrl}
                  alt={company.nombreEmpresa}
                  className="w-44 h-44 object-contain bg-white/10 rounded-full p-5 backdrop-blur-sm"
                />
              ) : (
                <div className="w-44 h-44 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-7xl font-bold">
                    {company.nombreEmpresa.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Nombre de la empresa */}
            <h1 className="text-4xl font-bold mb-8 drop-shadow-lg text-white" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white' }}>{company.nombreEmpresa}</h1>







            {/* Iconos de contacto */}
            <div className="flex items-center justify-center gap-6">
              {emails[0] && (
                <a 
                  href={`mailto:${emails[0]}`} 
                  className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-full hover:bg-white/20 transition-colors group"
                  title={`Enviar email a ${emails[0]}`}
                >
                  <Mail className="h-6 w-6 text-blue-200 group-hover:text-white" />
                </a>
              )}
              {telefonos[0] && (
                <a 
                  href={`tel:${telefonos[0]}`} 
                  className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-full hover:bg-white/20 transition-colors group"
                  title={`Llamar a ${telefonos[0]}`}
                >
                  <Phone className="h-6 w-6 text-green-200 group-hover:text-white" />
                </a>
              )}
              {company.sitioWeb && (
                <a 
                  href={company.sitioWeb} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-full hover:bg-white/20 transition-colors group"
                  title="Visitar sitio web"
                >
                  <Globe className="h-6 w-6 text-purple-200 group-hover:text-white" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Descripción Detallada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Acerca de la Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: company.descripcionEmpresa || 'No hay descripción disponible.' }}
                />
              </CardContent>
            </Card>

            {/* Galería de Productos - Tipo Masonry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Grid3x3 className="h-5 w-5 mr-2" />
                  Galería de Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {galeria.length > 0 ? (
                  <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                    {galeria.map((imagen, index) => (
                      <div key={index} className="break-inside-avoid">
                        <img
                          src={imagen}
                          alt={`${company.nombreEmpresa} - Producto ${index + 1}`}
                          className="w-full rounded-lg hover:scale-105 transition-transform cursor-pointer shadow-md"
                          style={{ aspectRatio: 'auto' }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Grid3x3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Galería de productos próximamente disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Videos */}
            {videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="h-5 w-5 mr-2" />
                    Videos Corporativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {videos.map((videoUrl, index) => (
                      <div key={index} className="aspect-video">
                        <iframe
                          src={videoUrl}
                          className="w-full h-full rounded-lg"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certificados y Reconocimientos */}
            {company.certificates && company.certificates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Certificados y Reconocimientos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {company.certificates.map((certificate: any) => (
                      <div key={certificate.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        {/* Header con imagen e icono */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 flex-shrink-0">
                            <img
                              src={certificate.imagenUrl}
                              alt={certificate.nombreCertificado}
                              className="w-12 h-12 object-cover rounded-full"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                              {certificate.nombreCertificado}
                            </h4>
                          </div>
                        </div>
                        
                        {/* Información en formato lista */}
                        <div className="space-y-3 text-sm">
                          {certificate.fechaVencimiento && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Válido hasta</span>
                              <span className="text-gray-900 font-medium">
                                {certificate.fechaVencimiento}
                              </span>
                            </div>
                          )}
                          
                          {certificate.entidadEmisora && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Emitido por</span>
                              <span className="text-gray-900 font-medium text-right">
                                {certificate.entidadEmisora}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reseñas de Clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Lo que dicen nuestros clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Reseñas de ejemplo */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-2">"Excelente servicio y calidad en todos sus productos. Muy recomendados."</p>
                    <p className="text-sm text-gray-500">- Cliente Satisfecho</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-2">"Profesionalismo y compromiso en cada proyecto. Muy satisfecho con los resultados."</p>
                    <p className="text-sm text-gray-500">- Empresa Asociada</p>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setReviewModalOpen(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Dejar una reseña
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CTA - Solicitar Cotización */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <CardContent className="p-8 text-center">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-blue-200" />
                <h3 className="text-2xl font-bold mb-4 text-white" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white' }}>¿Interesado en nuestros servicios?</h3>
                <p className="text-blue-100 mb-6 text-lg">
                  Obtén una cotización personalizada para tu proyecto. Nuestro equipo está listo para ayudarte.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                    onClick={() => setQuotationModalOpen(true)}
                  >
                    <Calculator className="h-5 w-5 mr-2" />
                    Solicitar Cotización
                  </Button>
                  {company.telefono1 && (
                    <Button 
                      size="lg" 
                      asChild
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold border-0"
                    >
                      <a href={`tel:${company.telefono1}`}>
                        <Phone className="h-5 w-5 mr-2" />
                        Llamar Ahora
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Representantes de Ventas */}
            {representantes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Equipo de Ventas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {representantes.map((rep, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        {typeof rep === 'object' && rep.telefono ? (
                          <div>
                            <h4 className="font-semibold">Representante {index + 1}</h4>
                            <p className="text-gray-600">{rep.telefono}</p>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-semibold">Representante {index + 1}</h4>
                            <p className="text-gray-600">{String(rep)}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Información de Contacto */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Teléfonos */}
                {telefonos.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Teléfonos
                    </h4>
                    {telefonos.map((telefono, index) => (
                      <p key={index} className="text-gray-600">{telefono}</p>
                    ))}
                  </div>
                )}

                {/* Emails */}
                {emails.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Correos Electrónicos
                    </h4>
                    {emails.map((email, index) => (
                      <p key={index} className="text-gray-600">{email}</p>
                    ))}
                  </div>
                )}

                {/* Sitio Web */}
                {company.sitioWeb && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      Sitio Web
                    </h4>
                    <a
                      href={company.sitioWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {company.sitioWeb}
                    </a>
                  </div>
                )}

                <Separator />

                {/* Redes Sociales */}
                {company.redesSociales && company.redesSociales.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Redes Sociales</h4>
                    <div className="space-y-3">
                      {company.redesSociales.map((red: any, index: number) => (
                        <a
                          key={index}
                          href={red.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-gray-600 hover:text-blue-600 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mr-3 transition-colors">
                            {red.plataforma === 'Facebook' && <Facebook className="h-4 w-4" />}
                            {red.plataforma === 'LinkedIn' && <Linkedin className="h-4 w-4" />}
                            {red.plataforma === 'Twitter' && <Twitter className="h-4 w-4" />}
                            {red.plataforma === 'Instagram' && <Instagram className="h-4 w-4" />}
                            {!['Facebook', 'LinkedIn', 'Twitter', 'Instagram'].includes(red.plataforma) && 
                              <Globe className="h-4 w-4" />
                            }
                          </div>
                          <span className="font-medium">{red.plataforma}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dirección del Mapa */}
            {company.ubicacionGeografica?.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Ubicación del Mapa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{company.ubicacionGeografica.address}</p>
                    {company.ubicacionGeografica.lat && company.ubicacionGeografica.lng && (
                      <p className="text-xs text-gray-500 mt-1">
                        Coordenadas: {company.ubicacionGeografica.lat.toFixed(6)}, {company.ubicacionGeografica.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dirección */}
            {company.direccionFisica && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Dirección o Descripción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{company.direccionFisica}</p>
                  </div>
                </CardContent>
              </Card>
            )}



            {/* Catálogo Digital */}
            {company.catalogoDigitalUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Catálogo Digital</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={company.catalogoDigitalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Catálogo
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}


          </div>
        </div>

        {/* Sección del Mapa - Nuestra Ubicación */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Nuestra Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {company.direccionFisica ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 font-medium">{company.direccionFisica}</p>
                    {company.ciudad && company.estado && (
                      <p className="text-gray-600 text-sm mt-1">
                        {company.ciudad}, {company.estado}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500">Dirección o descripción no disponible</p>
                    {company.ciudad && company.estado && (
                      <p className="text-gray-600 text-sm mt-1">
                        {company.ciudad}, {company.estado}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Mapa */}
                <CompanyLocationMap 
                  ubicacionGeografica={company.ubicacionGeografica}
                  direccionFisica={company.direccionFisica}
                  nombreEmpresa={company.nombreEmpresa}
                  ciudadesPresencia={company.ciudadesPresencia}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Empresas Relacionadas */}
        {relatedCompanies.length > 0 && (
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Empresas Relacionadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Botones de navegación */}
                  {relatedCompanies.length > 3 && (
                    <>
                      <button
                        onClick={() => {
                          const slider = document.getElementById('related-companies-slider');
                          if (slider) slider.scrollBy({ left: -300, behavior: 'smooth' });
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        style={{ marginLeft: '-20px' }}
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => {
                          const slider = document.getElementById('related-companies-slider');
                          if (slider) slider.scrollBy({ left: 300, behavior: 'smooth' });
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        style={{ marginRight: '-20px' }}
                      >
                        ›
                      </button>
                    </>
                  )}

                  {/* Slider de empresas */}
                  <div
                    id="related-companies-slider"
                    className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    {relatedCompanies.map((relatedCompany: any) => (
                      <div
                        key={relatedCompany.id}
                        className="group cursor-pointer flex-shrink-0"
                        onClick={() => window.location.href = `/empresa/${relatedCompany.id}`}
                      >
                        <div
                          className="w-64 h-64 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                        >
                          <div className="h-3/4 relative overflow-hidden rounded-t-xl">
                            {relatedCompany.logotipoUrl ? (
                              <img
                                src={relatedCompany.logotipoUrl}
                                alt={relatedCompany.nombreEmpresa}
                                className="w-full h-full object-contain bg-gradient-to-br from-gray-50 to-gray-100 p-4"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-4xl font-bold text-white">
                                  {relatedCompany.nombreEmpresa.charAt(0)}
                                </span>
                              </div>
                            )}
                            
                            {/* Overlay con información adicional */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Button 
                                  size="sm" 
                                  className="bg-white text-blue-600 hover:bg-blue-50"
                                >
                                  Ver Empresa
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="h-1/4 p-4 flex flex-col justify-center">
                            <h4 className="font-bold text-gray-800 text-center group-hover:text-blue-600 transition-colors truncate">
                              {relatedCompany.nombreEmpresa}
                            </h4>
                            {relatedCompany.ciudad && (
                              <p className="text-sm text-gray-500 text-center mt-1 flex items-center justify-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {relatedCompany.ciudad}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Reseñas */}
      <ReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        companyId={parseInt(id || "0")}
        companyName={company?.nombreEmpresa || ""}
      />

      <QuotationModal
        open={quotationModalOpen}
        onOpenChange={setQuotationModalOpen}
        companyEmail={company?.email1 || ""}
        companyName={company?.nombreEmpresa || ""}
      />
    </div>
  );
}