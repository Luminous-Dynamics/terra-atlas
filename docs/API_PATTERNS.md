# 🎨 API Patterns & Best Practices

Design patterns, best practices, and conventions for building Terra Atlas API endpoints.

---

## 📋 Table of Contents

1. [Core Principles](#core-principles)
2. [Endpoint Structure](#endpoint-structure)
3. [Request Handling](#request-handling)
4. [Validation Patterns](#validation-patterns)
5. [Error Handling](#error-handling)
6. [Response Formats](#response-formats)
7. [Logging & Monitoring](#logging--monitoring)
8. [Performance Optimization](#performance-optimization)
9. [Security Best Practices](#security-best-practices)
10. [Testing Strategies](#testing-strategies)

---

## 🎯 Core Principles

### 1. Consistency Over Cleverness

**Always prefer:**
- Consistent patterns across all endpoints
- Explicit over implicit behavior
- Clear, readable code over clever optimizations
- Standard responses over custom formats

**Example:**

```typescript
// ✅ Good: Consistent pattern
export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const data = await fetchData()
    return successResponse(data, { requestId: context.requestId })
  })
}

// ❌ Bad: Custom approach
export async function GET(request: NextRequest) {
  const data = await fetchData()
  return new Response(JSON.stringify(data))
}
```

---

### 2. Fail Fast, Fail Loudly

**Principles:**
- Validate early in the request lifecycle
- Throw errors immediately when detected
- Let middleware handle error conversion
- Never swallow errors silently

**Example:**

```typescript
// ✅ Good: Fail immediately
export async function POST(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const body = await request.json()

    // Validate immediately - throws on error
    const validated = createProjectSchema.parse(body)

    // Check authorization immediately
    if (!context.userId) {
      throw new AuthorizationError('Authentication required')
    }

    // Proceed with business logic
    const project = await createOne(projectsTable, validated)
    return createdResponse(project)
  })
}

// ❌ Bad: Silent failures, late validation
export async function POST(request: NextRequest) {
  const body = await request.json()
  const project = await createOne(projectsTable, body) // No validation!
  return NextResponse.json(project || {}) // Silent failure
}
```

---

### 3. Single Responsibility

**Each endpoint should:**
- Handle one specific resource or action
- Not mix concerns (auth, validation, business logic are separate)
- Use helper functions for complex operations
- Delegate to services for business logic

---

### 4. Type Safety Everywhere

**Always:**
- Use TypeScript types for all data
- Validate input with Zod schemas
- Use Drizzle ORM types for database operations
- Let type inference work for you

---

## 🏗️ Endpoint Structure

### Standard Endpoint Template

```typescript
import { NextRequest } from 'next/server'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { NotFoundError } from '@/lib/errors'
import { findMany } from '@/lib/db/query-helpers'
import { resourceTable } from '@/lib/drizzle/schema'
import { resourceSchema } from '@/lib/validation'

/**
 * GET /api/resources
 *
 * Description: List all resources
 * Auth: Optional/Required
 * Rate Limit: X requests/minute
 */
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      // 1. Parse/validate query parameters
      const { limit, offset } = parsePaginationParams(request)

      // 2. Authorization checks (if needed)
      // if (!context.userId) throw new AuthorizationError()

      // 3. Fetch data
      const data = await findMany(resourceTable, { limit, offset })

      // 4. Return response
      return successResponse(data, {
        requestId: context.requestId,
      })
    },
    {
      auth: false, // Set to true if auth required
      rateLimit: { maxRequests: 100, windowMs: 60000 },
      performanceTracking: true,
    }
  )
}

/**
 * POST /api/resources
 *
 * Description: Create new resource
 * Auth: Required
 * Rate Limit: Y requests/minute
 */
export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      // 1. Parse body
      const body = await request.json()

      // 2. Validate input
      const validated = resourceSchema.parse(body)

      // 3. Business logic
      const resource = await createOne(resourceTable, {
        ...validated,
        user_id: context.userId!,
        created_at: new Date(),
      })

      // 4. Return response
      return createdResponse(resource, {
        location: `/api/resources/${resource.id}`,
        requestId: context.requestId,
      })
    },
    {
      auth: true,
      rateLimit: { maxRequests: 10, windowMs: 60000 },
    }
  )
}
```

---

### File Organization

```
app/api/
├── projects/
│   ├── route.ts                 # GET /api/projects, POST /api/projects
│   ├── [id]/
│   │   ├── route.ts            # GET/PATCH/DELETE /api/projects/:id
│   │   ├── investments/
│   │   │   └── route.ts        # GET /api/projects/:id/investments
│   │   └── approve/
│   │       └── route.ts        # POST /api/projects/:id/approve
│   └── stats/
│       └── route.ts            # GET /api/projects/stats
├── investments/
│   └── route.ts
└── users/
    └── route.ts
```

**Conventions:**
- Collection routes: `resource/route.ts`
- Individual items: `resource/[id]/route.ts`
- Actions: `resource/[id]/action/route.ts`
- Stats/aggregates: `resource/stats/route.ts`

---

## 🔄 Request Handling

### Pattern 1: List Resources (GET Collection)

```typescript
export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    // Parse query parameters
    const { limit, offset } = parsePaginationParams(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query conditions
    const conditions = []
    if (status) {
      conditions.push(eq(projectsTable.status, status))
    }

    // Execute query
    const result = await findPaginated(
      projectsTable,
      { limit, offset },
      {
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: { column: createdAtColumn, direction: 'desc' },
      }
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

### Pattern 2: Get Single Resource (GET Item)

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMiddleware(request, async (context) => {
    const id = parseInt(params.id)

    // Validate ID
    if (isNaN(id)) {
      throw new ValidationError('Invalid ID format')
    }

    // Fetch resource
    const resource = await findById(resourceTable, idColumn, id)

    if (!resource) {
      throw new NotFoundError('Resource', id)
    }

    // Optional: Check permissions
    if (resource.is_private && resource.user_id !== context.userId) {
      throw new AuthorizationError('Cannot access private resource')
    }

    return successResponse(resource, {
      requestId: context.requestId,
    })
  })
}
```

---

### Pattern 3: Create Resource (POST)

```typescript
export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      // Parse and validate
      const body = await request.json()
      const validated = createResourceSchema.parse(body)

      // Business logic validation
      const existing = await findOne(resourceTable, {
        where: eq(resourceTable.name, validated.name),
      })

      if (existing) {
        throw new ConflictError('Resource with this name already exists')
      }

      // Create resource
      const resource = await createOne(resourceTable, {
        ...validated,
        user_id: context.userId!,
        created_at: new Date(),
      })

      // Log business event
      structuredLogger.logBusiness('resource_created', {
        resourceId: resource.id,
        userId: context.userId,
        type: validated.type,
      })

      return createdResponse(resource, {
        location: `/api/resources/${resource.id}`,
        requestId: context.requestId,
      })
    },
    { auth: true }
  )
}
```

---

### Pattern 4: Update Resource (PATCH)

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMiddleware(
    request,
    async (context) => {
      const id = parseInt(params.id)

      // Fetch existing
      const existing = await findById(resourceTable, idColumn, id)
      if (!existing) {
        throw new NotFoundError('Resource', id)
      }

      // Check ownership
      if (existing.user_id !== context.userId) {
        throw new AuthorizationError('You do not own this resource')
      }

      // Validate update
      const body = await request.json()
      const validated = updateResourceSchema.parse(body)

      // Apply update
      const updated = await updateOne(resourceTable, idColumn, id, {
        ...validated,
        updated_at: new Date(),
      })

      return successResponse(updated!, {
        requestId: context.requestId,
      })
    },
    { auth: true }
  )
}
```

---

### Pattern 5: Delete Resource (DELETE)

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMiddleware(
    request,
    async (context) => {
      const id = parseInt(params.id)

      // Fetch and verify
      const existing = await findById(resourceTable, idColumn, id)
      if (!existing) {
        throw new NotFoundError('Resource', id)
      }

      // Check ownership
      if (existing.user_id !== context.userId) {
        throw new AuthorizationError('You do not own this resource')
      }

      // Check if safe to delete
      const dependentCount = await count(
        dependentTable,
        eq(dependentTable.resource_id, id)
      )

      if (dependentCount > 0) {
        throw new BusinessLogicError(
          `Cannot delete resource with ${dependentCount} dependent items`
        )
      }

      // Perform deletion
      await deleteOne(resourceTable, idColumn, id)

      // Log
      structuredLogger.logBusiness('resource_deleted', {
        resourceId: id,
        userId: context.userId,
      })

      return noContentResponse()
    },
    { auth: true }
  )
}
```

---

## ✅ Validation Patterns

### Pattern 1: Schema Definition

```typescript
// lib/validation/resource.schemas.ts
import { z } from 'zod'

// Base schema
const baseResourceSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['typeA', 'typeB', 'typeC']),
  metadata: z.record(z.unknown()).optional(),
})

// Create schema (all fields required unless optional)
export const createResourceSchema = baseResourceSchema.extend({
  // Additional required fields for creation
  category: z.string(),
})

// Update schema (all fields optional)
export const updateResourceSchema = baseResourceSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
)

// Query params schema
export const listResourcesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['active', 'inactive']).optional(),
  type: z.enum(['typeA', 'typeB', 'typeC']).optional(),
})
```

---

### Pattern 2: Nested Validation

```typescript
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string().length(2),
  postal_code: z.string(),
})

const createProjectSchema = z.object({
  name: z.string().min(3),
  location: addressSchema,
  contacts: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['owner', 'manager', 'developer']),
  })).min(1),
  metadata: z.record(z.string()),
})
```

---

### Pattern 3: Conditional Validation

```typescript
const investmentSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['equity', 'debt', 'grant']),
  // Conditional fields based on type
  equity_percentage: z.number().min(0).max(100).optional(),
  interest_rate: z.number().min(0).max(100).optional(),
  maturity_date: z.date().optional(),
}).refine(
  (data) => {
    // Equity requires equity_percentage
    if (data.type === 'equity' && !data.equity_percentage) {
      return false
    }
    // Debt requires interest_rate and maturity_date
    if (data.type === 'debt' && (!data.interest_rate || !data.maturity_date)) {
      return false
    }
    return true
  },
  {
    message: 'Missing required fields for investment type',
  }
)
```

---

### Pattern 4: Custom Validators

```typescript
const emailDomainValidator = z.string().email().refine(
  (email) => {
    const allowedDomains = ['company.com', 'partner.com']
    const domain = email.split('@')[1]
    return allowedDomains.includes(domain)
  },
  { message: 'Email must be from an approved domain' }
)

const futureDateValidator = z.date().refine(
  (date) => date > new Date(),
  { message: 'Date must be in the future' }
)
```

---

## ⚠️ Error Handling

### Error Hierarchy

```
TerraAtlasError (Base)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── RateLimitError (429)
├── DatabaseError (500)
├── ExternalServiceError (502)
├── ConfigurationError (500)
├── PaymentError (402)
└── BusinessLogicError (422)
```

---

### When to Use Each Error Type

```typescript
// ValidationError - Invalid input format
const validated = schema.parse(body) // Throws ValidationError

// AuthenticationError - No valid credentials
if (!token) {
  throw new AuthenticationError('Token required')
}

// AuthorizationError - Valid credentials, insufficient permissions
if (resource.owner_id !== context.userId) {
  throw new AuthorizationError('You do not own this resource')
}

// NotFoundError - Resource doesn't exist
if (!project) {
  throw new NotFoundError('Project', projectId)
}

// ConflictError - Resource already exists
if (existingUser) {
  throw new ConflictError('User with this email already exists')
}

// RateLimitError - Too many requests
if (!allowed) {
  throw new RateLimitError('Too many requests. Try again later.')
}

// DatabaseError - Database operation failed
catch (error) {
  throw new DatabaseError('Failed to save project', { originalError: error })
}

// ExternalServiceError - External API failed
if (!stripeResponse.ok) {
  throw new ExternalServiceError('Payment processing failed', 'stripe')
}

// BusinessLogicError - Violates business rules
if (investment.amount > project.remaining_funding) {
  throw new BusinessLogicError('Investment exceeds available funding')
}

// PaymentError - Payment-specific issues
if (card.declined) {
  throw new PaymentError('Card declined', 'card_declined')
}
```

---

### Error Context Best Practices

```typescript
// ✅ Good: Rich context
throw new DatabaseError('Failed to update project', {
  projectId,
  userId: context.userId,
  attemptedUpdate: updateData,
  timestamp: new Date().toISOString(),
})

// ❌ Bad: No context
throw new Error('Update failed')
```

---

## 📤 Response Formats

### Standard Response Structure

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-11-15T10:30:00.000Z",
    "requestId": "req_abc123",
    "version": "1.0.0"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with ID 123 not found",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-11-15T10:30:00.000Z",
    "requestId": "req_abc123",
    "version": "1.0.0"
  }
}

// Paginated Response
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true,
    "page": 1,
    "totalPages": 8
  },
  "meta": { ... }
}
```

---

### Response Headers

**Always include:**
```
X-Request-Id: req_abc123         # Request tracking
X-Response-Time: 42ms            # Performance monitoring
Content-Type: application/json   # Response format
```

**For created resources (201):**
```
Location: /api/resources/123     # Created resource location
```

**For rate limiting (429):**
```
Retry-After: 60                  # Seconds until retry allowed
```

**For caching (GET requests):**
```
Cache-Control: public, max-age=300
ETag: "abc123"
```

---

## 📊 Logging & Monitoring

### Logging Levels

```typescript
// DEBUG - Development information
structuredLogger.debug('Query executed', { query, params, duration })

// INFO - Normal operations
structuredLogger.info('User logged in', { userId, email })

// WARN - Unexpected but handled
structuredLogger.warn('High memory usage', { percentage: 92 })

// ERROR - Errors that need attention
structuredLogger.error('Database connection failed', error, {
  operation: 'connect',
  retryAttempt: 3
})
```

---

### What to Log

**Always log:**
- Request start/end with request ID
- Business events (creation, updates, deletions)
- Authentication/authorization events
- External API calls
- Performance metrics for slow operations (>100ms)
- Errors with full context

**Never log:**
- Passwords or secrets
- Full credit card numbers
- Personal identification numbers
- Session tokens (log ID only)

---

### Logging Patterns

```typescript
// ✅ Good: Structured with context
structuredLogger.info('Investment created', {
  operation: 'create_investment',
  investmentId: investment.id,
  userId: context.userId,
  projectId: investment.project_id,
  amount: investment.amount,
  type: investment.type,
})

// ❌ Bad: Unstructured
console.log('Created investment', investment.id)

// ✅ Good: Performance logging
const timer = startTimer('complex_calculation')
const result = await performCalculation()
timer.endAndLog({ inputSize: data.length, outputSize: result.length })

// ❌ Bad: No performance tracking
const result = await performCalculation()
```

---

## ⚡ Performance Optimization

### Database Query Optimization

```typescript
// ✅ Good: Select only needed fields
const projects = await db
  .select({
    id: projectsTable.id,
    name: projectsTable.name,
    status: projectsTable.status,
  })
  .from(projectsTable)
  .limit(10)

// ❌ Bad: Select all fields
const projects = await db.select().from(projectsTable).limit(10)

// ✅ Good: Use indexes
const activeProjects = await findMany(projectsTable, {
  where: eq(projectsTable.status, 'active'), // Indexed column
  limit: 10,
})

// ❌ Bad: Full table scan
const filtered = allProjects.filter(p => p.status === 'active')
```

---

### Pagination Best Practices

```typescript
// ✅ Good: Cursor-based for large datasets
export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = 20

    const projects = await db
      .select()
      .from(projectsTable)
      .where(cursor ? gt(idColumn, parseInt(cursor)) : undefined)
      .orderBy(asc(idColumn))
      .limit(limit + 1) // Fetch one extra to check hasMore

    const hasMore = projects.length > limit
    const data = hasMore ? projects.slice(0, limit) : projects
    const nextCursor = hasMore ? data[data.length - 1].id : null

    return successResponse({
      data,
      nextCursor,
      hasMore,
    })
  })
}

// ✅ Good: Offset-based for small datasets with total count
const { limit, offset } = parsePaginationParams(request)
const result = await findPaginated(projectsTable, { limit, offset })
return paginatedResponse(result.data, { total: result.total, limit, offset })
```

---

### Caching Strategies

```typescript
// Response caching for static data
export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const stats = await calculateStats()

    const response = successResponse(stats)

    // Cache for 5 minutes
    response.headers.set('Cache-Control', 'public, max-age=300')

    return response
  })
}

