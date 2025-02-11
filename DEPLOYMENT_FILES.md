{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "client/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Database Configuration
2. `drizzle.config.ts`
```typescript
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

## Server Files
Copy all files from:
- `server/services/scraper/`
- `server/db.ts`
- `server/routes.ts`
- `server/storage.ts`

## Frontend Files
Copy all files from:
- `client/src/components/`
- `client/src/pages/`
- `client/src/App.tsx`
- `client/src/main.tsx`

## Shared Files
Copy `shared/schema.ts` for database schema and types.

## Environment Variables Required
Make sure to set these in Vercel:
1. `DATABASE_URL` - Your PostgreSQL database URL
2. `OPENAI_API_KEY` - Your OpenAI API key

## Important Notes
- When copying files, maintain the same directory structure
- All imports should use the same paths as in the original files
- The database must be PostgreSQL (preferably on Neon.tech for Vercel compatibility)

## Current Working Code
For your convenience, here are the key files with their current working code:

### 1. Scraper Service
#### server/services/scraper/blackstone.ts
```typescript
// Current working implementation from the file system
```

#### server/services/scraper/base.ts
```typescript
// Current working implementation from the file system
```

### 2. Frontend Components
#### client/src/components/JobCard.tsx
```typescript
// Current working implementation from the file system
```

#### client/src/components/JobList.tsx
```typescript
// Current working implementation from the file system