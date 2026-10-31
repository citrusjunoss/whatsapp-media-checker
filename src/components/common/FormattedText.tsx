import React from 'react';
import { ExternalLink } from 'lucide-react';

interface FormattedTextProps {
  text: string;
  className?: string;
  linkColor?: string;
  showExternalIcon?: boolean;
}

/**
 * Renders text containing Markdown links [title](url), `code`, **bold**, and line breaks,
 * with click stop-propagation to prevent toggling parent checkboxes or drawers.
 */
export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  className = '',
  linkColor = 'text-emerald-400 hover:text-emerald-300 underline font-medium',
  showExternalIcon = true,
}) => {
  if (!text) return null;

  // Unescape common HTML entities if any
  const normalized = text
    .replace(/&lt;br\s*\/?&gt;/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&');

  // Regex to match markdown links [label](url), inline code `code`, and bold **text**
  // Captures:
  // 1, 2: [label](url)
  // 3: `code`
  // 4: **bold**
  const tokenRegex = /(?:\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(?:`([^`]+)`)|(?:\*\*([^*]+)\*\*)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(normalized)) !== null) {
    const matchIndex = match.index;

    // Plain text before match
    if (matchIndex > lastIndex) {
      elements.push(normalized.substring(lastIndex, matchIndex));
    }

    if (match[1] && match[2]) {
      // Markdown link [label](url)
      const label = match[1];
      const href = match[2];
      elements.push(
        <a
          key={`link-${matchIndex}`}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-0.5 cursor-pointer transition-colors ${linkColor}`}
          title={`打开官方指引：${href}`}
        >
          <span>{label}</span>
          {showExternalIcon && <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-80" />}
        </a>
      );
    } else if (match[3]) {
      // Inline code `code`
      elements.push(
        <code
          key={`code-${matchIndex}`}
          className="px-1 py-0.5 mx-0.5 rounded bg-black/20 dark:bg-white/10 font-mono text-[11px] text-amber-400 dark:text-amber-300 border border-black/10 dark:border-white/10"
        >
          {match[3]}
        </code>
      );
    } else if (match[4]) {
      // Bold text **bold**
      elements.push(
        <strong key={`bold-${matchIndex}`} className="font-semibold text-inherit">
          {match[4]}
        </strong>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  // Remaining plain text after last match
  if (lastIndex < normalized.length) {
    elements.push(normalized.substring(lastIndex));
  }

  return <span className={className}>{elements}</span>;
};
