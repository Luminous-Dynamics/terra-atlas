{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_20
    nodePackages.npm
    nodePackages.typescript
    
    # PostgreSQL with PostGIS
    postgresql_15
    postgresql15Packages.postgis
    
    # Database management tools
    pgcli
    
    # Prisma engines for NixOS
    prisma-engines
    nodePackages.prisma
    
    # Python for scripts
    python3
    
    # Git for version control
    git
    
    # Environment tools
    direnv
    
    # Process manager
    overmind
    tmux
  ];

  shellHook = ''
    echo "🌍 Terra Atlas Development Environment"
    echo "=================================="
    echo "PostgreSQL: $(postgres --version)"
    echo "Node.js: $(node --version)"
    echo "npm: $(npm --version)"
    echo ""
    echo "📊 Database Setup Commands:"
    echo "  initdb -D ./postgres-data    # Initialize database"
    echo "  pg_ctl -D ./postgres-data -l logfile start  # Start PostgreSQL"
    echo "  createdb terra_atlas          # Create database"
    echo "  psql terra_atlas              # Connect to database"
    echo ""
    echo "🚀 Quick Start:"
    echo "  npm run db:setup              # Set up database"
    echo "  npm run dev                   # Start development server"
    echo ""
    
    # Set up PostgreSQL data directory if it doesn't exist
    export PGDATA="$PWD/postgres-data"
    export PGHOST="$PWD/postgres-data"
    export PGDATABASE="terra_atlas"
    export PGUSER="$USER"
    
    # Fix Prisma on NixOS by providing engine paths
    export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libquery_engine.node"
    export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines}/bin/query-engine"
    export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
    export PRISMA_MIGRATION_ENGINE_BINARY="${pkgs.prisma-engines}/bin/migration-engine"
    export PRISMA_INTROSPECTION_ENGINE_BINARY="${pkgs.prisma-engines}/bin/introspection-engine"
    export PRISMA_FMT_BINARY="${pkgs.prisma-engines}/bin/prisma-fmt"
    
    if [ ! -d "$PGDATA" ]; then
      echo "📦 Initializing PostgreSQL data directory..."
      initdb -D "$PGDATA" --auth=trust --encoding=UTF8
      
      # Start PostgreSQL
      pg_ctl -D "$PGDATA" -l "$PWD/postgres.log" start
      
      # Wait for PostgreSQL to start
      sleep 2
      
      # Create database
      createdb terra_atlas
      
      echo "✅ PostgreSQL initialized and started!"
    else
      # Check if PostgreSQL is running
      if ! pg_ctl -D "$PGDATA" status > /dev/null 2>&1; then
        echo "🔄 Starting PostgreSQL..."
        pg_ctl -D "$PGDATA" -l "$PWD/postgres.log" start
        sleep 2
      fi
      echo "✅ PostgreSQL is ready!"
    fi
    
    # Export DATABASE_URL for Prisma
    export DATABASE_URL="postgresql://$USER@localhost/terra_atlas?host=$PGDATA"
    echo "📝 DATABASE_URL set for local development"
  '';
}