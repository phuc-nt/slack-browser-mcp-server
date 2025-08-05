/**
 * Test Sprint 2.1 Implementation
 * Test the Slack tools with real API integration
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testSprint21() {
  console.log('🧪 Testing Sprint 2.1: Slack API Integration\n');

  const serverPath = '/Users/phucnt/Workspace/slack-browser-mcp-server/dist/index.js';

  try {
    // Connect to MCP server
    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
    });

    const client = new Client(
      {
        name: 'sprint-2.1-test',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // Test 1: List Channels (Task 2.1.4)
    console.log('📋 Testing list_channels tool...');
    try {
      const channelsResult = await client.callTool({
        name: 'list_channels',
        arguments: {
          include_archived: false,
        },
      });

      console.log('✅ list_channels success!');
      console.log(
        'Result preview:',
        JSON.stringify(channelsResult.content?.[0]?.text?.substring(0, 200) + '...', null, 2)
      );
    } catch (error) {
      console.log('❌ list_channels error:', error instanceof Error ? error.message : error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: List Users (Task 2.1.4)
    console.log('👥 Testing list_users tool...');
    try {
      const usersResult = await client.callTool({
        name: 'list_users',
        arguments: {
          include_deleted: false,
        },
      });

      console.log('✅ list_users success!');
      console.log(
        'Result preview:',
        JSON.stringify(usersResult.content?.[0]?.text?.substring(0, 200) + '...', null, 2)
      );
    } catch (error) {
      console.log('❌ list_users error:', error instanceof Error ? error.message : error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Get Channel History (Task 2.1.4)
    console.log('💬 Testing get_channel_history tool...');
    try {
      const historyResult = await client.callTool({
        name: 'get_channel_history',
        arguments: {
          channel: 'C099184U2TU', // Test channel from .env
          limit: 3,
        },
      });

      console.log('✅ get_channel_history success!');
      console.log(
        'Result preview:',
        JSON.stringify(historyResult.content?.[0]?.text?.substring(0, 200) + '...', null, 2)
      );
    } catch (error) {
      console.log('❌ get_channel_history error:', error instanceof Error ? error.message : error);
    }

    await client.close();
    console.log('\n🎯 Sprint 2.1 Implementation Test Complete');
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : error);
  }
}

// Run the test
testSprint21().catch(console.error);
