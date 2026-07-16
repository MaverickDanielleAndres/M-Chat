export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status: MessageStatus;
  attachments?: FileAttachment[];
  liked?: boolean | null;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  model?: string;
  system_prompt?: string;
  userId?: string | null;
  synced?: boolean;
  /** DB-authoritative message count (denormalized on the conversation row). */
  messageCount?: number;
}


export type ThemeMode = 'light' | 'dark' | 'system';

export type AIStatus = 'online' | 'thinking' | 'generating' | 'offline' | 'error';

export interface AIProvider {
  id: string;
  name: string;
  model: string;
  sendMessage(messages: ChatMessage[], attachments?: File[]): Promise<ReadableStream<Uint8Array>>;
  generateTitle?(messages: ChatMessage[]): Promise<string>;
}

export interface AppSettings {
  theme: ThemeMode;
  language: string;
  animationsEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  developerMode: boolean;
  soundEnabled: boolean;
  enterToSend: boolean;
  streamResponses: boolean;
  showTokenCounts: boolean;
  density: 'compact' | 'comfortable' | 'spacious';
  accentColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  customInstructions: string;
  defaultModel?: string;
}

export interface DeveloperStats {
  apiStatus: string;
  modelName: string;
  latency: number;
  tokensUsed: number;
  conversationSize: number;
  promptCount: number;
  memoryUsage: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration?: number;
}

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  username?: string | null;
  avatar_url: string | null;
  bio?: string | null;
  role: string;
  subscription_tier: string;
  subscription_status: string | null;
  onboarding_completed?: boolean;
  last_seen_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type SubscriptionTier = 'free' | 'registered' | 'pro' | 'premium';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_prompts_daily: number;
  max_storage_mb: number;
  max_file_size_mb: number;
  includes_image_gen: boolean;
  includes_voice: boolean;
  includes_api: boolean;
  is_active: boolean;
  highlight?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    slug: 'free',
    description: 'Perfect for trying out M-Chat',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      '20 prompts per day',
      'Basic AI chat',
      'Local chat history',
      'Text & code support',
      'Community support',
    ],
    max_prompts_daily: 20,
    max_storage_mb: 0,
    max_file_size_mb: 5,
    includes_image_gen: false,
    includes_voice: false,
    includes_api: false,
    is_active: true,
  },
  {
    id: 'registered',
    name: 'Registered',
    slug: 'registered',
    description: 'Sign up to get more',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      '50 prompts per day',
      'Cloud sync',
      'Save conversations',
      'Document upload',
      'Image analysis',
      'Email support',
    ],
    max_prompts_daily: 50,
    max_storage_mb: 100,
    max_file_size_mb: 10,
    includes_image_gen: false,
    includes_voice: false,
    includes_api: false,
    is_active: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    slug: 'pro',
    description: 'For power users',
    price_monthly: 9.99,
    price_yearly: 7.99,
    features: [
      'Unlimited prompts',
      'Priority responses',
      'Longer context window',
      'Image generation',
      'Voice conversations',
      'Larger uploads (50MB)',
      'Cloud storage (10GB)',
      'Priority support',
    ],
    max_prompts_daily: -1,
    max_storage_mb: 10240,
    max_file_size_mb: 50,
    includes_image_gen: true,
    includes_voice: true,
    includes_api: false,
    is_active: true,
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    slug: 'premium',
    description: 'For teams and businesses',
    price_monthly: 29.99,
    price_yearly: 24.99,
    features: [
      'Everything in Pro',
      'Early access features',
      'Advanced AI models',
      'Unlimited storage',
      'Projects & folders',
      'Team workspace',
      'API access',
      'White-label options',
      'Dedicated support',
    ],
    max_prompts_daily: -1,
    max_storage_mb: -1,
    max_file_size_mb: 100,
    includes_image_gen: true,
    includes_voice: true,
    includes_api: true,
    is_active: true,
  },
];

