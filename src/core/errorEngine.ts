import errorsData from '../data/whatsapp-errors.json';

export type ErrorSeverity = 'blocker' | 'client_error' | 'rate_limit' | 'service_unavailable';

export interface WhatsAppErrorItem {
  code: number;
  subcode?: number;
  category: string;
  categoryNameZh: string;
  titleEn: string;
  titleZh: string;
  detailsEn: string;
  detailsZh: string;
  solutionEn: string;
  solutionZh: string;
  severity: ErrorSeverity;
  httpStatus?: number;
  docUrl?: string;
  examplePayload?: string;
}

export interface ErrorDataset {
  lastSyncedAt: string;
  totalCount: number;
  sourceUrl: string;
  items: WhatsAppErrorItem[];
}

export const ERROR_CATEGORIES = [
  { id: 'all', nameZh: '全部错误', count: (errorsData as ErrorDataset).items.length },
  { id: 'messaging', nameZh: '消息发送与接收' },
  { id: 'template', nameZh: '消息模板与管理 (192/132xxx)' },
  { id: 'rate_limit', nameZh: '频率与流控限制 (80008)' },
  { id: 'media', nameZh: '多媒体处理 (131052/53)' },
  { id: 'authentication', nameZh: '身份鉴权与Token (190)' },
  { id: 'account', nameZh: '商业账号与WABA (368)' },
  { id: 'registration', nameZh: '号码注册与绑定 (200000)' },
  { id: 'general', nameZh: '常规 Graph API' },
];

export const POPULAR_ERROR_CODES = [
  { code: 131047, label: '131047 · 24小时窗口超时', tag: '高频' },
  { code: 131026, label: '131026 · 消息无法送达', tag: '高频' },
  { code: 192, label: '192 · 模板创建号码无效', tag: '模板' },
  { code: 130429, label: '130429 · 限流 Rate Limit', tag: '高频' },
  { code: 132000, label: '132000 · 模板变量不匹配', tag: '模板' },
  { code: 80008, label: '80008 · WABA 账号频控', tag: '限流' },
  { code: 190, label: '190 · Token 过期失效', tag: '鉴权' },
  { code: 131053, label: '131053 · 媒体上传失败', tag: '媒体' },
  { code: 200000, label: '200000 · 号码绑定失败', tag: '配置' },
  { code: 131042, label: '131042 · 支付/账单异常', tag: '账号' },
];

export function getLoadedErrorDataset(): ErrorDataset {
  return errorsData as ErrorDataset;
}

export function searchErrors(
  query: string,
  category: string = 'all',
  dataset: WhatsAppErrorItem[] = (errorsData as ErrorDataset).items
): WhatsAppErrorItem[] {
  const trimmed = query.trim().toLowerCase();

  return dataset.filter((item) => {
    // 1. Category Filter
    if (category !== 'all') {
      if (item.category !== category) return false;
    }

    if (!trimmed) return true;

    // 2. Query Search
    // Check if code matches (prefix or exact)
    const codeStr = item.code.toString();
    if (codeStr.includes(trimmed)) return true;

    // Subcode
    if (item.subcode && item.subcode.toString().includes(trimmed)) return true;

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
