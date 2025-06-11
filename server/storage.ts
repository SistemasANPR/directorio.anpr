import { 
  users, 
  companies, 
  categories, 
  membershipTypes, 
  certificates,
  roles,
  opinions,
  membershipPayments,
  systemSettings,
  projects,
  homeConfiguration,
  homeHighlights,
  homeBanners,
  type User, 
  type Company, 
  type Category, 
  type MembershipType, 
  type Certificate,
  type Role,
  type Opinion,
  type Project,
  type HomeConfiguration,
  type HomeHighlights,
  type HomeBanners,
  type InsertUser,
  type InsertCompany,
  type InsertCategory,
  type InsertMembershipType,
  type InsertCertificate,
  type InsertRole,
  type InsertOpinion,
  type InsertProject,
  type InsertHomeConfiguration,
  type InsertHomeHighlights,
  type InsertHomeBanners,
  type MembershipPayment,
  type InsertMembershipPayment,
  type SystemSettings,
  type InsertSystemSettings,
  type CompanyWithDetails,
  type ProjectWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, like, sql, and, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Companies
  getCompany(id: number): Promise<CompanyWithDetails | undefined>;
  getAllCompanies(options?: {
    search?: string;
    categoryId?: number;
    membershipTypeId?: number;
    estado?: string;
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
  }): Promise<{ companies: CompanyWithDetails[]; total: number }>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;
  getCompaniesByUser(userId: number): Promise<CompanyWithDetails[]>;

  // Categories
  getCategory(id: number): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Membership Types
  getMembershipType(id: number): Promise<MembershipType | undefined>;
  getAllMembershipTypes(): Promise<MembershipType[]>;
  createMembershipType(membershipType: InsertMembershipType): Promise<MembershipType>;
  updateMembershipType(id: number, membershipType: Partial<InsertMembershipType>): Promise<MembershipType | undefined>;
  deleteMembershipType(id: number): Promise<boolean>;

  // Certificates
  getCertificate(id: number): Promise<Certificate | undefined>;
  getAllCertificates(): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(id: number, certificate: Partial<InsertCertificate>): Promise<Certificate | undefined>;
  deleteCertificate(id: number): Promise<boolean>;

  // Roles
  getRole(id: number): Promise<Role | undefined>;
  getAllRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;

  // Opinions
  getOpinion(id: number): Promise<Opinion | undefined>;
  getAllOpinions(options?: {
    estado?: string;
    companyId?: number;
    tipo?: string;
    userId?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ opinions: Opinion[]; total: number }>;
  createOpinion(opinion: InsertOpinion): Promise<Opinion>;
  updateOpinion(id: number, opinion: Partial<InsertOpinion>): Promise<Opinion | undefined>;
  deleteOpinion(id: number): Promise<boolean>;
  approveOpinion(id: number, approvedBy: number): Promise<Opinion | undefined>;
  rejectOpinion(id: number, approvedBy: number): Promise<Opinion | undefined>;

  // Statistics
  getStatistics(): Promise<{
    totalCompanies: number;
    activeUsers: number;
    newRegistrations: number;
    totalRevenue: number;
  }>;

  // Membership Payments
  createMembershipPayment(payment: InsertMembershipPayment): Promise<MembershipPayment>;
  getMembershipPayment(id: number): Promise<MembershipPayment | undefined>;
  getMembershipPaymentByStripeId(stripePaymentIntentId: string): Promise<MembershipPayment | undefined>;
  updateMembershipPaymentStatus(id: number, status: string): Promise<MembershipPayment | undefined>;
  getUserPayments(userId: number): Promise<MembershipPayment[]>;
  updateUserStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined>;

  // System Settings
  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(settings: Partial<InsertSystemSettings>): Promise<SystemSettings>;

  // Projects
  getProject(id: number): Promise<ProjectWithDetails | undefined>;
  getAllProjects(options?: {
    companyId?: number;
    categoryId?: number;
    estado?: string;
    estadoModeracion?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ projects: ProjectWithDetails[]; total: number }>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  getProjectsByCompany(companyId: number): Promise<ProjectWithDetails[]>;
  incrementProjectViews(id: number): Promise<void>;
  incrementProjectConsultas(id: number): Promise<void>;
  moderateProject(id: number, estado: string): Promise<Project | undefined>;

  // Home Configuration
  getHomeConfiguration(seccion?: string): Promise<HomeConfiguration[]>;
  getHomeConfigurationBySection(seccion: string): Promise<HomeConfiguration | undefined>;
  createHomeConfiguration(config: InsertHomeConfiguration): Promise<HomeConfiguration>;
  updateHomeConfiguration(id: number, config: Partial<InsertHomeConfiguration>): Promise<HomeConfiguration | undefined>;
  deleteHomeConfiguration(id: number): Promise<boolean>;

  // Home Highlights
  getAllHomeHighlights(): Promise<HomeHighlights[]>;
  getHomeHighlight(id: number): Promise<HomeHighlights | undefined>;
  createHomeHighlight(highlight: InsertHomeHighlights): Promise<HomeHighlights>;
  updateHomeHighlight(id: number, highlight: Partial<InsertHomeHighlights>): Promise<HomeHighlights | undefined>;
  deleteHomeHighlight(id: number): Promise<boolean>;

  // Home Banners
  getAllHomeBanners(): Promise<HomeBanners[]>;
  getHomeBanner(id: number): Promise<HomeBanners | undefined>;
  createHomeBanner(banner: InsertHomeBanners): Promise<HomeBanners>;
  updateHomeBanner(id: number, banner: Partial<InsertHomeBanners>): Promise<HomeBanners | undefined>;
  deleteHomeBanner(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Companies
  async getCompany(id: number): Promise<CompanyWithDetails | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    if (!company) return undefined;

    // Get related data
    const [membershipType] = company.membershipTypeId 
      ? await db.select().from(membershipTypes).where(eq(membershipTypes.id, company.membershipTypeId))
      : [undefined];

    const [user] = company.userId 
      ? await db.select().from(users).where(eq(users.id, company.userId))
      : [undefined];

    // Get categories and certificates from JSON arrays
    const companyCategoriesIds = (company.categoriesIds as number[]) || [];
    const companyCertificateIds = (company.certificateIds as number[]) || [];

    // Get categories and certificates - simplified approach
    let companyCategories = [];
    let companyCertificates = [];
    
    if (companyCategoriesIds.length > 0) {
      for (const catId of companyCategoriesIds) {
        const [category] = await db.select().from(categories).where(eq(categories.id, catId));
        if (category) companyCategories.push(category);
      }
    }
    
    if (companyCertificateIds.length > 0) {
      for (const certId of companyCertificateIds) {
        const [certificate] = await db.select().from(certificates).where(eq(certificates.id, certId));
        if (certificate) companyCertificates.push(certificate);
      }
    }

    return {
      ...company,
      membershipType: membershipType || undefined,
      user: user || undefined,
      categories: companyCategories,
      certificates: companyCertificates
    };
  }

  async getAllCompanies(options: {
    search?: string;
    categoryId?: number;
    membershipTypeId?: number;
    estado?: string;
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
  } = {}): Promise<{ companies: CompanyWithDetails[]; total: number }> {
    const { search, categoryId, membershipTypeId, estado, limit = 10, offset = 0, includeInactive = false } = options;
    
    // Primero actualizar automáticamente las empresas con membresías vencidas
    const today = new Date().toISOString().split('T')[0];
    await db
      .update(companies)
      .set({ estado: 'inactivo' })
      .where(
        and(
          eq(companies.estado, 'activo'),
          sql`${companies.fechaFinMembresia} < ${today}`
        )
      );
    
    let whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          like(companies.nombreEmpresa, `%${search}%`),
          like(companies.descripcionEmpresa, `%${search}%`)
        )
      );
    }

    if (membershipTypeId) {
      whereConditions.push(eq(companies.membershipTypeId, membershipTypeId));
    }

    if (estado) {
      whereConditions.push(eq(companies.estado, estado));
    }

    // Por defecto, solo mostrar empresas activas en el frontend público
    // Si no se especifica un estado y no se incluyen inactivas, mostrar solo activas
    if (!estado && !includeInactive) {
      whereConditions.push(eq(companies.estado, 'activo'));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [companiesResult, countResult] = await Promise.all([
      db.select().from(companies).where(whereClause).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(companies).where(whereClause)
    ]);

    // Enrich with related data
    const enrichedCompanies = await Promise.all(
      companiesResult.map(async (company) => {
        const [membershipType] = company.membershipTypeId 
          ? await db.select().from(membershipTypes).where(eq(membershipTypes.id, company.membershipTypeId))
          : [undefined];

        const [user] = company.userId 
          ? await db.select().from(users).where(eq(users.id, company.userId))
          : [undefined];

        const companyCategoriesIds = (company.categoriesIds as number[]) || [];
        const companyCertificateIds = (company.certificateIds as number[]) || [];

        // Get categories and certificates
        let companyCategories = [];
        let companyCertificates = [];
        
        if (companyCategoriesIds.length > 0) {
          for (const catId of companyCategoriesIds) {
            const [category] = await db.select().from(categories).where(eq(categories.id, catId));
            if (category) companyCategories.push(category);
          }
        }
        
        if (companyCertificateIds.length > 0) {
          for (const certId of companyCertificateIds) {
            const [certificate] = await db.select().from(certificates).where(eq(certificates.id, certId));
            if (certificate) companyCertificates.push(certificate);
          }
        }

        return {
          ...company,
          membershipType: membershipType || undefined,
          user: user || undefined,
          categories: companyCategories,
          certificates: companyCertificates
        };
      })
    );

    return {
      companies: enrichedCompanies,
      total: countResult[0]?.count || 0
    };
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  async updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db.update(companies).set(companyData).where(eq(companies.id, id)).returning();
    return company || undefined;
  }

  async deleteCompany(id: number): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getCompaniesByUser(userId: number): Promise<CompanyWithDetails[]> {
    const userCompanies = await db.select().from(companies).where(eq(companies.userId, userId));
    
    const enrichedCompanies = await Promise.all(
      userCompanies.map(async (company) => {
        const [membershipType] = company.membershipTypeId 
          ? await db.select().from(membershipTypes).where(eq(membershipTypes.id, company.membershipTypeId))
          : [undefined];

        const companyCategoriesIds = (company.categoriesIds as number[]) || [];
        const companyCertificateIds = (company.certificateIds as number[]) || [];

        // Get categories and certificates - simplified approach
        let companyCategories = [];
        let companyCertificates = [];
        
        if (companyCategoriesIds.length > 0) {
          for (const catId of companyCategoriesIds) {
            const [category] = await db.select().from(categories).where(eq(categories.id, catId));
            if (category) companyCategories.push(category);
          }
        }
        
        if (companyCertificateIds.length > 0) {
          for (const certId of companyCertificateIds) {
            const [certificate] = await db.select().from(certificates).where(eq(certificates.id, certId));
            if (certificate) companyCertificates.push(certificate);
          }
        }

        return {
          ...company,
          membershipType: membershipType || undefined,
          user: undefined, // We already know the user
          categories: companyCategories,
          certificates: companyCertificates
        };
      })
    );

    return enrichedCompanies;
  }

  // Categories
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db.update(categories).set(categoryData).where(eq(categories.id, id)).returning();
    return category || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Membership Types
  async getMembershipType(id: number): Promise<MembershipType | undefined> {
    const [membershipType] = await db.select().from(membershipTypes).where(eq(membershipTypes.id, id));
    return membershipType || undefined;
  }

  async getAllMembershipTypes(): Promise<MembershipType[]> {
    return await db.select().from(membershipTypes);
  }

  async createMembershipType(insertMembershipType: InsertMembershipType): Promise<MembershipType> {
    const [membershipType] = await db.insert(membershipTypes).values(insertMembershipType).returning();
    return membershipType;
  }

  async updateMembershipType(id: number, membershipTypeData: Partial<InsertMembershipType>): Promise<MembershipType | undefined> {
    const [membershipType] = await db.update(membershipTypes).set(membershipTypeData).where(eq(membershipTypes.id, id)).returning();
    return membershipType || undefined;
  }

  async deleteMembershipType(id: number): Promise<boolean> {
    const result = await db.delete(membershipTypes).where(eq(membershipTypes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Certificates
  async getCertificate(id: number): Promise<Certificate | undefined> {
    const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
    return certificate || undefined;
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return await db.select().from(certificates);
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const [certificate] = await db.insert(certificates).values(insertCertificate).returning();
    return certificate;
  }

  async updateCertificate(id: number, certificateData: Partial<InsertCertificate>): Promise<Certificate | undefined> {
    const [certificate] = await db.update(certificates).set(certificateData).where(eq(certificates.id, id)).returning();
    return certificate || undefined;
  }

  async deleteCertificate(id: number): Promise<boolean> {
    const result = await db.delete(certificates).where(eq(certificates.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Roles
  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.nombre);
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const [role] = await db
      .insert(roles)
      .values({
        ...insertRole,
        updatedAt: new Date(),
      })
      .returning();
    return role;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role | undefined> {
    const [role] = await db
      .update(roles)
      .set({
        ...roleData,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning();
    return role || undefined;
  }

  async deleteRole(id: number): Promise<boolean> {
    // Check if role is a system role
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    if (!role) {
      return false;
    }
    
    if (role.esRolSistema) {
      throw new Error("No se puede eliminar un rol del sistema");
    }

    const result = await db.delete(roles).where(eq(roles.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Opinions
  async getOpinion(id: number): Promise<Opinion | undefined> {
    const [opinion] = await db.select().from(opinions).where(eq(opinions.id, id));
    return opinion || undefined;
  }

  async getAllOpinions(options: {
    estado?: string;
    companyId?: number;
    tipo?: string;
    userId?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ opinions: Opinion[]; total: number }> {
    const { estado, companyId, tipo, userId, limit = 50, offset = 0 } = options;
    
    let query = db.select().from(opinions);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(opinions);
    
    const conditions = [];
    if (estado) {
      conditions.push(eq(opinions.estado, estado));
    }
    if (companyId) {
      conditions.push(eq(opinions.companyId, companyId));
    }
    if (tipo) {
      conditions.push(eq(opinions.tipo, tipo));
    }
    if (userId) {
      conditions.push(eq(opinions.userId, userId));
    }
    
    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }
    
    const opinionsResult = await query
      .orderBy(sql`${opinions.fechaCreacion} DESC`)
      .limit(limit)
      .offset(offset);
      
    const [{ count }] = await countQuery;
    
    return {
      opinions: opinionsResult,
      total: count || 0,
    };
  }

  async createOpinion(insertOpinion: InsertOpinion): Promise<Opinion> {
    const [opinion] = await db
      .insert(opinions)
      .values({
        ...insertOpinion,
        fechaCreacion: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return opinion;
  }

  async updateOpinion(id: number, opinionData: Partial<InsertOpinion>): Promise<Opinion | undefined> {
    const [opinion] = await db
      .update(opinions)
      .set({
        ...opinionData,
        updatedAt: new Date(),
      })
      .where(eq(opinions.id, id))
      .returning();
    return opinion || undefined;
  }

  async deleteOpinion(id: number): Promise<boolean> {
    const result = await db.delete(opinions).where(eq(opinions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async approveOpinion(id: number, approvedBy: number): Promise<Opinion | undefined> {
    const [opinion] = await db
      .update(opinions)
      .set({
        estado: "aprobada",
        fechaAprobacion: new Date(),
        aprobadoPor: approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(opinions.id, id))
      .returning();
    return opinion || undefined;
  }

  async rejectOpinion(id: number, approvedBy: number): Promise<Opinion | undefined> {
    const [opinion] = await db
      .update(opinions)
      .set({
        estado: "rechazada",
        fechaAprobacion: new Date(),
        aprobadoPor: approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(opinions.id, id))
      .returning();
    return opinion || undefined;
  }

  // Statistics
  async getStatistics(): Promise<{
    totalCompanies: number;
    activeUsers: number;
    newRegistrations: number;
    totalRevenue: number;
  }> {
    const [companiesCount] = await db.select({ count: sql<number>`count(*)` }).from(companies);
    const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [revenueResult] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` }).from(membershipPayments)
      .where(eq(membershipPayments.status, 'succeeded'));
    
    return {
      totalCompanies: companiesCount?.count || 0,
      activeUsers: usersCount?.count || 0,
      newRegistrations: 0, // This would need additional logic based on date ranges
      totalRevenue: revenueResult?.total || 0,
    };
  }

  // Membership Payments methods
  async createMembershipPayment(insertPayment: InsertMembershipPayment): Promise<MembershipPayment> {
    const [payment] = await db
      .insert(membershipPayments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async getMembershipPayment(id: number): Promise<MembershipPayment | undefined> {
    const [payment] = await db.select().from(membershipPayments).where(eq(membershipPayments.id, id));
    return payment || undefined;
  }

  async getMembershipPaymentByStripeId(stripePaymentIntentId: string): Promise<MembershipPayment | undefined> {
    const [payment] = await db.select().from(membershipPayments)
      .where(eq(membershipPayments.stripePaymentIntentId, stripePaymentIntentId));
    return payment || undefined;
  }

  async updateMembershipPaymentStatus(id: number, status: string): Promise<MembershipPayment | undefined> {
    const [payment] = await db
      .update(membershipPayments)
      .set({ status, updatedAt: new Date() })
      .where(eq(membershipPayments.id, id))
      .returning();
    return payment || undefined;
  }

  async getUserPayments(userId: number): Promise<MembershipPayment[]> {
    return await db.select().from(membershipPayments)
      .where(eq(membershipPayments.userId, userId))
      .orderBy(sql`created_at DESC`);
  }

  async updateUserStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    const [settings] = await db.select().from(systemSettings).limit(1);
    
    if (!settings) {
      // Crear configuración por defecto si no existe
      const [defaultSettings] = await db
        .insert(systemSettings)
        .values({})
        .returning();
      return defaultSettings;
    }
    
    return settings;
  }

  async updateSystemSettings(settingsData: Partial<InsertSystemSettings>): Promise<SystemSettings> {
    const currentSettings = await this.getSystemSettings();
    
    const [updatedSettings] = await db
      .update(systemSettings)
      .set({ ...settingsData, updatedAt: new Date() })
      .where(eq(systemSettings.id, currentSettings.id))
      .returning();
    
    return updatedSettings;
  }

  // Projects methods
  async getProject(id: number): Promise<ProjectWithDetails | undefined> {
    const [project] = await db.select()
      .from(projects)
      .leftJoin(companies, eq(projects.companyId, companies.id))
      .leftJoin(categories, eq(projects.categoryId, categories.id))
      .where(eq(projects.id, id));

    if (!project) return undefined;

    return {
      ...project.projects,
      company: project.companies || undefined,
      category: project.categories || undefined,
    };
  }

  async getAllProjects(options: {
    companyId?: number;
    categoryId?: number;
    estado?: string;
    estadoModeracion?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ projects: ProjectWithDetails[]; total: number }> {
    const conditions = [];

    if (options.companyId) {
      conditions.push(eq(projects.companyId, options.companyId));
    }
    if (options.categoryId) {
      conditions.push(eq(projects.categoryId, options.categoryId));
    }
    if (options.estado) {
      conditions.push(eq(projects.estado, options.estado));
    }
    if (options.estadoModeracion) {
      conditions.push(eq(projects.estadoModeracion, options.estadoModeracion));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(whereCondition);

    // Get projects with relationships
    const projectsData = await db.select()
      .from(projects)
      .leftJoin(companies, eq(projects.companyId, companies.id))
      .leftJoin(categories, eq(projects.categoryId, categories.id))
      .where(whereCondition)
      .limit(options.limit || 20)
      .offset(options.offset || 0)
      .orderBy(projects.createdAt);

    const projectsWithDetails: ProjectWithDetails[] = projectsData.map(item => ({
      ...item.projects,
      company: item.companies || undefined,
      category: item.categories || undefined,
    }));

    return {
      projects: projectsWithDetails,
      total: count,
    };
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount > 0;
  }

  async getProjectsByCompany(companyId: number): Promise<ProjectWithDetails[]> {
    const projectsData = await db.select()
      .from(projects)
      .leftJoin(companies, eq(projects.companyId, companies.id))
      .leftJoin(categories, eq(projects.categoryId, categories.id))
      .where(eq(projects.companyId, companyId))
      .orderBy(projects.createdAt);

    return projectsData.map(item => ({
      ...item.projects,
      company: item.companies || undefined,
      category: item.categories || undefined,
    }));
  }

  async incrementProjectViews(id: number): Promise<void> {
    await db
      .update(projects)
      .set({ 
        vistas: sql`${projects.vistas} + 1`,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id));
  }

  async incrementProjectConsultas(id: number): Promise<void> {
    await db
      .update(projects)
      .set({ 
        consultas: sql`${projects.consultas} + 1`,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id));
  }

  async moderateProject(id: number, estadoModeracion: string): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ estadoModeracion, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  // Home Configuration methods
  async getHomeConfiguration(seccion?: string): Promise<HomeConfiguration[]> {
    let query = db.select().from(homeConfiguration);
    
    if (seccion) {
      query = query.where(eq(homeConfiguration.seccion, seccion));
    }
    
    return await query.orderBy(homeConfiguration.orden);
  }

  async getHomeConfigurationBySection(seccion: string): Promise<HomeConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(homeConfiguration)
      .where(eq(homeConfiguration.seccion, seccion));
    return config || undefined;
  }

  async createHomeConfiguration(insertConfig: InsertHomeConfiguration): Promise<HomeConfiguration> {
    const [config] = await db
      .insert(homeConfiguration)
      .values(insertConfig)
      .returning();
    return config;
  }

  async updateHomeConfiguration(id: number, configData: Partial<InsertHomeConfiguration>): Promise<HomeConfiguration | undefined> {
    const [config] = await db
      .update(homeConfiguration)
      .set({ ...configData, updatedAt: new Date() })
      .where(eq(homeConfiguration.id, id))
      .returning();
    return config || undefined;
  }

  async deleteHomeConfiguration(id: number): Promise<boolean> {
    const result = await db.delete(homeConfiguration).where(eq(homeConfiguration.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Home Highlights methods
  async getAllHomeHighlights(): Promise<HomeHighlights[]> {
    return await db
      .select()
      .from(homeHighlights)
      .where(eq(homeHighlights.activo, true))
      .orderBy(homeHighlights.orden);
  }

  async getHomeHighlight(id: number): Promise<HomeHighlights | undefined> {
    const [highlight] = await db
      .select()
      .from(homeHighlights)
      .where(eq(homeHighlights.id, id));
    return highlight || undefined;
  }

  async createHomeHighlight(insertHighlight: InsertHomeHighlights): Promise<HomeHighlights> {
    const [highlight] = await db
      .insert(homeHighlights)
      .values(insertHighlight)
      .returning();
    return highlight;
  }

  async updateHomeHighlight(id: number, highlightData: Partial<InsertHomeHighlights>): Promise<HomeHighlights | undefined> {
    const [highlight] = await db
      .update(homeHighlights)
      .set({ ...highlightData, updatedAt: new Date() })
      .where(eq(homeHighlights.id, id))
      .returning();
    return highlight || undefined;
  }

  async deleteHomeHighlight(id: number): Promise<boolean> {
    const result = await db.delete(homeHighlights).where(eq(homeHighlights.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Home Banners methods
  async getAllHomeBanners(): Promise<HomeBanners[]> {
    return await db
      .select()
      .from(homeBanners)
      .where(eq(homeBanners.activo, true))
      .orderBy(homeBanners.orden);
  }

  async getHomeBanner(id: number): Promise<HomeBanners | undefined> {
    const [banner] = await db
      .select()
      .from(homeBanners)
      .where(eq(homeBanners.id, id));
    return banner || undefined;
  }

  async createHomeBanner(insertBanner: InsertHomeBanners): Promise<HomeBanners> {
    const [banner] = await db
      .insert(homeBanners)
      .values(insertBanner)
      .returning();
    return banner;
  }

  async updateHomeBanner(id: number, bannerData: Partial<InsertHomeBanners>): Promise<HomeBanners | undefined> {
    const [banner] = await db
      .update(homeBanners)
      .set({ ...bannerData, updatedAt: new Date() })
      .where(eq(homeBanners.id, id))
      .returning();
    return banner || undefined;
  }

  async deleteHomeBanner(id: number): Promise<boolean> {
    const result = await db.delete(homeBanners).where(eq(homeBanners.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();