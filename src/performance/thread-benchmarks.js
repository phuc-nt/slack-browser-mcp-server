/**
 * Sprint 3.3: Thread Performance Benchmarking System
 * Comprehensive performance measurement và optimization framework
 */
// Simple logger for performance testing
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
    error: (msg, data) => console.error(`[ERROR] ${msg}`, data || '')
};
/**
 * Thread Performance Benchmarking Class
 */
export class ThreadPerformanceBenchmarks {
    testChannel = 'C07UMQ2PR1V'; // general channel for testing
    testThreadTs = '1754521533.893'; // existing test thread
    constructor() {
        logger.info('Thread Performance Benchmarks initialized');
    }
    /**
     * Measure thread discovery response time
     */
    async measureThreadDiscoveryTime(iterations = 10) {
        const testName = 'Thread Discovery Performance';
        const iterationResults = [];
        const startTime = Date.now();
        for (let i = 0; i < iterations; i++) {
            const iterationStart = Date.now();
            let memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
            let apiCalls = 0;
            let cacheHits = 0;
            let success = true;
            let error;
            try {
                // Simulate thread discovery operation
                await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
                apiCalls = 1;
                cacheHits = Math.random() > 0.7 ? 1 : 0; // Simulate 30% cache hit rate
            }
            catch (err) {
                success = false;
                error = err instanceof Error ? err.message : String(err);
            }
            const iterationTime = Date.now() - iterationStart;
            const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
            iterationResults.push({
                iteration: i + 1,
                responseTime: iterationTime,
                memoryUsage: memoryAfter - memoryBefore,
                apiCalls,
                cacheHits,
                success,
                error
            });
            // Small delay between iterations
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.calculateBenchmarkResult(testName, iterationResults, startTime);
    }
    /**
     * Measure thread navigation latency
     */
    async measureThreadNavigationTime(iterations = 20) {
        const testName = 'Thread Navigation Performance';
        const iterationResults = [];
        const startTime = Date.now();
        for (let i = 0; i < iterations; i++) {
            const iterationStart = Date.now();
            let memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
            let apiCalls = 0;
            let cacheHits = 0;
            let success = true;
            let error;
            try {
                // Simulate thread navigation operation
                await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 50));
                apiCalls = 1;
                // Simulate processing thread replies
                const mockMessages = Array(5).fill(0).map((_, idx) => ({
                    user: `U${idx}`,
                    text: `Message ${idx}`,
                    ts: `${Date.now()}.${idx}`
                }));
                for (const message of mockMessages) {
                    const processStart = performance.now();
                    JSON.stringify(message);
                    const processTime = performance.now() - processStart;
                    if (processTime < 1)
                        cacheHits++;
                }
            }
            catch (err) {
                success = false;
                error = err instanceof Error ? err.message : String(err);
            }
            const iterationTime = Date.now() - iterationStart;
            const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
            iterationResults.push({
                iteration: i + 1,
                responseTime: iterationTime,
                memoryUsage: memoryAfter - memoryBefore,
                apiCalls,
                cacheHits,
                success,
                error
            });
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return this.calculateBenchmarkResult(testName, iterationResults, startTime);
    }
    /**
     * Measure bulk operation performance
     */
    async measureBulkOperationTime(threadCount = 5, iterations = 5) {
        const testName = `Bulk Operations (${threadCount} threads)`;
        const iterationResults = [];
        const startTime = Date.now();
        for (let i = 0; i < iterations; i++) {
            const iterationStart = Date.now();
            let memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
            let apiCalls = 0;
            let cacheHits = 0;
            let success = true;
            let error;
            try {
                // Simulate bulk thread processing
                const threadOperations = Array(threadCount).fill(0).map((_, idx) => ({
                    thread_ts: `175452${1533 + idx}.893`,
                    channel_id: this.testChannel,
                    operation: 'analyze'
                }));
                for (const operation of threadOperations) {
                    const operationStart = Date.now();
                    // Simulate thread context retrieval
                    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));
                    apiCalls++;
                    const operationTime = Date.now() - operationStart;
                    if (operationTime < 100)
                        cacheHits++;
                }
            }
            catch (err) {
                success = false;
                error = err instanceof Error ? err.message : String(err);
            }
            const iterationTime = Date.now() - iterationStart;
            const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
            iterationResults.push({
                iteration: i + 1,
                responseTime: iterationTime,
                memoryUsage: memoryAfter - memoryBefore,
                apiCalls,
                cacheHits,
                success,
                error
            });
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        return this.calculateBenchmarkResult(testName, iterationResults, startTime);
    }
    /**
     * Measure memory usage under load
     */
    async measureMemoryUsageUnderLoad(load = 50) {
        const testName = `Memory Usage Under Load (${load} operations)`;
        const iterationResults = [];
        const startTime = Date.now();
        // Run single iteration với high load
        const iterationStart = Date.now();
        let memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
        let apiCalls = 0;
        let cacheHits = 0;
        let success = true;
        let error;
        try {
            // Create memory load simulation
            const memoryStore = [];
            for (let i = 0; i < load; i++) {
                // Simulate thread data processing
                const threadData = {
                    thread_ts: `${Date.now()}.${i}`,
                    messages: Array(10).fill(0).map((_, idx) => ({
                        user: `U${Math.random().toString(36).substr(2, 8)}`,
                        text: `Message ${idx} with content that simulates real thread messages`,
                        ts: `${Date.now()}.${idx}`,
                        reactions: Math.random() > 0.5 ? [{ name: 'thumbsup', count: Math.floor(Math.random() * 5) }] : []
                    })),
                    participants: Array(Math.floor(Math.random() * 8) + 2).fill(0).map(() => `U${Math.random().toString(36).substr(2, 8)}`),
                    metadata: {
                        created: new Date().toISOString(),
                        lastActivity: new Date().toISOString(),
                        messageCount: Math.floor(Math.random() * 20) + 5
                    }
                };
                memoryStore.push(threadData);
                // Simulate processing
                JSON.stringify(threadData);
                // Check memory periodically
                if (i % 10 === 0) {
                    const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
                    if (currentMemory > memoryBefore + 100) { // If memory grows too much
                        cacheHits++; // Simulate garbage collection or caching
                    }
                }
            }
            apiCalls = load;
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                cacheHits += 5; // Simulate cache cleanup
            }
        }
        catch (err) {
            success = false;
            error = err instanceof Error ? err.message : String(err);
        }
        const iterationTime = Date.now() - iterationStart;
        const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
        iterationResults.push({
            iteration: 1,
            responseTime: iterationTime,
            memoryUsage: memoryAfter - memoryBefore,
            apiCalls,
            cacheHits,
            success,
            error
        });
        return this.calculateBenchmarkResult(testName, iterationResults, startTime);
    }
    /**
     * Measure cache efficiency
     */
    async measureCacheEfficiency(iterations = 30) {
        const testName = 'Cache Efficiency Performance';
        const iterationResults = [];
        const startTime = Date.now();
        // Simple cache simulation
        const cache = new Map();
        for (let i = 0; i < iterations; i++) {
            const iterationStart = Date.now();
            let memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
            let apiCalls = 0;
            let cacheHits = 0;
            let success = true;
            let error;
            try {
                const cacheKey = `thread_${Math.floor(i / 3)}_context`; // Force some cache reuse
                if (cache.has(cacheKey)) {
                    // Cache hit
                    const cachedData = cache.get(cacheKey);
                    JSON.stringify(cachedData); // Simulate usage
                    cacheHits = 1;
                }
                else {
                    // Cache miss - simulate API call time
                    await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 40));
                    apiCalls = 1;
                    // Store in cache
                    const simulatedData = {
                        channels: Array(5).fill(0).map((_, idx) => ({ id: `C${idx}`, name: `channel-${idx}` }))
                    };
                    cache.set(cacheKey, simulatedData);
                }
            }
            catch (err) {
                success = false;
                error = err instanceof Error ? err.message : String(err);
            }
            const iterationTime = Date.now() - iterationStart;
            const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
            iterationResults.push({
                iteration: i + 1,
                responseTime: iterationTime,
                memoryUsage: memoryAfter - memoryBefore,
                apiCalls,
                cacheHits,
                success,
                error
            });
            await new Promise(resolve => setTimeout(resolve, 30));
        }
        return this.calculateBenchmarkResult(testName, iterationResults, startTime);
    }
    /**
     * Measure API call optimization efficiency
     */
    async measureApiCallOptimization(iterations = 15) {
        const testName = 'API Call Optimization';
        const iterationResults = [];
        const startTime = Date.now();
        for (let i = 0; i < iterations; i++) {
            const iterationStart = Date.now();
            let memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;
            let apiCalls = 0;
            let cacheHits = 0;
            let success = true;
            let error;
            try {
                // Simulate optimized processing
                await new Promise(resolve => setTimeout(resolve, 40 + Math.random() * 30));
                apiCalls = 1;
                cacheHits = 1; // Simulate optimization benefit
            }
            catch (err) {
                success = false;
                error = err instanceof Error ? err.message : String(err);
            }
            const iterationTime = Date.now() - iterationStart;
            const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
            iterationResults.push({
                iteration: i + 1,
                responseTime: iterationTime,
                memoryUsage: memoryAfter - memoryBefore,
                apiCalls,
                cacheHits,
                success,
                error
            });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.calculateBenchmarkResult(testName, iterationResults, startTime);
    }
    /**
     * Calculate benchmark result từ iteration data
     */
    calculateBenchmarkResult(testName, iterations, startTime) {
        const totalDuration = Date.now() - startTime;
        const successfulIterations = iterations.filter(i => i.success);
        if (successfulIterations.length === 0) {
            return {
                testName,
                totalDuration,
                averageResponseTime: 0,
                minResponseTime: 0,
                maxResponseTime: 0,
                operationsPerSecond: 0,
                memoryUsageMB: 0,
                apiCallsCount: 0,
                cacheHitRatio: 0,
                errorRate: 100,
                iterations: iterations.length,
                timestamp: new Date().toISOString(),
                details: { iterations, systemInfo: this.getSystemInfo() }
            };
        }
        const responseTimes = successfulIterations.map(i => i.responseTime);
        const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const minResponseTime = Math.min(...responseTimes);
        const maxResponseTime = Math.max(...responseTimes);
        const totalApiCalls = successfulIterations.reduce((sum, i) => sum + i.apiCalls, 0);
        const totalCacheHits = successfulIterations.reduce((sum, i) => sum + i.cacheHits, 0);
        const cacheHitRatio = totalApiCalls > 0 ? (totalCacheHits / (totalApiCalls + totalCacheHits)) * 100 : 0;
        const totalMemoryUsage = successfulIterations.reduce((sum, i) => sum + i.memoryUsage, 0);
        const averageMemoryUsage = totalMemoryUsage / successfulIterations.length;
        const operationsPerSecond = (successfulIterations.length / (totalDuration / 1000));
        const errorRate = ((iterations.length - successfulIterations.length) / iterations.length) * 100;
        return {
            testName,
            totalDuration,
            averageResponseTime: Math.round(averageResponseTime * 100) / 100,
            minResponseTime,
            maxResponseTime,
            operationsPerSecond: Math.round(operationsPerSecond * 100) / 100,
            memoryUsageMB: Math.round(averageMemoryUsage * 100) / 100,
            apiCallsCount: totalApiCalls,
            cacheHitRatio: Math.round(cacheHitRatio * 100) / 100,
            errorRate: Math.round(errorRate * 100) / 100,
            iterations: iterations.length,
            timestamp: new Date().toISOString(),
            details: { iterations, systemInfo: this.getSystemInfo() }
        };
    }
    /**
     * Get current system information
     */
    getSystemInfo() {
        try {
            return {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                totalMemory: Math.round(process.memoryUsage().rss / 1024 / 1024),
                freeMemory: Math.round(process.memoryUsage().external / 1024 / 1024),
                cpuCount: 0, // Will be updated if os module is available
                loadAverage: [0, 0, 0], // Will be updated if os module is available
                uptime: Math.round(process.uptime())
            };
        }
        catch (error) {
            return {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                totalMemory: 0,
                freeMemory: 0,
                cpuCount: 0,
                loadAverage: [0, 0, 0],
                uptime: Math.round(process.uptime())
            };
        }
    }
    /**
     * Run comprehensive benchmark suite
     */
    async runComprehensiveBenchmarks() {
        const startTime = Date.now();
        logger.info('Starting comprehensive thread performance benchmarks');
        const results = [];
        try {
            // Run all benchmark tests
            logger.info('Running thread discovery benchmark...');
            results.push(await this.measureThreadDiscoveryTime(8));
            logger.info('Running thread navigation benchmark...');
            results.push(await this.measureThreadNavigationTime(15));
            logger.info('Running bulk operations benchmark...');
            results.push(await this.measureBulkOperationTime(3, 3));
            logger.info('Running memory usage benchmark...');
            results.push(await this.measureMemoryUsageUnderLoad(25));
            logger.info('Running cache efficiency benchmark...');
            results.push(await this.measureCacheEfficiency(20));
            logger.info('Running API optimization benchmark...');
            results.push(await this.measureApiCallOptimization(10));
        }
        catch (error) {
            logger.error('Benchmark suite failed', { error });
            throw error;
        }
        const totalDuration = Date.now() - startTime;
        // Calculate overall performance score (0-100)
        const avgResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length;
        const avgCacheHitRatio = results.reduce((sum, r) => sum + r.cacheHitRatio, 0) / results.length;
        const avgErrorRate = results.reduce((sum, r) => sum + r.errorRate, 0) / results.length;
        const avgOpsPerSecond = results.reduce((sum, r) => sum + r.operationsPerSecond, 0) / results.length;
        // Performance scoring algorithm
        const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 10)); // Lower is better
        const cacheScore = avgCacheHitRatio; // Higher is better
        const errorScore = Math.max(0, 100 - avgErrorRate); // Lower error rate is better
        const throughputScore = Math.min(100, avgOpsPerSecond * 2); // Higher throughput is better
        const overallScore = Math.round((responseTimeScore * 0.3 + cacheScore * 0.25 + errorScore * 0.25 + throughputScore * 0.2));
        // Generate performance recommendations
        const recommendations = [];
        if (avgResponseTime > 1000) {
            recommendations.push('Consider optimizing thread discovery queries - average response time > 1s');
        }
        if (avgCacheHitRatio < 50) {
            recommendations.push('Improve caching strategy - cache hit ratio below 50%');
        }
        if (avgErrorRate > 10) {
            recommendations.push('Reduce error rate - current rate above acceptable threshold');
        }
        if (results.some(r => r.memoryUsageMB > 50)) {
            recommendations.push('Monitor memory usage - some operations consuming >50MB');
        }
        if (avgOpsPerSecond < 5) {
            recommendations.push('Optimize throughput - operations per second below target');
        }
        if (recommendations.length === 0) {
            recommendations.push('Performance metrics are within acceptable ranges');
        }
        logger.info('Comprehensive benchmarks completed', {
            totalTests: results.length,
            totalDuration,
            overallScore,
            avgResponseTime,
            avgCacheHitRatio,
            avgErrorRate
        });
        return {
            summary: {
                totalTests: results.length,
                totalDuration,
                overallScore,
                timestamp: new Date().toISOString()
            },
            results,
            recommendations
        };
    }
}
//# sourceMappingURL=thread-benchmarks.js.map