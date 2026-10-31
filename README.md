# WhatsApp 开发者综合工具箱 (纯前端 / GitHub Pages)

一款针对 **WhatsApp Business Platform (Cloud API)** 与 **Meta Graph API** 打造的纯前端综合开发诊断工具箱。100% 运行在浏览器本地，零服务器依赖，可直接一键部署至 GitHub Pages。

---

## 🌟 核心功能模块

### 1. 📁 媒体文件工具（Media Inspector & Converter）
* **标准媒体模式 (`/PHONE_NUMBER_ID/media`)**：
  * **Image (图片)**: JPEG, PNG，大小 ≤ 5MB。
  * **Video (视频)**: MP4, 3GP，大小 ≤ 16MB，严格要求 H.264 视频编码 + AAC 音频编码，智能检测 FastStart (`moov` 在前)。
  * **Audio (音频)**: AAC, MP4, AMR, MP3, OGG (Opus)，大小 ≤ 16MB。
  * **Document (文档)**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT，大小 ≤ 100MB。
  * **Sticker (贴纸)**: WebP 格式，严格要求 **512 × 512 像素**，静态 ≤ 100KB，动态 ≤ 500KB。
* **模板 Header 模式 (Resumable Upload `/uploads`)**：
  * **严格限制白名单**：
    * 图片：仅支持 JPEG、PNG（≤ 5MB）
    * 视频：**仅限 MP4**（≤ 16MB，不支持 3GP）
    * 文档：**仅限 PDF (`application/pdf`)**（≤ 100MB，**严格拦截 Word/Excel/PPT/TXT**）
  * **🚫 阻断拦截**：音频与贴纸在模板 Header 中不支持，上传即报红阻断并说明原因。
* **纯前端修复/转换工具箱**：
  * 图片一键转 JPG/PNG & Canvas 自适应压缩至 ≤ 5MB。
  * 任意图片一键裁剪/留白转 512×512 WebP 贴纸（体积 ≤ 100KB）。
  * 纯前端 Web Audio API + `lamejs` 音频转标准 MP3。
  * 纯前端 WebAssembly FFmpeg 视频转码（H.264 + AAC + FastStart + 16MB 压缩）。
* **API 请求生成器**：实时生成对应模式的 cURL 请求命令与模板 Header `example.header_handle` JSON 配置。

---

### 2. 🔍 WhatsApp API 错误速查（Error Lookup）
* **秒级双语搜索**：
  * 支持输入 **数字代码**（如 `131047`、`131026`、`130429`、`190`、`100` 等）。
  * 支持输入 **中文关键词**（如 `24小时`、`模板变量`、`限流`、`未注册`、`支付异常` 等）。
  * 支持输入 **英文关键词**（如 `undeliverable`、`window`、`throughput`、`rate limit`、`expired` 等）。
* **分类筛选**：
  * 消息发送与接收 (131xxx)
  * 消息模板 (132xxx)
  * 频率与流控限制 (130xxx)
  * 多媒体上传与下载 (131052/53)
  * 身份鉴权与令牌 (190, 200)
  * 商业账号与封禁 (368, 131042)
  * 号码注册与验证 (133xxx)
  * 常规 Graph API 错误
* **高频错误快捷标签**：一键直达核心高频错误码。
* **详尽诊断与排错指引**：
  * 中英双语标题与描述对照。
  * 官方推荐排查与解决方案（Resolution）。
  * 标准 JSON 报错响应结构（Error Payload）展开预览。
  * 一键复制格式化诊断报告文本。
  * Meta 官方文档原文深层链接。
