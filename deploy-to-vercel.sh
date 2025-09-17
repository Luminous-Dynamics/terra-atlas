#!/bin/bash

echo "🌍 Deploying Terra Atlas to Vercel with Database"
echo "================================================"
echo ""

# Check if we're logged into Vercel
if ! npx vercel whoami 2>/dev/null; then
    echo "❌ Not logged into Vercel. Please run: npx vercel login"
    exit 1
fi

echo "📦 Building production bundle..."
echo ""

# Build the Next.js app
npm run build

echo ""
echo "🔧 Setting up environment variables..."
echo ""

# Create production env file
cat > .env.production.local << EOF
# Database (you'll need to set up a cloud database)
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/terra_atlas?sslmode=require

# Authentication
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://atlas.luminousdynamics.io

# API Keys (already stored in Vercel)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoidHN0b2x0eiIsImEiOiJjbTYxajZ5d2cwM21zMnFzZjN2ODlrNXFyIn0.eF3Ny8CEL_Lp6KTmswXCOA
EOF

echo "⚠️  IMPORTANT: You need a cloud PostgreSQL database!"
echo ""
echo "Options:"
echo "1. Supabase (Free tier) - https://supabase.com"
echo "2. Neon (Free tier) - https://neon.tech"
echo "3. Railway - https://railway.app"
echo "4. Vercel Postgres - https://vercel.com/storage/postgres"
echo ""
echo "Once you have a database URL, update DATABASE_URL in Vercel environment variables"
echo ""

echo "🚀 Deploying to Vercel..."
echo ""

# Deploy to Vercel
npx vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Set up a cloud PostgreSQL database"
echo "2. Add DATABASE_URL to Vercel environment variables:"
echo "   npx vercel env add DATABASE_URL production"
echo "3. Run database migrations on the cloud database"
echo "4. Test at https://atlas.luminousdynamics.io"
echo ""
echo "🎯 Database Migration Commands (after setting up cloud DB):"
echo "   npm run db:push        # Push schema to cloud"
echo "   npm run db:migrate     # Run migrations"
echo ""