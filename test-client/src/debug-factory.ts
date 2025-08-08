/**
 * Debug tool factory to check workflow tools registration
 */

import { EnhancedToolFactory } from '../../src/tools/factory.js';

async function debugFactory(): Promise<void> {
  console.log('🔧 Debug Tool Factory Registration');
  console.log('====================================');

  try {
    const factory = new EnhancedToolFactory();
    
    console.log('📊 Factory Stats:');
    const stats = factory.getStats();
    console.log(`  Total Tools: ${stats.instances}`);
    console.log(`  Categories: ${JSON.stringify(stats.categoryCounts, null, 2)}`);
    
    console.log('\n🛠️ Registered Tool Names:');
    const toolNames = factory.getRegisteredTools();
    toolNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
    
    console.log('\n🔍 All Tool Instances:');
    const instances = factory.getAllToolInstances();
    instances.forEach((instance, index) => {
      const def = instance.getDefinition();
      console.log(`  ${index + 1}. ${def.name} (${def.category || 'no-category'})`);
    });
    
    console.log(`\n✅ Factory debug completed - ${instances.length} tools found`);
    
  } catch (error) {
    console.error('❌ Factory debug failed:', error);
  }
}

// Run debug if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugFactory().catch(error => {
    console.error('Debug failed:', error);
    process.exit(1);
  });
}

export { debugFactory };