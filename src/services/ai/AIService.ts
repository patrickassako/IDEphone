/**
 * AI Service
 * Main orchestrator for AI functionality in IDEphone
 * Singleton service that manages AI providers and requests
 */

import { AIProvider } from './providers/AIProvider';
import { ClaudeProvider } from './providers/ClaudeProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { AIConfig, AIContext, AIResponse, AIProviderType, StreamCallback } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AI_PROVIDER: 'ai_provider',
  AI_API_KEY: 'ai_api_key',
  AI_MODEL: 'ai_model',
  AI_ENABLED: 'ai_enabled',
};

class AIServiceClass {
  private provider: AIProvider | null = null;
  private currentProviderType: AIProviderType = 'claude';
  private isInitialized: boolean = false;

  /**
   * Initialize AI service with saved configuration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load saved configuration
      const providerType = await AsyncStorage.getItem(STORAGE_KEYS.AI_PROVIDER);
      const apiKey = await AsyncStorage.getItem(STORAGE_KEYS.AI_API_KEY);
      const model = await AsyncStorage.getItem(STORAGE_KEYS.AI_MODEL);

      if (providerType && apiKey) {
        this.currentProviderType = providerType as AIProviderType;
        this.provider = this.createProvider(this.currentProviderType);

        this.provider.initialize({
          provider: this.currentProviderType,
          apiKey,
          model: model || undefined,
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
    }
  }

  /**
   * Check if AI is configured and ready to use
   */
  isConfigured(): boolean {
    return this.provider !== null && this.provider.isConfigured();
  }

  /**
   * Check if AI is enabled
   */
  async isEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(STORAGE_KEYS.AI_ENABLED);
    return enabled === 'true';
  }

  /**
   * Enable or disable AI features
   */
  async setEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AI_ENABLED, enabled.toString());
  }

  /**
   * Get current provider type
   */
  getProviderType(): AIProviderType {
    return this.currentProviderType;
  }

  /**
   * Configure AI provider
   */
  async configure(config: AIConfig): Promise<void> {
    // Save configuration
    await AsyncStorage.setItem(STORAGE_KEYS.AI_PROVIDER, config.provider);
    await AsyncStorage.setItem(STORAGE_KEYS.AI_API_KEY, config.apiKey);
    if (config.model) {
      await AsyncStorage.setItem(STORAGE_KEYS.AI_MODEL, config.model);
    }

    // Create and initialize provider
    this.currentProviderType = config.provider;
    this.provider = this.createProvider(config.provider);
    this.provider.initialize(config);
  }

  /**
   * Validate API key for a provider
   */
  async validateApiKey(apiKey: string, providerType?: AIProviderType): Promise<boolean> {
    const provider = this.createProvider(providerType || this.currentProviderType);
    return provider.validateApiKey(apiKey);
  }

  /**
   * Generate AI response
   */
  async generateResponse(
    prompt: string,
    context: AIContext,
    systemPrompt?: string
  ): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('AI not configured. Please set up your API key in settings.');
    }

    return this.provider!.generateResponse(prompt, context, systemPrompt);
  }

  /**
   * Stream AI response
   */
  async streamResponse(
    prompt: string,
    context: AIContext,
    onChunk: StreamCallback,
    systemPrompt?: string
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('AI not configured. Please set up your API key in settings.');
    }

    return this.provider!.streamResponse(prompt, context, onChunk, systemPrompt);
  }

  /**
   * Quick actions for common tasks
   */
  async fixCode(code: string, context: AIContext): Promise<AIResponse> {
    const prompt = `Fix any bugs or issues in this code:\n\n${code}`;
    return this.generateResponse(prompt, context);
  }

  async explainCode(code: string, context: AIContext): Promise<AIResponse> {
    const prompt = `Explain what this code does in simple terms:\n\n${code}`;
    return this.generateResponse(prompt, context);
  }

  async refactorCode(code: string, context: AIContext): Promise<AIResponse> {
    const prompt = `Refactor this code to improve readability and performance:\n\n${code}`;
    return this.generateResponse(prompt, context);
  }

  async addComments(code: string, context: AIContext): Promise<AIResponse> {
    const prompt = `Add clear, concise comments to this code:\n\n${code}`;
    return this.generateResponse(prompt, context);
  }

  async generateTests(code: string, context: AIContext): Promise<AIResponse> {
    const prompt = `Generate unit tests for this code:\n\n${code}`;
    return this.generateResponse(prompt, context);
  }

  async optimizeCode(code: string, context: AIContext): Promise<AIResponse> {
    const prompt = `Optimize this code for better performance:\n\n${code}`;
    return this.generateResponse(prompt, context);
  }

  /**
   * Clear API key and configuration
   */
  async clearConfiguration(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AI_PROVIDER,
      STORAGE_KEYS.AI_API_KEY,
      STORAGE_KEYS.AI_MODEL,
    ]);
    this.provider = null;
  }

  /**
   * Create provider instance based on type
   */
  private createProvider(type: AIProviderType): AIProvider {
    switch (type) {
      case 'claude':
        return new ClaudeProvider();
      case 'openai':
        // TODO: Implement OpenAI provider
        throw new Error('OpenAI provider not yet implemented');
      case 'gemini':
        return new GeminiProvider();
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
}

// Export singleton instance
export const AIService = new AIServiceClass();
