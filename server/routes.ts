import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { insertUserSchema, insertCompanySchema, insertCategorySchema, insertMembershipTypeSchema, insertCertificateSchema, insertRoleSchema, insertOpinionSchema, insertMembershipPaymentSchema, insertProjectSchema, insertHomeConfigurationSchema, insertHomeHighlightsSchema, insertHomeBannersSchema, insertIntegrationSettingsSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Configuración de multer para imágenes
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Configuración de multer para documentos
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB for documents
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF, Word o imágenes'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Servir archivos estáticos desde la carpeta uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  
  // Servir archivos estáticos desde la carpeta attached_assets
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

  // Ruta para subir una sola imagen
  app.post("/api/upload-image", uploadImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo" });
      }
      
      const imageUrl = `/uploads/images/${req.file.filename}`;
      res.json({ 
        success: true, 
        imageUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error("Error al subir imagen:", error);
      res.status(500).json({ error: "Error al procesar la imagen" });
    }
  });

  // Ruta para subir múltiples imágenes
  app.post("/api/upload-images", uploadImage.array('images', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No se recibieron archivos" });
      }
      
      const imageUrls = req.files.map(file => ({
        imageUrl: `/uploads/images/${file.filename}`,
        filename: file.filename
      }));
      
      res.json({ 
        success: true, 
        images: imageUrls
      });
    } catch (error) {
      console.error("Error al subir imágenes:", error);
      res.status(500).json({ error: "Error al procesar las imágenes" });
    }
  });

  // Ruta para subir documentos PDF
  app.post("/api/upload-document", uploadDocument.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo" });
      }
      

      
      const documentUrl = `/uploads/documents/${req.file.filename}`;
      res.json({ 
        success: true, 
        documentUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error("Error al subir documento:", error);
      res.status(500).json({ error: "Error al procesar el documento" });
    }
  });

  // Ruta para eliminar imagen
  app.delete("/api/delete-image/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', 'images', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: "Imagen eliminada correctamente" });
      } else {
        res.status(404).json({ error: "Imagen no encontrada" });
      }
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
      res.status(500).json({ error: "Error al eliminar la imagen" });
    }
  });

  // Users API
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/users/firebase/:uid", async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.params.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Companies API
  app.get("/api/companies", async (req, res) => {
    try {
      const { search, categoryId, membershipTypeId, estado, page = "1", limit = "10", premiumOnly } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      console.log("Fetching companies with params:", { search, categoryId, membershipTypeId, estado, pageNum, limitNum, offset, premiumOnly });

      // If premiumOnly is true, we need to filter for premium and enterprise memberships
      let effectiveMembershipTypeId = membershipTypeId ? parseInt(membershipTypeId as string) : undefined;
      
      if (premiumOnly === 'true') {
        // Get all membership types to find premium and enterprise IDs
        const membershipTypes = await storage.getAllMembershipTypes();
        const premiumTypes = membershipTypes.filter(mt => 
          mt.nombrePlan?.toLowerCase().includes('premium') || 
          mt.nombrePlan?.toLowerCase().includes('empresarial') ||
          mt.nombrePlan?.toLowerCase().includes('enterprise')
        );
        
        if (premiumTypes.length > 0) {
          // For now, we'll need to handle multiple membership types in the storage layer
          // or make multiple queries. Let's modify the approach.
          const allResults = await Promise.all(
            premiumTypes.map(pt => storage.getAllCompanies({
              search: search as string,
              categoryId: categoryId ? parseInt(categoryId as string) : undefined,
              membershipTypeId: pt.id,
              estado: estado as string,
              limit: 1000, // Get all for filtering
              offset: 0
            }))
          );
          
          // Combine and deduplicate results
          const allCompanies = allResults.reduce((acc, result) => {
            result.companies.forEach(company => {
              if (!acc.find(c => c.id === company.id)) {
                acc.push(company);
              }
            });
            return acc;
          }, []);
          
          // Apply pagination to combined results
          const total = allCompanies.length;
          const paginatedCompanies = allCompanies.slice(offset, offset + limitNum);
          
          return res.json({
            companies: paginatedCompanies,
            total: total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
          });
        }
      }

      const result = await storage.getAllCompanies({
        search: search as string,
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        membershipTypeId: effectiveMembershipTypeId,
        estado: estado as string,
        limit: limitNum,
        offset
      });

      console.log("Companies result:", result);

      res.json({
        companies: result.companies,
        total: result.total,
        page: pageNum,
        totalPages: Math.ceil(result.total / limitNum)
      });
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies", details: error.message });
    }
  });

  // Admin route to get all companies including inactive ones
  app.get("/api/admin/companies", async (req, res) => {
    try {
      const { search, categoryId, membershipTypeId, estado, page = "1", limit = "10" } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // For admin route, we don't filter by default - show all companies
      const result = await storage.getAllCompanies({
        search: search as string,
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        membershipTypeId: membershipTypeId ? parseInt(membershipTypeId as string) : undefined,
        estado: estado as string, // This will include inactive if specified
        limit: limitNum,
        offset,
        includeInactive: true // Add this flag to the storage method
      });

      res.json({
        companies: result.companies,
        total: result.total,
        page: pageNum,
        totalPages: Math.ceil(result.total / limitNum)
      });
    } catch (error) {
      console.error("Error fetching admin companies:", error);
      res.status(500).json({ error: "Failed to fetch companies", details: error.message });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company" });
    }
  });

  app.get("/api/companies/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const companies = await storage.getCompaniesByUser(userId);
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user companies" });
    }
  });

  app.get("/api/companies/by-user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const companies = await storage.getCompaniesByUser(userId);
      if (companies.length === 0) {
        return res.status(404).json({ error: "No company found for this user" });
      }
      res.json(companies[0]); // Return the first company associated with the user
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user company" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(id, companyData);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCompany(id);
      if (!deleted) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Membership Types API
  app.get("/api/membership-types", async (req, res) => {
    try {
      const membershipTypes = await storage.getAllMembershipTypes();
      
      // Check if user is admin - if not, filter out private memberships
      const isAdmin = req.user?.role === 'admin' || req.user?.roleId === 1;
      
      if (!isAdmin) {
        // Filter out private memberships for non-admin users
        const publicMemberships = membershipTypes.filter((membership: any) => 
          !membership.visibilidad || membership.visibilidad === "publica"
        );
        res.json(publicMemberships);
      } else {
        // Admin users can see all memberships
        res.json(membershipTypes);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch membership types" });
    }
  });

  // Endpoint para obtener solo membresías públicas (para usuarios no administradores)
  app.get("/api/membership-types/public", async (req, res) => {
    try {
      const membershipTypes = await storage.getAllMembershipTypes();
      // Filtrar solo las membresías públicas
      const publicMemberships = membershipTypes.filter((membership: any) => 
        !membership.visibilidad || membership.visibilidad === "publica"
      );
      res.json(publicMemberships);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch public membership types" });
    }
  });

  app.get("/api/membership-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const membershipType = await storage.getMembershipType(id);
      if (!membershipType) {
        return res.status(404).json({ error: "Membership type not found" });
      }
      res.json(membershipType);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch membership type" });
    }
  });

  app.post("/api/membership-types", async (req, res) => {
    try {
      const membershipTypeData = insertMembershipTypeSchema.parse(req.body);
      const membershipType = await storage.createMembershipType(membershipTypeData);
      res.status(201).json(membershipType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create membership type" });
    }
  });

  app.put("/api/membership-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const membershipTypeData = insertMembershipTypeSchema.partial().parse(req.body);
      const membershipType = await storage.updateMembershipType(id, membershipTypeData);
      if (!membershipType) {
        return res.status(404).json({ error: "Membership type not found" });
      }
      res.json(membershipType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update membership type" });
    }
  });

  app.delete("/api/membership-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMembershipType(id);
      if (!deleted) {
        return res.status(404).json({ error: "Membership type not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete membership type" });
    }
  });

  // Certificates API
  app.get("/api/certificates", async (req, res) => {
    try {
      const certificates = await storage.getAllCertificates();
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  });

  app.get("/api/certificates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const certificate = await storage.getCertificate(id);
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certificate" });
    }
  });

  app.post("/api/certificates", async (req, res) => {
    try {
      console.log("Datos recibidos para certificado:", req.body);
      const certificateData = insertCertificateSchema.parse(req.body);
      console.log("Datos validados:", certificateData);
      const certificate = await storage.createCertificate(certificateData);
      res.status(201).json(certificate);
    } catch (error) {
      console.error("Error al crear certificado:", error);
      if (error instanceof z.ZodError) {
        console.error("Errores de validación:", error.errors);
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors,
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      res.status(500).json({ 
        error: "Failed to create certificate",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/certificates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const certificateData = insertCertificateSchema.partial().parse(req.body);
      const certificate = await storage.updateCertificate(id, certificateData);
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }
      res.json(certificate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update certificate" });
    }
  });

  app.delete("/api/certificates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCertificate(id);
      if (!deleted) {
        return res.status(404).json({ error: "Certificate not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete certificate" });
    }
  });

  // Roles API
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.get("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const role = await storage.getRole(id);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch role" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create role" });
    }
  });

  app.put("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const roleData = insertRoleSchema.partial().parse(req.body);
      const role = await storage.updateRole(id, roleData);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRole(id);
      if (!deleted) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      if (error.message === "No se puede eliminar un rol del sistema") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Opinions API
  app.get("/api/opinions", async (req, res) => {
    try {
      const { estado, companyId, tipo, userId, page = "1", limit = "50" } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      const options = {
        estado: estado as string,
        companyId: companyId ? parseInt(companyId as string) : undefined,
        tipo: tipo as string,
        userId: userId ? parseInt(userId as string) : undefined,
        limit: limitNum,
        offset,
      };
      
      const result = await storage.getAllOpinions(options);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch opinions" });
    }
  });

  app.get("/api/opinions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const opinion = await storage.getOpinion(id);
      if (!opinion) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      res.json(opinion);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch opinion" });
    }
  });

  app.post("/api/opinions", async (req, res) => {
    try {
      const opinionData = insertOpinionSchema.parse(req.body);
      const opinion = await storage.createOpinion(opinionData);
      res.status(201).json(opinion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create opinion" });
    }
  });

  app.put("/api/opinions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const opinionData = insertOpinionSchema.partial().parse(req.body);
      const opinion = await storage.updateOpinion(id, opinionData);
      if (!opinion) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      res.json(opinion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update opinion" });
    }
  });

  app.delete("/api/opinions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOpinion(id);
      if (!deleted) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete opinion" });
    }
  });

  app.put("/api/opinions/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const approvedBy = req.user?.id || 1; // Default to admin user
      const opinion = await storage.approveOpinion(id, approvedBy);
      if (!opinion) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      res.json(opinion);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve opinion" });
    }
  });

  app.put("/api/opinions/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const approvedBy = req.user?.id || 1; // Default to admin user
      const opinion = await storage.rejectOpinion(id, approvedBy);
      if (!opinion) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      res.json(opinion);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject opinion" });
    }
  });

  // Statistics API
  app.get("/api/statistics", async (req, res) => {
    try {
      const statistics = await storage.getStatistics();
      res.json(statistics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Stripe Payment Routes for Memberships
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { membershipTypeId, companyId } = req.body;
      
      if (!membershipTypeId) {
        return res.status(400).json({ error: "Missing membershipTypeId" });
      }

      // Get membership type to get the price
      const membershipType = await storage.getMembershipType(membershipTypeId);
      if (!membershipType) {
        return res.status(404).json({ error: "Membership type not found" });
      }

      // Get company to verify it exists (only if companyId is provided)
      let company = null;
      if (companyId) {
        company = await storage.getCompany(companyId);
        if (!company) {
          return res.status(404).json({ error: "Company not found" });
        }
      }

      // Extract the cost from pricing options
      let amount = 0;
      
      if (membershipType.opcionesPrecios && Array.isArray(membershipType.opcionesPrecios) && membershipType.opcionesPrecios.length > 0) {
        // Use the first pricing option or find annual pricing
        const pricingOption = membershipType.opcionesPrecios.find((option: any) => 
          option.periodicidad && option.periodicidad.toLowerCase() === 'anual'
        ) || membershipType.opcionesPrecios[0];
        
        amount = parseFloat(pricingOption?.costo?.toString() || "0") || 0;
      }

      if (amount <= 0) {
        return res.status(400).json({ error: "Invalid membership cost configuration. No valid pricing found." });
      }

      // Prepare metadata
      const metadata: any = {
        membershipTypeId: membershipTypeId.toString(),
        isNewMembership: companyId ? "false" : "true",
      };
      
      if (companyId && company) {
        metadata.companyId = companyId.toString();
        metadata.userId = (company.userId || 0).toString();
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "mxn",
        metadata,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Webhook endpoint for Stripe events
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
      } catch (err) {
        console.error('Webhook signature verification failed.');
        return res.status(400).send('Webhook signature verification failed.');
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          // Record the payment in database
          const membershipTypeId = parseInt(paymentIntent.metadata.membershipTypeId);
          const isNewMembership = paymentIntent.metadata.isNewMembership === "true";
          
          if (isNewMembership) {
            // Handle new membership payment (without specific company)
            await storage.createMembershipPayment({
              userId: 0, // For new memberships, we don't have a user yet
              companyId: 0, // For new memberships, we don't have a company yet
              membershipTypeId,
              stripePaymentIntentId: paymentIntent.id,
              amount: (paymentIntent.amount / 100).toString(),
              currency: paymentIntent.currency,
              status: 'succeeded',
            });
          } else {
            // Handle company membership update
            const companyId = parseInt(paymentIntent.metadata.companyId);
            const userId = parseInt(paymentIntent.metadata.userId);

            await storage.createMembershipPayment({
              userId,
              companyId,
              membershipTypeId,
              stripePaymentIntentId: paymentIntent.id,
              amount: (paymentIntent.amount / 100).toString(),
              currency: paymentIntent.currency,
              status: 'succeeded',
            });

            // Update company's membership type
            await storage.updateCompany(companyId, {
              membershipTypeId,
            });
          }

          console.log('PaymentIntent was successful!');
          break;
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          
          // Update payment status to failed
          const existingPayment = await storage.getMembershipPaymentByStripeId(failedPayment.id);
          if (existingPayment) {
            await storage.updateMembershipPaymentStatus(existingPayment.id, 'failed');
          }
          
          console.log('PaymentIntent failed.');
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  });

  // Get user's payment history
  app.get("/api/users/:userId/payments", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const payments = await storage.getUserPayments(userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching user payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // Create or get Stripe customer
  app.post("/api/create-stripe-customer", async (req, res) => {
    try {
      const { userId, email, name } = req.body;
      
      if (!userId || !email) {
        return res.status(400).json({ error: "Missing userId or email" });
      }

      // Check if user already has a Stripe customer ID
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.stripeCustomerId) {
        // Return existing customer
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        return res.json({ customerId: customer.id });
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name: name || user.displayName || email,
      });

      // Update user with Stripe customer ID
      await storage.updateUserStripeCustomerId(userId, customer.id);

      res.json({ customerId: customer.id });
    } catch (error: any) {
      console.error("Error creating Stripe customer:", error);
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  // System Settings routes
  app.get("/api/system-settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/system-settings", async (req, res) => {
    try {
      // Skip authentication check for now - allow system settings updates
      // TODO: Implement proper authentication middleware

      // TODO: Add admin role verification here

      const settings = await storage.updateSystemSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Projects API routes
  app.get("/api/projects", async (req, res) => {
    try {
      const { companyId, categoryId, estado, estadoModeracion, limit, offset } = req.query;
      
      const options = {
        companyId: companyId ? parseInt(companyId as string) : undefined,
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        estado: estado as string,
        estadoModeracion: estadoModeracion as string,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      };

      const result = await storage.getAllProjects(options);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "Proyecto no encontrado" });
      }

      // Incrementar vistas
      await storage.incrementProjectViews(id);
      
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/companies/:companyId/projects", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const projects = await storage.getProjectsByCompany(companyId);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects", uploadImage.array('galeriaImagenes', 4), async (req, res) => {
    try {
      // Skip authentication check for now - allow project creation
      // TODO: Implement proper authentication middleware

      console.log("Request body:", req.body);
      console.log("Request files:", req.files);
      console.log("Content-Type:", req.headers['content-type']);

      // Validar que companyId esté presente y sea válido
      if (!req.body.companyId || isNaN(parseInt(req.body.companyId))) {
        return res.status(400).json({ error: "Company ID es requerido y debe ser un número válido" });
      }

      const companyId = parseInt(req.body.companyId);

      // Verificar límite de proyectos por empresa
      const existingProjects = await storage.getProjectsByCompany(companyId);
      if (existingProjects.length >= 5) {
        return res.status(400).json({ error: "Límite de 5 proyectos por empresa alcanzado" });
      }

      // Procesar imágenes subidas
      const files = req.files as Express.Multer.File[];
      const imageUrls = files ? files.map(file => `/uploads/images/${file.filename}`) : [];

      // Clean up and filter the project data, excluding removed fields
      const allowedFields = [
        'companyId', 'nombreProyecto', 'descripcionProyecto', 'ubicacionPais', 
        'ubicacionEstado', 'ubicacionCiudad', 'clienteContratante', 
        'areaSuperficie', 'serviciosProductos', 'videoUrl', 'estado', 'estadoModeracion'
      ];

      const filteredBody = Object.fromEntries(
        Object.entries(req.body).filter(([key, value]) => 
          allowedFields.includes(key) && value !== undefined && value !== null && value !== ""
        )
      );

      const projectData = {
        ...filteredBody,
        companyId: parseInt(req.body.companyId),
        galeriaImagenes: imageUrls,
        serviciosProductos: req.body.serviciosProductos ? JSON.parse(req.body.serviciosProductos) : [],
      };

      console.log("Processed project data:", projectData);

      const validatedData = insertProjectSchema.parse(projectData);
      console.log("Validated data:", validatedData);
      
      const project = await storage.createProject(validatedData);
      
      res.status(201).json(project);
    } catch (error: any) {
      console.error("Project creation error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/projects/:id", uploadImage.array('galeriaImagenes', 4), async (req, res) => {
    try {
      // Skip authentication check for now - allow project updates
      // TODO: Implement proper authentication middleware

      const id = parseInt(req.params.id);
      const existingProject = await storage.getProject(id);
      
      if (!existingProject) {
        return res.status(404).json({ error: "Proyecto no encontrado" });
      }

      // Procesar nuevas imágenes si las hay
      const files = req.files as Express.Multer.File[];
      let updateData = { ...req.body };
      
      if (files && files.length > 0) {
        const newImageUrls = files.map(file => `/uploads/images/${file.filename}`);
        updateData.galeriaImagenes = newImageUrls;
      }

      if (req.body.serviciosProductos) {
        updateData.serviciosProductos = JSON.parse(req.body.serviciosProductos);
      }

      const validatedData = insertProjectSchema.partial().parse(updateData);
      const project = await storage.updateProject(id, validatedData);
      
      res.json(project);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      // Skip authentication check for now - allow project deletion
      // TODO: Implement proper authentication middleware

      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Proyecto no encontrado" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects/:id/consulta", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementProjectConsultas(id);
      res.status(200).json({ message: "Consulta registrada" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin routes for project moderation
  app.patch("/api/admin/projects/:id/moderate", async (req, res) => {
    try {
      // Skip authentication check for now - allow project moderation
      // TODO: Implement proper authentication middleware

      // TODO: Add admin role verification here

      const id = parseInt(req.params.id);
      const { estadoModeracion } = req.body;
      
      if (!['pendiente', 'aprobado', 'rechazado'].includes(estadoModeracion)) {
        return res.status(400).json({ error: "Estado de moderación inválido" });
      }

      const project = await storage.moderateProject(id, estadoModeracion);
      
      if (!project) {
        return res.status(404).json({ error: "Proyecto no encontrado" });
      }
      
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Home Configuration Routes
  app.get("/api/home-config", async (req, res) => {
    try {
      const { seccion } = req.query;
      const configs = await storage.getHomeConfiguration(seccion as string);
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/home-config/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.getHomeConfigurationBySection(id.toString());
      if (!config) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/home-config", async (req, res) => {
    try {
      const validatedData = insertHomeConfigurationSchema.parse(req.body);
      const config = await storage.createHomeConfiguration(validatedData);
      res.status(201).json(config);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/home-config/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertHomeConfigurationSchema.partial().parse(req.body);
      const config = await storage.updateHomeConfiguration(id, validatedData);
      if (!config) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res.json(config);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/home-config/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHomeConfiguration(id);
      if (!deleted) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Home Highlights Routes
  app.get("/api/home-highlights", async (req, res) => {
    try {
      const highlights = await storage.getAllHomeHighlights();
      res.json(highlights);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/home-highlights/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const highlight = await storage.getHomeHighlight(id);
      if (!highlight) {
        return res.status(404).json({ error: "Elemento destacado no encontrado" });
      }
      res.json(highlight);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/home-highlights", async (req, res) => {
    try {
      const validatedData = insertHomeHighlightsSchema.parse(req.body);
      const highlight = await storage.createHomeHighlight(validatedData);
      res.status(201).json(highlight);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/home-highlights/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertHomeHighlightsSchema.partial().parse(req.body);
      const highlight = await storage.updateHomeHighlight(id, validatedData);
      if (!highlight) {
        return res.status(404).json({ error: "Elemento destacado no encontrado" });
      }
      res.json(highlight);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/home-highlights/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHomeHighlight(id);
      if (!deleted) {
        return res.status(404).json({ error: "Elemento destacado no encontrado" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Home Banners Routes
  app.get("/api/home-banners", async (req, res) => {
    try {
      const banners = await storage.getAllHomeBanners();
      res.json(banners);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/home-banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const banner = await storage.getHomeBanner(id);
      if (!banner) {
        return res.status(404).json({ error: "Banner no encontrado" });
      }
      res.json(banner);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/home-banners", async (req, res) => {
    try {
      const validatedData = insertHomeBannersSchema.parse(req.body);
      const banner = await storage.createHomeBanner(validatedData);
      res.status(201).json(banner);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/home-banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertHomeBannersSchema.partial().parse(req.body);
      const banner = await storage.updateHomeBanner(id, validatedData);
      if (!banner) {
        return res.status(404).json({ error: "Banner no encontrado" });
      }
      res.json(banner);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/home-banners/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHomeBanner(id);
      if (!deleted) {
        return res.status(404).json({ error: "Banner no encontrado" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WordPress/MemberPress Integration API endpoints
  app.get("/api/integration-settings", async (req, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      res.json(settings || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/integration-settings", async (req, res) => {
    try {
      const validatedData = insertIntegrationSettingsSchema.parse(req.body);
      const settings = await storage.createIntegrationSettings(validatedData);
      res.status(201).json(settings);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/integration-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertIntegrationSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateIntegrationSettings(id, validatedData);
      
      if (!settings) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      
      res.json(settings);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/integration-settings/test-connection", async (req, res) => {
    try {
      const { wordpressUrl, apiKey, apiSecret } = req.body;
      
      if (!wordpressUrl || !apiKey || !apiSecret) {
        return res.status(400).json({ error: "URL de WordPress y credenciales son requeridos" });
      }

      const result = await storage.testWordPressConnection(wordpressUrl, { apiKey, apiSecret });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/integration-settings/sync-users", async (req, res) => {
    try {
      const result = await storage.syncWordPressUsers();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Complete registration endpoint
  app.post("/api/complete-registration", async (req, res) => {
    try {
      const { userData, companyData, membershipTypeId, selectedPeriod, paymentIntentId } = req.body;

      if (!userData || !companyData || !membershipTypeId || !paymentIntentId) {
        return res.status(400).json({ error: "Missing required data" });
      }

      // Create user account with temporary UID that will be updated by Firebase
      const user = await storage.createUser({
        email: userData.email,
        displayName: userData.nombre,
        firebaseUid: `pending_${Date.now()}_${userData.email}`, // Unique temporary identifier
        role: 'representante', // Always assign representative role for paid users
      });

      // Create company
      const company = await storage.createCompany({
        nombreEmpresa: companyData.nombreEmpresa,
        email1: companyData.email1,
        telefono1: companyData.telefono1,
        direccionFisica: companyData.direccionFisica,
        descripcionEmpresa: companyData.descripcionEmpresa,
        sitioWeb: companyData.sitioWeb,
        membershipTypeId: membershipTypeId,
        membershipPeriodicidad: selectedPeriod,
        formaPago: "tarjeta",
        fechaInicioMembresia: new Date().toISOString().split('T')[0],
        fechaFinMembresia: new Date(Date.now() + (selectedPeriod === 'anual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        userId: user.id,
        estado: "activo"
      });

      // Get membership type for amount
      const membershipType = await storage.getMembershipType(membershipTypeId);
      if (!membershipType) {
        throw new Error("Membership type not found");
      }

      // Calculate amount
      let amount = 0;
      if (membershipType.opcionesPrecios && Array.isArray(membershipType.opcionesPrecios)) {
        const pricingOption = membershipType.opcionesPrecios.find((option: any) => 
          option.periodicidad && option.periodicidad.toLowerCase() === selectedPeriod.toLowerCase()
        ) || membershipType.opcionesPrecios[0];
        amount = parseFloat(pricingOption?.costo?.toString() || "0") || 0;
      }

      // Create payment record
      await storage.createMembershipPayment({
        userId: user.id,
        companyId: company.id,
        membershipTypeId: membershipTypeId,
        stripePaymentIntentId: paymentIntentId,
        amount: amount.toString(),
        currency: "mxn",
        status: "succeeded"
      });

      // Automatically assign ANPR certificate for business memberships
      try {
        // Find the "Miembro Oficial ANPR México 2025" certificate
        const certificates = await storage.getAllCertificates();
        const anprCertificate = certificates.find((cert: any) => 
          cert.nombreCertificado === "Miembro Oficial ANPR México 2025"
        );

        if (anprCertificate) {
          // Create company-certificate association
          await storage.assignCertificateToCompany(company.id, anprCertificate.id, {
            fechaObtencion: new Date().toISOString().split('T')[0],
            asignadoPorAdmin: true,
            observaciones: `Certificado asignado automáticamente por membresía ${membershipType.nombrePlan}`
          });
          
          console.log(`ANPR certificate automatically assigned to company ${company.id}`);
        } else {
          console.warn("ANPR certificate not found - skipping automatic assignment");
        }
      } catch (certificateError) {
        console.error("Error assigning ANPR certificate:", certificateError);
        // Don't fail the registration if certificate assignment fails
      }

      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email, password: userData.password },
        company: { id: company.id, nombre: company.nombreEmpresa }
      });
    } catch (error: any) {
      console.error("Error completing registration:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Temporary login endpoint for newly registered users
  app.post("/api/login-temp", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("Login attempt for:", email);

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      console.log("Found user:", user ? { id: user.id, email: user.email, firebaseUid: user.firebaseUid } : null);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if this is a temporary user (not yet migrated to Firebase)
      if (!user.firebaseUid.startsWith('temp_') && !user.firebaseUid.startsWith('pending_')) {
        console.log("User has Firebase UID:", user.firebaseUid);
        return res.status(401).json({ error: "Please use Firebase login" });
      }

      // For temp users, skip password validation for now (in production, use proper hashing)
      console.log("Login successful for temp user:", user.id);
      
      // Convert role string to roleId for consistency
      let roleId = 2; // Default to representative role
      if (user.role === "admin") roleId = 1;
      else if (user.role === "representative" || user.role === "representante") roleId = 2;
      
      res.json({ 
        success: true,
        user: { 
          id: user.id, 
          email: user.email, 
          displayName: user.displayName,
          role: user.role,
          roleId: roleId,
          firebaseUid: user.firebaseUid
        }
      });
    } catch (error: any) {
      console.error("Error in temp login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Representative dashboard data
  app.get("/api/representative/dashboard/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log("Dashboard request for user:", userId);
      
      // Get user companies
      const companies = await storage.getCompaniesByUser(userId);
      console.log("Found companies:", companies.length);
      
      // Get payment history
      const payments = await storage.getUserPayments(userId);
      console.log("Found payments:", payments.length);
      
      // Get current membership info
      let currentMembership = null;
      if (companies.length > 0 && companies[0].membershipTypeId) {
        currentMembership = await storage.getMembershipType(companies[0].membershipTypeId);
      }

      const dashboardData = {
        companies: companies || [],
        payments: payments || [],
        currentMembership,
        stats: {
          totalCompanies: companies?.length || 0,
          activePayments: payments?.filter(p => p.status === 'succeeded').length || 0,
          nextRenewal: companies[0]?.fechaFinMembresia || null
        }
      };

      console.log("Sending dashboard data:", JSON.stringify(dashboardData, null, 2));
      res.json(dashboardData);
    } catch (error: any) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
