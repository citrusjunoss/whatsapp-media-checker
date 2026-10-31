import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../src/data/whatsapp-errors.json');

const META_DOCS_URL = 'https://developers.facebook.com/documentation/business-messaging/whatsapp/support/error-codes';
const META_DOCS_FALLBACK_URL = 'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes';
const WABA_BASE_URL = 'https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account/';
const WABA_EDGES = [
  '',
  'activities/',
  'call_analytics/',
  'conversation_analytics/',
  'dataset/',
  'message_template_previews/',
  'message_templates/',
  'payment_configuration/',
  'payment_configurations/',
  'phone_numbers/',
  'pricing_analytics/',
  'product_catalogs/',
  'solutions/',
  'subscribed_apps/',
  'template_groups/',
  'upsert_message_templates/',
  'welcome_message_sequences/',
];

// Curated high-quality bilingual mappings and metadata for WhatsApp error codes
const ERROR_KNOWLEDGE_BASE = {
  0: {
    category: 'authentication',
    categoryNameZh: '身份鉴权与令牌',
    titleEn: 'Unable to Authenticate App User',
    titleZh: '应用用户认证失败或令牌失效',
    detailsZh: '调用 Meta Graph API 时发生认证失败。通常意味着 Access Token 已过期、失效，或应用用户修改了安全设置禁止所有应用访问其数据。',
    solutionZh: '核对 Access Token 授权头；若令牌失效，请[获取新 Access Token](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#system-user-access-tokens) 重新授权。',
    severity: 'client_error',
    httpStatus: 400,
    relatedLinks: [
      {
        title: '获取新 Access Token (System User)',
        url: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#system-user-access-tokens',
      },
    ],
  },
  3: {
    category: 'authentication',
    categoryNameZh: '身份鉴权与令牌',
    titleEn: 'Capability or Permissions Issue',
    titleZh: '应用能力或接口权限不足',
    detailsZh: '当前 Access Token 缺少调用该 WhatsApp 端点所需的授权范围或权限。',
    solutionZh: '使用 [Access Token 调试工具 (Token Debugger)](https://developers.facebook.com/tools/debug/accesstoken) 检查 App 所获权限；查阅 [身份鉴权与授权错误官方指南 (Authentication & Authorization Errors)](https://developers.facebook.com/documentation/business-messaging/whatsapp/support#authentication-authorization) 排查端点所需权限。',
    severity: 'blocker',
    httpStatus: 403,
    relatedLinks: [
      {
        title: 'Access Token 调试工具 (Token Debugger)',
        url: 'https://developers.facebook.com/tools/debug/accesstoken',
      },
      {
        title: '身份鉴权与授权错误官方指南',
        url: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/support#authentication-authorization',
      },
    ],
  },
  10: {
    category: 'authentication',
    categoryNameZh: '身份鉴权与令牌',
    titleEn: 'Permission Denied or Removed',
    titleZh: '接口权限未授予或已被撤销',
    detailsZh: '请求被拒绝，原因可能是权限未授予或已被撤销，或者账号不满足调用该 API 的资质要求。',
    solutionZh: '1. 使用 [Access Token 调试器](https://developers.facebook.com/tools/debug/accesstoken) 验证当前令牌权限；2. 查阅 [身份鉴权与授权错误指南](https://developers.facebook.com/documentation/business-messaging/whatsapp/support#authentication-authorization)；3. 若使用 WhatsApp Flows with Endpoint，确保用于[设置商业公钥 (Set Business Public Key)](https://developers.facebook.com/documentation/business-messaging/whatsapp/flows/cloud-api/reference/whatsapp-business-encryption#set-business-public-key) 的电话号码已加入白名单；4. 检查账号是否满足端点资质要求。',
    severity: 'blocker',
    httpStatus: 403,
    relatedLinks: [
      {
        title: 'Access Token 调试工具 (Token Debugger)',
        url: 'https://developers.facebook.com/tools/debug/accesstoken',
      },
      {
        title: '身份鉴权与授权错误官方指南',
        url: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/support#authentication-authorization',
      },
      {
        title: '设置商业公钥指引 (Set Business Public Key)',
        url: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/flows/cloud-api/reference/whatsapp-business-encryption#set-business-public-key',
      },
    ],
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
    solutionZh: '前往 [获取 Access Token 官方指引](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens) 在 Meta 商务管理平台重新生成永久系统用户访问令牌（Permanent System User Token），或使用 [Token Debugger](https://developers.facebook.com/tools/debug/accesstoken) 验证令牌有效性。',
    severity: 'blocker',
    httpStatus: 401,
    relatedLinks: [
      {
        title: '获取 Access Token 官方文档',
        url: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens',
      },
      {
        title: 'Access Token 调试工具 (Token Debugger)',
        url: 'https://developers.facebook.com/tools/debug/accesstoken',
      },
    ],
  },
  200: {
    category: 'authentication',
    categoryNameZh: '身份鉴权与令牌',
    titleEn: 'Permissions Error / No Access Token Provided',
    titleZh: '应用权限不足或缺少 Access Token',
    detailsZh: '调用该接口所需权限未授予给当前 Access Token（例如缺少 whatsapp_business_messaging 或 whatsapp_business_management 权限），或请求中未携带有效的 Access Token。',
    solutionZh: '确保请求中携带有效的 Access Token。参考 [Access Tokens 官方文档](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens)；在 Meta App Dashboard 检查应用权限配置，或使用 [Access Token 调试工具](https://developers.facebook.com/tools/debug/accesstoken) 验证权限。',
    severity: 'blocker',
    httpStatus: 403,
    relatedLinks: [
      {
        title: 'Access Tokens 官方文档',
        url: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens',
      },
      {
        title: 'Access Token 调试工具 (Token Debugger)',
        url: 'https://developers.facebook.com/tools/debug/accesstoken',
      },
    ],
  },
  368: {
    category: 'account',
    categoryNameZh: '商业账号与封禁',
    titleEn: 'Temporarily Blocked for Policy Violation',
    titleZh: '账号因违反 Meta 政策被临时封禁',
    detailsZh: '由于发送内容被用户大量举报、违反 WhatsApp 商业通讯准则或触发反垃圾风控，账号已被临时限制发信。',
    solutionZh: '立即停止批量推送营销内容，登录 WhatsApp Manager 查看违规警告，并查阅 [Meta 政策违规与申诉指南 (Policy Enforcement)](https://developers.facebook.com/documentation/business-messaging/whatsapp/policy-enforcement) 了解恢复步骤与提交官方申诉。',
    severity: 'blocker',
    httpStatus: 403,
    relatedLinks: [
      {
        title: 'Meta 政策违规与申诉指南 (Policy Enforcement)',
        url: 'https://developers.facebook.com/documentation/business-messaging/whatsapp/policy-enforcement',
      },
    ],
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
  104: {
    category: 'authentication',
    categoryNameZh: '身份鉴权与令牌',
    titleEn: 'Incorrect Signature',
    titleZh: 'API 请求签名校验失败',
    detailsZh: '调用号码管理或资产配置接口时提供的 appsecret_proof 或请求签名校验不匹配。',
    solutionZh: '检查用于生成签名的 App Secret 与当前使用的 Access Token 是否匹配，确保 HMAC-SHA256 算法计算正确。',
    severity: 'blocker',
    httpStatus: 400,
  },
  192: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Invalid Phone Number in Template Request',
    titleZh: '创建模板关联号码无效',
    detailsZh: '创建或关联消息模板时所指定的发送方号码格式不正确，或该号码未在当前 WABA 商业账号下激活。',
    solutionZh: '检查请求中提供的商业电话号码 ID 与格式（必须为国际 E.164 格式，不含 + 号和空格），确认该号码在 Meta 控制台状态为 CONNECTED。',
    severity: 'client_error',
    httpStatus: 400,
  },
  300: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Edit Failure',
    titleZh: '号码或资产属性编辑失败',
    detailsZh: '尝试更新商业电话号码的展示名称、PIN 码或配置属性时发生底层更新失败。',
    solutionZh: '确认当前号码处于正常可用状态且未在进行双重认证审核流程；若修改展示名称请先确保已通过企业商业认证。',
    severity: 'client_error',
    httpStatus: 400,
  },
  2500: {
    category: 'general',
    categoryNameZh: '常规 Graph API 错误',
    titleEn: 'Error Parsing Graph Query',
    titleZh: 'Graph API 查询语句语法解析失败',
    detailsZh: 'URL 中的 fields、filtering 或 pagination 参数格式不正确，包含未转义字符或不支持的查询语法。',
    solutionZh: '检查 GET 请求中的 query string 格式，确保逗号分隔字段名无多余空格，且过滤参数符合 Meta Graph API 规范。',
    severity: 'client_error',
    httpStatus: 400,
  },
  80008: {
    category: 'rate_limit',
    categoryNameZh: '频率与流控限制',
    titleEn: 'WABA Account Rate Limit Exceeded',
    titleZh: '商业账号级调用频次超限',
    detailsZh: '短时间内向该 WhatsApp Business Account (WABA) 发起的 Graph API 请求总数超过 Meta 设定的并发安全阈值。',
    solutionZh: '降低 API 轮询或批量调用频次，加入指数退避重试（Exponential Backoff）机制，参考 Meta 限频响应头 X-Business-Use-Case-Usage。',
    severity: 'rate_limit',
    httpStatus: 429,
  },
  131064: {
    category: 'messaging',
    categoryNameZh: '消息发送与接收',
    titleEn: 'Restricted Messaging Tier',
    titleZh: '账号处于受限发信等级',
    detailsZh: '商业账号当前处于受限发信层级，无法向非测试收件人发起营销或业务通知。',
    solutionZh: '在 WhatsApp Manager 中查看企业质量评级（Quality Rating），完成商业认证以提升 Messaging Tier 发信额度。',
    severity: 'blocker',
    httpStatus: 403,
  },
  134011: {
    category: 'account',
    categoryNameZh: '商业账号与封禁',
    titleEn: 'Payment Configuration Error',
    titleZh: '支付配置或商业账单异常',
    detailsZh: '商业账号未绑定有效信用卡/支付方式，或所绑定的付款账户已欠费停用。',
    solutionZh: '在 Meta 商务管理平台的“支付方式”页面添加有效付款凭证，结算逾期账单后重试。',
    severity: 'blocker',
    httpStatus: 402,
  },
  134100: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Flow is in Blocked State',
    titleZh: 'WhatsApp Flow 处于阻断状态',
    detailsZh: '消息模板引用的 WhatsApp Flow 交互式流程因安全审查不通过或被手动停用而无法加载。',
    solutionZh: '在 WhatsApp Manager 中进入 Flows 界面，检查并重新发布 Flow 流程定义。',
    severity: 'blocker',
    httpStatus: 400,
  },
  134101: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Flow is in Throttled State',
    titleZh: 'WhatsApp Flow 触发频控限制',
    detailsZh: '当前 Flow 数据终端（Data Endpoint）短时间内处理的互动请求超过阈值。',
    solutionZh: '优化后端 Flow Endpoint 处理延迟与并发吞吐量，实施缓存策略以降低响应时间。',
    severity: 'rate_limit',
    httpStatus: 429,
  },
  134102: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Flow Endpoint Error',
    titleZh: 'WhatsApp Flow 终端服务异常',
    detailsZh: 'Meta 尝试调用开发者的 Flow 数据终端时发生网络超时、证书失效或返回了非 200 HTTP 响应。',
    solutionZh: '检查 Flow 数据终端 URL 的公网可达性与 HTTPS 证书，核对解密与加密响应签名逻辑。',
    severity: 'service_unavailable',
    httpStatus: 502,
  },
  135000: {
    category: 'account',
    categoryNameZh: '商业账号与封禁',
    titleEn: 'Order / Payment Processing Timeout',
    titleZh: '商业订单处理超时',
    detailsZh: 'WhatsApp 商业支付交易在与支付服务提供商交互时发生超时中断。',
    solutionZh: '检查关联的支付网关（如 Razorpay、PayU 等）运行状况，使用订单查询接口核对交易状态。',
    severity: 'service_unavailable',
    httpStatus: 504,
  },
  139000: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Blocked by Integrity',
    titleZh: '内容触发安全与反垃圾合规拦截',
    detailsZh: '提交的消息模板内容、变量占位符或包含的链接被 Meta 自动化反垃圾/安全合规系统（Integrity Engine）判定存在潜在风险或违规。',
    solutionZh: '检查模板正文是否包含敏感商业诱导词、短网址（短链接跳转）或钓鱼欺诈嫌疑内容；修改话术并确保链接指向真实官方域名。',
    severity: 'blocker',
    httpStatus: 400,
  },
  1752041: {
    category: 'account',
    categoryNameZh: '商业账号与封禁',
    titleEn: 'Product Not Found in Catalog',
    titleZh: '商品目录中未找到对应商品',
    detailsZh: '交互式产品消息（Single/Multi-Product Message）中指定的 retailer_id 在关联的商品目录中不存在或已下架。',
    solutionZh: '在 Meta Commerce Manager 中确认商品目录已与 WABA 成功绑定，检查 retailer_id 是否有效且商品处于审核通过（Approved）状态。',
    severity: 'client_error',
    httpStatus: 404,
  },
  200000: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Cannot Add Phone Number to WABA',
    titleZh: '无法将电话号码添加至商业账号',
    detailsZh: '尝试将新号码绑定至 WABA 时失败，可能因该号码已被其他个人/商业 WhatsApp 账号占用、未完成注销或商业账号电话号码配额已达上限。',
    solutionZh: '若号码此前在 WhatsApp 手机客户端使用，必须先在客户端执行“删除账号”注销；确认 WABA 所属企业是否已通过企业认证以获取更多号码配额。',
    severity: 'blocker',
    httpStatus: 400,
  },
  200002: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'HSM Template Creation Failed',
    titleZh: '结构化消息模板创建失败',
    detailsZh: '创建 HSM 消息模板时组件结构定义错误，缺少必需的 BODY 组件或变量占位符序号不连续（如跳过 {{1}} 直接使用 {{2}}）。',
    solutionZh: '核对 components 数组结构，必须包含 BODY 类型；变量参数序号必须从 {{1}} 开始严格递增，按钮链接变量仅允许在尾部添加。',
    severity: 'client_error',
    httpStatus: 400,
  },
  200005: {
    category: 'template',
    categoryNameZh: '消息模板',
    titleEn: 'Template Insights Not Available',
    titleZh: '模板送达与转化分析数据尚未就绪',
    detailsZh: '请求读取该商业账号的模板统计分析（Template Insights）时，该模板发送量不足或 Meta 统计流水线尚未汇总完成。',
    solutionZh: '模板数据分析通常需要积累一定的发送量（通常至少 100+ 条）并在次日生成报表，请等待 Meta 离线流水线产出数据后再行查询。',
    severity: 'client_error',
    httpStatus: 400,
  },
  200008: {
    category: 'account',
    categoryNameZh: '商业账号与封禁',
    titleEn: 'WABA Has No Linked Phone Numbers',
    titleZh: '商业账号未关联任何电话号码',
    detailsZh: '调用会话分析、定价报表或发信操作时，当前指定的 WABA 商业账号下没有任何已验证启用的电话号码。',
    solutionZh: '进入 Meta 商务管理平台 WhatsApp Manager，在 Phone Numbers 菜单下添加并验证至少一个企业电话号码，待状态为 Connected 后再重试。',
    severity: 'blocker',
    httpStatus: 400,
  },
  2593079: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Certificate Verification Failed',
    titleZh: '号码证书签名验证失败',
    detailsZh: '商业电话号码在注册或迁移验证时所提交的证书（cert）公钥签名与 Meta 系统注册记录不一致。',
    solutionZh: '在 WhatsApp Manager 重新下载最新的号码证书，确保 base64 字符串无截断或空格换行符。',
    severity: 'blocker',
    httpStatus: 400,
  },
  2593107: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Migration Token Invalid',
    titleZh: 'On-Premises 迁移凭证无效',
    detailsZh: '从自建 On-Premises API 迁移至 Cloud API 时所提供的备份迁移令牌已过期或权限不足。',
    solutionZh: '在源 On-Premises 实例重新调用 /v1/configs/backup 获取最新的迁移凭证，并在 24 小时内完成云端导入。',
    severity: 'client_error',
    httpStatus: 400,
  },
  2593108: {
    category: 'registration',
    categoryNameZh: '号码注册与验证',
    titleEn: 'Cloud API Onboarding Mismatch',
    titleZh: 'Cloud API 接入模式冲突',
    detailsZh: '号码当前已作为 On-Premises 或其他 Cloud API 商业实体运行，无法直接执行初始化注册。',
    solutionZh: '先在源商业中心释放该号码所有权，或联系 Meta 商业技术支持协助执行号码接入模式切换。',
    severity: 'blocker',
    httpStatus: 400,
  },
};