* **人工备注与实践评论**：
  * 每个错误详情页提供「去评论」，跳转仓库 Issue 的固定人工备注表单，自动填写服务商、错误码、子码（如有）和官方链接。
  * 「查看讨论」按服务商和错误码查找已有 Issue（含已关闭讨论），可在原 Issue 继续评论。请保留预填标题前缀，以便检索。
  * 表单分别收集复现条件、实践观察、原因解读和证据，要求区分 AI 解读、个人推测与已验证结论。
  * 提交后自动校验格式；具有仓库 write/maintain/admin 权限的维护者审核正文并添加 `note-approved` 标签后，自动更新 `src/data/manual-error-notes.json` 并发布 GitHub Pages。Issue 中的固定回执会显示同步和发布结果。
  * 人工备注独立存储，不会被官方错误码同步覆盖，支持关键词搜索，并包含在默认详情组件的复制报告中。

#### 审核与自动同步人工备注

工作流为 `.github/workflows/sync-error-notes.yml`。首次使用需将此功能合入 `main`，并在仓库创建 `manual-note` 和 `note-approved` 标签；保留现有 Pages 的 GitHub Actions 配置。仓库规则须允许该工作流使用 `GITHUB_TOKEN` 更新 `main` 的备注数据文件；若分支保护阻止提交，工作流会失败并回执，不会绕过保护。

1. 用户从详情页「去评论」提交固定模板，维护者可在 Issue 中讨论、要求补充证据。
2. 校验通过后，维护者审核 **Issue 正文**，添加 `note-approved`。普通评论不作为待发布正文；需要收录的补充先整理到正文中。
3. 工作流校验审核者权限、服务商/错误码/子码及必填内容，只写人工备注文件，再显式调用现有 Pages 工作流。无需 PAT，也不依赖机器人 push 触发发布。
4. 同一 Issue 重复运行不会重复收录。编辑正文或标题会移除审核标签，站点保留此前已审核版本；再次添加标签后才会更新。移除标签本身不删除已发布备注，撤回收录需由维护者删除对应数据记录。
5. 回执区分“已同步仓库”和“已发布站点”。发布失败时检查 Actions 日志并重新运行本次工作流，可补发而不会追加重复备注。

备注按 Issue 编号保持稳定 `id`，以 `provider + code + subcode` 关联错误；保存提交者、审核者、北京时间收录日期、原始 Issue 链接和正文指纹。正文作为纯文本展示，与官方说明分开；官方定期同步不会覆盖人工备注。初始数据为空，示例场景不会未经 Issue 审核直接收录。

---

### 3. 🔄 GitHub Action 定期自动同步
* **工作流**：`.github/workflows/sync-errors.yml`
* **触发机制**：每周一凌晨 02:00 UTC 定时自动执行，或通过 GitHub 页面手动 `workflow_dispatch` 触发。
* **同步逻辑**：
  * 运行 `pnpm run sync:errors`（执行 `scripts/sync-errors.mjs`）。
  * 从 Meta 开发者平台官方文档页面（`https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes`）抓取最新的错误码与官方说明。
  * 智能增量合并至 `src/data/whatsapp-errors.json`，保留已有中文翻译与排错知识库。
  * 若产生变更，GitHub Action 会自动提交并推送到 `main` 分支，进而触发 GitHub Pages 自动重构上线。

---

## 🚀 本地开发与构建

```bash
# 1. 进入项目目录
cd whatsapp-media-checker

# 2. 安装依赖
pnpm install

# 3. 同步最新错误码数据
pnpm run sync:errors

# 4. 运行单元测试
pnpm test

# 5. 启动本地开发服务器
pnpm run dev

# 6. 执行生产构建
pnpm run build
```

---

## 🌐 部署至 GitHub Pages

本项目已配置 `base: './'` 相对路径及 `.github/workflows/deploy.yml`：
1. 将代码推送到 GitHub 仓库的 `main` 分支。
2. 在仓库设置中：**Settings** -> **Pages** -> **Build and deployment** -> **Source** 选择 **GitHub Actions**。
3. 推送后 GitHub Actions 将自动构建并上线。

---

## 📚 官方参考文档
* [WhatsApp Business Media API](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media)
* [Meta Graph API Resumable Upload Guide](https://developers.facebook.com/docs/graph-api/guides/upload)
* [WhatsApp Cloud API Error Codes](https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes)
