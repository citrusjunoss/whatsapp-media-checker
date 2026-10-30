import { describe, it, expect } from 'vitest';
import { searchErrors, getLoadedErrorDataset } from '../errorEngine';

describe('WhatsApp Error Lookup Engine', () => {
  const dataset = getLoadedErrorDataset();

  it('should load error dataset with at least 50 official error codes', () => {
    expect(dataset.items.length).toBeGreaterThanOrEqual(50);
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
  });

  it('should filter by category properly', () => {
    const templateErrors = searchErrors('', 'template', dataset.items);
    expect(templateErrors.length).toBeGreaterThan(0);
    expect(templateErrors.every((i) => i.category === 'template')).toBe(true);
    expect(templateErrors.some((i) => i.code === 132000)).toBe(true);
    expect(templateErrors.some((i) => i.code === 132001)).toBe(true);
  });

  it('should include WABA Graph API management and template creation errors (e.g. 192, 139000, 200000, 80008)', () => {
    // 192 Invalid phone number in template
    const res192 = searchErrors('192', 'all', dataset.items);
    expect(res192.length).toBeGreaterThanOrEqual(1);
    expect(res192[0].code).toBe(192);
    expect(res192[0].category).toBe('template');
    expect(res192[0].titleZh).toContain('模板');

    // 139000 Blocked by integrity
    const res139000 = searchErrors('139000', 'all', dataset.items);
    expect(res139000.length).toBeGreaterThanOrEqual(1);
    expect(res139000[0].titleZh).toContain('合规拦截');

    // 200000 Cannot add phone number to WABA
    const res200000 = searchErrors('200000', 'all', dataset.items);
    expect(res200000.length).toBeGreaterThanOrEqual(1);
    expect(res200000[0].category).toBe('registration');

    // 80008 WABA account rate limit
    const res80008 = searchErrors('80008', 'all', dataset.items);
    expect(res80008.length).toBeGreaterThanOrEqual(1);
    expect(res80008[0].category).toBe('rate_limit');
  });

  it('should ensure each error item contains essential diagnostic properties', () => {
    dataset.items.forEach((item) => {
      expect(item.code).toBeTypeOf('number');
      expect(item.titleEn).toBeTruthy();
      expect(item.titleZh).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.categoryNameZh).toBeTruthy();
      expect(item.detailsEn).toBeTruthy();
      expect(item.solutionEn).toBeTruthy();
      expect(item.examplePayload).toBeTruthy();
    });
  });
});
