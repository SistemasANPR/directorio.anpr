# ANPR México - Directorio de Proveedores de Equipamiento Urbano

## Overview

ANPR México is a comprehensive business directory platform that connects companies and facilitates the search for specialized providers. The platform offers advanced geolocation features, membership management, payment processing, and administrative tools for managing a complete business ecosystem.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, using a modern component-based architecture:

- **Component Library**: shadcn/ui for consistent design system
- **State Management**: TanStack Query for server state, React Hook Form for form state
- **Routing**: Wouter for lightweight routing
- **Styling**: Tailwind CSS with custom theme variables
- **Build Tool**: Vite for fast development and optimized builds
- **Authentication**: Firebase Authentication integration

### Backend Architecture
The backend follows a RESTful API design with Express.js:

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with middleware for CORS, sessions, and file uploads
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Storage**: Local file system with multer for uploads
- **API Design**: RESTful endpoints with proper error handling

### Database Architecture
PostgreSQL database with normalized schema design:

- **User Management**: Firebase UID integration with local user profiles
- **Company Management**: Comprehensive company profiles with geolocation
- **Membership System**: Flexible membership types with pricing options
- **Content Management**: Categories, certificates, projects, and opinions
- **System Configuration**: Dynamic home page and system settings

## Key Components

### Authentication System
- **Firebase Integration**: Secure authentication with email/password and Google OAuth
- **Role-Based Access**: Admin, representative, and user roles with different permissions
- **Session Management**: Persistent sessions with remember-me functionality

### Business Directory
- **Company Profiles**: Rich company information with multimedia galleries
- **Category System**: Hierarchical categorization with custom icons
- **Geolocation**: Interactive maps with location-based search
- **Project Portfolios**: Company project showcases with image galleries

### Membership Management
- **Flexible Plans**: Multiple membership types with different pricing periods
- **Stripe Integration**: Secure payment processing with webhooks
- **Subscription Tracking**: Automatic renewal and expiration management

### Content Management
- **Rich Text Editor**: TinyMCE integration for content creation
- **File Upload System**: Image and document management with validation
- **Dynamic Configuration**: Customizable home page banners and highlights

### Administrative Tools
- **User Management**: Complete user lifecycle management
- **Content Moderation**: Opinion and review approval system
- **Analytics Dashboard**: Business metrics and performance tracking
- **System Settings**: Configurable platform branding and features

## Data Flow

### User Registration Flow
1. User creates account through Firebase Authentication
2. System creates corresponding database record with role assignment
3. Email verification and welcome sequence initiated
4. User profile completion and company association (for representatives)

### Company Management Flow
1. Representative registers company with basic information
2. Company profile enrichment with categories, certificates, and media
3. Project portfolio creation and management
4. Membership upgrade and payment processing
5. Public directory listing with search optimization

### Payment Processing Flow
1. User selects membership plan and billing period
2. Stripe payment intent creation with customer data
3. Secure payment form submission and processing
4. Webhook confirmation and membership activation
5. Invoice generation and email notification

### Content Publication Flow
1. Content creation through rich text editors and forms
2. Admin review and approval process (where applicable)
3. Content publication with proper categorization and tagging
4. Search index updates and cache invalidation

## External Dependencies

### Payment Processing
- **Stripe**: Complete payment infrastructure including subscriptions, invoices, and webhooks
- **Security**: PCI compliance through Stripe's secure payment forms

### Authentication
- **Firebase Authentication**: User authentication, password reset, and session management
- **Google OAuth**: Social login integration for improved user experience

### Maps and Geolocation
- **Google Maps API**: Interactive maps, geocoding, and location search
- **Leaflet**: Alternative mapping solution for specific use cases

### Content Management
- **TinyMCE**: Rich text editing with media upload capabilities
- **Image Processing**: Client-side image optimization and validation

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **ESLint/Prettier**: Code quality and formatting
- **TypeScript**: Type safety across the entire stack

## Deployment Strategy

### Development Environment
- **Replit Integration**: Native development environment with hot reload
- **Database**: PostgreSQL instance with automatic provisioning
- **File Storage**: Local uploads directory with .gitignore protection

### Production Considerations
- **Build Process**: Vite optimized builds with code splitting
- **Database**: PostgreSQL with connection pooling and migrations
- **File Storage**: Scalable file storage solution (AWS S3, Cloudinary)
- **CDN**: Static asset delivery optimization
- **Environment Variables**: Secure configuration management

