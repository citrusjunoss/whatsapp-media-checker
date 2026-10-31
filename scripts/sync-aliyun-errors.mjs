#!/usr/bin/env node

/**
 * WhatsApp DevTools - Alibaba Cloud ChatApp Error Codes Synchronizer
 *
 * Source: https://help.aliyun.com/zh/chatapp/developer-reference/api-error-codes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../src/data/whatsapp-errors.json');
const ALIYUN_DOCS_URL = 'https://help.aliyun.com/zh/chatapp/developer-reference/api-error-codes';

function categorize(code, desc) {
  const c = code.toLowerCase();
  const d = desc.toLowerCase();

  if (
    c.includes('template') ||
    c.includes('footer') ||
    c.includes('header') ||
    c.includes('button') ||
    c.includes('variable') ||
    c.includes('language') ||
    c.includes('auditstatus') ||
    c.includes('autofill') ||
    d.includes('模板') ||
    d.includes('变量') ||
    d.includes('按钮')
  ) {
    return { category: 'template', categoryNameZh: '消息模板与组件' };
  }

  if (
    c.includes('auth') ||
    c.includes('token') ||
    c.includes('noauth') ||
    c.includes('notsub') ||
    d.includes('权限') ||
    d.includes('无权')
  ) {
    return { category: 'authentication', categoryNameZh: '身份鉴权与权限' };
  }

  if (
    c.includes('rate') ||
    c.includes('limit') ||
    c.includes('qps') ||
    c.includes('duration') ||
    d.includes('频控') ||
    d.includes('流控') ||
    d.includes('频率')
  ) {
    return { category: 'rate_limit', categoryNameZh: '频率与流控限制' };
  }

  if (
    c.includes('media') ||
    c.includes('image') ||
    c.includes('video') ||
    c.includes('audio') ||
    c.includes('document') ||
    c.includes('sticker') ||
    c.includes('link') ||
    c.includes('file') ||
    d.includes('图片') ||
    d.includes('视频') ||
    d.includes('贴纸') ||
    d.includes('音频') ||
    d.includes('文件')
  ) {
    return { category: 'media', categoryNameZh: '多媒体处理' };
  }

  if (
    c.includes('phone') ||
    c.includes('register') ||
    c.includes('custspaceid') ||
    c.includes('waba') ||
    c.includes('signup') ||
    c.includes('err-api') ||
    d.includes('号码') ||
    d.includes('waba') ||
    d.includes('注册') ||
    d.includes('坐席')
  ) {
    return { category: 'registration', categoryNameZh: '号码与WABA托管' };
  }

  if (
    c.includes('message') ||
    c.includes('send') ||
    c.includes('reaction') ||
    c.includes('interactive') ||
    c.includes('from') ||
    c.includes('to') ||
    c.includes('text') ||
    c.includes('location') ||
    c.includes('latitude') ||
    c.includes('longitude') ||
    d.includes('发送') ||
    d.includes('消息')
  ) {
    return { category: 'messaging', categoryNameZh: '消息发送与接收' };
  }

  if (
    c.includes('system') ||
    c.includes('server') ||
    d.includes('系统')
  ) {
    return { category: 'general', categoryNameZh: '系统与网关服务' };
  }

  return { category: 'general', categoryNameZh: '常规与参数校验' };
}

function determineSeverity(code, desc) {
  const c = code.toLowerCase();
  const d = desc.toLowerCase();

  if (
    c.includes('noauth') ||
    c.includes('notsub') ||
    c.includes('blocked') ||
    c.includes('fromerrorstatus') ||
    c.includes('err-api-0105') ||
    d.includes('无权') ||
    d.includes('封禁') ||
    d.includes('受限')
  ) {
    return 'blocker';
  }

  if (
    c.includes('rate') ||
    c.includes('limit') ||
    c.includes('qps') ||
    c.includes('busy') ||
    d.includes('频控') ||
    d.includes('流控')
  ) {
    return 'rate_limit';
  }

  if (
    c.includes('system') ||
    c.includes('server') ||
    d.includes('系统异常') ||
    d.includes('重试')
  ) {
    return 'service_unavailable';
  }

  return 'client_error';
}

function determineHttpStatus(code, severity) {
  if (severity === 'service_unavailable') return 500;
  if (code.toLowerCase().includes('auth') || code.toLowerCase().includes('noauth')) return 401;
  if (severity === 'rate_limit') return 429;
  return 200; // Aliyun ChatApp typically wraps errors in HTTP 200 responses with body Code/Message
}

function formatTitleEn(code) {
  return code
    .replace(/^InvalidParameter\./i, 'Invalid Parameter: ')
    .replace(/^SendMessage\./i, 'Send Message: ')
    .replace(/^DelError\./i, 'Delete Error: ')
    .replace(/^TemplateListError\./i, 'Template List Error: ')
    .replace(/^DetailError\./i, 'Detail Error: ')
    .replace(/^Authentication\./i, 'Authentication: ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

function generateSolution(code, desc, category) {
  const cleanDesc = desc.replace(/[。，]+$/, '');

  if (category === 'template') {
    return `1. 登录阿里云控制台“全球即时通讯 (ChatApp) > 模板管理”，核对该模板编码与状态；2. 针对提示【${cleanDesc}】，严格检查 API 请求体中的 components / templateParams 格式；3. 确保变量内容无空值、未超长且转义正确。`;
  }

  if (category === 'media') {
    return `1. 检查请求中上传的媒体文件或链接（URL 是否公网可免鉴权下载）；2. 确认文件格式、扩展名与体积严格符合 WhatsApp 规范；3. 针对提示【${cleanDesc}】修正请求字段后重试。`;
  }

  if (category === 'registration') {
    return `1. 前往阿里云 ChatApp 控制台核实发送号码状态（是否已注册并完成两步验证）；2. 确保 From / To 号码带正确国家代码（如 86138...）；3. 针对提示【${cleanDesc}】调整配置。`;
  }

  if (category === 'authentication') {
    return `1. 检查阿里云 RAM 用户权限，确认已授予 AliyunChatAppFullAccess 策略；2. 检查 AccessKey ID / Secret 或 STS Token 是否有效过期；3. 针对提示【${cleanDesc}】排查账号授权。`;
  }

  if (category === 'rate_limit') {
    return `1. 降低并发调用频率，在客户端或消息网关引入队列缓冲（RocketMQ / Redis）；2. 对该请求实施指数退避算法（Exponential Backoff）重试；3. 联系阿里云技术支持工单申请调大 API 的默认 QPS 限额。`;
  }

  if (category === 'general' && (code.includes('System') || desc.includes('系统'))) {
    return `1. 服务端暂时性处理波动，建议等待 1~3 秒后使用相同 RequestId 发起重试；2. 查看阿里云官网健康看板确认即时通讯服务是否存在异常；3. 若持续失败请保存 RequestId 并提交工单。`;
  }

  return `1. 仔细核对接口入参：【${cleanDesc}】；2. 查看阿里云 ChatApp 官方 API 接口文档对应字段定义与取值范围；3. 修正请求参数后重新调用。`;
}

async function syncAliyunErrors() {
  console.log(`[ALIYUN SYNC] 正在从阿里云官方文档抓取 ChatApp API 错误码...`);
  console.log(`URL: ${ALIYUN_DOCS_URL}`);

  const res = await fetch(ALIYUN_DOCS_URL);
  if (!res.ok) {
    throw new Error(`抓取阿里云文档失败: HTTP ${res.status}`);
  }

  const html = await res.text();
  const match = html.match(/window\.__ICE_PAGE_PROPS__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) {
    throw new Error('未在 HTML 中找到 window.__ICE_PAGE_PROPS__ 文档数据');
  }

  const pageData = JSON.parse(match[1]);
  const content = pageData?.docDetailData?.storeData?.data?.content || '';

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rows = [];
  let m;
  while ((m = rowRegex.exec(content)) !== null) {
    const rowHtml = m[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tds = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      const text = tdMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      tds.push(text);
    }
    if (tds.length >= 2) rows.push(tds);
  }

  const rawErrorRows = rows.slice(1).filter((r) => r[0] !== '错误码' && r[0] !== 'OK');
  console.log(`[ALIYUN SYNC] 抓取到 ${rawErrorRows.length} 条原始错误码记录`);

  // Map and deduplicate
  const aliyunErrorMap = new Map();

  for (const [rawCode, rawDesc] of rawErrorRows) {
    const cleanCode = rawCode.replace(/[。，\s]/g, '').trim();
    const cleanDesc = rawDesc.replace(/[。，\s]+$/, '').trim();
    if (!cleanCode) continue;

    if (aliyunErrorMap.has(cleanCode)) continue;

    const { category, categoryNameZh } = categorize(cleanCode, cleanDesc);
    const severity = determineSeverity(cleanCode, cleanDesc);
    const httpStatus = determineHttpStatus(cleanCode, severity);
    const titleEn = formatTitleEn(cleanCode);
    const solutionZh = generateSolution(cleanCode, cleanDesc, category);

    const item = {
      code: cleanCode,
      provider: 'aliyun',
      providerNameZh: '阿里云 ChatApp',
      category,
      categoryNameZh,
      titleEn,
      titleZh: cleanDesc,
      detailsZh: `调用阿里云 ChatApp (全球即时通信) 接口时返回此错误：${cleanDesc}。接口错误代码标识：${cleanCode}。`,
      solutionZh,
      severity,
      httpStatus,
      docUrl: ALIYUN_DOCS_URL,
      examplePayload: JSON.stringify(
        {
          RequestId: 'A1B2C3D4-5678-90AB-CDEF-' + cleanCode.slice(0, 12).replace(/[^a-zA-Z0-9]/g, 'X'),
          Code: cleanCode,
          Message: cleanDesc,
          Model: null,
        },
        null,
        2
      ),
    };

    aliyunErrorMap.set(cleanCode, item);
  }

  console.log(`[ALIYUN SYNC] 结构化处理出 ${aliyunErrorMap.size} 条阿里云标准错误码`);

  // Read existing dataset
  const dataset = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  // Separate non-aliyun items (e.g. meta)
  const metaItems = dataset.items.filter((i) => i.provider !== 'aliyun');

  // Merge: keep manually enriched items if code already exists, otherwise add from scraped
  const finalAliyunItems = [];
  const existingAliyunMap = new Map();
  for (const item of dataset.items) {
    if (item.provider === 'aliyun') {
      existingAliyunMap.set(String(item.code), item);
    }
  }

  for (const [code, scrapedItem] of aliyunErrorMap.entries()) {
    if (existingAliyunMap.has(code)) {
      // Preserve existing enriched item
      finalAliyunItems.push({
        ...scrapedItem,
        ...existingAliyunMap.get(code),
      });
      existingAliyunMap.delete(code);
    } else {
      finalAliyunItems.push(scrapedItem);
    }
  }

  // Any remaining custom aliyun items (like isv.WABA_ACCOUNT_BLOCKED)
  for (const [code, customItem] of existingAliyunMap.entries()) {
    finalAliyunItems.push(customItem);
  }

  // Combine and sort
  dataset.items = [...metaItems, ...finalAliyunItems];
  dataset.totalCount = dataset.items.length;
  dataset.lastSyncedAt = new Date().toISOString();

  fs.writeFileSync(DATA_FILE, JSON.stringify(dataset, null, 2) + '\n', 'utf-8');

  console.log(`[ALIYUN SYNC] 数据集更新成功！`);
  console.log(`- Meta 错误码：${metaItems.length} 条`);
  console.log(`- 阿里云 ChatApp 错误码：${finalAliyunItems.length} 条`);
  console.log(`- 全量合计：${dataset.totalCount} 条`);
}

syncAliyunErrors().catch((err) => {
  console.error('[ALIYUN SYNC ERROR]', err);
  process.exit(1);
});
