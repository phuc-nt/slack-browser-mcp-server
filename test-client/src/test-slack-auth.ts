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

console.log('🧪 Testing Slack Authentication...\n');

async function testSlackAuth() {
  // Check if tokens are configured
  const xoxcToken = process.env.SLACK_XOXC_TOKEN;
  const xoxdToken = process.env.SLACK_XOXD_TOKEN;
  const teamDomain = process.env.SLACK_TEAM_DOMAIN;

  console.log('📋 Environment Check:');
  console.log(`  SLACK_XOXC_TOKEN: ${xoxcToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SLACK_XOXD_TOKEN: ${xoxdToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`  SLACK_TEAM_DOMAIN: ${teamDomain ? '✅ Set' : '❌ Missing'}`);

  if (!xoxcToken || !xoxdToken || !teamDomain) {
    console.log('\n❌ Please configure your Slack tokens in .env file');
    console.log('📖 See README.md for token extraction instructions');
    return;
  }

  if (xoxcToken === 'xoxc-your-actual-token-here') {
    console.log('\n⚠️  Please replace placeholder tokens with actual values');
    return;
  }

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
        name: 'slack-auth-test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    console.log('\n🔌 Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected to Slack MCP Server');

    // Test Slack authentication tool (when implemented)
    console.log('\n🔐 Testing Slack authentication...');

    // This will be implemented in Sprint 2.1
    // For now, just check if auth-related tools exist
    const { tools } = await client.listTools();
    const authTools = tools.filter(
      (tool) =>
        tool.name.includes('auth') || tool.name.includes('test') || tool.name.includes('slack')
    );

    if (authTools.length > 0) {
      console.log('🛠️  Found auth-related tools:');
      authTools.forEach((tool) => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });
    } else {
      console.log('📋 No Slack auth tools found yet (expected in Sprint 2.1)');
    }

    console.log('\n✅ Authentication test setup complete!');
    console.log('🚀 Ready for Sprint 2.1 implementation');

    await client.close();
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  }
}

testSlackAuth().catch(console.error);