export const SUGGESTION_CARDS = [
  { icon: 'Code2', label: 'Explain Code', prompt: 'Explain this code step by step:\n\n```\n// Paste your code here\n```' },
  { icon: 'FileText', label: 'Summarize PDF', prompt: 'Please summarize the key points from this document.' },
  { icon: 'Component', label: 'Generate React', prompt: 'Create a React component with TypeScript that...' },
  { icon: 'Image', label: 'Analyze Image', prompt: 'Describe what you see in this image and analyze it.' },
  { icon: 'Bug', label: 'Fix Bug', prompt: 'Help me debug this issue. Here is the error and code:\n\n' },
  { icon: 'Lightbulb', label: 'Brainstorm Ideas', prompt: 'Help me brainstorm ideas for...' },
  { icon: 'Database', label: 'Write SQL', prompt: 'Write a SQL query that...' },
  { icon: 'Languages', label: 'Translate', prompt: 'Translate this to English:\n\n' },
  { icon: 'Mail', label: 'Create Email', prompt: 'Write a professional email about...' },
  { icon: 'TrendingUp', label: 'Business Plan', prompt: 'Help me create a business plan for...' },
] as const;

export const FREE_PROMPT_LIMIT = 20;
export const REGISTERED_PROMPT_LIMIT = 50;

export const AI_CAPABILITIES = [
  'Text', 'Images', 'Video', 'Audio', 'PDF', 'Word', 'Excel', 'PowerPoint',
  'CSV', 'JSON', 'XML', 'Markdown', 'HTML', 'CSS', 'JavaScript', 'TypeScript',
  'React', 'Next.js', 'Node.js', 'Python', 'Java', 'PHP', 'SQL',
  'OCR', 'Translation', 'Summaries', 'Brainstorming', 'AI Reasoning',
  'Coding', 'Debugging', 'Image Generation', 'Charts', 'Diagrams',
];

export const FEATURES = [
  {
    icon: 'MessageSquare',
    title: 'AI Chat',
    description: 'Natural conversations with advanced AI. Ask anything, get intelligent responses with context awareness and memory.',
  },
  {
    icon: 'Image',
    title: 'Image Understanding',
    description: 'Upload images and get detailed analysis, descriptions, object recognition, text extraction, and visual Q&A.',
  },
  {
    icon: 'Video',
    title: 'Video Analysis',
    description: 'Analyze video content frame by frame. Get summaries, transcripts, scene detection, and content insights.',
  },
  {
    icon: 'Code2',
    title: 'Code Generation',
    description: 'Generate production-ready code in 30+ languages. Get syntax-highlighted output with explanations and best practices.',
  },
  {
    icon: 'FileText',
    title: 'Document Intelligence',
    description: 'Upload PDFs, Word docs, Excel files. Extract text, summarize, analyze data, and answer questions about documents.',
  },
  {
    icon: 'Mic',
    title: 'Voice Conversations',
    description: 'Speak naturally with AI. Speech-to-text input and text-to-speech responses with multiple voice options.',
  },
  {
    icon: 'Brain',
    title: 'Research Assistant',
    description: 'Deep research capabilities with web search integration. Get comprehensive answers with cited sources.',
  },
  {
    icon: 'PenTool',
    title: 'Creative Writing',
    description: 'Generate blog posts, essays, stories, poetry, marketing copy, and more with customizable tone and style.',
  },
  {
    icon: 'BarChart3',
    title: 'Spreadsheet Analysis',
    description: 'Upload CSV and Excel files. Get data analysis, visualization suggestions, formulas, and statistical insights.',
  },
  {
    icon: 'Briefcase',
    title: 'Business Planning',
    description: 'Create business plans, financial projections, market analysis, and strategic recommendations.',
  },
  {
    icon: 'Presentation',
    title: 'Presentation Builder',
    description: 'Generate slide outlines, speaker notes, and visual suggestions for compelling presentations.',
  },
  {
    icon: 'Languages',
    title: 'Translation',
    description: 'Translate between 100+ languages with context-aware accuracy. Support for technical and professional content.',
  },
];
