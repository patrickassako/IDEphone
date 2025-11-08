/**
 * AI Provider Interface
 * Abstract interface that all AI providers must implement
 */

import { AIConfig, AIContext, AIResponse, StreamCallback } from '../types';

export interface AIProvider {
  /**
   * Provider name
   */
  readonly name: string;

  /**
   * Initialize the provider with config
   */
  initialize(config: AIConfig): void;

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Generate code/response based on prompt and context
   */
  generateResponse(
    prompt: string,
    context: AIContext,
    systemPrompt?: string
  ): Promise<AIResponse>;

  /**
   * Stream response for real-time feedback
   */
  streamResponse(
    prompt: string,
    context: AIContext,
    onChunk: StreamCallback,
    systemPrompt?: string
  ): Promise<void>;

  /**
   * Validate API key
   */
  validateApiKey(apiKey: string): Promise<boolean>;
}
