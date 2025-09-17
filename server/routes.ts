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
      
      // Extract companyId if present in request body
      const { companyId, ...userData } = req.body;
      
      // Validate the user data (excluding companyId since it's not in the user schema)
      const validatedUserData = insertUserSchema.partial().parse(userData);
      
      // Handle company assignment if companyId is provided
      if (companyId !== undefined) {
        // If user is being assigned as representante and companyId is provided
        if (validatedUserData.role === "representante" && companyId) {
          // First, remove the user from any company they're currently assigned to
          const currentCompanies = await storage.getCompaniesByUser(id);
          for (const company of currentCompanies) {
            await storage.updateCompany(company.id, { userId: null });
          }
          
          // Then assign the user to the new company
          await storage.updateCompany(parseInt(companyId), { userId: id });
        } else if (validatedUserData.role !== "representante") {
          // If user is no longer a representante, remove them from any company
          const currentCompanies = await storage.getCompaniesByUser(id);
          for (const company of currentCompanies) {
            await storage.updateCompany(company.id, { userId: null });
          }
        }
      }
      
      // Update the user with the validated data
      const user = await storage.updateUser(id, validatedUserData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating user:", error);
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

  // Helper function to get user transactions from WordPress/MemberPress
  async function getUserTransactions(wordpressUserId: string): Promise<any[]> {
    try {
      const settings = await storage.getIntegrationSettings();
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        console.log('[User Transactions] No WordPress configuration found');
        return [];
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      // Obtener transacciones del usuario desde MemberPress
      const transactionsResponse = await fetch(`${baseUrl}/wp-json/mp/v1/transactions?member=${wordpressUserId}`, {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
      });

      if (!transactionsResponse.ok) {
        console.log(`[User Transactions] Failed to get transactions for user ${wordpressUserId}`);
        return [];
      }

      const transactions = await transactionsResponse.json();
      
      if (!Array.isArray(transactions)) {
        console.log(`[User Transactions] Invalid response format for user ${wordpressUserId}`);
        return [];
      }

      // Filtrar y organizar transacciones
      const validTransactions = transactions
        .filter((t: any) => t.status === 'complete' || t.status === 'confirmed')
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log(`[User Transactions] Found ${validTransactions.length} valid transactions for user ${wordpressUserId}`);
      return validTransactions;

    } catch (error: any) {
      console.error(`[User Transactions] Error getting transactions for user ${wordpressUserId}:`, error.message);
      return [];
    }
  }

  // Helper function to get transaction expiration date from WordPress/MemberPress
  async function getTransactionExpirationDate(wordpressUserId: string): Promise<string | null> {
    try {
      const settings = await storage.getIntegrationSettings();
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        console.log('[Transaction Expiration] No WordPress configuration found');
        return null;
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      // Obtener transacciones del usuario desde MemberPress
      const transactionsResponse = await fetch(`${baseUrl}/wp-json/mp/v1/transactions?member=${wordpressUserId}`, {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
      });

      if (!transactionsResponse.ok) {
        console.log(`[Transaction Expiration] Failed to get transactions for user ${wordpressUserId}`);
        return null;
      }

      const transactions = await transactionsResponse.json();
      
      if (!Array.isArray(transactions) || transactions.length === 0) {
        console.log(`[Transaction Expiration] No transactions found for user ${wordpressUserId}`);
        return null;
      }

      // Buscar transacciones exitosas con fechas de vencimiento
      const successfulTransactions = transactions
        .filter((t: any) => t.status === 'complete' || t.status === 'confirmed')
        .filter((t: any) => t.expires_at)
        .sort((a: any, b: any) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime());

      if (successfulTransactions.length > 0) {
        const latestExpirationDate = successfulTransactions[0].expires_at;
        console.log(`[Transaction Expiration] Found expiration date for user ${wordpressUserId}: ${latestExpirationDate}`);
        return latestExpirationDate;
      }

      console.log(`[Transaction Expiration] No valid expiration dates found for user ${wordpressUserId}`);
      return null;

    } catch (error: any) {
      console.error(`[Transaction Expiration] Error getting expiration date for user ${wordpressUserId}:`, error.message);
      return null;
    }
  }

  // Nueva ruta POST para crear empresas con archivos
  app.post("/api/companies/with-files", uploadImage.fields([
    { name: 'logoFile', maxCount: 1 },
    { name: 'fotoPortadaFile', maxCount: 1 },
    { name: 'catalogoFile', maxCount: 1 },
    { name: 'galeriaFiles', maxCount: 20 }
  ]), async (req, res) => {
    try {
      // TODO: Restaurar validación de administrador una vez que se arregle el header
      // console.log("Debug - req.user:", JSON.stringify(req.user, null, 2));
      // const isAdmin = req.user?.role === 'admin' || req.user?.roleId === 1;
      // console.log("Debug - isAdmin check:", isAdmin, "role:", req.user?.role, "roleId:", req.user?.roleId);
      // if (!isAdmin) {
      //   return res.status(403).json({ 
      //     error: "Acceso denegado", 
      //     message: "Solo los administradores pueden crear empresas" 
      //   });
      // }
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Procesar los datos del formulario
      let companyData: any = {};
      
      // Procesar campos normales del formulario
      for (const [key, value] of Object.entries(req.body)) {
        if (key !== 'logoFile' && key !== 'fotoPortadaFile' && key !== 'catalogoFile' && key !== 'galeriaFiles') {
          try {
            // Intentar parsear como JSON para arrays y objetos
            companyData[key] = JSON.parse(value as string);
            // DEBUG: Log ubicacionGeografica parsing specifically
            if (key === 'ubicacionGeografica') {
              console.log('[DEBUG] Server - ubicacionGeografica received:', {
                rawValue: value,
                parsedValue: companyData[key],
                type: typeof companyData[key]
              });
            }
          } catch {
            // Si no es JSON válido, usar como string
            companyData[key] = value;
            // DEBUG: Log failed JSON parsing for ubicacionGeografica
            if (key === 'ubicacionGeografica') {
              console.log('[DEBUG] Server - ubicacionGeografica JSON parse failed:', {
                rawValue: value,
                fallbackValue: companyData[key],
                type: typeof companyData[key]
              });
            }
          }
        }
      }
      
      // Procesar archivos de logo
      if (files?.logoFile?.[0]) {
        companyData.logotipoUrl = `/uploads/images/${files.logoFile[0].filename}`;
      }
      
      // Procesar archivos de foto de portada
      if (files?.fotoPortadaFile?.[0]) {
        companyData.fotoPortadaUrl = `/uploads/images/${files.fotoPortadaFile[0].filename}`;
      }
      
      // Procesar archivos de catálogo
      if (files?.catalogoFile?.[0]) {
        companyData.catalogoDigitalUrl = `/uploads/documents/${files.catalogoFile[0].filename}`;
      }
      
      // Procesar archivos de galería
      if (files?.galeriaFiles?.length > 0) {
        companyData.galeriaProductosUrls = files.galeriaFiles.map(file => `/uploads/images/${file.filename}`);
      }

      const { wordpressUser, ...companyDataToSave } = companyData;
      const parsedCompanyData = insertCompanySchema.parse(companyDataToSave);
      
      let userId = null;
      let transactionExpirationDate = null;

      // Si se seleccionó un usuario de WordPress, crear/obtener usuario representante
      if (wordpressUser && wordpressUser.email && wordpressUser.username) {
        try {
          // Obtener fecha de caducidad de transacción desde WordPress
          if (wordpressUser.id) {
            transactionExpirationDate = await getTransactionExpirationDate(wordpressUser.id.toString());
          }

          // Verificar si el usuario ya existe en el sistema por email
          let existingUser = await storage.getUserByEmail(wordpressUser.email);
          
          if (!existingUser) {
            // Crear nuevo usuario representante con datos de WordPress
            const newUserData = {
              firebaseUid: `wp_${wordpressUser.id}_${Date.now()}`,
              email: wordpressUser.email,
              displayName: wordpressUser.name || wordpressUser.username,
              role: "representante",
              photoURL: null,
              stripeCustomerId: null,
              stripeSubscriptionId: null,
              autoRenewal: false
            };
            
            existingUser = await storage.createUser(newUserData);
          }
          
          userId = existingUser?.id || null;
        } catch (userError) {
          console.error("Error creating/updating representative user:", userError);
        }
      }
      
      // Crear la empresa con el userId del representante si se pudo crear/encontrar
      let companyWithUser = {
        ...parsedCompanyData,
        userId: userId
      };

      // Si se obtuvo una fecha de caducidad de transacción, actualizar las fechas de vencimiento del plan
      if (transactionExpirationDate) {
        try {
          const expirationDate = new Date(transactionExpirationDate);
          const startDate = new Date(expirationDate);
          startDate.setFullYear(startDate.getFullYear() - 1);
          
          companyWithUser.fechaInicioMembresia = startDate.toISOString().split('T')[0];
          companyWithUser.fechaFinMembresia = expirationDate.toISOString().split('T')[0];
        } catch (dateError) {
          console.error('[Company Creation] Error processing transaction expiration date:', dateError);
        }
      }
      
      // Lógica automática para empresas con ubicación: asegurar que aparezcan en el mapa
      if (companyWithUser.ubicacionGeografica && (!companyWithUser.fechaFinMembresia || companyWithUser.fechaFinMembresia === '')) {
        const today = new Date();
        const oneYearFromNow = new Date(today);
        oneYearFromNow.setFullYear(today.getFullYear() + 1);
        
        companyWithUser.fechaInicioMembresia = today.toISOString().split('T')[0];
        companyWithUser.fechaFinMembresia = oneYearFromNow.toISOString().split('T')[0];
        companyWithUser.estado = 'activo';
        
        console.log(`[Auto-Activation] Company with location will be automatically activated:`);
        console.log(`[Auto-Activation] Start: ${companyWithUser.fechaInicioMembresia}`);
        console.log(`[Auto-Activation] End: ${companyWithUser.fechaFinMembresia}`);
      }
      
      const company = await storage.createCompany(companyWithUser);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company with files:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      // TODO: Restaurar validación de administrador una vez que se arregle el header
      // console.log("Debug - req.user:", JSON.stringify(req.user, null, 2));
      // const isAdmin = req.user?.role === 'admin' || req.user?.roleId === 1;
      // console.log("Debug - isAdmin check:", isAdmin, "role:", req.user?.role, "roleId:", req.user?.roleId);
      // if (!isAdmin) {
      //   return res.status(403).json({ 
      //     error: "Acceso denegado", 
      //     message: "Solo los administradores pueden crear empresas" 
      //   });
      // }
      const { wordpressUser, ...companyData } = req.body;
      const parsedCompanyData = insertCompanySchema.parse(companyData);
      
      let userId = null;
      
      let transactionExpirationDate = null;

      // Si se seleccionó un usuario de WordPress, crear/obtener usuario representante
      if (wordpressUser && wordpressUser.email && wordpressUser.username) {
        try {
          // Obtener fecha de caducidad de transacción desde WordPress
          if (wordpressUser.id) {
            transactionExpirationDate = await getTransactionExpirationDate(wordpressUser.id.toString());
          }

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
      let companyWithUser = {
        ...parsedCompanyData,
        userId: userId
      };

      // Si se obtuvo una fecha de caducidad de transacción, actualizar las fechas de vencimiento del plan
      if (transactionExpirationDate) {
        try {
          // Convertir la fecha de WordPress a formato que acepta nuestra base de datos
          const expirationDate = new Date(transactionExpirationDate);
          
          // Calcular fecha de inicio (un año antes de la caducidad)
          const startDate = new Date(expirationDate);
          startDate.setFullYear(startDate.getFullYear() - 1);
          
          companyWithUser.fechaInicioMembresia = startDate.toISOString().split('T')[0];
          companyWithUser.fechaFinMembresia = expirationDate.toISOString().split('T')[0];
          
          console.log(`[Company Creation] Updated membership dates from transaction:`);
          console.log(`[Company Creation] Start: ${companyWithUser.fechaInicioMembresia}`);
          console.log(`[Company Creation] End: ${companyWithUser.fechaFinMembresia}`);
          console.log(`[Company Creation] Source: WordPress transaction expiration`);
          
        } catch (dateError) {
          console.error('[Company Creation] Error processing transaction expiration date:', dateError);
          // Continuar con las fechas originales si hay error
        }
      }
      
      // Lógica automática para empresas con ubicación: asegurar que aparezcan en el mapa
      if (companyWithUser.ubicacionGeografica && (!companyWithUser.fechaFinMembresia || companyWithUser.fechaFinMembresia === '')) {
        const today = new Date();
        const oneYearFromNow = new Date(today);
        oneYearFromNow.setFullYear(today.getFullYear() + 1);
        
        companyWithUser.fechaInicioMembresia = today.toISOString().split('T')[0];
        companyWithUser.fechaFinMembresia = oneYearFromNow.toISOString().split('T')[0];
        companyWithUser.estado = 'activo';
        
        console.log(`[Auto-Activation] Company with location will be automatically activated:`);
        console.log(`[Auto-Activation] Start: ${companyWithUser.fechaInicioMembresia}`);
        console.log(`[Auto-Activation] End: ${companyWithUser.fechaFinMembresia}`);
      }
      
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

  // Nueva ruta PATCH para actualizar empresas con archivos
  app.patch("/api/companies/:id", uploadImage.fields([
    { name: 'logoFile', maxCount: 1 },
    { name: 'fotoPortadaFile', maxCount: 1 },
    { name: 'catalogoFile', maxCount: 1 },
    { name: 'galeriaFiles', maxCount: 20 }
  ]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Procesar los datos del formulario
      let updateData: any = {};
      
      // Procesar campos normales del formulario
      for (const [key, value] of Object.entries(req.body)) {
        if (key !== 'logoFile' && key !== 'fotoPortadaFile' && key !== 'catalogoFile' && key !== 'galeriaFiles') {
          try {
            // Intentar parsear como JSON para arrays y objetos
            updateData[key] = JSON.parse(value as string);
          } catch {
            // Si no es JSON válido, usar como string
            updateData[key] = value;
          }
        }
      }
      
      // Procesar archivos de logo
      if (files?.logoFile?.[0]) {
        updateData.logotipoUrl = `/uploads/images/${files.logoFile[0].filename}`;
      }
      
      // Procesar archivos de foto de portada
      if (files?.fotoPortadaFile?.[0]) {
        updateData.fotoPortadaUrl = `/uploads/images/${files.fotoPortadaFile[0].filename}`;
      }
      
      // Procesar archivos de catálogo
      if (files?.catalogoFile?.[0]) {
        updateData.catalogoDigitalUrl = `/uploads/documents/${files.catalogoFile[0].filename}`;
      }
      
      // Procesar archivos de galería
      if (files?.galeriaFiles?.length > 0) {
        const newImages = files.galeriaFiles.map(file => `/uploads/images/${file.filename}`);
        // Si ya existe galeriaProductosUrls en updateData, agregar las nuevas imágenes
        if (updateData.galeriaProductosUrls && Array.isArray(updateData.galeriaProductosUrls)) {
          updateData.galeriaProductosUrls = [...updateData.galeriaProductosUrls, ...newImages];
        } else {
          // Si no existe, usar solo las nuevas imágenes
          updateData.galeriaProductosUrls = newImages;
        }
      }

      // Validar datos con schema parcial
      const parsedData = insertCompanySchema.partial().parse(updateData);
      
      const company = await storage.updateCompany(id, parsedData);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error updating company with files:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { wordpressUser, ...companyData } = req.body;
      const parsedCompanyData = insertCompanySchema.partial().parse(companyData);
      
      let updatedData = { ...parsedCompanyData };
      let transactionExpirationDate = null;

      // Si se seleccionó un usuario de WordPress para asignar/cambiar representante
      if (wordpressUser && wordpressUser.email && wordpressUser.username) {
        try {
          // Obtener fecha de caducidad de transacción desde WordPress
          if (wordpressUser.id) {
            transactionExpirationDate = await getTransactionExpirationDate(wordpressUser.id.toString());
          }

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
            console.log(`[Update Company] Created new representative user from WordPress: ${existingUser.email}`);
          } else if (existingUser && existingUser.role !== "representante" && existingUser.role !== "admin") {
            // Si existe pero no es representante ni admin, actualizarlo a representante
            const updatedUser = await storage.updateUser(existingUser.id, { role: "representante" });
            if (updatedUser) {
              existingUser = updatedUser;
              console.log(`[Update Company] Updated user ${existingUser.email} to representative role`);
            }
          }
          
          // Asignar el usuario a la empresa
          if (existingUser) {
            updatedData.userId = existingUser.id;
          }

        } catch (userError) {
          console.error("[Update Company] Error creating/updating representative user:", userError);
          // Continuar con la actualización de la empresa sin asignar usuario
        }
      }

      // Si se obtuvo una fecha de caducidad de transacción, actualizar las fechas de vencimiento del plan
      if (transactionExpirationDate) {
        try {
          // Convertir la fecha de WordPress a formato que acepta nuestra base de datos
          const expirationDate = new Date(transactionExpirationDate);
          
          // Calcular fecha de inicio (un año antes de la caducidad)
          const startDate = new Date(expirationDate);
          startDate.setFullYear(startDate.getFullYear() - 1);
          
          updatedData.fechaInicioMembresia = startDate.toISOString().split('T')[0];
          updatedData.fechaFinMembresia = expirationDate.toISOString().split('T')[0];
          
          console.log(`[Update Company] Updated membership dates from transaction:`);
          console.log(`[Update Company] Start: ${updatedData.fechaInicioMembresia}`);
          console.log(`[Update Company] End: ${updatedData.fechaFinMembresia}`);
          console.log(`[Update Company] Source: WordPress transaction expiration`);
          
        } catch (dateError) {
          console.error('[Update Company] Error processing transaction expiration date:', dateError);
          // Continuar con las fechas originales si hay error
        }
      }

      const company = await storage.updateCompany(id, updatedData);
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

  app.post("/api/certificates", uploadImage.single('imageFile'), async (req, res) => {
    try {
      console.log("Datos recibidos para certificado:", req.body);
      console.log("Archivo recibido:", req.file);
      
      let certificateData: any = {};
      
      // Si hay archivo de imagen, procesarlo
      if (req.file) {
        certificateData.imagenUrl = `/uploads/images/${req.file.filename}`;
      }
      
      // Procesar los demás campos del formulario
      Object.entries(req.body).forEach(([key, value]) => {
        if (key !== 'imageFile') {
          if (key === 'membershipPlanIds') {
            try {
              certificateData[key] = JSON.parse(value as string);
            } catch (e) {
              certificateData[key] = value;
            }
          } else if (key === 'asignacionAutomatica') {
            certificateData[key] = value === 'true';
          } else {
            certificateData[key] = value;
          }
        }
      });
      
      // Validar los datos
      const validatedData = insertCertificateSchema.parse(certificateData);
      console.log("Datos validados:", validatedData);
      
      const certificate = await storage.createCertificate(validatedData);
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

  // Ruta PUT para actualizar certificados con archivos de imagen
  app.put("/api/certificates/:id", uploadImage.single('imageFile'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      let updateData: any = {};
      
      console.log('=== PUT Certificate Debug ===');
      console.log('Request body:', req.body);
      console.log('Has file:', !!req.file);
      console.log('Content-Type:', req.get('content-type'));
      
      // Si hay archivo de imagen, procesarlo
      if (req.file) {
        updateData.imagenUrl = `/uploads/images/${req.file.filename}`;
      }
      
      // Detectar si la request es FormData o JSON
      const isFormData = req.get('content-type')?.includes('multipart/form-data');
      
      if (isFormData) {
        // Procesar campos de FormData (cuando hay archivo)
        Object.entries(req.body).forEach(([key, value]) => {
          if (key !== 'imageFile') {
            if (key === 'membershipPlanIds') {
              try {
                updateData[key] = JSON.parse(value as string);
              } catch (e) {
                updateData[key] = value;
              }
            } else if (key === 'asignacionAutomatica') {
              updateData[key] = value === 'true';
            } else {
              updateData[key] = value;
            }
          }
        });
      } else {
        // Procesar datos JSON (cuando no hay archivo)
        Object.entries(req.body).forEach(([key, value]) => {
          if (key !== 'imageFile') {
            if (key === 'asignacionAutomatica') {
              // Convertir a boolean si viene como string o ya es boolean
              updateData[key] = typeof value === 'string' ? value === 'true' : Boolean(value);
            } else if (key === 'membershipPlanIds') {
              updateData[key] = Array.isArray(value) ? value : [];
            } else {
              updateData[key] = value;
            }
          }
        });
      }
      
      console.log('Processed updateData:', updateData);
      
      // Validar los datos
      const certificateData = insertCertificateSchema.partial().parse(updateData);
      console.log('Validated certificateData:', certificateData);
      
      // Actualizar certificado
      const certificate = await storage.updateCertificate(id, certificateData);
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }
      
      console.log('Updated certificate:', certificate);
      res.json(certificate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating certificate:", error);
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
      const { search } = req.query;
      const result = await storage.getWordPressUsers();
      
      if (search && typeof search === 'string') {
        const filtered = result.users.filter((user: any) => 
          user.username?.toLowerCase().includes(search.toLowerCase()) ||
          user.name?.toLowerCase().includes(search.toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toLowerCase())
        );
        return res.json({ ...result, users: filtered });
      }
      
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
  // Endpoint para obtener transacciones de un usuario específico
  app.get("/api/wordpress-user-transactions/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const transactions = await getUserTransactions(userId);
      
      if (transactions.length === 0) {
        return res.status(404).json({ 
          error: "No se encontraron transacciones válidas para este usuario",
          transactions: []
        });
      }

      res.json({ 
        transactions: transactions.map(t => ({
          id: t.id,
          status: t.status,
          amount: t.amount,
          total: t.total,
          created_at: t.created_at,
          expires_at: t.expires_at,
          membership_name: t.membership?.title || 'Sin plan',
          transaction_id: t.transaction_id
        })),
        count: transactions.length
      });

    } catch (error: any) {
      console.error(`Error fetching user transactions:`, error);
      res.status(500).json({ 
        error: "Error al obtener transacciones del usuario",
        details: error.message 
      });
    }
  });

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

      // Endpoints específicos de MemberPress
      const memberPressEndpoints = [
        // MemberPress API endpoints principales
        `${baseUrl}/wp-json/mp/v1/members/${userId}`,
        `${baseUrl}/wp-json/mp/v1/subscriptions?member=${userId}`,
        `${baseUrl}/wp-json/mp/v1/transactions?member=${userId}`,
        // Endpoints alternativos de MemberPress
        `${baseUrl}/wp-json/memberpress/v1/members/${userId}`,
        `${baseUrl}/wp-json/memberpress/v1/subscriptions?member_id=${userId}`,
        // Endpoint de metadatos del usuario que puede contener info de MemberPress
        `${baseUrl}/wp-json/wp/v2/users/${userId}/meta`,
      ];

      const membershipData: any = {};
      
      for (const [index, endpoint] of memberPressEndpoints.entries()) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const endpointNames = [
              'MemberPress Member Info',
              'MemberPress Subscriptions',
              'MemberPress Transactions',
              'MemberPress Alt Member Info',
              'MemberPress Alt Subscriptions',
              'User Meta (MemberPress data)'
            ];
            
            membershipData[`memberpress_${index + 1}`] = {
              url: endpoint,
              status: response.status,
              data: data,
              endpoint_name: endpointNames[index],
              has_data: Array.isArray(data) ? data.length > 0 : Object.keys(data || {}).length > 0
            };
          } else {
            membershipData[`memberpress_${index + 1}`] = {
              url: endpoint,
              status: response.status,
              error: response.statusText,
              endpoint_name: ['MemberPress Member Info', 'MemberPress Subscriptions', 'MemberPress Transactions', 'MemberPress Alt Member Info', 'MemberPress Alt Subscriptions', 'User Meta'][index]
            };
          }
        } catch (error: any) {
          membershipData[`memberpress_${index + 1}`] = {
            url: endpoint,
            error: error.message,
            endpoint_name: ['MemberPress Member Info', 'MemberPress Subscriptions', 'MemberPress Transactions', 'MemberPress Alt Member Info', 'MemberPress Alt Subscriptions', 'User Meta'][index]
          };
        }
      }

      // Verificar roles y capabilities del usuario que podrían indicar membresía
      const userRoles = userData.roles || [];
      const userCapabilities = userData.capabilities || {};
      
      // Analizar metadatos específicos de MemberPress
      const membershipMetaFields = userData.meta || {};
      
      // Campos específicos de MemberPress
      const memberPressFields = Object.keys(membershipMetaFields).filter(key => 
        key.includes('mepr') || 
        key.includes('memberpress') ||
        key.includes('mp_') ||
        key.startsWith('_mepr')
      );
      
      // Campos generales de membresía
      const generalMembershipFields = Object.keys(membershipMetaFields).filter(key => 
        key.includes('member') || 
        key.includes('subscription') || 
        key.includes('plan') || 
        key.includes('level') ||
        key.includes('expire') ||
        key.includes('status')
      );
      
      // Extraer información específica de MemberPress
      const memberPressAnalysis = {
        active_memberships: membershipMetaFields['_mepr_active_memberships'] || [],
        inactive_memberships: membershipMetaFields['_mepr_inactive_memberships'] || [],
        expired_memberships: membershipMetaFields['_mepr_expired_memberships'] || [],
        member_status: membershipMetaFields['mepr_member_status'] || null,
        subscription_ids: membershipMetaFields['_mepr_subscription_ids'] || [],
        transaction_ids: membershipMetaFields['_mepr_transaction_ids'] || [],
        last_login: membershipMetaFields['mepr_last_login_date'] || null,
        registration_date: membershipMetaFields['mepr_reg_date'] || null,
      };

      res.json({
        user_basic_info: {
          id: userData.id,
          username: userData.username,
          name: userData.name,
          email: userData.email,
          roles: userRoles,
          capabilities: userCapabilities
        },
        memberpress_analysis: memberPressAnalysis,
        membership_metadata: {
          memberpress_fields: memberPressFields.reduce((acc, field) => {
            acc[field] = membershipMetaFields[field];
            return acc;
          }, {} as any),
          general_membership_fields: generalMembershipFields.reduce((acc, field) => {
            acc[field] = membershipMetaFields[field];
            return acc;
          }, {} as any),
          roles_analysis: {
            has_member_role: userRoles.some((role: string) => role.includes('member')),
            has_subscriber_role: userRoles.includes('subscriber'),
            custom_roles: userRoles.filter((role: string) => !['subscriber', 'contributor', 'author', 'editor', 'administrator'].includes(role))
          }
        },
        memberpress_api_responses: membershipData,
        summary: {
          has_active_memberships: Array.isArray(memberPressAnalysis.active_memberships) ? memberPressAnalysis.active_memberships.length > 0 : false,
          has_expired_memberships: Array.isArray(memberPressAnalysis.expired_memberships) ? memberPressAnalysis.expired_memberships.length > 0 : false,
          has_subscriptions: Array.isArray(memberPressAnalysis.subscription_ids) ? memberPressAnalysis.subscription_ids.length > 0 : false,
          member_status: memberPressAnalysis.member_status,
          total_memberpress_fields: memberPressFields.length,
          api_endpoints_working: Object.values(membershipData).filter((response: any) => response.status === 200).length
        },
        recommendations: {
          note: "Este análisis está optimizado para MemberPress. Los datos mostrados incluyen información específica de membresías activas, expiradas y suscripciones.",
          next_steps: [
            "Verificar las respuestas de la API de MemberPress para obtener datos detallados",
            "Analizar los metadatos del usuario para encontrar información de membresías",
            "Usar los subscription_ids y transaction_ids para obtener más detalles si es necesario"
          ]
        }
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para buscar usuario por username y obtener su información de membresía
  app.get("/api/find-user-membership/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      // Buscar usuario por username (slug) o por email si contiene @
      let searchResponse;
      let users;
      
      if (username.includes('@')) {
        // Si contiene @, buscar por email
        searchResponse = await fetch(`${baseUrl}/wp-json/wp/v2/users?search=${encodeURIComponent(username)}&context=edit`, {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        // Si no contiene @, buscar por slug (username)
        searchResponse = await fetch(`${baseUrl}/wp-json/wp/v2/users?slug=${username}&context=edit`, {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
        });
      }

      if (!searchResponse.ok) {
        return res.status(404).json({ error: `Error buscando usuario: ${searchResponse.status}` });
      }

      users = await searchResponse.json();
      
      // Si es búsqueda por email y no encontramos exacto, filtrar por email exacto
      if (username.includes('@') && Array.isArray(users)) {
        users = users.filter((user: any) => user.email === username);
      }
      
      if (!Array.isArray(users) || users.length === 0) {
        return res.status(404).json({ error: `Usuario '${username}' no encontrado` });
      }

      const userData = users[0]; // Tomar el primer usuario encontrado
      const meta = userData.meta || {};

      // Extraer información específica de MemberPress
      const membershipStatus = {
        user_id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        active_memberships: meta['_mepr_active_memberships'] || [],
        inactive_memberships: meta['_mepr_inactive_memberships'] || [],
        expired_memberships: meta['_mepr_expired_memberships'] || [],
        subscription_ids: meta['_mepr_subscription_ids'] || [],
        transaction_ids: meta['_mepr_transaction_ids'] || [],
        member_status: meta['mepr_member_status'] || 'inactive',
        last_login: meta['mepr_last_login_date'] || null,
        registration_date: meta['mepr_reg_date'] || userData.date_registered,
        has_active_membership: Array.isArray(meta['_mepr_active_memberships']) && meta['_mepr_active_memberships'].length > 0,
        is_member: userData.roles?.includes('member') || false,
        roles: userData.roles || [],
        // Información adicional de MemberPress
        memberpress_meta: Object.keys(meta).filter(key => 
          key.includes('mepr') || key.includes('memberpress') || key.startsWith('_mepr')
        ).reduce((acc, key) => {
          acc[key] = meta[key];
          return acc;
        }, {} as any)
      };

      res.json(membershipStatus);

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para obtener usuarios con membresías activas en MemberPress
  app.get("/api/users-with-memberships", async (req, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      // Obtener usuarios con metadatos específicos de MemberPress
      const response = await fetch(`${baseUrl}/wp-json/wp/v2/users?per_page=50&context=edit&meta_key=_mepr_active_memberships`, {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return res.status(404).json({ error: `Error obteniendo usuarios: ${response.status}` });
      }

      const users = await response.json();
      
      // Filtrar usuarios que tengan metadatos de MemberPress
      const usersWithMemberships = users.filter((user: any) => {
        const meta = user.meta || {};
        return Object.keys(meta).some(key => 
          key.includes('mepr') || key.includes('memberpress') || key.startsWith('_mepr')
        );
      }).map((user: any) => {
        const meta = user.meta || {};
        return {
          user_id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          roles: user.roles,
          has_active_memberships: Array.isArray(meta['_mepr_active_memberships']) && meta['_mepr_active_memberships'].length > 0,
          active_memberships_count: meta['_mepr_active_memberships']?.length || 0,
          subscription_ids_count: meta['_mepr_subscription_ids']?.length || 0,
          transaction_ids_count: meta['_mepr_transaction_ids']?.length || 0,
          member_status: meta['mepr_member_status'] || 'inactive'
        };
      });

      res.json({ 
        total: usersWithMemberships.length, 
        users: usersWithMemberships 
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para obtener una muestra de usuarios existentes (para pruebas)
  app.get("/api/sample-users", async (req, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      // Obtener los primeros 20 usuarios para mostrar ejemplos
      const response = await fetch(`${baseUrl}/wp-json/wp/v2/users?per_page=20&context=edit`, {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return res.status(404).json({ error: `Error obteniendo usuarios: ${response.status}` });
      }

      const users = await response.json();
      
      // Mapear información básica de usuarios para ejemplos
      const sampleUsers = users.map((user: any) => ({
        user_id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        roles: user.roles
      }));

      res.json({ 
        total: sampleUsers.length, 
        users: sampleUsers 
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint simplificado para obtener solo el estado de membresía de MemberPress
  app.get("/api/memberpress-status/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      // Obtener información del usuario con metadatos
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
      const meta = userData.meta || {};

      // Extraer información específica de MemberPress del metadatos
      const membershipStatus = {
        user_id: userData.id,
        username: userData.username,
        email: userData.email,
        active_memberships: meta['_mepr_active_memberships'] || [],
        inactive_memberships: meta['_mepr_inactive_memberships'] || [],
        expired_memberships: meta['_mepr_expired_memberships'] || [],
        subscription_ids: meta['_mepr_subscription_ids'] || [],
        transaction_ids: meta['_mepr_transaction_ids'] || [],
        member_status: meta['mepr_member_status'] || 'inactive',
        last_login: meta['mepr_last_login_date'] || null,
        registration_date: meta['mepr_reg_date'] || userData.date_registered,
        has_active_membership: Array.isArray(meta['_mepr_active_memberships']) && meta['_mepr_active_memberships'].length > 0,
        is_member: userData.roles?.includes('member') || false,
      };

      res.json(membershipStatus);

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

  // Endpoint para consultar transacciones específicas de MemberPress
  app.get("/api/memberpress-transaction/:transactionId", async (req, res) => {
    try {
      const { transactionId } = req.params;
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      // Intentar obtener la transacción desde diferentes endpoints de MemberPress
      const endpoints = [
        `/wp-json/mp/v1/transactions/${transactionId}`,
        `/wp-json/wp/v2/mp_transaction/${transactionId}`,
        `/wp-json/memberpress/v1/transactions/${transactionId}`
      ];

      let transactionData = null;
      let successfulEndpoint = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            transactionData = await response.json();
            successfulEndpoint = endpoint;
            break;
          }
        } catch (error) {
          // Continuar con el siguiente endpoint
          continue;
        }
      }

      if (!transactionData) {
        return res.status(404).json({ 
          error: `Transacción ${transactionId} no encontrada`,
          attempted_endpoints: endpoints
        });
      }

      res.json({
        transaction_id: transactionId,
        endpoint_used: successfulEndpoint,
        transaction_data: transactionData
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para buscar transacciones por usuario
  app.get("/api/user-transactions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      // Buscar transacciones del usuario
      const endpoints = [
        `/wp-json/mp/v1/transactions?user=${userId}`,
        `/wp-json/memberpress/v1/transactions?user_id=${userId}`,
        `/wp-json/wp/v2/mp_transaction?author=${userId}`
      ];

      let transactionsData = [];
      let successfulEndpoint = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              transactionsData = data;
              successfulEndpoint = endpoint;
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }

      res.json({
        user_id: userId,
        endpoint_used: successfulEndpoint,
        transactions_found: transactionsData.length,
        transactions: transactionsData
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para obtener información completa de membresías incluyendo fechas de vencimiento
  app.get("/api/memberpress-memberships/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      // Buscar membresías del usuario en diferentes endpoints de MemberPress
      const membershipEndpoints = [
        `/wp-json/mp/v1/members/${userId}`,
        `/wp-json/mp/v1/subscriptions?user=${userId}`,
        `/wp-json/memberpress/v1/members/${userId}`,
        `/wp-json/wp/v2/mp_member?user=${userId}`
      ];

      let membershipData = {};
      let subscriptions = [];
      let memberData = null;

      // Intentar obtener datos de membresía desde diferentes endpoints
      for (const endpoint of membershipEndpoints) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            if (endpoint.includes('members')) {
              memberData = data;
            }
            
            if (endpoint.includes('subscriptions')) {
              subscriptions = Array.isArray(data) ? data : [data];
            }
            
            membershipData[endpoint] = { status: response.status, data };
          }
        } catch (error) {
          continue;
        }
      }

      // También obtener información de productos/niveles de membresía
      let membershipProducts = [];
      try {
        const productsResponse = await fetch(`${baseUrl}/wp-json/mp/v1/memberships`, {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (productsResponse.ok) {
          membershipProducts = await productsResponse.json();
        }
      } catch (error) {
        // Continuar sin productos si falla
      }

      // Obtener información del usuario con metadatos de MemberPress
      let userWithMeta = null;
      try {
        const userResponse = await fetch(`${baseUrl}/wp-json/wp/v2/users/${userId}?context=edit`, {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (userResponse.ok) {
          userWithMeta = await userResponse.json();
        }
      } catch (error) {
        // Continuar sin metadatos si falla
      }

      // Procesar y estructurar la información de membresía
      const processedMembership = {
        user_id: userId,
        user_info: userWithMeta ? {
          name: userWithMeta.name,
          email: userWithMeta.email,
          username: userWithMeta.username
        } : null,
        
        // Información de membresía activa
        active_memberships: [],
        expired_memberships: [],
        subscriptions: subscriptions,
        
        // Metadatos relevantes de MemberPress
        memberpress_metadata: userWithMeta?.meta ? Object.keys(userWithMeta.meta)
          .filter(key => key.includes('mepr') || key.includes('memberpress'))
          .reduce((acc, key) => {
            acc[key] = userWithMeta.meta[key];
            return acc;
          }, {}) : {},
          
        // Información de productos disponibles
        available_membership_products: membershipProducts,
        
        // Respuestas de endpoints consultados
        api_responses: membershipData
      };

      // Procesar fechas de vencimiento si están disponibles en metadatos
      if (userWithMeta?.meta) {
        const meta = userWithMeta.meta;
        
        // Buscar fechas de vencimiento en diferentes campos
        const expirationFields = [
          'mepr_expires_at',
          '_mepr_expires_at',
          'memberpress_expires',
          'membership_expires',
          'mepr_expiration'
        ];
        
        for (const field of expirationFields) {
          if (meta[field]) {
            processedMembership.expiration_date = meta[field];
            processedMembership.expiration_source = field;
            break;
          }
        }
        
        // Buscar IDs de membresías activas y mapear con productos
        if (meta['_mepr_active_memberships']) {
          const activeMembershipIds = Array.isArray(meta['_mepr_active_memberships']) 
            ? meta['_mepr_active_memberships'] 
            : [meta['_mepr_active_memberships']];
            
          processedMembership.active_memberships = activeMembershipIds.map(id => {
            const product = membershipProducts.find(p => p.id == id);
            return {
              membership_id: id,
              product_info: product || null
            };
          });
        }
      }

      res.json(processedMembership);

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para listar todas las membresías/productos disponibles en MemberPress
  app.get("/api/memberpress-products", async (req, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      console.log('[MemberPress Products] Consultando productos disponibles...');

      // Endpoints para obtener productos de membresía
      const productEndpoints = [
        '/wp-json/mp/v1/memberships',
        '/wp-json/mp/v1/products',
        '/wp-json/memberpress/v1/memberships',
        '/wp-json/wp/v2/mp_membership',
        '/wp-json/wp/v2/posts?post_type=memberpressproduct'
      ];

      const allProducts = {};
      let consolidatedProducts = [];

      // Consultar todos los endpoints disponibles
      for (const endpoint of productEndpoints) {
        try {
          console.log(`[MemberPress Products] Consultando: ${baseUrl}${endpoint}`);
          
          const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`[MemberPress Products] Éxito en ${endpoint}:`, Array.isArray(data) ? `${data.length} items` : 'objeto');
            
            allProducts[endpoint] = {
              status: response.status,
              data: data,
              count: Array.isArray(data) ? data.length : 1
            };

            // Consolidar productos únicos
            if (Array.isArray(data)) {
              consolidatedProducts = [...consolidatedProducts, ...data];
            } else if (data && typeof data === 'object') {
              consolidatedProducts.push(data);
            }
          } else {
            console.log(`[MemberPress Products] Error ${response.status} en ${endpoint}`);
            allProducts[endpoint] = {
              status: response.status,
              error: await response.text()
            };
          }
        } catch (error: any) {
          console.log(`[MemberPress Products] Excepción en ${endpoint}:`, error.message);
          allProducts[endpoint] = {
            error: error.message
          };
        }
      }

      // También consultar transacciones para ver qué productos se han vendido
      let transactionProducts = [];
      try {
        console.log('[MemberPress Products] Consultando transacciones...');
        const transResponse = await fetch(`${baseUrl}/wp-json/mp/v1/transactions?per_page=50`, {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
        });

        if (transResponse.ok) {
          const transactions = await transResponse.json();
          console.log(`[MemberPress Products] Encontradas ${transactions.length} transacciones`);
          
          // Extraer IDs de productos únicos de las transacciones
          const productIds = [...new Set(transactions.map((t: any) => t.product_id || t.membership_id).filter(Boolean))];
          transactionProducts = productIds.map((id: any) => ({ 
            id, 
            source: 'transaction',
            found_in_transactions: transactions.filter((t: any) => (t.product_id || t.membership_id) == id).length 
          }));
        }
      } catch (error: any) {
        console.log('[MemberPress Products] Error consultando transacciones:', error.message);
      }

      // Deduplicar productos por ID
      const uniqueProducts = consolidatedProducts.reduce((acc: any[], product: any) => {
        const existingIndex = acc.findIndex(p => p.id === product.id);
        if (existingIndex === -1) {
          acc.push(product);
        } else {
          // Mergear información si el producto ya existe
          acc[existingIndex] = { ...acc[existingIndex], ...product };
        }
        return acc;
      }, []);

      console.log(`[MemberPress Products] Total productos únicos encontrados: ${uniqueProducts.length}`);

      const result = {
        summary: {
          total_unique_products: uniqueProducts.length,
          endpoints_queried: productEndpoints.length,
          successful_endpoints: Object.values(allProducts).filter((p: any) => p.status === 200).length,
          transaction_product_ids: transactionProducts.length
        },
        products: uniqueProducts,
        products_from_transactions: transactionProducts,
        raw_api_responses: allProducts,
        endpoints_attempted: productEndpoints
      };

      res.json(result);

    } catch (error: any) {
      console.error('[MemberPress Products] Error general:', error.message);
      res.status(500).json({ error: error.message, details: error.stack });
    }
  });

  // Endpoint para acceder directamente a la API de MemberPress para membresías específicas de usuario
  app.get("/api/memberpress-direct/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      console.log(`[MemberPress Direct] Consultando membresías directas para usuario ${userId}`);

      // Endpoints específicos de MemberPress para membresías de usuario
      const membershipEndpoints = [
        `/wp-json/mp/v1/members/${userId}`,
        `/wp-json/mp/v1/subscriptions?member=${userId}`,
        `/wp-json/mp/v1/transactions?member=${userId}`,
        `/wp-json/mp/v1/members/${userId}/subscriptions`,
        `/wp-json/mp/v1/members/${userId}/transactions`,
      ];

      const results = {};
      
      // Consultar cada endpoint específico de MemberPress
      for (const endpoint of membershipEndpoints) {
        try {
          console.log(`[MemberPress Direct] Consultando: ${baseUrl}${endpoint}`);
          
          const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`[MemberPress Direct] Éxito en ${endpoint}:`, Array.isArray(data) ? `${data.length} items` : 'objeto');
            
            results[endpoint] = {
              status: response.status,
              data: data,
              count: Array.isArray(data) ? data.length : 1
            };
          } else {
            const errorText = await response.text();
            console.log(`[MemberPress Direct] Error ${response.status} en ${endpoint}:`, errorText);
            results[endpoint] = {
              status: response.status,
              error: errorText
            };
          }
        } catch (error: any) {
          console.log(`[MemberPress Direct] Excepción en ${endpoint}:`, error.message);
          results[endpoint] = {
            error: error.message
          };
        }
      }

      // También intentar obtener información de membresía a través de metadatos del usuario
      let userMetadata = null;
      try {
        console.log(`[MemberPress Direct] Obteniendo metadatos del usuario ${userId}`);
        const userResponse = await fetch(`${baseUrl}/wp-json/wp/v2/users/${userId}?context=edit`, {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          userMetadata = {
            basic_info: {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              username: userData.username
            },
            memberpress_meta: Object.keys(userData.meta || {})
              .filter(key => key.includes('mepr') || key.includes('memberpress'))
              .reduce((acc: any, key) => {
                acc[key] = userData.meta[key];
                return acc;
              }, {}),
            all_meta: userData.meta
          };
        }
      } catch (error: any) {
        console.log('[MemberPress Direct] Error obteniendo metadatos del usuario:', error.message);
      }

      // Consolidar información de membresía encontrada
      const consolidatedInfo = {
        user_id: userId,
        user_metadata: userMetadata,
        
        // Información de membresía directa de MemberPress
        member_info: results[`/wp-json/mp/v1/members/${userId}`]?.data || null,
        subscriptions: results[`/wp-json/mp/v1/subscriptions?member=${userId}`]?.data || [],
        transactions: results[`/wp-json/mp/v1/transactions?member=${userId}`]?.data || [],
        
        // Respuestas completas de todos los endpoints
        raw_responses: results,
        
        // Análisis de datos encontrados
        analysis: {
          has_member_record: !!results[`/wp-json/mp/v1/members/${userId}`]?.data,
          subscription_count: Array.isArray(results[`/wp-json/mp/v1/subscriptions?member=${userId}`]?.data) 
            ? results[`/wp-json/mp/v1/subscriptions?member=${userId}`].data.length : 0,
          transaction_count: Array.isArray(results[`/wp-json/mp/v1/transactions?member=${userId}`]?.data) 
            ? results[`/wp-json/mp/v1/transactions?member=${userId}`].data.length : 0,
          endpoints_successful: Object.values(results).filter((r: any) => r.status === 200).length,
          endpoints_failed: Object.values(results).filter((r: any) => r.status !== 200).length
        }
      };

      // Extraer fechas de vencimiento de múltiples fuentes
      if (consolidatedInfo.member_info) {
        const memberData = consolidatedInfo.member_info;
        if (memberData.expires_at) {
          consolidatedInfo.analysis.expiration_date = memberData.expires_at;
          consolidatedInfo.analysis.expiration_source = 'member_record';
        }
      }

      // Extraer fechas de vencimiento de suscripciones
      if (consolidatedInfo.subscriptions && consolidatedInfo.subscriptions.length > 0) {
        consolidatedInfo.subscriptions.forEach((subscription: any, index: number) => {
          if (subscription.expires_at) {
            consolidatedInfo.analysis[`subscription_${index}_expires`] = subscription.expires_at;
          }
          if (subscription.next_billing_at) {
            consolidatedInfo.analysis[`subscription_${index}_next_billing`] = subscription.next_billing_at;
          }
          if (subscription.status) {
            consolidatedInfo.analysis[`subscription_${index}_status`] = subscription.status;
          }
        });
      }

      // Analizar transacciones para extraer información de productos y fechas
      if (consolidatedInfo.transactions && consolidatedInfo.transactions.length > 0) {
        consolidatedInfo.analysis.transaction_analysis = consolidatedInfo.transactions.map((transaction: any) => {
          return {
            id: transaction.id,
            status: transaction.status,
            amount: transaction.amount,
            created_at: transaction.created_at,
            expires_at: transaction.expires_at,
            product_id: transaction.product_id,
            membership_id: transaction.membership_id,
            // Extraer información del producto si está disponible
            product_title: transaction.product?.post_title || transaction.title || null,
            product_name: transaction.product?.post_name || transaction.name || null,
            product_content: transaction.product?.post_content || null,
            // Información de fechas importantes
            gateway: transaction.gateway,
            subscription_id: transaction.subscription_id
          };
        });

        // Encontrar la transacción más reciente exitosa para fecha de vencimiento
        const successfulTransactions = consolidatedInfo.transactions
          .filter((t: any) => t.status === 'complete' || t.status === 'confirmed')
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (successfulTransactions.length > 0) {
          const latestTransaction = successfulTransactions[0];
          if (latestTransaction.expires_at) {
            consolidatedInfo.analysis.latest_transaction_expires = latestTransaction.expires_at;
            consolidatedInfo.analysis.latest_transaction_id = latestTransaction.id;
            consolidatedInfo.analysis.latest_transaction_amount = latestTransaction.amount;
            consolidatedInfo.analysis.latest_transaction_created = latestTransaction.created_at;
          }
        }

        // Buscar todas las transacciones con fechas de vencimiento válidas
        const transactionsWithExpiration = consolidatedInfo.transactions
          .filter((t: any) => t.expires_at && (t.status === 'complete' || t.status === 'confirmed'))
          .sort((a: any, b: any) => new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime());

        if (transactionsWithExpiration.length > 0) {
          consolidatedInfo.analysis.active_transaction_expires = transactionsWithExpiration[0].expires_at;
          consolidatedInfo.analysis.active_transaction_id = transactionsWithExpiration[0].id;
        }
      }

      // Buscar fechas de vencimiento en metadatos del usuario
      if (userMetadata?.memberpress_meta) {
        const meta = userMetadata.memberpress_meta;
        const expirationFields = ['mepr_expires_at', '_mepr_expires_at', 'memberpress_expires', 'mepr_expiration', '_mepr_expiration'];
        
        for (const field of expirationFields) {
          if (meta[field]) {
            consolidatedInfo.analysis.meta_expiration_date = meta[field];
            consolidatedInfo.analysis.meta_expiration_source = field;
            break;
          }
        }
      }

      // Buscar fechas en metadatos generales que podrían contener información de vencimiento
      if (userMetadata?.all_meta) {
        const allMeta = userMetadata.all_meta;
        const additionalExpirationFields = [
          'membership_expires', 'membership_expiry', 'member_expires', 
          'expires', 'expiry_date', 'expiration_date'
        ];
        
        for (const field of additionalExpirationFields) {
          if (allMeta[field]) {
            consolidatedInfo.analysis[`meta_${field}`] = allMeta[field];
          }
        }
      }

      console.log(`[MemberPress Direct] Análisis completo para usuario ${userId}:`, consolidatedInfo.analysis);

      res.json(consolidatedInfo);

    } catch (error: any) {
      console.error('[MemberPress Direct] Error general:', error.message);
      res.status(500).json({ error: error.message, details: error.stack });
    }
  });

  // Endpoint específico para buscar membresías por términos específicos
  app.get("/api/memberpress-search-memberships", async (req, res) => {
    try {
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      console.log(`[MemberPress Search] Buscando membresías específicas...`);

      // Búsquedas específicas para encontrar las membresías que necesitamos
      const searchQueries = [
        { term: "profesional", endpoint: "/wp-json/wp/v2/posts?search=profesional&per_page=100" },
        { term: "empresarial", endpoint: "/wp-json/wp/v2/posts?search=empresarial&per_page=100" },
        { term: "institucional", endpoint: "/wp-json/wp/v2/posts?search=institucional&per_page=100" },
        { term: "membresía", endpoint: "/wp-json/wp/v2/posts?search=membresía&per_page=100" },
        { term: "membership", endpoint: "/wp-json/wp/v2/posts?search=membership&per_page=100" },
      ];

      // También buscar en tipos de post específicos
      const postTypeEndpoints = [
        "/wp-json/wp/v2/posts?post_type=memberpressproduct&per_page=100",
        "/wp-json/wp/v2/posts?post_type=product&per_page=100", 
        "/wp-json/wp/v2/posts?per_page=100",
        "/wp-json/mp/v1/memberships",
      ];

      const searchResults = {};
      const foundMemberships = [];

      // Buscar por términos específicos
      for (const query of searchQueries) {
        try {
          console.log(`[MemberPress Search] Buscando "${query.term}": ${baseUrl}${query.endpoint}`);
          
          const response = await fetch(`${baseUrl}${query.endpoint}`, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`[MemberPress Search] "${query.term}" encontró ${Array.isArray(data) ? data.length : 1} resultados`);
            
            searchResults[query.term] = {
              endpoint: query.endpoint,
              status: response.status,
              results: Array.isArray(data) ? data : [data],
              count: Array.isArray(data) ? data.length : 1
            };

            // Analizar resultados para membresías específicas
            const results = Array.isArray(data) ? data : [data];
            for (const item of results) {
              const title = item.title?.rendered || item.title || item.name || '';
              const content = item.content?.rendered || item.content || '';
              const excerpt = item.excerpt?.rendered || item.excerpt || '';
              
              // Buscar en título y contenido
              const searchText = `${title} ${content} ${excerpt}`.toLowerCase();
              
              if (searchText.includes('profesional') || 
                  searchText.includes('empresarial') || 
                  searchText.includes('institucional')) {
                
                foundMemberships.push({
                  id: item.id,
                  title: title,
                  content: content.substring(0, 200),
                  type: item.type || 'post',
                  status: item.status,
                  date: item.date,
                  price: item.meta?._price || item.price,
                  membership_type: searchText.includes('profesional') ? 'Profesional' :
                                   searchText.includes('empresarial') ? 'Empresarial' :
                                   searchText.includes('institucional') ? 'Institucional' : 'Otra',
                  found_in_search: query.term,
                  link: item.link
                });
              }
            }
          } else {
            console.log(`[MemberPress Search] Error ${response.status} en "${query.term}"`);
            searchResults[query.term] = {
              endpoint: query.endpoint,
              status: response.status,
              error: await response.text()
            };
          }
        } catch (error: any) {
          console.log(`[MemberPress Search] Excepción en "${query.term}":`, error.message);
          searchResults[query.term] = {
            endpoint: query.endpoint,
            error: error.message
          };
        }
      }

      // Buscar en endpoints de tipos de post específicos
      for (const endpoint of postTypeEndpoints) {
        try {
          console.log(`[MemberPress Search] Consultando tipo de post: ${baseUrl}${endpoint}`);
          
          const response = await fetch(`${baseUrl}${endpoint}`, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`[MemberPress Search] Tipo de post encontró ${Array.isArray(data) ? data.length : 1} resultados`);
            
            const key = endpoint.split('/').pop() || 'unknown';
            searchResults[key] = {
              endpoint: endpoint,
              status: response.status,
              results: Array.isArray(data) ? data : [data],
              count: Array.isArray(data) ? data.length : 1
            };

            // Analizar estos resultados también
            const results = Array.isArray(data) ? data : [data];
            for (const item of results) {
              const title = item.title?.rendered || item.title || item.name || '';
              const content = item.content?.rendered || item.content || '';
              
              const searchText = `${title} ${content}`.toLowerCase();
              
              if ((searchText.includes('profesional') || 
                   searchText.includes('empresarial') || 
                   searchText.includes('institucional')) &&
                  !foundMemberships.find(m => m.id === item.id)) {
                
                foundMemberships.push({
                  id: item.id,
                  title: title,
                  content: content.substring(0, 200),
                  type: item.type || 'membership',
                  status: item.status,
                  date: item.date,
                  price: item.meta?._price || item.price,
                  membership_type: searchText.includes('profesional') ? 'Profesional' :
                                   searchText.includes('empresarial') ? 'Empresarial' :
                                   searchText.includes('institucional') ? 'Institucional' : 'Otra',
                  found_in_endpoint: endpoint,
                  link: item.link
                });
              }
            }
          }
        } catch (error: any) {
          console.log(`[MemberPress Search] Error en endpoint ${endpoint}:`, error.message);
        }
      }

      // Crear resumen de resultados
      const summary = {
        total_searches: searchQueries.length + postTypeEndpoints.length,
        successful_searches: Object.values(searchResults).filter((r: any) => r.status === 200).length,
        specific_memberships_found: foundMemberships.length,
        profesional_found: foundMemberships.filter(m => m.membership_type === 'Profesional').length,
        empresarial_found: foundMemberships.filter(m => m.membership_type === 'Empresarial').length,
        institucional_found: foundMemberships.filter(m => m.membership_type === 'Institucional').length
      };

      console.log(`[MemberPress Search] Resumen: ${JSON.stringify(summary)}`);

      res.json({
        summary,
        found_memberships: foundMemberships,
        search_results: searchResults,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('[MemberPress Search] Error general:', error.message);
      res.status(500).json({ error: error.message, details: error.stack });
    }
  });

  // Endpoint para obtener perfil de PeepSo de un usuario de WordPress
  app.get("/api/peepso-profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      console.log(`[PeepSo Profile] Obteniendo perfil de PeepSo para usuario ${userId}`);

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
      console.log(`[PeepSo Profile] Usuario básico obtenido: ${userData.username}`);

      // Intentar obtener datos de PeepSo a través de diferentes endpoints posibles
      const peepsoEndpoints = [
        // Endpoint directo de PeepSo (si existe)
        `${baseUrl}/wp-json/peepso/v1/users/${userId}`,
        `${baseUrl}/wp-json/peepso/v1/profile/${userId}`,
        // Endpoints alternativos
        `${baseUrl}/wp-json/peepso-api/v1/users/${userId}`,
        `${baseUrl}/wp-json/peepso-api/v1/profile/${userId}`,
      ];

      let peepsoData = null;
      let successfulEndpoint = null;

      for (const endpoint of peepsoEndpoints) {
        try {
          console.log(`[PeepSo Profile] Intentando endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            peepsoData = data;
            successfulEndpoint = endpoint;
            console.log(`[PeepSo Profile] Datos obtenidos exitosamente de: ${endpoint}`);
            break;
          }
        } catch (error) {
          console.log(`[PeepSo Profile] Error en endpoint ${endpoint}:`, error.message);
        }
      }

      // Si no se pudieron obtener datos de PeepSo, buscar en los metadatos del usuario
      const userMeta = userData.meta || {};
      const peepsoFields = Object.keys(userMeta).filter(key => 
        key.includes('peepso') || key.includes('ps_') || key.startsWith('_peepso')
      );

      // Campos comunes de perfil social que PeepSo podría usar
      const socialFields = Object.keys(userMeta).filter(key => 
        key.includes('facebook') || key.includes('twitter') || key.includes('instagram') || 
        key.includes('linkedin') || key.includes('social') || key.includes('profile')
      );

      const peepsoProfile = {
        user_id: userData.id,
        username: userData.username,
        display_name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_urls ? userData.avatar_urls['96'] || userData.avatar_urls['48'] : null,
        profile_url: `${baseUrl}/profile/${userData.username}`, // URL típica de perfil en PeepSo
        peepso_api_data: peepsoData,
        successful_endpoint: successfulEndpoint,
        // Metadatos de PeepSo encontrados
        peepso_metadata: peepsoFields.reduce((acc, field) => {
          acc[field] = userMeta[field];
          return acc;
        }, {} as any),
        // Campos sociales generales
        social_metadata: socialFields.reduce((acc, field) => {
          acc[field] = userMeta[field];
          return acc;
        }, {} as any),
        // Información adicional que podría ser útil
        bio: userMeta['description'] || userMeta['bio'] || userMeta['user_description'] || null,
        website: userData.link || userMeta['website'] || null,
        location: userMeta['location'] || userMeta['user_location'] || null,
        // URLs de redes sociales extraídos de metadatos
        social_links: {
          facebook: userMeta['facebook'] || userMeta['_facebook'] || userMeta['peepso_facebook'] || null,
          twitter: userMeta['twitter'] || userMeta['_twitter'] || userMeta['peepso_twitter'] || null,
          instagram: userMeta['instagram'] || userMeta['_instagram'] || userMeta['peepso_instagram'] || null,
          linkedin: userMeta['linkedin'] || userMeta['_linkedin'] || userMeta['peepso_linkedin'] || null,
        }
      };

      res.json({
        success: true,
        profile: peepsoProfile,
        debug_info: {
          peepso_fields_found: peepsoFields.length,
          social_fields_found: socialFields.length,
          api_data_available: !!peepsoData,
          successful_api_endpoint: successfulEndpoint
        }
      });

    } catch (error: any) {
      console.error(`[PeepSo Profile] Error general:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para obtener el perfil de PeepSo del representante asociado a una empresa
  app.get("/api/companies/:companyId/representative-peepso-profile", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      console.log(`[Company PeepSo Profile] Obteniendo perfil del representante para empresa ${companyId}`);

      // Obtener la empresa con detalles del representante
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: "Empresa no encontrada" });
      }

      if (!company.user || !company.userId) {
        console.log(`[Company PeepSo Profile] La empresa ${companyId} no tiene representante asociado`);
        return res.json({
          success: true,
          profile: null,
          message: "La empresa no tiene un representante asociado"
        });
      }

      console.log(`[Company PeepSo Profile] Representante encontrado: ${company.user.email} (ID: ${company.user.id})`);

      // Verificar si el representante es de WordPress (tiene firebaseUid que empieza con 'wp_')
      if (!company.user.firebaseUid?.startsWith('wp_')) {
        console.log(`[Company PeepSo Profile] El representante no es de WordPress: ${company.user.firebaseUid}`);
        return res.json({
          success: true,
          profile: null,
          message: "El representante no está asociado con WordPress/MemberPress"
        });
      }

      // Extraer el ID de WordPress del firebaseUid (formato: wp_{wordpressId}_{timestamp})
      const wordpressIdMatch = company.user.firebaseUid.match(/^wp_(\d+)_/);
      if (!wordpressIdMatch) {
        console.log(`[Company PeepSo Profile] No se pudo extraer ID de WordPress de: ${company.user.firebaseUid}`);
        return res.json({
          success: true,
          profile: null,
          message: "No se pudo determinar el ID de WordPress del representante"
        });
      }

      const wordpressUserId = wordpressIdMatch[1];
      console.log(`[Company PeepSo Profile] ID de WordPress extraído: ${wordpressUserId}`);

      // Intentar obtener el perfil de PeepSo usando nuestro endpoint interno
      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.status(400).json({ error: "Configuración de WordPress incompleta" });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      // Obtener información básica del usuario de WordPress
      const userResponse = await fetch(`${baseUrl}/wp-json/wp/v2/users/${wordpressUserId}?context=edit`, {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        console.log(`[Company PeepSo Profile] Usuario de WordPress no encontrado: ${wordpressUserId}`);
        return res.json({
          success: true,
          profile: null,
          message: "Usuario no encontrado en WordPress"
        });
      }

      const userData = await userResponse.json();
      console.log(`[Company PeepSo Profile] Usuario de WordPress obtenido: ${userData.username}`);

      // Intentar obtener datos de PeepSo
      const peepsoEndpoints = [
        `${baseUrl}/wp-json/peepso/v1/users/${wordpressUserId}`,
        `${baseUrl}/wp-json/peepso/v1/profile/${wordpressUserId}`,
        `${baseUrl}/wp-json/peepso-api/v1/users/${wordpressUserId}`,
        `${baseUrl}/wp-json/peepso-api/v1/profile/${wordpressUserId}`,
      ];

      let peepsoData = null;
      let successfulEndpoint = null;

      for (const endpoint of peepsoEndpoints) {
        try {
          console.log(`[Company PeepSo Profile] Intentando endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            peepsoData = data;
            successfulEndpoint = endpoint;
            console.log(`[Company PeepSo Profile] Datos de PeepSo obtenidos de: ${endpoint}`);
            break;
          }
        } catch (error) {
          console.log(`[Company PeepSo Profile] Error en endpoint ${endpoint}:`, error.message);
        }
      }

      // Procesar metadatos del usuario para campos sociales
      const userMeta = userData.meta || {};
      const peepsoFields = Object.keys(userMeta).filter(key => 
        key.includes('peepso') || key.includes('ps_') || key.startsWith('_peepso')
      );

      const socialFields = Object.keys(userMeta).filter(key => 
        key.includes('facebook') || key.includes('twitter') || key.includes('instagram') || 
        key.includes('linkedin') || key.includes('social') || key.includes('profile')
      );

      const representativeProfile = {
        // Información básica del representante del sistema local
        company_id: companyId,
        company_name: company.nombreEmpresa,
        representative: {
          local_id: company.user.id,
          local_email: company.user.email,
          local_display_name: company.user.displayName,
          local_role: company.user.role,
        },
        // Información de WordPress/PeepSo
        wordpress_profile: {
          user_id: userData.id,
          username: userData.username,
          display_name: userData.name,
          email: userData.email,
          avatar_url: userData.avatar_urls ? userData.avatar_urls['96'] || userData.avatar_urls['48'] : null,
          profile_url: `${baseUrl}/profile/${userData.username}`,
          website: userData.link || userMeta['website'] || null,
          bio: userMeta['description'] || userMeta['bio'] || userMeta['user_description'] || null,
          location: userMeta['location'] || userMeta['user_location'] || null,
        },
        // Datos específicos de PeepSo (si están disponibles)
        peepso_data: peepsoData,
        // Enlaces de redes sociales extraídos de metadatos
        social_links: {
          facebook: userMeta['facebook'] || userMeta['_facebook'] || userMeta['peepso_facebook'] || null,
          twitter: userMeta['twitter'] || userMeta['_twitter'] || userMeta['peepso_twitter'] || null,
          instagram: userMeta['instagram'] || userMeta['_instagram'] || userMeta['peepso_instagram'] || null,
          linkedin: userMeta['linkedin'] || userMeta['_linkedin'] || userMeta['peepso_linkedin'] || null,
        },
        // Metadatos de PeepSo encontrados
        peepso_metadata: peepsoFields.reduce((acc, field) => {
          acc[field] = userMeta[field];
          return acc;
        }, {} as any),
        // Campos sociales adicionales
        social_metadata: socialFields.reduce((acc, field) => {
          acc[field] = userMeta[field];
          return acc;
        }, {} as any),
      };

      // Filtrar enlaces sociales vacíos
      const filteredSocialLinks = Object.fromEntries(
        Object.entries(representativeProfile.social_links).filter(([key, value]) => value)
      );

      res.json({
        success: true,
        profile: {
          ...representativeProfile,
          social_links: filteredSocialLinks
        },
        debug_info: {
          wordpress_user_id: wordpressUserId,
          peepso_fields_found: peepsoFields.length,
          social_fields_found: socialFields.length,
          peepso_api_available: !!peepsoData,
          successful_endpoint: successfulEndpoint,
          social_links_found: Object.keys(filteredSocialLinks).length
        }
      });

    } catch (error: any) {
      console.error(`[Company PeepSo Profile] Error general:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para verificar URLs de PeepSo por emails
  app.post("/api/emails/peepso-profiles", async (req, res) => {
    try {
      const { emails } = req.body;
      
      if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "Se requiere una lista de emails" });
      }

      console.log(`[Email PeepSo Profiles] Verificando URLs de PeepSo para emails:`, emails);

      const settings = await storage.getIntegrationSettings();
      
      if (!settings || !settings.wordpressUrl || !settings.apiKey || !settings.apiSecret) {
        return res.json({
          success: true,
          profiles: {},
          message: "Configuración de WordPress incompleta"
        });
      }

      const authString = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
      const baseUrl = settings.wordpressUrl.replace(/\/$/, '');

      const emailProfiles = {};

      // Verificar cada email
      for (const email of emails) {
        if (!email || email.trim() === '') continue;

        try {
          console.log(`[Email PeepSo Profiles] Buscando usuario de WordPress con email: ${email}`);

          // Buscar usuario por email en WordPress
          const userSearchResponse = await fetch(`${baseUrl}/wp-json/wp/v2/users?search=${encodeURIComponent(email)}&context=edit`, {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json',
            },
          });

          if (!userSearchResponse.ok) {
            console.log(`[Email PeepSo Profiles] No se pudo buscar usuario para email: ${email}`);
            continue;
          }

          const users = await userSearchResponse.json();
          const matchingUser = users.find((user: any) => user.email === email);

          if (!matchingUser) {
            console.log(`[Email PeepSo Profiles] No se encontró usuario de WordPress con email: ${email}`);
            continue;
          }

          console.log(`[Email PeepSo Profiles] Usuario encontrado: ${matchingUser.username} (ID: ${matchingUser.id})`);

          // Verificar si el usuario tiene URL en sus metadatos
          const userMeta = matchingUser.meta || {};
          
          // Buscar URL en diferentes campos posibles
          const profileUrl = userMeta['url'] || 
                           userMeta['website'] || 
                           userMeta['user_url'] || 
                           userMeta['profile_url'] ||
                           matchingUser.link ||
                           null;

          if (profileUrl && profileUrl.trim() !== '') {
            console.log(`[Email PeepSo Profiles] URL de perfil encontrada para ${email}: ${profileUrl}`);
            
            emailProfiles[email] = {
              wordpress_user_id: matchingUser.id,
              username: matchingUser.username,
              display_name: matchingUser.name,
              avatar_url: matchingUser.avatar_urls ? matchingUser.avatar_urls['96'] || matchingUser.avatar_urls['48'] : null,
              profile_url: profileUrl,
              has_peepso_profile: true
            };
          } else {
            console.log(`[Email PeepSo Profiles] No se encontró URL de perfil para ${email}`);
            emailProfiles[email] = {
              wordpress_user_id: matchingUser.id,
              username: matchingUser.username,
              display_name: matchingUser.name,
              avatar_url: matchingUser.avatar_urls ? matchingUser.avatar_urls['96'] || matchingUser.avatar_urls['48'] : null,
              profile_url: null,
              has_peepso_profile: false
            };
          }

        } catch (error) {
          console.log(`[Email PeepSo Profiles] Error al procesar email ${email}:`, error.message);
        }
      }

      res.json({
        success: true,
        profiles: emailProfiles,
        debug_info: {
          emails_checked: emails.length,
          profiles_found: Object.keys(emailProfiles).length,
          profiles_with_urls: Object.values(emailProfiles).filter((profile: any) => profile.has_peepso_profile).length
        }
      });

    } catch (error: any) {
      console.error(`[Email PeepSo Profiles] Error general:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para geocodificación usando OpenStreetMap Nominatim API (gratuito, sin API key)
  app.post("/api/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address || typeof address !== 'string' || address.trim().length < 5) {
        return res.status(400).json({ error: 'Dirección inválida' });
      }

      // Usar OpenStreetMap Nominatim API (alternativa gratuita)
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(address.trim())}`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'ANPR-Directory-App/1.0 (contact@anpr.org.mx)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error en Nominatim API: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        
        // Transformar respuesta de Nominatim a formato compatible con Google Maps API
        const transformedResult = {
          formatted_address: result.display_name,
          geometry: {
            location: {
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lon)
            }
          },
          address_components: [] as any[]
        };

        // Agregar componentes de dirección si están disponibles
        if (result.address) {
          const addr = result.address;
          if (addr.country) {
            transformedResult.address_components.push({
              long_name: addr.country,
              short_name: addr.country_code?.toUpperCase() || addr.country,
              types: ['country', 'political']
            });
          }
          if (addr.state) {
            transformedResult.address_components.push({
              long_name: addr.state,
              short_name: addr.state,
              types: ['administrative_area_level_1', 'political']
            });
          }
          if (addr.city || addr.town || addr.municipality) {
            const cityName = addr.city || addr.town || addr.municipality;
            transformedResult.address_components.push({
              long_name: cityName,
              short_name: cityName,
              types: ['locality', 'political']
            });
          }
        }

        res.json({
          results: [transformedResult],
          status: 'OK'
        });
      } else {
        res.json({
          results: [],
          status: 'ZERO_RESULTS',
          error_message: `No se encontraron resultados para: ${address}`
        });
      }

    } catch (error: any) {
      console.error('Error en geocodificación:', error);
      res.status(500).json({ 
        status: 'ERROR',
        error_message: error.message || 'Error interno del servidor' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
