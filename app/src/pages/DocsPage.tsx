import { Link } from 'react-router';
import { Book, Code, Database, Shield, Zap, MessageSquare, Server, Lock, Globe } from 'lucide-react';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-white/[0.06] bg-[#0c0c10]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
        <span className="text-[10px] text-[var(--m-text-muted)] font-mono">bash</span>
        <button onClick={handleCopy} className="text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)] transition-colors">
          {copied ? <Check size={13} strokeWidth={1.5} /> : <Copy size={13} strokeWidth={1.5} />}
        </button>
      </div>
      <pre className="p-4 text-[12px] text-[var(--m-text-secondary)] overflow-x-auto font-mono leading-relaxed"><code>{text}</code></pre>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Book; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <div className="flex items-center gap-2.5 mb-5">
        <Icon size={18} strokeWidth={1.5} className="text-[var(--m-accent-blue)]" />
        <h2 className="text-lg font-semibold text-[var(--m-text-primary)]">{title}</h2>
      </div>
      <div className="text-[13px] text-[var(--m-text-secondary)] leading-relaxed">{children}</div>
    </section>
  );
}

export function DocsPage() {
  return (
    <div className="min-h-screen bg-[#050507]">
      <div className="border-b border-white/[0.04] bg-[var(--m-bg-elevated)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logonobg.png" alt="M-Chat Logo" className="w-6 h-6" />
              <span className="text-[13px] font-medium text-[var(--m-text-primary)]">M-Chat</span>
            </Link>
            <span className="text-[var(--m-text-muted)]">/</span>
            <span className="text-[13px] text-[var(--m-text-secondary)]">Documentation</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold text-[var(--m-text-primary)] mb-2">Documentation</h1>
        <p className="text-[15px] text-[var(--m-text-secondary)] mb-14">Complete guide to the M-Chat platform.</p>

        <Section icon={Book} title="Project Overview">
          <p className="mb-3">M-Chat is a complete AI workspace built with React, TypeScript, Tailwind CSS, and Supabase. Features model-agnostic AI, real-time streaming, full markdown support, file uploads, voice input, and subscription management.</p>
        </Section>

        <Section icon={Code} title="Tech Stack">
          <div className="grid sm:grid-cols-2 gap-2 mb-4">
            {[
              ['Frontend', 'React 19 + TypeScript + Vite + Tailwind + shadcn/ui'],
              ['Backend', 'Supabase (PostgreSQL, Auth, Storage, Realtime)'],
              ['AI', 'Gemini API (model-agnostic)'],
              ['State', 'Zustand + Supabase Realtime'],
            ].map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl border border-white/[0.04] bg-[var(--m-bg-card)]/30">
                <p className="text-[11px] font-medium text-[var(--m-text-primary)] mb-0.5">{k}</p>
                <p className="text-[11px] text-[var(--m-text-muted)]">{v}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Database} title="Database Schema">
          <p className="mb-3">Run the SQL migration in your Supabase SQL Editor:</p>
          <CopyBlock text="-- Located at: supabase/schema.sql\n-- Run this in Supabase Dashboard > SQL Editor" />
          <ul className="space-y-1.5 mt-3">
            {['user_profiles', 'chats', 'chat_messages', 'subscription_plans', 'subscriptions', 'usage_logs', 'feature_flags'].map(t => (
              <li key={t} className="flex items-center gap-2 text-[12px]">
                <Database size={12} className="text-[var(--m-accent-blue)]" /> {t}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Shield} title="Environment Variables">
          <CopyBlock text={`VITE_SUPABASE_URL=https://mtcugjtuiuxjgoyvzzvf.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key`} />
        </Section>

        <Section icon={Server} title="Setup">
          <CopyBlock text={`npm install
# Edit .env with your credentials
# Run supabase/schema.sql in Supabase SQL Editor
npm run dev`} />
        </Section>

        <Section icon={Lock} title="Authentication">
          <ul className="space-y-2">
            {['Email/Password Sign Up & Sign In', 'Google OAuth', 'Magic Link (passwordless)', 'Password Reset', 'Auto-refresh Sessions', 'Role-based Access'].map(item => (
              <li key={item} className="flex items-start gap-2">
                <Lock size={12} className="mt-1 text-[var(--m-accent-blue)] flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Zap} title="AI Architecture">
          <CopyBlock text={`interface AIProvider {
  id: string;
  name: string;
  model: string;
  sendMessage(messages: ChatMessage[]): Promise<ReadableStream>;
}
// Active: Gemini
// Future: OpenAI, Claude, GPT-4, DeepSeek`} />
        </Section>

        <Section icon={Globe} title="Deployment">
          <CopyBlock text={`npm run build
# Upload dist/ to Vercel, Netlify, or any static host`} />
        </Section>

        <div className="border-t border-white/[0.04] pt-8 mt-12">
          <div className="flex items-center gap-4">
            <Link to="/chat" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium bg-[var(--m-text-primary)] text-[var(--m-text-inverse)] hover:opacity-90 transition-opacity">
              <MessageSquare size={13} strokeWidth={1.5} /> Open M-Chat
            </Link>
            <Link to="/" className="text-[12px] text-[var(--m-text-muted)] hover:text-[var(--m-text-secondary)] transition-colors">Back to Landing</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
