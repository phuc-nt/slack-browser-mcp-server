#!/usr/bin/env node
/**
 * Test Runner - Executes both test suites
 * Provides options to run specific test suites or all tests
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestSuite {
  name: string;
  file: string;
  description: string;
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'connection',
    file: 'test-connection.js',
    description: 'Connection and Tool Listing Tests'
  },
  {
    name: 'tools',
    file: 'test-all-tools.js', 
    description: 'Comprehensive Tool Testing'
  }
];

async function runTestSuite(suite: TestSuite): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Running ${suite.description}`);
    console.log(`${'='.repeat(60)}\n`);

    const testProcess = spawn('node', [join(__dirname, '..', 'dist', suite.file)], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    testProcess.on('close', (code) => {
      const success = code === 0;
      console.log(`\n📋 ${suite.description} ${success ? 'PASSED' : 'FAILED'}\n`);
      resolve(success);
    });

    testProcess.on('error', (error) => {
      console.error(`❌ Failed to run ${suite.description}:`, error);
      resolve(false);
    });
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🧪 Slack MCP Server Test Suite Runner\n');
  
  // Parse command line arguments
  let suitesToRun: TestSuite[] = [];
  
  if (command === 'connection' || command === '1') {
    suitesToRun = [TEST_SUITES[0]];
  } else if (command === 'tools' || command === '2') {
    suitesToRun = [TEST_SUITES[1]];
  } else if (command === 'all' || !command) {
    suitesToRun = TEST_SUITES;
  } else {
    console.log('❌ Invalid command. Available options:');
    console.log('   npm test connection  - Run connection and tool listing tests');
    console.log('   npm test tools       - Run comprehensive tool tests');
    console.log('   npm test all         - Run all test suites (default)');
    console.log('   npm test             - Run all test suites');
    process.exit(1);
  }

  console.log('📋 Test Configuration Help:');
  console.log('   Update test-client/src/test-config.ts with your real Slack data');
  console.log('   Set environment variables: SLACK_XOXC_TOKEN, SLACK_XOXD_TOKEN');
  console.log('   Or use env overrides: TEST_CHANNEL_ID, TEST_USER_ID, TEST_THREAD_TS');
  console.log('');

  // Check if built files exist
  const fs = await import('fs');
  const testConnectionPath = join(__dirname, '..', 'dist', 'test-connection.js');
  const testToolsPath = join(__dirname, '..', 'dist', 'test-all-tools.js');
  
  if (!fs.existsSync(testConnectionPath) || !fs.existsSync(testToolsPath)) {
    console.log('⚠️  Test files not found. Building tests...');
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    await new Promise<void>((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Test build completed\n');
          resolve();
        } else {
          reject(new Error('Test build failed'));
        }
      });
    });
  }

  const startTime = Date.now();
  const results: Array<{ suite: TestSuite; passed: boolean }> = [];

  // Run selected test suites
  for (const suite of suitesToRun) {
    const passed = await runTestSuite(suite);
    results.push({ suite, passed });
    
    // Short pause between test suites
    if (suitesToRun.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Print final summary
  const totalTime = Date.now() - startTime;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`${'='.repeat(60)}`);
  console.log(`📊 FINAL RESULTS SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  
  results.forEach(({ suite, passed }) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${suite.description}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  console.log(`\n🕐 Total execution time: ${Math.round(totalTime / 1000)}s`);
  console.log(`📈 Results: ${passedCount}/${results.length} test suites passed`);

  if (failedCount > 0) {
    console.log(`\n❌ ${failedCount} test suite(s) failed`);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Ensure the main server builds successfully: npm run build');
    console.log('   2. Check that Slack tokens are set: SLACK_XOXC_TOKEN, SLACK_XOXD_TOKEN');
    console.log('   3. Update test-config.ts with real data from your Slack workspace');
    console.log('   4. Verify network connectivity and Slack API access');
    process.exit(1);
  } else {
    console.log('\n🎉 All test suites passed successfully!');
    process.exit(0);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection in test runner:', error);
  process.exit(1);
});

// Run main function
main().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});