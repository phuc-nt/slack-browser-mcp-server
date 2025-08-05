import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { spawn } from 'child_process';

async function testPing() {
  console.log('🔌 Testing ping tool...');
  
  // Create transport
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    cwd: '/Users/phucnt/Workspace/slack-browser-mcp-server'
  });
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    cwd: '/Users/phucnt/Workspace/slack-browser-mcp-server'
  });
  
  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  });
  
  try {
    await client.connect(transport);
    console.log('✅ Connected');
    
    // List tools
    const toolsResult = await client.listTools();
    console.log('🛠️ Tools:', toolsResult.tools.length);
    
    if (toolsResult.tools.length > 0) {
      // Try to call ping
      const pingTool = toolsResult.tools.find(t => t.name === 'ping');
      if (pingTool) {
        console.log('📞 Calling ping tool...');
        const result = await client.callTool({
          name: 'ping',
          arguments: { message: 'test' }
        });
        console.log('✅ Ping result:', result);
      } else {
        console.log('❌ Ping tool not found');
        console.log('Available tools:', toolsResult.tools.map(t => t.name));
      }
    } else {
      console.log('❌ No tools available');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    try {
      await client.close();
      serverProcess.kill();
    } catch (e) {
      // ignore
    }
  }
}

testPing().catch(console.error);