├── server/
│   ├── services/
│   │   ├── scraper/
│   │   │   ├── base.ts
│   │   │   ├── blackstone.ts
│   │   │   └── manager.ts
│   │   └── job-processor.ts
│   ├── db.ts
│   ├── routes.ts
│   └── storage.ts
├── client/
│   └── src/
│       ├── components/
│       │   ├── JobCard.tsx
│       │   └── JobList.tsx
│       └── pages/
│           └── index.tsx
├── shared/
│   └── schema.ts
├── vercel.json
└── drizzle.config.ts
```

## Required Dependencies
Install these packages:
```bash
npm install @neondatabase/serverless drizzle-orm drizzle-zod @tanstack/react-query openai axios cheerio p-queue robots-parser ws @types/ws
```

## Environment Variables Required
Make sure to set these in Vercel:
1. `DATABASE_URL` - Your PostgreSQL database URL
2. `OPENAI_API_KEY` - Your OpenAI API key

## Files to Copy

### 1. vercel.json
```json
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

### 2. server/db.ts
```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Only use WebSocket in non-edge environment (local development)
if (!process.env.VERCEL_ENV) {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database?',
  );
}

// Configure pool based on environment
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
});

export const db = drizzle({ client: pool, schema });
```

### 3. server/services/scraper/base.ts
```typescript
${fs.readFileSync('server/services/scraper/base.ts', 'utf8')}
```

### 4. server/services/scraper/blackstone.ts
```typescript
${fs.readFileSync('server/services/scraper/blackstone.ts', 'utf8')}
```

### 5. server/services/scraper/manager.ts
```typescript
${fs.readFileSync('server/services/scraper/manager.ts', 'utf8')}
```

### 6. server/services/job-processor.ts
```typescript
${fs.readFileSync('server/services/job-processor.ts', 'utf8')}
```

### 7. server/routes.ts
```typescript
${fs.readFileSync('server/routes.ts', 'utf8')}
```

### 8. server/storage.ts
```typescript
${fs.readFileSync('server/storage.ts', 'utf8')}
```

### 9. client/src/components/JobCard.tsx
```typescript
${fs.readFileSync('client/src/components/JobCard.tsx', 'utf8')}
```

### 10. client/src/components/JobList.tsx
```typescript
${fs.readFileSync('client/src/components/JobList.tsx', 'utf8')}
```

### 11. client/src/pages/index.tsx
```typescript
${fs.readFileSync('client/src/pages/index.tsx', 'utf8')}
```

### 12. shared/schema.ts
```typescript
${fs.readFileSync('shared/schema.ts', 'utf8')}
```

### 13. drizzle.config.ts
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