import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ErrorNotes } from '../../components/common/ErrorNotes';
import { getLoadedErrorDataset, searchErrors } from '../errorEngine';
import { buildErrorNoteIssueUrl, buildErrorNoteDiscussionUrl, formatManualErrorNotes, getManualErrorNotes, type ManualErrorNote } from '../errorNotes';

const item = getLoadedErrorDataset().items.find((entry) => entry.code === 130472)!;
const note: ManualErrorNote = {
  id: 'github-issue-12', provider: 'meta', code: '130472', kind: 'observation',
  title: '测试场景', body: '仅用于测试的实测观察 <script>alert(1)</script>',
  author: 'tester', recordedAt: '2026-10-31', approvedBy: 'maintainer',
  issueUrl: 'https://github.com/citrusjunoss/whatsapp-media-checker/issues/12',
};

describe('人工备注', () => {
  it('预填固定模板并保持第三方错误码、子码和 URL 完整', () => {
    const url = new URL(buildErrorNoteIssueUrl({ ...item, provider: 'aliyun', code: 'isv.TEST:a+b', subcode: 0, docUrl: 'https://example.com/?a=1&b=2#details' }));
    expect(url.origin + url.pathname).toBe('https://github.com/citrusjunoss/whatsapp-media-checker/issues/new');
    expect(url.searchParams.get('template')).toBe('error_note.yml');
    expect(url.searchParams.get('title')).toBe('[人工备注][aliyun:isv.TEST:a+b:0]');
    expect(url.searchParams.get('provider')).toBe('aliyun');
    expect(url.searchParams.get('code')).toBe('isv.TEST:a+b');
    expect(url.searchParams.get('subcode')).toBe('0');
    expect(url.searchParams.get('official_url')).toBe('https://example.com/?a=1&b=2#details');
    expect(url.searchParams.has('labels')).toBe(false);
  });

  it('缺省服务商为 Meta，无可选信息时省略对应参数', () => {
    const url = new URL(buildErrorNoteIssueUrl({ ...item, provider: undefined, docUrl: undefined }));
    expect(url.searchParams.get('provider')).toBe('meta');
    expect(url.searchParams.has('subcode')).toBe(false);
    expect(url.searchParams.has('official_url')).toBe(false);
  });

  it('讨论链接按渠道、错误码及子码检索，不限制为未关闭 Issue', () => {
    const query = new URL(buildErrorNoteDiscussionUrl({ provider: 'meta', code: 190, subcode: 460 })).searchParams.get('q');
    expect(query).toBe('is:issue in:title "[人工备注][meta:190:460]"');
  });

  it('关联备注时兼容数字/字符串错误码，并隔离渠道和子码', () => {
    expect(getManualErrorNotes({ code: 130472 }, [note])).toEqual([note]);
    expect(getManualErrorNotes({ provider: 'aliyun', code: 130472 }, [note])).toEqual([]);
    expect(getManualErrorNotes({ code: 130472, subcode: 0 }, [note])).toEqual([]);
  });

  it('人工备注可以搜索，且仍遵循服务商筛选', () => {
    const data = [{ ...item, manualNotes: [note] }];
    expect(searchErrors('实测观察', 'all', data, 'meta')).toHaveLength(1);
    expect(searchErrors('实测观察', 'all', data, 'aliyun')).toHaveLength(0);
    expect(formatManualErrorNotes([note])).toContain('讨论来源：https://github.com/');
  });

  it('无备注时仍显示评论入口和空状态', () => {
    const markup = renderToStaticMarkup(<ErrorNotes item={{ ...item, manualNotes: [] }} />);
    expect(markup).toContain('暂无已收录备注');
    expect(markup).toContain('去评论');
    expect(markup).toContain('查看讨论');
    expect(markup).toContain('template=error_note.yml');
  });

  it('显示来源与审核人，用户正文作为文本转义', () => {
    const markup = renderToStaticMarkup(<ErrorNotes item={{ ...item, manualNotes: [note] }} />);
    expect(markup).toContain('maintainer');
    expect(markup).toContain('原始讨论');
    expect(markup).toContain('&lt;script&gt;');
    expect(markup).not.toContain('<script>');
  });
});
