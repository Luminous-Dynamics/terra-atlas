# 🔄 Migration Guide: Adopting Phase 3 Improvements

This guide walks you through migrating existing API routes to use the new patterns, utilities, and best practices introduced in Phase 3.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Migration Strategy](#migration-strategy)
4. [Step-by-Step Migration](#step-by-step-migration)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)
7. [Migration Checklist](#migration-checklist)

---

## 📖 Overview

### What's New in Phase 3?

**Phase 3 introduced:**
- Custom error types with automatic HTTP status codes
- Standardized API response builders
- Database query helpers and transaction utilities
- Structured logging with request context
- Performance monitoring
- Admin utilities (export, bulk operations, analytics)
- Enhanced middleware with request ID tracking
- Git hooks for code quality

### Why Migrate?

**Benefits:**
- ✅ **Consistent error handling** - No more manual status codes
- ✅ **Type-safe responses** - Catch errors at compile time
- ✅ **Request tracing** - Track requests across the system
- ✅ **Performance monitoring** - Automatic performance logging
- ✅ **Better debugging** - Structured logs with context
- ✅ **Less boilerplate** - Reusable utilities
- ✅ **Production-ready** - Error recovery, retries, circuit breakers

---

## ✅ Prerequisites

Before migrating, ensure you have:

1. **Understanding of new utilities**:
   - Read `DEVELOPER_GUIDE.md` sections on Error Handling and API Responses
   - Familiarize yourself with `lib/errors/`, `lib/api/`, `lib/db/`, `lib/logging/`

2. **Development environment**:
   - Latest code pulled from main branch
   - Dependencies installed: `npm install`
   - Git hooks active (automatic after `npm install`)

3. **Testing capability**:
   - Ability to run the app locally: `npm run dev`
   - Access to test endpoints
   - Understanding of the route you're migrating

---

## 🎯 Migration Strategy

### Recommended Approach: Incremental Migration

**Don't migrate everything at once!** Instead:

1. **Start small**: Pick one simple GET endpoint
2. **Test thoroughly**: Ensure it works as expected
3. **Learn patterns**: Understand what changed and why
4. **Iterate**: Move to more complex endpoints
5. **Refine**: Improve patterns as you go

### Migration Order (Suggested)

1. **Simple GET endpoints** (read-only, no auth)
2. **Authenticated GET endpoints**
3. **Simple POST endpoints** (create operations)
4. **Complex POST/PUT endpoints** (with validation)
5. **Endpoints with pagination**
6. **Endpoints with complex business logic**

---

## 📝 Step-by-Step Migration

### Step 1: Migrate Error Handling

#### Before (Old Pattern)

```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await database.query('SELECT * FROM projects')

    if (!data) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### After (New Pattern)

```typescript
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { NotFoundError, DatabaseError } from '@/lib/errors'
import { findMany } from '@/lib/db/query-helpers'
import { projectsTable } from '@/lib/drizzle/schema'

export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    // Errors are automatically caught and converted to appropriate responses
    const projects = await findMany(projectsTable, {})

    if (projects.length === 0) {
      throw new NotFoundError('Projects')
    }

    return successResponse(projects, {
      requestId: context.requestId
    })
  })
}
```

**Key Changes:**
- ✅ No try-catch needed (handled by middleware)
- ✅ Throw typed errors instead of returning error responses
- ✅ Use `successResponse()` for consistent format
- ✅ Request ID automatically included
- ✅ Errors automatically logged with context

---

### Step 2: Migrate Response Format

#### Before (Old Pattern)

```typescript
// Inconsistent response formats
return NextResponse.json({ data: users })
return NextResponse.json({ success: true, users, message: 'Success' })
return NextResponse.json({ result: data, count: data.length })
```

#### After (New Pattern)

```typescript
import {
  successResponse,
  createdResponse,
  paginatedResponse
} from '@/lib/api/responses'

// All responses have consistent format
return successResponse(users)
// → { success: true, data: users, meta: { timestamp, requestId } }

return createdResponse(newUser, { location: `/api/users/${newUser.id}` })
// → { success: true, data: newUser, meta: {...} } + 201 status + Location header

return paginatedResponse(projects, { total: 100, limit: 20, offset: 0 })
// → { success: true, data: projects, pagination: {...}, meta: {...} }
```

**Key Changes:**
- ✅ Consistent response structure
- ✅ Automatic metadata (timestamp, requestId, version)
- ✅ Type-safe response builders
- ✅ Appropriate HTTP status codes

---

### Step 3: Migrate Database Operations

#### Before (Old Pattern)

```typescript
import Database from 'better-sqlite3'

const db = new Database('data/database.db')
const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
db.close()

if (!project) {
  throw new Error('Project not found')
}
```

#### After (New Pattern)

```typescript
import { findById, findPaginated } from '@/lib/db/query-helpers'
import { projectsTable, idColumn } from '@/lib/drizzle/schema'
import { NotFoundError } from '@/lib/errors'

