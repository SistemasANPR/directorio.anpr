import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import Stripe from "stripe";
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";
import { eq, like, sql, and, or, asc, desc, inArray, isNull, gte, lte, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
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
  companyLocations,
  integrationSettings,
  pdfSettings,
  stripeConfigurationTable,
  emailConfiguration,
  emailTemplates,
  frontendConfigurationTable
} from "../shared/schema";
import nodemailer from "nodemailer";
import path from "path";

// Database connection
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set");
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
const db = drizzle(pool, { schema });

// Stripe configuration
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : null;

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS for Vercel
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Info');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Extract user info from headers
app.use('/api', (req: any, res, next) => {
  const userHeader = req.headers['x-user-info'];
  if (userHeader) {
    try {
      req.user = JSON.parse(userHeader as string);
    } catch (error) {
      // Continue without user info
    }
  }
  next();
});

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ COMPANIES ============
app.get('/api/companies', async (req, res) => {
  try {
    const { search, categoryId, membershipTypeId, estado, limit = 50, offset = 0, includeInactive } = req.query;
    
    let query = db.select().from(companies);
    const conditions: any[] = [];

    if (!includeInactive) {
      conditions.push(eq(companies.estado, "activo"));
    }

    if (search) {
      conditions.push(
        or(
          like(companies.nombreEmpresa, `%${search}%`),
          like(companies.descripcionEmpresa, `%${search}%`)
        )
      );
    }

    if (categoryId) {
      conditions.push(sql`${companies.categoriesIds} @> '[${parseInt(categoryId as string)}]'::jsonb`);
    }

    if (estado) {
      conditions.push(eq(companies.estado, estado as string));
    }

    if (membershipTypeId) {
      conditions.push(eq(companies.membershipTypeId, parseInt(membershipTypeId as string)));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;
    
    const companiesResult = await db
      .select()
      .from(companies)
      .where(whereCondition)
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy(desc(companies.id));

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(companies)
      .where(whereCondition);

    // Enrich with categories and membership types
    const enrichedCompanies = await Promise.all(
      companiesResult.map(async (company) => {
        const catIds = company.categoriesIds as number[] | null;
        const companyCategories = catIds && Array.isArray(catIds) && catIds.length > 0
          ? await db.select().from(categories).where(inArray(categories.id, catIds))
          : [];
        
        const membershipType = company.membershipTypeId
          ? await db.select().from(membershipTypes).where(eq(membershipTypes.id, company.membershipTypeId)).then(r => r[0])
          : null;

        return {
          ...company,
          categories: companyCategories,
          membershipType
        };
      })
    );

    res.json({ 
      companies: enrichedCompanies, 
      total: Number(countResult[0]?.count || 0)
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

app.get('/api/companies/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const company = await db.select().from(companies).where(eq(companies.id, id)).then(r => r[0]);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const catIds = company.categoriesIds as number[] | null;
    const companyCategories = catIds && Array.isArray(catIds) && catIds.length > 0
      ? await db.select().from(categories).where(inArray(categories.id, catIds))
      : [];
    
    const membershipType = company.membershipTypeId
      ? await db.select().from(membershipTypes).where(eq(membershipTypes.id, company.membershipTypeId)).then(r => r[0])
      : null;

    const locations = await db.select().from(companyLocations).where(eq(companyLocations.companyId, id));

    res.json({
      ...company,
      categories: companyCategories,
      membershipType,
      locations
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Error fetching company' });
  }
});

app.post('/api/companies', async (req, res) => {
  try {
    const companyData = req.body;
    const newCompany = await db.insert(companies).values(companyData).returning();
    res.status(201).json(newCompany[0]);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ message: 'Error creating company' });
  }
});

app.patch('/api/companies/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = req.body;
    const updated = await db.update(companies).set(updateData).where(eq(companies.id, id)).returning();
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ message: 'Error updating company' });
  }
});

