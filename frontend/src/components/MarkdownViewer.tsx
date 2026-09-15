'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Terminal } from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function CodeBlock({ className, children, ...props }: CodeProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const rawString = React.Children.toArray(children).join('');
  const isBlock = Boolean(lang) || rawString.includes('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(rawString.replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isBlock) {
    return (
      <code
        className="px-1.5 py-0.5 mx-0.5 rounded font-mono text-[12px] bg-[#21262d] text-[#79c0ff] border border-[#30363d]"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="my-3 rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] text-[#8b949e]">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-[#58a6ff]" />
          <span className="text-[#c9d1d9]">{lang || 'snippet'}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 text-[11px] text-[#8b949e] hover:text-[#f0f6fc] px-1.5 py-0.5 rounded hover:bg-[#21262d] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">복사됨</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>복사</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto font-mono text-[12px] leading-relaxed text-[#e6edf3] bg-transparent">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  if (!content) return null;

  return (
    <div className={`markdown-viewer text-xs sm:text-sm text-[#c9d1d9] leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: CodeBlock,
          h1: ({ children }) => (
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] mt-4 mb-2 pb-1 border-b border-[#30363d]">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-sm sm:text-base font-bold text-[#f0f6fc] mt-3.5 mb-2 pb-1 border-b border-[#30363d]/60">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-semibold text-[#f0f6fc] mt-3 mb-1.5 flex items-center gap-1.5">
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h5 className="text-xs font-semibold text-[#f0f6fc] mt-2.5 mb-1">
              {children}
            </h5>
          ),
          p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-2 ml-4 list-disc space-y-1 text-[#c9d1d9] marker:text-[#58a6ff]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-4 list-decimal space-y-1 text-[#c9d1d9] marker:text-[#58a6ff] marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 pl-3.5 pr-3 py-2 rounded-r-md border-l-3 border-[#58a6ff] bg-[#161b22] text-[#8b949e] italic text-xs sm:text-sm">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-[#30363d]">
              <table className="w-full text-left border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#21262d] text-[#f0f6fc] border-b border-[#30363d] font-semibold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#30363d]/60 bg-[#161b22]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[#21262d]/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-[#f0f6fc]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-[#c9d1d9]">
              {children}
            </td>
          ),
          hr: () => <hr className="my-4 border-[#30363d]" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#58a6ff] hover:underline font-medium break-all"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[#f0f6fc]">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