// Conditional requests with ETag
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withMiddleware(request, async (context) => {
    const project = await findById(projectsTable, idColumn, parseInt(params.id))

    if (!project) {
      throw new NotFoundError('Project', params.id)
    }

    // Generate ETag from updated_at timestamp
    const etag = `"${project.updated_at.getTime()}"`
    const clientEtag = request.headers.get('if-none-match')

    // Return 304 if not modified
    if (clientEtag === etag) {
      return new Response(null, { status: 304 })
    }

    const response = successResponse(project)
    response.headers.set('ETag', etag)
    response.headers.set('Cache-Control', 'private, must-revalidate')

    return response
  })
}
```

---

### N+1 Query Prevention

```typescript
// ❌ Bad: N+1 queries
const projects = await findMany(projectsTable, {})
for (const project of projects) {
  const owner = await findById(usersTable, idColumn, project.owner_id) // N queries!
  project.owner = owner
}

// ✅ Good: Single query with join
const projects = await db
  .select({
    project: projectsTable,
    owner: usersTable,
  })
  .from(projectsTable)
  .leftJoin(usersTable, eq(projectsTable.owner_id, usersTable.id))
```

---

## 🔒 Security Best Practices

### Authentication & Authorization

```typescript
// Pattern: Check authentication first, then authorization
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMiddleware(
    request,
    async (context) => {
      // Authentication checked by middleware (auth: true)

      // Authorization: Check ownership
      const resource = await findById(resourceTable, idColumn, parseInt(params.id))

      if (!resource) {
        throw new NotFoundError('Resource', params.id)
      }

      if (resource.owner_id !== context.userId) {
        throw new AuthorizationError('You do not own this resource')
      }

      // Proceed with update
      const body = await request.json()
      const validated = updateSchema.parse(body)

      const updated = await updateOne(resourceTable, idColumn, resource.id, validated)

      return successResponse(updated)
    },
    { auth: true } // Require authentication
  )
}
```

---

### Input Sanitization

```typescript
// ✅ Good: Validate and sanitize
const createProjectSchema = z.object({
  name: z.string()
    .min(3)
    .max(100)
    .trim() // Remove whitespace
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Only letters, numbers, spaces, and hyphens allowed'),
  description: z.string()
    .max(500)
    .trim()
    .transform(val => val.replace(/<[^>]*>/g, '')), // Strip HTML tags
  url: z.string()
    .url()
    .startsWith('https://'), // Require HTTPS
})