function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/&lt;br\s*\/?&gt;/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function extractLinksFromMarkdown(text) {
  if (!text) return [];
  const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const links = [];
  let m;
  while ((m = mdRegex.exec(text)) !== null) {
    links.push({ title: m[1].trim(), url: m[2].trim() });
  }
  return links;
}

function deduplicateLinks(links) {
  const seen = new Set();
  const res = [];
  for (const l of links || []) {
    if (!l || !l.url || seen.has(l.url)) continue;
    seen.add(l.url);
    res.push({
      title: l.title || '官方指引文档',
      url: l.url,
    });
  }
  return res;
}

function parseMetaAstFromHtml(html) {
  const scriptTags = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  let innerObj = null;
  for (const st of scriptTags) {
    if (st[1].includes('We were unable to authenticate the app user')) {
      try {
        const data = JSON.parse(st[1]);
        function findInner(node) {
          if (!node) return;
          if (typeof node === 'string' && node.includes('We were unable to authenticate the app user')) {
            try { innerObj = JSON.parse(node); } catch {}
            return;
          }
          if (Array.isArray(node)) node.forEach(findInner);
          else if (typeof node === 'object') Object.values(node).forEach(findInner);
        }
        findInner(data);
      } catch {}
      break;
    }
  }

  if (!innerObj) return [];

  function extractTextAndLinks(node) {
    let text = '';
    let links = [];
    if (!node) return { text, links };
    if (typeof node === 'string') return { text: node, links: [] };
    if (typeof node === 'number') return { text: String(node), links: [] };

    if (node.type === 'DMCCommonA') {
      const href = node.props?.href || '';
      const childRes = extractTextAndLinks(node.children);
      const linkText = childRes.text.trim();
      const fullHref = href.startsWith('http') ? href : `https://developers.facebook.com${href}`;
      links.push({ title: linkText, url: fullHref });
      text += `[${linkText}](${fullHref})`;
      return { text, links };
    }

    if (Array.isArray(node)) {
      for (const c of node) {
        const r = extractTextAndLinks(c);
        text += r.text;
        links.push(...r.links);
      }
    } else if (node.children) {
      const r = extractTextAndLinks(node.children);
      text += r.text;
      links.push(...r.links);
    }
    return { text, links };
  }

  function findTrs(node, trs = []) {
    if (!node || typeof node !== 'object') return trs;
    if (node.type === 'DMCCommonTr') trs.push(node);
    if (Array.isArray(node)) node.forEach((n) => findTrs(n, trs));
    else if (node.children) findTrs(node.children, trs);
    else Object.values(node).forEach((n) => findTrs(n, trs));
    return trs;
  }

  const trs = findTrs(innerObj);
  const rows = [];
  for (const tr of trs) {
    const tds = (tr.children || []).filter((c) => c.type === 'DMCCommonTd');
    if (tds.length >= 2) {
      const col0 = extractTextAndLinks(tds[0]);
      const codeMatch = col0.text.match(/\b(\d+)\b/);
      if (codeMatch) {
        const code = parseInt(codeMatch[1], 10);
        let details = '';
        let solution = '';
        let links = [];
        if (tds.length === 2) {
          const c1 = extractTextAndLinks(tds[1]);
          solution = c1.text;
          links = c1.links;
        } else if (tds.length >= 3) {
          const c1 = extractTextAndLinks(tds[1]);
          const c2 = extractTextAndLinks(tds[2]);
          details = c1.text;
          solution = c2.text;
          links = [...c1.links, ...c2.links];
        }

        details = cleanText(details);
        solution = cleanText(solution);

        rows.push({
          code,
          details,
          solution,
          links: deduplicateLinks(links),
          source: 'cloud_api_master',
        });
      }
    }
  }

  return rows;
}

