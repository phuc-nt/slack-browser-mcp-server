#!/usr/bin/env node
/**
 * Test Suite 1: Connection and Tool Listing
 * Tests basic MCP server connectivity and tool enumeration
 */

// Load environment variables from .env file
import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(process.cwd(), '.env') });

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { TEST_CONFIG, validateTestConfig, getTestConfigWithEnvOverrides } from './test-config.js';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  message?: string;
  details?: any;
}

class ConnectionTestSuite {
  private client?: Client;
  private transport?: StdioClientTransport;
  private serverProcess?: any;
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🔄 Starting Connection and Tool Listing Test Suite...\n');

    // Validate test configuration
    const configValidation = validateTestConfig();
    if (!configValidation.isValid) {
      console.log('⚠️  Test Configuration Issues:');
      configValidation.issues.forEach((issue) => console.log(`   - ${issue}`));
      console.log('   Tests will run with placeholder data - results may not be meaningful\n');
    }

    const testConfig = getTestConfigWithEnvOverrides();
    console.log('📋 Test Configuration:');
    console.log(
      `   - Test Channel: ${testConfig.channels.public.name} (${testConfig.channels.public.id})`
    );
    console.log(
      `   - Test User: ${testConfig.users.test_user.name} (${testConfig.users.test_user.id})`
    );
    console.log(`   - Timeout: ${testConfig.test_limits.timeout_ms}ms\n`);

    try {
      await this.setupMCPConnection();
      await this.testServerConnection();
      await this.testToolListing();
      await this.testToolCategories();
      await this.validateCriticalTools();
    } finally {
      await this.cleanup();
    }

