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
