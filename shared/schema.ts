import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  role: text("role").notNull().default("user"), // "admin" or "user"
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  autoRenewal: boolean("auto_renewal").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nombreCategoria: text("nombre_categoria").notNull(),
  descripcion: text("descripcion"),
  icono: text("icono").default("Tag"), // Lucide icon name
  iconoUrl: text("icono_url"), // Custom icon URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  descripcion: text("descripcion"),
  color: text("color").default("#3B82F6"), // Hex color for visual representation
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipTypes = pgTable("membership_types", {
  id: serial("id").primaryKey(),
  nombrePlan: text("nombre_plan").notNull(),
  descripcionPlan: text("descripcion_plan"),
  opcionesPrecios: jsonb("opciones_precios"), // Array of {periodicidad: string, costo: number}
  beneficios: jsonb("beneficios"), // Array of benefits
  visibilidad: text("visibilidad").notNull().default("publica"), // "publica" o "privada"
  stripePriceId: text("stripe_price_id"), // ID del precio en Stripe
  stripeProductId: text("stripe_product_id"), // ID del producto en Stripe
  cantidadProductosAdmitidos: integer("cantidad_productos_admitidos").default(0), // Cantidad de productos permitidos
  cantidadProyectosAdmitidos: integer("cantidad_proyectos_admitidos").default(0), // Cantidad de proyectos permitidos
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  nombreEmpresa: text("nombre_empresa").notNull(),
  logotipoUrl: text("logotipo_url"),
  telefono1: text("telefono1"),
  telefono2: text("telefono2"),
  email1: text("email1").notNull(),
  email2: text("email2"),
  paisesPresencia: jsonb("paises_presencia"), // Array of strings
  estadosPresencia: jsonb("estados_presencia"), // Array of strings
  ciudadesPresencia: jsonb("ciudades_presencia"), // Array of strings
  ubicacionPrincipal: text("ubicacion_principal"), // Primary city when multiple locations exist
  direccionFisica: text("direccion_fisica"),
  ubicacionGeografica: jsonb("ubicacion_geografica"), // {lat: number, lng: number}
  representantesVentas: jsonb("representantes_ventas"), // Array of user IDs
  descripcionEmpresa: text("descripcion_empresa"),
  galeriaProductosUrls: jsonb("galeria_productos_urls"), // Array of image URLs
  categoriesIds: jsonb("categories_ids"), // Array of category IDs
  redesSociales: jsonb("redes_sociales"), // Object with social media URLs
  catalogoDigitalUrl: text("catalogo_digital_url"),
  videosUrls: jsonb("videos_urls"), // Array of video URLs
  membershipTypeId: integer("membership_type_id").references(() => membershipTypes.id),
  sitioWeb: text("sitio_web"),
  certificateIds: jsonb("certificate_ids"), // Array of certificate IDs
  tagIds: jsonb("tag_ids"), // Array of tag IDs for keywords/search enhancement
  // Campos de información de membresía
  membershipPeriodicidad: text("membership_periodicidad", { enum: ["mensual", "anual"] }),
  formaPago: text("forma_pago"), // "efectivo", "transferencia", "otro"
  fechaInicioMembresia: text("fecha_inicio_membresia"),
  fechaFinMembresia: text("fecha_fin_membresia"),
  notasMembresia: text("notas_membresia"),
  userId: integer("user_id").references(() => users.id), // Owner of the company
  estado: text("estado").notNull().default("activo"), // "activo", "inactivo", "pendiente"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  nombreCertificado: text("nombre_certificado").notNull(),
  imagenUrl: text("imagen_url").notNull(),
  descripcion: text("descripcion"),
  fechaEmision: text("fecha_emision"),
  fechaVencimiento: text("fecha_vencimiento"),
  entidadEmisora: text("entidad_emisora"),
  estado: text("estado").notNull().default("activo"),
  membershipPlanIds: jsonb("membership_plan_ids"), // Array of membership plan IDs that include this certificate by default
  creadoPorAdmin: boolean("creado_por_admin").notNull().default(false), // If true, only visible to admins
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  descripcion: text("descripcion"),
  permisos: jsonb("permisos"), // Array of permissions
  esRolSistema: boolean("es_rol_sistema").notNull().default(false), // Prevents deletion of system roles
  estado: text("estado").notNull().default("activo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const opinions = pgTable("opinions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  userId: integer("user_id").references(() => users.id),
  tipo: text("tipo").notNull().default("empresa"), // empresa, plataforma
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  cargo: text("cargo"), // Position/title for platform testimonials
  calificacion: integer("calificacion").notNull(), // 1-5 estrellas
  comentario: text("comentario").notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
  estado: text("estado").notNull().default("pendiente"), // pendiente, aprobada, rechazada
  fechaAprobacion: timestamp("fecha_aprobacion"),
  aprobadoPor: integer("aprobado_por").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipPayments = pgTable("membership_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  membershipTypeId: integer("membership_type_id").references(() => membershipTypes.id).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("mxn"),
  status: text("status").notNull().default("pending"), // pending, succeeded, failed, canceled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").default("Directorio Industrial").notNull(),
  siteDescription: text("site_description").default("Plataforma de administración web para organizaciones"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").default("#2563eb").notNull(),
  secondaryColor: text("secondary_color").default("#f97316").notNull(),
  accentColor: text("accent_color").default("#10b981").notNull(),
  currency: text("currency").default("USD").notNull(),
  currencySymbol: text("currency_symbol").default("$").notNull(),
  language: text("language").default("es").notNull(),
  timezone: text("timezone").default("America/Mexico_City").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  socialMedia: jsonb("social_media"), // {facebook, twitter, linkedin, instagram}
  seoSettings: jsonb("seo_settings"), // {metaTitle, metaDescription, keywords}
  emailSettings: jsonb("email_settings"), // {smtpHost, smtpPort, smtpUser, fromEmail}
  paymentSettings: jsonb("payment_settings"), // {enableStripe, stripeCurrency}
  maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
  registrationEnabled: boolean("registration_enabled").default(true).notNull(),
  maxFileSize: integer("max_file_size").default(10485760).notNull(), // 10MB in bytes
  allowedFileTypes: jsonb("allowed_file_types").default(['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  nombreProyecto: text("nombre_proyecto").notNull(),
  descripcionProyecto: text("descripcion_proyecto"),
  categoryId: integer("category_id").references(() => categories.id),
  fechaInicio: date("fecha_inicio"),
  fechaFinalizacion: date("fecha_finalizacion"),
  ubicacionPais: text("ubicacion_pais"),
  ubicacionEstado: text("ubicacion_estado"),
  ubicacionCiudad: text("ubicacion_ciudad"),
  clienteContratante: text("cliente_contratante"),
  areaSuperficie: text("area_superficie"),
  serviciosProductos: text("servicios_productos").array(),
  galeriaImagenes: text("galeria_imagenes").array(),
  videoUrl: text("video_url"),
  estado: text("estado").default("borrador"), // borrador, publicado, archivado
  estadoModeracion: text("estado_moderacion").default("pendiente"), // pendiente, aprobado, rechazado
  vistas: integer("vistas").default(0),
  consultas: integer("consultas").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMembershipTypeSchema = createInsertSchema(membershipTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  opcionesPrecios: z.array(z.object({
    periodicidad: z.string(),
    costo: z.number()
  })).optional(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOpinionSchema = createInsertSchema(opinions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  fechaCreacion: true,
  fechaAprobacion: true,
  aprobadoPor: true,
});

export const insertMembershipPaymentSchema = createInsertSchema(membershipPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  categoryId: true,
  fechaInicio: true,
  fechaFinalizacion: true,
  vistas: true,
  consultas: true,
  createdAt: true,
  updatedAt: true,
});



export const integrationSettings = pgTable("integration_settings", {
  id: serial("id").primaryKey(),
  wordpressUrl: text("wordpress_url"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  authMethod: text("auth_method").default("rest"),
  syncEnabled: boolean("sync_enabled").default(false),
  syncFrequency: text("sync_frequency").default("daily"),
  memberPressEnabled: boolean("memberpress_enabled").default(false),
  allowedRoles: text("allowed_roles").array().default([]),
  lastSync: timestamp("last_sync"),
  syncStatus: text("sync_status").default("never"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pdfSettings = pgTable("pdf_settings", {
  id: serial("id").primaryKey(),
  // Branding
  companyName: text("company_name").default("ANPR México").notNull(),
  companySubtitle: text("company_subtitle").default("Asociación Nacional de Profesionales en Relaciones Públicas"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url").default("www.anpr.org.mx"),
  
  // Colors (hex format)
  primaryColor: text("primary_color").default("#bcce16").notNull(), // Header background
  secondaryColor: text("secondary_color").default("#2d3748").notNull(), // Text color
  accentColor: text("accent_color").default("#f7fafc").notNull(), // Background sections
  textColor: text("text_color").default("#000000").notNull(), // Main text
  subtitleColor: text("subtitle_color").default("#505050").notNull(), // Subtitle text
  
  // Layout settings
  headerHeight: integer("header_height").default(30).notNull(),
  fontSize: integer("font_size").default(10).notNull(),
  titleFontSize: integer("title_font_size").default(22).notNull(),
  
  // Content settings
  showLogo: boolean("show_logo").default(true).notNull(),
  showWebsite: boolean("show_website").default(true).notNull(),
  showAddress: boolean("show_address").default(true).notNull(),
  footerText: text("footer_text").default("Este recibo fue generado automáticamente"),
  
  // Contact information
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertIntegrationSettingsSchema = createInsertSchema(integrationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPdfSettingsSchema = createInsertSchema(pdfSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Email configuration and templates tables
export const emailConfiguration = pgTable("email_configuration", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull(),
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  encryption: text("encryption").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(), // Should be encrypted in production
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().unique(), // welcome, renewal, cancellation, notification
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  variables: jsonb("variables"), // Array of variable names
  notificationTiming: jsonb("notification_timing"), // {enabled: boolean, value: number, unit: 'days'|'weeks'|'months'}
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmailConfigurationSchema = createInsertSchema(emailConfiguration).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type MembershipType = typeof membershipTypes.$inferSelect;
export type InsertMembershipType = z.infer<typeof insertMembershipTypeSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Opinion = typeof opinions.$inferSelect;
export type InsertOpinion = z.infer<typeof insertOpinionSchema>;

export type MembershipPayment = typeof membershipPayments.$inferSelect;
export type InsertMembershipPayment = z.infer<typeof insertMembershipPaymentSchema>;

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;



export type IntegrationSettings = typeof integrationSettings.$inferSelect;
export type InsertIntegrationSettings = z.infer<typeof insertIntegrationSettingsSchema>;

export type PdfSettings = typeof pdfSettings.$inferSelect;
export type InsertPdfSettings = z.infer<typeof insertPdfSettingsSchema>;

export type EmailConfiguration = typeof emailConfiguration.$inferSelect;
export type InsertEmailConfiguration = z.infer<typeof insertEmailConfigurationSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companies),
  opinions: many(opinions),
  approvedOpinions: many(opinions, { relationName: "approvedBy" }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  membershipType: one(membershipTypes, {
    fields: [companies.membershipTypeId],
    references: [membershipTypes.id],
  }),
  opinions: many(opinions),
  projects: many(projects),
}));

export const membershipTypesRelations = relations(membershipTypes, ({ many }) => ({
  companies: many(companies),
}));

export const opinionsRelations = relations(opinions, ({ one }) => ({
  company: one(companies, {
    fields: [opinions.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [opinions.userId],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [opinions.aprobadoPor],
    references: [users.id],
    relationName: "approvedBy",
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  company: one(companies, {
    fields: [projects.companyId],
    references: [companies.id],
  }),
  category: one(categories, {
    fields: [projects.categoryId],
    references: [categories.id],
  }),
}));

// Extended types for API responses
export type CompanyWithDetails = Company & {
  categories?: Category[];
  membershipType?: MembershipType;
  user?: User;
  certificates?: Certificate[];
  projects?: ProjectWithDetails[];
  tags?: Tag[];
};

export type ProjectWithDetails = Project & {
  company?: Company;
  category?: Category;
};
