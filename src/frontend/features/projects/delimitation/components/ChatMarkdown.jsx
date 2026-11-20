"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatMarkdown({ content }) {
  return (
    <div className="text-xs font-serif leading-relaxed text-slate-700 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-800">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="my-2 ml-5 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-5 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => (
            <h1 className="mt-3 mb-2 text-sm font-bold text-slate-800">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 mb-2 text-sm font-bold text-slate-800">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 mb-2 text-xs font-bold text-slate-800">
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-slate-300 pl-3 italic text-slate-600">
              {children}
            </blockquote>
          ),
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800">
                  {children}
                </code>
              );
            }

            return (
              <code className="block overflow-x-auto rounded-xl bg-slate-900 px-3 py-2 font-mono text-[11px] text-slate-100">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-xl bg-slate-900">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-[#005944] underline underline-offset-2"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-3 border-slate-200" />,
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-[11px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-slate-200 px-2 py-1 text-left font-bold text-slate-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-200 px-2 py-1 text-slate-700">
              {children}
            </td>
          ),
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}