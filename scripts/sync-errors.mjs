import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../src/data/whatsapp-errors.json');

const META_DOCS_URL = 'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes';

// Curated high-quality bilingual mappings and metadata for WhatsApp error codes
const ERROR_KNOWLEDGE_BASE = {
  0: {
    category: 'general',
    categoryNameZh: '网络与常规错误',
    titleEn: 'Auth / Network / Unknown Error',
    titleZh: '认证或网络异常',
    detailsZh: '调用 Meta Graph API 时发生网络中断、DNS 解析失败或未授权请求。',
    solutionZh: '检查网络连接，核对 Access Token 授权头与 API Version 是否正确。',
    severity: 'client_error',
    httpStatus: 400,
  },
  100: {
    category: 'general',
    categoryNameZh: '常规 Graph API 错误',
    titleEn: 'Invalid Parameter',
    titleZh: '请求参数无效或缺失',
    detailsZh: '请求体 JSON 或 URL 查询参数格式错误，缺少必填字段或传入了不支持的数据类型。',
    solutionZh: '检查 API 请求体格式，核对 JSON 语法与必填字段。若上传媒体，确认 Content-Type 为 multipart/form-data。',
    severity: 'client_error',
    httpStatus: 400,
  },
  190: {
    category: 'authentication',
    categoryNameZh: '身份鉴权与令牌',
    titleEn: 'Access Token Expired or Invalid',
    titleZh: '访问令牌已过期或失效',
    detailsZh: '当前使用的 System User 或 User Access Token 已过期、被重置或已被撤销权限。',
    solutionZh: '在 Meta 商务管理平台重新生成永久系统用户访问令牌（Permanent System User Token），或使用 Token Debugger 验证令牌有效性。',
    severity: 'blocker',
    httpStatus: 401,
  },
  200: {
    category: 'authentication',
    categoryNameZh: '身份鉴权与令牌',
    titleEn: 'Permissions Error',
    titleZh: '应用权限不足',
    detailsZh: '调用该接口所需权限未授予给当前 Access Token（例如缺少 whatsapp_business_messaging 或 whatsapp_business_management 权限）。',
    solutionZh: '在 Meta App Dashboard 中检查 App 权限配置，确保系统用户分配了对应 WhatsApp Business 资产的完全管理权限。',
    severity: 'blocker',
    httpStatus: 403,
  },
  368: {
    category: 'account',
    categoryNameZh: '商业账号与封禁',
    titleEn: 'Temporarily Blocked for Policy Violation',
    titleZh: '账号因违反 Meta 政策被临时封禁',
    detailsZh: '由于发送内容被用户大量举报、违反 WhatsApp 商业通讯准则或触发反垃圾风控，账号已被临时限制发信。',
    solutionZh: '停止批量推送营销内容，登录 WhatsApp Manager 查看违规警告，并在 Meta 商务管理平台“账户品质”页面提交申诉。',
    severity: 'blocker',
    httpStatus: 403,
  },
  130429: {
    category: 'rate_limit',
    categoryNameZh: '频率与流控限制',
    titleEn: 'Rate Limit Hit',
    titleZh: '达到 API 速率限流或吞吐量上限 (Rate Limit Hit)',
    detailsZh: '向特定手机号或整个 WABA 账号发送消息的瞬时速率已达到并发限制或限流阈值（如 80 MPS 或 Tier 限制）。',
    solutionZh: '引入队列缓冲（如 Redis / RabbitMQ），降低并发频率进行限流调控，实施指数退避算法（Exponential Backoff）重试，或向 Meta 申请提升 Throughput 吞吐量。',
    severity: 'rate_limit',
    httpStatus: 429,
  },
  131000: {
    category: 'messaging',
    categoryNameZh: '消息发送与接收',
    titleEn: 'Something Went Wrong',
    titleZh: 'WhatsApp 服务内部异常',
    detailsZh: 'Meta 内部服务在处理该条消息时发生未知异常或暂时性故障。',
    solutionZh: '稍后重试该请求；同时关注 metastatus.com 查看 WhatsApp 官方服务是否处于故障维护状态。',
    severity: 'service_unavailable',
    httpStatus: 500,
  },
  131005: {
    category: 'authentication',
    categoryNameZh: '身份鉴权与令牌',
    titleEn: 'Access Denied / Permission Not Granted',
    titleZh: '权限未授予或已被撤销',
    detailsZh: 'Token 未获得调用此接口所需的必要权限，或相关资产（如电话号码）与当前 WABA 解除了绑定。',
    solutionZh: '在 Meta 开发者后台使用 Access Token Debugger 验证权限并重新授权。',
    severity: 'blocker',
    httpStatus: 403,
  },
  131008: {
    category: 'messaging',
    categoryNameZh: '消息发送与接收',
    titleEn: 'Required Parameter Missing',
    titleZh: '缺少必需的请求参数',
    detailsZh: '请求中缺少此消息类型必须提供的参数（如 to、type、template、image.id 等）。',
    solutionZh: '对照官方 API 文档检查请求体，确保传入了 messaging_product: "whatsapp" 以及对应类型的数据对象。',
    severity: 'client_error',
    httpStatus: 400,
  },
  131009: {
    category: 'messaging',
    categoryNameZh: '消息发送与接收',
    titleEn: 'Parameter Value Invalid',
    titleZh: '参数值不合法',
    detailsZh: '提供的参数值不符合规格要求（例如手机号未包含国家区号、URL 不符合规范等）。',
    solutionZh: '规范化手机号格式（去掉前导加号、空格或破折号，如 8613800000000）。',
    severity: 'client_error',
    httpStatus: 400,
  },
  131016: {
    category: 'messaging',
    categoryNameZh: '消息发送与接收',
    titleEn: 'Service Unavailable',
    titleZh: '服务暂时不可用',
    detailsZh: 'WhatsApp 平台正在进行维护或遭遇暂时性过载。',
    solutionZh: '在尝试重新发送前，请查阅 metastatus.com 官方状态页。',
    severity: 'service_unavailable',
    httpStatus: 503,
  },
  131021: {
    category: 'messaging',
    categoryNameZh: '消息发送与接收',
    titleEn: 'Sender and Recipient are the Same',
    titleZh: '发件人与收件人号码相同',
    detailsZh: '请求中的接收方手机号与您配置的 WhatsApp Business 发信号码一致。',
    solutionZh: '修改 to 参数为外部测试接收者的真实手机号。',
    severity: 'client_error',
    httpStatus: 400,
  },
  131026: {
    category: 'messaging',
    categoryNameZh: '消息发送与接收',
    titleEn: 'Message Undeliverable',
    titleZh: '消息无法送达 (Message Undeliverable)',
    detailsZh: '接收方手机号未注册 WhatsApp、对方版本过低、对方拉黑了该商家号码，或尚未同意最新的 WhatsApp 隐私条款。',
    solutionZh: '确认接收方手机号确实开通了 WhatsApp；通过其他渠道让用户主动向您的商业号码发送一条消息以解除阻断。',
    severity: 'client_error',
    httpStatus: 400,
  },
  131037: {
    category: 'account',
    categoryNameZh: '商业账号与封禁',
    titleEn: 'Business Phone Number Display Name Not Approved',
    titleZh: '商业号码显示名称未通过审核',
    detailsZh: '使用的商业号码 Display Name 处于审核中、被拒绝或尚未设置。',
    solutionZh: '登录 WhatsApp Manager 前往电话号码设置，重新提交符合命名准则的显示名称等待审核。',
    severity: 'blocker',
    httpStatus: 400,
  },
  131042: {
    category: 'account',
    categoryNameZh: '商业账号与封禁',
    titleEn: 'Payment Method Error',
    titleZh: '支付方式异常或账单超限',
    detailsZh: '绑定的信用卡扣费失败、信用额度超标、未设置币种/时区，或 WABA 未关联有效的支付账户。',
    solutionZh: '进入 Meta 商务管理平台的“账单与支付”页面更新信用卡，并确保 WABA 已正确关联支付账户。',
    severity: 'blocker',
    httpStatus: 400,
  },
  131045: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Phone Number Registration Error',
    titleZh: '手机号码未完成注册',
    detailsZh: '商业号码尚未通过 2-Step Verification 或官方注册流程激活。',
    solutionZh: '调用 POST /{PHONE_NUMBER_ID}/register 端点完成注册后再发送消息。',
    severity: 'blocker',
    httpStatus: 400,
  },
  131047: {
    category: 'messaging',
    categoryNameZh: '消息发送与接收',
    titleEn: '24-Hour Customer Service Window Expired',
    titleZh: '24小时客户服务窗口已过期 (Re-engagement Window)',
    detailsZh: '自用户最后一次向您的号码发信已超过 24 小时，此时禁止发送普通自由格式消息（文本、图片等）。',
    solutionZh: '必须改用经过 Meta 审核批准的“消息模板 (Template Message)”重新唤醒用户；用户回复后会重新开启 24 小时自由对话窗口。',
    severity: 'client_error',
    httpStatus: 400,
  },
  131048: {
    category: 'rate_limit',
    categoryNameZh: '频率与流控限制',
    titleEn: 'Spam Rate Limit Hit',
    titleZh: '触发防垃圾信息频率限制',
    detailsZh: '短时间内向没有互动的用户发送过多营销消息，被系统垃圾过滤器拦截。',
    solutionZh: '暂停向未互动冷用户推送，提高消息相关性，等待限流解除。',
    severity: 'rate_limit',
    httpStatus: 429,
  },
  131049: {
    category: 'messaging',
    categoryNameZh: '消息发送与接收',
    titleEn: 'Per-User Marketing Template Message Limit Reached',
    titleZh: '达到单用户营销模板消息推送上限',
    detailsZh: '为保护生态体验，Meta 限制了向单个 WhatsApp 用户连续推送营销模板的频次。',
    solutionZh: '请至少等待 24 小时后再向该用户重试发送营销模板，或改用实用通知型（Utility）模板。',
    severity: 'client_error',
    httpStatus: 400,
  },
  131050: {
    category: 'messaging',
    categoryNameZh: '消息发送与接收',
    titleEn: 'User Opted Out of Marketing Messages',
    titleZh: '用户已退订营销消息',
    detailsZh: '该用户通过 WhatsApp 客户端内的退订按钮或回复 STOP 退订了来自该商家的营销推送。',
    solutionZh: '严禁向该用户重试营销消息。请监听 user_preferences Webhook 同步用户的退订状态。',
    severity: 'client_error',
    httpStatus: 400,
  },
  131051: {
    category: 'messaging',
    categoryNameZh: '消息发送与接收',
    titleEn: 'Unsupported Message Type',
    titleZh: '不支持的消息类型',
    detailsZh: '请求中指定的 type 字段不被 WhatsApp Cloud API 支持。',
    solutionZh: '参考官方文档仅使用支持的类型：text, image, video, audio, document, sticker, template, interactive, location, contacts 等。',
    severity: 'client_error',
    httpStatus: 400,
  },
  131052: {
    category: 'media',
    categoryNameZh: '多媒体上传与下载',
    titleEn: 'Media Download Error',
    titleZh: '用户媒体下载失败',
    detailsZh: '用户发送的图片或视频无法从 WhatsApp 服务器获取，可能已过期或文件损坏。',
    solutionZh: '从 messages Webhook 中检查 error_data.details，必要时请用户重新发送。',
    severity: 'client_error',
    httpStatus: 400,
  },
  131053: {
    category: 'media',
    categoryNameZh: '多媒体上传与下载',
    titleEn: 'Media Upload Error',
    titleZh: '媒体文件上传或格式不符',
    detailsZh: '上传的媒体文件超过大小限制（图片>5MB，视频/音频>16MB，文档>100MB），或者格式/编码不合规。',
    solutionZh: '使用本工具的“媒体文件工具”进行检测与转码：图片压至 5MB，视频转 H.264/AAC，贴纸转 512x512 WebP。',
    severity: 'client_error',
    httpStatus: 400,
  },
  131057: {
    category: 'account',
    categoryNameZh: '商业账号与封禁',
    titleEn: 'Business Account in Maintenance Mode',
    titleZh: '商业账号处于维护模式',
    detailsZh: '该 WhatsApp 商业账号正由 Meta 升级吞吐量或执行后台维护，临时无法发信。',
    solutionZh: '请稍候片刻重试。',
    severity: 'service_unavailable',
    httpStatus: 503,
  },
  131063: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Marketing Templates Disabled on Cloud API',
    titleZh: '当前配置禁用了 Cloud API 营销模板',
    detailsZh: '商业账号开启了 disable_marketing_messages_on_cloud_api 配置。',
    solutionZh: '在 Messaging 账号设置中将 disable_marketing_messages_on_cloud_api 改为 false。',
    severity: 'client_error',
    httpStatus: 400,
  },
  132000: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Template Parameter Count Mismatch',
    titleZh: '模板变量参数个数不匹配',
    detailsZh: '请求中传入的 {{1}}、{{2}} 参数数量与模板在 WhatsApp Manager 中审核通过的变量数不一致。',
    solutionZh: '核对模板定义的 component（HEADER、BODY、BUTTONS）中的参数个数与顺序，确保每个变量都有对应的值。',
    severity: 'client_error',
    httpStatus: 400,
  },
  132001: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Template Does Not Exist or Not Approved',
    titleZh: '模板不存在或未获批准',
    detailsZh: '请求中的模板名称（name）或语言地区代码（language.code 如 zh_CN）不存在，或模板仍处于审查/拒绝状态。',
    solutionZh: '进入 WhatsApp Manager 确认模板是否为 APPROVED 状态，且 template name 和 language 字母大小写完全吻合。',
    severity: 'client_error',
    httpStatus: 400,
  },
  132005: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Translated Text Too Long',
    titleZh: '翻译文本长度超标',
    detailsZh: '多语言翻译后的模板文字长度超出了 Meta 设定的字符限制。',
    solutionZh: '精简模板文字后重新提交审核。',
    severity: 'client_error',
    httpStatus: 400,
  },
  132007: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Template Violates WhatsApp Policy',
    titleZh: '模板内容违反商业准则',
    detailsZh: '模板包含虚假促销、违禁商品或敏感营销词汇，未通过政策审查。',
    solutionZh: '参阅《WhatsApp 商业政策》调整文案并重新申请审核。',
    severity: 'blocker',
    httpStatus: 400,
  },
  132012: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Template Parameter Format Invalid',
    titleZh: '模板变量参数格式错误',
    detailsZh: '模板参数未能符合预设类型（例如期望 Currency/DateTime 或 Header 媒体 Handle，但传入了普通文本）。',
    solutionZh: '检查 parameters 数组内的 type 属性（text / currency / date_time / image / document / video）。',
    severity: 'client_error',
    httpStatus: 400,
  },
  132015: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Template Paused Due to Low Quality',
    titleZh: '模板因质量评级过低被暂停 (Paused)',
    detailsZh: '用户对该模板点击“拉黑”或“举报”过多，Meta 系统自动暂停了该模板的发送。',
    solutionZh: '在 WhatsApp Manager 中修改文案，提高受众契合度并降低打扰性，重新提交审核。',
    severity: 'blocker',
    httpStatus: 400,
  },
  132016: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Template Permanently Disabled',
    titleZh: '模板被永久停用 (Disabled)',
    detailsZh: '模板多次因低质量评级被暂停后仍未改善，已被 Meta 永久禁用。',
    solutionZh: '该模板无法恢复，请新建全新模板并重新审核。',
    severity: 'blocker',
    httpStatus: 400,
  },
  132068: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Flow is in Blocked State',
    titleZh: 'WhatsApp Flow 处于阻断状态',
    detailsZh: '消息中包含的 WhatsApp Flow 存在配置严重错误被系统阻断。',
    solutionZh: '在 Flow Builder 中排查端点可用性与 JSON 结构，重新发布 Flow。',
    severity: 'blocker',
    httpStatus: 400,
  },
  132069: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Flow is in Throttled State',
    titleZh: 'WhatsApp Flow 处于频控限制中',
    detailsZh: '该 Flow 在过去 1 小时内已触发限流阈值。',
    solutionZh: '降低 Flow 触发频次，优化处理性能。',
    severity: 'rate_limit',
    httpStatus: 429,
  },
  133000: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Deregistration Failed',
    titleZh: '商业号码注销失败',
    detailsZh: '尝试从 WhatsApp Business Platform 解绑该号码时发生内部错误。',
    solutionZh: '稍后重试，或联系 Meta 商业技术支持。',
    severity: 'client_error',
    httpStatus: 400,
  },
  133004: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Server Temporary Error During Registration',
    titleZh: '号码注册时服务器暂时性错误',
    detailsZh: '在请求两步验证短信/语音或提交 PIN 码时发生网络或服务震荡。',
    solutionZh: '等待 5 分钟后再次请求验证码。',
    severity: 'service_unavailable',
    httpStatus: 500,
  },
  133005: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Two-Step Verification PIN Mismatch',
    titleZh: '两步验证 PIN 码不正确',
    detailsZh: '在注册端点提交的 6 位数字 PIN 码与之前设置的 PIN 不匹配。',
    solutionZh: '输入正确的 6 位 PIN 码；如遗忘，请在 WhatsApp Manager 申请重置两步验证 PIN 码。',
    severity: 'client_error',
    httpStatus: 400,
  },
  133006: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Phone Number Re-verification Required',
    titleZh: '手机号码需要重新验证',
    detailsZh: '该号码长时间未活跃或发生证书迁移，需要重新完成短信/语音验证。',
    solutionZh: '重新调用请求验证码接口完成两步注册。',
    severity: 'blocker',
    httpStatus: 400,
  },
  133010: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Phone Number Already Registered',
    titleZh: '手机号码已注册在其他 WhatsApp 客户端',
    detailsZh: '该手机号码当前仍绑定在普通的 WhatsApp Messenger 或 WhatsApp Business App 手机客户端上。',
    solutionZh: '必须先在手机客户端的“设置 -> 账号”中点击“删除账号 (Delete Account)”，方可在 Cloud API 中注册。',
    severity: 'blocker',
    httpStatus: 400,
  },
  133015: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Certificate Invalid or Expired',
    titleZh: '号码证书无效或已过期',
    detailsZh: '注册号码时提供的证书 Base64 格式无效或证书签发时间超期。',
    solutionZh: '在 WhatsApp Business Manager 重新生成新的证书后再进行注册。',
    severity: 'blocker',
    httpStatus: 400,
  },
  133016: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Certificate Revoked',
    titleZh: '号码证书已被吊销',
    detailsZh: '证书由于安全或违规原因被 Meta 系统撤销。',
    solutionZh: '重新进行商业认证并申请新证书。',
    severity: 'blocker',
    httpStatus: 400,
  },
  80007: {
    category: 'rate_limit',
    categoryNameZh: '频率与流控限制',
    titleEn: 'Rate Limit Exceeded',
    titleZh: '调用频率超出应用限额',
    detailsZh: 'Meta 开发者应用级的全局调用次数超出设定的限制。',
    solutionZh: '暂停非核心请求，优化请求批处理，降低查询频次。',
    severity: 'rate_limit',
    httpStatus: 429,
  },
};

