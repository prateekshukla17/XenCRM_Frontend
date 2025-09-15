# XenCRM Frontend

An end-to-end Customer Relationship Management (CRM) system built as part of the Xeno SDE Internship Assignment – 2025. The project demonstrates modern engineering practices: microservices architecture, event-driven design, full-stack development, and AI-first integrations.

## Backend Architecture & Design

The backend for this project can be found in the [XenCRM_Backend](https://github.com/prateekshukla17/XenCRM_Backend) repository.

## Frontend Overview

- Authenticates via Google OAuth (NextAuth).
- Provides UI to create segments, create campaigns, and view dashboards.
- Communicates with Campaigns DB via APIs (/segments, /campaigns, /dashboard, /campaignStats).

![Frontend](./readme_resources/frontend.png)

## Technology Stack

- **Next.js 15.5.2**
- **TypeScript** with strict configuration
- **Tailwind CSS v4** with shadcn/ui components
- **Prisma ORM** with PostgreSQL database
- **NextAuth.js** for authentication
- **Turbopack** for development and build optimization
- **Recharts** for data visualization

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm
- PostgreSQL

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/prateekshukla17/XenCRM_Frontend.git
    cd XenCRM_Frontend
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Set up environment variables (see below).

4.  Set up the database (see below).

5.  Run the development server:

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

## Environment Variables

Create a `.env` file in the root of the project and add the following environment variables. You can use the `.env.example` as a template.

```
# .env.example

# PostgreSQL database connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Google OAuth credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth secret
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Available Scripts

- `npm run dev`: Starts the development server with Turbopack.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.

## Project Structure

```
├───prisma/
│   └───schema.prisma
└───src/
    ├───app/
    │   ├───page.tsx
    │   ├───api/
    │   │   ├───auth/
    │   │   │   └───[...nextauth]/
    │   │   │       └───route.ts
    │   │   ├───campaigns/
    │   │   │   └───route.ts
    │   │   ├───campaignstats/
    │   │   │   └───route.ts
    │   │   ├───dashapi/
    │   │   │   └───route.ts
    │   │   └───segments/
    │   │       ├───route.ts
    │   │       ├───[segmentId]/
    │   │       │   └───route.ts
    │   │       └───preview/
    │   │           └───route.ts
    │   ├───campaigns/
    │   │   └───page.tsx
    │   ├───campaignStats/
    │   │   └───page.tsx
    │   ├───dashboard/
    │   │   └───page.tsx
    │   └───segments/
    │       └───page.tsx
    ├───components/
    │   ├───hero.tsx
    │   ├───loginsection.tsx
    │   ├───navbar.tsx
    │   ├───providers/
    │   │   └───SessionProvider.tsx
    │   └───ui/
    │       └───button.tsx
    ├───generated/
    │   └───prisma/...
```