app.delete('/api/companies/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(companies).where(eq(companies.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ message: 'Error deleting company' });
  }
});

// ============ CATEGORIES ============
app.get('/api/categories', async (req, res) => {
  try {
    const allCategories = await db.select().from(categories).orderBy(asc(categories.nombreCategoria));
    res.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const newCategory = await db.insert(categories).values(req.body).returning();
    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

app.patch('/api/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.update(categories).set(req.body).where(eq(categories.id, id)).returning();
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(categories).where(eq(categories.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

// ============ MEMBERSHIP TYPES ============
app.get('/api/membership-types', async (req, res) => {
  try {
    const allTypes = await db.select().from(membershipTypes).orderBy(asc(membershipTypes.id));
    res.json(allTypes);
  } catch (error) {
    console.error('Error fetching membership types:', error);
    res.status(500).json({ message: 'Error fetching membership types' });
  }
});

app.post('/api/membership-types', async (req, res) => {
  try {
    const newType = await db.insert(membershipTypes).values(req.body).returning();
    res.status(201).json(newType[0]);
  } catch (error) {
    console.error('Error creating membership type:', error);
    res.status(500).json({ message: 'Error creating membership type' });
  }
});

app.patch('/api/membership-types/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.update(membershipTypes).set(req.body).where(eq(membershipTypes.id, id)).returning();
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating membership type:', error);
    res.status(500).json({ message: 'Error updating membership type' });
  }
});

// ============ USERS ============
app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.get('/api/users/firebase/:firebaseUid', async (req, res) => {
  try {
    const user = await db.select().from(users).where(eq(users.firebaseUid, req.params.firebaseUid)).then(r => r[0]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const newUser = await db.insert(users).values(req.body).returning();
    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.update(users).set(req.body).where(eq(users.id, id)).returning();
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// ============ CERTIFICATES ============
app.get('/api/certificates', async (req, res) => {
  try {
    const allCertificates = await db.select().from(certificates);
    res.json(allCertificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Error fetching certificates' });
  }
});

// ============ OPINIONS ============
app.get('/api/opinions', async (req, res) => {
  try {
    const { companyId, estado } = req.query;
    let query = db.select().from(opinions);
    const conditions: any[] = [];

    if (companyId) {
      conditions.push(eq(opinions.companyId, parseInt(companyId as string)));
    }
    if (estado) {
      conditions.push(eq(opinions.estado, estado as string));
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;
    const allOpinions = await db.select().from(opinions).where(whereCondition);
    res.json(allOpinions);
  } catch (error) {
    console.error('Error fetching opinions:', error);
    res.status(500).json({ message: 'Error fetching opinions' });
  }
});

app.post('/api/opinions', async (req, res) => {
  try {
    const newOpinion = await db.insert(opinions).values(req.body).returning();
    res.status(201).json(newOpinion[0]);
  } catch (error) {
    console.error('Error creating opinion:', error);
    res.status(500).json({ message: 'Error creating opinion' });
  }
});

// ============ PROJECTS ============
app.get('/api/projects', async (req, res) => {
  try {
    const { companyId } = req.query;
    let allProjects;
    if (companyId) {
      allProjects = await db.select().from(projects).where(eq(projects.companyId, parseInt(companyId as string)));
    } else {
      allProjects = await db.select().from(projects);
    }
    res.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const newProject = await db.insert(projects).values(req.body).returning();
    res.status(201).json(newProject[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project' });
  }
});

// ============ SYSTEM SETTINGS ============
app.get('/api/system-settings', async (req, res) => {
  try {
    const settings = await db.select().from(systemSettings).then(r => r[0]);
    res.json(settings || {});
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ message: 'Error fetching system settings' });
  }
});

app.patch('/api/system-settings', async (req, res) => {
  try {
    const existing = await db.select().from(systemSettings).then(r => r[0]);
    if (existing) {
      const updated = await db.update(systemSettings).set(req.body).where(eq(systemSettings.id, existing.id)).returning();
      res.json(updated[0]);
    } else {
      const created = await db.insert(systemSettings).values(req.body).returning();
      res.json(created[0]);
    }
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ message: 'Error updating system settings' });
  }
});

// ============ FRONTEND CONFIGURATION ============
app.get('/api/frontend-configuration', async (req, res) => {
  try {
    const config = await db.select().from(frontendConfigurationTable).then(r => r[0]);
    res.json(config || {});
  } catch (error) {
    console.error('Error fetching frontend configuration:', error);
    res.status(500).json({ message: 'Error fetching frontend configuration' });
  }
});

// ============ TAGS ============
app.get('/api/tags', async (req, res) => {
  try {
    const allTags = await db.select().from(tags);
    res.json(allTags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Error fetching tags' });
  }
});

// ============ COMPANY LOCATIONS ============
app.get('/api/company-locations', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (companyId) {
      const locations = await db.select().from(companyLocations).where(eq(companyLocations.companyId, parseInt(companyId as string)));
      res.json(locations);
    } else {
      const locations = await db.select().from(companyLocations);
      res.json(locations);
    }
  } catch (error) {
    console.error('Error fetching company locations:', error);
    res.status(500).json({ message: 'Error fetching company locations' });
  }
});

// ============ MEMBERSHIP PAYMENTS ============
app.get('/api/membership-payments', async (req, res) => {
  try {
    const payments = await db.select().from(membershipPayments).orderBy(desc(membershipPayments.createdAt));
    res.json(payments);
  } catch (error) {
    console.error('Error fetching membership payments:', error);
    res.status(500).json({ message: 'Error fetching membership payments' });
  }
});

app.post('/api/membership-payments', async (req, res) => {
  try {
    const newPayment = await db.insert(membershipPayments).values(req.body).returning();
    res.status(201).json(newPayment[0]);
  } catch (error) {
    console.error('Error creating membership payment:', error);
    res.status(500).json({ message: 'Error creating membership payment' });
  }
});

// ============ STRIPE ENDPOINTS ============
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }

    const { priceId, membershipTypeId, companyData, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/cancel`,
      metadata: {
        membershipTypeId: membershipTypeId?.toString(),
        companyData: JSON.stringify(companyData)
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }

    const { amount, currency = 'usd', metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============ STRIPE CONFIGURATION ============
app.get('/api/stripe-configuration', async (req, res) => {
  try {
    const config = await db.select().from(stripeConfigurationTable).then(r => r[0]);
    res.json(config || {});
  } catch (error) {
    console.error('Error fetching stripe configuration:', error);
    res.status(500).json({ message: 'Error fetching stripe configuration' });
  }
});

// ============ INTEGRATION SETTINGS ============
app.get('/api/integration-settings', async (req, res) => {
  try {
    const settings = await db.select().from(integrationSettings).then(r => r[0]);
    res.json(settings || {});
  } catch (error) {
    console.error('Error fetching integration settings:', error);
    res.status(500).json({ message: 'Error fetching integration settings' });
  }
});

// ============ EMAILS ============
app.post('/api/emails/send', async (req, res) => {
  try {
    const emailConfig = await db.select().from(emailConfiguration).then(r => r[0]);
    
    if (!emailConfig) {
      return res.status(500).json({ message: 'Email not configured' });
    }

    const transporter = nodemailer.createTransport({
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: {
        user: emailConfig.username,
        pass: emailConfig.password
      }
    });

    const { to, subject, html, text } = req.body;

    await transporter.sendMail({
      from: emailConfig.fromEmail,
      to,
      subject,
      html,
      text
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Error sending email' });
  }
});

// ============ ROLES ============
app.get('/api/roles', async (req, res) => {
  try {
    const allRoles = await db.select().from(roles);
    res.json(allRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Error fetching roles' });
  }
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Export for Vercel
export default app;
