/**
 * Test configuration with real Slack data for comprehensive testing
 */

export interface TestConfig {
  channels: {
    public: {
      id: string;
      name: string;
      description: string;
    };
    private?: {
      id: string;
      name: string;
      description: string;
    };
  };
  users: {
    test_user: {
      id: string;
      name: string;
      email?: string;
    };
    bot_user: {
      id: string;
      name: string;
    };
  };
  messages: {
    sample_thread: {
      channel_id: string;
      thread_ts: string;
      description: string;
    };
    search_queries: {
      simple: string;
      advanced: string;
      channel_specific: string;
    };
  };
  test_limits: {
    max_channels: number;
    max_users: number;
    max_messages: number;
    timeout_ms: number;
  };
}

/**
 * Default test configuration - UPDATE THESE WITH YOUR REAL SLACK DATA
 * 
 * Instructions:
 * 1. Replace the placeholder values with real data from your Slack workspace
 * 2. Ensure the channels exist and are accessible with your token
 * 3. Use real thread timestamps and user IDs for accurate testing
 * 4. Test queries should return actual results in your workspace
 */
export const TEST_CONFIG: TestConfig = {
  channels: {
    public: {
      id: process.env.TEST_CHANNEL_ID || "C099184U2TU", // Use real test channel from .env
      name: process.env.TEST_CHANNEL_NAME || "mcp_test", // Use real channel name from .env
      description: "Real test channel for MCP integration testing"
    },
    // Uncomment and configure if you want to test private channels
    // private: {
    //   id: "C0987654321", // Replace with real private channel ID
    //   name: "private-test", // Replace with real private channel name
    //   description: "Private channel for testing"
    // }
  },
  users: {
    test_user: {
      id: process.env.TEST_USER_ID || "U07UZEWG7A9", // Use real user from workspace
      name: "testuser", 
      email: "test@example.com"
    },
    bot_user: {
      id: "U0987654321", // Bot user placeholder
      name: "testbot"
    }
  },
  messages: {
    sample_thread: {
      channel_id: process.env.TEST_CHANNEL_ID || "C099184U2TU", // Use same channel as test channel
      thread_ts: process.env.TEST_THREAD_TS || "1234567890.123456", // Will override from env if available
      description: "Sample thread for testing replies functionality"
    },
    search_queries: {
      simple: "test", // Simple search term likely to return results
      advanced: "in:#mcp_test", // Search in test channel  
      channel_specific: "mcp" // Search term relevant to test channel
    }
  },
  test_limits: {
    max_channels: 50, // Maximum number of channels to retrieve in tests
    max_users: 100, // Maximum number of users to retrieve in tests  
    max_messages: 20, // Maximum number of messages to retrieve in tests
    timeout_ms: 30000 // Test timeout in milliseconds
  }
};

/**
 * Validation helper to check if test config has been customized
 */
export function validateTestConfig(): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for placeholder values that need to be updated
  if (TEST_CONFIG.channels.public.id === "C1234567890") {
    issues.push("Please update channels.public.id with a real channel ID");
  }
  
  if (TEST_CONFIG.users.test_user.id === "U1234567890") {
    issues.push("Please update users.test_user.id with a real user ID");
  }
  
  if (TEST_CONFIG.messages.sample_thread.thread_ts === "1234567890.123456") {
    issues.push("Please update messages.sample_thread.thread_ts with a real thread timestamp");
  }
  
  // Check if environment variables are set for tokens
  if (!process.env.SLACK_XOXC_TOKEN || process.env.SLACK_XOXC_TOKEN.startsWith('xoxc-your-token')) {
    issues.push("Please set SLACK_XOXC_TOKEN environment variable with real token");
  }
  
  if (!process.env.SLACK_XOXD_TOKEN || process.env.SLACK_XOXD_TOKEN.startsWith('xoxd-your-token')) {
    issues.push("Please set SLACK_XOXD_TOKEN environment variable with real token");
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Helper to get environment-specific overrides
 * Allows runtime configuration without changing the source code
 */
export function getTestConfigWithEnvOverrides(): TestConfig {
  const config = { ...TEST_CONFIG };
  
  // Allow environment variables to override test config
  if (process.env.TEST_CHANNEL_ID) {
    config.channels.public.id = process.env.TEST_CHANNEL_ID;
  }
  
  if (process.env.TEST_USER_ID) {
    config.users.test_user.id = process.env.TEST_USER_ID;
  }
  
  if (process.env.TEST_THREAD_TS) {
    config.messages.sample_thread.thread_ts = process.env.TEST_THREAD_TS;
  }
  
  return config;
}