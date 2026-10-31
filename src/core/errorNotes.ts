import notesData from '../data/manual-error-notes.json';
import type { WhatsAppErrorItem } from './errorEngine';

export interface ManualErrorNote {
  id: string;
  provider: string;
  code: string | number;
  subcode?: number;
  kind: 'observation' | 'interpretation';
  title: string;
  body: string;
  author: string;
  recordedAt: string;
  approvedBy?: string;
  sourceHash?: string;
  issueUrl?: string;
}

type ErrorIdentity = Pick<WhatsAppErrorItem, 'provider' | 'code' | 'subcode'>;
const REPOSITORY_ISSUES = 'https://github.com/citrusjunoss/whatsapp-media-checker/issues';

export const NOTE_KIND_LABELS: Record<ManualErrorNote['kind'], string> = {
  observation: '实践观察',
  interpretation: '补充解读',
};

export function getManualErrorNotes(item: ErrorIdentity, notes: ManualErrorNote[] = notesData as ManualErrorNote[]): ManualErrorNote[] {
  return notes.filter((note) =>
    note.provider === (item.provider || 'meta') &&
    String(note.code) === String(item.code) &&
    note.subcode === item.subcode
  );
}

function getDiscussionTitle(item: ErrorIdentity): string {
  const subcode = item.subcode === undefined ? '' : `:${item.subcode}`;
  return `[人工备注][${item.provider || 'meta'}:${item.code}${subcode}]`;
}

export function buildErrorNoteIssueUrl(item: WhatsAppErrorItem): string {
  const params = new URLSearchParams({
    template: 'error_note.yml',
    title: getDiscussionTitle(item),
    provider: item.provider || 'meta',
    code: String(item.code),
  });
  if (item.subcode !== undefined) params.set('subcode', String(item.subcode));
  if (item.docUrl) params.set('official_url', item.docUrl);
  return `${REPOSITORY_ISSUES}/new?${params}`;
}

export function buildErrorNoteDiscussionUrl(item: ErrorIdentity): string {
  // Search open and closed discussions; include provider and subcode to avoid collisions.
  const params = new URLSearchParams({ q: `is:issue in:title "${getDiscussionTitle(item)}"` });
  return `${REPOSITORY_ISSUES}?${params}`;
}

export function formatManualErrorNotes(notes: ManualErrorNote[] = []): string {
  if (!notes.length) return '暂无已收录人工备注。';
  return notes.map((note) =>
    `${note.title}\n${NOTE_KIND_LABELS[note.kind]} | ${note.author} | ${note.recordedAt}\n${note.body}${note.issueUrl ? `\n讨论来源：${note.issueUrl}` : ''}`
  ).join('\n\n');
}
