import { GoogleGenAI } from '@google/genai';
import type { AIProvider, ChatMessage } from '@/types';

export interface AIStreamChunk {
  content: string;
  done: boolean;
}

// ---------------------------------------------------------------------------
// Key rotation — supports VITE_GEMINI_API_KEYS (comma-separated) with fallback
// to VITE_GEMINI_API_KEY
// ---------------------------------------------------------------------------
function buildKeyPool(): string[] {
  const multi = (import.meta.env.VITE_GEMINI_API_KEYS || '').trim();
  const single = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const keys: string[] = [];
  if (multi) {
    for (const k of multi.split(',')) {
      const t = k.trim();
      if (isValidGeminiKey(t)) keys.push(t);
    }
  }
  if (single && isValidGeminiKey(single) && !keys.includes(single)) {
    keys.push(single);
  }
  return keys;
}

/**
 * Validate a Gemini API key.
 * Accepts both the classic AIza… keys from Google AI Studio and
 * the AQ.… keys used in this project's .env.local.
 */
export function isValidGeminiKey(key: string | undefined | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  // Any key that is at least 20 characters and not an obvious placeholder
  return trimmed.length >= 20 && !trimmed.includes('your-key') && !trimmed.includes('YOUR_');
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
// Resolve the model name — prefer GEMINI_MODEL env, fall back to 2.5-flash
// ---------------------------------------------------------------------------
function resolveModel(): string {
  const envModel = (import.meta.env.VITE_GEMINI_MODEL || import.meta.env.GEMINI_MODEL || '').trim();
  return envModel || 'gemini-2.5-flash';
}

// ---------------------------------------------------------------------------
// Build rich system instruction
// ---------------------------------------------------------------------------
function buildSystemInstruction(customInstructions?: string): string {
  const base = `You are M-Chat, a powerful AI assistant comparable to ChatGPT — helpful, concise, and versatile.

Your capabilities include:
- Deep reasoning and step-by-step problem solving
- Code generation, review, debugging in 30+ languages with syntax-highlighted output
- Document analysis: PDF, Word, Excel, CSV, JSON, XML, Markdown, HTML
- Image analysis and description (when images are provided)
- Data analysis and visualization recommendations
- Creative writing: essays, stories, blog posts, marketing copy
- Translation across 100+ languages
- Math, science, and research assistance
- Business planning, strategic recommendations
- Answering questions with detailed, accurate explanations

Formatting rules:
- Use markdown formatting when it improves clarity (headers, lists, code blocks, tables)
- For code, always use fenced code blocks with the language identifier
- For math, use LaTeX notation when precision is needed
- Be direct and concise; avoid unnecessary preamble
- When uncertain, say so clearly rather than hallucinating facts`;

  if (customInstructions && customInstructions.trim()) {
    return `${base}\n\n## User's Custom Instructions\n${customInstructions.trim()}`;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Gemini Provider
// ---------------------------------------------------------------------------
class GeminiProvider implements AIProvider {
  id = 'gemini';
  name = 'Gemini AI';
  model: string;

  private ai: GoogleGenAI;
  private customInstructions?: string;

  constructor(apiKey: string, customInstructions?: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = resolveModel();
    this.customInstructions = customInstructions;
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
        systemInstruction: buildSystemInstruction(this.customInstructions),
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.95,
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
export function createAIProvider(providerId: string, apiKey: string, customInstructions?: string): AIProvider {
  switch (providerId) {
    case 'gemini':
      return new GeminiProvider(apiKey, customInstructions);
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
 * request (invalid key, quota exceeded, rate limited, etc.).
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
 * Classify an upstream AI error.
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
      'Gemini API quota exceeded. Rotating to next key or falling back to demo mode.',
      429
    );
  }
  if (status === 401 || status === 403 || lower.includes('api key')) {
    return new AIProviderError(
      'Gemini API key is invalid. Check VITE_GEMINI_API_KEY in .env.',
      status ?? 401
    );
  }
  if (status && status >= 500) {
    return new AIProviderError(
      'Gemini service is temporarily unavailable. Falling back to demo mode.',
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
      `2. Open \`.env.local\` and set:\n` +
      `   \`\`\`\n   VITE_GEMINI_API_KEY=your-key-here\n   \`\`\`\n` +
      `3. Restart the dev server (\`npm run dev\`).\n\n` +
      `Once a valid key is configured, the Gemini 2.5 Flash model will answer here in full.`;
  } else {
    response =
      `Hello! I'm **M-Chat**, your AI assistant powered by **Gemini 2.5 Flash**.\n\nIt looks like you haven't configured an API key yet. To use the full AI capabilities:\n\n` +
      `1. Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).\n` +
      `2. Open your \`.env.local\` file and set:\n   \`\`\`\n   VITE_GEMINI_API_KEY=your-key-here\n   \`\`\`\n` +
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
// Send a single message with automatic fallback + key rotation
// ---------------------------------------------------------------------------
export interface SendMessageResult {
  stream: ReadableStream<Uint8Array>;
  usedFallback: boolean;
  fallbackReason?: string;
}

export async function sendMessageWithFallback(
  messages: ChatMessage[],
  attachments: File[] | undefined,
  userPrompt: string,
  customInstructions?: string
): Promise<SendMessageResult> {
  // Try each key in the pool
  const pool = buildKeyPool();
  if (pool.length === 0) {
    return {
      stream: createDemoStream({ reason: 'No Gemini API key configured. Add VITE_GEMINI_API_KEY to .env.local', userPrompt }),
      usedFallback: true,
      fallbackReason: 'No valid Gemini API key configured',
    };
  }

  let lastError: AIProviderError | null = null;
  for (const key of pool) {
    try {
      const provider = createAIProvider('gemini', key, customInstructions);
      const stream = await provider.sendMessage(messages, attachments);
      return { stream, usedFallback: false };
    } catch (err) {
      const classified = classifyAIError(err);
      lastError = classified;
      // On quota/rate-limit errors, try next key. On auth errors, break.
      if (classified.status === 401 || classified.status === 403) break;
    }
  }

  return {
    stream: createDemoStream({ reason: lastError?.message, userPrompt }),
    usedFallback: true,
    fallbackReason: lastError?.message,
  };
}