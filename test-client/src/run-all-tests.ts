/**
 * Main test runner for Slack MCP Server
 * Runs all tests in sequence
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest(testFile: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Running: ${testFile}`);
    console.log(`${'='.repeat(60)}\n`);

    const testPath = path.join(__dirname, testFile);
    const child = spawn('npx', ['tsx', testPath], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      const success = code === 0;
      console.log(`\n${success ? '✅' : '❌'} ${testFile}: ${success ? 'PASSED' : 'FAILED'}`);
      resolve(success);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting Slack MCP Server Test Suite');
  console.log('📅 Sprint 2.1 Completion Testing');
  console.log(`⏰ ${new Date().toISOString()}\n`);

  const tests = ['test-connection.ts', 'test-slack-auth.ts', 'test-sprint-2.1.ts'];

  const results: boolean[] = [];

  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(60)}`);

  const passed = results.filter((r) => r).length;
  const total = results.length;

  tests.forEach((test, index) => {
    const icon = results[index] ? '✅' : '❌';
    console.log(`${icon} ${test}`);
  });

  console.log(`\n📈 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };
