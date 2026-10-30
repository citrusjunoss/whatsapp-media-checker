# WhatsApp 媒体文件检测与格式转换工具 (纯前端 / GitHub Pages)

针对 **WhatsApp Business Platform (Cloud API)** 与 **Meta Graph API (Resumable Upload)** 打造的纯前端媒体文件规范校验、格式转换与请求生成工具。100% 运行在浏览器本地，零服务器依赖，可直接一键部署至 GitHub Pages。

---

## 🌟 核心特性

### 1. 双模式专业检测
* **标准媒体模式 (`/PHONE_NUMBER_ID/media`)**：
  * **Image (图片)**: JPEG, PNG，大小 ≤ 5MB。
  * **Video (视频)**: MP4, 3GP，大小 ≤ 16MB，严格要求 H.264 视频编码 + AAC 音频编码，智能检测 FastStart (`moov` 在前)。
  * **Audio (音频)**: AAC, MP4, AMR, MP3, OGG (Opus)，大小 ≤ 16MB。
  * **Document (文档)**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT，大小 ≤ 100MB。
  * **Sticker (贴纸)**: WebP 格式，严格要求 **512 × 512 像素**，静态 ≤ 100KB，动态 ≤ 500KB。
* **模板 Header 模式 (Resumable Upload `/uploads`)**：
  * **Image (图片)**: 仅支持 JPEG、PNG，大小 ≤ 5MB。
  * **Video (视频)**: **仅限 MP4**（不支持 3GP），大小 ≤ 16MB，H.264 + AAC。
  * **Document (文档)**: **仅限 PDF (`application/pdf`)**（严格拦截 Word/Excel/PPT/TXT），大小 ≤ 100MB。
  * **🚫 音频与贴纸拦截**: 模板 Header 不支持任何音频或贴纸文件，上传即报红阻断并说明原因。

### 2. 深度二进制特征嗅探
* **Magic Bytes 识别**: 读取二进制文件头（如 `%PDF-`、`\xFF\xD8\xFF`、`\x89PNG`、`ftyp`），彻底识破假扩展名欺骗。
* **纯 JS MP4 Box 解析器**: 毫秒级遍历 MP4 顶层 Box，提取视音频编码 FourCC（`avc1` / `mp4a`）及 `moov` 和 `mdat` 的偏移次序，无需加载任何庞大依赖。
* **图片与音频参数提取**: 实时提取宽高比、512x512 贴纸合规性、音频声道数与采样率。

### 3. 纯前端修复与转换工具箱
* **图片智能压缩与格式转换**:
  * 任意格式转标准 JPG 或 PNG。
  * 自动二分画质调节，保证输出体积严格受控在 5MB 以内。
* **512×512 WebP 贴纸一键生成**:
  * 支持“等比留白（透明背景）”与“居中裁剪铺满”两种布局。
  * 自动多轮压缩，确保体积严格 ≤ 100 KB。
* **音频纯前端转 MP3**:
  * 基于 Web Audio API + `lamejs`，一键将非标音频（WAV、FLAC、M4A、OGG）重采样编码为 128kbps 标准 MP3。
* **视频 WebAssembly FFmpeg 转码**:
  * 借助 `@ffmpeg/ffmpeg` 与 `coi-serviceworker`，在 GitHub Pages 纯静态环境下直接运行 FFmpeg。
  * 将非 H.264 编码转为 `libx264` + `aac`，注入 `-movflags +faststart`，并将超标视频压缩到 16MB 以内。
  * 同时附带一键复制的终端命令备用。

### 4. Meta Graph API 请求一键生成
* 自动生成模板 Header Resumable Upload 第一步（`POST /uploads` 会话创建）、第二步（二进制流上传）的 cURL 命令与模板组件 JSON。
* 自动生成标准媒体上传（`POST /media`）与消息发送（`POST /messages`）的 cURL 命令与完整 Payload。

---

## 🚀 本地开发与构建

```bash
# 1. 克隆代码或进入项目目录
cd whatsapp-media-checker

# 2. 安装依赖
pnpm install

# 3. 启动本地开发服务器
pnpm run dev

# 4. 执行生产环境构建
pnpm run build

# 5. 预览生产环境静态产物
pnpm run preview
```

---

## 🌐 部署至 GitHub Pages

本项目已内置 `.github/workflows/deploy.yml` 与 `base: './'` 相对路径适配：

1. 在 GitHub 上新建一个仓库，并将本项目代码推送到 `main` 分支：
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of whatsapp media checker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. 进入 GitHub 仓库设置：**Settings** -> **Pages** -> **Build and deployment**。
3. 将 **Source** 选择为 **GitHub Actions**。
4. 推送后，GitHub Actions 将自动执行构建并将 `dist/` 部署上线。

---

## 📚 官方参考文档
* [WhatsApp Business Media API](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media)
* [Meta Graph API Resumable Upload Guide](https://developers.facebook.com/docs/graph-api/guides/upload)
