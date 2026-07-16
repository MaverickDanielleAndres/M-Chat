/**
 * M-Chat Image Generation Service
 * Uses Google's multimodal generation via @google/genai
 */
import { GoogleGenAI } from '@google/genai';
import { isValidGeminiKey } from './ai';

export interface ImageGenerationResult {
  imageUrl: string; // base64 data URL
  mimeType: string;
  prompt: string;
}

export interface ImageGenerationOptions {
  numberOfImages?: number;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

function getApiKey(): string | null {
  const keys = (import.meta.env.VITE_GEMINI_API_KEYS || '')
    .split(',')
    .map((k: string) => k.trim())
    .filter(isValidGeminiKey);
  const single = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (isValidGeminiKey(single) && !keys.includes(single)) keys.unshift(single);
  return keys[0] || null;
}

/**
 * Model candidates for image generation. The order is most-preferred first:
 * we try each one until one returns inline image data. This insulates the
 * client from upstream model deprecations (Gemini has renamed its image
 * generation model several times in the past year).
 */
const IMAGE_MODEL_CANDIDATES = [
  'gemini-2.5-flash-image-preview',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash-preview-image-generation',
  'imagen-3.0-generate-002',
];

export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No valid Gemini API key configured for image generation.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const errors: string[] = [];

  for (const model of IMAGE_MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          numberOfImages: options.numberOfImages ?? 1,
        } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      });

      const results: ImageGenerationResult[] = [];
      const parts = (response as any).candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const p = part as any;
        if (p.inlineData?.data && p.inlineData?.mimeType) {
          const mimeType = p.inlineData.mimeType as string;
          const imageUrl = `data:${mimeType};base64,${p.inlineData.data}`;
          results.push({ imageUrl, mimeType, prompt });
        }
      }

      if (results.length > 0) return results;
      errors.push(`${model}: returned no image data`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Only continue past auth/quota errors when there is another candidate.
      if (/api[_ ]?key|invalid[_ ]?key|401|403/i.test(msg)) {
        throw err;
      }
      errors.push(`${model}: ${msg}`);
    }
  }

  throw new Error(
    `Image generation unavailable across all models. ${errors.slice(-3).join(' | ')}`
  );
}

/**
 * Detect if the user prompt is requesting image generation
 */
export function detectImageGenerationIntent(prompt: string): boolean {
  const lower = prompt.toLowerCase().trim();
  const triggers = [
    'generate an image',
    'create an image',
    'draw ',
    'make an image',
    'generate a picture',
    'create a picture',
    'make a picture',
    'generate a photo',
    'create a photo',
    'paint a',
    'paint me',
    'illustrate',
    'render an image',
    'render a',
    'visualize',
    'show me an image',
    'create art',
    'generate art',
    'design an image',
    'make art',
    'image of',
    'picture of',
    'photo of',
  ];
  return triggers.some((t) => lower.includes(t));
}
