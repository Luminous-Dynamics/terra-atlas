# 🛠️ Terra Atlas Developer Guide

Welcome to the Terra Atlas developer team! This guide will help you get up and running quickly.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Architecture Overview](#architecture-overview)
5. [Code Standards](#code-standards)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (check: `node --version`)
- **npm** or **yarn** (check: `npm --version`)
- **Git** (check: `git --version`)
- **Supabase Account** (for database)
- **Optional**: Stripe account (for payments)

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/Luminous-Dynamics/terra-atlas.git
cd terra-atlas

# 2. Run the interactive setup script
node scripts/setup.js

# OR manually:
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Generate JWT secret
openssl rand -base64 32
# Add to .env.local as JWT_SECRET

# 3. Start development server
npm run dev

# 4. Open in browser
open http://localhost:3002
```

### Verify Setup

```bash
# Check health endpoint
curl http://localhost:3002/api/health

# Check stats endpoint
curl http://localhost:3002/api/stats
```

### VS Code Setup (Recommended)

The project includes VS Code configuration for the best development experience:

**Automatic Setup**:
1. Open the project in VS Code
2. Install recommended extensions (you'll see a popup)
3. Settings will be applied automatically

**What's Configured**:
- ✅ Format on Save (Prettier)
- ✅ Auto fix on Save (ESLint)
- ✅ TypeScript import organization
- ✅ Tailwind CSS IntelliSense
- ✅ Debugging configurations (Next.js, Jest)

**Manual Extension Installation** (if needed):
```bash
# Install all recommended extensions at once
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
# ... (or use the Extensions panel)
```

**Debugging**: Use F5 to start debugging. Choose from:
- Next.js: server-side
- Next.js: client-side
- Next.js: full-stack
- Jest: current file
- Jest: all tests

---

## 📁 Project Structure

```
terra-atlas/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── projects/        # Project CRUD
│   │   ├── investments/     # Investment management
│   │   ├── stats/           # Statistics API
│   │   └── health/          # Health check
│   ├── page.tsx             # Homepage
│   ├── layout.tsx           # Root layout
│   └── [routes]/            # App pages
│
├── components/               # React Components
│   ├── TerraGlobeWithSites.tsx  # Main 3D globe
│   ├── ErrorBoundary.tsx    # Error handling
│   └── [others]/            # UI components
│
├── lib/                      # Utilities & Libraries
│   ├── middleware.ts        # API middleware (rate limiting, auth)
│   ├── logger.ts            # Logging utility
│   ├── auth.ts              # Authentication utilities
│   ├── env.ts               # Environment validation
│   ├── constants.ts         # Application constants
│   ├── validation/          # Input validation schemas (Zod)
│   │   ├── common.schemas.ts    # Reusable primitives
│   │   ├── auth.schemas.ts      # Authentication
│   │   ├── projects.schemas.ts  # Projects
│   │   └── investments.schemas.ts # Investments
│   ├── errors/              # Error management
│   │   ├── error-types.ts       # Custom error classes
│   │   ├── error-handler.ts     # Centralized error handling
│   │   └── error-recovery.ts    # Recovery strategies
│   ├── api/                 # API utilities
│   │   ├── types.ts            # API response types
│   │   ├── responses.ts        # Response builders
│   │   └── pagination.ts       # Pagination helpers
│   ├── types/               # TypeScript types
│   └── drizzle/             # Database ORM
│
├── scripts/                  # Build & setup scripts
│   └── setup.js             # Interactive setup
│
├── docs/                     # Documentation
│   ├── API.md               # API documentation
│   └── DEVELOPER_GUIDE.md   # This file
│
├── public/                   # Static assets
└── data/                     # Static data files
```

---

## 🔄 Development Workflow

### Daily Development

```bash
# Start dev server (with hot reload)
npm run dev

# In separate terminals:
# Watch TypeScript
npx tsc --watch --noEmit

# Run linter
npx eslint app/ components/ lib/
```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow code standards (see below)
   - Write tests for new features
   - Update documentation

3. **Test locally**
   ```bash
   # Type check
   npx tsc --noEmit

   # Lint
   npx eslint .

   # Build
   npm run build
   ```

4. **Commit & push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to GitHub
   - Create PR with detailed description
   - Request review

### Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```bash
feat: add rate limiting to authentication endpoints
fix: correct IRR calculation in investment calculator
docs: update API documentation with new endpoints
refactor: simplify error handling in auth routes
```

### Automated Git Hooks

The project uses **Husky** to automatically enforce code quality before commits:

**Pre-commit Hook** (automatic):
- Runs Prettier to format staged files
- Runs ESLint to fix linting issues
- Ensures consistent code style

**Commit Message Hook** (automatic):
- Validates commit message format
- Enforces Conventional Commits standard
- Rejects commits with invalid messages

**Pre-push Hook** (automatic):
- Runs TypeScript type checking
- Prevents pushing code with type errors

**How It Works**:
```bash
# When you commit, hooks run automatically:
git add .
git commit -m "feat: add new feature"
# → Prettier formats your code
# → ESLint fixes issues
# → Commit message is validated
# → Commit succeeds if all checks pass

# When you push, type checking runs:
git push
# → TypeScript checks for type errors
# → Push succeeds if no errors
```

**If a hook fails**:
```bash
# Fix the issues and try again
npm run format        # Format all files
npm run lint:fix      # Fix linting issues
npm run type-check    # Check for type errors
```

**Bypassing hooks** (not recommended):
```bash
# Only use in emergencies
git commit --no-verify -m "emergency fix"
```

---

## 🏗️ Architecture Overview

### Technology Stack

- **Frontend**: React 19, Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL), SQLite (local)
- **ORM**: Drizzle ORM
- **Authentication**: JWT, bcrypt
- **Payments**: Stripe
- **3D Graphics**: Three.js
- **Maps**: Mapbox GL

### Key Concepts

#### 1. API Routes

All API routes are in `app/api/`. They follow this structure:

```typescript
import { NextRequest } from 'next/server'
import { withRateLimit, withErrorHandling, successResponse } from '@/lib/middleware'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  return withRateLimit(
    request,
    async () => withErrorHandling(async () => {
      logger.api('GET', '/api/your-route')

      // Your logic here

      return successResponse({ data: 'your data' })
    }),
    { maxRequests: 60, windowMs: 60000 }
  )
}
```

#### 2. Middleware

We use custom middleware for:
- **Rate Limiting**: Prevent abuse
- **Authentication**: Verify JWT tokens
- **Error Handling**: Standardized error responses
- **Logging**: Environment-aware logging

See `lib/middleware.ts` for all available functions.

#### 3. Logging

**Never use console.log in production code!**

Instead, use our logger:

```typescript
import { logger } from '@/lib/logger'

logger.debug('Debug info')   // Only in development
logger.info('Info message')  // Only in development
logger.warn('Warning')       // Always shown
logger.error('Error', error) // Always shown
logger.api('GET', '/api/route', { data }) // API logging
```

#### 4. Type Safety

All API routes should have TypeScript types:

```typescript
import type { LoginRequest, LoginResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  const body: LoginRequest = await request.json()
  // ... logic ...
  const response: LoginResponse = { user, token, refreshToken, expiresIn }
  return NextResponse.json(response)
}
```

#### 5. Input Validation

All API endpoints use **Zod** for runtime validation:

```typescript
import { loginSchema, type LoginInput } from '@/lib/validation'
import { validate } from '@/lib/validation/common.schemas'

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json()

    // Validate input
    const result = validate(loginSchema, body)
    if (!result.success) {
      return errorResponse('Validation failed', 400, result.errors)
    }

    const data: LoginInput = result.data // Type-safe!

    // Your logic here...
  })
}
```

**Available Schema Modules**:
- `common.schemas.ts` - Reusable primitives (email, password, pagination, etc.)
- `auth.schemas.ts` - Login, register, password reset
- `projects.schemas.ts` - Project CRUD operations
- `investments.schemas.ts` - Investment management

**Key Benefits**:
- ✅ Runtime type validation
- ✅ Automatic TypeScript type inference
- ✅ Sanitized input (trimming, normalization)
- ✅ Detailed error messages
- ✅ Reusable validation logic

#### 6. Error Handling

Use custom error types for better error management:

```typescript
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  DatabaseError,
} from '@/lib/errors'
import { handleError, logError } from '@/lib/errors/error-handler'
import { withRetry, canRecover } from '@/lib/errors/error-recovery'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Throw custom errors
    if (!userId) {
      throw new AuthenticationError('User not authenticated')
    }

    const user = await db.findUser(userId)
    if (!user) {
      throw new NotFoundError('User', userId)
    }

    // Retry logic for external services
    const data = await withRetry(
      () => fetchExternalAPI(),
      { maxRetries: 3, baseDelay: 1000 }
    )

    return successResponse(data)
  })
}
```

**Available Error Types**:
- `ValidationError` - Invalid input data (400)
- `AuthenticationError` - Missing/invalid credentials (401)
- `AuthorizationError` - Insufficient permissions (403)
- `NotFoundError` - Resource not found (404)
- `ConflictError` - Resource conflict (409)
- `RateLimitError` - Too many requests (429)
- `DatabaseError` - Database operation failures (500)
- `ExternalServiceError` - Third-party API failures (502/503)

**Error Handling Features**:
- ✅ Automatic error logging with context
- ✅ Error recovery strategies (retry, fallback, redirect)
- ✅ Circuit breaker pattern for failing services
- ✅ Type-safe error handling
- ✅ Production-ready error reporting hooks

#### 7. API Responses

Use standardized response builders for all API endpoints:

```typescript
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  notFoundResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'

