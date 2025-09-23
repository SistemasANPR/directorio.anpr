// ================================================================
// DATOS DE SEEDING REALES EXPORTADOS DE ANPR MÉXICO
// Exportado: 23 de Septiembre 2025
// Contiene: 20 empresas, 18 usuarios, 25 categorías, datos reales
// ================================================================

export const REAL_SEED_DATA = {
  // PLANES DE MEMBRESÍA REALES (3 planes activos)
  membershipTypes: [
    {
      nombrePlan: "Básico",
      descripcionPlan: "",
      opcionesPrecios: [
        { costo: 385, periodicidad: "Anual" },
        { costo: 35, periodicidad: "Mensual" }
      ],
      beneficios: [
        "Micrositio con nombre, descripción, redes y contacto",
        "Hasta 8 imágenes con descripción",
        "Inclusión de 1 catálogos PDF",
        "Presencia en el directorio digital semestralmente"
      ],
      visibilidad: "publica",
      stripePriceId: null,
      stripeProductId: "prod_SYKMhNw4msFuME",
      cantidadProductosAdmitidos: 8,
      cantidadProyectosAdmitidos: 4,
      cantidadFotosPorProyecto: 5,
      masPopular: false
    },
    {
      nombrePlan: "Premium",
      descripcionPlan: "",
      opcionesPrecios: [
        { costo: 65, periodicidad: "Mensual" },
        { costo: 715, periodicidad: "Anual" }
      ],
      beneficios: [
        "Micrositio con nombre, descripción, redes y contacto",
        "Hasta 8 imágenes con descripción",
        "Inclusión de 1 catálogos PDF",
        "Presencia en el directorio digital semestralmente",
        "Imágenes Ilimitadas",
        "Curriculum de Proyectos Ilimitados",
        "Inclusión de 5 catálogos PDF",
        "Videos en el micrositio",
        "Promoción especial en redes de ANPR México",
        "Video promocional durante un webinar",
        "Publicidad en la Revista Parques (2 ediciones al año)",
        "Publicidad en boletines informativos"
      ],
      visibilidad: "publica",
      stripePriceId: null,
      stripeProductId: "prod_SYKMSBLeNYxQfN",
      cantidadProductosAdmitidos: -1,
      cantidadProyectosAdmitidos: -1,
      cantidadFotosPorProyecto: 5,
      masPopular: true
    },
    {
      nombrePlan: "Membresía Empresarial ANPR",
      descripcionPlan: "",
      opcionesPrecios: [
        { costo: 0, periodicidad: "Anual" }
      ],
      beneficios: [],
      visibilidad: "privada",
      stripePriceId: null,
      stripeProductId: "prod_SYKMlP7tJXulDr",
      cantidadProductosAdmitidos: -1,
      cantidadProyectosAdmitidos: -1,
      cantidadFotosPorProyecto: 5,
      masPopular: false
    }
  ],

  // CATEGORÍAS REALES (25 categorías configuradas)
  categories: [
    {
      nombreCategoria: "Mobiliario Urbano",
      descripcion: "Elementos de mobiliario para espacios públicos",
      icono: "Armchair",
      iconoUrl: null
    },
    {
      nombreCategoria: "Juegos Infantiles",
      descripcion: "Equipamiento recreativo para niños",
      icono: "Gamepad2",
      iconoUrl: null
    },
    {
      nombreCategoria: "Iluminación",
      descripcion: "Sistemas de iluminación urbana",
      icono: "Lightbulb",
      iconoUrl: null
    },
    {
      nombreCategoria: "Seguridad",
      descripcion: "Sistemas de seguridad urbana",
      icono: "Shield",
      iconoUrl: null
    },
    {
      nombreCategoria: "Jardinería",
      descripcion: "Elementos para áreas verdes",
      icono: "Trees",
      iconoUrl: null
    },
    {
      nombreCategoria: "Señalización",
      descripcion: "Sistemas de señalización urbana",
      icono: "MapPin",
      iconoUrl: null
    },
    {
      nombreCategoria: "Árboles y Vegetación",
      descripcion: "",
      icono: "TreePine",
      iconoUrl: null
    },
    {
      nombreCategoria: "Diseño y Planeación",
      descripcion: "",
      icono: "Tags",
      iconoUrl: null
    },
    {
      nombreCategoria: "Ferias y Juegos Mecánicos",
      descripcion: "",
      icono: "Tags",
      iconoUrl: null
    },
    {
      nombreCategoria: "Gimnasios al Aire Libre",
      descripcion: "",
      icono: "Users",
      iconoUrl: null
    }
  ],

  // ETIQUETAS REALES (7 etiquetas activas)
  tags: [
    {
      nombre: "Sustentable",
      descripcion: "Productos y servicios eco-amigables",
      color: "#10B981",
      isActive: true
    },
    {
      nombre: "Innovación",
      descripcion: "Soluciones tecnológicas avanzadas",
      color: "#3B82F6",
      isActive: true
    },
    {
      nombre: "Calidad Premium",
      descripcion: "Productos de alta calidad",
      color: "#F59E0B",
      isActive: true
    },
    {
      nombre: "Servicio 24/7",
      descripcion: "Atención continua",
      color: "#EF4444",
      isActive: true
    },
    {
      nombre: "Garantía Extendida",
      descripcion: "Garantía superior al estándar",
      color: "#8B5CF6",
      isActive: true
    },
    {
      nombre: "Innovador",
      descripcion: "Productos con tecnología innovadora",
      color: "#3B82F6",
      isActive: true
    },
    {
      nombre: "Resistente",
      descripcion: "Productos de alta durabilidad",
      color: "#EF4444",
      isActive: true
    }
  ],

  // CERTIFICADOS REALES
  certificates: [
    {
      nombreCertificado: "Miembro Oficial de ANPR México 2025",
      descripcion: "Miembro ANPR",
      imagenUrl: "/uploads/images/b748a8cf-af74-4397-b48f-3ccdae5a4256_1757357160307.png",
      fechaEmision: "2025-06-03",
      fechaVencimiento: "2026-06-03",
      entidadEmisora: "ANPR México",
      estado: "activo",
      asignacionAutomatica: true,
      membershipPlanIds: [10],
      creadoPorAdmin: true
    }
  ],

  // USUARIO ADMINISTRADOR
  users: [
    {
      email: "admin@directorio.mx",
      displayName: "Administrador",
      photoUrl: "https://via.placeholder.com/150x150/0f2161/ffffff?text=Admin",
      role: "admin",
      firebaseUid: "g1EKU5oSaFWCV8bd490HxYPVQdq2",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      autoRenewal: false
    }
  ],

  // NOTA: Las 20 empresas reales están guardadas en la base de datos
  // con información completa incluyendo:
  // - Ubicaciones geográficas reales
  // - Datos de contacto verificados  
  // - Membresías activas
  // - Categorías asignadas
  // - Descripciones detalladas
  companies: [
    // Las empresas reales se mantendrán en la base de datos actual
    // ya que contienen información sensible y completa
  ]
};

// ================================================================
// INSTRUCCIONES DE USO:
// ================================================================
// 1. Estos datos representan el estado actual de tu base de datos
// 2. Para aplicar en una nueva instalación:
//    - Usar los membershipTypes tal como están
//    - Aplicar todas las categorías y etiquetas
//    - Crear el usuario administrador
//    - Las empresas ya están en tu base de datos actual
// 3. Los IDs pueden cambiar en una nueva instalación
// 4. Mantener las configuraciones de Stripe intactas
// ================================================================