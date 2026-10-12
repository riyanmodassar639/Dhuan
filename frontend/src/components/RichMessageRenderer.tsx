'use client';

import React from 'react';

interface RichMessageRendererProps {
  content: string;
  isUser?: boolean;
}

/**
 * RichMessageRenderer parses Markdown-like syntax into sleek, professional Tailwind UI.
 * Handles headings (###), bold (**text**), bullet lists (- item), numbered lists (1. item),
 * code snippets (`code`), and alert blocks (⚠️).
 */
export default function RichMessageRenderer({ content, isUser = false }: RichMessageRendererProps) {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');

  // Helper to format inline bold, code, and emphasis
  const formatInlineText = (text: string, userText: boolean) => {
    // Regex matches **bold**, `code`, or regular text
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong 
            key={idx} 
            className={`font-black ${userText ? 'text-white' : 'text-slate-900 tracking-tight'}`}
          >
            {inner}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const inner = part.slice(1, -1);
        return (
          <code 
            key={idx} 
            className={`px-1.5 py-0.5 rounded-md text-xs font-mono font-semibold ${
              userText 
                ? 'bg-slate-800 text-emerald-300' 
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
            }`}
          >
            {inner}
          </code>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Group contiguous list items for clean rendering
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'bullet' | 'number'; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'bullet') {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-2 space-y-1.5 text-xs sm:text-sm pl-1">
            {currentList.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                <span className={isUser ? 'text-white' : 'text-slate-700 leading-relaxed'}>
                  {formatInlineText(item, isUser)}
                </span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`numlist-${elements.length}`} className="my-2 space-y-2 text-xs sm:text-sm">
            {currentList.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {i + 1}
                </span>
                <span className={isUser ? 'text-white' : 'text-slate-700 leading-relaxed'}>
                  {formatInlineText(item, isUser)}
                </span>
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      elements.push(<div key={`spacer-${lineIdx}`} className="h-1.5" />);
      return;
    }

    // Heading: ### Heading or ## Heading
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
      flushList();
      const headingText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <div 
          key={`h-${lineIdx}`} 
          className="mt-2 mb-2 pb-1.5 border-b border-slate-100 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
            {formatInlineText(headingText, isUser)}
          </h4>
        </div>
      );
      return;
    }

    // Warning / Restriction Alert Card (starts with ⚠️)
    if (trimmed.startsWith('⚠️')) {
      flushList();
      const alertText = trimmed.replace(/^⚠️\s*/, '');
      elements.push(
        <div 
          key={`alert-${lineIdx}`} 
          className="my-2 p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-950 text-xs sm:text-sm font-medium leading-relaxed shadow-xs flex items-start gap-2.5"
        >
          <span className="text-base shrink-0 mt-0.5">⚠️</span>
          <div>{formatInlineText(alertText, false)}</div>
        </div>
      );
      return;
    }

    // Bullet List Item (- or * )
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.slice(2).trim();
      if (!currentList || currentList.type !== 'bullet') {
        flushList();
        currentList = { type: 'bullet', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // Numbered List Item (e.g. 1. , 2. )
    const numMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      const itemText = numMatch[1].trim();
      if (!currentList || currentList.type !== 'number') {
        flushList();
        currentList = { type: 'number', items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // Regular Paragraph Line
    flushList();
    elements.push(
      <p 
        key={`p-${lineIdx}`} 
        className={`text-xs sm:text-sm leading-relaxed ${
          isUser ? 'text-white font-medium' : 'text-slate-700'
        }`}
      >
        {formatInlineText(trimmed, isUser)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}
