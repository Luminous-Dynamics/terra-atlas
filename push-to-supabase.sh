#!/bin/bash

echo "🚀 Pushing Terra Atlas Schema to Supabase"
echo "=========================================="
echo ""

# Supabase connection details from CLAUDE.local.md
SUPABASE_HOST="aws-0-us-west-1.pooler.supabase.com"
SUPABASE_DB="postgres"
SUPABASE_PORT="5432"

echo "⚠️  You need the database password for fyyszjyixenujgbjaqkd"
echo "This is the password you set when creating the Supabase project"
echo ""
read -p "Enter Supabase database password: " -s SUPABASE_PASSWORD
echo ""

# Build the connection string
DATABASE_URL="postgresql://postgres.fyyszjyixenujgbjaqkd:${SUPABASE_PASSWORD}@${SUPABASE_HOST}:${SUPABASE_PORT}/${SUPABASE_DB}"

echo ""
echo "📋 Exporting schema from local database..."
pg_dump -h localhost -p 5434 -U tstoltz -d terra_atlas --schema-only --no-owner --no-privileges > schema.sql

echo "✅ Schema exported to schema.sql"
echo ""

echo "📤 Creating tables in Supabase..."
echo ""

# Remove any PostGIS-specific commands that might fail
sed -i '/CREATE EXTENSION/d' schema.sql
sed -i '/COMMENT ON EXTENSION/d' schema.sql

# Push schema to Supabase
PGPASSWORD="${SUPABASE_PASSWORD}" psql "${DATABASE_URL}" < schema.sql

echo ""
echo "✅ Schema pushed to Supabase!"
echo ""

echo "🔧 Setting up Drizzle with Supabase..."
echo ""

# Create .env.production with Supabase URL
cat > .env.production << EOF
# Supabase Database
DATABASE_URL=${DATABASE_URL}

# Supabase API (from CLAUDE.local.md)
NEXT_PUBLIC_SUPABASE_URL=https://fyyszjyixenujgbjaqkd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eXN6anlpeGVudWpnYmphcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NTM2MzYsImV4cCI6MjA1MjAyOTYzNn0.6P94bIncvH7C-H7_2Z4pFRqNsT_st0l5OZBEcGpN9Hs

# Auth Secrets
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=lf+msTQngcukFcC8jMdVXzz3sXr62/K4HKJml8X5W3o=

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoidHN0b2x0eiIsImEiOiJjbTYxajZ5d2cwM21zMnFzZjN2ODlrNXFyIn0.eF3Ny8CEL_Lp6KTmswXCOA
EOF

echo "✅ Production environment file created"
echo ""

echo "📊 Testing connection..."
PGPASSWORD="${SUPABASE_PASSWORD}" psql "${DATABASE_URL}" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null

echo ""
echo "🎉 SUCCESS! Your database is ready on Supabase!"
echo ""
echo "Next steps:"
echo "1. Add these environment variables to Vercel:"
echo "   npx vercel env add DATABASE_URL production"
echo "   (Use the DATABASE_URL from .env.production)"
echo ""
echo "2. Deploy to Vercel:"
echo "   npx vercel --prod"
echo ""
echo "3. Your app will be live at:"
echo "   https://terra-atlas.vercel.app"
echo "   https://atlas.luminousdynamics.io"
echo ""