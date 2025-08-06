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
      console.log(`     MIME Type: ${resource.mimeType || 'text/plain'}`);
      
      // Highlight template resources
      if (resource.uri.includes('{') && resource.uri.includes('}')) {
        console.log(`     ⚡ Template Resource - Use actual IDs for real data`);
      }
      console.log();
    });

    // Test reading each resource
    console.log('='.repeat(50));
    console.log('Testing Resource Reading');
    console.log('='.repeat(50));
    
    // Test template resource first
    const templateResource = resources.find((r) => r.uri.includes('{channelId}'));
    if (templateResource) {
      console.log('\n📖 Testing template resource documentation...');
      try {
        const templateData = await client.readResource({ uri: templateResource.uri });
        console.log('✅ Template resource read successful');
        
        if (templateData.contents?.[0]) {
          const templateText = (templateData.contents[0] as any).text as string;
          const template = JSON.parse(templateText);
          
          console.log('📋 Template Information:');
          console.log(`  Template: ${template.template}`);
          console.log(`  Pattern: ${template.usage?.uri_pattern}`);
          console.log(`  Example: ${template.usage?.example}`);
          console.log(`  Parameters: ${Object.keys(template.usage?.parameters || {}).join(', ')}`);
        }
      } catch (error) {
        console.log('❌ Template resource failed:', error instanceof Error ? error.message : error);
      }
    }

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

    // Test dynamic resources (channel history)
    console.log('\n' + '='.repeat(50));
    console.log('Testing Dynamic Resources');
    console.log('='.repeat(50));

    // Get a channel ID from workspace channels for testing
    const channelsResource = resources.find((r) => r.uri === 'slack://workspace/channels');
    if (channelsResource) {
      console.log('\n📖 Getting channel ID for dynamic resource testing...');
      try {
        const channelsContent = await client.readResource({ uri: channelsResource.uri });
        
        if (channelsContent.contents?.[0]) {
          const channelsText = (channelsContent.contents[0] as any).text as string;
          const channelsData = JSON.parse(channelsText);
          
          if (channelsData.success && channelsData.channels.length > 0) {
            const testChannelId = channelsData.channels[0].id;
            const testChannelName = channelsData.channels[0].name;
            
            console.log(`✅ Using channel: ${testChannelName} (${testChannelId})\n`);
            
            // Test dynamic channel history resource
            const dynamicUri = `slack://channels/${testChannelId}/history`;
            console.log(`🧪 Testing dynamic resource: ${dynamicUri}`);
            
            try {
              const historyContent = await client.readResource({ uri: dynamicUri });
              console.log('✅ Dynamic resource read successful');
              
              if (historyContent.contents?.[0]) {
                const historyText = (historyContent.contents[0] as any).text as string;
                const historyData = JSON.parse(historyText);
                
                console.log(`  Channel: ${historyData.channel}`);
                console.log(`  Success: ${historyData.success}`);
                console.log(`  Messages: ${historyData.messages?.length || 0}`);
                
                if (historyData.messages && historyData.messages.length > 0) {
                  console.log('  Sample message:', historyData.messages[0].text || `[${historyData.messages[0].type}]`);
                }
              }
            } catch (error) {
              console.log('❌ Dynamic resource failed:', error instanceof Error ? error.message : error);
            }
            
            // Test with parameters
            const paramUri = `${dynamicUri}?limit=3`;
            console.log(`\n🧪 Testing with parameters: ${paramUri}`);
            
            try {
              const paramContent = await client.readResource({ uri: paramUri });
              console.log('✅ Parameterized resource read successful');
              
              if (paramContent.contents?.[0]) {
                const paramText = (paramContent.contents[0] as any).text as string;
                const paramData = JSON.parse(paramText);
                console.log(`  Limited messages: ${paramData.messages?.length || 0}`);
                console.log(`  Parameters: ${JSON.stringify(paramData.parameters || {})}`);
              }
            } catch (error) {
              console.log('❌ Parameterized resource failed:', error instanceof Error ? error.message : error);
            }
          }
        }
      } catch (error) {
        console.log('❌ Could not get channel for dynamic testing:', error instanceof Error ? error.message : error);
      }
    }

    await client.close();
    
    // Additional integrated testing - direct ResourceRegistry access
    console.log('\n==================================================');
    console.log('Integrated Dynamic Resource Testing (Direct Access)');
    console.log('==================================================\n');
    
    await testIntegratedDynamic();
    
    console.log('\n🎯 Resources testing complete!');
  } catch (error) {
    console.error('❌ Resources test failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Integrated Dynamic Resource Test - Direct ResourceRegistry access
 * Tests ResourceRegistry directly without MCP client subprocess
 */
async function testIntegratedDynamic() {
  try {
    // Import ResourceRegistry dynamically to avoid module conflicts
    const { ResourceRegistry } = await import('../../dist/resources/index.js');
    
    console.log('🔧 Creating ResourceRegistry directly...');
    const registry = new ResourceRegistry();
    console.log('✅ ResourceRegistry created\n');

    // Test 1: Static resource (baseline)
    console.log('🧪 Test 1: Static Resource (Direct)');
    const staticUri = 'slack://workspace/channels';
    console.log('URI:', staticUri);
    
    try {
      const staticContent = await registry.generateResourceContent(staticUri);
      const staticData = JSON.parse(staticContent);
      console.log('✅ Direct static resource: SUCCESS');
      console.log('  Channels found:', staticData.channels?.length || 0);
    } catch (error) {
      console.log('❌ Direct static resource: FAIL -', (error as Error).message);
      return;
    }

    // Test 2: Dynamic resource (target)
    console.log('\n🧪 Test 2: Dynamic Resource (Direct)');
    const dynamicUri = 'slack://channels/C07UMQ2PR1V/history';
    console.log('URI:', dynamicUri);
    
    try {
      const dynamicContent = await registry.generateResourceContent(dynamicUri);
      const dynamicData = JSON.parse(dynamicContent);
      console.log('✅ Direct dynamic resource: SUCCESS');
      console.log('  Success:', dynamicData.success);
      console.log('  Messages:', dynamicData.messages?.length || 0);
      console.log('  Channel:', dynamicData.channel);
      
      if (dynamicData.messages && dynamicData.messages.length > 0) {
        console.log('  Sample message:', dynamicData.messages[0].text || `[${dynamicData.messages[0].type}]`);
      }
    } catch (error) {
      console.log('❌ Direct dynamic resource: FAIL -', (error as Error).message);
    }

    // Test 3: Dynamic resource với parameters
    console.log('\n🧪 Test 3: Dynamic Resource with Parameters (Direct)');
    const paramUri = 'slack://channels/C07UMQ2PR1V/history?limit=2';
    console.log('URI:', paramUri);
    
    try {
      const paramContent = await registry.generateResourceContent(paramUri);
      const paramData = JSON.parse(paramContent);
      console.log('✅ Direct parameterized resource: SUCCESS');
      console.log('  Messages returned:', paramData.messages?.length || 0);
      console.log('  Parameters applied:', JSON.stringify(paramData.parameters || {}));
    } catch (error) {
      console.log('❌ Direct parameterized resource: FAIL -', (error as Error).message);
    }

    // Test 4: Error handling
    console.log('\n🧪 Test 4: Error Handling (Direct)');
    const invalidUri = 'slack://channels/INVALID123/history';
    console.log('URI:', invalidUri);
    
    try {
      const errorContent = await registry.generateResourceContent(invalidUri);
      const errorData = JSON.parse(errorContent);
      
      if (errorData.success === false) {
        console.log('✅ Direct error handling: SUCCESS');
        console.log('  Error message:', errorData.error);
      } else {
        console.log('⚠️ Expected error but got success');
      }
    } catch (error) {
      console.log('✅ Direct error handling: SUCCESS (threw exception)');
      console.log('  Error:', (error as Error).message);
    }

    console.log('\n🎯 Integrated dynamic resource test completed!');

  } catch (error) {
    console.error('❌ Integrated test failed:', (error as Error).message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testResources().catch(console.error);
}

export { testResources };
