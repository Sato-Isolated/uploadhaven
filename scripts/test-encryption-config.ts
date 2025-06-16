/**
 * Test Script: Verify File Encryption Configuration
 * 
 * This script tests the encryption configuration to ensure that files
 * will be encrypted when uploaded.
 */

import { shouldEncryptFile, getEncryptionConfig, validateSecuredSetup } from '../src/lib/encryption/encryption-config';

console.log('🔍 Testing File Encryption Configuration');
console.log('========================================\n');

// Test configuration loading
const config = getEncryptionConfig();
console.log('📋 Current Configuration:');
console.log(`   ✓ Enabled: ${config.enabled}`);
console.log(`   ✓ Enforce: ${config.enforceEncryption}`);
console.log(`   ✓ Default Password: ${config.defaultPassword ? '[SET]' : '[NOT SET]'}`);
console.log(`   ✓ Allow User Passwords: ${config.allowUserPasswords}`);
console.log(`   ✓ Max File Size: ${Math.round(config.maxFileSize / (1024 * 1024))}MB`);
console.log(`   ✓ Excluded Types: ${config.excludedMimeTypes.length} types\n`);

// Test secured setup validation
console.log('🔒 Secured Setup Validation:');
const validation = validateSecuredSetup();
if (validation.isValid) {
  console.log('   ✅ Secured configuration is valid');
} else {
  console.log('   ❌ Secured configuration has errors:');
  validation.errors.forEach((error: string) => console.log(`      - ${error}`));
}
console.log('');

// Test shouldEncryptFile function with various scenarios
console.log('🧪 Testing shouldEncryptFile Function:');
console.log('=====================================');

const testCases = [
  {
    name: 'Small text file (no user request)',
    fileSize: 1024, // 1KB
    mimeType: 'text/plain',
    userRequested: false
  },
  {
    name: 'Small text file (user requested)',
    fileSize: 1024, // 1KB
    mimeType: 'text/plain',
    userRequested: true
  },
  {
    name: 'Large video file (50MB)',
    fileSize: 50 * 1024 * 1024, // 50MB
    mimeType: 'video/mp4',
    userRequested: false
  },
  {
    name: 'Huge file (200MB - exceeds limit)',
    fileSize: 200 * 1024 * 1024, // 200MB
    mimeType: 'video/mp4',
    userRequested: false
  },
  {
    name: 'Excluded type (already encrypted)',
    fileSize: 1024,
    mimeType: 'application/pgp-encrypted',
    userRequested: false
  }
];

testCases.forEach((testCase, index) => {
  const shouldEncrypt = shouldEncryptFile(
    testCase.fileSize,
    testCase.mimeType,
    testCase.userRequested
  );
  
  const sizeStr = testCase.fileSize > 1024 * 1024 
    ? `${Math.round(testCase.fileSize / (1024 * 1024))}MB`
    : `${Math.round(testCase.fileSize / 1024)}KB`;
    
  console.log(`   ${index + 1}. ${testCase.name}`);
  console.log(`      Size: ${sizeStr}, Type: ${testCase.mimeType}`);
  console.log(`      User Requested: ${testCase.userRequested}`);
  console.log(`      Result: ${shouldEncrypt ? '🔒 ENCRYPT' : '📄 NO ENCRYPTION'}\n`);
});

console.log('🎯 Expected Behavior with Current Configuration:');
console.log('===============================================');
console.log('   ✅ All files should be encrypted (due to FILE_ENCRYPTION_ENFORCE=true)');
console.log('   ✅ Except files exceeding size limit or excluded types');
console.log('   ✅ Uses system password only (no user passwords allowed)');
console.log('   ✅ Secured mode is properly configured\n');

console.log('🚀 Configuration Test Complete!');
