import { GoogleGenAI } from '@google/genai';
import type { AIProvider, ChatMessage } from '@/types';

export interface AIStreamChunk {
  content: string;
  done: boolean;
}

/**
 * Heuristic check: a real Google Gemini API key starts with `AIza` and is ~39
 * characters long. Anything else is almost certainly a placeholder / wrong env
 * value (e.g. `AQ.…` from Qwen) and will return 401 / RESOURCE_EXHAUSTED.
 */
export function isValidGeminiKey(key: string | undefined | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.startsWith('AIza') && trimmed.length >= 30;
}

// ---------------------------------------------------------------------------
// file -> inline data helper
// ---------------------------------------------------------------------------
async function fileToInlineData(
  file: File
): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ inlineData: { data: base64, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Gemini Provider
// ---------------------------------------------------------------------------
class GeminiProvider implements AIProvider {
  id = 'gemini';
  name = 'Gemini AI';
  model = 'gemini-2.0-flash';

  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async sendMessage(
    messages: ChatMessage[],
    attachments?: File[]
  ): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder();

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const userParts: Array<
      { text: string } | { inlineData: { data: string; mimeType: string } }
    > = [{ text: lastMessage.content }];

    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        try {
          userParts.push(await fileToInlineData(file));
        } catch {
          /* skip files that can't be read */
        }
      }
    }

    const chat = this.ai.chats.create({
      model: this.model,
      history,
      config: {
        systemInstruction:
          'You are M-Chat, a helpful, concise, and friendly AI assistant. Format responses using markdown when helpful. Be clear and direct.',
        maxOutputTokens: 8192,
      },
    });

    const response = await chat.sendMessageStream({ message: userParts as any });

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text ?? '';
            if (text) {
              const data = JSON.stringify({
                choices: [{ delta: { content: text }, finish_reason: null }],
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  async generateTitle(messages: ChatMessage[]): Promise<string> {
    try {
      const prompt =
        messages
          .slice(-4)
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 200)}`)
          .join('\n') +
        '\n\nGenerate a very short title (3-5 words) for this conversation. Return ONLY the title, nothing else.';

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: { maxOutputTokens: 20 },
      });

      return response.text?.trim() || 'New Conversation';
    } catch {
      return 'New Conversation';
    }
  }
}

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------
export function createAIProvider(providerId: string, apiKey: string): AIProvider {
  switch (providerId) {
    case 'gemini':
      return new GeminiProvider(apiKey);
    default:
      throw new Error(`Unknown AI provider: ${providerId}`);
  }
}

// ---------------------------------------------------------------------------
// parseSSEStream
// ---------------------------------------------------------------------------
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<AIStreamChunk> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            const isDone = parsed.choices?.[0]?.finish_reason != null;
            yield { content, done: isDone };
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Custom error class that signals when the upstream provider rejected the
 * request (invalid key, quota exceeded, rate limited, etc.). The store
 * catches this to surface a friendly toast and switch to demo mode.
 */
export class AIProviderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AIProviderError';
    this.status = status;
  }
}

/**
 * Inspect an error caught from the Gemini provider and decide whether it's a
 * recoverable upstream error (key invalid / quota / rate limit). Returns a
 * normalized `AIProviderError` we can show to the user.
 */
export function classifyAIError(err: unknown): AIProviderError {
  const raw = err instanceof Error ? err.message : String(err);
  const statusMatch = raw.match(/\b(\d{3})\b/);
  const status = statusMatch ? Number(statusMatch[1]) : undefined;
  const lower = raw.toLowerCase();
  if (
    status === 429 ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('resource_exhausted')
  ) {
    return new AIProviderError(
      'Gemini API quota exceeded. Falling back to demo mode — set a valid VITE_GEMINI_API_KEY in .env to enable real AI.',
      429
    );
  }
  if (status === 401 || status === 403 || lower.includes('api key')) {
    return new AIProviderError(
      'Gemini API key is invalid. Falling back to demo mode — check VITE_GEMINI_API_KEY in .env.',
      status ?? 401
    );
  }
  if (status && status >= 500) {
    return new AIProviderError(
      'Gemini service is unavailable right now. Falling back to demo mode.',
      status
    );
  }
  return new AIProviderError(
    raw || 'Unexpected error from AI provider. Falling back to demo mode.'
  );
}

// ---------------------------------------------------------------------------
// Demo / fallback stream
// ---------------------------------------------------------------------------
export interface DemoStreamOptions {
  reason?: string;
  userPrompt?: string;
}

/**
 * Generates a helpful demo / fallback stream used when:
 *   - no API key is configured
 *   - the configured key is malformed (not a real Gemini key)
 *   - the upstream provider rejected the request (quota / 401 / 5xx)
 *
 * The response is still useful: it acknowledges the user's prompt, points
 * them at the configuration step, and offers to keep going.
 */
export function createDemoStream(opts: DemoStreamOptions | string = {}): ReadableStream<Uint8Array> {
  const options: DemoStreamOptions = typeof opts === 'string' ? { userPrompt: opts } : opts;
  const userPrompt = options.userPrompt?.trim() || 'your message';
  const reason = options.reason;

  let response: string;
  if (reason) {
    response =
      `I received your message — *"${userPrompt.slice(0, 240)}"* — but I'm currently running in **fallback (demo) mode** because:\n\n` +
      `> ${reason}\n\n` +
      `### How to enable the real AI\n\n` +
      `1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).\n` +
      `2. Open \`.env\` and set:\n` +
      `   \`\`\`\n   VITE_GEMINI_API_KEY=your-key-here\n   \`\`\`\n` +
      `3. Restart the dev server (\`npm run dev\`).\n\n` +
      `Once a valid key is configured, the Gemini 2.0 Flash model will answer here in full.`;
  } else {
    response =
      `Hello! I'm **M-Chat**, your AI assistant powered by **Gemini AI**.\n\nIt looks like you haven't configured an API key yet. To use the full AI capabilities:\n\n` +
      `1. Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).\n` +
      `2. Open your \`.env\` file and set:\n   \`\`\`\n   VITE_GEMINI_API_KEY=your-key-here\n   \`\`\`\n` +
      `3. Restart the dev server.\n\nIn the meantime, I'm running in **demo mode**. How can I help you today?`;
  }

  const encoder = new TextEncoder();
  const chunks = response.split('');

  return new ReadableStream({
    start(controller) {
      let i = 0;
      const interval = setInterval(() => {
        if (i >= chunks.length) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          clearInterval(interval);
          return;
        }
        const chunk = chunks.slice(i, i + 3).join('');
        const data = JSON.stringify({
          choices: [{ delta: { content: chunk }, finish_reason: null }],
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        i += 3;
      }, 18);
    },
  });
}

// ---------------------------------------------------------------------------
// Send a single message with automatic fallback. This is the high-level entry
// point the store should use — it handles:
//   - detecting malformed keys and skipping Gemini entirely
//   - catching upstream errors (quota / 401 / 5xx) and falling back to demo
//   - normalising thrown errors into AIProviderError
//
// Returns the raw stream AND a `usedFallback` flag plus the reason, so the
// UI can show a non-blocking toast.
// ---------------------------------------------------------------------------
export interface SendMessageResult {
  stream: ReadableStream<Uint8Array>;
  usedFallback: boolean;
  fallbackReason?: string;
}

export async function sendMessageWithFallback(
  messages: ChatMessage[],
  attachments: File[] | undefined,
  userPrompt: string
): Promise<SendMessageResult> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (!isValidGeminiKey(apiKey)) {
    return {
      stream: createDemoStream({ reason: 'No valid Gemini API key configured.', userPrompt }),
      usedFallback: true,
      fallbackReason: 'No valid Gemini API key configured',
    };
  }
  try {
    const provider = createAIProvider('gemini', apiKey);
    const stream = await provider.sendMessage(messages, attachments);
    return { stream, usedFallback: false };
  } catch (err) {
    const classified = classifyAIError(err);
    return {
      stream: createDemoStream({ reason: classified.message, userPrompt }),
      usedFallback: true,
      fallbackReason: classified.message,
    };
  }
}