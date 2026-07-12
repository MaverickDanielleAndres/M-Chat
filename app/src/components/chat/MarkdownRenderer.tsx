import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';
import { cn, copyToClipboard, downloadFile } from '@/lib/utils';
import { useStore } from '@/store/useStore';

SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('md', markdown);

interface CodeBlockProps {
  language: string;
  code: string;
  isDark: boolean;
}

function CodeBlock({ language, code, isDark }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const ext = language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language;
    downloadFile(code, `code.${ext}`, 'text/plain');
  };

  return (
    <div className="code-block-wrapper my-3 rounded-[var(--m-radius-md)] border border-[var(--m-border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--m-bg-base)] border-b border-[var(--m-border-subtle)]">
        <span className="text-xs font-mono text-[var(--m-text-secondary)] uppercase">
          {language || 'text'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-[var(--m-bg-surface)] text-[var(--m-text-secondary)] transition-colors"
            aria-label="Copy code"
          >
            {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-md hover:bg-[var(--m-bg-surface)] text-[var(--m-text-secondary)] transition-colors"
            aria-label="Download code"
          >
            <Download size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      {/* Code */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '13px',
          lineHeight: '1.6',
          background: isDark ? '#1a1a1a' : '#f7f7f5',
        }}
        showLineNumbers
        lineNumberStyle={{
          color: isDark ? '#555' : '#aaa',
          fontSize: '11px',
          minWidth: '2em',
          paddingRight: '1em',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  isStreaming,
}: MarkdownRendererProps) {
  const { settings } = useStore();
  const isDark = settings.theme === 'dark' ||
    (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (!content) {
    if (isStreaming) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-[var(--m-accent-blue)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-[var(--m-accent-blue)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-[var(--m-accent-blue)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      );
    }
    return null;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';
          const code = String(children).replace(/\n$/, '');

          if (language) {
            return <CodeBlock language={language} code={code} isDark={isDark} />;
          }

          return (
            <code
              className={cn(
                'px-1.5 py-0.5 rounded text-sm font-mono',
                'bg-[var(--m-bg-base)] text-[var(--m-text-primary)]'
              )}
              {...props}
            >
              {children}
            </code>
          );
        },
        pre({ children }) {
          return <>{children}</>;
        },
        p({ children }) {
          return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
        },
        h1({ children }) {
          return <h1 className="text-xl font-semibold mt-6 mb-3">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-lg font-semibold mt-5 mb-2">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>;
        },
        ul({ children }) {
          return <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>;
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-[var(--m-accent-blue)] pl-4 my-3 text-[var(--m-text-secondary)] italic">
              {children}
            </blockquote>
          );
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          );
        },
        thead({ children }) {
          return <thead className="bg-[var(--m-bg-base)]">{children}</thead>;
        },
        th({ children }) {
          return (
            <th className="text-left px-3 py-2 font-medium border border-[var(--m-border-subtle)]">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="px-3 py-2 border border-[var(--m-border-subtle)]">{children}</td>
          );
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--m-accent-blue)] hover:underline"
            >
              {children}
            </a>
          );
        },
        hr() {
          return <hr className="my-4 border-[var(--m-border-subtle)]" />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
});
