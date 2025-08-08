/**
 * Sprint 3.3: Performance Benchmarking Test Suite
 * Test và validate thread management performance
 */

import { ThreadPerformanceBenchmarks } from '../../src/performance/thread-benchmarks.js';

async function runPerformanceTests(): Promise<void> {
  console.log('🚀 Starting Thread Performance Benchmarks');
  console.log('📊 Sprint 3.3: Thread Management System Performance Testing');
  console.log('⏰', new Date().toISOString());
  console.log();

  const benchmarks = new ThreadPerformanceBenchmarks();

  try {
    console.log('============================================================');
    console.log('⚡ Running Comprehensive Performance Benchmark Suite');
    console.log('============================================================');

    const benchmarkResults = await benchmarks.runComprehensiveBenchmarks();

    console.log('\\n============================================================');
    console.log('📊 PERFORMANCE BENCHMARK RESULTS');
    console.log('============================================================');

    // Overall Summary
    console.log('\\n📈 Overall Performance Summary:');
    console.log(`   Tests Completed: ${benchmarkResults.summary.totalTests}`);
    console.log(`   Total Duration: ${benchmarkResults.summary.totalDuration}ms`);
    console.log(`   Overall Score: ${benchmarkResults.summary.overallScore}/100`);
    console.log(`   Timestamp: ${benchmarkResults.summary.timestamp}`);

    // Individual Test Results
    console.log('\\n🧪 Individual Test Results:');
    benchmarkResults.results.forEach((result, index) => {
      const status = result.errorRate < 5 ? '✅' : result.errorRate < 20 ? '⚠️' : '❌';
      console.log(`\\n${status} ${index + 1}. ${result.testName}`);
      console.log(`     Avg Response Time: ${result.averageResponseTime}ms`);
      console.log(`     Operations/sec: ${result.operationsPerSecond}`);
      console.log(`     Memory Usage: ${result.memoryUsageMB}MB`);
      console.log(`     Cache Hit Ratio: ${result.cacheHitRatio}%`);
      console.log(`     Error Rate: ${result.errorRate}%`);
      console.log(`     Iterations: ${result.iterations}`);
    });

    // Performance Analysis
    console.log('\\n🔍 Performance Analysis:');
    
    const avgResponseTime = benchmarkResults.results.reduce((sum, r) => sum + r.averageResponseTime, 0) / benchmarkResults.results.length;
    const avgThroughput = benchmarkResults.results.reduce((sum, r) => sum + r.operationsPerSecond, 0) / benchmarkResults.results.length;
    const avgMemoryUsage = benchmarkResults.results.reduce((sum, r) => sum + r.memoryUsageMB, 0) / benchmarkResults.results.length;
    const avgCacheRatio = benchmarkResults.results.reduce((sum, r) => sum + r.cacheHitRatio, 0) / benchmarkResults.results.length;

    console.log(`   Average Response Time: ${Math.round(avgResponseTime * 100) / 100}ms`);
    console.log(`   Average Throughput: ${Math.round(avgThroughput * 100) / 100} ops/sec`);
    console.log(`   Average Memory Usage: ${Math.round(avgMemoryUsage * 100) / 100}MB`);
    console.log(`   Average Cache Hit Ratio: ${Math.round(avgCacheRatio * 100) / 100}%`);

    // Performance Targets Analysis
    console.log('\\n🎯 Performance Target Analysis:');
    console.log(`   Thread Discovery <2s: ${avgResponseTime < 2000 ? '✅ PASS' : '❌ FAIL'} (${avgResponseTime}ms)`);
    console.log(`   Navigation <500ms: ${avgResponseTime < 500 ? '✅ PASS' : '⚠️  CHECK'} (avg: ${avgResponseTime}ms)`);
    console.log(`   Memory <100MB: ${avgMemoryUsage < 100 ? '✅ PASS' : '⚠️  CHECK'} (avg: ${avgMemoryUsage}MB)`);
    console.log(`   Cache Ratio >50%: ${avgCacheRatio > 50 ? '✅ PASS' : '⚠️  CHECK'} (${avgCacheRatio}%)`);
    console.log(`   Throughput >5 ops/sec: ${avgThroughput > 5 ? '✅ PASS' : '⚠️  CHECK'} (${avgThroughput} ops/sec)`);

    // System Information
    const systemInfo = benchmarkResults.results[0]?.details.systemInfo;
    if (systemInfo) {
      console.log('\\n💻 System Information:');
      console.log(`   Node Version: ${systemInfo.nodeVersion}`);
      console.log(`   Platform: ${systemInfo.platform}/${systemInfo.arch}`);
      console.log(`   Total Memory: ${systemInfo.totalMemory}MB`);
      console.log(`   Free Memory: ${systemInfo.freeMemory}MB`);
      console.log(`   CPU Cores: ${systemInfo.cpuCount}`);
      console.log(`   Load Average: [${systemInfo.loadAverage.map(l => l.toFixed(2)).join(', ')}]`);
      console.log(`   Uptime: ${systemInfo.uptime}s`);
    }

    // Recommendations
    console.log('\\n💡 Performance Recommendations:');
    if (benchmarkResults.recommendations.length > 0) {
      benchmarkResults.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    } else {
      console.log('   No specific recommendations - performance is optimal');
    }

    // Performance Score Interpretation
    console.log('\\n📊 Performance Score Interpretation:');
    const score = benchmarkResults.summary.overallScore;
    if (score >= 90) {
      console.log('   🟢 EXCELLENT (90-100): Outstanding performance, production ready');
    } else if (score >= 75) {
      console.log('   🟡 GOOD (75-89): Good performance với minor optimization opportunities');
    } else if (score >= 60) {
      console.log('   🟠 FAIR (60-74): Acceptable performance, optimization recommended');
    } else {
      console.log('   🔴 POOR (<60): Performance issues require immediate attention');
    }

    console.log('\\n============================================================');
    console.log('🎯 Performance Benchmarking Complete');
    console.log('============================================================');

    // Exit với appropriate code
    const success = score >= 60 && avgResponseTime < 5000; // Reasonable thresholds
    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('❌ Performance benchmarking failed:', error);
    process.exit(1);
  }
}

// Run performance tests if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceTests().catch(error => {
    console.error('Performance test suite failed:', error);
    process.exit(1);
  });
}

export { runPerformanceTests };