# 🚀 Terra Atlas Deployment Guide

Complete guide for deploying Terra Atlas to production.

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors fixed (`npm run type-check`)
- [ ] ESLint passing (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No hardcoded credentials in code
- [ ] Environment variables documented

### Security
- [ ] JWT_SECRET is secure (min 32 characters)
- [ ] Supabase Row Level Security (RLS) policies configured
- [ ] CORS properly configured (no wildcards)
- [ ] Rate limiting enabled on all public endpoints
- [ ] Input validation implemented
- [ ] Error messages don't leak sensitive info

### Infrastructure
- [ ] Database migrations run successfully
- [ ] Supabase project created and configured
- [ ] Stripe account setup (if using payments)
- [ ] Domain configured and SSL ready
- [ ] Error monitoring service configured (Sentry)

---

## 🌐 Deployment Platforms

### Option 1: Vercel (Recommended)

#### Initial Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link Project**
   ```bash
   vercel link
   ```

#### Configure Environment Variables

Go to Vercel Dashboard → Settings → Environment Variables

**Required Variables:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-secure-jwt-secret-32-chars-min

# Database
DATABASE_URL=postgresql://user:pass@host:port/database

# Application
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Stripe (optional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Analytics (optional)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

#### Post-Deployment

1. **Configure Custom Domain**
   - Vercel Dashboard → Domains
   - Add your domain
   - Update DNS records

2. **Set up Stripe Webhooks**
   ```
   Webhook URL: https://your-domain.com/api/stripe/webhook
   Events: payment_intent.succeeded, payment_intent.failed, checkout.session.completed
   ```

3. **Verify Deployment**
   ```bash
   # Check health
   curl https://your-domain.com/api/health

   # Check stats
   curl https://your-domain.com/api/stats
   ```

---

### Option 2: Docker

#### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  terra-atlas:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=${DATABASE_URL}
    env_file:
      - .env.production
    restart: unless-stopped
```

#### Deploy

```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Check logs
docker-compose logs -f terra-atlas
```

---

## 🔒 Security Configuration

### 1. Supabase Row Level Security

Enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public read for published projects
CREATE POLICY "view_published_projects"
  ON projects FOR SELECT
  USING (status = 'published');

-- Users can view their own investments
CREATE POLICY "view_own_investments"
  ON investments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 2. Environment Variables Security

**Never commit:**
- `.env.local`
- `.env.production`
- Any file with real credentials

**Always use:**
- Platform environment variables (Vercel, Docker, etc.)
- Secret management services (AWS Secrets Manager, etc.)

### 3. API Security

Rate limits in production:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 5 req | 1 minute |
| `/api/auth/register` | 3 req | 1 minute |
| `/api/projects` | 60 req | 1 minute |
| `/api/stats` | 30 req | 1 minute |

---

## 📊 Monitoring

### 1. Error Monitoring (Sentry)

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs
```

Add to `next.config.js`:
```javascript
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: 'your-org',
  project: 'terra-atlas'
})
```

### 2. Uptime Monitoring

Use services like:
- **UptimeRobot** - Free, simple
- **Pingdom** - Advanced features
- **Better Uptime** - Modern UI

Monitor these endpoints:
- `https://your-domain.com/api/health` - Every 5 minutes
- `https://your-domain.com` - Every 5 minutes

### 3. Performance Monitoring

**Vercel Analytics** (built-in):
- Real User Monitoring (RUM)
- Web Vitals tracking
- Automatic performance insights

**Custom Monitoring**:
```typescript
// In app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🔧 Database Migrations

### Running Migrations

```bash
# Generate migration
npm run db:generate

# Review migration files in lib/drizzle/migrations/

# Push to production database
DATABASE_URL=your-prod-url npm run db:migrate
```

### Backup Strategy

**Before migrations:**
```bash
# Backup Supabase database
supabase db dump > backup-$(date +%Y%m%d).sql
```

**Automated backups:**
- Supabase provides daily automatic backups
- Download manually via Supabase Dashboard → Database → Backups

---

## 📈 Post-Deployment

### 1. Smoke Tests

```bash
# Health check
curl https://your-domain.com/api/health

# Stats (should return data)
curl https://your-domain.com/api/stats

# Login (should accept valid creds)
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"test@example.com","password":"password123"}'
```

### 2. Performance Check

```bash
# Lighthouse audit
npx lighthouse https://your-domain.com --view

# Load testing
npx artillery quick --count 10 --num 20 https://your-domain.com
```

### 3. Monitoring Setup

- [ ] Error alerts configured in Sentry
- [ ] Uptime monitoring active
- [ ] Performance monitoring enabled
- [ ] Slack/email alerts set up
- [ ] Dashboard bookmarked

---

## 🚨 Rollback Procedure

If deployment fails:

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>
```

### Docker

```bash
# Stop current
docker-compose down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
docker-compose up -d --build
```

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] Environment variables documented
- [ ] Database migrations ready

### Deployment
- [ ] Deploy to staging first
- [ ] Smoke tests pass on staging
- [ ] Database migrations run successfully
- [ ] Deploy to production
- [ ] Verify production health endpoint

### Post-Deployment
- [ ] Smoke tests pass on production
- [ ] Monitoring active and receiving data
- [ ] Error tracking configured
- [ ] Performance acceptable
- [ ] Team notified

### Documentation
- [ ] Deployment notes added
- [ ] Known issues documented
- [ ] Rollback plan ready
- [ ] On-call rotation updated

---

## 📞 Support

For deployment issues:
- **Email**: ops@luminousdynamics.io
- **Slack**: #terra-atlas-ops
- **Docs**: https://docs.luminousdynamics.io

---

**Happy deploying!** 🚀
