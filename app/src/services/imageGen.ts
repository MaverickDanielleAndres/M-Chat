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

export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('No valid Gemini API key configured for image generation.');
  }

  const ai = new GoogleGenAI({ apiKey });

  // Use the image generation model
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-preview-image-generation',
    contents: prompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      numberOfImages: options.numberOfImages ?? 1,
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  const results: ImageGenerationResult[] = [];

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = part as any;
    if (p.inlineData?.data && p.inlineData?.mimeType) {
      const mimeType = p.inlineData.mimeType as string;
      const imageUrl = `data:${mimeType};base64,${p.inlineData.data}`;
      results.push({ imageUrl, mimeType, prompt });
    }
  }

  if (results.length === 0) {
    throw new Error(
      'Image generation returned no images. The model may not support image output — try a more descriptive prompt.'
    );
  }

  return results;
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
