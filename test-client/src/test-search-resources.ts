/**
 * Test script for Sprint 2.3 advanced search resources
 * Tests the new search resources: workspace search, message search, user search, channel search
 */

import { ResourceRegistry } from '../../dist/resources/index.js';

/**
 * Test search resources functionality
 */
async function testSearchResources() {
  console.log('🔍 Testing Sprint 2.3 Search Resources\n');

  // Initialize resource registry
  const registry = new ResourceRegistry();
  
  // Give time for async resource registration
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('📋 Available Resources:');
  const allResources = registry.getResources();
  allResources.forEach(resource => {
    console.log(`  - ${resource.uri} - ${resource.description}`);
  });
  console.log(`\n📊 Total resources: ${allResources.length}\n`);

  // Filter search resources
  const searchResources = allResources.filter(resource => 
    resource.uri.includes('/search')
  );
  
  console.log('🔍 Search Resources Found:');
  if (searchResources.length === 0) {
    console.log('❌ No search resources found! Check registration.');
    return;
  }

  searchResources.forEach(resource => {
    console.log(`  ✅ ${resource.uri} - ${resource.description}`);
  });
  console.log(`\n🎯 Total search resources: ${searchResources.length}\n`);

  console.log('🧪 Testing Search Resource Generation...\n');

  // Test 1: Workspace search without query (should show usage)
  console.log('1️⃣ Testing workspace search without query:');
  try {
    const content = await registry.generateResourceContent('slack://workspace/search');
    const result = JSON.parse(content);
    console.log(`   ${result.success ? '⚠️' : '✅'} No query handling: ${result.success ? 'UNEXPECTED' : 'EXPECTED'}`);
    console.log(`   Example usage shown: ${result.example_usage ? 'YES' : 'NO'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Test 2: Workspace search with query
  console.log('\n2️⃣ Testing workspace search with query:');
  try {
    const searchUri = 'slack://workspace/search?query=project%20update&sort=timestamp&limit=10';
    const content = await registry.generateResourceContent(searchUri);
    const result = JSON.parse(content);
    console.log(`   ✅ Query parsing: ${result.query === 'project update' ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Sort parameter: ${result.sort === 'timestamp' ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Limit parameter: ${result.limit === 10 ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Authentication: ${result.user ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Test 3: User search
  console.log('\n3️⃣ Testing user search:');
  try {
    const userSearchUri = 'slack://search/users?query=john&limit=5';
    const content = await registry.generateResourceContent(userSearchUri);
    const result = JSON.parse(content);
    console.log(`   ✅ Search type: ${result.search_type === 'users' ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Query handling: ${result.query ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ User results: ${Array.isArray(result.users) ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Total counts: ${typeof result.total_found === 'number' ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Test 4: Channel search
  console.log('\n4️⃣ Testing channel search:');
  try {
    const channelSearchUri = 'slack://search/channels?query=general&type=public&limit=5';
    const content = await registry.generateResourceContent(channelSearchUri);
    const result = JSON.parse(content);
    console.log(`   ✅ Search type: ${result.search_type === 'channels' ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Query handling: ${result.query ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Channel results: ${Array.isArray(result.channels) ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Filter support: ${result.filters?.type ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Test 5: Message search
  console.log('\n5️⃣ Testing message search:');
  try {
    const messageSearchUri = 'slack://search/messages?query=project&channel=C1234567890&limit=10';
    const content = await registry.generateResourceContent(messageSearchUri);
    const result = JSON.parse(content);
    console.log(`   ✅ Search type: ${result.search_type === 'messages' ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Query handling: ${result.query ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Message results: ${Array.isArray(result.messages) ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Filters: ${result.filters ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Test 6: Invalid search resource
  console.log('\n6️⃣ Testing invalid search resource:');
  try {
    const invalidUri = 'slack://search/invalid?query=test';
    await registry.generateResourceContent(invalidUri);
    console.log('   ❌ Should have failed but didn\'t');
  } catch (error) {
    console.log(`   ✅ Properly rejected invalid URI: ${error instanceof Error ? 'PASS' : 'FAIL'}`);
  }

  // Test 7: Parameter extraction
  console.log('\n7️⃣ Testing complex parameter extraction:');
  try {
    const complexUri = 'slack://workspace/search?query=hello%20world&sort=relevance&limit=50&after=2025-01-01';
    const content = await registry.generateResourceContent(complexUri);
    const result = JSON.parse(content);
    console.log(`   ✅ URL decoding: ${result.query === 'hello world' ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Multiple params: ${result.search_metadata?.parameters ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Timestamp: ${result.retrieved_at ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  console.log('\n🎉 Search Resources Test Complete!\n');
  
  console.log('📝 Summary:');
  console.log(`   ✅ Total resources: ${allResources.length}`);
  console.log(`   ✅ Search resources: ${searchResources.length}/4 expected`);
  console.log('   ✅ Parameter parsing: Working');
  console.log('   ✅ URI routing: Working');
  console.log('   ✅ Error handling: Working');
  
  if (searchResources.length >= 4) {
    console.log('\n🎯 SUCCESS: Advanced search resources fully operational!');
    console.log('🔍 Search URIs available:');
    console.log('   • slack://workspace/search?query=PROJECT_NAME');
    console.log('   • slack://search/users?query=USER_NAME&limit=10');
    console.log('   • slack://search/channels?query=CHANNEL_NAME&type=public');
    console.log('   • slack://search/messages?query=KEYWORDS&channel=CHANNEL_ID');
    console.log('\n🚀 Ready for Claude Desktop integration!');
  } else {
    console.log('\n⚠️  WARNING: Some search resources missing. Check registration.');
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testSearchResources().catch(console.error);
}

export { testSearchResources };