#!/usr/bin/env node
// CLI wrapper that imports from the library version
import { checkRestrictions } from './check-restrictions.lib.js';

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const gameJsPath = process.argv[2] || './game.js';

  console.log('🎮 Platanus Hack 26: Checking game restrictions...\n');

  checkRestrictions(gameJsPath)
    .then((checkResults) => {
      checkResults.results.forEach((result) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} ${result.name}: ${result.message}`);
        if (result.details) {
          console.log(`   ${result.details}`);
        }
      });

      console.log(`\n${'='.repeat(50)}`);
      if (checkResults.passed) {
        console.log('🎉 All checks passed! Your game is ready for submission.');
      } else {
        console.log('⚠️  Some checks failed. Please fix the issues above.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Error running checks:', error);
      process.exit(1);
    });
}

export {
  type CheckResults,
  checkRestrictions,
  type RestrictionResult,
} from './check-restrictions.lib.js';