// Success response
export async function GET(request: NextRequest) {
  const data = await fetchData()
  return successResponse(data) // 200 OK
}

// Created response
export async function POST(request: NextRequest) {
  const item = await createItem(body)
  return createdResponse(item, {
    location: `/api/items/${item.id}`,
  }) // 201 Created
}

// Paginated response
export async function GET(request: NextRequest) {
  const { limit, offset } = parsePaginationParams(request)
  const items = await db.findMany({ limit, offset })
  const total = await db.count()

  return paginatedResponse(items, { total, limit, offset })
}

// Error responses
throw new NotFoundError('Project', id) // Automatically converted to 404
return validationErrorResponse(['Email is required', 'Password too short'])
```

**Response Format**:
All responses follow a consistent structure:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-11-15T10:30:00Z",
    "requestId": "req_123",
    "version": "1.0.0"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with ID 123 not found",
    "details": { ... }
  },
  "meta": { ... }
}

// Paginated
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true,
    "page": 1,
    "totalPages": 5
  },
  "meta": { ... }
}
```

---

## 📏 Code Standards

### TypeScript

- ✅ Use strict type checking
- ✅ Avoid `any` types (use `unknown` if needed)
- ✅ Define interfaces for all data structures
- ✅ Use type imports: `import type { User } from '@/lib/types'`

