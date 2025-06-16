#!/usr/bin/env tsx
/**
 * Setup Secured Encryption Configuration
 * 
 * Configures the system for secured mode with centralized password management.
 * This is the recommended configuration for most deployments.
 */

import { generateSecurePassword } from '../src/lib/encryption';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ENV_FILE = join(process.cwd(), '.env.local');

function generateSecuredConfig() {
  // Generate a strong system password
  const systemPassword = generateSecurePassword(32);
  
  const securedConfig = {
    FILE_ENCRYPTION_ENABLED: 'true',
    FILE_ENCRYPTION_ENFORCE: 'false', // Start with optional encryption
    FILE_ENCRYPTION_DEFAULT_PASSWORD: systemPassword,
    FILE_ENCRYPTION_ALLOW_USER_PASSWORDS: 'false', // Secured mode: system password only
    FILE_ENCRYPTION_PREVIEW: 'false', // Will be enabled in Phase 2
    FILE_ENCRYPTION_MAX_SIZE: '100MB',
    FILE_ENCRYPTION_EXCLUDED_TYPES: 'application/pgp-encrypted,application/x-pkcs7-signature',
  };

  return { securedConfig, systemPassword };
}

function updateEnvFile(config: Record<string, string>, updateExisting = false) {
  let envContent = '';
  
  // Read existing .env.local if it exists
  if (existsSync(ENV_FILE)) {
    envContent = readFileSync(ENV_FILE, 'utf-8');
  }

  // Parse existing variables
  const existingVars = new Set<string>();
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=/);
    if (match) {
      existingVars.add(match[1]);
    }
  });

  // Add or update encryption variables
  const newLines: string[] = [];
  let hasEncryptionSection = false;

  envContent.split('\n').forEach(line => {
    if (line.includes('# File Encryption Configuration')) {
      hasEncryptionSection = true;
    }

    const match = line.match(/^([^=]+)=/);
    if (match && config[match[1]]) {
      if (updateExisting) {
        newLines.push(`${match[1]}=${config[match[1]]}`);
      } else {
        newLines.push(line); // Keep existing value
      }
      delete config[match[1]]; // Remove from config to add
    } else {
      newLines.push(line);
    }
  });

  // Add encryption section if not present
  if (!hasEncryptionSection) {
    newLines.push('');
    newLines.push('# File Encryption Configuration - Secured Mode');
  }

  // Add remaining new variables
  Object.entries(config).forEach(([key, value]) => {
    newLines.push(`${key}=${value}`);
  });

  writeFileSync(ENV_FILE, newLines.join('\n'));
}

function main() {
  const args = process.argv.slice(2);
  const updateExisting = args.includes('--update-env');
  const showPassword = args.includes('--show-password');

  console.log('🔒 Setting up Secured Encryption Configuration...\n');

  const { securedConfig, systemPassword } = generateSecuredConfig();

  if (updateExisting) {
    updateEnvFile(securedConfig, true);
    console.log('✅ .env.local updated with secured encryption configuration');
  } else {
    updateEnvFile(securedConfig, false);
    console.log('✅ .env.local updated (existing values preserved)');
  }

  console.log('\n📋 Secured Configuration Applied:');
  console.log('- Encryption: ENABLED');
  console.log('- Mode: Secured (system password only)');
  console.log('- User passwords: DISABLED');
  console.log('- Max file size: 100MB');
  console.log('- Preview encryption: Disabled (Phase 2)');

  if (showPassword || updateExisting) {
    console.log('\n🔐 System Master Password:');
    console.log(`${systemPassword}`);
    console.log('\n⚠️  IMPORTANT: Store this password securely!');
    console.log('   This password is needed to decrypt all encrypted files.');
  }

  console.log('\n🚀 Next steps:');
  console.log('1. Restart your application to apply the configuration');
  console.log('2. Test file upload with encryption enabled');
  console.log('3. Store the master password in your password manager');

  if (!showPassword && !updateExisting) {
    console.log('\n💡 To see the generated password, run:');
    console.log('   pnpm encryption:setup --show-password');
  }
}

if (require.main === module) {
  main();
}

export { generateSecuredConfig, updateEnvFile };
