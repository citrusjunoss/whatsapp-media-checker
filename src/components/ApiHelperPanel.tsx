import React, { useState, useEffect } from 'react';
import { ValidationResult } from '../core/validator';
import { generateApiSnippets, ApiHelperConfig } from '../core/apiHelper';
import { Copy, Check, Terminal, Code2, Settings2 } from 'lucide-react';

interface ApiHelperPanelProps {
  activeResult: ValidationResult;
}

export const ApiHelperPanel: React.FC<ApiHelperPanelProps> = ({ activeResult }) => {
  const [config, setConfig] = useState<ApiHelperConfig>(() => {
    try {
      const saved = localStorage.getItem('wa_api_helper_config');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('wa_api_helper_config', JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  const snippets = generateApiSnippets(
    {
      name: activeResult.fileName,
      size: activeResult.fileSize,
      detectedMime: activeResult.detectedMime,
      category: activeResult.detectedCategory,
    },
    activeResult.mode,
    config
  );

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="app-surface rounded-lg border app-border overflow-hidden transition-colors">
      {/* Header Strip */}
      <div className="p-3 border-b app-border app-surface-subtle flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-500" />
          <span className="font-mono font-bold app-text-main">META_GRAPH_API_SNIPPETS</span>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-mono app-surface border app-border app-text-muted hover:app-text-main rounded transition-colors"
        >
          <Settings2 className="w-3 h-3" />
          <span>{showConfig ? 'HIDE_CONFIG' : 'API_CREDENTIALS'}</span>
        </button>
      </div>

      {/* Config Drawer */}
      {showConfig && (
        <div className="p-3 border-b app-border app-surface-subtle grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
          <div>
            <label className="block app-text-dim text-[10px] mb-1">APP_ID</label>
            <input
              type="text"
              placeholder="1234567890"
              value={config.appId || ''}
              onChange={(e) => setConfig({ ...config, appId: e.target.value })}
              className="w-full px-2 py-1 app-surface border app-border rounded text-[11px] app-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block app-text-dim text-[10px] mb-1">PHONE_NUMBER_ID</label>
            <input
              type="text"
              placeholder="10987654321"
              value={config.phoneNumberId || ''}
              onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
              className="w-full px-2 py-1 app-surface border app-border rounded text-[11px] app-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block app-text-dim text-[10px] mb-1">ACCESS_TOKEN</label>
            <input
              type="password"
              placeholder="EAAG..."
              value={config.accessToken || ''}
              onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
              className="w-full px-2 py-1 app-surface border app-border rounded text-[11px] app-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block app-text-dim text-[10px] mb-1">RECIPIENT_PHONE</label>
            <input
              type="text"
              placeholder="+8613800000000"
              value={config.toPhoneNumber || ''}
              onChange={(e) => setConfig({ ...config, toPhoneNumber: e.target.value })}
              className="w-full px-2 py-1 app-surface border app-border rounded text-[11px] app-text-main focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Snippet Blocks */}
      <div className="p-4 space-y-4 font-mono text-xs">
        {activeResult.mode === 'template_header' ? (
          <>
            <div>
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="app-text-dim">STEP_1: INITIALIZE_RESUMABLE_SESSION (POST /uploads)</span>
                <button
                  onClick={() => copyToClipboard(snippets.step1Curl!, 'step1')}
                  className="text-emerald-500 hover:text-emerald-400 flex items-center space-x-1"
                >
                  {copiedKey === 'step1' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'step1' ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <pre className="app-code-bg border app-border p-2.5 rounded text-[11px] app-text-muted overflow-x-auto whitespace-pre-wrap">
                {snippets.step1Curl}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="app-text-dim">STEP_2: UPLOAD_BINARY_STREAM (POST /upload:id)</span>
                <button
                  onClick={() => copyToClipboard(snippets.step2Curl!, 'step2')}
                  className="text-emerald-500 hover:text-emerald-400 flex items-center space-x-1"
                >
                  {copiedKey === 'step2' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'step2' ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <pre className="app-code-bg border app-border p-2.5 rounded text-[11px] app-text-muted overflow-x-auto whitespace-pre-wrap">
                {snippets.step2Curl}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="app-text-dim">STEP_3: TEMPLATE_COMPONENT_HEADER_JSON</span>
                <button
                  onClick={() => copyToClipboard(snippets.templateComponentJson!, 'json')}
                  className="text-emerald-500 hover:text-emerald-400 flex items-center space-x-1"
                >
                  {copiedKey === 'json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'json' ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <pre className="app-code-bg border app-border p-2.5 rounded text-[11px] app-text-muted overflow-x-auto">
                {snippets.templateComponentJson}
              </pre>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="app-text-dim">1. UPLOAD_MEDIA_ASSET (POST /{config.phoneNumberId || 'PHONE_NUMBER_ID'}/media)</span>
                <button
                  onClick={() => copyToClipboard(snippets.standardUploadCurl!, 'std_up')}
                  className="text-emerald-500 hover:text-emerald-400 flex items-center space-x-1"
                >
                  {copiedKey === 'std_up' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'std_up' ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <pre className="app-code-bg border app-border p-2.5 rounded text-[11px] app-text-muted overflow-x-auto whitespace-pre-wrap">
                {snippets.standardUploadCurl}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <span className="app-text-dim">2. DISPATCH_MESSAGE (POST /{config.phoneNumberId || 'PHONE_NUMBER_ID'}/messages)</span>
                <button
                  onClick={() => copyToClipboard(snippets.sendMessageCurl!, 'std_msg')}
                  className="text-emerald-500 hover:text-emerald-400 flex items-center space-x-1"
                >
                  {copiedKey === 'std_msg' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'std_msg' ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
              <pre className="app-code-bg border app-border p-2.5 rounded text-[11px] app-text-muted overflow-x-auto whitespace-pre-wrap">
                {snippets.sendMessageCurl}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
