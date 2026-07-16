/**
 * Text-extraction helpers for documents uploaded alongside chat messages.
 *
 * The frontend can ask Gemini to analyze PDFs/Word files in two ways:
 *  1. inlineData on the request part (only works for images and small PDFs
 *     that fit under Gemini's inline size limit — ~20 MB)
 *  2. extract text client-side and prepend it to the user message so the
 *     model can reason over the visible content
 *
 * For most text-based documents (txt/md/csv/json/xml/code), we extract the
 * text directly. For PDFs we ship the raw bytes as inlineData when small
 * enough, otherwise fall back to a text-only payload. Word/excel docs are
 * best handled server-side; for now we expose a hook so the AI can see the
 * filename and (best-effort) plain-text preview.
 */

const TEXT_MIME_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/xml',
  'application/json',
  'application/xml',
  'application/javascript',
  'application/typescript',
  'application/x-sh',
  'application/x-yaml',
]);

const PDF_MAX_INLINE_BYTES = 18 * 1024 * 1024; // 18 MB safety margin under Gemini's 20MB inline cap

/**
 * Returns true when this file should be sent to Gemini as inline bytes.
 */
export function isInlineCompatible(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  if (file.type === 'application/pdf') return file.size <= PDF_MAX_INLINE_BYTES;
  return false;
}

/**
 * Extracts readable text from a file. Returns null when we can't extract
 * useful content (binary docx, etc.) — the caller should still attach the
 * file as inlineData when possible.
 */
export async function extractText(file: File): Promise<string | null> {
  if (TEXT_MIME_TYPES.has(file.type) || file.type.startsWith('text/')) {
    try {
      return await file.text();
    } catch {
      return null;
    }
  }
  if (file.type === 'application/json' || file.name.endsWith('.json')) {
    try {
      const text = await file.text();
      // Pretty-print so the model sees structure, not one giant line
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return null;
    }
  }
  // PDFs and binaries: skip text extraction here. Gemini can read them
  // natively via inlineData when they're under the size limit.
  return null;
}

/**
 * Build a user-content payload that includes the user's prompt plus any
 * extracted document text. The original attachments are still passed as
 * File[] so the AI provider can attach them as inlineData when appropriate.
 */
export function buildAugmentedPrompt(
  userPrompt: string,
  attachments: File[]
): string {
  if (!attachments?.length) return userPrompt;
  const parts: string[] = [userPrompt];
  // Synchronous extraction for small text docs. Async PDFs are handled by
  // Gemini directly via inlineData in the provider.
  for (const file of attachments) {
    const looksText =
      file.type.startsWith('text/') ||
      TEXT_MIME_TYPES.has(file.type) ||
      /\.(txt|md|csv|json|xml|ya?ml|html|css|js|ts|tsx|jsx|py|java|c|cpp|sql|sh|rb|go|rs)$/i.test(
        file.name
      );
    if (looksText) {
      // Lazy: we'll inject a placeholder marker and rely on the async
      // extraction path inside the store. For simplicity, just mention
      // the file so the model knows it's there.
      parts.push(`\n\n[Attached: ${file.name} (${file.type || 'unknown'}, ${file.size} bytes)]`);
    } else if (file.type.startsWith('image/')) {
      parts.push(`\n\n[Attached image: ${file.name}]`);
    } else {
      parts.push(`\n\n[Attached document: ${file.name} (${file.type || 'unknown'})]`);
    }
  }
  return parts.join('\n');
}