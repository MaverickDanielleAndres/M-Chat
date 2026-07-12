import { GoogleGenAI } from '@google/genai';
import type { AIProvider, ChatMessage } from '@/types';

export interface AIStreamChunk {
  content: string;
  done: boolean;
}

// ---------------------------------------------------------------------------
// Helper – convert a File to base64 inline data for Gemini multimodal input
// ---------------------------------------------------------------------------
async function fileToInlineData(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
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

  /**
   * Sends all conversation messages to Gemini and returns a ReadableStream<Uint8Array>
   * that is already formatted as SSE so the existing parseSSEStream() util works unchanged.
   */
  async sendMessage(messages: ChatMessage[], attachments?: File[]): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder();

    // Build Gemini content array from conversation history
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // Last message is the new user turn
    const lastMessage = messages[messages.length - 1];
    const userParts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      { text: lastMessage.content },
    ];

    // Attach files if any
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        try {
          const inlineData = await fileToInlineData(file);
          userParts.push(inlineData);
        } catch {
          // Skip files that can't be read
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

    // Wrap the async generator into a ReadableStream<Uint8Array> of SSE chunks
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
// Parse SSE stream – unchanged, works for both Qwen format and our new wrapper
// ---------------------------------------------------------------------------
export async function* parseSSEStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<AIStreamChunk> {
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

// ---------------------------------------------------------------------------
// Fallback demo stream when no API key is configured
// ---------------------------------------------------------------------------
export function createDemoStream(_message: string): ReadableStream<Uint8Array> {
  const response = `Hello! I'm **M-Chat**, your AI assistant powered by **Gemini AI**.\n\nIt looks like you haven't configured an API key yet. To use the full AI capabilities:\n\n1. Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)\n2. Open your \`.env\` file and set:\n   \`\`\`\n   VITE_GEMINI_API_KEY=your-key-here\n   \`\`\`\n3. Restart the dev server\n\nIn the meantime, I'm running in **demo mode**. How can I help you today?`;

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
      }, 20);
    },
  });
}