// Validate before use
const validated = createProjectSchema.parse(body)
```

---

### SQL Injection Prevention

```typescript
// ✅ Good: Parameterized queries (Drizzle ORM)
const project = await db
  .select()
  .from(projectsTable)
  .where(eq(idColumn, userProvidedId)) // Safe: parameterized

// ❌ Bad: String concatenation
const project = await db.execute(
  `SELECT * FROM projects WHERE id = ${userProvidedId}` // VULNERABLE!
)
```

---

### Rate Limiting

```typescript
// Apply appropriate rate limits based on operation cost
export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      // Expensive operation
      const result = await processExpensiveOperation()
      return successResponse(result)
    },
    {
      auth: true,
      rateLimit: {
        maxRequests: 5, // Only 5 requests
        windowMs: 60000, // per minute
      },
    }
  )
}
```

---

### CORS Configuration

```typescript
// Configure CORS appropriately
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}
```

---

## 🧪 Testing Strategies

### Unit Testing Patterns

```typescript
// Test individual functions
describe('findById', () => {
  it('should return project when found', async () => {
    const project = await findById(projectsTable, idColumn, 1)
    expect(project).toBeDefined()
    expect(project?.id).toBe(1)
  })

  it('should return null when not found', async () => {
    const project = await findById(projectsTable, idColumn, 99999)
    expect(project).toBeNull()
  })
})

