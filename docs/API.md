# Terra Atlas API Documentation

Complete reference for all Terra Atlas API endpoints.

## Base URL

```
Production: https://atlas.luminousdynamics.io/api
Development: http://localhost:3002/api
```

## Authentication

Most endpoints require authentication using JWT bearer tokens.

### Headers

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Response Headers

All API responses include standard headers for tracking and caching:

**Request Tracking:**
- `X-Request-ID` - Unique identifier for request tracing (UUID format)
- `X-Response-Time` - Server processing time in milliseconds

**Cache Headers (cached endpoints only):**
- `Cache-Control` - Browser/CDN caching directives (e.g., `public, max-age=300`)
- `X-Cache-Key` - Internal cache key used (for debugging)
- `ETag` - Resource version identifier for conditional requests

**Example Response Headers:**
```http
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-Response-Time: 45ms
Cache-Control: public, max-age=300
X-Cache-Key: projects:list:{"type":"solar"}
ETag: "a1b2c3d4e5f6"
```

### Conditional Requests

Cached endpoints support conditional requests to reduce bandwidth:

**If-None-Match Header:**
```http
GET /api/projects/uuid
If-None-Match: "a1b2c3d4e5f6"
```

If content hasn't changed, returns `304 Not Modified` with empty body.

**If-Modified-Since Header:**
```http
GET /api/projects/uuid
If-Modified-Since: Mon, 15 Jan 2025 12:00:00 GMT
```

### Rate Limiting

All endpoints are rate-limited to prevent abuse:

| Endpoint | Limit |
|----------|-------|
| `/api/auth/login` | 5 requests/minute per IP |
| `/api/auth/register*` | 3 requests/minute per IP |
| `/api/investments/pledge` | 10 requests/minute per user |
| Other endpoints | 60 requests/minute per IP |

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Time when limit resets (ISO 8601)

---

## Authentication Endpoints

### POST /api/auth/login

Authenticate a user and receive tokens.

**Request Body:**
```json
{
  "emailOrUsername": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "fullName": "Full Name",
      "avatarUrl": "https://...",
      "trustLevel": 1,
      "reputationScore": 100,
      "isAdmin": false,
      "isModerator": false
    },
    "token": "eyJhbGci...",
    "refreshToken": "random-string",
    "expiresIn": 604800
  }
}
```

**Errors:**
- `400` - Missing required fields
- `401` - Invalid credentials
- `429` - Rate limit exceeded

---

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "SecurePass123",
  "fullName": "New User" // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGci...",
    "refreshToken": "random-string",
    "expiresIn": 604800
  }
}
```

**Errors:**
- `400` - Validation error (invalid email, weak password, etc.)
- `409` - Email or username already exists
- `429` - Rate limit exceeded

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

## Project Endpoints

### GET /api/projects

Get list of energy projects.

**Query Parameters:**
- `type` - Filter by project type (`solar`, `wind`, `hydro`, `nuclear`, `storage`)
- `status` - Filter by status (`planning`, `funding`, `construction`, `operational`)
- `minIrr` - Minimum IRR percentage
- `minCapacity` - Minimum capacity in MW
- `maxCapacity` - Maximum capacity in MW
- `location` - Location filter (string match)
- `limit` - Results per page (default: 100, max: 1000)
- `offset` - Pagination offset (default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Solar Farm Alpha",
      "type": "solar",
      "location": "California, USA",
      "latitude": 34.05,
      "longitude": -118.25,
      "capacity_mw": 100,
      "total_cost": 50000000,
      "raised_amount": 10000000,
      "status": "funding",
      "irr": 12.5,
      "description": "Large-scale solar installation",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-10T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 1547,
    "page": 1,
    "pageSize": 100,
    "totalPages": 16
  }
}
```

---

### GET /api/projects/:id

Get details for a specific project.

**Response (200):**
```json
{
  "success": true,
  "data": {
    /* project object with full details */
  }
}
```

**Errors:**
- `404` - Project not found

---

### GET /api/projects/globe-data

