import React from 'react';
import { ExternalLink, MessageSquare } from 'lucide-react';
import type { WhatsAppErrorItem } from '../../core/errorEngine';
import { buildErrorNoteDiscussionUrl, buildErrorNoteIssueUrl, NOTE_KIND_LABELS } from '../../core/errorNotes';

export const ErrorNotes: React.FC<{ item: WhatsAppErrorItem }> = ({ item }) => {
  const notes = item.manualNotes || [];
  const linkClass = 'inline-flex items-center gap-1.5 rounded-md border app-border px-2.5 py-1.5 app-text-main app-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

  return (
    <section aria-label="人工备注与实践经验" className="min-w-0 rounded-lg border app-border app-surface p-3.5 space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 font-semibold app-text-main">
          <MessageSquare className="w-4 h-4 shrink-0" />
          人工备注{notes.length > 0 && `（${notes.length}）`}
        </h3>
        <div className="flex flex-wrap gap-2">
          <a href={buildErrorNoteDiscussionUrl(item)} target="_blank" rel="noopener noreferrer" className={linkClass}>
            查看讨论<ExternalLink className="w-3 h-3 shrink-0" />
          </a>
          <a href={buildErrorNoteIssueUrl(item)} target="_blank" rel="noopener noreferrer" className={linkClass}>
            去评论<ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </div>
      <p className="app-text-muted leading-relaxed">
        经验和解读不等同于官方规则。去评论将在 GitHub 打开预填模板，审核通过后自动同步到本站。
      </p>
      {notes.length === 0 ? (
        <p className="app-text-muted leading-relaxed">暂无已收录备注。遇到边界情况或有实测结论，可以补充第一条。</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <article key={note.id} className="rounded-md border app-border app-surface-subtle p-3 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold app-text-main break-words">{note.title}</h4>
                <span className="rounded border app-border px-1.5 py-0.5 text-[10px] app-text-muted">{NOTE_KIND_LABELS[note.kind]}</span>
              </div>
              <p className="text-[11px] app-text-muted break-words">{note.author} · 收录于 <time dateTime={note.recordedAt}>{note.recordedAt}</time></p>
              {note.approvedBy && <p className="text-[11px] app-text-muted">审核：{note.approvedBy}</p>}
              <p className="whitespace-pre-wrap break-words leading-relaxed app-text-main">{note.body}</p>
              {note.issueUrl && (
                <a href={note.issueUrl} target="_blank" rel="noopener noreferrer" className={`${linkClass} text-[11px]`}>
                  原始讨论<ExternalLink className="w-3 h-3" />
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