    this.printResults();
  }

  private async setupMCPConnection(): Promise<void> {
    const startTime = Date.now();

    try {
      // Start the MCP server process
      this.serverProcess = spawn('node', ['../dist/index.js'], {
        cwd: process.cwd(),
        stdio: 'pipe',
      });

      // Create transport and client
      this.transport = new StdioClientTransport({
        command: 'node',
        args: ['/Users/phucnt/Workspace/slack-browser-mcp-server/dist/index.js'],
      });

      this.client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect to the server
      await this.client.connect(this.transport);

      this.results.push({
        name: 'MCP Server Connection',
        status: 'PASS',
        duration: Date.now() - startTime,
        message: 'Successfully connected to MCP server',
      });
    } catch (error) {
      this.results.push({
        name: 'MCP Server Connection',
        status: 'FAIL',
        duration: Date.now() - startTime,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      });
      throw error;
    }
  }

  private async testServerConnection(): Promise<void> {
    const startTime = Date.now();

    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }

      // Test basic server responsiveness with list_workspace_channels tool call
      // This is a lightweight tool that doesn't require specific parameters
      const response = await this.client.callTool({
        name: 'list_workspace_channels',
        arguments: {},
      });

      if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
        throw new Error('No response content received');
      }

      this.results.push({
        name: 'Server Responsiveness (Ping)',
        status: 'PASS',
        duration: Date.now() - startTime,
        message: 'Server responds to tool calls',
        details: {
          response: 'Successfully called list_workspace_channels',
          isError: response.isError,
        },
      });
    } catch (error) {
      this.results.push({
        name: 'Server Responsiveness (Ping)',
        status: 'FAIL',
        duration: Date.now() - startTime,
        message: `Ping test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      });
    }
  }

  private async testToolListing(): Promise<void> {
    const startTime = Date.now();

    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }

      // List all available tools
      const tools = await this.client.listTools();

      if (!tools.tools || tools.tools.length === 0) {
        throw new Error('No tools returned from server');
      }

      console.log(`📦 Found ${tools.tools.length} tools:`);
      tools.tools.forEach((tool, index) => {
        console.log(`   ${index + 1}. ${tool.name} - ${tool.description}`);
      });
      console.log('');

      // Verify expected tools are present - Sprint 7.4: 12 tools (Block Kit added, thread collection removed)
      const toolNames = tools.tools.map((t) => t.name);
      const expectedTools = [
        // Messaging (6) - includes Block Kit tools
        'post_message',
        'update_message',
        'delete_message',
        'react_to_message',
        'post_message_blocks',
        'update_message_blocks',
        // Data (4) - Phase 6.3
        'get_thread_replies',
        'list_workspace_channels',
        'list_workspace_users',
        'get_user_profile',
        // Enhanced Search (2)
        'search_messages',
        'search_files',
        // Thread Collection removed - users can use search_messages with custom queries
      ];

      const missingTools = expectedTools.filter((tool) => !toolNames.includes(tool));
      const extraInfo: any = {
        totalTools: tools.tools.length,
        toolNames: toolNames,
        expectedTools: expectedTools,
      };

      if (missingTools.length > 0) {
        extraInfo.missingTools = missingTools;
        this.results.push({
          name: 'Tool Listing Completeness',
          status: 'FAIL',
          duration: Date.now() - startTime,
          message: `Missing expected tools: ${missingTools.join(', ')}`,
          details: extraInfo,
        });
      } else {
        this.results.push({
          name: 'Tool Listing Completeness',
          status: 'PASS',
          duration: Date.now() - startTime,
          message: 'All expected tools are present',
          details: extraInfo,
        });
      }
    } catch (error) {
      this.results.push({
        name: 'Tool Listing',
        status: 'FAIL',
        duration: Date.now() - startTime,
        message: `Tool listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      });
    }
  }

  private async testToolCategories(): Promise<void> {
    const startTime = Date.now();

    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }

      const tools = await this.client.listTools();
      const toolsByExpectedCategory = {
        messaging: ['post_message', 'update_message', 'delete_message', 'react_to_message', 'post_message_blocks', 'update_message_blocks'],
        data: [
          'get_thread_replies',
          'list_workspace_channels',
          'list_workspace_users',
          'get_user_profile',
        ],
        search: ['search_messages', 'search_files'],
      };

      const toolNames = tools.tools.map((t) => t.name);
      const categorizedTools: Record<string, string[]> = {};
      let uncategorizedTools: string[] = [];

      // Categorize existing tools
      for (const [category, expectedTools] of Object.entries(toolsByExpectedCategory)) {
        const foundTools = expectedTools.filter((tool) => toolNames.includes(tool));
        if (foundTools.length > 0) {
          categorizedTools[category] = foundTools;
        }
      }

      // Find uncategorized tools
      const allCategorizedToolNames = Object.values(toolsByExpectedCategory).flat();
      uncategorizedTools = toolNames.filter((tool) => !allCategorizedToolNames.includes(tool));

      console.log('🏷️  Tool Categories:');
      for (const [category, tools] of Object.entries(categorizedTools)) {
        console.log(`   ${category}: ${tools.length} tools (${tools.join(', ')})`);
      }
      if (uncategorizedTools.length > 0) {
        console.log(
          `   uncategorized: ${uncategorizedTools.length} tools (${uncategorizedTools.join(', ')})`
        );
      }
      console.log('');

      this.results.push({
        name: 'Tool Categorization',
        status: 'PASS',
        duration: Date.now() - startTime,
        message: `Tools successfully categorized into ${Object.keys(categorizedTools).length} categories`,
        details: {
          categorizedTools,
          uncategorizedTools,
          totalCategories: Object.keys(categorizedTools).length,
        },
      });
    } catch (error) {
      this.results.push({
        name: 'Tool Categorization',
        status: 'FAIL',
        duration: Date.now() - startTime,
        message: `Tool categorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      });
    }
  }

  private async validateCriticalTools(): Promise<void> {
    const startTime = Date.now();

    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }

      // Test that critical tools have proper schemas
      const tools = await this.client.listTools();
      const criticalTools = [
        'post_message',
        'react_to_message',
        'get_thread_replies',
        'list_workspace_channels',
        'list_workspace_users',
        'search_messages',
      ];

      const toolSchemaValidation: any = {};
      let allValid = true;

      for (const toolName of criticalTools) {
        const tool = tools.tools.find((t) => t.name === toolName);
        if (!tool) {
          toolSchemaValidation[toolName] = { present: false };
          allValid = false;
          continue;
        }

        const validation = {
          present: true,
          hasDescription: !!tool.description && tool.description.length > 0,
          hasInputSchema: !!tool.inputSchema,
          hasProperties: !!tool.inputSchema?.properties,
          propertyCount: tool.inputSchema?.properties
            ? Object.keys(tool.inputSchema.properties).length
            : 0,
          hasRequired:
            Array.isArray(tool.inputSchema?.required) && tool.inputSchema.required.length > 0,
        };

        toolSchemaValidation[toolName] = validation;

        if (!validation.hasDescription || !validation.hasInputSchema || !validation.hasProperties) {
          allValid = false;
        }
      }

      this.results.push({
        name: 'Critical Tool Schema Validation',
        status: allValid ? 'PASS' : 'FAIL',
        duration: Date.now() - startTime,
        message: allValid
          ? 'All critical tools have proper schemas'
          : 'Some critical tools have schema issues',
        details: toolSchemaValidation,
      });
    } catch (error) {
      this.results.push({
        name: 'Critical Tool Schema Validation',
        status: 'FAIL',
        duration: Date.now() - startTime,
        message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error,
      });
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.client && this.transport) {
        await this.client.close();
      }
      if (this.serverProcess) {
        this.serverProcess.kill();
        await new Promise((resolve) => {
          this.serverProcess.on('exit', resolve);
          setTimeout(resolve, 2000); // Force cleanup after 2s
        });
      }
    } catch (error) {
      console.log('Warning: Cleanup error:', error);
    }
  }

  private printResults(): void {
    console.log('📊 Test Results Summary:\n');

    const totalTests = this.results.length;
    const passedTests = this.results.filter((r) => r.status === 'PASS').length;
    const failedTests = this.results.filter((r) => r.status === 'FAIL').length;
    const skippedTests = this.results.filter((r) => r.status === 'SKIP').length;

    this.results.forEach((result) => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      const duration = `(${result.duration}ms)`;
      console.log(`${statusIcon} ${result.name} ${duration}`);
      if (result.message) {
        console.log(`   ${result.message}`);
      }
      if (result.status === 'FAIL' && result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2).substring(0, 200)}...`);
      }
      console.log('');
    });

    console.log(`Summary: ${passedTests}/${totalTests} tests passed`);
    if (failedTests > 0) console.log(`❌ ${failedTests} tests failed`);
    if (skippedTests > 0) console.log(`⏭️ ${skippedTests} tests skipped`);

    console.log(
      `\n🏁 Connection and Tool Listing Test Suite ${failedTests === 0 ? 'PASSED' : 'FAILED'}`
    );

    if (failedTests > 0) {
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new ConnectionTestSuite();
  testSuite.runAllTests().catch((error) => {
    console.error('Test suite failed with error:', error);
    process.exit(1);
  });
}
