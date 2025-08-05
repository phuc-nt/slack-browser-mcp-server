import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function runBenchmark() {
  console.log('⚡ Slack MCP Server Performance Benchmark\n');

  const client = new Client({
    name: 'benchmark-client',
    version: '1.0.0'
  });

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    env: {
      ...process.env,
      LOG_LEVEL: 'error' // Minimize logging for accurate benchmarks
    }
  });

  try {
    const startConnect = Date.now();
    await client.connect(transport);
    const connectTime = Date.now() - startConnect;
    
    console.log(`✅ Connection established in ${connectTime}ms`);

    // Benchmark tool listing
    const listStart = Date.now();
    const toolsResult = await client.listTools();
    const listTime = Date.now() - listStart;
    
    console.log(`🛠️ Tool listing: ${listTime}ms (${toolsResult.tools.length} tools)`);

    // Benchmark resource listing
    const resourceStart = Date.now();
    const resourcesResult = await client.listResources();
    const resourceTime = Date.now() - resourceStart;
    
    console.log(`📁 Resource listing: ${resourceTime}ms (${resourcesResult.resources.length} resources)`);

    // Benchmark ping tool (multiple calls)
    console.log('\n📊 Tool Execution Benchmarks:');
    
    const pingTimes = [];
    const numCalls = 10;
    
    for (let i = 0; i < numCalls; i++) {
      const start = Date.now();
      await client.callTool({
        name: 'ping',
        arguments: { message: `Benchmark call ${i + 1}` }
      });
      pingTimes.push(Date.now() - start);
    }

    const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;
    const minPing = Math.min(...pingTimes);
    const maxPing = Math.max(...pingTimes);

    console.log(`  Ping tool (${numCalls} calls):`);
    console.log(`    Average: ${avgPing.toFixed(2)}ms`);
    console.log(`    Min: ${minPing}ms, Max: ${maxPing}ms`);

    // Benchmark echo tool with different sizes
    const echoSizes = [10, 100, 500];
    
    for (const size of echoSizes) {
      const text = 'A'.repeat(size);
      const start = Date.now();
      await client.callTool({
        name: 'echo',
        arguments: { text, repeat: 1 }
      });
      const time = Date.now() - start;
      console.log(`  Echo tool (${size} chars): ${time}ms`);
    }

    // Memory usage simulation
    console.log('\n🧠 Concurrent Execution Test:');
    const concurrentCalls = 5;
    const promises = [];
    
    const concurrentStart = Date.now();
    for (let i = 0; i < concurrentCalls; i++) {
      promises.push(client.callTool({
        name: 'ping',
        arguments: { message: `Concurrent ${i + 1}` }
      }));
    }
    
    await Promise.all(promises);
    const concurrentTime = Date.now() - concurrentStart;
    
    console.log(`  ${concurrentCalls} concurrent calls: ${concurrentTime}ms`);
    console.log(`  Average per call: ${(concurrentTime / concurrentCalls).toFixed(2)}ms`);

    // Summary
    console.log('\n📈 Performance Summary:');
    console.log(`  Connection: ${connectTime}ms`);
    console.log(`  Tool listing: ${listTime}ms`);
    console.log(`  Resource listing: ${resourceTime}ms`);
    console.log(`  Average tool execution: ${avgPing.toFixed(2)}ms`);
    console.log(`  Concurrent performance: ${(concurrentTime / concurrentCalls).toFixed(2)}ms per call`);
    
    // Performance thresholds check
    const thresholds = {
      connection: 1000,  // 1 second
      toolListing: 100,  // 100ms
      toolExecution: 50  // 50ms average
    };

    console.log('\n🎯 Threshold Analysis:');
    console.log(`  Connection ${connectTime <= thresholds.connection ? '✅' : '❌'} (${connectTime}ms <= ${thresholds.connection}ms)`);
    console.log(`  Tool listing ${listTime <= thresholds.toolListing ? '✅' : '❌'} (${listTime}ms <= ${thresholds.toolListing}ms)`);
    console.log(`  Tool execution ${avgPing <= thresholds.toolExecution ? '✅' : '❌'} (${avgPing.toFixed(2)}ms <= ${thresholds.toolExecution}ms)`);

    console.log('\n🏁 Benchmark completed successfully!');

  } catch (error) {
    console.error('❌ Benchmark failed:', error);
  } finally {
    try {
      await client.close();
    } catch (e) {
      // ignore cleanup errors
    }
  }
}

runBenchmark().catch(console.error);