Get optimized project data for globe visualization.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Project Name",
        "type": "solar",
        "latitude": 34.05,
        "longitude": -118.25,
        "capacity_mw": 100,
        "irr": 12.5,
        "status": "funding"
      }
    ],
    "count": 759
  }
}
```

---

## Investment Endpoints

### POST /api/investments/pledge

Create an investment pledge for a project.

**Authentication:** Required

**Request Body:**
```json
{
  "projectId": "uuid",
  "amountUsd": 10000,
  "investmentType": "equity",
  "expectedReturn": 12.5,
  "investmentPeriodYears": 5,
  "notes": "Optional notes"
}
```

**Investment Types:**
- `equity` - Equity investment
- `debt` - Debt financing
- `revenue_share` - Revenue sharing agreement
- `crowdfunding` - Crowdfunding contribution
- `green_bond` - Green bond purchase
- `ppa` - Power Purchase Agreement

**Response (200):**
```json
{
  "success": true,
  "message": "Investment pledge created",
  "data": {
    "investment": {
      "id": "uuid",
      "user_id": "uuid",
      "project_id": "uuid",
      "amount": 10000,
      "status": "pending"
    }
  }
}
```

---

### GET /api/portfolio

Get user's investment portfolio.

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalInvested": 50000,
      "totalReturns": 5000,
      "totalPledged": 20000,
      "activeInvestments": 5,
      "portfolioIrr": 11.2,
      "totalCo2Avoided": 1500,
      "totalMwhGenerated": 50000
    },
    "investments": [
      {
        "investment": { /* investment object */ },
        "project": { /* project object */ },
        "currentValue": 12000,
        "performancePercent": 20
      }
    ]
  }
}
```

---

## Statistics Endpoints

### GET /api/stats

Get platform-wide statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalProjects": 1547,
    "totalInvestments": 523,
    "totalInvested": 15000000,
    "totalCapacityMw": 2500,
    "totalCo2Avoided": 150000,
    "activeInvestors": 324,
    "projectsByType": {
      "solar": 650,
      "wind": 425,
      "hydro": 350,
      "nuclear": 72,
      "storage": 50
    },
    "averageIrr": 11.8
  }
}
```

---

## Payment Endpoints

### POST /api/stripe/checkout

Create a Stripe checkout session for investment payment.

**Authentication:** Required

**Request Body:**
```json
{
  "projectId": "uuid",
  "amount": 10000,
  "investmentType": "equity"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": true,
  "message": "Error description",
  "details": { /* optional additional context */ }
}
```

### Common Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Webhooks

### POST /api/stripe/webhook

Stripe webhook endpoint for payment events.

**Headers:**
- `stripe-signature` - Webhook signature (verified by Stripe)

**Events Handled:**
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.failed` - Payment failed
- `checkout.session.completed` - Checkout session completed

---

## Admin Endpoints

### GET /api/admin/cache

Get detailed cache statistics and performance metrics.

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "size": 127,
      "hits": 1523,
      "misses": 234,
      "hitRate": "86.69%",
      "evictions": 12,
      "expirations": 45,
      "memoryUsageMB": "2.45"
    },
    "distribution": {
      "projects": 45,
      "stats": 12,
      "investments": 23,
      "portfolio": 34,
      "user": 13
    },
    "totalKeys": 127,
    "sampleEntries": [
      {
        "key": "projects:list:{\"type\":\"solar\"}",
        "createdAt": "2025-01-15T12:00:00.000Z",
        "expiresAt": "2025-01-15T12:05:00.000Z",
        "hits": 23,
        "sizBytes": 15234,
        "tags": ["projects", "list"]
      }
    ],
    "recommendations": [
      "EXCELLENT HIT RATE: Cache is performing very well, consider extending TTLs further"
    ]
  }
}
```

---

### POST /api/admin/cache

Perform cache management operations.

**Authentication:** Required

**Request Body:**
```json
{
  "operation": "clear_pattern",
  "pattern": "projects:*"
}
```

**Operations:**

1. **Clear All Cache**
```json
{
  "operation": "clear_all"
}
```

2. **Clear by Pattern**
```json
{
  "operation": "clear_pattern",
  "pattern": "projects:*"
}
```

3. **Clear by Tags**
```json
{
  "operation": "clear_tags",
  "tags": ["projects", "stats"]
}
```

4. **Warm Cache**
```json
{
  "operation": "warm",
  "entries": [
    {
      "key": "projects:featured",
      "value": { /* data */ },
      "ttl": 3600
    }
  ]
}
```

5. **Reset Statistics**
```json
{
  "operation": "reset_stats"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cleared": true,
    "pattern": "projects:*",
    "count": 45
  }
}
```

**Errors:**
- `400` - Invalid operation or missing parameters
- `401` - Not authenticated
- `429` - Rate limit exceeded

---

### DELETE /api/admin/cache

Clear entire cache (alternative to POST with operation=clear_all).

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cleared": true,
    "message": "All cache entries cleared"
  }
}
```

---

## Development

### Test Mode

In development, some endpoints return mock data:

```javascript
process.env.NODE_ENV === 'development'
```

### API Testing

Use tools like:
- **curl**
- **Postman**
- **Insomnia**

Example curl request:
```bash
curl -X POST https://atlas.luminousdynamics.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"user@example.com","password":"SecurePass123"}'
```

---

## Support

For API support or questions:
- Email: api@luminousdynamics.io
- Documentation: https://docs.luminousdynamics.io
- Issues: https://github.com/Luminous-Dynamics/terra-atlas/issues