export async function syncErrors() {
  console.log('🔄 正在同步 WhatsApp 错误码（全量融合来源：Cloud API 统一手册 + WABA 侧边栏所有 Edge 目录）...');
  let fetchedRows = [];
  const fetchedMap = new Map();

  // 1. Fetch Cloud API Master Error Codes Doc (support redirect)
  try {
    let res = await fetch(META_DOCS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Accept': '*/*' },
    });
    if (!res.ok) {
      res = await fetch(META_DOCS_FALLBACK_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Accept': '*/*' },
      });
    }

    if (res.ok) {
      const text = await res.text();
      const astRows = parseMetaAstFromHtml(text);
      if (astRows.length > 0) {
        for (const row of astRows) {
          fetchedMap.set(row.code, row);
        }
        console.log(`✅ [1/2] 成功从 WhatsApp Cloud API 官方手册 AST 解析到 ${astRows.length} 条错误码（含完整下钻链接）`);
      } else {
        const tableRowRegex = /\|\s*`?(\d+)`?\s*\|\s*([^|]+)\|\s*([^|]+)\|/g;
        let match;
        let count = 0;
        while ((match = tableRowRegex.exec(text)) !== null) {
          const code = parseInt(match[1], 10);
          const details = cleanText(match[2]);
          const solution = cleanText(match[3]);
          if (!isNaN(code)) {
            const links = deduplicateLinks([
              ...extractLinksFromMarkdown(details),
              ...extractLinksFromMarkdown(solution),
            ]);
            fetchedMap.set(code, { code, details, solution, links, source: 'cloud_api_master' });
            count++;
          }
        }
        console.log(`✅ [1/2] 成功通过正则从 WhatsApp Cloud API 手册解析到 ${count} 条错误码`);
      }
    } else {
      console.warn(`⚠️ 无法直接访问 Meta 官方手册 (HTTP ${res.status})，将使用内置权威知识库。`);
    }
  } catch (err) {
    console.warn('⚠️ 抓取 Meta 官方手册发生网络警告:', err.message);
  }

  // 2. Fetch all 17 WABA Edge reference pages concurrently
  try {
    console.log(`🔄 [2/2] 正在并发扫描 WABA 商业账号侧边栏所有 17 个 Edge 目录...`);
    const wabaResults = await Promise.all(
      WABA_EDGES.map(async (edge) => {
        const url = `${WABA_BASE_URL}${edge}?locale=en_US`;
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'curl/8.1.2' } });
          if (!res.ok) return [];
          const text = await res.text();
          const tables = [...text.matchAll(/<h3>Error Codes<\/h3>.*?<table[^>]*>(.*?)<\/table>/gis)];
          const codes = [];
          for (const t of tables) {
            const trs = [...t[1].matchAll(/<tr><td>(\d+)<\/td><td>(.*?)<\/td><\/tr>/gis)];
            for (const tr of trs) {
              const code = parseInt(tr[1], 10);
              const details = cleanText(tr[2].replace(/<[^>]+>/g, ''));
              codes.push({
                code,
                details,
                solution: `Refer to WhatsApp Graph API Reference (${edge || 'root'}).`,
                links: [],
                source: `waba_${edge || 'root'}`,
              });
            }
          }
          return codes;
        } catch {
          return [];
        }
      })
    );

    let wabaCount = 0;
    for (const item of wabaResults.flat()) {
      if (!fetchedMap.has(item.code)) {
        fetchedMap.set(item.code, item);
        wabaCount++;
      }
    }
    console.log(`✅ [2/2] 成功从 WABA 侧边栏 Edge 目录增补 ${wabaCount} 条独有管理/模板错误码（如 192, 139000, 200000, 200002 等）`);
  } catch (err) {
    console.warn('⚠️ 扫描 WABA 侧边栏 Edge 目录发生警告:', err.message);
  }

  fetchedRows = Array.from(fetchedMap.values());

  // Load existing data if available
  let existingData = { lastSyncedAt: '', items: [] };
  if (fs.existsSync(DATA_FILE)) {
    try {
      existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch {
      // ignore
    }
  }

  // Preserve non-Meta items (such as Aliyun ChatApp, Twilio, etc.)
  const nonMetaItems = (existingData.items || []).filter(
    (item) => item.provider && item.provider !== 'meta'
  );
  console.log(`[SYNC] 保留已有三方服务商错误码（如阿里云）：${nonMetaItems.length} 条`);

  // Existing Meta items map
  const existingMetaMap = new Map();
  for (const item of existingData.items || []) {
    if (!item.provider || item.provider === 'meta') {
      existingMetaMap.set(Number(item.code), item);
    }
  }

  // Build merged Meta items
  const allMetaCodes = new Set([
    ...Object.keys(ERROR_KNOWLEDGE_BASE).map(Number),
    ...fetchedRows.map((r) => r.code),
    ...existingMetaMap.keys(),
  ]);

  const mergedMetaItems = [];
  for (const code of Array.from(allMetaCodes).sort((a, b) => a - b)) {
    const kb = ERROR_KNOWLEDGE_BASE[code] || {};
    const existing = existingMetaMap.get(code) || {};
    const fetched = fetchedRows.find((r) => r.code === code);

    const category = kb.category || existing.category || inferCategory(code);
    const categoryNameZh = kb.categoryNameZh || existing.categoryNameZh || getCategoryNameZh(category);

    const titleEn = kb.titleEn || existing.titleEn || `Error ${code}`;
    const titleZh = kb.titleZh || existing.titleZh || `错误码 ${code}`;

    const detailsEn = cleanText(fetched?.details || existing.detailsEn || kb.detailsEn || 'No official description provided.');
    const detailsZh = cleanText(kb.detailsZh || existing.detailsZh || detailsEn);

    const solutionEn = cleanText(fetched?.solution || existing.solutionEn || kb.solutionEn || 'Refer to WhatsApp Business Platform documentation.');
    const solutionZh = cleanText(kb.solutionZh || existing.solutionZh || solutionEn);

    const severity = kb.severity || existing.severity || inferSeverity(code);
    const httpStatus = kb.httpStatus || existing.httpStatus || 400;

    const docUrl = fetched?.source?.startsWith('waba_')
      ? `${WABA_BASE_URL}${fetched.source.replace('waba_', '') === 'root' ? '' : fetched.source.replace('waba_', '')}`
      : META_DOCS_URL;

    // Merge and deduplicate all relatedLinks:
    // 1. From KB curated relatedLinks
    // 2. From official AST parsed links
    // 3. From markdown links in solutionZh, detailsZh, solutionEn
    // 4. From existing item's relatedLinks
    const relatedLinks = deduplicateLinks([
      ...(kb.relatedLinks || []),
      ...(fetched?.links || []),
      ...extractLinksFromMarkdown(solutionZh),
      ...extractLinksFromMarkdown(detailsZh),
      ...extractLinksFromMarkdown(solutionEn),
      ...(existing.relatedLinks || []),
    ]);

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

    mergedMetaItems.push({
      code,
      provider: 'meta',
      providerNameZh: 'Meta WhatsApp 官方',
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
      docUrl,
      ...(relatedLinks.length > 0 ? { relatedLinks } : {}),
      examplePayload,
    });
  }

  // Final combined dataset: Meta errors + Third-party errors
  const finalItems = [...mergedMetaItems, ...nonMetaItems];
  const output = {
    lastSyncedAt: new Date().toISOString(),
    totalCount: finalItems.length,
    sourceUrl: `${META_DOCS_URL} + ${WABA_BASE_URL}`,
    items: finalItems,
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`🎉 错误码全量知识库更新成功！Meta 错误码：${mergedMetaItems.length} 条（其中包含二级下钻链接：${mergedMetaItems.filter((i) => i.relatedLinks?.length).length} 条），三方服务商错误码：${nonMetaItems.length} 条，全量总计：${finalItems.length} 条 -> ${DATA_FILE}`);
  return output;
}

