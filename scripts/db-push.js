const { execSync } = require('child_process');

try {
  console.log('Synchronizing database schema...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
} catch (error) {
  console.warn('Warning: prisma db push skipped or handled via direct migration:', error.message);
}
