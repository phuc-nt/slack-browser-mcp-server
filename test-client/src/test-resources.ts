/**
 * Test Resources - MCP Server Resources Testing
 * Tests all available resources
 */

import { config } from 'dotenv';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '..', '.env') });

const SERVER_PATH = path.join(__dirname, '..', '..', 'dist', 'index.js');

console.log('📚 Testing MCP Server Resources...\n');

async function testResources() {
  try {
    // Connect to MCP server
    const transport = new StdioClientTransport({
      command: 'node',
      args: [SERVER_PATH],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    const client = new Client(
      {
        name: 'resources-test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    console.log('🔌 Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected to Slack MCP Server\n');

    // List all resources
    console.log('📋 Listing available resources...');
    const { resources } = await client.listResources();
    console.log(`Found ${resources.length} resources:\n`);

    resources.forEach((resource, index) => {
      console.log(`  ${index + 1}. ${resource.uri}`);
      console.log(`     Name: ${resource.name}`);
      console.log(`     Description: ${resource.description || 'No description'}`);
      console.log(`     MIME Type: ${resource.mimeType || 'text/plain'}\n`);
    });

    // Test reading each resource
    console.log('='.repeat(50));
    console.log('Testing Resource Reading');
    console.log('='.repeat(50));

    for (const resource of resources) {
      console.log(`\n📖 Reading resource: ${resource.name}`);
      try {
        const content = await client.readResource({ uri: resource.uri });
        console.log('✅ Resource read successful');

        // Show preview of content
        if (content.contents && content.contents.length > 0) {
          const firstContent = content.contents[0] as any;
          if (firstContent.text) {
            const preview = (firstContent.text as string).substring(0, 200);
            console.log(
              'Content preview:',
              preview + ((firstContent.text as string).length > 200 ? '...' : '')
            );
          } else if (firstContent.blob) {
            console.log('Content type: Binary blob');
          }
        } else {
          console.log('No content returned');
        }
      } catch (error) {
        console.log('❌ Resource read failed:', error instanceof Error ? error.message : error);
      }
    }

    // Test specific resources by type
    console.log('\n' + '='.repeat(50));
    console.log('Testing Specific Resource Types');
    console.log('='.repeat(50));

    // Test server status resource
    const statusResource = resources.find((r) => r.uri.includes('status'));
    if (statusResource) {
      console.log('\n🔍 Testing server status resource...');
      try {
        const status = await client.readResource({ uri: statusResource.uri });
        console.log('✅ Server status retrieved');

        if (status.contents?.[0]) {
          const statusText = (status.contents[0] as any).text as string;
          if (statusText) {
            const statusData = JSON.parse(statusText);
            console.log('Server uptime:', statusData.uptime || 'unknown');
            console.log('Memory usage:', statusData.memoryUsage?.heapUsed || 'unknown');
          }
        }
      } catch (error) {
        console.log('❌ Status resource failed:', error instanceof Error ? error.message : error);
      }
    }

    // Test tool registry resource
    const registryResource = resources.find((r) => r.uri.includes('registry'));
    if (registryResource) {
      console.log('\n🛠️ Testing tool registry resource...');
      try {
        const registry = await client.readResource({ uri: registryResource.uri });
        console.log('✅ Tool registry retrieved');

        if (registry.contents?.[0]) {
          const registryText = (registry.contents[0] as any).text as string;
          if (registryText) {
            const registryData = JSON.parse(registryText);
            console.log('Registered tools count:', Object.keys(registryData.tools || {}).length);
            console.log('Tool categories:', Object.keys(registryData.categories || {}));
          }
        }
      } catch (error) {
        console.log('❌ Registry resource failed:', error instanceof Error ? error.message : error);
      }
    }

    // Test server info resource
    const infoResource = resources.find((r) => r.uri.includes('info'));
    if (infoResource) {
      console.log('\n📋 Testing server info resource...');
      try {
        const info = await client.readResource({ uri: infoResource.uri });
        console.log('✅ Server info retrieved');

        if (info.contents?.[0]) {
          const infoText = (info.contents[0] as any).text as string;
          if (infoText) {
            const infoData = JSON.parse(infoText);
            console.log('Server name:', infoData.name || 'unknown');
            console.log('Server version:', infoData.version || 'unknown');
            console.log('Protocol version:', infoData.protocolVersion || 'unknown');
          }
        }
      } catch (error) {
        console.log('❌ Info resource failed:', error instanceof Error ? error.message : error);
      }
    }

    await client.close();
    console.log('\n🎯 Resources testing complete!');
  } catch (error) {
    console.error('❌ Resources test failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testResources().catch(console.error);
}

export { testResources };
