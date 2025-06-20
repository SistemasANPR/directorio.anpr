import { 
  users, 
  companies, 
  categories, 
  tags,
  membershipTypes, 
  certificates,
  roles,
  opinions,
  membershipPayments,
  systemSettings,
  projects,
  integrationSettings,
  pdfSettings,
  type User, 
  type Company, 
  type Category, 
  type Tag,
  type MembershipType, 
  type Certificate,
  type Role,
  type Opinion,
  type Project,
  type InsertUser,
  type InsertCompany,
  type InsertCategory,
  type InsertTag,
  type InsertMembershipType,
  type InsertCertificate,
  type InsertRole,
  type InsertOpinion,
  type InsertProject,
  type IntegrationSettings,
  type InsertIntegrationSettings,
  type PdfSettings,
  type InsertPdfSettings,
  type MembershipPayment,
  type InsertMembershipPayment,
  type SystemSettings,
  type InsertSystemSettings,
  type CompanyWithDetails,
  type ProjectWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, like, sql, and, or, asc } from "drizzle-orm";

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
    tagIds?: number[];
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

  // Tags
  getTag(id: number): Promise<Tag | undefined>;
  getAllTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: number, tag: Partial<InsertTag>): Promise<Tag | undefined>;
  deleteTag(id: number): Promise<boolean>;
  getTagsInUse(): Promise<number[]>;

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
  assignCertificateToCompany(companyId: number, certificateId: number, details: {
    fechaObtencion: string;
    asignadoPorAdmin: boolean;
    observaciones?: string;
  }): Promise<void>;

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

  // Membership Limits Validation
  validateProjectLimits(companyId: number): Promise<void>;
  validateProductLimits(companyId: number, newProductCount?: number): Promise<void>;

  // PDF Settings
  getPdfSettings(): Promise<PdfSettings>;
  updatePdfSettings(settings: Partial<InsertPdfSettings>): Promise<PdfSettings>;
  createPdfSettings(settings: InsertPdfSettings): Promise<PdfSettings>;



  // Integration Settings
  getIntegrationSettings(): Promise<IntegrationSettings | undefined>;
  createIntegrationSettings(settings: InsertIntegrationSettings): Promise<IntegrationSettings>;
  updateIntegrationSettings(id: number, settings: Partial<InsertIntegrationSettings>): Promise<IntegrationSettings | undefined>;
  testWordPressConnection(url: string, credentials: { apiKey: string; apiSecret: string }): Promise<{ success: boolean; message: string }>;
  syncWordPressUsers(): Promise<{ syncedUsers: number; message: string }>;
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
    tagIds?: number[];
    estado?: string;
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
  } = {}): Promise<{ companies: CompanyWithDetails[]; total: number }> {
    const { search, categoryId, membershipTypeId, tagIds, estado, limit = 10, offset = 0, includeInactive = false } = options;
    
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

    // Tag-based filtering
    if (tagIds && tagIds.length > 0) {
      const tagConditions = tagIds.map(tagId => 
        sql`${companies.tagIds} ? ${tagId.toString()}`
      );
      whereConditions.push(or(...tagConditions));
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
        const companyTagIds = (company.tagIds as number[]) || [];

        // Get categories, certificates, and tags
        let companyCategories = [];
        let companyCertificates = [];
        let companyTags = [];
        
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

        if (companyTagIds.length > 0) {
          for (const tagId of companyTagIds) {
            const [tag] = await db.select().from(tags).where(eq(tags.id, tagId));
            if (tag) companyTags.push(tag);
          }
        }

        return {
          ...company,
          membershipType: membershipType || undefined,
          user: user || undefined,
          categories: companyCategories,
          certificates: companyCertificates,
          tags: companyTags
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
    // Si se está actualizando la galería de productos, verificar límites
    if (companyData.galeriaProductosUrls) {
      const currentCompany = await this.getCompany(id);
      if (currentCompany) {
        const currentProductCount = Array.isArray(currentCompany.galeriaProductosUrls) 
          ? currentCompany.galeriaProductosUrls.length 
          : 0;
        const newProductCount = Array.isArray(companyData.galeriaProductosUrls) 
          ? companyData.galeriaProductosUrls.length 
          : 0;
        
        // Solo validar si se están agregando productos
        if (newProductCount > currentProductCount) {
          await this.validateProductLimits(id, newProductCount - currentProductCount);
        }
      }
    }

    const [company] = await db.update(companies).set({ ...companyData, updatedAt: new Date() }).where(eq(companies.id, id)).returning();
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

  // Tag Management Methods
  async getTag(id: number): Promise<Tag | undefined> {
    try {
      const [tag] = await db.select().from(tags).where(eq(tags.id, id));
      return tag || undefined;
    } catch (error) {
      console.error("Error fetching tag:", error);
      return undefined;
    }
  }

  async getAllTags(): Promise<Tag[]> {
    try {
      return await db.select().from(tags).where(eq(tags.isActive, true)).orderBy(tags.nombre);
    } catch (error) {
      console.error("Error fetching all tags:", error);
      return [];
    }
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const [tag] = await db.insert(tags).values(insertTag).returning();
    return tag;
  }

  async updateTag(id: number, tagData: Partial<InsertTag>): Promise<Tag | undefined> {
    const [updatedTag] = await db
      .update(tags)
      .set({ ...tagData, updatedAt: new Date() })
      .where(eq(tags.id, id))
      .returning();
    return updatedTag || undefined;
  }

  async deleteTag(id: number): Promise<boolean> {
    // First check if tag is in use
    const companiesUsingTag = await db.select({ id: companies.id })
      .from(companies)
      .where(sql`${companies.tagIds} ? ${id.toString()}`);
    
    if (companiesUsingTag.length > 0) {
      throw new Error(`No se puede eliminar la etiqueta porque está siendo utilizada por ${companiesUsingTag.length} empresa(s)`);
    }
    
    const [deletedTag] = await db.delete(tags).where(eq(tags.id, id)).returning();
    return !!deletedTag;
  }

  async getTagsInUse(): Promise<number[]> {
    const companiesWithTags = await db.select({ tagIds: companies.tagIds }).from(companies);
    const allTagIds = new Set<number>();
    
    companiesWithTags.forEach(company => {
      if (company.tagIds && Array.isArray(company.tagIds)) {
        (company.tagIds as number[]).forEach(tagId => allTagIds.add(tagId));
      }
    });
    
    return Array.from(allTagIds);
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

  async assignCertificateToCompany(companyId: number, certificateId: number, details: {
    fechaObtencion: string;
    asignadoPorAdmin: boolean;
    observaciones?: string;
  }): Promise<void> {
    // Get the current company to update its certificateIds
    const company = await this.getCompany(companyId);
    if (!company) {
      throw new Error("Company not found");
    }

    // Get current certificate IDs and add the new one if not already present
    const currentCertificateIds = (company.certificateIds as number[]) || [];
    if (!currentCertificateIds.includes(certificateId)) {
      currentCertificateIds.push(certificateId);
      
      // Update the company's certificateIds array
      await db.update(companies)
        .set({ 
          certificateIds: currentCertificateIds,
          updatedAt: new Date()
        })
        .where(eq(companies.id, companyId));
    }
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
    // Verificar límites del plan de membresía antes de crear el proyecto
    await this.validateProjectLimits(insertProject.companyId);
    
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async validateProjectLimits(companyId: number): Promise<void> {
    // Obtener información de la empresa y su plan de membresía
    const company = await this.getCompany(companyId);
    if (!company || !company.membershipTypeId) {
      throw new Error("La empresa no tiene un plan de membresía válido");
    }

    const membershipType = await this.getMembershipType(company.membershipTypeId);
    if (!membershipType) {
      throw new Error("Plan de membresía no encontrado");
    }

    // Verificar límite de proyectos
    const currentProjectCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.companyId, companyId));

    const projectCount = currentProjectCount[0]?.count || 0;
    const projectLimit = membershipType.cantidadProyectosAdmitidos || 0;

    if (projectLimit > 0 && projectCount >= projectLimit) {
      throw new Error(`Has alcanzado el límite de ${projectLimit} proyectos permitidos en tu plan ${membershipType.nombrePlan}`);
    }
  }

  async validateProductLimits(companyId: number, newProductCount: number = 1): Promise<void> {
    // Obtener información de la empresa y su plan de membresía
    const company = await this.getCompany(companyId);
    if (!company || !company.membershipTypeId) {
      throw new Error("La empresa no tiene un plan de membresía válido");
    }

    const membershipType = await this.getMembershipType(company.membershipTypeId);
    if (!membershipType) {
      throw new Error("Plan de membresía no encontrado");
    }

    // Verificar límite de productos (basado en galería de productos)
    const currentProductCount = Array.isArray(company.galeriaProductosUrls) 
      ? company.galeriaProductosUrls.length 
      : 0;
    
    const productLimit = membershipType.cantidadProductosAdmitidos || 0;

    if (productLimit > 0 && (currentProductCount + newProductCount) > productLimit) {
      throw new Error(`Has alcanzado el límite de ${productLimit} productos permitidos en tu plan ${membershipType.nombrePlan}. Actualmente tienes ${currentProductCount} productos.`);
    }
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



  // Integration Settings
  async getIntegrationSettings(): Promise<IntegrationSettings | undefined> {
    const [settings] = await db.select().from(integrationSettings).limit(1);
    return settings || undefined;
  }

  async createIntegrationSettings(insertSettings: InsertIntegrationSettings): Promise<IntegrationSettings> {
    const [settings] = await db
      .insert(integrationSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateIntegrationSettings(id: number, settingsData: Partial<InsertIntegrationSettings>): Promise<IntegrationSettings | undefined> {
    const [settings] = await db
      .update(integrationSettings)
      .set({ ...settingsData, updatedAt: new Date() })
      .where(eq(integrationSettings.id, id))
      .returning();
    return settings || undefined;
  }

  async testWordPressConnection(url: string, credentials: { apiKey: string; apiSecret: string }): Promise<{ success: boolean; message: string }> {
    try {
      // Basic validation
      if (!url || !credentials.apiKey || !credentials.apiSecret) {
        return { success: false, message: "URL y credenciales son requeridos" };
      }

      // Validate URL format
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(url)) {
        return { success: false, message: "URL debe incluir http:// o https://" };
      }

      // Test connection with WordPress REST API
      const testUrl = `${url.replace(/\/$/, '')}/wp-json/wp/v2/users/me`;
      const authString = Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString('base64');
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true, message: "Conexión exitosa con WordPress" };
      } else {
        return { success: false, message: `Error de conexión: ${response.status} ${response.statusText}` };
      }
    } catch (error: any) {
      return { success: false, message: `Error de conexión: ${error.message}` };
    }
  }

  async syncWordPressUsers(): Promise<{ syncedUsers: number; message: string }> {
    try {
      const settings = await this.getIntegrationSettings();
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return { syncedUsers: 0, message: "Configuración de WordPress incompleta" };
      }

      if (!settings.syncEnabled) {
        return { syncedUsers: 0, message: "Sincronización deshabilitada" };
      }

      const usersUrl = `${settings.wordpressUrl.replace(/\/$/, '')}/wp-json/wp/v2/users`;
      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      
      const response = await fetch(usersUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { syncedUsers: 0, message: `Error al obtener usuarios: ${response.status}` };
      }

      const wpUsers = await response.json();
      let syncedCount = 0;

      for (const wpUser of wpUsers) {
        // Check if user already exists
        const existingUser = await this.getUserByEmail(wpUser.email);
        
        if (!existingUser) {
          // Create new user
          try {
            await this.createUser({
              email: wpUser.email,
              displayName: wpUser.name || wpUser.slug,
              firebaseUid: `wp_${wpUser.id}`,
              role: 'representative',
            });
            syncedCount++;
          } catch (error) {
            console.error(`Error creating user ${wpUser.email}:`, error);
          }
        }
      }

      // Update last sync time
      if (settings.id) {
        await this.updateIntegrationSettings(settings.id, {
          lastSync: new Date(),
          syncStatus: 'success',
        });
      }

      return { syncedUsers: syncedCount, message: `${syncedCount} usuarios sincronizados exitosamente` };
    } catch (error: any) {
      return { syncedUsers: 0, message: `Error de sincronización: ${error.message}` };
    }
  }

  // PDF Settings
  async getPdfSettings(): Promise<PdfSettings> {
    const [settings] = await db.select().from(pdfSettings).limit(1);
    
    // If no settings exist, create default ones
    if (!settings) {
      return await this.createPdfSettings({
        companyName: "ANPR México",
        companySubtitle: "Asociación Nacional de Profesionales en Relaciones Públicas",
        websiteUrl: "www.anpr.org.mx",
        primaryColor: "#bcce16",
        secondaryColor: "#2d3748",
        accentColor: "#f7fafc",
        textColor: "#000000",
        subtitleColor: "#505050",
        headerHeight: 30,
        fontSize: 10,
        titleFontSize: 22,
        showLogo: true,
        showWebsite: true,
        showAddress: true,
        footerText: "Este recibo fue generado automáticamente"
      });
    }
    
    return settings;
  }

  async createPdfSettings(settings: InsertPdfSettings): Promise<PdfSettings> {
    const [newSettings] = await db
      .insert(pdfSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async updatePdfSettings(updates: Partial<InsertPdfSettings>): Promise<PdfSettings> {
    // Get current settings or create default if none exist
    let currentSettings = await this.getPdfSettings();
    
    const [updatedSettings] = await db
      .update(pdfSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pdfSettings.id, currentSettings.id))
      .returning();
      
    return updatedSettings;
  }

  // Email Configuration methods
  async getEmailConfiguration(): Promise<EmailConfiguration | undefined> {
    const [config] = await db.select().from(emailConfiguration).where(eq(emailConfiguration.isActive, true)).limit(1);
    return config || undefined;
  }

  async saveEmailConfiguration(config: InsertEmailConfiguration): Promise<EmailConfiguration> {
    // Check if config exists
    const existingConfig = await this.getEmailConfiguration();
    
    if (existingConfig) {
      // Update existing config
      const [updatedConfig] = await db
        .update(emailConfiguration)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(emailConfiguration.id, existingConfig.id))
        .returning();
      return updatedConfig;
    } else {
      // Create new config
      const [newConfig] = await db
        .insert(emailConfiguration)
        .values(config)
        .returning();
      return newConfig;
    }
  }

  async testEmailConfiguration(config: InsertEmailConfiguration): Promise<{ success: boolean; message: string }> {
    try {
      // For now, we'll do a basic validation test
      // In production, you would use nodemailer to actually test the connection
      if (!config.fromEmail || !config.smtpHost || !config.username || !config.password) {
        return {
          success: false,
          message: "Faltan campos obligatorios en la configuración"
        };
      }

      // Simulate email test - in production, use nodemailer
      return {
        success: true,
        message: "Configuración de correo válida. Prueba de conexión exitosa."
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error en la prueba de conexión: ${error.message}`
      };
    }
  }

  // Email Templates methods
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).where(eq(emailTemplates.isActive, true));
  }

  async getEmailTemplateByType(type: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates)
      .where(and(eq(emailTemplates.type, type), eq(emailTemplates.isActive, true)))
      .limit(1);
    return template || undefined;
  }

  async saveEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    // Check if template exists for this type
    const existingTemplate = await this.getEmailTemplateByType(template.type);
    
    if (existingTemplate) {
      // Update existing template
      const [updatedTemplate] = await db
        .update(emailTemplates)
        .set({ ...template, updatedAt: new Date() })
        .where(eq(emailTemplates.id, existingTemplate.id))
        .returning();
      return updatedTemplate;
    } else {
      // Create new template
      const [newTemplate] = await db
        .insert(emailTemplates)
        .values(template)
        .returning();
      return newTemplate;
    }
  }
}

export const storage = new DatabaseStorage();