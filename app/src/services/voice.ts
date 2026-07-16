/**
 * M-Chat Voice Service
 * Speech-to-text (STT) and Text-to-speech (TTS) using the Web Speech API.
 * Uses type assertions to handle browsers where the Web Speech API types
 * aren't included in the TS lib.
 */

// ---------------------------------------------------------------------------
// Speech-to-Text
// ---------------------------------------------------------------------------
export interface STTOptions {
  language?: string;
  continuous?: boolean;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class SpeechToText {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private isListening = false;

  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  start(options: STTOptions): void {
    if (!SpeechToText.isSupported()) {
      options.onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI =
      w.SpeechRecognition || w.webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionAPI();
    this.recognition.lang = options.language || 'en-US';
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        options.onResult(finalTranscript, true);
      } else if (interimTranscript) {
        options.onResult(interimTranscript, false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onerror = (event: any) => {
      options.onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      options.onEnd?.();
    };

    this.recognition.start();
    this.isListening = true;
  }

  stop(): void {
    this.recognition?.stop();
    this.isListening = false;
  }

  get active(): boolean {
    return this.isListening;
  }
}

// ---------------------------------------------------------------------------
// Text-to-Speech
// ---------------------------------------------------------------------------
export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  language?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export class TextToSpeech {
  private utterance: SpeechSynthesisUtterance | null = null;
  private speaking = false;

  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' && 'speechSynthesis' in window
    );
  }

  static getVoices(): SpeechSynthesisVoice[] {
    if (!TextToSpeech.isSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  speak(text: string, options: TTSOptions = {}): void {
    if (!TextToSpeech.isSupported()) {
      options.onError?.('Text-to-speech is not supported in this browser.');
      return;
    }

    this.stop();

    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'code block')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/>\s/g, '')
      .trim();

    this.utterance = new SpeechSynthesisUtterance(cleanText);
    this.utterance.rate = options.rate ?? 1;
    this.utterance.pitch = options.pitch ?? 1;
    this.utterance.volume = options.volume ?? 1;
    this.utterance.lang = options.language ?? 'en-US';

    if (options.voice) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.name === options.voice);
      if (voice) this.utterance.voice = voice;
    }

    this.utterance.onstart = () => {
      this.speaking = true;
      options.onStart?.();
    };
    this.utterance.onend = () => {
      this.speaking = false;
      options.onEnd?.();
    };
    this.utterance.onerror = (event) => {
      this.speaking = false;
      options.onError?.(event.error);
    };

    window.speechSynthesis.speak(this.utterance);
  }

  stop(): void {
    window.speechSynthesis.cancel();
    this.speaking = false;
  }

  pause(): void {
    window.speechSynthesis.pause();
  }

  resume(): void {
    window.speechSynthesis.resume();
  }

  get isSpeaking(): boolean {
    return this.speaking;
  }
}

// ---------------------------------------------------------------------------
// Singletons
// ---------------------------------------------------------------------------
export const stt = new SpeechToText();
export const tts = new TextToSpeech();