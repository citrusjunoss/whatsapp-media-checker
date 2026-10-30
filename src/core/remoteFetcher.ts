/**
 * Fetch remote file by URL, convert to File object with auto CORS fallback
 */

export interface RemoteFetchOptions {
  onProgressMessage?: (msg: string) => void;
  corsProxy?: boolean;
}

export async function fetchRemoteFile(
  url: string,
  options: RemoteFetchOptions = { corsProxy: true }
): Promise<File> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('请输入远程文件 URL 地址');
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    throw new Error('URL 必须以 http:// 或 https:// 开头');
  }

  options.onProgressMessage?.('正在请求远程文件...');

  let response: Response | null = null;
  let lastError: Error | null = null;

  // 1. Try direct fetch
  try {
    response = await fetch(trimmed, {
      method: 'GET',
    });
  } catch (err: any) {
    lastError = err;
  }

  // 2. If direct fetch fails (usually CORS in browser) and proxy is enabled, fallback to CORS proxy
  if ((!response || !response.ok) && options.corsProxy) {
    options.onProgressMessage?.('直接拉取遇到跨域限制，正在切换备用代理获取...');
    const proxies = [
      (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    ];

    for (const makeProxy of proxies) {
      try {
        const proxyUrl = makeProxy(trimmed);
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) {
          response = proxyRes;
          lastError = null;
          break;
        }
      } catch (proxyErr: any) {
        lastError = proxyErr;
      }
    }
  }

  if (!response || !response.ok) {
    throw new Error(
      `无法获取远程文件：${response ? `HTTP ${response.status} ${response.statusText}` : lastError?.message || '网络或跨域错误'}。请确认链接可公开访问，或将文件下载后直接拖入本地上传。`
    );
  }

  options.onProgressMessage?.('正在下载并读取文件数据流...');
  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error('远程返回的文件内容为空 (0 字节)');
  }

  // Determine file name
  let filename = '';
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, '').trim();
    }
  }

  if (!filename) {
    try {
      const pathname = new URL(trimmed).pathname;
      const base = pathname.split('/').pop();
      if (base && base.includes('.')) {
        filename = decodeURIComponent(base.split('?')[0].split('#')[0]);
      }
    } catch {
      // ignore
    }
  }

  if (!filename) {
    const mime = blob.type || 'application/octet-stream';
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/3gpp': '3gp',
      'application/pdf': 'pdf',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/aac': 'aac',
    };
    const ext = extMap[mime] || 'bin';
    filename = `remote_file_${Date.now()}.${ext}`;
  }

  return new File([blob], filename, { type: blob.type });
}