### React Components

```typescript
// Good: Functional component with TypeScript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn btn-${variant}`}>
      {label}
    </button>
  )
}
```

### API Routes

- ✅ Use middleware for all routes
- ✅ Add rate limiting to public endpoints
- ✅ Use logger instead of console
- ✅ Return standardized responses
- ✅ Handle errors gracefully

### Naming Conventions

- **Files**: `kebab-case.tsx`, `PascalCase.tsx` for components
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (prefix with `I` optional)

### Code Formatting

We use **Prettier** for automatic code formatting:

```bash
# Format all files
npx prettier --write .

# Check formatting
npx prettier --check .

# VS Code: Format on save (enabled by default)
```

**Prettier Config** (`.prettierrc`):
- No semicolons
- Single quotes
- 100 character line width
- 2-space indentation
- LF line endings

**Best Practice**: Enable "Format on Save" in VS Code settings (already configured in `.vscode/settings.json`)

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Writing Tests

Example test for middleware:

```typescript
import { checkRateLimit } from '@/lib/middleware'

describe('Rate Limiting', () => {
  it('should allow requests within limit', () => {
    const result = checkRateLimit('test-key', 5, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('should block requests over limit', () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-key-2', 5, 60000)
    }

    // 6th request should be blocked
    const result = checkRateLimit('test-key-2', 5, 60000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })
})
```

### Test Coverage Goals

- **Utilities**: 80%+ coverage
- **API Routes**: 70%+ coverage
- **Components**: 60%+ coverage

---

## 🚀 Deployment

### Environment Variables

**Environment Validation**: All environment variables are validated at startup using Zod (see `lib/env.ts`). If required variables are missing or invalid, the application will fail fast with clear error messages.

**Required** for production:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication (Required)
JWT_SECRET=your-secure-jwt-secret-min-32-chars  # Must be 32+ characters

# Application
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://your-domain.com
PORT=3002

# Database (Optional - defaults to SQLite locally)
DATABASE_URL=postgresql://user:pass@host:port/db

# Stripe (Optional - for payment features)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_GTM_ID=GTM-...
```

**Validation Helpers**:
```typescript
import { getEnv, validateEnv, checkRequiredEnvVars } from '@/lib/env'

// Get validated env vars (throws if invalid)
const env = getEnv()

// Check validation status
const status = checkRequiredEnvVars()
if (!status.hasAllRequired) {
  console.error('Missing:', status.missing)
}
```

### Deployment Steps

1. **Prepare**
   ```bash
   # Ensure all tests pass
   npm test

   # Build successfully
   npm run build

   # Check for type errors
   npx tsc --noEmit
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Deploy
   vercel --prod
   ```

3. **Post-Deployment**
   - ✅ Check health endpoint: `https://your-domain.com/api/health`
   - ✅ Verify Supabase connection
   - ✅ Test critical flows (login, register)
   - ✅ Monitor error logs

### Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase RLS policies configured
- [ ] Stripe webhook endpoint configured
- [ ] Error monitoring enabled (Sentry)
- [ ] Analytics configured
- [ ] SSL certificate valid
- [ ] Custom domain configured
- [ ] Build succeeds without errors
- [ ] Health check passes

---

## 🔧 Troubleshooting

### Common Issues

#### "Missing Supabase environment variables"

**Solution**: Create `.env.local` file with required variables:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

#### "JWT_SECRET environment variable is not set"

**Solution**: Generate and add JWT secret:
```bash
openssl rand -base64 32
# Add to .env.local as JWT_SECRET=<generated-value>
```

#### "Cannot find module '@/lib/...'"

**Solution**: TypeScript path aliases issue. Restart dev server:
```bash
# Kill server, then:
npm run dev
```

#### Rate limit errors during development

**Solution**: Rate limits are per IP. Restart server to clear in-memory cache, or increase limits in development:

```typescript
// In the route file
{ maxRequests: 1000, windowMs: 60000 } // More lenient for dev
```

#### Build fails with type errors

**Solution**: Fix TypeScript errors. Never ignore them:
```bash
npx tsc --noEmit
# Fix all errors shown
```

### Getting Help

1. **Check documentation**:
   - This guide
   - API.md for API docs
   - IMPROVEMENTS.md for recent changes

2. **Search existing issues**:
   - GitHub issues tab

3. **Ask the team**:
   - Slack: #terra-atlas-dev
   - Email: dev@luminousdynamics.io

4. **Create an issue**:
   - Use issue templates
   - Include error logs
   - Describe steps to reproduce

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Drizzle ORM](https://orm.drizzle.team)

---

## 🚀 Phase 4 Features - Production-Grade Infrastructure

### Caching System

**Overview**: Terra Atlas implements a production-grade caching infrastructure with LRU (Least Recently Used) eviction, TTL support, and comprehensive invalidation strategies.

#### Using the Cache

```typescript
import {
  withCache,
  createCacheKey,
  CACHE_DURATIONS,
  CACHE_PREFIXES,
} from '@/lib/cache'

// Basic cache-aside pattern
export async function GET(request: NextRequest) {
  const cacheKey = createCacheKey(CACHE_PREFIXES.PROJECTS, 'list', filters)

  const data = await withCache(
    cacheKey,
    async () => {
      // Expensive database query
      return await db.getProjects(filters)
    },
    { ttl: CACHE_DURATIONS.SHORT } // 5 minutes
  )

  return successResponse(data)
}
```

#### Cache Invalidation

```typescript
import {
  onProjectCreated,
  onProjectUpdated,
  invalidatePattern,
  invalidateTags,
} from '@/lib/cache'

// In mutation endpoints (POST/PATCH/DELETE)
export async function POST(request: NextRequest) {
  // Create the project
  const project = await db.createProject(data)

  // Invalidate related caches
  await onProjectCreated(project.id)

  return createdResponse(project)
}

// Manual invalidation
await invalidatePattern('projects:*')  // Clear all project caches
await invalidateTags(['projects', 'stats'])  // Clear by tags
```

#### HTTP Caching with ETags

```typescript
import {
  generateETag,
  hasMatchingETag,
  notModifiedResponse,
} from '@/lib/cache'

export async function GET(request: NextRequest) {
  const project = await fetchProject(id)

  // Generate ETag from data
  const etag = generateETag(project)

  // Return 304 if client has current version
  if (hasMatchingETag(request, etag)) {
    return notModifiedResponse(etag)
  }

  // Return full response with ETag header
  return successResponse(project, {
    headers: {
      'ETag': etag,
      'Cache-Control': 'public, max-age=900',
    }
  })
}
```

#### Cache Configuration

```typescript
// lib/cache/index.ts exports these constants
CACHE_DURATIONS = {
  VERY_SHORT: 60,    // 1 minute
  SHORT: 300,        // 5 minutes (default for lists)
  MEDIUM: 900,       // 15 minutes (default for details)
  LONG: 3600,        // 1 hour
  VERY_LONG: 86400,  // 24 hours
}

CACHE_PREFIXES = {
  PROJECTS: 'projects',
  PROJECT: 'project',
  INVESTMENTS: 'investments',
  STATS: 'stats',
  // ...
}
```

#### Cache Monitoring

Access cache statistics via the health endpoint:

```bash
curl https://your-domain.com/api/health
```

Response includes cache health:
```json
{
  "checks": {
    "cache": {
      "status": "healthy",
      "size": 347,
      "hits": 12450,
      "misses": 3821,
      "hitRate": "76.52%",
      "memoryUsage": "4.32 MB",
      "healthScore": 87
    }
  }
}
```

#### Admin Cache Management

```typescript
// GET /api/admin/cache - View detailed stats
curl -H "Authorization: Bearer $TOKEN" \
  https://your-domain.com/api/admin/cache

// POST /api/admin/cache - Clear caches
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"operation": "clear_pattern", "pattern": "projects:*"}' \
  https://your-domain.com/api/admin/cache
```

#### Best Practices

1. **Always cache expensive operations**:
   - Database queries with joins
   - Aggregations and statistics
   - External API calls

2. **Use appropriate TTLs**:
   - Frequently changing data: SHORT (5 min)
   - Relatively static data: MEDIUM (15 min)
   - Rarely changing data: LONG (1 hour)

3. **Always invalidate on mutations**:
   ```typescript
   // After creating/updating/deleting
   await onResourceCreated(id, userId)  // Uses cascade invalidation
   ```

4. **Include cache headers**:
   ```typescript
   return successResponse(data, {
     headers: {
       'Cache-Control': `public, max-age=${CACHE_DURATIONS.SHORT}`,
       'ETag': etag,
     }
   })
   ```

5. **Monitor cache performance**:
   - Check hit rate (target: >70%)
   - Monitor memory usage
   - Review cache size

### Performance Tracking

All endpoints include detailed performance metrics:

```typescript
import { startTimer } from '@/lib/logging/performance-logger'

export async function GET(request: NextRequest) {
  const timer = startTimer('operation_name')

  timer.mark('validation_complete')
  // ... validation ...

  timer.mark('database_query_start')
  // ... query ...
  timer.mark('database_query_complete')

  const duration = timer.endAndLog({ operation: 'operation_name' })

  return successResponse(data, {
    metadata: {
      performance: {
        validation: timer.getMark('validation_complete'),
        database_query: timer.getMark('database_query_complete')! - timer.getMark('database_query_start')!,
        total: duration,
      }
    }
  })
}
```

### Structured Logging

Use structured logging for better observability:

```typescript
import { structuredLogger } from '@/lib/logging/structured-logger'

// Info logging with context
structuredLogger.info('Operation completed', {
  operation: 'create_project',
  userId: context.userId,
  projectId: project.id,
  duration: 123,
})

// Error logging with stack traces
structuredLogger.error('Database error', error, {
  operation: 'fetch_projects',
  query: queryParams,
})

// Business event logging
structuredLogger.logBusiness('investment_created', {
  investmentId: investment.id,
  amount: 50000,
  expectedReturn: 6000,
})
```

### Standard Endpoint Pattern

All new endpoints should follow this pattern:

```typescript
import { NextRequest } from 'next/server'
import { withMiddleware } from '@/lib/middleware'
import { successResponse, paginatedResponse } from '@/lib/api/responses'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { startTimer } from '@/lib/logging/performance-logger'
import { yourSchema } from '@/lib/validation/your.schemas'
import { RATE_LIMITS } from '@/lib/config'
import {
  withCache,
  createCacheKey,
  CACHE_DURATIONS,
  onResourceUpdated,
} from '@/lib/cache'

// GET endpoint (with caching)
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('get_resource')

      // Validate query parameters
      const { searchParams } = new URL(request.url)
      const validated = yourSchema.parse(Object.fromEntries(searchParams))
      timer.mark('validation_complete')

      // Generate cache key
      const cacheKey = createCacheKey(CACHE_PREFIXES.YOUR_RESOURCE, 'list', validated)

      // Use cache-aside pattern
      const data = await withCache(
        cacheKey,
        async () => {
          timer.mark('database_query_start')
          const result = await db.query(validated)
          timer.mark('database_query_complete')
          return result
        },
        { ttl: CACHE_DURATIONS.SHORT }
      )

      const duration = timer.endAndLog({ operation: 'get_resource' })

      structuredLogger.info('Resource fetched', {
        operation: 'get_resource',
        count: data.length,
        duration,
      })

      return paginatedResponse(data, { total, limit, offset }, {
        requestId: context.requestId,
        headers: {
          'Cache-Control': `public, max-age=${CACHE_DURATIONS.SHORT}`,
        },
        metadata: {
          performance: {
            validation: timer.getMark('validation_complete'),
            query: timer.getMark('database_query_complete')! - timer.getMark('database_query_start')!,
            total: duration,
          }
        }
      })
    },
    {
      rateLimit: RATE_LIMITS.api.yourResource,
      performanceTracking: true,
    }
  )
}

// POST endpoint (with cache invalidation)
export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const timer = startTimer('create_resource')

      const body = await request.json()
      const validated = yourSchema.parse(body)
      timer.mark('validation_complete')

      // Create resource
      timer.mark('database_insert_start')
      const resource = await db.create(validated)
      timer.mark('database_insert_complete')

      const duration = timer.endAndLog({ operation: 'create_resource' })

      // Log business event
      structuredLogger.logBusiness('resource_created', {
        resourceId: resource.id,
        userId: context.userId,
      })

      // Invalidate caches
      timer.mark('cache_invalidation_start')
      await onResourceCreated(resource.id, context.userId!)
      timer.mark('cache_invalidation_complete')

      return createdResponse(resource, {
        location: `/api/resources/${resource.id}`,
        requestId: context.requestId,
        metadata: {
          performance: {
            validation: timer.getMark('validation_complete'),
            insert: timer.getMark('database_insert_complete')! - timer.getMark('database_insert_start')!,
            cache_invalidation: timer.getMark('cache_invalidation_complete')! - timer.getMark('cache_invalidation_start')!,
            total: duration,
          }
        }
      })
    },
    {
      auth: true, // Require authentication
      rateLimit: { maxRequests: 10, windowMs: 60000 }, // Stricter for writes
      performanceTracking: true,
    }
  )
}
```

### Migration Checklist

When updating an existing endpoint to Phase 4 patterns:

- [ ] Import middleware and utilities
- [ ] Wrap handler with `withMiddleware()`
- [ ] Add Zod validation schema
- [ ] Add performance timer with marks
- [ ] Replace console.log with structured logging
- [ ] Add caching (for GET endpoints)
- [ ] Add cache invalidation (for mutation endpoints)
- [ ] Include performance metadata in response
- [ ] Add proper rate limiting
- [ ] Test with real data
- [ ] Monitor cache hit rate

### Performance Targets

**Response Times**:
- Cached GET requests: <5ms (target)
- Uncached GET requests: <100ms (target)
- POST/PATCH requests: <200ms (target)

**Cache Performance**:
- Hit rate: >70% (after warmup)
- Memory usage: <100MB total
- Eviction rate: <10%

**Database**:
- Query time: <50ms (p95)
- Connection pool: <80% utilization

---

## 🎉 You're Ready!

Welcome to the team! If you have any questions, don't hesitate to ask.

**Happy coding!** 🚀

---

_Last updated: 2025-11-16_
