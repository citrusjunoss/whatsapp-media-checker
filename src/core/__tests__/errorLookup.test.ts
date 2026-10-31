import { describe, it, expect } from 'vitest';
import { searchErrors, getLoadedErrorDataset, ERROR_PROVIDERS } from '../errorEngine';

describe('WhatsApp Error Lookup Engine with Multi-Provider Support', () => {
  const dataset = getLoadedErrorDataset();

  it('should load error dataset with official Meta and third-party BSP error codes', () => {
    expect(dataset.items.length).toBeGreaterThanOrEqual(75);
    expect(dataset.sourceUrl).toContain('developers.facebook.com');
  });

  it('should search by numeric error code exactly and as prefix', () => {
    // Exact match
    const res131047 = searchErrors('131047', 'all', dataset.items);
    expect(res131047.length).toBeGreaterThanOrEqual(1);
    expect(res131047[0].code).toBe(131047);
    expect(res131047[0].titleZh).toContain('24小时');

    // Code prefix
    const res1320 = searchErrors('1320', 'all', dataset.items);
    expect(res1320.length).toBeGreaterThan(1);
    expect(res1320.every((item) => item.code.toString().includes('1320'))).toBe(true);
  });

  it('should search third-party string-based error codes (e.g. Alibaba Cloud isv.*)', () => {
    // Search Alibaba Cloud isv.TEMPLATE_PARAM_INVALID
    const resIsv = searchErrors('isv.TEMPLATE_PARAM_INVALID', 'all', dataset.items);
    expect(resIsv.length).toBeGreaterThanOrEqual(1);
    expect(resIsv[0].code).toBe('isv.TEMPLATE_PARAM_INVALID');
    expect(resIsv[0].provider).toBe('aliyun');
    expect(resIsv[0].providerNameZh).toBe('阿里云 ChatApp');
    expect(resIsv[0].titleZh).toContain('模板入参变量不匹配');

    // Case-insensitive search on string code
    const resLower = searchErrors('template_param', 'all', dataset.items);
    expect(resLower.some((i) => i.code === 'isv.TEMPLATE_PARAM_INVALID')).toBe(true);
  });

  it('should filter by Provider correctly (Meta vs Aliyun)', () => {
    // Filter Meta
    const metaErrors = searchErrors('', 'all', dataset.items, 'meta');
    expect(metaErrors.length).toBeGreaterThanOrEqual(70);
    expect(metaErrors.every((i) => (i.provider || 'meta') === 'meta')).toBe(true);

    // Filter Aliyun
    const aliyunErrors = searchErrors('', 'all', dataset.items, 'aliyun');
    expect(aliyunErrors.length).toBeGreaterThanOrEqual(4);
    expect(aliyunErrors.every((i) => i.provider === 'aliyun')).toBe(true);
    expect(aliyunErrors.some((i) => i.code === 'isv.BUSINESS_LIMIT_CONTROL')).toBe(true);
  });

  it('should search by English keyword (case-insensitive)', () => {
    const res = searchErrors('undeliverable', 'all', dataset.items);
    expect(res.length).toBeGreaterThanOrEqual(1);
    const item131026 = res.find((i) => i.code === 131026);
    expect(item131026).toBeDefined();
    expect(item131026?.titleEn).toContain('Message Undeliverable');
  });

  it('should search by Chinese keyword', () => {
    // Search "24小时"
    const res24h = searchErrors('24小时', 'all', dataset.items);
    expect(res24h.some((i) => i.code === 131047)).toBe(true);

    // Search "限流"
    const resRate = searchErrors('限流', 'all', dataset.items);
    expect(resRate.some((i) => i.code === 130429)).toBe(true);

    // Search "Token"
    const resToken = searchErrors('Token', 'all', dataset.items);
    expect(resToken.some((i) => i.code === 190)).toBe(true);

    // Search "阿里云"
    const resAli = searchErrors('阿里云', 'all', dataset.items);
    expect(resAli.length).toBeGreaterThanOrEqual(4);
  });

  it('should filter by category properly', () => {
    const templateErrors = searchErrors('', 'template', dataset.items);
    expect(templateErrors.length).toBeGreaterThan(0);
    expect(templateErrors.every((i) => i.category === 'template')).toBe(true);
    expect(templateErrors.some((i) => i.code === 132000)).toBe(true);
    expect(templateErrors.some((i) => i.code === 'isv.TEMPLATE_PARAM_INVALID')).toBe(true);
  });

  it('should support drilldown official relatedLinks on Meta errors with clickable URLs', () => {
    // Check Code 0, 3, 10, 190, 200
    const code0 = dataset.items.find((i) => i.code === 0);
    expect(code0?.relatedLinks).toBeDefined();
    expect(code0?.relatedLinks?.some((l) => l.url.includes('access-tokens'))).toBe(true);

    const code3 = dataset.items.find((i) => i.code === 3);
    expect(code3?.relatedLinks).toBeDefined();
    expect(code3?.relatedLinks?.some((l) => l.url.includes('tools/debug/accesstoken'))).toBe(true);

    const code10 = dataset.items.find((i) => i.code === 10);
    expect(code10?.relatedLinks).toBeDefined();
    expect(code10?.relatedLinks?.some((l) => l.url.includes('whatsapp-business-encryption'))).toBe(true);

    const code190 = dataset.items.find((i) => i.code === 190);
    expect(code190?.relatedLinks).toBeDefined();
    expect(code190?.relatedLinks?.length).toBeGreaterThanOrEqual(1);

    // Search by related link title or keyword
    const resDebugger = searchErrors('accesstoken', 'all', dataset.items);
    expect(resDebugger.length).toBeGreaterThanOrEqual(1);
    expect(resDebugger.some((i) => i.code === 3 || i.code === 10 || i.code === 190)).toBe(true);
  });

  it('should ensure each error item contains essential diagnostic properties', () => {
    dataset.items.forEach((item) => {
      expect(['string', 'number']).toContain(typeof item.code);
      expect(item.titleZh).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.categoryNameZh).toBeTruthy();
      expect(item.detailsZh).toBeTruthy();
      expect(item.solutionZh).toBeTruthy();
      expect(item.severity).toBeTruthy();
    });
  });
});
