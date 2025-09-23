// 🌱 DATOS DE SEEDING AUTOMÁTICO PARA ANPR MÉXICO
// Este archivo contiene todos los datos necesarios para poblar la aplicación publicada

export const SEED_DATA = {
  // PLANES DE MEMBRESÍA
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

  // CATEGORÍAS
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
      nombreCategoria: "Pavimentación",
      descripcion: "Materiales y sistemas de pavimentación",
      icono: "Square",
      iconoUrl: null
    },
    {
      nombreCategoria: "Estructuras",
      descripcion: "Estructuras urbanas y arquitectónicas",
      icono: "Building",
      iconoUrl: null
    },
    {
      nombreCategoria: "Diseño y Planeación",
      descripcion: "Servicios de diseño urbano",
      icono: "Tags",
      iconoUrl: null
    },
    {
      nombreCategoria: "Tecnología",
      descripcion: "Tecnología y sistemas digitales",
      icono: "Settings",
      iconoUrl: null
    }
  ],

  // USUARIOS EJEMPLO
  users: [
    {
      firebaseUid: "admin_anpr_mexico",
      email: "admin@anpr.org.mx",
      displayName: "Administrador ANPR",
      photoURL: null,
      role: "admin",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      autoRenewal: false
    },
    {
      firebaseUid: "pending_1758232475849_gabo43211@gmail.com",
      email: "gabo43211@gmail.com",
      displayName: "Gabriel Andrade",
      photoURL: null,
      role: "representante",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      autoRenewal: false
    }
  ],

  // EMPRESAS EJEMPLO
  companies: [
    {
      nombreEmpresa: "Productos Jumbo S.A. de C.V.",
      logotipoUrl: null,
      fotoPortadaUrl: null,
      telefono1: "+52 777 012 3456",
      telefono2: "",
      email1: "cynthia.flores@productosjumbo.com",
      email2: "",
      direccionFisica: "Periférico Ecológico Núm. 13. Col. San Lorenzo Almecatla. C.P. 72710, Cuautlancingo, Puebla, Puebla",
      ubicacionGeografica: {
        lat: 19.0414398,
        lng: -98.2838989
      },
      representantesVentas: [],
      descripcionEmpresa: '<p>Empresa líder en la distribución de productos industriales y equipamiento urbano. Ofrecemos soluciones integrales para proyectos de infraestructura y desarrollo urbano.</p>',
      galeriaProductosUrls: [],
      categoriesIds: [1, 2, 3],
      redesSociales: [],
      catalogoDigitalUrl: null,
      videosUrls: [],
      membershipTypeId: 8,
      sitioWeb: "https://www.productosjumbo.com",
      certificateIds: [],
      tagIds: null,
      membershipPeriodicidad: "anual",
      formaPago: "efectivo",
      fechaInicioMembresia: "2025-06-03",
      fechaFinMembresia: "2026-06-03",
      notasMembresia: "",
      userId: null,
      estado: "activo"
    },
    {
      nombreEmpresa: "ANPR México",
      logotipoUrl: null,
      fotoPortadaUrl: null,
      telefono1: "+52 777 012 3456",
      telefono2: "",
      email1: "soporte@anpr.org.mx",
      email2: "",
      direccionFisica: "CALLE 16 POR 5 Y 18 #100 FRACCIONAMIENTO MONTECRISTO, 97133 Mérida, Yuc.",
      ubicacionGeografica: {
        lat: 20.9673,
        lng: -89.5926
      },
      representantesVentas: [],
      descripcionEmpresa: '<p>Asociación Nacional de Parques y Recreación de México. Organización líder en el desarrollo de espacios recreativos y equipamiento urbano en México.</p>',
      galeriaProductosUrls: [],
      categoriesIds: [9],
      redesSociales: [],
      catalogoDigitalUrl: "",
      videosUrls: [],
      membershipTypeId: 8,
      sitioWeb: "https://anpr.org.mx/",
      certificateIds: [],
      tagIds: null,
      membershipPeriodicidad: "anual",
      formaPago: "otro",
      fechaInicioMembresia: "2025-06-03",
      fechaFinMembresia: "2026-06-03",
      notasMembresia: "",
      userId: null,
      estado: "activo"
    },
    {
      nombreEmpresa: "Grupo Gabrielito",
      logotipoUrl: "",
      fotoPortadaUrl: "",
      telefono1: "+529999697458",
      telefono2: "",
      email1: "manuel@bugy.mx",
      email2: "",
      direccionFisica: "Calle 33, Seyé, Yucatán, México",
      ubicacionGeografica: {
        lat: 20.7833,
        lng: -89.4167
      },
      representantesVentas: "",
      descripcionEmpresa: "Empresa dedicada al desarrollo de soluciones urbanas integrales",
      galeriaProductosUrls: [],
      categoriesIds: [10],
      redesSociales: [],
      catalogoDigitalUrl: "",
      videosUrls: [],
      membershipTypeId: 9,
      sitioWeb: "",
      certificateIds: [],
      tagIds: [],
      membershipPeriodicidad: "anual",
      formaPago: "tarjeta",
      fechaInicioMembresia: "2025-09-18",
      fechaFinMembresia: "2026-09-18",
      notasMembresia: "",
      userId: 2,
      estado: "activo"
    }
  ],

  // ETIQUETAS
  tags: [
    {
      nombre: "Sustentable",
      descripcion: "Productos ecológicos y sustentables",
      color: "#22C55E",
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

  // CERTIFICADOS
  certificates: [
    {
      nombreCertificado: "ISO 9001",
      descripcion: "Certificación de calidad internacional",
      imagenUrl: "/uploads/images/default-certificate.png",
      fechaEmision: "2024-01-01",
      fechaVencimiento: "2027-01-01",
      entidadEmisora: "ISO International",
      estado: "activo",
      asignacionAutomatica: false,
      membershipPlanIds: [8, 9, 11],
      creadoPorAdmin: true
    },
    {
      nombreCertificado: "Certificado ANPR",
      descripcion: "Certificación oficial de ANPR México",
      imagenUrl: "/uploads/images/default-certificate.png",
      fechaEmision: "2024-01-01",
      fechaVencimiento: "2025-12-31",
      entidadEmisora: "ANPR México",
      estado: "activo",
      asignacionAutomatica: true,
      membershipPlanIds: [9, 11],
      creadoPorAdmin: true
    }
  ]
};