// Test validation schemas
describe('createProjectSchema', () => {
  it('should validate valid project data', () => {
    const data = {
      name: 'Solar Farm',
      type: 'solar',
      country: 'US',
      capacity_mw: 100,
      irr: 12.5,
    }

    expect(() => createProjectSchema.parse(data)).not.toThrow()
  })

  it('should reject invalid IRR', () => {
    const data = { name: 'Test', type: 'solar', irr: -5 }
    expect(() => createProjectSchema.parse(data)).toThrow()
  })
})
```

---

### Integration Testing

```typescript
// Test full endpoint flow
describe('POST /api/projects', () => {
  it('should create project when authenticated', async () => {
    const token = await createAuthToken(testUserId)

    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Project',
        type: 'solar',
        // ... other fields
      }),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('Test Project')
  })

  it('should return 401 when not authenticated', async () => {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    })

    expect(response.status).toBe(401)
  })
})
```

---

### Test Database Setup

```typescript
// Use separate test database
beforeAll(async () => {
  // Connect to test database
  process.env.DATABASE_URL = 'test.db'
  await runMigrations()
})

beforeEach(async () => {
  // Clean database before each test
  await db.delete(projectsTable)
  await db.delete(usersTable)

  // Seed test data
  await seedTestData()
})

afterAll(async () => {
  // Cleanup
  await db.close()
})
```

---

## 📋 Checklist for New Endpoints

### Before Writing Code
- [ ] Understand the business requirement
- [ ] Design the API contract (request/response)
- [ ] Identify required permissions
- [ ] Plan database queries
- [ ] Consider rate limiting needs

### During Implementation
- [ ] Use `withMiddleware` wrapper
- [ ] Define Zod validation schema
- [ ] Implement proper error handling
- [ ] Add request ID to responses
- [ ] Use standardized response builders
- [ ] Add structured logging
- [ ] Include performance tracking
- [ ] Check authorization properly
- [ ] Use database helpers

### After Implementation
- [ ] Test success path
- [ ] Test all error paths
- [ ] Test authentication/authorization
- [ ] Verify response format
- [ ] Check performance (< 200ms for simple queries)
- [ ] Review security (no SQL injection, XSS, etc.)
- [ ] Add JSDoc comments
- [ ] Update API documentation

### Before Deployment
- [ ] Code review completed
- [ ] Tests passing
- [ ] No console.log statements
- [ ] Proper error logging
- [ ] Rate limits configured
- [ ] CORS configured (if needed)

---

## 🎯 Anti-Patterns to Avoid

### ❌ Don't: Mix concerns

```typescript
// Bad: Everything in one place
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = jwt.verify(token, secret)
  const body = await request.json()

  if (!body.name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const db = new Database('data.db')
  const result = db.prepare('INSERT INTO projects VALUES (?)').run(body.name)
  db.close()

  return NextResponse.json({ id: result.lastInsertRowid })
}
```

**Why bad:** Mixing auth, validation, database, and response handling. Hard to test and maintain.

---

### ❌ Don't: Return inconsistent formats

```typescript
// Bad: Different formats
return NextResponse.json({ projects }) // Sometimes
return NextResponse.json({ data: projects }) // Other times
return NextResponse.json({ success: true, result: projects }) // Also this
```

**Why bad:** Frontend can't rely on consistent structure.

---

### ❌ Don't: Swallow errors

```typescript
// Bad: Silent failure
try {
  await dangerousOperation()
} catch (error) {
  // Just ignore it
}
```

**Why bad:** Silent failures are impossible to debug in production.

---

### ❌ Don't: Use magic numbers

```typescript
// Bad: What does 10 mean?
if (user.login_attempts > 10) {
  // lock account
}

// Good: Named constant
const MAX_LOGIN_ATTEMPTS = 10
if (user.login_attempts > MAX_LOGIN_ATTEMPTS) {
  // lock account
}
```

---

## 📚 Additional Resources

- [Migration Guide](./MIGRATION_GUIDE.md) - How to migrate existing code
- [Usage Examples](./USAGE_EXAMPLES.md) - Copy-paste ready examples
- [Developer Guide](./DEVELOPER_GUIDE.md) - Complete development reference
- [Phase 3 Summary](./PHASE3_COMPLETION.md) - All Phase 3 improvements

---

**Remember:** Consistency, clarity, and type safety are more valuable than clever code!
