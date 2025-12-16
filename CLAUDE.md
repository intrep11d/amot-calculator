# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Amot Calculator** is a full-stack web application for bill splitting that tracks item-by-item expenses and calculates who owes whom after group outings.

## Monorepo Structure

This is a monorepo with two separate applications:

```
amot-calculator/
├── client/          # React frontend (Vite)
├── server/          # Express backend (Node.js)
└── CLAUDE.md
```

Both applications must be run simultaneously for full functionality.

## Development Commands

### Server (Backend)
```bash
cd server
npm run dev          # Start development server with hot reload (nodemon)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled production build
npx prisma generate  # Regenerate Prisma Client after schema changes
npx prisma studio    # Open Prisma Studio GUI for database inspection
```

### Client (Frontend)
```bash
cd client
npm run dev          # Start Vite dev server (default: http://localhost:5173)
npm run build        # Build for production (TypeScript compile + Vite build)
npm run preview      # Preview production build locally
```

### Database Operations

**IMPORTANT:** This project uses Prisma 7.1.0 with Supabase. Database connection is configured via `prisma.config.ts`, not in `schema.prisma`.

```bash
cd server

# Push schema changes to database (development)
DATABASE_URL="<DIRECT_URL>" npx prisma db push

# For migrations (not currently used):
npx prisma migrate dev --name <migration_name>
```

**Note:** Always use `DIRECT_URL` (port 5432) for migrations/schema pushes, not the pooled `DATABASE_URL` (port 6543). The pooler doesn't support DDL operations.

## Architecture

### Backend Architecture

**Technology:** Express.js + TypeScript + Prisma ORM + PostgreSQL (Supabase)

**Structure:**
- **MVC Pattern**: Controllers handle request logic, routes define endpoints
- **Prisma ORM**: Type-safe database access with generated client
- **Connection Pooling**: Uses Supabase connection pooler via pg adapter

```
server/src/
├── controllers/          # Request handlers for each resource
│   ├── sessionController.ts
│   ├── participantController.ts
│   ├── itemController.ts
│   └── settlementController.ts
├── routes/              # Express route definitions
│   ├── sessionRoutes.ts
│   ├── participantRoutes.ts
│   ├── itemRoutes.ts
│   └── settlementRoutes.ts
├── prisma.ts            # Prisma Client instance (uses pg adapter)
└── server.ts            # Express app entry point
```

**Key Files:**
- `server/src/prisma.ts`: Prisma Client configuration with pg Pool adapter for Supabase connection pooling
- `server/prisma/schema.prisma`: Database schema (4 models: Session, Participant, Item, ItemSplit)
- `server/prisma.config.ts`: Prisma 7 configuration (connection URLs for migrations)

**API Endpoints:**
- `/api/sessions` - Session CRUD
- `/api/sessions/:sessionId/participants` - Participant management
- `/api/sessions/:sessionId/items` - Item management
- `/api/sessions/:sessionId/settlements` - Settlement calculations
- `/api/participants/:id` - Delete participant
- `/api/items/:id` - Update/delete item

### Frontend Architecture

**Technology:** React 18 + Vite + TypeScript + React Router + Tailwind CSS v4 + Axios

**Structure:**
- **Component-based**: Pages contain inline modal components
- **API Service Layer**: Centralized Axios instance in `services/api.ts`
- **Type Safety**: Shared types in `types/index.ts` match backend models

```
client/src/
├── pages/               # Route components
│   ├── HomePage.tsx     # Session list + creation
│   └── SessionPage.tsx  # Main interface (participants, items, settlements)
├── services/
│   └── api.ts           # API client (axios) with typed methods
├── types/
│   └── index.ts         # TypeScript interfaces
├── App.tsx              # Router setup
└── main.tsx             # Entry point
```

**Routing:**
- `/` - HomePage (session list)
- `/session/:id` - SessionPage (detailed session view)

**State Management:**
- Component-level `useState` (no Redux/Zustand)
- API calls trigger re-fetches to sync state

### Database Schema

**4 Core Models:**

1. **Session**: Top-level grouping (e.g., "Friday Night Out")
2. **Participant**: People in a session
3. **Item**: Expenses with description, amount, payer
4. **ItemSplit**: Junction table tracking who owes what for each item

**Key Relationships:**
- Session → Participants (one-to-many)
- Session → Items (one-to-many)
- Item → Participant (many-to-one, "paidBy")
- Item → ItemSplits (one-to-many)
- Participant → ItemSplits (one-to-many)

**Cascade Deletes:** Deleting a session cascades to participants, items, and splits.

### Settlement Calculation Algorithm

Located in `server/src/controllers/settlementController.ts`:

