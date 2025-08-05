/**
 * Slack Authentication Module
 * Handles browser token extraction and validation
 */

import { SlackAuthTestResponse } from './types.js';

export interface SlackTokens {
  xoxc: string;
  xoxd: string;
  teamDomain: string;
}

export interface SlackAuthResult {
  success: boolean;
  tokens?: SlackTokens;
  user?: {
    id: string;
    name: string;
    team: string;
  };
  error?: string;
}

export class SlackAuth {
  private tokens: SlackTokens | null = null;

  /**
   * Extract tokens from environment variables
   * In a real browser implementation, this would extract from localStorage and cookies
   */
  extractTokensFromEnvironment(): SlackTokens | null {
    const xoxc = process.env.SLACK_XOXC_TOKEN;
    const xoxd = process.env.SLACK_XOXD_TOKEN;
    const teamDomain = process.env.SLACK_TEAM_DOMAIN;

    if (!xoxc || !xoxd || !teamDomain) {
      return null;
    }

    // Basic validation
    if (!xoxc.startsWith('xoxc-') || !xoxd.startsWith('xoxd-')) {
      throw new Error('Invalid token format');
    }

    return {
      xoxc,
      xoxd,
      teamDomain,
    };
  }

  /**
   * Validate tokens with Slack API
   */
  async validateTokens(tokens: SlackTokens): Promise<SlackAuthResult> {
    try {
      // Use auth.test API to validate tokens
      const response = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.xoxc}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: `d=${tokens.xoxd}`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      const data = (await response.json()) as SlackAuthTestResponse;

      if (!data.ok) {
        return {
          success: false,
          error: `Slack API error: ${data.error || 'Unknown error'}`,
        };
      }

      this.tokens = tokens;

      return {
        success: true,
        tokens,
        user: {
          id: data.user_id,
          name: data.user,
          team: data.team,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Authentication failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Get authenticated tokens
   */
  getTokens(): SlackTokens | null {
    return this.tokens;
  }

  /**
   * Full authentication flow
   */
  async authenticate(): Promise<SlackAuthResult> {
    // Extract tokens from environment
    const tokens = this.extractTokensFromEnvironment();

    if (!tokens) {
      return {
        success: false,
        error: 'Slack tokens not found in environment variables',
      };
    }

    // Validate with Slack API
    return await this.validateTokens(tokens);
  }
}
