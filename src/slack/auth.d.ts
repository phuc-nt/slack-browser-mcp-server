/**
 * Slack Authentication Module
 * Handles browser token extraction and validation
 */
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
export declare class SlackAuth {
    private tokens;
    /**
     * Extract tokens from environment variables
     * In a real browser implementation, this would extract from localStorage and cookies
     */
    extractTokensFromEnvironment(): SlackTokens | null;
    /**
     * Validate tokens with Slack API
     */
    validateTokens(tokens: SlackTokens): Promise<SlackAuthResult>;
    /**
     * Get authenticated tokens
     */
    getTokens(): SlackTokens | null;
    /**
     * Full authentication flow
     */
    authenticate(): Promise<SlackAuthResult>;
}
//# sourceMappingURL=auth.d.ts.map