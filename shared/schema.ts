import { mysqlTable, text, int, boolean, timestamp, decimal, json, varchar, date, double } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  firebaseUid: text("firebase_uid").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  role: text("role").notNull().default("user"),
  tempPassword: text("temp_password"),
  requirePasswordChange: boolean("require_password_change").notNull().default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  autoRenewal: boolean("auto_renewal").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  nombreCategoria: text("nombre_categoria").notNull(),
  descripcion: text("descripcion"),
  icono: text("icono").default("Tag"),
  iconoUrl: text("icono_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  color: text("color").default("#3B82F6"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipTypes = mysqlTable("membership_types", {
  id: int("id").autoincrement().primaryKey(),
  nombrePlan: text("nombre_plan").notNull(),
  descripcionPlan: text("descripcion_plan"),
  opcionesPrecios: json("opciones_precios"),
  beneficios: json("beneficios"),
  visibilidad: text("visibilidad").notNull().default("publica"),
  stripePriceId: text("stripe_price_id"),
  stripeProductId: text("stripe_product_id"),
  cantidadProductosAdmitidos: int("cantidad_productos_admitidos").default(0),
  cantidadProyectosAdmitidos: int("cantidad_proyectos_admitidos").default(0),
  cantidadFotosPorProyecto: int("cantidad_fotos_por_proyecto").default(5),
  masPopular: boolean("mas_popular").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  nombreEmpresa: text("nombre_empresa").notNull(),
  logotipoUrl: text("logotipo_url"),
  fotoPortadaUrl: text("foto_portada_url"),
  telefono1: text("telefono1"),
  telefono2: text("telefono2"),
  email1: text("email1").notNull(),
  email2: text("email2"),
  direccionFisica: text("direccion_fisica").notNull(),
  ubicacionGeografica: json("ubicacion_geografica"),
  representantesVentas: json("representantes_ventas"),
  descripcionEmpresa: text("descripcion_empresa"),
  galeriaProductosUrls: json("galeria_productos_urls"),
  categoriesIds: json("categories_ids"),
  redesSociales: json("redes_sociales"),
  catalogoDigitalUrl: text("catalogo_digital_url"),
  videosUrls: json("videos_urls"),
  membershipTypeId: int("membership_type_id"),
  sitioWeb: text("sitio_web"),
  certificateIds: json("certificate_ids"),
  tagIds: json("tag_ids"),
  membershipPeriodicidad: text("membership_periodicidad"),
  formaPago: text("forma_pago"),
  fechaInicioMembresia: text("fecha_inicio_membresia"),
  fechaFinMembresia: text("fecha_fin_membresia"),
  notasMembresia: text("notas_membresia"),
  userId: int("user_id"),
  estado: text("estado").notNull().default("activo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  nombreCertificado: text("nombre_certificado").notNull(),
  imagenUrl: text("imagen_url").notNull(),
  descripcion: text("descripcion"),
  fechaEmision: text("fecha_emision"),
  fechaVencimiento: text("fecha_vencimiento"),
  entidadEmisora: text("entidad_emisora"),
  estado: text("estado").notNull().default("activo"),
  asignacionAutomatica: boolean("asignacion_automatica").notNull().default(false),
  membershipPlanIds: json("membership_plan_ids"),
  creadoPorAdmin: boolean("creado_por_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  permisos: json("permisos"),
  esRolSistema: boolean("es_rol_sistema").notNull().default(false),
  estado: text("estado").notNull().default("activo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const opinions = mysqlTable("opinions", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("company_id"),
  userId: int("user_id"),
  tipo: text("tipo").notNull().default("empresa"),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  cargo: text("cargo"),
  calificacion: int("calificacion").notNull(),
  comentario: text("comentario").notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
  estado: text("estado").notNull().default("pendiente"),
  fechaAprobacion: timestamp("fecha_aprobacion"),
  aprobadoPor: int("aprobado_por"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipPayments = mysqlTable("membership_payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  companyId: int("company_id").notNull(),
  membershipTypeId: int("membership_type_id").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  siteName: text("site_name").default("Directorio Industrial").notNull(),
  siteDescription: text("site_description"),
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
  socialMedia: json("social_media"),
  seoSettings: json("seo_settings"),
  emailSettings: json("email_settings"),
  notificationEmails: json("notification_emails"),
  paymentSettings: json("payment_settings"),
  maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
  registrationEnabled: boolean("registration_enabled").default(true).notNull(),
  maxFileSize: int("max_file_size").default(10485760).notNull(),
  allowedFileTypes: json("allowed_file_types"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("company_id").notNull(),
  nombreProyecto: text("nombre_proyecto").notNull(),
  descripcionProyecto: text("descripcion_proyecto"),
  categoryId: int("category_id"),
  fechaInicio: text("fecha_inicio"),
  fechaFinalizacion: text("fecha_finalizacion"),
  ubicacionPais: text("ubicacion_pais"),
  ubicacionEstado: text("ubicacion_estado"),
  ubicacionCiudad: text("ubicacion_ciudad"),
  clienteContratante: text("cliente_contratante"),
  areaSuperficie: text("area_superficie"),
  serviciosProductos: json("servicios_productos"),
  galeriaImagenes: json("galeria_imagenes"),
  videoUrl: text("video_url"),
  estado: text("estado").default("borrador"),
  estadoModeracion: text("estado_moderacion").default("pendiente"),
  vistas: int("vistas").default(0),
  consultas: int("consultas").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companyLocations = mysqlTable("company_locations", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("company_id").notNull(),
  lat: double("lat").notNull(),
  lng: double("lng").notNull(),
  address: text("address").notNull(),
  country: text("country"),
  state: text("state"),
  city: text("city"),
  isPrincipal: boolean("is_principal").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const integrationSettings = mysqlTable("integration_settings", {
  id: int("id").autoincrement().primaryKey(),
  wordpressUrl: text("wordpress_url"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  authMethod: text("auth_method").default("rest"),
  syncEnabled: boolean("sync_enabled").default(false),
  syncFrequency: text("sync_frequency").default("daily"),
  memberPressEnabled: boolean("memberpress_enabled").default(false),
  allowedRoles: json("allowed_roles"),
  lastSync: timestamp("last_sync"),
  syncStatus: text("sync_status").default("never"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pdfSettings = mysqlTable("pdf_settings", {
  id: int("id").autoincrement().primaryKey(),
  companyName: text("company_name").default("ANPR México").notNull(),
  companySubtitle: text("company_subtitle"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url").default("www.anpr.org.mx"),
  primaryColor: text("primary_color").default("#bcce16").notNull(),
  secondaryColor: text("secondary_color").default("#2d3748").notNull(),
  accentColor: text("accent_color").default("#f7fafc").notNull(),
  textColor: text("text_color").default("#000000").notNull(),
  subtitleColor: text("subtitle_color").default("#505050").notNull(),
  headerHeight: int("header_height").default(30).notNull(),
  fontSize: int("font_size").default(10).notNull(),
  titleFontSize: int("title_font_size").default(22).notNull(),
  showLogo: boolean("show_logo").default(true).notNull(),
  showWebsite: boolean("show_website").default(true).notNull(),
  showAddress: boolean("show_address").default(true).notNull(),
  footerText: text("footer_text"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailConfiguration = mysqlTable("email_configuration", {
  id: int("id").autoincrement().primaryKey(),
  provider: text("provider").notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name").notNull(),
  smtpHost: text("smtp_host").notNull(),
  smtpPort: int("smtp_port").notNull(),
  encryption: text("encryption").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  testEmail: text("test_email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  variables: json("variables"),
  notificationTiming: json("notification_timing"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stripeConfigurationTable = mysqlTable("stripe_configuration", {
  id: int("id").autoincrement().primaryKey(),
  publicKey: text("public_key").notNull(),
  secretKey: text("secret_key").notNull(),
  webhookSecret: text("webhook_secret"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const frontendConfigurationTable = mysqlTable("frontend_configuration", {
  id: int("id").autoincrement().primaryKey(),
  headerBackgroundColor: text("header_background_color").default("#ffffff"),
  headerBackgroundImage: text("header_background_image"),
  headerTextColor: text("header_text_color").default("#000000"),
  logoUrl: text("logo_url"),
  logoAltText: text("logo_alt_text").default("Logo"),
  siteTitle: text("site_title").default("ANPR México"),
  menuItems: json("menu_items"),
  menuTextColor: text("menu_text_color").default("#000000"),
  menuHoverColor: text("menu_hover_color").default("#3b82f6"),
  footerBackgroundColor: text("footer_background_color").default("#1f2937"),
  footerTextColor: text("footer_text_color").default("#ffffff"),
  footerLogoUrl: text("footer_logo_url"),
  footerDescription: text("footer_description"),
  footerQuickLinks: json("footer_quick_links"),
  footerContactInfo: json("footer_contact_info"),
  footerSocialLinks: json("footer_social_links"),
  footerCopyright: text("footer_copyright"),
  customCss: text("custom_css"),
  homeBannerImage: text("home_banner_image"),
  homeBannerTitle: text("home_banner_title"),
  homeBannerSubtitle: text("home_banner_subtitle"),
  homeHighlightedCompanyIds: json("home_highlighted_company_ids"),
  homeTestimonialsEnabled: boolean("home_testimonials_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  cantidadProductosAdmitidos: z.number().nullable().optional(),
  cantidadProyectosAdmitidos: z.number().nullable().optional(),
  cantidadFotosPorProyecto: z.number().nullable().optional(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  direccionFisica: z.string().min(10, "La dirección física debe tener al menos 10 caracteres"),
  membershipPeriodicidad: z.enum(["mensual", "anual"]).nullable().optional().or(z.literal("")),
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const certificateFormSchema = insertCertificateSchema.extend({
  imagenUrl: z.string().optional(),
  descripcion: z.string().optional(),
  fechaEmision: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  entidadEmisora: z.string().optional(),
  estado: z.string().default("activo"),
  asignacionAutomatica: z.boolean().default(false),
  planesMembresia: z.array(z.string()).default([]),
  creadoPorAdmin: z.boolean().default(true),
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

export const insertCompanyLocationSchema = createInsertSchema(companyLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertEmailConfigurationSchema = createInsertSchema(emailConfiguration).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  smtpPort: z.coerce.number().min(1).max(65535),
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
export type CertificateFormData = z.infer<typeof certificateFormSchema>;

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

export type InsertCompanyLocation = z.infer<typeof insertCompanyLocationSchema>;
export type SelectCompanyLocation = typeof companyLocations.$inferSelect;

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