1. For each item, credit the payer and debit participants based on their splits
2. Calculate net balances for all participants
3. Match debtors (negative balance) with creditors (positive balance)
4. Generate debt list ("Alice owes Bob $15.50")

## Database Connection (Supabase)

**Connection Configuration:**

The app uses **two** connection URLs (defined in `server/.env`):

1. **DATABASE_URL** (port 6543): Connection pooler for runtime queries
   - Used by Prisma Client via pg adapter
   - Fast, handles connection pooling via pgbouncer

2. **DIRECT_URL** (port 5432): Direct connection for migrations
   - Required for DDL operations (CREATE TABLE, ALTER, etc.)
   - Used by Prisma Migrate and `db push`

**Prisma 7 Configuration:**

Unlike Prisma 6, connection URLs are NOT in `schema.prisma`. They're configured via:
- `server/prisma.config.ts`: Defines `datasource.url` and `migrations.url`
- `server/src/prisma.ts`: Instantiates PrismaClient with pg adapter

**Running Migrations:**

```bash
# ALWAYS use DIRECT_URL for schema changes
DATABASE_URL="<DIRECT_URL from .env>" npx prisma db push
```

The pooled DATABASE_URL will hang on DDL operations because pgbouncer doesn't support them.

## Tailwind CSS v4

**IMPORTANT:** This project uses Tailwind CSS v4 (not v3).

**Configuration:**
- `client/postcss.config.js`: Uses `@tailwindcss/postcss` plugin
- `client/src/index.css`: Uses `@import "tailwindcss"` (not `@tailwind` directives)

**v3 → v4 Migration Notes:**
- No `tailwind.config.js` file needed
- PostCSS plugin changed from `tailwindcss` to `@tailwindcss/postcss`
- CSS imports changed from `@tailwind base/components/utilities` to `@import "tailwindcss"`

## TypeScript Configuration

Both client and server use strict TypeScript:
- `server/tsconfig.json`: CommonJS output to `dist/`
- `client/tsconfig.json`: ES modules (for Vite)

Shared type interfaces are duplicated between:
- `client/src/types/index.ts`
- Backend Prisma-generated types

## Common Patterns

### Adding a New API Endpoint

1. **Define route** in `server/src/routes/<resource>Routes.ts`
2. **Create controller** function in `server/src/controllers/<resource>Controller.ts`
3. **Add API method** in `client/src/services/api.ts`
4. **Update types** in `client/src/types/index.ts` if needed
5. **Call from component** using the API service

### Modifying Database Schema

1. Edit `server/prisma/schema.prisma`
2. Run `npx prisma generate` to update Prisma Client
3. Push changes: `DATABASE_URL="<DIRECT_URL>" npx prisma db push`
4. Restart server (`npm run dev`)
5. Update TypeScript types in `client/src/types/index.ts`

### Working with Items

**Item Creation Flow:**
- User fills `ItemFormModal` (description, amount, payer, split configuration)
- `POST /api/sessions/:sessionId/items` creates Item + ItemSplits atomically
- Validation ensures splits sum to total amount

**Split Types:**
- **Equal**: Divide total amount equally among selected participants
- **Custom**: Manually specify each participant's share

## Environment Variables

**Server** (`server/.env`):
```
PORT=5000
DATABASE_URL="<Supabase pooler URL:6543>"
DIRECT_URL="<Supabase direct URL:5432>"
```

**Client** (hardcoded in `src/services/api.ts`):
```
API_URL = http://localhost:5000/api
```

## Debugging

**Backend:**
- Check server logs in terminal running `npm run dev`
- Use Prisma Studio: `npx prisma studio` to inspect database
- Health check: `curl http://localhost:5000/health`

**Frontend:**
- React DevTools for component inspection
- Network tab for API calls
- Check Vite dev server terminal for build errors

**Database:**
- Supabase Dashboard for database inspection
- Prisma Studio: `cd server && npx prisma studio`

## Known Issues & Gotchas

1. **Prisma 7 DDL Hanging**: Never run migrations/db push with pooled DATABASE_URL - always use DIRECT_URL
2. **Tailwind v4**: Old v3 patterns won't work (no `@tailwind` directives, no `tailwind.config.js`)
3. **Monorepo Paths**: Always `cd` into `client/` or `server/` before running npm commands
4. **Port Conflicts**: Ensure ports 5000 (server) and 5173 (client) are available
5. **CORS**: Backend allows all origins in development; update for production

## Data Validation

**Critical Business Rules:**
- Item splits must sum exactly to item total amount
- Cannot delete participant if they're the payer for any item
- Cannot add items without participants in the session
- All monetary amounts must be positive

Validation is enforced in backend controllers before database operations.
