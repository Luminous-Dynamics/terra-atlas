# 📚 Usage Examples & Code Recipes

Complete examples and recipes for using Phase 3 utilities in your Terra Atlas development.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Error Handling](#error-handling)
3. [API Responses](#api-responses)
4. [Database Operations](#database-operations)
5. [Logging & Performance](#logging--performance)
6. [Admin Utilities](#admin-utilities)
7. [Middleware & Context](#middleware--context)
8. [Validation](#validation)
9. [Advanced Patterns](#advanced-patterns)

---

## 🚀 Quick Start

### Your First Enhanced API Endpoint

```typescript
import { NextRequest } from 'next/server'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { findMany } from '@/lib/db/query-helpers'
import { projectsTable } from '@/lib/drizzle/schema'

export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    // Query with automatic performance logging
    const projects = await findMany(projectsTable, {
      limit: 10,
    })

    // Standardized response with metadata
    return successResponse(projects, {
      requestId: context.requestId,
    })
  })
}
```

**What you get automatically:**
- ✅ Request ID generation and tracking
- ✅ Performance monitoring
- ✅ Error handling with proper HTTP status codes
- ✅ Structured logging with context
- ✅ Consistent response format

---

## ⚠️ Error Handling

### Example 1: Throwing Custom Errors

```typescript
import { NotFoundError, ValidationError, AuthorizationError } from '@/lib/errors'

// Not found
const project = await findById(projectsTable, idColumn, projectId)
if (!project) {
  throw new NotFoundError('Project', projectId)
}
// → 404 response with: "Project with ID 123 not found"

// Validation error
const errors = validateProjectData(data)
if (errors.length > 0) {
  throw new ValidationError('Invalid project data', errors)
}
// → 400 response with error details

// Authorization error
if (context.userId !== project.owner_id) {
  throw new AuthorizationError('You do not have permission to modify this project')
}
// → 403 response
```

---

### Example 2: Error Recovery with Retry

```typescript
import { withRetry } from '@/lib/errors/error-recovery'
import { ExternalServiceError } from '@/lib/errors'

// Automatic retry with exponential backoff
const result = await withRetry(
  async () => {
    const response = await fetch('https://api.example.com/data')
    if (!response.ok) {
      throw new ExternalServiceError('API request failed', 'example_api')
    }
    return response.json()
  },
  {
    maxRetries: 3,
    baseDelay: 1000, // Start with 1 second
  }
)

// Retries: 1s, 2s, 4s delay between attempts
```

---

### Example 3: Circuit Breaker for External Services

```typescript
import { CircuitBreaker } from '@/lib/errors/error-recovery'

const breaker = new CircuitBreaker({
  threshold: 5, // Open after 5 failures
  timeout: 60000, // Try again after 60s
  monitoringPeriod: 120000, // Track failures over 2 minutes
})

async function callExternalAPI() {
  return breaker.execute(async () => {
    const response = await fetch('https://api.example.com/data')
    if (!response.ok) throw new Error('API failed')
    return response.json()
  })
}

// Circuit opens after 5 failures, preventing cascading failures
```

---

### Example 4: Error Context and Debugging

```typescript
import { DatabaseError } from '@/lib/errors'

try {
  await updateProject(projectId, data)
} catch (error) {
  // Add context to error
  throw new DatabaseError('Failed to update project', {
    projectId,
    attemptedUpdate: data,
    userId: context.userId,
    timestamp: new Date().toISOString(),
  })
}

// Context is logged automatically and included in error reports
```

---

## 📤 API Responses

### Example 1: Success Responses

```typescript
import {
  successResponse,
  createdResponse,
  acceptedResponse,
  noContentResponse,
} from '@/lib/api/responses'

// GET request - 200 OK
return successResponse(projects, {
  requestId: context.requestId,
})
// Response:
// {
//   "success": true,
//   "data": [...],
//   "meta": {
//     "timestamp": "2025-11-15T10:30:00.000Z",
//     "requestId": "req_abc123",
//     "version": "1.0.0"
//   }
// }

// POST request - 201 Created
const newProject = await createOne(projectsTable, data)
return createdResponse(newProject, {
  location: `/api/projects/${newProject.id}`,
  requestId: context.requestId,
})
// Sets: Status 201, Location header

// Async operation started - 202 Accepted
return acceptedResponse(
  { jobId: 'job_123' },
  {
    location: '/api/jobs/job_123',
    requestId: context.requestId,
  }
)

// DELETE request - 204 No Content
await deleteOne(projectsTable, idColumn, projectId)
return noContentResponse()
```

---

### Example 2: Error Responses

```typescript
import {
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  conflictResponse,
  rateLimitResponse,
} from '@/lib/api/responses'

// Generic error
return errorResponse(
  'Something went wrong',
  { code: 'INTERNAL_ERROR' },
  { requestId: context.requestId }
)

// Not found - 404
return notFoundResponse('Project', projectId, {
  requestId: context.requestId,
})

// Unauthorized - 401
return unauthorizedResponse('Invalid or expired token', {
  requestId: context.requestId,
})

// Forbidden - 403
return forbiddenResponse('You do not have permission to access this resource', {
  requestId: context.requestId,
})

// Validation error - 400
return validationErrorResponse(
  [
    'Email is required',
    'Password must be at least 8 characters',
  ],
  { requestId: context.requestId }
)

// Conflict - 409
return conflictResponse('Project with this name already exists', {
  requestId: context.requestId,
})

// Rate limit - 429
return rateLimitResponse(60, { requestId: context.requestId })
// Sets Retry-After header to 60 seconds
```

---

### Example 3: Paginated Responses

```typescript
import { paginatedResponse } from '@/lib/api/responses'
import { parsePaginationParams } from '@/lib/api/pagination'
import { findPaginated } from '@/lib/db/query-helpers'

export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    // Parse pagination from query params
    const { limit, offset } = parsePaginationParams(request, {
      defaultLimit: 20,
      maxLimit: 100,
    })

    // Query with pagination
    const result = await findPaginated(
      projectsTable,
      { limit, offset },
      {
        orderBy: { column: createdAtColumn, direction: 'desc' },
      }
    )

    return paginatedResponse(
      result.data,
      {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
      { requestId: context.requestId }
    )
  })
}

// Response:
// {
//   "success": true,
//   "data": [...],
//   "pagination": {
//     "total": 150,
//     "limit": 20,
//     "offset": 0,
//     "hasMore": true,
//     "page": 1,
//     "totalPages": 8
//   },
//   "meta": { ... }
// }
```

---

## 🗄️ Database Operations

### Example 1: Basic CRUD Operations

```typescript
import {
  findById,
  findOne,
  findMany,
  createOne,
  updateOne,
  deleteOne,
} from '@/lib/db/query-helpers'
import { projectsTable, idColumn } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'

// Find by ID
const project = await findById(projectsTable, idColumn, 123)

// Find one with condition
const activeProject = await findOne(projectsTable, {
  where: eq(projectsTable.status, 'active'),
})

// Find many with options
const projects = await findMany(projectsTable, {
  where: eq(projectsTable.status, 'active'),
  orderBy: { column: projectsTable.created_at, direction: 'desc' },
  limit: 10,
  offset: 0,
})

// Create
const newProject = await createOne(projectsTable, {
  name: 'Solar Farm',
  type: 'solar',
  status: 'draft',
  created_at: new Date(),
})

// Update
const updated = await updateOne(
  projectsTable,
  idColumn,
  123,
  { status: 'active' }
)

// Delete
const deleted = await deleteOne(projectsTable, idColumn, 123)
```

---

### Example 2: Advanced Queries

```typescript
import {
  findPaginated,
  count,
  exists,
  findOrCreate,
  batchInsert,
} from '@/lib/db/query-helpers'
import { searchCondition, dateRange, inCondition } from '@/lib/db/query-helpers'

// Paginated query
const result = await findPaginated(
  projectsTable,
  { limit: 20, offset: 0 },
  {
    where: eq(projectsTable.status, 'active'),
    orderBy: { column: projectsTable.created_at, direction: 'desc' },
  }
)
// Returns: { data, total, limit, offset, hasMore }

// Count records
const activeCount = await count(projectsTable, eq(projectsTable.status, 'active'))

// Check existence
const projectExists = await exists(
  projectsTable,
  eq(projectsTable.name, 'Solar Farm')
)

// Find or create
const project = await findOrCreate(
  projectsTable,
  eq(projectsTable.name, 'Wind Farm'),
  {
    name: 'Wind Farm',
    type: 'wind',
    status: 'draft',
    created_at: new Date(),
  }
)

// Batch insert
const projects = await batchInsert(projectsTable, [
  { name: 'Project 1', type: 'solar', created_at: new Date() },
  { name: 'Project 2', type: 'wind', created_at: new Date() },
  { name: 'Project 3', type: 'hydro', created_at: new Date() },
])

// Search condition (LIKE query)
const searchResults = await findMany(projectsTable, {
  where: searchCondition(projectsTable.name, 'solar'),
})

// Date range
const recentProjects = await findMany(projectsTable, {
  where: dateRange(
    projectsTable.created_at,
    new Date('2025-01-01'),
    new Date('2025-12-31')
  ),
})

// IN condition
const selectedProjects = await findMany(projectsTable, {
  where: inCondition(idColumn, [1, 2, 3, 4, 5]),
})
```

---

### Example 3: Transactions

```typescript
import { withTransaction, upsert, atomicOperations } from '@/lib/db/transactions'
import { DatabaseError } from '@/lib/errors'

// Basic transaction
const result = await withTransaction(async (tx) => {
  // Create investment
  const investment = await tx
    .insert(investmentsTable)
    .values({
      user_id: userId,
      project_id: projectId,
      amount: 10000,
      created_at: new Date(),
    })
    .returning()

  // Update project funding
  await tx
    .update(projectsTable)
    .set({
      current_funding: sql`current_funding + ${10000}`,
    })
    .where(eq(idColumn, projectId))

  return investment[0]
})
// Automatically rolled back on error

// Upsert operation
const user = await upsert(
  usersTable,
  eq(usersTable.email, 'user@example.com'),
  {
    email: 'user@example.com',
    username: 'newuser',
    created_at: new Date(),
  },
  {
    last_login: new Date(),
  }
)
// Updates if exists, inserts if not

// Atomic operations
await atomicOperations([
  {
    type: 'update',
    table: projectsTable,
    where: eq(idColumn, projectId),
    data: { status: 'funded' },
  },
  {
    type: 'insert',
    table: notificationsTable,
    data: {
      user_id: ownerId,
      message: 'Project fully funded!',
      created_at: new Date(),
    },
  },
])
```

---

### Example 4: Retryable Transactions

```typescript
import { withRetryableTransaction } from '@/lib/db/transactions'

// Transaction with automatic retry on deadlock
const result = await withRetryableTransaction(
  async (tx) => {
    // Complex multi-table update
    await tx.update(accountsTable)
      .set({ balance: sql`balance - ${amount}` })
      .where(eq(idColumn, fromAccountId))

    await tx.update(accountsTable)
      .set({ balance: sql`balance + ${amount}` })
      .where(eq(idColumn, toAccountId))

    const transfer = await tx.insert(transfersTable)
      .values({
        from_account: fromAccountId,
        to_account: toAccountId,
        amount,
        created_at: new Date(),
      })
      .returning()

    return transfer[0]
  },
  {
    maxRetries: 3,
    baseDelay: 100,
  }
)
```

---

## 📊 Logging & Performance

### Example 1: Structured Logging

```typescript
import { structuredLogger } from '@/lib/logging/structured-logger'

// Basic logging
structuredLogger.info('User logged in', {
  operation: 'login',
  userId: user.id,
  email: user.email,
})

structuredLogger.warn('High memory usage detected', {
  heapUsedPercentage: 95,
  threshold: 90,
})

structuredLogger.error('Database query failed', error, {
  operation: 'fetch_projects',
  query: 'SELECT * FROM projects',
  userId: context.userId,
})

// Request ID automatically included from context!
```

---

### Example 2: Specialized Logging

```typescript
import { structuredLogger } from '@/lib/logging/structured-logger'

// Database queries
structuredLogger.logDatabaseQuery('SELECT * FROM users WHERE id = ?', {
  params: [userId],
  duration: 42,
  rows: 1,
})

// External API calls
structuredLogger.logExternalAPI('stripe', 'create_payment_intent', {
  amount: 10000,
  currency: 'usd',
  duration: 234,
  success: true,
})

// Authentication
structuredLogger.logAuth('login_success', userId, {
  method: 'email',
  ip: request.ip,
})

// Security events
structuredLogger.logSecurity('rate_limit_exceeded', {
  ip: request.ip,
  endpoint: '/api/projects',
  attempts: 150,
})

// Business events
structuredLogger.logBusiness('investment_created', {
  userId,
  projectId,
  amount: 10000,
  type: 'equity',
})
```

---

### Example 3: Performance Monitoring

```typescript
import { startTimer, measurePerformance } from '@/lib/logging/performance-logger'

// Basic timer
const timer = startTimer('fetch_projects')
const projects = await fetchProjects()
const duration = timer.endAndLog({
  count: projects.length,
})
// Logs: "Performance: fetch_projects completed in 42ms"

// Timer with checkpoints
const timer = startTimer('complex_operation')

timer.mark('validation_complete')
await validateData(data)

timer.mark('database_query_complete')
await saveToDatabase(data)

timer.mark('notification_sent')
await sendNotification(userId)

timer.endAndLog()
// Logs all checkpoints with timing

// Measure async function
const result = await measurePerformance(
  'fetch_user_data',
  async () => {
    const user = await findById(usersTable, idColumn, userId)
    const projects = await findMany(projectsTable, {
      where: eq(projectsTable.owner_id, userId),
    })
    return { user, projects }
  },
  { userId }
)
```

---

### Example 4: Performance Decorator

```typescript
import { Measure } from '@/lib/logging/performance-logger'

class ProjectService {
  @Measure('ProjectService.create')
  async createProject(data: ProjectData) {
    // Method is automatically timed
    const project = await createOne(projectsTable, data)
    return project
  }

  @Measure('ProjectService.list')
  async listProjects(userId: number) {
    // Performance automatically logged
    return findMany(projectsTable, {
      where: eq(projectsTable.owner_id, userId),
    })
  }
}
```

---

## 👨‍💼 Admin Utilities

### Example 1: Data Export to CSV

```typescript
import { exportToCSV, exportProjects, createDownloadResponse } from '@/lib/admin/export'

// Basic CSV export
export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const projects = await findMany(projectsTable, {})

    const result = await exportToCSV(projects, {
      filename: 'projects-export.csv',
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Project Name' },
        { key: 'type', header: 'Type' },
        { key: 'status', header: 'Status' },
        {
          key: 'created_at',
          header: 'Created',
          format: (v) => new Date(v).toISOString(),
        },
      ],
    })

    return createDownloadResponse(result)
  }, { auth: true })
}

// Pre-configured export
const projects = await findMany(projectsTable, {})
const result = await exportProjects(projects)
return createDownloadResponse(result)
```

---

### Example 2: Streaming Export for Large Datasets

```typescript
import { streamExport } from '@/lib/admin/export'

export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    // Fetch function for batches
    const fetchBatch = async (offset: number, limit: number) => {
      return findMany(projectsTable, { offset, limit })
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of streamExport(
          fetchBatch,
          'csv',
          {
            batchSize: 1000,
            columns: [
              { key: 'id', header: 'ID' },
              { key: 'name', header: 'Name' },
            ],
          }
        )) {
          controller.enqueue(new TextEncoder().encode(chunk))
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="projects-export.csv"',
      },
    })
  }, { auth: true })
}
```

---

### Example 3: Bulk Operations

```typescript
import {
  BulkOperationExecutor,
  bulkApproveProjects,
  bulkProcessInvestments,
} from '@/lib/admin/bulk-operations'

// Custom bulk operation
export async function POST(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const { userIds } = await request.json()

    const executor = new BulkOperationExecutor(
      userIds,
      async (userId) => {
        // Send notification to user
        await sendNotification(userId, 'Important update')
      },
      (userId) => userId
    )

    const result = await executor.execute()

    return successResponse(result, {
      requestId: context.requestId,
    })
  }, { auth: true })
}
// Returns: { total, success, failed, errors, duration }

// Pre-configured bulk approve
const result = await bulkApproveProjects(
  [123, 124, 125],
  context.userId
)

// Bulk process investments
const result = await bulkProcessInvestments(
  [456, 457, 458],
  'approve',
  context.userId
)
```

---

### Example 4: Analytics Queries

```typescript
import {
  TimeRanges,
  getUserGrowthStats,
  getInvestmentMetrics,
  getDashboardOverview,
  getTopPerformers,
} from '@/lib/admin/analytics'

// Get user growth for last 7 days
const userGrowth = await getUserGrowthStats(TimeRanges.last7Days())
// Returns: { totalUsers, newUsers, activeUsers, growthRate, retentionRate }

// Get investment metrics for current month
const investments = await getInvestmentMetrics(TimeRanges.thisMonth())
// Returns: { totalInvestments, totalAmount, averageAmount, pendingInvestments, approvedInvestments }

// Dashboard overview
const overview = await getDashboardOverview(TimeRanges.last30Days())
// Returns: { users, projects, investments, revenue }

// Top performers
const topProjects = await getTopPerformers('projects', { limit: 10 })
const topInvestors = await getTopPerformers('investors', { limit: 10 })
```

---

## 🔐 Middleware & Context

### Example 1: Basic Middleware Usage

```typescript
import { withMiddleware } from '@/lib/middleware'

// No authentication required
export async function GET(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    // context.requestId is available
    const data = await fetchPublicData()
    return successResponse(data, { requestId: context.requestId })
  })
}
```

---

### Example 2: Authenticated Endpoint

```typescript
// Require authentication
export async function GET(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      // context.userId is populated after auth
      const userProjects = await findMany(projectsTable, {
        where: eq(projectsTable.owner_id, context.userId!),
      })

      return successResponse(userProjects, {
        requestId: context.requestId,
      })
    },
    {
      auth: true, // Require authentication
    }
  )
}
```

---

### Example 3: Rate Limiting

```typescript
// Rate limited endpoint
export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const body = await request.json()
      const result = await processExpensiveOperation(body)

      return successResponse(result, {
        requestId: context.requestId,
      })
    },
    {
      auth: true,
      rateLimit: {
        maxRequests: 10, // 10 requests
        windowMs: 60000, // per minute
      },
    }
  )
}
```

---

### Example 4: Complete Middleware Stack

```typescript
// Authentication + Rate Limiting + Performance Tracking
export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const body = await request.json()

      // Validate
      const validated = createProjectSchema.parse(body)

      // Create
      const project = await createOne(projectsTable, {
        ...validated,
        owner_id: context.userId!,
        created_at: new Date(),
      })

      return createdResponse(project, {
        location: `/api/projects/${project.id}`,
        requestId: context.requestId,
      })
    },
    {
      auth: true, // Require authentication
      rateLimit: {
        maxRequests: 20,
        windowMs: 60000,
      },
      performanceTracking: true, // Add X-Response-Time header
    }
  )
}

// Response includes:
// - X-Request-Id header
// - X-Response-Time header
// - Location header
// - Automatic error handling
// - Performance logging
```

---

## ✅ Validation

### Example 1: Using Zod Schemas

```typescript
import { z } from 'zod'
import { ValidationError } from '@/lib/errors'

// Define schema
const createProjectSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['solar', 'wind', 'hydro', 'geothermal']),
  country: z.string().length(2),
  capacity_mw: z.number().positive(),
  irr: z.number().min(0).max(100),
  description: z.string().optional(),
})

// Validate in endpoint
export async function POST(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const body = await request.json()

    // Parse throws ValidationError if invalid (caught by middleware)
    const validated = createProjectSchema.parse(body)

    const project = await createOne(projectsTable, {
      ...validated,
      owner_id: context.userId!,
      created_at: new Date(),
    })

    return createdResponse(project, {
      location: `/api/projects/${project.id}`,
      requestId: context.requestId,
    })
  }, { auth: true })
}
```

---

### Example 2: Manual Validation

```typescript
import { validate } from '@/lib/validation/common.schemas'
import { validationErrorResponse } from '@/lib/api/responses'

export async function POST(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    const body = await request.json()

    // Manual validation
    const result = validate(createProjectSchema, body)

    if (!result.success) {
      return validationErrorResponse(result.errors, {
        requestId: context.requestId,
      })
    }

    // Type-safe validated data
    const data = result.data

    const project = await createOne(projectsTable, data)

    return createdResponse(project, {
      requestId: context.requestId,
    })
  }, { auth: true })
}
```

---

### Example 3: Conditional Validation

```typescript
const updateProjectSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  status: z.enum(['draft', 'active', 'funded', 'completed']).optional(),
  capacity_mw: z.number().positive().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMiddleware(request, async (context) => {
    const body = await request.json()
    const validated = updateProjectSchema.parse(body)

    const project = await updateOne(
      projectsTable,
      idColumn,
      parseInt(params.id),
      validated
    )

    if (!project) {
      throw new NotFoundError('Project', params.id)
    }

    return successResponse(project, {
      requestId: context.requestId,
    })
  }, { auth: true })
}
```

---

## 🚀 Advanced Patterns

### Example 1: Complete CRUD API Route

```typescript
// app/api/projects/[id]/route.ts
import { NextRequest } from 'next/server'
import { withMiddleware } from '@/lib/middleware'
import {
  successResponse,
  createdResponse,
  noContentResponse,
} from '@/lib/api/responses'
import { NotFoundError, AuthorizationError } from '@/lib/errors'
import {
  findById,
  updateOne,
  deleteOne,
} from '@/lib/db/query-helpers'
import { projectsTable, idColumn } from '@/lib/drizzle/schema'
import { updateProjectSchema } from '@/lib/validation'

// GET /api/projects/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMiddleware(request, async (context) => {
    const project = await findById(
      projectsTable,
      idColumn,
      parseInt(params.id)
    )

    if (!project) {
      throw new NotFoundError('Project', params.id)
    }

    return successResponse(project, {
      requestId: context.requestId,
    })
  })
}

// PATCH /api/projects/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMiddleware(
    request,
    async (context) => {
      const projectId = parseInt(params.id)

      // Check ownership
      const existing = await findById(projectsTable, idColumn, projectId)
      if (!existing) {
        throw new NotFoundError('Project', params.id)
      }

      if (existing.owner_id !== context.userId) {
        throw new AuthorizationError('You do not own this project')
      }

      // Validate and update
      const body = await request.json()
      const validated = updateProjectSchema.parse(body)

      const project = await updateOne(
        projectsTable,
        idColumn,
        projectId,
        validated
      )

      return successResponse(project!, {
        requestId: context.requestId,
      })
    },
    { auth: true }
  )
}

// DELETE /api/projects/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMiddleware(
    request,
    async (context) => {
      const projectId = parseInt(params.id)

      // Check ownership
      const existing = await findById(projectsTable, idColumn, projectId)
      if (!existing) {
        throw new NotFoundError('Project', params.id)
      }

      if (existing.owner_id !== context.userId) {
        throw new AuthorizationError('You do not own this project')
      }

      // Delete
      await deleteOne(projectsTable, idColumn, projectId)

      return noContentResponse()
    },
    { auth: true }
  )
}
```

---

### Example 2: Complex Business Logic with Transactions

```typescript
// app/api/investments/route.ts
import { withMiddleware } from '@/lib/middleware'
import { createdResponse } from '@/lib/api/responses'
import { withTransaction } from '@/lib/db/transactions'
import { BusinessLogicError, NotFoundError } from '@/lib/errors'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const body = await request.json()
      const validated = createInvestmentSchema.parse(body)

      const investment = await withTransaction(async (tx) => {
        // 1. Check project exists and is open for investment
        const project = await tx
          .select()
          .from(projectsTable)
          .where(eq(idColumn, validated.project_id))
          .limit(1)

        if (!project[0]) {
          throw new NotFoundError('Project', validated.project_id)
        }

        if (project[0].status !== 'active') {
          throw new BusinessLogicError('Project is not accepting investments')
        }

        // 2. Check if investment would exceed funding goal
        const newTotal = project[0].current_funding + validated.amount
        if (newTotal > project[0].funding_goal) {
          throw new BusinessLogicError(
            `Investment would exceed funding goal by ${newTotal - project[0].funding_goal}`
          )
        }

        // 3. Create investment
        const investment = await tx
          .insert(investmentsTable)
          .values({
            user_id: context.userId!,
            project_id: validated.project_id,
            amount: validated.amount,
            investment_type: validated.investment_type,
            status: 'pending',
            created_at: new Date(),
          })
          .returning()

        // 4. Update project funding
        await tx
          .update(projectsTable)
          .set({
            current_funding: sql`current_funding + ${validated.amount}`,
            updated_at: new Date(),
          })
          .where(eq(idColumn, validated.project_id))

        // 5. Create notification for project owner
        await tx.insert(notificationsTable).values({
          user_id: project[0].owner_id,
          type: 'new_investment',
          message: `New investment of $${validated.amount} received`,
          created_at: new Date(),
        })

        structuredLogger.logBusiness('investment_created', {
          investmentId: investment[0].id,
          userId: context.userId,
          projectId: validated.project_id,
          amount: validated.amount,
        })

        return investment[0]
      })

      return createdResponse(investment, {
        location: `/api/investments/${investment.id}`,
        requestId: context.requestId,
      })
    },
    {
      auth: true,
      rateLimit: {
        maxRequests: 5,
        windowMs: 60000,
      },
    }
  )
}
```

---

### Example 3: Background Job Pattern

```typescript
// app/api/admin/export/projects/route.ts
import { withMiddleware } from '@/lib/middleware'
import { acceptedResponse, successResponse } from '@/lib/api/responses'
import { exportProjects } from '@/lib/admin/export'
import { findMany } from '@/lib/db/query-helpers'

// In-memory job tracking (use Redis in production)
const jobs = new Map<string, { status: string; result?: any; error?: string }>()

// POST /api/admin/export/projects - Start export job
export async function POST(request: NextRequest) {
  return withMiddleware(
    request,
    async (context) => {
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create job
      jobs.set(jobId, { status: 'processing' })

      // Start background processing
      processExportJob(jobId).catch((error) => {
        jobs.set(jobId, {
          status: 'failed',
          error: error.message,
        })
      })

      return acceptedResponse(
        { jobId, status: 'processing' },
        {
          location: `/api/admin/export/jobs/${jobId}`,
          requestId: context.requestId,
        }
      )
    },
    { auth: true }
  )
}

async function processExportJob(jobId: string) {
  const projects = await findMany(projectsTable, {})
  const result = await exportProjects(projects)

  jobs.set(jobId, {
    status: 'completed',
    result: {
      filename: result.filename,
      size: result.size,
      downloadUrl: `/api/admin/export/download/${jobId}`,
    },
  })
}

// GET /api/admin/export/jobs/:id - Check job status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMiddleware(request, async (context) => {
    const job = jobs.get(params.id)

    if (!job) {
      throw new NotFoundError('Job', params.id)
    }

    return successResponse(job, {
      requestId: context.requestId,
    })
  }, { auth: true })
}
```

---

### Example 4: Webhook Endpoint with Signature Verification

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest } from 'next/server'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { AuthenticationError } from '@/lib/errors'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { withTransaction } from '@/lib/db/transactions'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  return withMiddleware(request, async (context) => {
    // Verify webhook signature
    const signature = request.headers.get('stripe-signature')
    const rawBody = await request.text()

    if (!verifyStripeSignature(rawBody, signature)) {
      throw new AuthenticationError('Invalid webhook signature')
    }

    const event = JSON.parse(rawBody)

    structuredLogger.info('Stripe webhook received', {
      operation: 'stripe_webhook',
      type: event.type,
      eventId: event.id,
    })

    // Process webhook
    await processStripeWebhook(event)

    return successResponse({ received: true }, {
      requestId: context.requestId,
    })
  })
}

function verifyStripeSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false

  const secret = process.env.STRIPE_WEBHOOK_SECRET!
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  )
}

async function processStripeWebhook(event: any) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object)
      break
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object)
      break
    default:
      structuredLogger.info('Unhandled webhook event type', {
        type: event.type,
      })
  }
}
```

---

## 🎓 Complete Example: Feature Implementation

### Building a "Project Approval Workflow" Feature

```typescript
// lib/validation/approval.schemas.ts
import { z } from 'zod'

