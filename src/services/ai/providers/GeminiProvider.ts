/**
 * Gemini AI Provider
 * Implements Google Gemini API integration
 */

import { AIProvider } from './AIProvider';
import { AIConfig, AIContext, AIResponse, StreamCallback, CodeBlock } from '../types';

export class GeminiProvider implements AIProvider {
  readonly name = 'Gemini';
  private apiKey: string = '';
  private model: string = 'gemini-1.5-flash';
  private maxTokens: number = 4096;
  private temperature: number = 0.7;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1';

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
    console.log('[Gemini] Validating API key...');
    try {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${apiKey}`;
      console.log('[Gemini] Request URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'Hi' }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
          },
        }),
      });

      console.log('[Gemini] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Gemini] API error:', errorText);

        // Try to parse error message
        try {
          const errorData = JSON.parse(errorText);
          const errorMessage = errorData.error?.message || `API error: ${response.status}`;

          // Show user-friendly error messages
          if (response.status === 400 && errorMessage.includes('API_KEY_INVALID')) {
            throw new Error('Invalid Gemini API key. Get a free key at aistudio.google.com/apikey');
          } else if (response.status === 403) {
            throw new Error('Gemini API access denied. Check your key or quota at aistudio.google.com');
          } else if (response.status === 429) {
            throw new Error('Gemini API quota exceeded. Wait a moment or upgrade your plan.');
          }

          throw new Error(`Gemini: ${errorMessage}`);
        } catch (parseError) {
          if (response.status === 400) {
            throw new Error('Invalid Gemini API key');
          }
          throw new Error(`Gemini API error (${response.status})`);
        }
      }

      console.log('[Gemini] API key is valid!');
      return true;
    } catch (error: any) {
      console.error('[Gemini] Validation failed:', error);

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
      throw new Error('Gemini provider not configured. Please set API key.');
    }

    const contents = this.buildContents(prompt, context, systemPrompt);

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              maxOutputTokens: this.maxTokens,
              temperature: this.temperature,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        );
      }

      const data = await response.json();

      return this.parseResponse(data);
    } catch (error) {
      console.error('Gemini API request failed:', error);
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
      throw new Error('Gemini provider not configured. Please set API key.');
    }

    const contents = this.buildContents(prompt, context, systemPrompt);

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              maxOutputTokens: this.maxTokens,
              temperature: this.temperature,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
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

            try {
              const parsed = JSON.parse(data);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                onChunk({ content: text, done: false });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Gemini streaming failed:', error);
      throw error;
    }
  }

  private buildContents(prompt: string, context: AIContext, systemPrompt?: string) {
    const contents: Array<{ role?: string; parts: Array<{ text: string }> }> = [];

    // Add system instruction if provided
    if (systemPrompt) {
      contents.push({
        parts: [{ text: systemPrompt }],
      });
    }

    // Add conversation history if exists
    if (context.messages && context.messages.length > 0) {
      context.messages.forEach((msg) => {
        if (msg.role !== 'system') {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }
      });
    }

    // Add current prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    return contents;
  }

  private parseResponse(data: any): AIResponse {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const codeBlocks = this.extractCodeBlocks(text);

    return {
      content: text,
      codeBlocks,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
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
