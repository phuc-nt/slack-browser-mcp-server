/**
 * Sprint 3.3: Thread Performance Benchmarking System
 * Comprehensive performance measurement và optimization framework
 */
export interface BenchmarkResult {
    testName: string;
    totalDuration: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    operationsPerSecond: number;
    memoryUsageMB: number;
    apiCallsCount: number;
    cacheHitRatio: number;
    errorRate: number;
    iterations: number;
    timestamp: string;
    details: {
        iterations: IterationResult[];
        systemInfo: SystemInfo;
    };
}
export interface IterationResult {
    iteration: number;
    responseTime: number;
    memoryUsage: number;
    apiCalls: number;
    cacheHits: number;
    success: boolean;
    error?: string;
}
export interface SystemInfo {
    nodeVersion: string;
    platform: string;
    arch: string;
    totalMemory: number;
    freeMemory: number;
    cpuCount: number;
    loadAverage: number[];
    uptime: number;
}
/**
 * Thread Performance Benchmarking Class
 */
export declare class ThreadPerformanceBenchmarks {
    private testChannel;
    private testThreadTs;
    constructor();
    /**
     * Measure thread discovery response time
     */
    measureThreadDiscoveryTime(iterations?: number): Promise<BenchmarkResult>;
    /**
     * Measure thread navigation latency
     */
    measureThreadNavigationTime(iterations?: number): Promise<BenchmarkResult>;
    /**
     * Measure bulk operation performance
     */
    measureBulkOperationTime(threadCount?: number, iterations?: number): Promise<BenchmarkResult>;
    /**
     * Measure memory usage under load
     */
    measureMemoryUsageUnderLoad(load?: number): Promise<BenchmarkResult>;
    /**
     * Measure cache efficiency
     */
    measureCacheEfficiency(iterations?: number): Promise<BenchmarkResult>;
    /**
     * Measure API call optimization efficiency
     */
    measureApiCallOptimization(iterations?: number): Promise<BenchmarkResult>;
    /**
     * Calculate benchmark result từ iteration data
     */
    private calculateBenchmarkResult;
    /**
     * Get current system information
     */
    private getSystemInfo;
    /**
     * Run comprehensive benchmark suite
     */
    runComprehensiveBenchmarks(): Promise<{
        summary: {
            totalTests: number;
            totalDuration: number;
            overallScore: number;
            timestamp: string;
        };
        results: BenchmarkResult[];
        recommendations: string[];
    }>;
}
//# sourceMappingURL=thread-benchmarks.d.ts.map