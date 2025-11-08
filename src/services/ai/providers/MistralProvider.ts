/**
 * Mistral AI Provider
 * Implements Mistral API integration
 * Supports: Codestral (specialized for code), Mixtral, Mistral Small/Medium/Large
 */

import { AIProvider } from './AIProvider';
import { AIConfig, AIContext, AIResponse, StreamCallback, CodeBlock } from '../types';

export class MistralProvider implements AIProvider {
  readonly name = 'Mistral';
  private apiKey: string = '';
  private model: string = 'codestral-latest';
  private maxTokens: number = 4096;
  private temperature: number = 0.7;
  private baseUrl: string = 'https://api.mistral.ai/v1';

  initialize(config: AIConfig): void {
    this.apiKey = config.apiKey;
    this.model = config.model || this.model;
    this.maxTokens = config.maxTokens || this.maxTokens;
    this.temperature = config.temperature ?? this.temperature;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    console.log('[Mistral] Validating API key...');
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        }),
      });

      console.log('[Mistral] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Mistral] API error:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          const errorMessage = errorData.message || `API error: ${response.status}`;

          if (response.status === 401) {
            throw new Error('Invalid Mistral API key. Get one at console.mistral.ai');
          } else if (response.status === 429) {
            throw new Error('Mistral rate limit exceeded. Wait a moment and try again.');
          } else if (errorMessage.includes('quota')) {
            throw new Error('Mistral quota exceeded. Upgrade your plan at console.mistral.ai');
          }

          throw new Error(`Mistral: ${errorMessage}`);
        } catch (parseError) {
          if (response.status === 401) {
            throw new Error('Invalid Mistral API key');
          }
          throw new Error(`Mistral API error (${response.status})`);
        }
      }

      console.log('[Mistral] API key is valid!');
      return true;
    } catch (error: any) {
      console.error('[Mistral] Validation failed:', error);

      if (error.message) {
        throw error;
      }

      throw new Error('Network error. Please check your internet connection and try again.');
    }
  }

  async generateResponse(
    prompt: string,
    context: AIContext,
    systemPrompt?: string
  ): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('Mistral provider not configured. Please set API key.');
    }

    const messages = this.buildMessages(prompt, context, systemPrompt);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Mistral API error: ${response.status} - ${errorData.message || 'Unknown error'}`
        );
      }

      const data = await response.json();

      return this.parseResponse(data);
    } catch (error) {
      console.error('Mistral API request failed:', error);
      throw error;
    }
  }

  async streamResponse(
    prompt: string,
    context: AIContext,
    onChunk: StreamCallback,
    systemPrompt?: string
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Mistral provider not configured. Please set API key.');
    }

    const messages = this.buildMessages(prompt, context, systemPrompt);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onChunk({ content: '', done: true });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk({ content, done: false });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Mistral streaming failed:', error);
      throw error;
    }
  }

  private buildMessages(prompt: string, context: AIContext, systemPrompt?: string) {
    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt
    const defaultSystemPrompt = `You are Codestral, an expert coding assistant specialized in software development.

Your role is to help developers write, fix, and improve code in IDEphone mobile IDE.

When providing code:
- Return ONLY the code to insert/replace, no explanations unless asked
- Use proper indentation and formatting
- Match the existing code style
- For modifications, provide the complete replacement code
- Wrap code in markdown code blocks with language specified

Be concise but accurate. Focus on working, production-ready code.`;

    messages.push({
      role: 'system',
      content: systemPrompt || defaultSystemPrompt,
    });

    // Add conversation history if exists
    if (context.messages && context.messages.length > 0) {
      context.messages.forEach((msg) => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      });
    }

    // Add current prompt
    messages.push({
      role: 'user',
      content: prompt,
    });

    return messages;
  }

  private parseResponse(data: any): AIResponse {
    const content = data.choices?.[0]?.message?.content || '';
    const codeBlocks = this.extractCodeBlocks(content);

    return {
      content,
      codeBlocks,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
    };
  }

  private extractCodeBlocks(content: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim(),
      });
    }

    return codeBlocks;
  }
}