// Find by ID with automatic error handling
const project = await findById(projectsTable, idColumn, id)

if (!project) {
  throw new NotFoundError('Project', id)
}

// Paginated query
const result = await findPaginated(
  projectsTable,
  { limit: 20, offset: 0 },
  {
    where: statusEq('active'),
    orderBy: { column: createdAtColumn, direction: 'desc' }
  }
)
```

**Key Changes:**
- ✅ Type-safe database operations
- ✅ Automatic performance logging
- ✅ Consistent error handling
- ✅ Built-in pagination support
- ✅ No manual connection management

---

### Step 4: Migrate Validation

#### Before (Old Pattern)

```typescript
const body = await request.json()

if (!body.email || !body.password) {
  return NextResponse.json(
    { error: 'Email and password required' },
    { status: 400 }
  )
}

if (body.email.length < 3 || !body.email.includes('@')) {
  return NextResponse.json(
    { error: 'Invalid email' },
    { status: 400 }
  )
}
```

#### After (New Pattern)

```typescript
import { loginSchema } from '@/lib/validation'
import { validate } from '@/lib/validation/common.schemas'
import { validationErrorResponse } from '@/lib/api/responses'

const body = await request.json()

// Validate with Zod schema
const result = validate(loginSchema, body)

if (!result.success) {
  return validationErrorResponse(result.errors)
}

const data = result.data // Type-safe!
```

**Or even simpler with direct parse:**

```typescript
import { loginSchema } from '@/lib/validation'

const body = await request.json()

// Throws ValidationError if invalid (caught by middleware)
const validated = loginSchema.parse(body)

// validated is now type-safe
const { email, password } = validated
```

**Key Changes:**
- ✅ Schema-based validation
- ✅ Automatic type inference
- ✅ Comprehensive error messages
- ✅ Reusable validation logic
- ✅ Input sanitization

---

### Step 5: Migrate Logging

#### Before (Old Pattern)

```typescript
console.log('Fetching projects')
console.error('Error fetching projects:', error)
console.log('Request from IP:', request.ip)
```

#### After (New Pattern)

```typescript
import { structuredLogger } from '@/lib/logging/structured-logger'
import { startTimer } from '@/lib/logging/performance-logger'

// Structured logging with context
structuredLogger.info('Fetching projects', {
  operation: 'fetch_projects',
  filters: { status: 'active' }
})

// Performance timing
const timer = startTimer('fetch_projects')
const projects = await fetchProjects()
timer.endAndLog({ count: projects.length })

// Error logging with context
structuredLogger.error('Failed to fetch projects', error, {
  operation: 'fetch_projects',
  attempted: Date.now()
})

// Request ID automatically included from context!
```

**Key Changes:**
- ✅ Structured logs (JSON in production)
- ✅ Automatic request ID inclusion
- ✅ Performance timing built-in
- ✅ Contextual information
- ✅ Production-ready logging

---

### Step 6: Use Enhanced Middleware

#### Before (Old Pattern)

```typescript
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Manual auth check
    const token = request.headers.get('authorization')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Manual rate limiting
    const ip = request.headers.get('x-forwarded-for')
    // ... rate limit logic ...

    const data = await fetchData()

    const duration = Date.now() - startTime
    console.log(`Request took ${duration}ms`)

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
```

#### After (New Pattern)

```typescript
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'

export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      // context.userId automatically populated if authenticated
      // context.requestId available
      // Performance automatically tracked

      const data = await fetchData()

      return successResponse(data, {
        requestId: context.requestId
      })
    },
    {
      auth: true, // Automatic authentication
      rateLimit: { maxRequests: 100, windowMs: 60000 }, // Automatic rate limiting
      performanceTracking: true // Automatic performance logging
    }
  )
}
```

**Key Changes:**
- ✅ Automatic auth, rate limiting, performance tracking
- ✅ Request context available
- ✅ Error handling built-in
- ✅ Request ID in headers
- ✅ Less boilerplate

---

## 🎨 Common Patterns

### Pattern 1: Simple GET Endpoint

```typescript
import { NextRequest } from 'next/server'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { findMany } from '@/lib/db/query-helpers'
import { projectsTable } from '@/lib/drizzle/schema'

export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const projects = await findMany(projectsTable, {
      orderBy: { column: createdAtColumn, direction: 'desc' },
      limit: 50
    })

    return successResponse(projects, {
      requestId: context.requestId
    })
  })
}
```

---

### Pattern 2: Paginated GET Endpoint

```typescript
import { parsePaginationParams } from '@/lib/api/pagination'
import { paginatedResponse } from '@/lib/api/responses'
import { findPaginated } from '@/lib/db/query-helpers'

