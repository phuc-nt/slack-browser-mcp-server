import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testConnection() {
  console.log("🔌 Testing Slack MCP Server Connection...\n");

  const client = new Client({ 
    name: "slack-mcp-test-client", 
    version: "1.0.0" 
  });

  // Path to our Slack MCP Server
  const serverPath = path.resolve(__dirname, "../../dist/index.js");
  console.log(`📍 Server path: ${serverPath}`);

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: {
      ...process.env,
      LOG_LEVEL: "warn" // Reduce server logs for cleaner test output
    } as Record<string, string>
  });

  try {
    console.log("⏳ Connecting to MCP server...");
    await client.connect(transport);
    console.log("✅ Successfully connected to Slack MCP Server!");

    // Test server capabilities
    console.log("\n📋 Server Capabilities:");
    const serverInfo = await client.getServerCapabilities();
    console.log("Server capabilities:", JSON.stringify(serverInfo, null, 2));

    // List available tools
    console.log("\n🛠️  Available Tools:");
    const toolsResult = await client.listTools();
    console.log(`Total: ${toolsResult.tools.length} tools`);
    
    toolsResult.tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description || 'No description'}`);
    });

    // List available resources
    console.log("\n📁 Available Resources:");
    try {
      const resourcesResult = await client.listResources();
      console.log(`Total: ${resourcesResult.resources.length} resources`);
      
      if (resourcesResult.resources.length > 0) {
        resourcesResult.resources.forEach((resource: any, index: number) => {
          console.log(`  ${index + 1}. ${resource.uri || resource.uriPattern} - ${resource.description || 'No description'}`);
        });
      } else {
        console.log("  (No resources available - expected for Phase 1)");
      }
    } catch (error) {
      console.log("  (Resources not implemented yet - expected for Phase 1)");
    }

    console.log("\n✅ Connection test completed successfully!");

  } catch (error) {
    console.error("❌ Connection test failed:");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    try {
      await client.close();
      console.log("\n🔌 Connection closed");
    } catch (error) {
      console.error("Warning: Error closing connection:", error);
    }
  }
}

// Run the test
testConnection().catch(error => {
  console.error("❌ Unhandled error in connection test:", error);
  process.exit(1);
});