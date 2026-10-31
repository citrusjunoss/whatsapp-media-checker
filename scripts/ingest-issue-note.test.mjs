import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildApprovedNote, parseNoteIssue, upsertApprovedNote, syncNoteIssue, NOTES_PATH } from './ingest-issue-note.mjs';

const dataset = { items: [{ code: 130472, provider: 'meta' }, { code: 'isv.TEST', provider: 'aliyun', subcode: 0 }] };
const body = `### 备注类型
observation (实践观察)
### 服务商渠道
meta
### 错误代码
130472
### 错误子码（如有）
_No response_
### 官方说明链接
https://developers.facebook.com/docs/whatsapp/
### 发生场景与复现条件
测试环境中的复现条件
### 实践观察
1/10 失败，尚未独立复验
### 原因解读与处理建议
个人推测，待核验
### 证据与参考资料
待补充`;
const issue = { number: 12, title: '[人工备注][meta:130472]', body, user: { login: 'reporter' }, updated_at: '2026-10-30T18:00:00Z', labels: [{ name: 'manual-note' }, { name: 'note-approved' }] };

test('固定表单解析保留来源，不写入官方说明', () => {
  const result = parseNoteIssue(body.replaceAll('\n', '\r\n'), dataset);
  assert.equal(result.code, 130472);
  assert.equal(result.kind, 'observation');
  assert.match(result.body, /1\/10 失败/);
  assert.match(result.body, /官方说明链接/);
  assert.equal(result.detailsZh, undefined);
  const template = readFileSync(new URL('../.github/ISSUE_TEMPLATE/error_note.yml', import.meta.url), 'utf8');
  for (const header of [...body.matchAll(/^### (.+)$/gm)]) assert.ok(template.includes(`label: ${header[1]}`));
});

test('第三方错误码与零子码准确关联', () => {
  const text = body.replace('\nmeta\n', '\naliyun\n').replace('\n130472\n', '\nisv.TEST\n').replace('_No response_', '0');
  assert.equal(parseNoteIssue(text, dataset).subcode, 0);
});

test('拒绝缺字段、重复字段、未知渠道/错误码/子码和不安全链接', () => {
  for (const invalid of [
    body.replace('个人推测，待核验', '_No response_'),
    `${body}\n### 错误代码\n190`,
    body.replace('\nmeta\n', '\nunknown\n'),
    body.replace('\n130472\n', '\n999999\n'),
    body.replace('_No response_', '-1'),
    body.replace('_No response_', '9007199254740992'),
    body.replace('https://developers.facebook.com/docs/whatsapp/', 'javascript:alert(1)'),
    body.replace('https://developers.facebook.com/docs/whatsapp/', 'https://user:secret@example.com'),
    'x'.repeat(40001),
  ]) assert.throws(() => parseNoteIssue(invalid, dataset));
});

test('审核记录带稳定 Issue ID、审核人、北京时间与正文指纹；重复审核幂等', () => {
  const note = buildApprovedNote(issue, dataset, 'maintainer', 'owner/repo');
  assert.equal(note.id, 'github-issue-12');
  assert.equal(note.recordedAt, '2026-10-31');
  assert.equal(note.approvedBy, 'maintainer');
  assert.equal(note.issueUrl, 'https://github.com/owner/repo/issues/12');
  const first = upsertApprovedNote([], note);
  assert.equal(first.changed, true);
  assert.equal(upsertApprovedNote(first.notes, note).changed, false);
  const changed = buildApprovedNote({ ...issue, body: body.replace('1/10', '2/10') }, dataset, 'maintainer', 'owner/repo');
  const updated = upsertApprovedNote(first.notes, changed);
  assert.equal(updated.notes.length, 1);
  assert.match(updated.notes[0].body, /2\/10/);
});

function harness({ action = 'labeled', permission = 'write', current = issue, notes = [], conflict = false, invalid = false } = {}) {
  const state = { writes: [], comments: [], removed: [], outputs: {}, attempts: 0 };
  const snapshot = invalid ? { ...issue, body: body.replace('\nmeta\n', '\nunknown\n') } : issue;
  const context = { repo: { owner: 'owner', repo: 'repo' }, payload: {
    action, issue: snapshot, sender: { login: 'maintainer' }, label: { name: 'note-approved' },
    ...(action === 'edited' ? { changes: { body: { from: 'old' } } } : {}),
  } };
  const github = { rest: {
    issues: {
      get: async () => ({ data: invalid ? snapshot : current }),
      listComments: () => {},
      createComment: async ({ body: message }) => { state.comments.push(message); },
      updateComment: async ({ body: message }) => { state.comments.push(message); },
      removeLabel: async (args) => { state.removed.push(args.name); },
    },
    repos: {
      getCollaboratorPermissionLevel: async () => ({ data: { permission } }),
      getContent: async ({ path }) => ({ data: {
        sha: 'sha', encoding: 'base64', content: Buffer.from(JSON.stringify(path === NOTES_PATH ? notes : dataset)).toString('base64'),
      } }),
      createOrUpdateFileContents: async (args) => {
        state.attempts++;
        if (conflict && state.attempts === 1) throw Object.assign(new Error('Conflict'), { status: 409 });
        state.writes.push(args);
      },
    },
  }, paginate: async () => [] };
  const core = { setOutput: (key, value) => { state.outputs[key] = value; }, info: () => {} };
  return { state, run: () => syncNoteIssue({ github, context, core }) };
}

test('新 Issue 只校验并回执，不写数据、不发布', async () => {
  const h = harness({ action: 'opened' });
  await h.run();
  assert.equal(h.state.writes.length, 0);
  assert.equal(h.state.outputs.publish, 'false');
  assert.match(h.state.comments[0], /校验通过/);
});

test('审核后只提交人工备注文件并请求发布', async () => {
  const h = harness();
  await h.run();
  assert.equal(h.state.writes.length, 1);
  assert.equal(h.state.writes[0].path, NOTES_PATH);
  assert.equal(h.state.writes[0].branch, 'main');
  const records = JSON.parse(Buffer.from(h.state.writes[0].content, 'base64'));
  assert.equal(records[0].author, 'reporter');
  assert.equal(h.state.outputs.publish, 'true');
});

test('无写权限者不能批准收录', async () => {
  const h = harness({ permission: 'triage' });
  await assert.rejects(h.run(), /维护者审核/);
  assert.equal(h.state.writes.length, 0);
  assert.deepEqual(h.state.removed, ['note-approved']);
});

test('审核后编辑撤销标签，只保留已发布版本等待重新审核', async () => {
  const h = harness({ action: 'edited' });
  await h.run();
  assert.deepEqual(h.state.removed, ['note-approved']);
  assert.equal(h.state.writes.length, 0);
  assert.equal(h.state.outputs.publish, 'false');
});

test('正文变更或审核标签撤回后，旧审核事件不能发布', async () => {
  for (const current of [{ ...issue, body: `${body}\n已编辑` }, { ...issue, labels: [] }]) {
    const h = harness({ current });
    await h.run();
    assert.equal(h.state.writes.length, 0);
    assert.equal(h.state.outputs.publish, 'false');
  }
});

test('已入库 Issue 可重跑发布以恢复 Pages 失败，不生成重复记录', async () => {
  const note = buildApprovedNote(issue, dataset, 'maintainer', 'owner/repo');
  const h = harness({ notes: [note] });
  await h.run();
  assert.equal(h.state.writes.length, 0);
  assert.equal(h.state.outputs.publish, 'true');
});

test('并发写入冲突会重新读取再尝试提交', async () => {
  const h = harness({ conflict: true });
  await h.run();
  assert.equal(h.state.attempts, 2);
  assert.equal(h.state.writes.length, 1);
});

test('格式不合法即使有审核标签也不能写入', async () => {
  const h = harness({ invalid: true });
  await assert.rejects(h.run(), /服务商渠道无效/);
  assert.equal(h.state.writes.length, 0);
  assert.equal(h.state.outputs.publish, 'false');
  assert.match(h.state.comments[0], /未完成同步/);
});
