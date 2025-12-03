# RepairRequest - Facilities Management System

## Overview

RepairRequest is a comprehensive full-stack facilities management system built for educational institutions. The application provides a streamlined platform for managing maintenance requests, facility scheduling, and building operations across multiple organizations. It features role-based access control, real-time messaging, photo uploads, and detailed reporting capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with Google OAuth 2.0
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **File Uploads**: Multer for handling photo attachments
- **Email Service**: SendGrid for notification emails

### Database Architecture
- **Database**: PostgreSQL 16 (via Neon serverless)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Schema**: Multi-tenant design with organizations, users, requests, and facilities
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Authentication System
- Google OAuth 2.0 integration with organization-based access control
- Role-based permissions (requester, maintenance, admin, super_admin)
- Session-based authentication with PostgreSQL storage
- Email domain-based organization assignment

### Request Management
- **Facility Requests**: Event scheduling with equipment needs
- **Building Requests**: Maintenance and repair requests
- Photo upload capabilities with multiple file support
- Status tracking (pending, approved, in-progress, completed)
- Priority levels (low, medium, high, urgent)
- Assignment system for maintenance staff

### Multi-tenant Architecture
- Organization-based data isolation
- Super admin role for cross-organization management
- Dynamic branding based on organization
- Building and facility management per organization

### Communication System
- Real-time messaging threads for requests
- Email notifications via SendGrid
- Status update notifications
- Assignment notifications

## Data Flow

1. **Authentication Flow**: User logs in via Google OAuth → Session created → Role-based dashboard access
2. **Request Creation**: User submits request → Photos uploaded → Notifications sent → Request enters workflow
3. **Request Processing**: Admin assigns → Maintenance staff updates → Status tracked → Completion notification
4. **Reporting Flow**: Admin accesses reports → Data aggregated from multiple tables → Charts generated

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Google OAuth**: Authentication provider
- **SendGrid**: Email delivery service
- **Replit**: Development and deployment platform

### NPM Dependencies
- **Database**: @neondatabase/serverless, drizzle-orm, drizzle-kit
- **Authentication**: passport, passport-google-oauth20, express-session
- **UI Framework**: react, @radix-ui/*, tailwindcss
- **Forms & Validation**: react-hook-form, zod, @hookform/resolvers
- **File Handling**: multer (for photo uploads)
- **Charts**: recharts
- **State Management**: @tanstack/react-query

## Deployment Strategy

### Development Environment
- Replit-based development with hot reload
- Vite dev server for frontend with HMR
- TypeScript compilation with tsx for backend
- PostgreSQL database automatically provisioned

### Production Build
- Frontend: Vite build to static assets
- Backend: ESBuild bundling for Node.js deployment
- Database: Drizzle migrations applied via `npm run db:push`
- Deployment: Replit autoscale deployment target

### Environment Configuration
- **Development**: Local development server on port 5000
- **Production**: Node.js server serving static frontend and API
- **Database**: CONNECTION_URL automatically configured by Replit
- **OAuth**: Google client credentials via environment variables

## Changelog

```
Changelog:
- June 24, 2025: Initial setup
- June 24, 2025: Fixed room history page React error by creating dedicated /api/room-buildings endpoint
- June 24, 2025: Updated landing page logo from wrench icon to custom RepairRequest logo with buildings/wrench/checkmark design
- June 24, 2025: Created comprehensive marketing site with hero landing page at /landing
- June 24, 2025: Built complete page suite: Pricing (with FAQ), Support, About, Contact, Privacy Policy, Terms of Service
- June 24, 2025: Added navigation between marketing pages and back to login portal
- June 24, 2025: All pages feature professional design with custom branding and working cross-links
- June 24, 2025: Fixed login routing - marketing site now at /landing, login portal at / (root), proper authentication flow restored
- June 24, 2025: Enhanced login page with professional header, navigation back to marketing site, and consistent branding
- June 24, 2025: Added consistent navigation menu (Home, Pricing, FAQ, Support, Login to Portal) across all website pages
- June 24, 2025: Updated hero section to two-column layout with content on left and video showcase placeholder on right
- June 24, 2025: Built comprehensive FAQ page with 5 categories, collapsible sections, and consistent navigation
- June 24, 2025: Updated Canterbury School dashboard to show Upper School building image instead of Academic Building
- June 24, 2025: Updated Canterbury School dashboard second facility to show Lower School building image
- June 24, 2025: Fixed static file serving for attached_assets directory to enable proper image loading
- June 24, 2025: Fixed photo attachments rendering by adding uploads directory static serving and correcting image URL paths
- June 26, 2025: Enhanced photo upload persistence with file verification and improved error handling for missing images
- June 28, 2025: CRITICAL FIX - Resolved major photo upload system failure that prevented images from being visible
- June 28, 2025: Fixed routing issue where building requests bypassed photo-enabled endpoint (/api/building-requests)
- June 28, 2025: Implemented comprehensive photo recovery utility to restore missing photo references
- June 28, 2025: Verified photo upload system working end-to-end with proper file persistence and database integration
- December 3, 2025: New users now automatically assigned to New School (org ID 2) as requesters on signup
- December 3, 2025: Removed addresses from all pages (Privacy, Terms, Contact)
- December 3, 2025: Updated contact info across site: email info@schoolhouselogistics.com, phone (407) 494-5230
- December 3, 2025: Created Accessibility page with WCAG 2.1 Level AA compliance statement
- December 3, 2025: Updated Legal section in footer to include Privacy Policy, Terms of Service, and Accessibility
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```