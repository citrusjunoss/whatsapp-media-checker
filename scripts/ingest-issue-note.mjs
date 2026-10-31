import { createHash } from 'node:crypto';

export const NOTE_APPROVAL_LABEL = 'note-approved';
export const NOTE_STATUS_MARKER = '<!-- manual-error-note-status -->';
export const NOTES_PATH = 'src/data/manual-error-notes.json';
const ERRORS_PATH = 'src/data/whatsapp-errors.json';
const HEADERS = [
  '备注类型', '服务商渠道', '错误代码', '错误子码（如有）', '官方说明链接',
  '发生场景与复现条件', '实践观察', '原因解读与处理建议', '证据与参考资料',
];

export function parseNoteIssue(body, dataset) {
  if (typeof body !== 'string' || !body.trim() || body.length > 40000) {
    throw new Error('备注正文为空或超过 40000 字符。');
  }
  const sections = new Map();
  const headings = [...body.matchAll(/^### (.+)\r?$/gm)].filter((match) => HEADERS.includes(match[1].trim()));
  headings.forEach((match, index) => {
    const key = match[1].trim();
    if (sections.has(key)) throw new Error(`字段重复：${key}`);
    const value = body.slice(match.index + match[0].length, headings[index + 1]?.index ?? body.length).trim();
    sections.set(key, value === '_No response_' ? '' : value);
  });
  const get = (key, required = true) => {
    const value = sections.get(key) || '';
    if (required && !value) throw new Error(`缺少必填字段：${key}`);
    if (value.length > 10000) throw new Error(`字段过长：${key}`);
    return value;
  };

  const kind = get('备注类型').split(' ')[0];
  if (!['observation', 'interpretation'].includes(kind)) throw new Error('备注类型无效。');
  const provider = get('服务商渠道').toLowerCase();
  if (!['meta', 'aliyun', 'twilio', 'other'].includes(provider)) throw new Error('服务商渠道无效。');
  const code = get('错误代码');
  if (!/^[a-zA-Z0-9_.:-]{1,128}$/.test(code)) throw new Error('错误代码格式无效。');
  const rawSubcode = get('错误子码（如有）', false);
  if (rawSubcode && (!/^\d+$/.test(rawSubcode) || !Number.isSafeInteger(Number(rawSubcode)))) {
    throw new Error('错误子码必须为非负安全整数。');
  }
  const subcode = rawSubcode ? Number(rawSubcode) : undefined;
  const item = dataset.items.find((entry) =>
    (entry.provider || 'meta') === provider && String(entry.code) === code && entry.subcode === subcode
  );
  if (!item) throw new Error('知识库中不存在对应的服务商、错误码和子码，请先使用新增错误码模板收录。');

  const officialUrl = get('官方说明链接', false);
  if (officialUrl) {
    let url;
    try { url = new URL(officialUrl); } catch { throw new Error('官方说明链接必须是有效 HTTPS URL。'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('官方说明链接必须是有效 HTTPS URL。');
  }
  const content = ['发生场景与复现条件', '实践观察', '原因解读与处理建议', '证据与参考资料']
    .map((key) => `${key}\n${get(key)}`).join('\n\n');
  return {
    provider, code: item.code, ...(subcode === undefined ? {} : { subcode }), kind,
    title: `${item.code} · ${kind === 'observation' ? '实践观察' : '补充解读'}`,
    body: content + (officialUrl ? `\n\n官方说明链接\n${officialUrl}` : ''),
  };
}

export function buildApprovedNote(issue, dataset, reviewer, repository) {
  const content = parseNoteIssue(issue.body, dataset);
  return {
    id: `github-issue-${issue.number}`,
    ...content,
    author: issue.user.login,
    // Display dates in the project's Asia/Shanghai timezone.
    recordedAt: new Date(Date.parse(issue.updated_at) + 8 * 3600_000).toISOString().slice(0, 10),
    approvedBy: reviewer,
    issueUrl: `https://github.com/${repository}/issues/${issue.number}`,
    sourceHash: createHash('sha256').update(`${issue.title}\n${issue.body}`).digest('hex'),
  };
}

export function upsertApprovedNote(notes, note) {
  if (!Array.isArray(notes)) throw new Error('人工备注数据必须是数组。');
  const existing = notes.find((entry) => entry.id === note.id);
  if (existing?.sourceHash === note.sourceHash) return { changed: false, notes };
  return {
    changed: true,
    notes: existing ? notes.map((entry) => entry.id === note.id ? note : entry) : [...notes, note],
  };
}

export async function updateNoteStatus(github, repo, issueNumber, message) {
  const comments = await github.paginate(github.rest.issues.listComments, { ...repo, issue_number: issueNumber, per_page: 100 });
  const previous = comments.find((comment) => comment.user?.login === 'github-actions[bot]' && comment.body?.startsWith(NOTE_STATUS_MARKER));
  const body = `${NOTE_STATUS_MARKER}\n${message}`;
  if (previous) {
    await github.rest.issues.updateComment({ ...repo, comment_id: previous.id, body });
  } else {
    await github.rest.issues.createComment({ ...repo, issue_number: issueNumber, body });
  }
}

async function readJson(github, repo, path) {
  const { data } = await github.rest.repos.getContent({ ...repo, path, ref: 'main' });
  if (Array.isArray(data) || data.encoding !== 'base64') throw new Error(`无法读取 ${path}`);
  return { value: JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')), sha: data.sha };
}

/** Only the body captured in a maintainer's label event can be published. */
export async function syncNoteIssue({ github, context, core }) {
  const repo = context.repo;
  const snapshot = context.payload.issue;
  const action = context.payload.action;
  core.setOutput('publish', 'false');
  const status = (message) => updateNoteStatus(github, repo, snapshot.number, message);
  const { data: current } = await github.rest.issues.get({ ...repo, issue_number: snapshot.number });

  // Stale queued events must never publish a subsequently edited body.
  if (snapshot.body !== current.body || snapshot.title !== current.title) {
    core.info('Issue 已变更，忽略旧事件，等待对新正文重新审核。');
    return;
  }
  const hasApproval = current.labels.some((label) => label.name === NOTE_APPROVAL_LABEL);
  if (action === 'edited' && (context.payload.changes?.body || context.payload.changes?.title) && hasApproval) {
    await github.rest.issues.removeLabel({ ...repo, issue_number: snapshot.number, name: NOTE_APPROVAL_LABEL });
  }

  if (action === 'labeled') {
    if (context.payload.label?.name !== NOTE_APPROVAL_LABEL || !hasApproval) return;
    const { data: permission } = await github.rest.repos.getCollaboratorPermissionLevel({ ...repo, username: context.payload.sender.login });
    if (!['admin', 'maintain', 'write'].includes(permission.permission) && !permission.user?.permissions?.push) {
      await github.rest.issues.removeLabel({ ...repo, issue_number: snapshot.number, name: NOTE_APPROVAL_LABEL });
      throw new Error('人工备注只能由具有 write、maintain 或 admin 权限的维护者审核。');
    }
  } else if (!['opened', 'edited'].includes(action)) {
    return;
  }

  try {
    const { value: dataset } = await readJson(github, repo, ERRORS_PATH);
    parseNoteIssue(snapshot.body, dataset);
    if (action !== 'labeled') {
      await status('✅ 人工备注格式校验通过。请维护者审核正文后添加 `note-approved` 标签；将自动同步到站点。修改正文需重新审核，普通评论不自动收录。已发布的旧版本在重新审核前保持不变。');
      return;
    }

    const note = buildApprovedNote(snapshot, dataset, context.payload.sender.login, `${repo.owner}/${repo.repo}`);
    // Optimistic concurrency: retry if another approved Issue updated this file.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { value: notes, sha } = await readJson(github, repo, NOTES_PATH);
      const result = upsertApprovedNote(notes, note);
      if (!result.changed) break;
      try {
        await github.rest.repos.createOrUpdateFileContents({
          ...repo, path: NOTES_PATH, branch: 'main', sha,
          message: `docs(notes): sync approved issue #${snapshot.number}`,
          content: Buffer.from(`${JSON.stringify(result.notes, null, 2)}\n`).toString('base64'),
        });
        break;
      } catch (error) {
        if (error.status !== 409 || attempt === 2) throw error;
      }
    }
    // Publish even on a no-op so rerunning can recover a failed Pages deployment.
    core.setOutput('publish', 'true');
    await status('✅ 审核通过，人工备注已同步到仓库。正在更新 GitHub Pages；完成后此回执会更新。');
  } catch (error) {
    await status(`❌ 人工备注未完成同步：${error.message}\n\n修正正文后请重新添加 \`note-approved\`；若仅为服务故障，可重新运行此工作流。`);
    throw error;
  }
}
