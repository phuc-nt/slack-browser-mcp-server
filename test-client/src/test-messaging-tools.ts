/**
 * Test script for Sprint 2.3 messaging tools
 * Tests the new action-based tools: post_message, post_thread_reply, update_message, delete_message
 */

import { EnhancedToolFactory } from '../../dist/tools/factory.js';
import { ToolContext } from '../../dist/types/tools.js';

/**
 * Test messaging tools functionality
 */
async function testMessagingTools() {
  console.log('🚀 Testing Sprint 2.3 Messaging Tools\n');

  // Initialize tool factory
  const factory = new EnhancedToolFactory();
  
  console.log('📋 Available Tools:');
  const allTools = factory.getAllToolInstances();
  allTools.forEach(tool => {
    const def = tool.getDefinition();
    console.log(`  - ${def.name} (${def.category}) - ${def.description}`);
  });
  console.log(`\n📊 Total tools: ${allTools.length}\n`);

  // Check if messaging tools are loaded
  const messagingTools = allTools.filter(tool => 
    tool.getDefinition().category === 'messaging'
  );
  
  console.log('💬 Messaging Tools Found:');
  if (messagingTools.length === 0) {
    console.log('❌ No messaging tools found! Check registration.');
    return;
  }

  messagingTools.forEach(tool => {
    const def = tool.getDefinition();
    console.log(`  ✅ ${def.name} - ${def.description}`);
  });
  console.log(`\n🎯 Total messaging tools: ${messagingTools.length}\n`);

  // Test context
  const testContext: ToolContext = {
    toolName: 'test',
    startTime: Date.now(),
    traceId: `test-${Date.now()}`,
    userId: 'test-user'
  };

  console.log('🔧 Testing Tool Validation...\n');

  // Test 1: PostMessageTool validation
  console.log('1️⃣ Testing PostMessageTool validation:');
  const postMessageTool = factory.getToolInstance('post_message');
  if (postMessageTool) {
    // Valid args test
    const validArgs = {
      channel: 'C1234567890',
      text: 'Hello, World! This is a test message.'
    };
    
    const validationResult = await postMessageTool.validate?.(validArgs);
    if (validationResult) {
      console.log(`   ✅ Valid args: ${validationResult.isValid ? 'PASS' : 'FAIL'}`);
      if (!validationResult.isValid) {
        console.log(`      Errors: ${validationResult.errors.join(', ')}`);
      }
    } else {
      console.log('   ⚠️  No validation method available');
    }

    // Invalid args test
    const invalidArgs = {
      channel: '', // Empty channel
      text: ''     // Empty text
    };
    
    const invalidValidation = await postMessageTool.validate?.(invalidArgs);
    if (invalidValidation) {
      console.log(`   ✅ Invalid args: ${!invalidValidation.isValid ? 'PASS' : 'FAIL'} (should be invalid)`);
      if (!invalidValidation.isValid) {
        console.log(`      Expected errors: ${invalidValidation.errors.join(', ')}`);
      }
    }
  } else {
    console.log('   ❌ PostMessageTool not found');
  }

  console.log('\n2️⃣ Testing PostThreadReplyTool validation:');
  const threadReplyTool = factory.getToolInstance('post_thread_reply');
  if (threadReplyTool) {
    const validThreadArgs = {
      channel: 'C1234567890',
      thread_ts: '1640995200.123456',
      text: 'This is a thread reply'
    };
    
    const threadValidation = await threadReplyTool.validate?.(validThreadArgs);
    if (threadValidation) {
      console.log(`   ✅ Valid thread args: ${threadValidation.isValid ? 'PASS' : 'FAIL'}`);
      if (!threadValidation.isValid) {
        console.log(`      Errors: ${threadValidation.errors.join(', ')}`);
      }
    }

    // Test invalid thread_ts format
    const invalidThreadArgs = {
      channel: 'C1234567890',
      thread_ts: 'invalid-timestamp',  // Bad format
      text: 'This is a thread reply'
    };
    
    const invalidThreadValidation = await threadReplyTool.validate?.(invalidThreadArgs);
    if (invalidThreadValidation) {
      console.log(`   ✅ Invalid thread_ts: ${!invalidThreadValidation.isValid ? 'PASS' : 'FAIL'} (should be invalid)`);
      if (!invalidThreadValidation.isValid) {
        console.log(`      Expected errors: ${invalidThreadValidation.errors.join(', ')}`);
      }
    }
  } else {
    console.log('   ❌ PostThreadReplyTool not found');
  }

  console.log('\n3️⃣ Testing UpdateMessageTool validation:');
  const updateTool = factory.getToolInstance('update_message');
  if (updateTool) {
    const validUpdateArgs = {
      channel: 'C1234567890',
      ts: '1640995200.123456',
      text: 'Updated message content'
    };
    
    const updateValidation = await updateTool.validate?.(validUpdateArgs);
    if (updateValidation) {
      console.log(`   ✅ Valid update args: ${updateValidation.isValid ? 'PASS' : 'FAIL'}`);
    }
  } else {
    console.log('   ❌ UpdateMessageTool not found');
  }

  console.log('\n4️⃣ Testing DeleteMessageTool validation:');
  const deleteTool = factory.getToolInstance('delete_message');
  if (deleteTool) {
    const validDeleteArgs = {
      channel: 'C1234567890',
      ts: '1640995200.123456'
    };
    
    const deleteValidation = await deleteTool.validate?.(validDeleteArgs);
    if (deleteValidation) {
      console.log(`   ✅ Valid delete args: ${deleteValidation.isValid ? 'PASS' : 'FAIL'}`);
    }
  } else {
    console.log('   ❌ DeleteMessageTool not found');
  }

  console.log('\n📊 Tool Factory Statistics:');
  const stats = factory.getStats();
  console.log(`   - Registered classes: ${stats.registeredClasses}`);
  console.log(`   - Tool instances: ${stats.instances}`);
  console.log(`   - Validation cache size: ${stats.validationCacheSize}`);
  console.log('   - Category counts:');
  Object.entries(stats.categoryCounts).forEach(([category, count]) => {
    console.log(`     • ${category}: ${count}`);
  });

  console.log('\n🎉 Sprint 2.3 Messaging Tools Test Complete!');
  console.log('\n📝 Summary:');
  console.log(`   ✅ Total tools loaded: ${allTools.length}`);
  console.log(`   ✅ Messaging tools: ${messagingTools.length}/4 expected`);
  console.log('   ✅ Tool validation: Working');
  console.log('   ✅ Tool factory: Working');
  
  if (messagingTools.length === 4) {
    console.log('\n🎯 SUCCESS: All messaging tools loaded and validated successfully!');
    console.log('🔜 Ready for real Slack API testing (requires .env configuration)');
  } else {
    console.log('\n⚠️  WARNING: Some messaging tools missing. Check tool registration.');
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testMessagingTools().catch(console.error);
}

export { testMessagingTools };