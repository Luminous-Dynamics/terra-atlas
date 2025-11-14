#!/usr/bin/env node

/**
 * Terra Atlas Interactive Setup Script
 *
 * Guides new developers through setting up the project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, resolve);
  });
}

async function main() {
  log('\n🌍 Welcome to Terra Atlas Setup!\n', 'bright');
  log('This script will help you set up your development environment.\n');

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (!fs.existsSync(envPath)) {
    log('📝 Creating .env.local file...', 'yellow');

    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ Created .env.local from .env.example\n', 'green');
    } else {
      log('❌ .env.example not found!', 'red');
      process.exit(1);
    }
  } else {
    log('✅ .env.local already exists\n', 'green');
  }

  // Prompt for environment variables
  log('Let\'s configure your environment variables:\n', 'bright');

  const supabaseUrl = await prompt('Supabase URL (press Enter to skip):');
  const supabaseAnonKey = await prompt('Supabase Anon Key (press Enter to skip):');
  const supabaseServiceKey = await prompt('Supabase Service Role Key (press Enter to skip):');

  log('\n🔐 Generating JWT secret...', 'yellow');
  let jwtSecret;
  try {
    jwtSecret = execSync('openssl rand -base64 32', { encoding: 'utf8' }).trim();
    log('✅ JWT secret generated\n', 'green');
  } catch (error) {
    log('⚠️  Could not generate JWT secret automatically', 'yellow');
    jwtSecret = await prompt('Please enter JWT secret manually:');
  }

  const databaseUrl = await prompt('Database URL (press Enter to use default local):');

  // Update .env.local
  let envContent = fs.readFileSync(envPath, 'utf8');

  if (supabaseUrl) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_URL=.*/,
      `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`
    );
  }

  if (supabaseAnonKey) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}`
    );
  }

  if (supabaseServiceKey) {
    envContent = envContent.replace(
      /SUPABASE_SERVICE_ROLE_KEY=.*/,
      `SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}`
    );
  }

  if (jwtSecret) {
    envContent = envContent.replace(
      /JWT_SECRET=.*/,
      `JWT_SECRET=${jwtSecret}`
    );
  }

  if (databaseUrl) {
    envContent = envContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL=${databaseUrl}`
    );
  }

  fs.writeFileSync(envPath, envContent);
  log('\n✅ Environment variables updated!\n', 'green');

  // Check for node_modules
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    const installDeps = await prompt('Install dependencies now? (y/n):');

    if (installDeps.toLowerCase() === 'y') {
      log('\n📦 Installing dependencies...\n', 'yellow');
      try {
        execSync('npm install', { stdio: 'inherit' });
        log('\n✅ Dependencies installed!\n', 'green');
      } catch (error) {
        log('\n❌ Failed to install dependencies', 'red');
        log('Please run: npm install\n', 'yellow');
      }
    }
  } else {
    log('✅ Dependencies already installed\n', 'green');
  }

  // Optional: Install Zod
  const installZod = await prompt('Install Zod for input validation? (recommended) (y/n):');

  if (installZod.toLowerCase() === 'y') {
    log('\n📦 Installing Zod...\n', 'yellow');
    try {
      execSync('npm install zod', { stdio: 'inherit' });
      log('\n✅ Zod installed!\n', 'green');
      log('📝 Remember to uncomment the code in lib/validation.ts\n', 'cyan');
    } catch (error) {
      log('\n❌ Failed to install Zod', 'red');
    }
  }

  // Summary
  log('\n🎉 Setup Complete!\n', 'bright');
  log('Next steps:', 'bright');
  log('1. Review your .env.local file', 'cyan');
  log('2. Run: npm run dev', 'cyan');
  log('3. Open: http://localhost:3002', 'cyan');
  log('\n📚 Documentation:', 'bright');
  log('- README.md - General overview', 'cyan');
  log('- IMPROVEMENTS.md - Recent changes', 'cyan');
  log('- docs/API.md - API documentation', 'cyan');
  log('\nHappy coding! 🚀\n', 'green');

  rl.close();
}

main().catch((error) => {
  log(`\n❌ Setup failed: ${error.message}\n`, 'red');
  rl.close();
  process.exit(1);
});
