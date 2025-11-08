/**
 * Claude AI Provider
 * Implements Anthropic Claude API integration
 */

import { AIProvider } from './AIProvider';
import { AIConfig, AIContext, AIResponse, StreamCallback, CodeBlock } from '../types';

export class ClaudeProvider implements AIProvider {
  readonly name = 'Claude';
  private apiKey: string = '';
  private model: string = 'claude-3-5-sonnet-20241022';
  private maxTokens: number = 4096;
  private temperature: number = 0.7;
  private baseUrl: string = 'https://api.anthropic.com/v1';

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
    console.log('[Claude] Validating API key...');
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      console.log('[Claude] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Claude] API error:', errorText);

        // Try to parse error message
        try {
          const errorData = JSON.parse(errorText);
          const errorMessage = errorData.error?.message || `API error: ${response.status}`;

          // Show user-friendly error messages
          if (errorMessage.includes('credit balance is too low')) {
            throw new Error('Claude API key valid but no credits. Add credits at console.anthropic.com/settings/billing');
          } else if (response.status === 401) {
            throw new Error('Invalid Claude API key');
          }

          throw new Error(errorMessage);
        } catch (parseError) {
          if (response.status === 401) {
            throw new Error('Invalid Claude API key');
          }
          throw new Error(`Claude API error (${response.status})`);
        }
      }

      console.log('[Claude] API key is valid!');
      return true;
    } catch (error: any) {
      console.error('[Claude] Validation failed:', error);

      // Re-throw with a clear message
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
      throw new Error('Claude provider not configured. Please set API key.');
    }

    const messages = this.buildMessages(prompt, context);
    const system = systemPrompt || this.buildSystemPrompt(context);

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          system,
          messages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        );
      }

      const data = await response.json();

      return this.parseResponse(data);
    } catch (error) {
      console.error('Claude API request failed:', error);
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
      throw new Error('Claude provider not configured. Please set API key.');
    }

    const messages = this.buildMessages(prompt, context);
    const system = systemPrompt || this.buildSystemPrompt(context);

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          system,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
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
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                onChunk({ content: parsed.delta.text, done: false });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Claude streaming failed:', error);
      throw error;
    }
  }

  private buildMessages(prompt: string, context: AIContext) {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Add conversation history if exists
    if (context.messages && context.messages.length > 0) {
      context.messages.forEach((msg) => {
        if (msg.role !== 'system') {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          });
        }
      });
    }

    // Add current prompt
    messages.push({
      role: 'user',
      content: prompt,
    });

    return messages;
  }

  private buildSystemPrompt(context: AIContext): string {
    let systemPrompt = `You are an expert coding assistant integrated into IDEphone, a mobile code editor.

Your role is to help developers write, fix, and improve code directly in their mobile IDE.

`;

    // Add file context
    if (context.fileName) {
      systemPrompt += `Current file: ${context.fileName}\n`;
    }
    if (context.language) {
      systemPrompt += `Language: ${context.language}\n`;
    }

    systemPrompt += `
When providing code:
- Return ONLY the code to insert/replace, no explanations unless asked
- Use proper indentation and formatting
- Match the existing code style
- For modifications, provide the complete replacement code
- Wrap code in markdown code blocks with language specified

Available actions you can suggest:
- Replace selected text
- Insert at cursor position
- Create new file
- Modify existing file

Be concise but accurate. Focus on working, production-ready code.`;

    return systemPrompt;
  }

  private parseResponse(data: any): AIResponse {
    const content = data.content?.[0]?.text || '';
    const codeBlocks = this.extractCodeBlocks(content);

    return {
      content,
      codeBlocks,
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
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