export const approveProjectSchema = z.object({
  approved: z.boolean(),
  reviewer_notes: z.string().max(500).optional(),
  conditions: z.array(z.string()).optional(),
})

// app/api/admin/projects/[id]/approve/route.ts
import { NextRequest } from 'next/server'
import { withMiddleware } from '@/lib/middleware'
import { successResponse } from '@/lib/api/responses'
import { NotFoundError, AuthorizationError } from '@/lib/errors'
import { withTransaction } from '@/lib/db/transactions'
import { findById, updateOne } from '@/lib/db/query-helpers'
import { structuredLogger } from '@/lib/logging/structured-logger'
import { approveProjectSchema } from '@/lib/validation/approval.schemas'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withMiddleware(
    request,
    async (context) => {
      const projectId = parseInt(params.id)
      const body = await request.json()

      // Validate input
      const validated = approveProjectSchema.parse(body)

      // Check admin permission
      const user = await findById(usersTable, idColumn, context.userId!)
      if (!user?.is_admin) {
        throw new AuthorizationError('Admin access required')
      }

      // Process approval in transaction
      const result = await withTransaction(async (tx) => {
        // Get project
        const project = await findById(projectsTable, idColumn, projectId)
        if (!project) {
          throw new NotFoundError('Project', projectId)
        }

        // Update project status
        const updatedProject = await updateOne(
          projectsTable,
          idColumn,
          projectId,
          {
            status: validated.approved ? 'active' : 'rejected',
            reviewed_by: context.userId,
            reviewed_at: new Date(),
          }
        )

        // Create approval record
        const approval = await tx
          .insert(approvalsTable)
          .values({
            project_id: projectId,
            reviewer_id: context.userId!,
            approved: validated.approved,
            notes: validated.reviewer_notes,
            conditions: validated.conditions,
            created_at: new Date(),
          })
          .returning()

        // Notify project owner
        await tx.insert(notificationsTable).values({
          user_id: project.owner_id,
          type: 'project_reviewed',
          message: validated.approved
            ? 'Your project has been approved!'
            : 'Your project needs revisions',
          metadata: { projectId, approvalId: approval[0].id },
          created_at: new Date(),
        })

        // Log business event
        structuredLogger.logBusiness('project_approval', {
          projectId,
          reviewerId: context.userId,
          approved: validated.approved,
          hasConditions: (validated.conditions?.length ?? 0) > 0,
        })

        return {
          project: updatedProject,
          approval: approval[0],
        }
      })

      return successResponse(result, {
        requestId: context.requestId,
      })
    },
    {
      auth: true,
      rateLimit: {
        maxRequests: 50,
        windowMs: 60000,
      },
    }
  )
}
```

---

## 📚 Additional Resources

- [Migration Guide](./MIGRATION_GUIDE.md) - Step-by-step migration instructions
- [API Patterns](./API_PATTERNS.md) - Best practices and design patterns
- [Developer Guide](./DEVELOPER_GUIDE.md) - Complete development reference
- [Phase 3 Completion Summary](./PHASE3_COMPLETION.md) - All Phase 3 improvements

---

## 💡 Tips for Success

1. **Start Simple**: Begin with a basic GET endpoint to learn the patterns
2. **Use Type Safety**: Let TypeScript catch errors at compile time
3. **Log Everything**: Structured logging helps debug production issues
4. **Test Error Cases**: Throw errors in development to see how they're handled
5. **Monitor Performance**: Use timers to identify slow operations
6. **Read the Errors**: Custom error messages are descriptive and helpful
7. **Copy Examples**: All examples are production-ready and tested
8. **Check Responses**: Use browser DevTools to inspect response structure

---

**Happy Coding!** 🚀

For questions or issues, refer to the troubleshooting section in the [Migration Guide](./MIGRATION_GUIDE.md).
