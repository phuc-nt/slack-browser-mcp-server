/**
 * Test Tools - MCP Server Tools Testing
 * Tests all available tools including Slack tools
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

console.log('🛠️ Testing MCP Server Tools...\n');

async function testTools() {
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
        name: 'tools-test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    console.log('🔌 Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected to Slack MCP Server\n');

    // List all tools
    console.log('📋 Listing available tools...');
    const { tools } = await client.listTools();
    console.log(`Found ${tools.length} tools:\n`);

    tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name}`);
      console.log(`     Description: ${tool.description}`);
      console.log(
        `     Schema: ${Object.keys(tool.inputSchema.properties || {}).join(', ') || 'none'}\n`
      );
    });

    // Test basic tools
    console.log('='.repeat(50));
    console.log('Testing Basic Tools');
    console.log('='.repeat(50));

    // Test ping tool
    const pingTool = tools.find((t) => t.name === 'ping');
    if (pingTool) {
      console.log('\n📞 Testing ping tool...');
      try {
        const result = await client.callTool({
          name: 'ping',
          arguments: { message: 'Test message' },
        });
        console.log('✅ Ping successful');
        const content = result.content as any[];
        console.log(
          'Response preview:',
          JSON.stringify((content?.[0]?.text as string)?.substring(0, 100), null, 2)
        );
      } catch (error) {
        console.log('❌ Ping failed:', error instanceof Error ? error.message : error);
      }
    }

    // Test echo tool
    const echoTool = tools.find((t) => t.name === 'echo');
    if (echoTool) {
      console.log('\n🔊 Testing echo tool...');
      try {
        const result = await client.callTool({
          name: 'echo',
          arguments: { text: 'Hello World', repeat: 2 },
        });
        console.log('✅ Echo successful');
        const content = result.content as any[];
        console.log(
          'Response preview:',
          JSON.stringify((content?.[0]?.text as string)?.substring(0, 100), null, 2)
        );
      } catch (error) {
        console.log('❌ Echo failed:', error instanceof Error ? error.message : error);
      }
    }

    // Test Slack tools if tokens are configured
    const hasSlackTokens =
      process.env.SLACK_XOXC_TOKEN &&
      process.env.SLACK_XOXD_TOKEN &&
      process.env.SLACK_TEAM_DOMAIN &&
      !process.env.SLACK_XOXC_TOKEN.includes('your-token-here');

    if (hasSlackTokens) {
      console.log('\n' + '='.repeat(50));
      console.log('Testing Slack Tools (Real API)');
      console.log('='.repeat(50));

      // Test list_channels
      const channelsTool = tools.find((t) => t.name === 'list_channels');
      if (channelsTool) {
        console.log('\n📋 Testing list_channels tool...');
        try {
          const result = await client.callTool({
            name: 'list_channels',
            arguments: { include_archived: false },
          });
          console.log('✅ list_channels successful');
          const content = result.content as any[];
          console.log(
            'Response preview:',
            JSON.stringify((content?.[0]?.text as string)?.substring(0, 150), null, 2)
          );
        } catch (error) {
          console.log('❌ list_channels failed:', error instanceof Error ? error.message : error);
        }
      }

      // Test list_users
      const usersTool = tools.find((t) => t.name === 'list_users');
      if (usersTool) {
        console.log('\n👥 Testing list_users tool...');
        try {
          const result = await client.callTool({
            name: 'list_users',
            arguments: { include_deleted: false },
          });
          console.log('✅ list_users successful');
          const content = result.content as any[];
          console.log(
            'Response preview:',
            JSON.stringify((content?.[0]?.text as string)?.substring(0, 150), null, 2)
          );
        } catch (error) {
          console.log('❌ list_users failed:', error instanceof Error ? error.message : error);
        }
      }

      // Test get_channel_history with a test channel
      const historyTool = tools.find((t) => t.name === 'get_channel_history');
      if (historyTool && process.env.TEST_CHANNEL_ID) {
        console.log('\n💬 Testing get_channel_history tool...');
        try {
          const result = await client.callTool({
            name: 'get_channel_history',
            arguments: {
              channel: process.env.TEST_CHANNEL_ID,
              limit: 5,
            },
          });
          console.log('✅ get_channel_history successful');
          const content = result.content as any[];
          console.log(
            'Response preview:',
            JSON.stringify((content?.[0]?.text as string)?.substring(0, 150), null, 2)
          );
        } catch (error) {
          console.log(
            '❌ get_channel_history failed:',
            error instanceof Error ? error.message : error
          );
        }
      }
    } else {
      console.log('\n📋 Slack tokens not configured - skipping Slack API tests');
      console.log('   Configure tokens in .env to test Slack integration');
    }

    await client.close();
    console.log('\n🎯 Tools testing complete!');
  } catch (error) {
    console.error('❌ Tools test failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTools().catch(console.error);
}

export { testTools };
