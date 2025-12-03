import { mysqlTable, text, int, boolean, timestamp, decimal, json, varchar, date, double } from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  firebaseUid: varchar("firebase_uid", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }),
  photoURL: text("photo_url"),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  tempPassword: varchar("temp_password", { length: 255 }),
  requirePasswordChange: boolean("require_password_change").notNull().default(false),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  autoRenewal: boolean("auto_renewal").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  nombreCategoria: varchar("nombre_categoria", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  icono: varchar("icono", { length: 100 }).default("Tag"),
  iconoUrl: text("icono_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tags = mysqlTable("tags", {
  id: int("id").primaryKey().autoincrement(),
  nombre: varchar("nombre", { length: 255 }).notNull().unique(),
  descripcion: text("descripcion"),
  color: varchar("color", { length: 20 }).default("#3B82F6"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipTypes = mysqlTable("membership_types", {
  id: int("id").primaryKey().autoincrement(),
  nombrePlan: varchar("nombre_plan", { length: 255 }).notNull(),
  descripcionPlan: text("descripcion_plan"),
  opcionesPrecios: json("opciones_precios"),
  beneficios: json("beneficios"),
  visibilidad: varchar("visibilidad", { length: 50 }).notNull().default("publica"),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  stripeProductId: varchar("stripe_product_id", { length: 255 }),
  cantidadProductosAdmitidos: int("cantidad_productos_admitidos").default(0),
  cantidadProyectosAdmitidos: int("cantidad_proyectos_admitidos").default(0),
  cantidadFotosPorProyecto: int("cantidad_fotos_por_proyecto").default(5),
  masPopular: boolean("mas_popular").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companies = mysqlTable("companies", {
  id: int("id").primaryKey().autoincrement(),
  nombreEmpresa: varchar("nombre_empresa", { length: 255 }).notNull(),
  logotipoUrl: text("logotipo_url"),
  fotoPortadaUrl: text("foto_portada_url"),
  telefono1: varchar("telefono1", { length: 50 }),
  telefono2: varchar("telefono2", { length: 50 }),
  email1: varchar("email1", { length: 255 }).notNull(),
  email2: varchar("email2", { length: 255 }),
  direccionFisica: text("direccion_fisica").notNull(),
  ubicacionGeografica: json("ubicacion_geografica"),
  representantesVentas: json("representantes_ventas"),
  descripcionEmpresa: text("descripcion_empresa"),
  galeriaProductosUrls: json("galeria_productos_urls"),
  categoriesIds: json("categories_ids"),
  redesSociales: json("redes_sociales"),
  catalogoDigitalUrl: text("catalogo_digital_url"),
  videosUrls: json("videos_urls"),
  membershipTypeId: int("membership_type_id").references(() => membershipTypes.id),
  sitioWeb: varchar("sitio_web", { length: 500 }),
  certificateIds: json("certificate_ids"),
  tagIds: json("tag_ids"),
  membershipPeriodicidad: varchar("membership_periodicidad", { length: 20 }),
  formaPago: varchar("forma_pago", { length: 50 }),
  fechaInicioMembresia: varchar("fecha_inicio_membresia", { length: 20 }),
  fechaFinMembresia: varchar("fecha_fin_membresia", { length: 20 }),
  notasMembresia: text("notas_membresia"),
  userId: int("user_id").references(() => users.id),
  estado: varchar("estado", { length: 50 }).notNull().default("activo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const certificates = mysqlTable("certificates", {
  id: int("id").primaryKey().autoincrement(),
  nombreCertificado: varchar("nombre_certificado", { length: 255 }).notNull(),
  imagenUrl: text("imagen_url").notNull(),
  descripcion: text("descripcion"),
  fechaEmision: varchar("fecha_emision", { length: 20 }),
  fechaVencimiento: varchar("fecha_vencimiento", { length: 20 }),
  entidadEmisora: varchar("entidad_emisora", { length: 255 }),
  estado: varchar("estado", { length: 50 }).notNull().default("activo"),
  asignacionAutomatica: boolean("asignacion_automatica").notNull().default(false),
  membershipPlanIds: json("membership_plan_ids"),
  creadoPorAdmin: boolean("creado_por_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roles = mysqlTable("roles", {
  id: int("id").primaryKey().autoincrement(),
  nombre: varchar("nombre", { length: 255 }).notNull().unique(),
  descripcion: text("descripcion"),
  permisos: json("permisos"),
  esRolSistema: boolean("es_rol_sistema").notNull().default(false),
  estado: varchar("estado", { length: 50 }).notNull().default("activo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const opinions = mysqlTable("opinions", {
  id: int("id").primaryKey().autoincrement(),
  companyId: int("company_id").references(() => companies.id),
  userId: int("user_id").references(() => users.id),
  tipo: varchar("tipo", { length: 50 }).notNull().default("empresa"),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  cargo: varchar("cargo", { length: 255 }),
  calificacion: int("calificacion").notNull(),
  comentario: text("comentario").notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
  estado: varchar("estado", { length: 50 }).notNull().default("pendiente"),
  fechaAprobacion: timestamp("fecha_aprobacion"),
  aprobadoPor: int("aprobado_por").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipPayments = mysqlTable("membership_payments", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id).notNull(),
  companyId: int("company_id").references(() => companies.id).notNull(),
  membershipTypeId: int("membership_type_id").references(() => membershipTypes.id).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("mxn"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const systemSettings = mysqlTable("system_settings", {
  id: int("id").primaryKey().autoincrement(),
  siteName: varchar("site_name", { length: 255 }).default("Directorio Industrial").notNull(),
  siteDescription: text("site_description"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: varchar("primary_color", { length: 20 }).default("#2563eb").notNull(),
  secondaryColor: varchar("secondary_color", { length: 20 }).default("#f97316").notNull(),
  accentColor: varchar("accent_color", { length: 20 }).default("#10b981").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  currencySymbol: varchar("currency_symbol", { length: 10 }).default("$").notNull(),
  language: varchar("language", { length: 10 }).default("es").notNull(),
  timezone: varchar("timezone", { length: 100 }).default("America/Mexico_City").notNull(),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
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
  id: int("id").primaryKey().autoincrement(),
  companyId: int("company_id").references(() => companies.id).notNull(),
  nombreProyecto: varchar("nombre_proyecto", { length: 255 }).notNull(),
  descripcionProyecto: text("descripcion_proyecto"),
  categoryId: int("category_id").references(() => categories.id),
  fechaInicio: date("fecha_inicio"),
  fechaFinalizacion: date("fecha_finalizacion"),
  ubicacionPais: varchar("ubicacion_pais", { length: 100 }),
  ubicacionEstado: varchar("ubicacion_estado", { length: 100 }),
  ubicacionCiudad: varchar("ubicacion_ciudad", { length: 100 }),
  clienteContratante: varchar("cliente_contratante", { length: 255 }),
  areaSuperficie: varchar("area_superficie", { length: 100 }),
  serviciosProductos: json("servicios_productos"),
  galeriaImagenes: json("galeria_imagenes"),
  videoUrl: text("video_url"),
  estado: varchar("estado", { length: 50 }).default("borrador"),
  estadoModeracion: varchar("estado_moderacion", { length: 50 }).default("pendiente"),
  vistas: int("vistas").default(0),
  consultas: int("consultas").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companyLocations = mysqlTable("company_locations", {
  id: int("id").primaryKey().autoincrement(),
  companyId: int("company_id").references(() => companies.id).notNull(),
  lat: double("lat").notNull(),
  lng: double("lng").notNull(),
  address: text("address").notNull(),
  country: varchar("country", { length: 100 }),
  state: varchar("state", { length: 100 }),
  city: varchar("city", { length: 100 }),
  isPrincipal: boolean("is_principal").notNull().default(false),
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

export type InsertCompanyLocation = z.infer<typeof insertCompanyLocationSchema>;
export type SelectCompanyLocation = typeof companyLocations.$inferSelect;

export const integrationSettings = mysqlTable("integration_settings", {
  id: int("id").primaryKey().autoincrement(),
  wordpressUrl: text("wordpress_url"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  authMethod: varchar("auth_method", { length: 50 }).default("rest"),
  syncEnabled: boolean("sync_enabled").default(false),
  syncFrequency: varchar("sync_frequency", { length: 50 }).default("daily"),
  memberPressEnabled: boolean("memberpress_enabled").default(false),
  allowedRoles: json("allowed_roles"),
  lastSync: timestamp("last_sync"),
  syncStatus: varchar("sync_status", { length: 50 }).default("never"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pdfSettings = mysqlTable("pdf_settings", {
  id: int("id").primaryKey().autoincrement(),
  companyName: varchar("company_name", { length: 255 }).default("ANPR México").notNull(),
  companySubtitle: text("company_subtitle"),
  logoUrl: text("logo_url"),
  websiteUrl: varchar("website_url", { length: 255 }).default("www.anpr.org.mx"),
  primaryColor: varchar("primary_color", { length: 20 }).default("#bcce16").notNull(),
  secondaryColor: varchar("secondary_color", { length: 20 }).default("#2d3748").notNull(),
  accentColor: varchar("accent_color", { length: 20 }).default("#f7fafc").notNull(),
  textColor: varchar("text_color", { length: 20 }).default("#000000").notNull(),
  subtitleColor: varchar("subtitle_color", { length: 20 }).default("#505050").notNull(),
  headerHeight: int("header_height").default(30).notNull(),
  fontSize: int("font_size").default(10).notNull(),
  titleFontSize: int("title_font_size").default(22).notNull(),
  showLogo: boolean("show_logo").default(true).notNull(),
  showWebsite: boolean("show_website").default(true).notNull(),
  showAddress: boolean("show_address").default(true).notNull(),
  footerText: text("footer_text"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
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

export const emailConfiguration = mysqlTable("email_configuration", {
  id: int("id").primaryKey().autoincrement(),
  provider: varchar("provider", { length: 100 }).notNull(),
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  fromName: varchar("from_name", { length: 255 }).notNull(),
  smtpHost: varchar("smtp_host", { length: 255 }).notNull(),
  smtpPort: int("smtp_port").notNull(),
  encryption: varchar("encryption", { length: 50 }).notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  testEmail: varchar("test_email", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").primaryKey().autoincrement(),
  type: varchar("type", { length: 100 }).notNull().unique(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlContent: text("html_content").notNull(),
  variables: json("variables"),
  notificationTiming: json("notification_timing"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

// Stripe Configuration Schema
export const stripeConfigurationTable = mysqlTable("stripe_configuration", {
  id: int("id").primaryKey().autoincrement(),
  publicKey: text("public_key").notNull(),
  secretKey: text("secret_key").notNull(),
  webhookSecret: text("webhook_secret"),
  environment: varchar("environment", { length: 20 }).notNull().default("test"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StripeConfiguration = typeof stripeConfigurationTable.$inferSelect;
export type InsertStripeConfiguration = typeof stripeConfigurationTable.$inferInsert;

// Frontend Visual Configuration Schema
export const frontendConfigurationTable = mysqlTable("frontend_configuration", {
  id: int("id").primaryKey().autoincrement(),
  headerBackgroundColor: varchar("header_background_color", { length: 20 }).default("#ffffff"),
  headerBackgroundImage: text("header_background_image"),
  headerTextColor: varchar("header_text_color", { length: 20 }).default("#000000"),
  logoUrl: text("logo_url"),
  logoAltText: varchar("logo_alt_text", { length: 255 }).default("Logo"),
  siteName: varchar("site_name", { length: 255 }).default("Directorio de Proveedores"),
  siteSlogan: text("site_slogan"),
  menuItems: json("menu_items"),
  menuStyle: varchar("menu_style", { length: 50 }).default("horizontal"),
  menuBackgroundColor: varchar("menu_background_color", { length: 20 }).default("#ffffff"),
  menuTextColor: varchar("menu_text_color", { length: 20 }).default("#000000"),
  menuHoverColor: varchar("menu_hover_color", { length: 20 }).default("#3B82F6"),
  showLoginButton: boolean("show_login_button").default(true),
  showRegisterButton: boolean("show_register_button").default(true),
  footerBackgroundColor: varchar("footer_background_color", { length: 20 }).default("#1e3a8a"),
  footerTextColor: varchar("footer_text_color", { length: 20 }).default("#ffffff"),
  footerBackgroundImage: text("footer_background_image"),
  showFooterLogo: boolean("show_footer_logo").default(true),
  companyName: varchar("company_name", { length: 255 }).default("ANPR México"),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactAddress: text("contact_address"),
  contactHours: varchar("contact_hours", { length: 255 }),
  socialMediaConfig: json("social_media_config"),
  footerSections: json("footer_sections"),
  copyrightText: varchar("copyright_text", { length: 255 }).default("© 2025 Todos los derechos reservados"),
  privacyPolicyUrl: varchar("privacy_policy_url", { length: 500 }).default("/privacy"),
  termsOfServiceUrl: varchar("terms_of_service_url", { length: 500 }).default("/terms"),
  primaryColor: varchar("primary_color", { length: 20 }).default("#3B82F6"),
  secondaryColor: varchar("secondary_color", { length: 20 }).default("#10B981"),
  accentColor: varchar("accent_color", { length: 20 }).default("#F59E0B"),
  fontFamily: varchar("font_family", { length: 100 }).default("Inter"),
  borderRadius: varchar("border_radius", { length: 20 }).default("8px"),
  customCss: text("custom_css"),
  customHead: text("custom_head"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FrontendConfiguration = typeof frontendConfigurationTable.$inferSelect;
export type InsertFrontendConfiguration = typeof frontendConfigurationTable.$inferInsert;

// Menu Items Schema for validation
export const menuItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
  icon: z.string().optional(),
  isVisible: z.boolean().default(true),
  order: z.number().default(0),
  isExternal: z.boolean().default(false),
});

// Social Media Schema for validation
export const socialMediaSchema = z.object({
  id: z.string(),
  platform: z.string(),
  url: z.string(),
  icon: z.string(),
  isVisible: z.boolean().default(true),
  order: z.number().default(0),
});

// Footer Section Schema for validation
export const footerSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().optional(),
  links: z.array(z.object({
    label: z.string(),
    url: z.string(),
    isExternal: z.boolean().default(false),
  })).optional(),
  isVisible: z.boolean().default(true),
  order: z.number().default(0),
});

export const insertFrontendConfigurationSchema = createInsertSchema(frontendConfigurationTable);
export type InsertFrontendConfigurationType = z.infer<typeof insertFrontendConfigurationSchema>;
