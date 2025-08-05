import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function testTools() {
  console.log('🧪 Testing Slack MCP Server Tools...\n');

  const client = new Client({
    name: 'tools-test-client',
    version: '1.0.0'
  });

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    env: {
      ...process.env,
      LOG_LEVEL: 'warn'
    }
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // List tools
    const toolsResult = await client.listTools();
    console.log(`\n🛠️ Available tools: ${toolsResult.tools.length}`);
    
    toolsResult.tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });

    // Test ping tool
    if (toolsResult.tools.find(t => t.name === 'ping')) {
      console.log('\n📞 Testing ping tool...');
      const pingResult = await client.callTool({
        name: 'ping',
        arguments: { message: 'Hello from test!' }
      });
      console.log('✅ Ping result:', JSON.stringify(pingResult, null, 2));
    }

    // Test echo tool
    if (toolsResult.tools.find(t => t.name === 'echo')) {
      console.log('\n🔊 Testing echo tool...');
      const echoResult = await client.callTool({
        name: 'echo',
        arguments: { text: 'Testing echo functionality', repeat: 2 }
      });
      console.log('✅ Echo result:', JSON.stringify(echoResult, null, 2));
    }

    console.log('\n🎉 All tools tested successfully!');

  } catch (error) {
    console.error('❌ Tool testing failed:', error);
  } finally {
    try {
      await client.close();
    } catch (e) {
      // ignore cleanup errors
    }
  }
}

testTools().catch(console.error);