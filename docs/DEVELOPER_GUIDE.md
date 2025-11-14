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
│   ├── validation.ts        # Input validation (Zod)
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

**Required** for production:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-secure-jwt-secret-min-32-chars

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Stripe (if using payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NEXT_PUBLIC_BASE_URL=https://your-domain.com
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

## 🎉 You're Ready!

Welcome to the team! If you have any questions, don't hesitate to ask.

**Happy coding!** 🚀

---

_Last updated: 2025-11-14_
