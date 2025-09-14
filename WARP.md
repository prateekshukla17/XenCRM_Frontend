# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Technology Stack

This is a **XenCRM Frontend** application built with:

- **Next.js 15.5.2** (App Router with React 19)
- **TypeScript** with strict configuration
- **Tailwind CSS v4** with shadcn/ui components
- **Prisma ORM** with PostgreSQL database
- **NextAuth.js** for authentication
- **Turbopack** for development and build optimization
- **Recharts** for data visualization

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build application with Turbopack
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Generate Prisma client (after schema changes)
npx prisma generate

# Run Prisma migrations
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio
```

## Architecture Overview

### Application Structure

- **App Router Architecture**: Uses Next.js 13+ app directory structure
- **Database Layer**: Prisma ORM with custom client generation in `src/generated/prisma/`
- **Authentication**: NextAuth.js with session management via `SessionProvider`
- **UI Components**: shadcn/ui components with Tailwind CSS styling
- **API Layer**: Next.js API routes in `src/app/api/` directories

### Key Directories

- `src/app/` - Next.js app router pages and layouts
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and shared logic
- `src/generated/prisma/` - Auto-generated Prisma client
- `prisma/` - Database schema and migrations

### Database Architecture

The application uses a **CRM data model** centered around customer analytics:

- **customers_mv**: Materialized view for customer analytics (main data source)
- **segments**: Customer segmentation with JSON-based rules
- **campaigns**: Marketing campaigns linked to segments
- **communication_log**: Campaign message delivery tracking
- **delivery_receipts**: Message delivery confirmations

### Component Architecture

- **Page Components**: Route-level components in `src/app/*/page.tsx`
- **Layout Components**: Shared layouts including root layout with session provider
- **UI Components**: shadcn/ui components in `src/components/ui/`
- **Feature Components**: Business logic components (navbar, dashboard sections)

### Authentication Flow

1. `SessionProvider` wraps the entire application in root layout
2. Pages use `useSession()` hook for authentication state
3. Protected routes redirect to home page if unauthenticated
4. API routes can access session data for authorization

### Data Fetching Patterns

- **Client-side fetching** using native `fetch()` in React components
- **API routes** return standardized JSON responses with `{ success, data, error, pagination }`
- **Prisma client** instantiation per API route with proper disconnection
- **Real-time updates** via manual refresh buttons (no automatic polling)

### Styling Architecture

- **Tailwind CSS v4** for utility-first styling
- **CSS custom properties** for theming (configured in shadcn/ui)
- **Component variants** using `class-variance-authority`
- **Responsive design** with mobile-first approach
- **Custom gradients** using `bg-gradient-background` utility class

### State Management Patterns

- **Local component state** using `useState()` hooks
- **Session state** managed by NextAuth.js
- **Loading states** for async operations
- **Error boundaries** with user-friendly error messages

## Key Files to Understand

- `src/app/layout.tsx` - Root layout with session provider setup
- `src/app/dashboard/page.tsx` - Main dashboard with customer analytics
- `src/app/api/dashapi/route.ts` - Primary data API endpoint
- `prisma/schema.prisma` - Database schema definition
- `src/lib/utils.ts` - Utility functions including `cn()` for class merging

## Common Development Tasks

### Adding New Pages
1. Create `page.tsx` in appropriate `src/app/` subdirectory
2. Use `'use client'` directive if client-side features needed
3. Import and use authentication hooks if route requires protection

### Database Schema Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Regenerate client with `npx prisma generate`
4. Update TypeScript types in components using the data

### Adding New API Endpoints
1. Create `route.ts` in `src/app/api/[endpoint]/`
2. Follow existing pattern: instantiate Prisma client, handle errors, disconnect
3. Return standardized JSON response format
4. Add proper TypeScript interfaces for request/response data

### Adding New Components
1. Create component in appropriate `src/components/` subdirectory  
2. Use TypeScript interfaces for props
3. Follow existing patterns for styling with Tailwind classes
4. Import from `@/` alias for clean import paths

### Working with Customer Data
- Primary data source is `customers_mv` materialized view
- All customer analytics calculations happen client-side in dashboard
- Currency formatting uses Indian Rupee (₹) with proper locale formatting
- Status badges have predefined color schemes (active=green, inactive=red, pending=yellow)