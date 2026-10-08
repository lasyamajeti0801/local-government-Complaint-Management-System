/**
 * Nagar Connect - Unified Test Runner
 */
const { runRAGTests } = require('./rag.test');
const { runCoreTests } = require('./auth.test');

async function main() {
  console.log('🏛️ STARTING NAGAR CONNECT COMPREHENSIVE TEST SUITE...');
  try {
    await runRAGTests();
    await runCoreTests();
    console.log('✨ ALL 7 TESTS PASSED WITH 100% SUCCESS RATE! ✨\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test execution failed:', err);
    process.exit(1);
  }
}

main();