export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const { limit, offset } = parsePaginationParams(request)

    const result = await findPaginated(
      projectsTable,
      { limit, offset }
    )

    return paginatedResponse(
      result.data,
      { total: result.total, limit, offset },
      { requestId: context.requestId }
    )
  })
}
```

---

### Pattern 3: Authenticated POST Endpoint

```typescript
import { createProjectSchema } from '@/lib/validation'
import { createdResponse } from '@/lib/api/responses'
import { createOne } from '@/lib/db/query-helpers'
import { AuthorizationError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const body = await request.json()

      // Validate input (throws ValidationError if invalid)
      const validated = createProjectSchema.parse(body)

      // Check permissions
      if (!context.userId) {
        throw new AuthorizationError('Must be logged in to create projects')
      }

      // Create project
      const project = await createOne(projectsTable, {
        ...validated,
        created_by: context.userId,
        created_at: new Date()
      })

      return createdResponse(project, {
        location: `/api/projects/${project.id}`,
        requestId: context.requestId
      })
    },
    {
      auth: true, // Require authentication
      rateLimit: { maxRequests: 10, windowMs: 60000 }
    }
  )
}
```

---

### Pattern 4: Transaction-Based Operations

```typescript
import { withTransaction } from '@/lib/db/transactions'
import { successResponse } from '@/lib/api/responses'

export async function POST(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const body = await request.json()
    const validated = transferSchema.parse(body)

    // Use transaction for atomic operations
    const result = await withTransaction(async (tx) => {
      // Deduct from source
      await tx.update(accountsTable)
        .set({ balance: sql`balance - ${validated.amount}` })
        .where(eq(idColumn, validated.fromAccountId))

      // Add to destination
      await tx.update(accountsTable)
        .set({ balance: sql`balance + ${validated.amount}` })
        .where(eq(idColumn, validated.toAccountId))

      // Create transaction record
      const transaction = await tx.insert(transactionsTable)
        .values({ ...validated, created_at: new Date() })
        .returning()

      return transaction[0]
    })

    return successResponse(result, {
      requestId: context.requestId
    })
  })
}
```

---

## 🔧 Troubleshooting

### Issue: "Cannot find module '@/lib/errors'"

**Solution**: Ensure TypeScript path aliases are configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

### Issue: "Database instance not initialized"

**Solution**: Initialize database instance before using query helpers:

```typescript
import { setDatabaseInstance } from '@/lib/db/query-helpers'
import { db } from '@/lib/drizzle/db'

// In your app initialization
setDatabaseInstance(db)
```

---

### Issue: "Request context is undefined"

**Solution**: Ensure you're using `withMiddleware` which initializes request context:

```typescript
// ❌ Wrong
export async function GET(request: NextRequest) {
  const requestId = getRequestId() // undefined!
}

// ✅ Correct
export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const requestId = context.requestId // defined!
  })
}
```

---

### Issue: Validation errors not showing properly

**Solution**: Use `validationErrorResponse` or let ValidationError be caught:

```typescript
// Option 1: Manual validation
const result = validate(schema, data)
if (!result.success) {
  return validationErrorResponse(result.errors)
}

// Option 2: Automatic (throws ValidationError, caught by middleware)
const validated = schema.parse(data)
```

---

## ✅ Migration Checklist

Use this checklist for each endpoint you migrate:

### Pre-Migration
- [ ] Read and understand the endpoint's current behavior
- [ ] Identify all error cases
- [ ] Note any special handling needed
- [ ] Check if endpoint has tests

### During Migration
- [ ] Replace error handling with custom error types
- [ ] Replace response format with response builders
- [ ] Replace database operations with query helpers
- [ ] Add input validation with Zod schemas
- [ ] Replace logging with structured logger
- [ ] Wrap with `withMiddleware`
- [ ] Add request context usage
- [ ] Add performance monitoring if needed

### Post-Migration
- [ ] Test all success paths
- [ ] Test all error paths
- [ ] Verify response format matches API contract
- [ ] Check logs for request ID
- [ ] Verify performance headers in response
- [ ] Update any related tests
- [ ] Update API documentation if needed

### Code Quality
- [ ] No console.log statements
- [ ] No manual try-catch (let middleware handle)
- [ ] No manual status codes in responses
- [ ] Using type-safe utilities
- [ ] Proper error types used
- [ ] Request ID propagated
- [ ] Structured logging used

---

## 🎓 Next Steps

After migrating your first endpoint:

1. **Review the refactored health check**: `app/api/health/route.ts`
2. **Read usage examples**: `docs/USAGE_EXAMPLES.md`
3. **Study API patterns**: `docs/API_PATTERNS.md`
4. **Migrate more endpoints**: Start with similar patterns
5. **Share learnings**: Document any gotchas for the team

---

## 📚 Additional Resources

- [Developer Guide](./DEVELOPER_GUIDE.md) - Complete development reference
- [Usage Examples](./USAGE_EXAMPLES.md) - Code snippets and recipes
- [API Patterns](./API_PATTERNS.md) - Best practices and patterns
- [Phase 3 Completion Summary](./PHASE3_COMPLETION.md) - All improvements

---

**Questions?** Check the troubleshooting section or ask the team!

**Happy Migrating!** 🚀
