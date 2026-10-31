import errorsData from '../data/whatsapp-errors.json';

export type ErrorSeverity = 'blocker' | 'client_error' | 'rate_limit' | 'service_unavailable';

export interface WhatsAppErrorItem {
  code: string | number;
  subcode?: number;
  provider?: string;         // 'meta' | 'aliyun' | 'twilio' | ...
  providerNameZh?: string;   // 'Meta WhatsApp 官方' | '阿里云 ChatApp' | ...
  category: string;
  categoryNameZh: string;
  titleEn: string;
  titleZh: string;
  detailsEn?: string;
  detailsZh: string;
  solutionEn?: string;
  solutionZh: string;
  severity: ErrorSeverity;
  httpStatus?: number;
  docUrl?: string;
  examplePayload?: string;
  contributor?: string;
}

export interface ErrorDataset {
  lastSyncedAt: string;
  totalCount: number;
  sourceUrl: string;
  items: WhatsAppErrorItem[];
}

export interface ErrorProviderConfig {
  id: string;
  nameZh: string;
  badgeStyle: string;
}

export const ERROR_PROVIDERS: ErrorProviderConfig[] = [
  { id: 'all', nameZh: '全部渠道', badgeStyle: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { id: 'meta', nameZh: 'Meta 官方', badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'aliyun', nameZh: '阿里云 ChatApp', badgeStyle: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { id: 'twilio', nameZh: 'Twilio', badgeStyle: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { id: 'other', nameZh: '其他三方 BSP', badgeStyle: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
];

export const ERROR_CATEGORIES = [
  { id: 'all', nameZh: '全部错误', count: (errorsData as ErrorDataset).items.length },
  { id: 'messaging', nameZh: '消息发送与接收' },
  { id: 'template', nameZh: '消息模板与管理 (192/132xxx/isv)' },
  { id: 'rate_limit', nameZh: '频率与流控限制 (80008/isv)' },
  { id: 'media', nameZh: '多媒体处理 (131052/53)' },
  { id: 'authentication', nameZh: '身份鉴权与Token (190)' },
  { id: 'account', nameZh: '商业账号与WABA (368)' },
  { id: 'registration', nameZh: '号码注册与绑定 (200000)' },
  { id: 'general', nameZh: '常规 Graph / 网关 API' },
];

export const POPULAR_ERROR_CODES = [
  { code: 'isv.TEMPLATE_PARAM_INVALID', label: 'isv · 阿里模板变量不匹配', tag: '阿里', provider: 'aliyun' },
  { code: 131047, label: '131047 · 24小时窗口超时', tag: '高频', provider: 'meta' },
  { code: 131026, label: '131026 · 消息无法送达', tag: '高频', provider: 'meta' },
  { code: 'isv.BUSINESS_LIMIT_CONTROL', label: 'isv · 阿里业务频控超限', tag: '限流', provider: 'aliyun' },
  { code: 192, label: '192 · 模板创建号码无效', tag: '模板', provider: 'meta' },
  { code: 130429, label: '130429 · 限流 Rate Limit', tag: '高频', provider: 'meta' },
  { code: 132000, label: '132000 · 模板变量不匹配', tag: '模板', provider: 'meta' },
  { code: 'isv.WABA_ACCOUNT_BLOCKED', label: 'isv · WABA账号状态受限', tag: '阻断', provider: 'aliyun' },
  { code: 80008, label: '80008 · WABA 账号频控', tag: '限流', provider: 'meta' },
  { code: 190, label: '190 · Token 过期失效', tag: '鉴权', provider: 'meta' },
];

export function getLoadedErrorDataset(): ErrorDataset {
  return errorsData as ErrorDataset;
}

export function searchErrors(
  query: string,
  category: string = 'all',
  dataset: WhatsAppErrorItem[] = (errorsData as ErrorDataset).items,
  provider: string = 'all'
): WhatsAppErrorItem[] {
  const trimmed = query.trim().toLowerCase();

  return dataset.filter((item) => {
    // 1. Provider Filter
    if (provider !== 'all') {
      const itemProvider = item.provider || 'meta';
      if (itemProvider !== provider) return false;
    }

    // 2. Category Filter
    if (category !== 'all') {
      if (item.category !== category) return false;
    }

    if (!trimmed) return true;

    // 3. Query Search
    // Check if code matches (case-insensitive substring)
    const codeStr = item.code.toString().toLowerCase();
    if (codeStr.includes(trimmed)) return true;

    // Subcode
    if (item.subcode && item.subcode.toString().includes(trimmed)) return true;

    // Provider search
    if (item.provider?.toLowerCase().includes(trimmed)) return true;
    if (item.providerNameZh?.toLowerCase().includes(trimmed)) return true;

    // English text search
    if (item.titleEn?.toLowerCase().includes(trimmed)) return true;
    if (item.detailsEn?.toLowerCase().includes(trimmed)) return true;
    if (item.solutionEn?.toLowerCase().includes(trimmed)) return true;

    // Chinese text search
    if (item.titleZh?.toLowerCase().includes(trimmed)) return true;
    if (item.detailsZh?.toLowerCase().includes(trimmed)) return true;
    if (item.solutionZh?.toLowerCase().includes(trimmed)) return true;
    if (item.categoryNameZh?.toLowerCase().includes(trimmed)) return true;

    return false;
  });
}

export function getProviderBadgeStyle(provider?: string): string {
  switch (provider) {
    case 'aliyun':
      return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
    case 'twilio':
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    case 'meta':
    default:
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  }
}
