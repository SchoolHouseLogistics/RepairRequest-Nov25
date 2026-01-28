# RepairRequest

A multi-tenant B2B SaaS maintenance ticketing system for managing repair requests across organizations, buildings, and facilities.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, React Query
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Google OAuth 2.0, Express Sessions
- **Deployment**: Railway

## Features

- Multi-tenant architecture with organization isolation
- Role-based access control (Requester, Maintenance, Admin, Super Admin)
- Repair and facilities request management
- Building and room tracking with history
- User management with bulk import
- Row Level Security (RLS) for database-level tenant isolation
- Soft delete support for data retention
- Google OAuth authentication

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Google OAuth credentials

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@host/database
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-session-secret
NODE_ENV=development
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Database Migrations

For production deployments, run the SQL migrations in the `migrations/` folder:

```bash
# Run combined soft-delete and RLS migration
psql $DATABASE_URL -f migrations/combined_soft_deletes_and_rls.sql
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and helpers
│   │   └── pages/          # Page components
├── server/                 # Express backend
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic services
│   ├── routes/             # API route handlers
│   └── index.ts            # Server entry point
├── shared/                 # Shared code
│   └── schema.ts           # Database schema (Drizzle)
└── migrations/             # SQL migration files
```

## User Roles

| Role | Permissions |
|------|-------------|
| **Requester** | Submit requests, view own requests |
| **Maintenance** | View/manage assigned requests, update status |
| **Admin** | Manage organization users, buildings, all requests |
| **Super Admin** | Manage all organizations, system-wide access |

## API Overview

- `GET /api/user` - Current user info
- `GET /api/requests` - List requests (filtered by role)
- `POST /api/requests` - Create new request
- `PATCH /api/requests/:id` - Update request
- `GET /api/buildings` - List buildings
- `GET /api/admin/users` - List users (admin only)
- `POST /api/admin/users/bulk` - Bulk import users

## Security Features

- Row Level Security (RLS) for database-level tenant isolation
- Session validation with Zod schema
- CSRF protection
- Content Security Policy (CSP)
- Soft deletes for audit trails

## License

Proprietary - SchoolHouse Logistics
