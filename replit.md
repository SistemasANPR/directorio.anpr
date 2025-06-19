# ANPR México - Directorio Empresarial

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