### Monitoring and Maintenance
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Monitoring**: Database query optimization and caching
- **Backup Strategy**: Automated database backups and recovery procedures
- **Security Updates**: Regular dependency updates and security patches

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Recent Changes:
- June 21, 2025: PAYMENT ERROR MESSAGING ENHANCED - Implemented comprehensive user-friendly error handling system for payment processes. Added specific error messages for card errors (declined, insufficient funds, expired, incorrect CVC/number), database constraint violations (duplicate email/company), Stripe API errors, and connection issues. Enhanced registration flow error handling with detailed user guidance and support contact information.
- June 20, 2025: STRIPE SUBSCRIPTION SYSTEM IMPLEMENTED - Created comprehensive Stripe configuration module for admins with intuitive interface for API keys setup, webhook configuration, and product synchronization. Updated backend to support automatic recurring subscriptions, payment webhooks handling, and membership status automation. Enhanced schema with Stripe IDs for users and membership types. Added subscription checkout flow with auto-renewal options and secure payment processing.
- June 20, 2025: TAG MANAGEMENT SYSTEM COMPLETED - Implemented comprehensive tag management functionality with admin interface for CRUD operations, integrated tag selector in company forms, enhanced search functionality with tag filtering, visual color-coded tag display throughout directory, usage tracking to prevent deletion of active tags, and complete API integration for tag-based search enhancement
- June 20, 2025: NAVIGATION AND UX IMPROVEMENTS COMPLETED - Updated main navigation menu from "Membresías" to "Planes", redirected "Regístrate como empresa" buttons to /planes, implemented smooth scroll to plans section from hero and registration buttons, reordered pricing display to show annual prices first then monthly
- June 20, 2025: PRICING DISPLAY ENHANCEMENT - Modified plan cards in PublicMemberships.tsx to prioritize annual pricing over monthly with proper sorting functionality
- June 20, 2025: SCROLL NAVIGATION IMPLEMENTATION - Added smooth scroll behavior to hero "ÚNETE AHORA" button and "Registrarse Ahora" button targeting membership-plans section with fallback navigation
- June 20, 2025: PLATFORM BRANDING FINALIZATION COMPLETED - Fixed final hero title in PublicMemberships.tsx to display complete "Directorio de Proveedores de Equipamiento Urbano" removing outdated "LATAM" reference
- June 20, 2025: COMPREHENSIVE PLATFORM BRANDING UPDATE COMPLETED - Successfully updated all platform titles from "Directorio" to "Directorio de Proveedores de Equipamiento Urbano" across entire application including navigation components, public pages, documentation, and user interfaces
- June 20, 2025: TITLE CONSISTENCY ACHIEVED - Updated main navigation (MainNavigation.tsx), sidebar components (Sidebar.tsx, RepresentativeSidebar.tsx), public pages (Home.tsx, HomeClean.tsx, Directory.tsx, PublicMemberships.tsx), and documentation files (README.md, replit.md, docs/user-manual.md)
- June 20, 2025: BRANDING STANDARDIZATION - Ensured all user-facing text reflects the new official platform name "Directorio de Proveedores de Equipamiento Urbano" (Directory of Urban Equipment Suppliers) for consistent brand identity
- June 19, 2025: GENERAL PLATFORM SETTINGS SYSTEM COMPLETED - Successfully connected and enhanced existing SystemSettings component with comprehensive logo upload functionality and platform-wide branding control
- June 19, 2025: SYSTEM LOGO UPLOAD INTEGRATION - Added drag-and-drop file upload for system logos and favicons with validation, preview, and storage in dedicated directories (/uploads/system-logos and /uploads/system-favicons)
- June 19, 2025: NAVIGATION INTEGRATION - Added "Configuración General" to admin sidebar navigation under Configuration submenu, properly integrated with routing system
- June 19, 2025: BACKEND API ENHANCEMENT - Created /api/system-settings/upload-image endpoint with multer configuration for handling logo and favicon uploads with 5MB limits and image validation
- June 19, 2025: PLATFORM BRANDING CONNECTION - Enhanced existing SystemSettings to update platform-wide branding including title, colors, and visual identity across entire application
- June 19, 2025: PDF LOGO UPLOAD SYSTEM COMPLETED - Successfully implemented comprehensive file upload system for PDF configuration logotipos with validation, secure storage, and preview functionality
- June 19, 2025: FILE UPLOAD ENHANCEMENT - Added multer configuration for PDF logo uploads with 5MB limit, image validation (PNG, JPG, JPEG, SVG), and unique filename generation
- June 19, 2025: BACKEND API EXPANSION - Created /api/pdf-settings/upload-logo endpoint with complete file handling, error validation, and response formatting
- June 19, 2025: FRONTEND FILE INTERFACE - Replaced URL input field with drag-and-drop file upload area, preview functionality, and progress indicators
- June 19, 2025: STORAGE ORGANIZATION - Implemented dedicated /uploads/pdf-logos directory for logo storage with automatic directory creation and static file serving
- June 19, 2025: MEMBERSHIP LIMITS ENFORCEMENT SYSTEM COMPLETED - Successfully implemented comprehensive system to ensure membership plan quantity limits are applied as actual restrictions for each company
- June 19, 2025: BACKEND VALIDATION - Added validateProjectLimits() and validateProductLimits() functions in storage.ts that automatically check plan restrictions before allowing creation/updates
- June 19, 2025: API ENFORCEMENT - Integrated validation functions into createProject() and updateCompany() methods to enforce limits dynamically based on each company's membership plan
- June 19, 2025: LIMITS API ENDPOINT - Created /api/companies/:companyId/limits endpoint to provide real-time usage information and available quotas for frontend display
- June 19, 2025: VISUAL LIMITS DISPLAY - Implemented MembershipLimitsDisplay component with progress bars, usage statistics, and alerts when limits are reached
- June 19, 2025: DASHBOARD INTEGRATION - Added limits component to representative dashboard overview showing current usage vs plan limits with color-coded status indicators
- June 19, 2025: QUANTITY FIELDS COMPLETED - Successfully implemented quantity control fields (cantidadProductosAdmitidos, cantidadProyectosAdmitidos) in MembershipsNew.tsx with proper validation, form integration, and clean styling
- June 19, 2025: FORM VALIDATION ENHANCEMENT - Added Zod schema validation for quantity fields with proper type safety and error handling in membership creation/editing forms
- June 19, 2025: UI REFINEMENT - Removed green highlighting from quantity fields based on user feedback, maintaining clean and consistent form styling
- June 19, 2025: MEMBERSHIP QUANTITY LIMITS - Added complete quantity control system for products and projects in membership plans with form fields, validation, and visual display
- June 19, 2025: FORM ENHANCEMENT - Implemented quantity fields in plan creation/editing forms with proper validation and user-friendly interface
- June 19, 2025: DASHBOARD INTEGRATION - Enhanced representative dashboard to display product/project limits with color-coded badges in membership section
- June 19, 2025: CATEGORY ICON DISPLAY - Replaced category text titles with visual icons in CompanyTable for improved UI visualization
- June 19, 2025: ICON MAPPING - Implemented dynamic icon rendering based on database category.icono field with comprehensive Lucide icon support
- June 19, 2025: UI VISUAL ENHANCEMENT - Added circular icon containers with hover effects and tooltips showing category names for better user experience
- June 19, 2025: COMPREHENSIVE COMPANY UPLOAD - Enhanced Companies.tsx with complete company information upload functionality including Excel/CSV import with all company fields
- June 19, 2025: EXPORT/IMPORT ENHANCEMENT - Updated export functionality to include all 38 company data fields (contact info, social media, membership details, geographic data, etc.)
- June 19, 2025: TEMPLATE IMPROVEMENT - Created comprehensive Excel template with proper field mapping for nombreEmpresa, descripcionEmpresa, membership details, social networks, and geographic information
- June 19, 2025: FILE PROCESSING - Added robust CSV and Excel processing with comprehensive data validation and error handling for company imports
- June 19, 2025: UI ENHANCEMENT - Added intuitive file upload interface with template download, export, and import buttons in companies management view
- June 19, 2025: OPINIONS ADMIN SEPARATION - Updated OpinionsAdmin component to focus exclusively on company opinions (tipo: "empresa") with title "Opiniones sobre empresas"
- June 19, 2025: API FILTERING - Modified frontend API calls to filter only company opinions, ensuring complete separation from platform reviews
- June 19, 2025: UI TERMINOLOGY - Updated dropdown and statistics labels from "reseñas" to "opiniones" for consistency in company feedback section
- June 19, 2025: CSP CONFIGURATION - Resolved Content Security Policy issues preventing application rendering by removing conflicting headers
- June 19, 2025: REPRESENTATIVE REVIEWS - Implemented complete review system for representatives to provide platform feedback
- June 19, 2025: SIDEBAR NAVIGATION - Replaced "Testimonios" with "Mi Reseña" in representative sidebar, connected to new review tab
- June 19, 2025: REVIEW COMPONENT - Created RepresentativeReview component with full CRUD functionality (create, edit, delete one review per representative)
- June 19, 2025: REVIEW INTEGRATION - Connected representative reviews to admin ReviewsAdmin for moderation with proper validation
- June 19, 2025: VALIDATION FIX - Resolved backend validation errors by including required fields (userId, nombre, email, companyId) in review submissions
- June 19, 2025: REVIEWS MANAGEMENT - Created new ReviewsAdmin component for managing platform reviews (tipo: "plataforma") with same design as OpinionsAdmin, replaced TestimonialsAdmin functionality
- June 19, 2025: SIDEBAR UPDATES - Updated admin sidebar to replace "Administrar Testimonios" with "Gestión de Reseñas" (/admin/reviews route)
- June 19, 2025: TESTIMONIALS REMOVAL - Eliminated TestimonialsAdmin component and routes, removed dual testimonial management system
- June 19, 2025: SIDEBAR CLEANUP - Removed "Configuración del Sistema" and "Administración de Home" options from admin sidebar navigation
- June 19, 2025: HOME ADMIN REMOVAL - Completely eliminated home administration functionality including frontend components, API routes, storage methods, database tables, and related schemas (homeConfiguration, homeHighlights, homeBanners)
- June 19, 2025: TESTIMONIALS DIFFERENTIATION - Implemented complete separation between company testimonials and platform feedback with distinct interfaces and filtering
- June 18, 2025: SECURITY FIX - Fixed critical certificate visibility filtering issue where representatives could see admin-created certificates
- June 18, 2025: Corrected database field mapping between Drizzle ORM (creadoPorAdmin) and PostgreSQL (creado_por_admin) columns
- June 18, 2025: Enhanced API endpoint with role-based filtering using userRole parameter - verified working correctly
- June 18, 2025: Updated both admin and representative interfaces to use proper certificate filtering
- June 18, 2025: Upgraded payment receipt downloads to professional PDF format using jsPDF library
- June 18, 2025: Implemented individual transaction receipt generation with company branding and detailed payment information
- June 18, 2025: Fixed logout functionality in both admin and representative sidebars with proper session cleanup
- June 18, 2025: Created RepresentativeCompanyManagementComplete component as exact copy of admin CompanyManagement functionality
- June 18, 2025: Added comprehensive company management for representatives including category selection, image galleries, and social media management
- June 17, 2025: Created separate RepresentativeCompanyForm component to avoid conflicts with admin CompanyManagement component
- June 17, 2025: Implemented automatic ANPR certificate assignment for business memberships in complete-registration endpoint
- June 17, 2025: Added assignCertificateToCompany method to storage interface for automatic certificate assignment
- June 17, 2025: Enhanced RepresentativeCertificateTable with role-based access restrictions for admin-assigned certificates
- June 17, 2025: Completely rebuilt RepresentativeDashboard with comprehensive functionality including 6 tabs (Resumen, Mi Empresa, Proyectos, Certificados, Mi Plan, Pagos)
- June 17, 2025: Added complete company management (CRUD) with detailed forms for editing all company information
- June 17, 2025: Implemented advanced plan management with cancellation/change options and detailed plan comparisons
- June 17, 2025: Created comprehensive payment history with table view, export functionality, and payment summaries
- June 17, 2025: Added project and certificate management sections (placeholder for future development)
- June 17, 2025: Integrated real-time renewal warnings and quick navigation actions
- June 17, 2025: Fixed sidebar navigation to show representative-specific menu instead of admin menu
- June 16, 2025: Fixed user role assignment issue - users registering through plan purchases now correctly show as "Representante"
- June 16, 2025: Updated complete-registration endpoint to assign 'representante' role instead of 'representative'
- June 16, 2025: Enhanced Users page with proper role display including green badge for representatives
- June 16, 2025: Added representative column to company dashboard showing user information with avatar, name, and email
- June 16, 2025: Updated database to correct existing users with incorrect roles
- June 16, 2025: Completed terminology change from "Planes de membresía" to "Planes" across entire system
- June 16, 2025: Updated all components including RepresentativeDashboard, Memberships, MembershipsNew, AddCompanyModal, and Sidebar
- June 16, 2025: Enhanced representative dashboard with new sections and improved functionality
- June 16, 2025: Added "Certificados y Premios" section for user-specific certificates management
- June 16, 2025: Improved "Plan de Membresía" section with complete information, cancellation/change options, and integrated payment history
- June 16, 2025: Implemented temporary authentication system for newly registered users
- June 16, 2025: Fixed periodicidad selection functionality in registration flow
- June 16, 2025: Fixed payment process flow - Step 3 verification now always shows
- June 16, 2025: Added plan verification with pricing options selection
- June 16, 2025: Implemented anti-autofill solution for company form fields
- June 16, 2025: Initial setup