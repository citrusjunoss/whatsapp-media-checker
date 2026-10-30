import { describe, it, expect, vi } from 'vitest';
import { fetchRemoteFile } from '../remoteFetcher';

describe('Remote File Fetcher', () => {
  it('should throw an error for empty or invalid protocol URL', async () => {
    await expect(fetchRemoteFile('')).rejects.toThrow('请输入远程文件 URL 地址');
    await expect(fetchRemoteFile('ftp://example.com/test.jpg')).rejects.toThrow(
      'URL 必须以 http:// 或 https:// 开头'
    );
  });

  it('should successfully fetch a remote blob and construct a File object', async () => {
    const fakeBlob = new Blob(['sample-data-content'], { type: 'image/jpeg' });

    // Mock global.fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (h: string) => (h === 'content-disposition' ? 'attachment; filename="my_avatar.jpg"' : null),
      },
      blob: async () => fakeBlob,
    });

    vi.stubGlobal('fetch', mockFetch);

    const file = await fetchRemoteFile('https://example.com/avatar.jpg');
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('my_avatar.jpg');
    expect(file.type).toBe('image/jpeg');
    expect(file.size).toBe(fakeBlob.size);

    vi.unstubAllGlobals();
  });

  it('should fallback to extracting filename from URL path if Content-Disposition is absent', async () => {
    const fakePdfBlob = new Blob(['%PDF-1.4 dummy'], { type: 'application/pdf' });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: () => null,
      },
      blob: async () => fakePdfBlob,
    });

    vi.stubGlobal('fetch', mockFetch);

    const file = await fetchRemoteFile('https://cdn.example.com/assets/annual_report.pdf?token=123');
    expect(file.name).toBe('annual_report.pdf');
    expect(file.type).toBe('application/pdf');

    vi.unstubAllGlobals();
  });
});