export async function syncErrors() {
  console.log('🔄 正在从 Meta 官方文档同步 WhatsApp 错误码...');
  let fetchedRows = [];

  try {
    const res = await fetch(META_DOCS_URL, {
      headers: {
        'User-Agent': 'curl/8.1.2',
        'Accept': '*/*',
      },
    });

    if (res.ok) {
      const text = await res.text();
      // Match markdown table rows: | `code` | details | solution |
      const tableRowRegex = /\|\s*`?(\d+)`?\s*\|\s*([^|]+)\|\s*([^|]+)\|/g;
      let match;
      while ((match = tableRowRegex.exec(text)) !== null) {
        const code = parseInt(match[1], 10);
        const details = match[2].trim().replace(/<br>/g, '\n').replace(/&#039;/g, "'").replace(/&quot;/g, '"');
        const solution = match[3].trim().replace(/<br>/g, '\n').replace(/&#039;/g, "'").replace(/&quot;/g, '"');
        if (!isNaN(code)) {
          fetchedRows.push({ code, details, solution });
        }
      }
      console.log(`✅ 从 Meta 官方页面成功解析到 ${fetchedRows.length} 条表格数据`);
    } else {
      console.warn(`⚠️ 无法直接访问 Meta 页面 (HTTP ${res.status})，将使用内置权威知识库。`);
    }
  } catch (err) {
    console.warn('⚠️ 抓取 Meta 官方页面发生网络警告:', err.message);
  }

  // Load existing data if available
  let existingData = { lastSyncedAt: '', items: [] };
  if (fs.existsSync(DATA_FILE)) {
    try {
      existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch {
      // ignore
    }
  }

  const existingMap = new Map();
  for (const item of existingData.items || []) {
    existingMap.set(item.code, item);
  }

  // Build merged items
  const allCodes = new Set([
    ...Object.keys(ERROR_KNOWLEDGE_BASE).map(Number),
    ...fetchedRows.map((r) => r.code),
    ...existingMap.keys(),
  ]);

  const mergedItems = [];
  for (const code of Array.from(allCodes).sort((a, b) => a - b)) {
    const kb = ERROR_KNOWLEDGE_BASE[code] || {};
    const existing = existingMap.get(code) || {};
    const fetched = fetchedRows.find((r) => r.code === code);

    const category = kb.category || existing.category || inferCategory(code);
    const categoryNameZh = kb.categoryNameZh || existing.categoryNameZh || getCategoryNameZh(category);

    const titleEn = kb.titleEn || existing.titleEn || `Error ${code}`;
    const titleZh = kb.titleZh || existing.titleZh || `错误码 ${code}`;

    const detailsEn = fetched?.details || existing.detailsEn || kb.detailsEn || 'No official description provided.';
    const detailsZh = kb.detailsZh || existing.detailsZh || detailsEn;

    const solutionEn = fetched?.solution || existing.solutionEn || kb.solutionEn || 'Refer to WhatsApp Business Platform documentation.';
    const solutionZh = kb.solutionZh || existing.solutionZh || solutionEn;

    const severity = kb.severity || existing.severity || inferSeverity(code);
    const httpStatus = kb.httpStatus || existing.httpStatus || 400;

    const examplePayload = JSON.stringify(
      {
        error: {
          message: titleEn,
          type: 'OAuthException',
          code: code,
          error_data: {
            messaging_product: 'whatsapp',
            details: detailsEn.split('\n')[0].slice(0, 100),
          },
          fbtrace_id: 'AbCdEf123456XyZ',
        },
      },
      null,
      2
    );

    mergedItems.push({
      code,
      category,
      categoryNameZh,
      titleEn,
      titleZh,
      detailsEn,
      detailsZh,
      solutionEn,
      solutionZh,
      severity,
      httpStatus,
      docUrl: META_DOCS_URL,
      examplePayload,
    });
  }

  const output = {
    lastSyncedAt: new Date().toISOString(),
    totalCount: mergedItems.length,
    sourceUrl: META_DOCS_URL,
    items: mergedItems,
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`🎉 错误码知识库更新成功！共收录 ${mergedItems.length} 个错误码 -> ${DATA_FILE}`);
  return output;
}

function inferCategory(code) {
  if (code >= 130000 && code < 131000) return 'rate_limit';
  if (code >= 131000 && code < 132000) {
    if (code === 131052 || code === 131053) return 'media';
    return 'messaging';
  }
  if (code >= 132000 && code < 133000) return 'template';
  if (code >= 133000 && code < 134000) return 'registration';
  if (code === 190 || code === 200) return 'authentication';
  if (code === 368) return 'account';
  return 'general';
}

function getCategoryNameZh(cat) {
  const map = {
    messaging: '消息发送与接收',
    template: '消息模板',
    rate_limit: '频率与流控限制',
    media: '多媒体上传与下载',
    authentication: '身份鉴权与令牌',
    account: '商业账号与封禁',
    registration: '号码注册与验证',
    general: '常规 Graph API 错误',
  };
  return map[cat] || '其他';
}

function inferSeverity(code) {
  if (code === 130429 || code === 80007 || code === 132069 || code === 131048) return 'rate_limit';
  if (code === 190 || code === 368 || code === 132015 || code === 132016) return 'blocker';
  if (code === 131000 || code === 131016 || code === 131057 || code === 133004) return 'service_unavailable';
  return 'client_error';
}

// Direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncErrors().catch((e) => {
    console.error('Sync failed:', e);
    process.exit(1);
  });
}