function inferCategory(code) {
  if (code === 80007 || code === 80008) return 'rate_limit';
  if (code === 104 || code === 190 || code === 200) return 'authentication';
  if (code === 368 || code === 200008 || code === 131031) return 'account';
  if (code === 192 || code === 200002 || code === 200005 || code === 139000) return 'template';
  if (code === 300 || code === 200000 || (code >= 133000 && code < 134000) || (code >= 2593000 && code <= 2594000)) return 'registration';
  if (code >= 130000 && code < 131000) return 'rate_limit';
  if (code >= 131000 && code < 132000) {
    if (code === 131052 || code === 131053) return 'media';
    return 'messaging';
  }
  if (code >= 132000 && code < 133000) return 'template';
  if (code >= 134100 && code <= 134102) return 'template';
  if (code === 134011 || code === 135000 || code === 1752041) return 'account';
  return 'general';
}

function getCategoryNameZh(cat) {
  const map = {
    messaging: '消息发送与接收',
    template: '消息模板与管理',
    rate_limit: '频率与流控限制',
    media: '多媒体上传与下载',
    authentication: '身份鉴权与令牌',
    account: '商业账号与WABA',
    registration: '号码注册与绑定',
    general: '常规 Graph API 错误',
  };
  return map[cat] || '其他';
}

function inferSeverity(code) {
  if (code === 130429 || code === 80007 || code === 80008 || code === 132069 || code === 131048 || code === 134101) return 'rate_limit';
  if (code === 190 || code === 368 || code === 132015 || code === 132016 || code === 139000 || code === 200000 || code === 200008) return 'blocker';
  if (code === 131000 || code === 131016 || code === 131057 || code === 133004 || code === 134102 || code === 135000) return 'service_unavailable';
  return 'client_error';
}

// Direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncErrors().catch((e) => {
    console.error('Sync failed:', e);
    process.exit(1);
  });
}
