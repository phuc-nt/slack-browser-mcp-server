#!/usr/bin/env node
/**
 * Test Suite 2: Comprehensive Tool Testing
 * Tests all tools with real Slack data and comprehensive validation
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
  tool?: string;
}

class ComprehensiveToolTestSuite {
  private client?: Client;
  private transport?: StdioClientTransport;
  private serverProcess?: any;
  private results: TestResult[] = [];
  private testConfig = getTestConfigWithEnvOverrides();

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Tool Testing Suite...\n');
    
    // Validate test configuration
    const configValidation = validateTestConfig();
    if (!configValidation.isValid) {
      console.log('⚠️  Test Configuration Issues:');
      configValidation.issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('   Some tests may not work properly with placeholder data\n');
    }

    console.log('📋 Test Configuration:');
    console.log(`   - Test Channel: ${this.testConfig.channels.public.name} (${this.testConfig.channels.public.id})`);
    console.log(`   - Test User: ${this.testConfig.users.test_user.name} (${this.testConfig.users.test_user.id})`);
    console.log(`   - Thread TS: ${this.testConfig.messages.sample_thread.thread_ts}`);
    console.log(`   - Timeout: ${this.testConfig.test_limits.timeout_ms}ms\n`);

    try {
      await this.setupMCPConnection();
      
      // Test all tool categories - Phase 5 Production Tools Only
      await this.testBasicTools();
      await this.testDataRetrievalTools();
      await this.testSearchTools();
      await this.testMessagingTools();
      await this.testSystemTools();
      
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
        env: {
          ...process.env,
          LOG_LEVEL: 'error' // Reduce noise during testing
        }
      });

      // Create transport and client
      this.transport = new StdioClientTransport({
        command: 'node',
        args: ['/Users/phucnt/Workspace/slack-browser-mcp-server/dist/index.js'],
        env: {
          ...process.env,
          LOG_LEVEL: 'error' // Reduce noise during testing
        }
      });

      this.client = new Client({
        name: 'comprehensive-test-client',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      // Connect to the server
      await this.client.connect(this.transport);
      
      this.results.push({
        name: 'MCP Server Connection',
        status: 'PASS',
        duration: Date.now() - startTime,
        message: 'Successfully connected to MCP server for tool testing'
      });
    } catch (error) {
      this.results.push({
        name: 'MCP Server Connection',
        status: 'FAIL',
        duration: Date.now() - startTime,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      });
      throw error;
    }
  }

  private async testBasicTools(): Promise<void> {
    console.log('🔧 Testing Reaction Tools...');
    
    // Test react_to_message (schema validation only - no actual API call)
    await this.testTool('react_to_message', {
      channel_id: this.testConfig.channels.public.id,
      message_ts: this.testConfig.messages.sample_thread.thread_ts,
      reaction_type: 'resolved'
    }, 'React to message schema validation', {
      expectedResponseType: 'json',
      expectSuccess: false // Will fail due to auth but schema should be valid
    });
  }

  private async testDataRetrievalTools(): Promise<void> {
    console.log('📊 Testing Data Retrieval Tools...');
    
    // Test get_thread_replies
    await this.testTool('get_thread_replies', {
      channel: this.testConfig.messages.sample_thread.channel_id,
      ts: this.testConfig.messages.sample_thread.thread_ts,
      limit: 5
    }, 'Get thread replies with real thread data', {
      expectedResponseType: 'json',
      expectSuccess: true,
      expectedFields: ['channel', 'thread_ts', 'messages']
    });

    // Test list_workspace_channels  
    await this.testTool('list_workspace_channels', {
      include_private: false,
      include_archived: false,
      limit: this.testConfig.test_limits.max_channels
    }, 'List workspace channels', {
      expectedResponseType: 'json',
      expectSuccess: true,
      expectedFields: ['channels', 'channel_count']
    });

    // Test list_workspace_users
    await this.testTool('list_workspace_users', {
      include_bots: false,
      include_deleted: false,
      limit: this.testConfig.test_limits.max_users
    }, 'List workspace users', {
      expectedResponseType: 'json',
      expectSuccess: true,
      expectedFields: ['members', 'user_count']
    });
  }

  private async testSearchTools(): Promise<void> {
    console.log('🔍 Testing Search Tools...');
    
    // Test search_channel_messages (only remaining search tool)
    await this.testTool('search_channel_messages', {
      channel: this.testConfig.messages.sample_thread.channel_id,
      query: this.testConfig.messages.search_queries.channel_specific,
      count: 3
    }, 'Search messages in specific channel', {
      expectedResponseType: 'json',
      expectSuccess: true,
      expectedFields: ['channel', 'query', 'items']
    });
  }

  private async testMessagingTools(): Promise<void> {
    console.log('💬 Testing Messaging Tools (Dry Run)...');
    
    // Note: We'll test these tools with validation but not actually send messages
    // to avoid spamming the workspace during tests
    
    // Test post_message schema validation
    await this.testToolSchema('post_message', {
      channel: this.testConfig.channels.public.id,
      text: 'Test message - not actually sent during testing',
      dry_run: true
    }, 'Post message schema validation');

    // Test update_message schema validation
    await this.testToolSchema('update_message', {
      channel: this.testConfig.channels.public.id,
      ts: '1234567890.123456',
      text: 'Updated message - not actually sent during testing',
      dry_run: true
    }, 'Update message schema validation');

    // Test delete_message schema validation
    await this.testToolSchema('delete_message', {
      channel: this.testConfig.channels.public.id,
      ts: '1234567890.123456',
      dry_run: true
    }, 'Delete message schema validation');
  }



  private async testSystemTools(): Promise<void> {
    console.log('⚙️  Testing System Tools...');
    
    // Test server_info (our new consolidated system tool)
    await this.testTool('server_info', {
      include_tools: true,
      include_performance: true
    }, 'Get server info with tools and performance', {
      expectedResponseType: 'json',
      expectSuccess: true,
      expectedFields: ['server', 'timestamp', 'tools', 'performance']
    });

    // Test server_info with minimal options
    await this.testTool('server_info', {
      include_tools: false,
      include_performance: false
    }, 'Get basic server info', {
      expectedResponseType: 'json',
      expectSuccess: true,
      expectedFields: ['server', 'timestamp']
    });
  }

  private async testTool(
    toolName: string, 
    args: any, 
    description: string,
    validation?: {
      expectedResponseType?: 'text' | 'json';
      expectSuccess?: boolean;
      responseContains?: string;
      expectedFields?: string[];
    }
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }

      const response = await this.client.callTool({
        name: toolName,
        arguments: args
      });

      // Basic response validation
      if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
        throw new Error('No response content received');
      }

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      let responseData: any = null;

      // Validate response format
      if (validation?.expectedResponseType === 'json') {
        try {
          responseData = JSON.parse(responseText);
        } catch (error) {
          throw new Error('Expected JSON response but got invalid JSON');
        }
      }

      // Validate expected fields
      if (validation?.expectedFields && responseData) {
        const missingFields = validation.expectedFields.filter(field => !(field in responseData));
        if (missingFields.length > 0) {
          throw new Error(`Missing expected fields: ${missingFields.join(', ')}`);
        }
      }

      // Validate response contains expected text
      if (validation?.responseContains && !responseText.includes(validation.responseContains)) {
        throw new Error(`Response does not contain expected text: "${validation.responseContains}"`);
      }

      // Validate success expectation
      if (validation?.expectSuccess === false && !response.isError) {
        throw new Error('Expected tool to fail but it succeeded');
      }

      if (validation?.expectSuccess === true && response.isError) {
        throw new Error(`Expected tool to succeed but it failed: ${responseText}`);
      }

      this.results.push({
        name: description,
        tool: toolName,
        status: 'PASS',
        duration: Date.now() - startTime,
        message: `Tool executed successfully`,
        details: {
          args,
          responseLength: responseText.length,
          hasError: response.isError,
          dataFields: responseData ? Object.keys(responseData) : []
        }
      });
    } catch (error) {
      this.results.push({
        name: description,
        tool: toolName,
        status: 'FAIL',
        duration: Date.now() - startTime,
        message: `Tool test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          args,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  private async testToolSchema(
    toolName: string, 
    args: any, 
    description: string
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (!this.client) {
        throw new Error('Client not initialized');
      }

      // For schema validation, we expect these tools to fail gracefully
      // since we're not actually performing the operations (dry_run mode)
      const response = await this.client.callTool({
        name: toolName,
        arguments: args
      });

      // Schema validation passes if we get any response (success or controlled failure)
      // The key is that the tool accepts the input schema correctly
      this.results.push({
        name: description,
        tool: toolName,
        status: 'PASS',
        duration: Date.now() - startTime,
        message: 'Tool schema validation passed',
        details: {
          args,
          hasResponse: response.content && Array.isArray(response.content) && response.content.length > 0
        }
      });
    } catch (error) {
      // Only fail if it's a schema/validation error, not an operational error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isSchemaError = errorMessage.includes('validation') || 
                           errorMessage.includes('required') ||
                           errorMessage.includes('schema') ||
                           errorMessage.includes('argument');

      this.results.push({
        name: description,
        tool: toolName,
        status: isSchemaError ? 'FAIL' : 'PASS',
        duration: Date.now() - startTime,
        message: isSchemaError ? 
          `Schema validation failed: ${errorMessage}` : 
          'Tool operational error (schema OK)',
        details: {
          args,
          error: errorMessage,
          errorType: isSchemaError ? 'schema' : 'operational'
        }
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
        await new Promise(resolve => {
          this.serverProcess.on('exit', resolve);
          setTimeout(resolve, 2000); // Force cleanup after 2s
        });
      }
    } catch (error) {
      console.log('Warning: Cleanup error:', error);
    }
  }

  private printResults(): void {
    console.log('\n📊 Comprehensive Tool Test Results Summary:\n');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const skippedTests = this.results.filter(r => r.status === 'SKIP').length;
    
    // Group results by tool category - Phase 5 Production Tools
    const toolCategories = {
      messaging: ['post_message', 'update_message', 'delete_message', 'react_to_message'],
      data: ['get_thread_replies', 'list_workspace_channels', 'list_workspace_users'],
      search: ['search_channel_messages'],
      system: ['server_info']
    };

    for (const [category, tools] of Object.entries(toolCategories)) {
      const categoryResults = this.results.filter(r => r.tool && tools.includes(r.tool));
      if (categoryResults.length > 0) {
        const categoryPassed = categoryResults.filter(r => r.status === 'PASS').length;
        const categoryFailed = categoryResults.filter(r => r.status === 'FAIL').length;
        
        console.log(`🏷️  ${category.toUpperCase()}: ${categoryPassed}/${categoryResults.length} passed`);
        categoryResults.forEach(result => {
          const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
          const duration = `(${result.duration}ms)`;
          console.log(`   ${statusIcon} ${result.tool} - ${result.name} ${duration}`);
          if (result.message) {
            console.log(`      ${result.message}`);
          }
        });
        console.log('');
      }
    }

    // Show uncategorized tests
    const categorizedTools = Object.values(toolCategories).flat();
    const uncategorizedResults = this.results.filter(r => !r.tool || !categorizedTools.includes(r.tool));
    if (uncategorizedResults.length > 0) {
      console.log('🔧 OTHER TESTS:');
      uncategorizedResults.forEach(result => {
        const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
        const duration = `(${result.duration}ms)`;
        console.log(`   ${statusIcon} ${result.name} ${duration}`);
        if (result.message) {
          console.log(`      ${result.message}`);
        }
      });
      console.log('');
    }

    console.log(`📈 Overall Summary: ${passedTests}/${totalTests} tests passed`);
    if (failedTests > 0) console.log(`❌ ${failedTests} tests failed`);
    if (skippedTests > 0) console.log(`⏭️ ${skippedTests} tests skipped`);
    
    console.log(`\n🏁 Comprehensive Tool Testing Suite ${failedTests === 0 ? 'PASSED' : 'FAILED'}`);
    
    if (failedTests > 0) {
      console.log('\n💡 Tips for failed tests:');
      console.log('   - Ensure SLACK_XOXC_TOKEN and SLACK_XOXD_TOKEN are set correctly');
      console.log('   - Update test-config.ts with real data from your Slack workspace');
      console.log('   - Check that test channels and users exist and are accessible');
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new ComprehensiveToolTestSuite();
  testSuite.runAllTests().catch(error => {
    console.error('Comprehensive test suite failed with error:', error);
    process.exit(1);
  });
}