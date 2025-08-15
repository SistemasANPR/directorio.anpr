import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { insertUserSchema, insertCompanySchema, insertCategorySchema, insertTagSchema, insertMembershipTypeSchema, insertCertificateSchema, insertRoleSchema, insertOpinionSchema, insertMembershipPaymentSchema, insertProjectSchema, insertIntegrationSettingsSchema, insertPdfSettingsSchema, insertEmailConfigurationSchema, insertEmailTemplateSchema, insertFrontendConfigurationSchema } from "@shared/schema";
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

// Configuración específica para logotipos PDF
const pdfLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'pdf-logos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `pdf_logo_${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const uploadPdfLogo = multer({
  storage: pdfLogoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PNG, JPG, JPEG y SVG'));
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
      const { wordpressUser, ...companyData } = req.body;
      const parsedCompanyData = insertCompanySchema.parse(companyData);
      
      let userId = null;
      
      // Si se seleccionó un usuario de WordPress, crear/obtener usuario representante
      if (wordpressUser && wordpressUser.email && wordpressUser.username) {
        try {
          // Verificar si el usuario ya existe en el sistema por email
          let existingUser = await storage.getUserByEmail(wordpressUser.email);
          
          if (!existingUser) {
            // Crear nuevo usuario representante con datos de WordPress
            const newUserData = {
              firebaseUid: `wp_${wordpressUser.id}_${Date.now()}`, // UID único temporal para WordPress
              email: wordpressUser.email,
              displayName: wordpressUser.name || wordpressUser.username,
              role: "representante",
              photoURL: null,
              stripeCustomerId: null,
              stripeSubscriptionId: null,
              autoRenewal: false
            };
            
            existingUser = await storage.createUser(newUserData);
            console.log(`Created new representative user from WordPress: ${existingUser.email}`);
          } else if (existingUser && existingUser.role !== "representante" && existingUser.role !== "admin") {
            // Si existe pero no es representante ni admin, actualizarlo a representante
            const updatedUser = await storage.updateUser(existingUser.id, { role: "representante" });
            if (updatedUser) {
              existingUser = updatedUser;
              console.log(`Updated user ${existingUser.email} to representative role`);
            }
          }
          
          userId = existingUser?.id || null;
        } catch (userError) {
          console.error("Error creating/updating representative user:", userError);
          // Continuar con la creación de la empresa sin asignar usuario
        }
      }
      
      // Crear la empresa con el userId del representante si se pudo crear/encontrar
      const companyWithUser = {
        ...parsedCompanyData,
        userId: userId
      };
      
      const company = await storage.createCompany(companyWithUser);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating company:", error);
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

  // Tags API
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  app.get("/api/tags/in-use", async (req, res) => {
    try {
      const tagsInUse = await storage.getTagsInUse();
      res.json(tagsInUse);
    } catch (error) {
      console.error("Error fetching tags in use:", error);
      res.status(500).json({ error: "Failed to fetch tags in use" });
    }
  });

  app.post("/api/tags", async (req, res) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(validatedData);
      res.json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ error: "Failed to create tag" });
    }
  });

  app.put("/api/tags/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await storage.updateTag(id, validatedData);
      res.json(tag);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ error: "Failed to update tag" });
    }
  });

  app.delete("/api/tags/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTag(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ error: error.message || "Failed to delete tag" });
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
  app.get("/api/membership-types", async (req: any, res) => {
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
      
      // If marking this plan as most popular, unmark all others
      if (membershipTypeData.masPopular === true) {
        await storage.clearMostPopularStatus();
      }
      
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
      
      // Filter out admin-created certificates for non-admin users
      const userRole = req.query.userRole as string;
      const isAdmin = userRole === 'admin';
      
      const filteredCertificates = isAdmin 
        ? certificates 
        : certificates.filter(cert => (cert as any).creadoPorAdmin !== true);
      
      res.json(filteredCertificates);
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

  app.post("/api/opinions/:id/approve", async (req, res) => {
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

  app.post("/api/opinions/:id/reject", async (req, res) => {
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

  // Moderate opinion endpoint (handles both approve and reject)
  app.patch("/api/opinions/:id/moderate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { estado, comentarioModerador } = req.body;
      const approvedBy = req.user?.id || 1; // Default to admin user
      
      let opinion;
      if (estado === "aprobada") {
        opinion = await storage.approveOpinion(id, approvedBy);
      } else if (estado === "rechazada") {
        opinion = await storage.rejectOpinion(id, approvedBy);
      } else {
        return res.status(400).json({ error: "Invalid estado. Must be 'aprobada' or 'rechazada'" });
      }
      
      if (!opinion) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      
      res.json(opinion);
    } catch (error) {
      res.status(500).json({ error: "Failed to moderate opinion" });
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

  // Get company membership limits and current usage
  app.get("/api/companies/:companyId/limits", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ error: "Empresa no encontrada" });
      }

      if (!company.membershipTypeId) {
        return res.status(400).json({ error: "La empresa no tiene un plan de membresía asignado" });
      }

      const membershipType = await storage.getMembershipType(company.membershipTypeId);
      if (!membershipType) {
        return res.status(404).json({ error: "Plan de membresía no encontrado" });
      }

      // Get current usage
      const projects = await storage.getProjectsByCompany(companyId);
      const currentProjectCount = projects.length;
      const currentProductCount = Array.isArray(company.galeriaProductosUrls) 
        ? company.galeriaProductosUrls.length 
        : 0;

      const limits = {
        planName: membershipType.nombrePlan,
        projects: {
          limit: membershipType.cantidadProyectosAdmitidos || 0,
          current: currentProjectCount,
          available: Math.max(0, (membershipType.cantidadProyectosAdmitidos || 0) - currentProjectCount)
        },
        products: {
          limit: membershipType.cantidadProductosAdmitidos || 0,
          current: currentProductCount,
          available: Math.max(0, (membershipType.cantidadProductosAdmitidos || 0) - currentProductCount)
        }
      };

      res.json(limits);
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

      // La validación de límites ahora se maneja automáticamente en storage.createProject()
      // basada en el plan de membresía de la empresa

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

  // PUT endpoint without ID - creates or updates automatically
  app.put("/api/integration-settings", async (req, res) => {
    try {
      const validatedData = insertIntegrationSettingsSchema.partial().parse(req.body);
      
      // Check if settings already exist
      const existingSettings = await storage.getIntegrationSettings();
      
      let settings;
      if (existingSettings) {
        // Update existing settings
        settings = await storage.updateIntegrationSettings(existingSettings.id, validatedData);
      } else {
        // Create new settings
        const completeData = insertIntegrationSettingsSchema.parse(req.body);
        settings = await storage.createIntegrationSettings(completeData);
      }
      
      res.json(settings);
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

  app.get("/api/wordpress-users", async (req, res) => {
    try {
      const result = await storage.getWordPressUsers();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/debug-wordpress", async (req, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.json({ error: "Configuración de WordPress incompleta" });
      }

      const urls = [
        `${settings.wordpressUrl}/wp-json/wp/v2/users?per_page=10`,
        `${settings.wordpressUrl}/wp-json/wp/v2/users?per_page=10&context=edit`,
        `${settings.wordpressUrl}/wp-json/wp/v2/users?per_page=10&roles=all`,
      ];

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const results = {};

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });
          
          const data = await response.json();
          results[`test_${i + 1}_${response.status}`] = {
            url,
            status: response.status,
            count: Array.isArray(data) ? data.length : 'Not array',
            first_user: Array.isArray(data) && data.length > 0 ? data[0] : null,
            error: !response.ok ? data : null
          };
        } catch (error: any) {
          results[`test_${i + 1}_error`] = {
            url,
            error: error.message
          };
        }
      }

      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para obtener información detallada de membresía de un usuario específico de WordPress
  app.get("/api/wordpress-user-membership/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      // Obtener información básica del usuario
      const userResponse = await fetch(`${baseUrl}/wp-json/wp/v2/users/${userId}?context=edit`, {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        return res.status(404).json({ error: `Usuario no encontrado: ${userResponse.status}` });
      }

      const userData = await userResponse.json();

      // Intentar obtener información de membresías usando diferentes endpoints comunes
      const membershipEndpoints = [
        // PaidMembershipsPro (muy común en WordPress)
        `${baseUrl}/wp-json/pmpro/v1/members/${userId}`,
        // WooCommerce Memberships
        `${baseUrl}/wp-json/wc/v3/memberships?customer=${userId}`,
        // Ultimate Member
        `${baseUrl}/wp-json/um/v2/members/${userId}`,
        // Restrict Content Pro
        `${baseUrl}/wp-json/rcp/v1/members?user_id=${userId}`,
        // MemberPress
        `${baseUrl}/wp-json/mp/v1/members/${userId}`,
        // WishList Member
        `${baseUrl}/wp-json/wlm/v1/members/${userId}`,
      ];

      const membershipData: any = {};
      
      for (const [index, endpoint] of membershipEndpoints.entries()) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            membershipData[`plugin_${index + 1}`] = {
              url: endpoint,
              status: response.status,
              data: data,
              plugin: ['PaidMembershipsPro', 'WooCommerce Memberships', 'Ultimate Member', 'Restrict Content Pro', 'MemberPress', 'WishList Member'][index]
            };
          } else {
            membershipData[`plugin_${index + 1}`] = {
              url: endpoint,
              status: response.status,
              error: response.statusText,
              plugin: ['PaidMembershipsPro', 'WooCommerce Memberships', 'Ultimate Member', 'Restrict Content Pro', 'MemberPress', 'WishList Member'][index]
            };
          }
        } catch (error: any) {
          membershipData[`plugin_${index + 1}`] = {
            url: endpoint,
            error: error.message,
            plugin: ['PaidMembershipsPro', 'WooCommerce Memberships', 'Ultimate Member', 'Restrict Content Pro', 'MemberPress', 'WishList Member'][index]
          };
        }
      }

      // Verificar roles y capabilities del usuario que podrían indicar membresía
      const userRoles = userData.roles || [];
      const userCapabilities = userData.capabilities || {};
      
      // Buscar campos meta relacionados con membresías
      const membershipMetaFields = userData.meta || {};
      const potentialMembershipFields = Object.keys(membershipMetaFields).filter(key => 
        key.includes('member') || 
        key.includes('subscription') || 
        key.includes('plan') || 
        key.includes('level') ||
        key.includes('expire') ||
        key.includes('status')
      );

      res.json({
        user_basic_info: {
          id: userData.id,
          username: userData.username,
          name: userData.name,
          email: userData.email,
          roles: userRoles,
          capabilities: userCapabilities
        },
        membership_analysis: {
          potential_membership_meta: potentialMembershipFields.reduce((acc, field) => {
            acc[field] = membershipMetaFields[field];
            return acc;
          }, {} as any),
          roles_analysis: {
            has_member_role: userRoles.some((role: string) => role.includes('member')),
            has_subscriber_role: userRoles.includes('subscriber'),
            custom_roles: userRoles.filter((role: string) => !['subscriber', 'contributor', 'author', 'editor', 'administrator'].includes(role))
          }
        },
        plugin_responses: membershipData,
        recommendations: {
          note: "Para obtener información específica de membresía, necesitas identificar qué plugin de membresías usa tu WordPress",
          common_plugins: [
            "PaidMembershipsPro - Muy popular para membresías pagadas",
            "WooCommerce Memberships - Si usas WooCommerce",
            "Ultimate Member - Para perfiles de usuario avanzados",
            "Restrict Content Pro - Para contenido restringido",
            "MemberPress - Plugin premium popular",
            "WishList Member - Plugin de membresías completo"
          ]
        }
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Complete registration endpoint
  app.post("/api/complete-registration", async (req, res) => {
    try {
      const { userData, companyData, membershipTypeId, selectedPeriod, paymentIntentId } = req.body;

      if (!userData || !companyData || !membershipTypeId || !paymentIntentId) {
        return res.status(400).json({ 
          error: "Faltan datos requeridos para completar el registro",
          userMessage: "Por favor, completa todos los campos requeridos e intenta nuevamente."
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ 
          error: "El correo electrónico ya está registrado",
          userMessage: "Ya existe una cuenta con este correo electrónico. Si ya tienes una cuenta, inicia sesión en lugar de registrarte nuevamente. Si necesitas ayuda, contacta a soporte."
        });
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
      
      // Provide specific user-friendly error messages
      let userMessage = "Hubo un problema al procesar tu registro. Por favor, intenta nuevamente.";
      let statusCode = 500;
      
      if (error.code === '23505') { // Unique constraint violation
        if (error.constraint === 'users_email_unique') {
          userMessage = "Ya existe una cuenta con este correo electrónico. Si ya tienes una cuenta, inicia sesión en lugar de registrarte nuevamente.";
          statusCode = 400;
        } else if (error.constraint === 'companies_nombre_empresa_unique') {
          userMessage = "Ya existe una empresa registrada con este nombre. Por favor, utiliza un nombre diferente.";
          statusCode = 400;
        }
      } else if (error.code === '23503') { // Foreign key constraint
        userMessage = "Algunos datos seleccionados no son válidos. Por favor, verifica tu información e intenta nuevamente.";
        statusCode = 400;
      } else if (error.message?.includes('payment')) {
        userMessage = "Hubo un problema al procesar el pago. Por favor, verifica los datos de tu tarjeta e intenta nuevamente.";
        statusCode = 400;
      } else if (error.message?.includes('Stripe')) {
        userMessage = "Error en el procesamiento del pago. Por favor, contacta a soporte si el problema persiste.";
        statusCode = 400;
      }
      
      res.status(statusCode).json({ 
        error: error.message,
        userMessage: userMessage,
        supportContact: "Para obtener ayuda adicional, contacta a soporte en soporte@anpr.org.mx"
      });
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

  // Auto-renewal toggle endpoint
  app.patch("/api/users/:userId/auto-renewal", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { autoRenewal, subscriptionId } = req.body;

      // Update user auto-renewal preference
      const updatedUser = await storage.updateUser(userId, { autoRenewal });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // If there's a Stripe subscription, update it
      if (subscriptionId) {
        const config = await storage.getStripeConfiguration();
        if (config) {
          const stripe = new Stripe(config.secretKey, {
            apiVersion: "2023-10-16",
          });

          await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: !autoRenewal,
          });
        }
      }

      res.json({ 
        autoRenewal: updatedUser.autoRenewal,
        message: autoRenewal ? "Auto-renewal enabled" : "Auto-renewal disabled"
      });
    } catch (error) {
      console.error("Error updating auto-renewal:", error);
      res.status(500).json({ error: "Failed to update auto-renewal setting" });
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

  // PDF Settings API endpoints
  app.get("/api/pdf-settings", async (req, res) => {
    try {
      const settings = await storage.getPdfSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/pdf-settings", async (req, res) => {
    try {
      const validatedData = insertPdfSettingsSchema.partial().parse(req.body);
      const settings = await storage.updatePdfSettings(validatedData);
      res.json(settings);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Upload PDF logo endpoint
  app.post("/api/pdf-settings/upload-logo", uploadPdfLogo.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se seleccionó ningún archivo" });
      }

      // Validate file exists and is accessible
      const filePath = path.join(process.cwd(), 'uploads', 'pdf-logos', req.file.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(500).json({ error: "Error al guardar el archivo" });
      }

      res.json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: `/uploads/pdf-logos/${req.file.filename}`
      });
    } catch (error: any) {
      console.error("Error uploading PDF logo:", error);
      res.status(500).json({ error: error.message || "Error al subir el logotipo" });
    }
  });

  // System Settings image upload configuration
  const systemImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const type = req.body.type || 'logo';
      const uploadDir = type === 'logo' ? 'uploads/system-logos' : 'uploads/system-favicons';
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const type = req.body.type || 'logo';
      cb(null, `${type}_${timestamp}${ext}`);
    }
  });

  const uploadSystemImages = multer({
    storage: systemImageStorage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/svg+xml'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos PNG, JPG, JPEG o SVG'));
      }
    }
  });

  // System Settings image upload endpoint
  app.post("/api/system-settings/upload-image", uploadSystemImages.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo" });
      }

      // Validate file exists and is accessible
      const type = req.body.type || 'logo';
      const uploadDir = type === 'logo' ? 'uploads/system-logos' : 'uploads/system-favicons';
      const filePath = path.join(process.cwd(), uploadDir, req.file.filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(500).json({ error: "Error al guardar el archivo" });
      }

      res.json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        type: type,
        path: `/${uploadDir}/${req.file.filename}`
      });
    } catch (error: any) {
      console.error("Error uploading system image:", error);
      res.status(500).json({ error: error.message || "Error al subir la imagen" });
    }
  });

  // Email Configuration Routes
  app.get("/api/email-config", async (req, res) => {
    try {
      const config = await storage.getEmailConfiguration();
      res.json(config);
    } catch (error) {
      console.error("Error fetching email config:", error);
      res.status(500).json({ error: "Failed to fetch email configuration" });
    }
  });

  app.post("/api/email-config", async (req, res) => {
    try {
      const validatedData = insertEmailConfigurationSchema.parse(req.body);
      const config = await storage.saveEmailConfiguration(validatedData);
      res.json(config);
    } catch (error) {
      console.error("Error saving email config:", error);
      res.status(500).json({ error: "Failed to save email configuration" });
    }
  });

  app.post("/api/email-config/test", async (req, res) => {
    try {
      const validatedData = insertEmailConfigurationSchema.parse(req.body);
      const result = await storage.testEmailConfiguration(validatedData);
      res.json(result);
    } catch (error) {
      console.error("Error testing email config:", error);
      res.status(500).json({ error: "Failed to test email configuration" });
    }
  });

  // Email Templates Routes
  app.get("/api/email-templates", async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });

  app.post("/api/email-templates", async (req, res) => {
    try {
      const validatedData = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.saveEmailTemplate(validatedData);
      res.json(template);
    } catch (error) {
      console.error("Error saving email template:", error);
      res.status(500).json({ error: "Failed to save email template" });
    }
  });

  app.get("/api/email-templates/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const template = await storage.getEmailTemplateByType(type);
      res.json(template);
    } catch (error) {
      console.error("Error fetching email template:", error);
      res.status(500).json({ error: "Failed to fetch email template" });
    }
  });

  // Stripe Configuration Routes
  app.get("/api/stripe-configuration", async (req, res) => {
    try {
      const config = await storage.getStripeConfiguration();
      if (!config) {
        return res.json(null);
      }
      
      // Don't send the secret key to the frontend
      const { secretKey, ...safeConfig } = config;
      res.json(safeConfig);
    } catch (error) {
      console.error("Error fetching Stripe configuration:", error);
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.post("/api/stripe-configuration", async (req, res) => {
    try {
      const configSchema = z.object({
        publicKey: z.string().min(1),
        secretKey: z.string().min(1),
        webhookSecret: z.string().optional(),
        environment: z.enum(["test", "live"]),
        isActive: z.boolean(),
      });

      const validatedData = configSchema.parse(req.body);
      
      const existingConfig = await storage.getStripeConfiguration();
      let config;
      
      if (existingConfig) {
        config = await storage.updateStripeConfiguration(existingConfig.id, validatedData);
      } else {
        config = await storage.createStripeConfiguration(validatedData);
      }
      
      // Don't send the secret key back
      const { secretKey, ...safeConfig } = config!;
      res.json(safeConfig);
    } catch (error) {
      console.error("Error saving Stripe configuration:", error);
      res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  app.post("/api/stripe-configuration/test", async (req, res) => {
    try {
      const configSchema = z.object({
        publicKey: z.string().min(1),
        secretKey: z.string().min(1),
        webhookSecret: z.string().optional(),
        environment: z.enum(["test", "live"]),
        isActive: z.boolean(),
      });

      const validatedData = configSchema.parse(req.body);
      
      // Test connection with Stripe
      try {
        const testStripe = new Stripe(validatedData.secretKey, {
          apiVersion: "2023-10-16",
        });

        const account = await testStripe.accounts.retrieve();
        
        res.json({
          success: true,
          message: "Conexión exitosa con Stripe",
          details: {
            accountId: account.id,
            businessName: account.business_profile?.name || "N/A",
            country: account.country,
            currency: account.default_currency
          }
        });
      } catch (stripeError: any) {
        res.json({
          success: false,
          message: `Error de Stripe: ${stripeError.message}`,
        });
      }
    } catch (error) {
      console.error("Error testing Stripe connection:", error);
      res.status(500).json({ error: "Failed to test connection" });
    }
  });

  app.post("/api/stripe-configuration/sync-products", async (req, res) => {
    try {
      const config = await storage.getStripeConfiguration();
      if (!config) {
        return res.status(400).json({ error: "No Stripe configuration found" });
      }

      const syncStripe = new Stripe(config.secretKey, {
        apiVersion: "2023-10-16",
      });

      // Get all membership types
      const membershipTypes = await storage.getAllMembershipTypes();
      let syncedCount = 0;

      for (const membership of membershipTypes) {
        try {
          // Create or update product in Stripe
          let product;
          if (membership.stripeProductId) {
            // Update existing product
            product = await syncStripe.products.update(membership.stripeProductId, {
              name: membership.nombrePlan,
              description: membership.descripcionPlan || undefined,
              metadata: {
                membershipTypeId: membership.id.toString(),
              },
            });
          } else {
            // Create new product
            product = await syncStripe.products.create({
              name: membership.nombrePlan,
              description: membership.descripcionPlan || undefined,
              metadata: {
                membershipTypeId: membership.id.toString(),
              },
            });
          }

          // Create or update price for each pricing option
          if (membership.opcionesPrecios && Array.isArray(membership.opcionesPrecios)) {
            for (const option of membership.opcionesPrecios as any[]) {
              // Always recreate prices to ensure correct periodicidad
              const periodicidad = option.periodicidad.toLowerCase();
              const interval = periodicidad === "mensual" ? "month" :
                             periodicidad === "trimestral" ? "month" :
                             periodicidad === "semestral" ? "month" :
                             "year";
              
              const intervalCount = periodicidad === "trimestral" ? 3 :
                                   periodicidad === "semestral" ? 6 : 1;

              // Archive old price if it exists
              if (option.stripePriceId) {
                try {
                  await syncStripe.prices.update(option.stripePriceId, {
                    active: false
                  });
                  console.log(`Archived old price: ${option.stripePriceId}`);
                } catch (archiveError) {
                  console.log(`Could not archive price ${option.stripePriceId}, creating new one`);
                }
              }

              const price = await syncStripe.prices.create({
                product: product.id,
                unit_amount: Math.round(Number(option.costo) * 100), // Convert to cents
                currency: "mxn",
                recurring: {
                  interval: interval as any,
                  interval_count: intervalCount,
                },
                metadata: {
                  membershipTypeId: membership.id.toString(),
                  periodicidad: option.periodicidad,
                },
              });
              
              // Update the pricing option with new Stripe price ID
              option.stripePriceId = price.id;
              console.log(`Created new price for ${membership.nombrePlan} - ${option.periodicidad} (${interval}${intervalCount > 1 ? ` x${intervalCount}` : ''}): ${price.id}`);
            }
          }

          // Update membership type with Stripe IDs
          await storage.updateMembershipType(membership.id, {
            stripeProductId: product.id,
            opcionesPrecios: membership.opcionesPrecios,
          });

          syncedCount++;
        } catch (error) {
          console.error(`Error syncing membership ${membership.id}:`, error);
        }
      }

      res.json({
        success: true,
        synced: syncedCount,
        message: `Se sincronizaron ${syncedCount} productos con Stripe`,
      });
    } catch (error) {
      console.error("Error syncing products:", error);
      res.status(500).json({ error: "Failed to sync products" });
    }
  });

  // Frontend Configuration Routes
  app.get("/api/frontend-config", async (req, res) => {
    try {
      const config = await storage.getFrontendConfiguration();
      if (!config) {
        // Return default configuration if none exists
        res.json({
          id: 0,
          headerBackgroundColor: "#ffffff",
          headerTextColor: "#000000",
          siteName: "Directorio de Proveedores de Equipamiento Urbano",
          menuBackgroundColor: "#ffffff",
          menuTextColor: "#000000",
          menuHoverColor: "#3B82F6",
          showLoginButton: true,
          showRegisterButton: true,
          footerBackgroundColor: "#1e3a8a",
          footerTextColor: "#ffffff",
          showFooterLogo: true,
          companyName: "ANPR México",
          primaryColor: "#3B82F6",
          secondaryColor: "#10B981",
          accentColor: "#F59E0B",
          copyrightText: "© 2025 Todos los derechos reservados",
          menuItems: [
            { id: "1", label: "Inicio", href: "/", icon: "Home", isVisible: true, order: 1 },
            { id: "2", label: "Directorio", href: "/directorio", icon: "Building2", isVisible: true, order: 2 },
            { id: "3", label: "Planes", href: "/planes", icon: "CreditCard", isVisible: true, order: 3 }
          ],
          socialMediaConfig: [
            { id: "1", platform: "Facebook", url: "https://facebook.com/anprmexico", icon: "facebook", isVisible: true, order: 1 },
            { id: "2", platform: "Twitter", url: "https://twitter.com/anprmexico", icon: "twitter", isVisible: true, order: 2 },
            { id: "3", platform: "Instagram", url: "https://instagram.com/anprmexico", icon: "instagram", isVisible: true, order: 3 },
            { id: "4", platform: "YouTube", url: "https://youtube.com/anprmexico", icon: "youtube", isVisible: true, order: 4 },
            { id: "5", platform: "Spotify", url: "https://open.spotify.com/user/anprmexico", icon: "spotify", isVisible: true, order: 5 },
            { id: "6", platform: "WhatsApp", url: "https://wa.me/5299994440600", icon: "whatsapp", isVisible: true, order: 6 }
          ]
        });
      } else {
        res.json(config);
      }
    } catch (error) {
      console.error("Error fetching frontend configuration:", error);
      res.status(500).json({ error: "Failed to fetch frontend configuration" });
    }
  });

  app.post("/api/frontend-config", async (req, res) => {
    try {
      // Check if configuration exists
      const existingConfig = await storage.getFrontendConfiguration();
      
      if (existingConfig) {
        // Update existing configuration
        const updatedConfig = await storage.updateFrontendConfiguration(existingConfig.id, req.body);
        res.json(updatedConfig);
      } else {
        // Create new configuration
        const newConfig = await storage.createFrontendConfiguration(req.body);
        res.json(newConfig);
      }
    } catch (error) {
      console.error("Error saving frontend configuration:", error);
      res.status(500).json({ error: "Failed to save frontend configuration" });
    }
  });

  // Upload endpoints for frontend assets
  app.post("/api/frontend-config/upload-header-image", uploadImage.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }
      
      const imageUrl = `/uploads/images/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading header image:", error);
      res.status(500).json({ error: "Failed to upload header image" });
    }
  });

  app.post("/api/frontend-config/upload-footer-image", uploadImage.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }
      
      const imageUrl = `/uploads/images/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading footer image:", error);
      res.status(500).json({ error: "Failed to upload footer image" });
    }
  });

  app.post("/api/frontend-config/upload-logo", uploadImage.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No logo uploaded" });
      }
      
      const logoUrl = `/uploads/images/${req.file.filename}`;
      res.json({ logoUrl });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ error: "Failed to upload logo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
