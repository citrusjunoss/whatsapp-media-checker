import React, { useState, useEffect } from 'react';
import { ValidationResult } from '../core/validator';
import { generateApiSnippets, ApiHelperConfig } from '../core/apiHelper';
import { Copy, Check, Terminal, Code2, Settings2, ShieldAlert } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Meta Graph API 请求代码生成器
            </h3>
            <p className="text-[11px] text-slate-500">
              {activeResult.mode === 'template_header'
                ? '自动生成模板 Header 上传与消息模板组件配置'
                : '自动生成普通媒体上传与消息发送 cURL / JSON'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5 text-slate-500" />
          <span>{showConfig ? '收起 API 参数' : '配置 API 参数'}</span>
        </button>
      </div>

      {/* Config Drawer / Settings */}
      {showConfig && (
        <div className="p-5 bg-slate-50/90 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Meta App ID</label>
            <input
              type="text"
              placeholder="e.g. 1234567890"
              value={config.appId || ''}
              onChange={(e) => setConfig({ ...config, appId: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Phone Number ID</label>
            <input
              type="text"
              placeholder="e.g. 10987654321"
              value={config.phoneNumberId || ''}
              onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Access Token</label>
            <input
              type="password"
              placeholder="EAAG..."
              value={config.accessToken || ''}
              onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">测试接收手机号</label>
            <input
              type="text"
              placeholder="+8613800000000"
              value={config.toPhoneNumber || ''}
              onChange={(e) => setConfig({ ...config, toPhoneNumber: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
          </div>
        </div>
      )}

      {/* Snippet Content */}
      <div className="p-6 space-y-5">
        {activeResult.mode === 'template_header' ? (
          <>
            {/* Template Header Step 1 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>第一步：初始化 Resumable Upload 上传会话（POST /uploads）</span>
                </span>
                <button
                  onClick={() => copyToClipboard(snippets.step1Curl!, 'step1')}
                  className="flex items-center space-x-1 text-xs text-teal-700 hover:text-teal-800 font-semibold"
                >
                  {copiedKey === 'step1' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'step1' ? '已复制' : '复制 cURL'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-teal-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
                {snippets.step1Curl}
              </pre>
            </div>

            {/* Template Header Step 2 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>第二步：上传二进制文件流（带 file_offset: 0 请求头）</span>
                </span>
                <button
                  onClick={() => copyToClipboard(snippets.step2Curl!, 'step2')}
                  className="flex items-center space-x-1 text-xs text-teal-700 hover:text-teal-800 font-semibold"
                >
                  {copiedKey === 'step2' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'step2' ? '已复制' : '复制 cURL'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-teal-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
                {snippets.step2Curl}
              </pre>
            </div>

            {/* Template Header Step 3: Template JSON */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Code2 className="w-4 h-4 text-slate-500" />
                  <span>第三步：创建模板组件 JSON（填入第二步返回的 header_handle）</span>
                </span>
                <button
                  onClick={() => copyToClipboard(snippets.templateComponentJson!, 'json')}
                  className="flex items-center space-x-1 text-xs text-teal-700 hover:text-teal-800 font-semibold"
                >
                  {copiedKey === 'json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'json' ? '已复制' : '复制 JSON'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl text-[11px] font-mono overflow-x-auto">
                {snippets.templateComponentJson}
              </pre>
            </div>
          </>
        ) : (
          <>
            {/* Standard Media Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>上传媒体文件到 WhatsApp 服务器（POST /media）</span>
                </span>
                <button
                  onClick={() => copyToClipboard(snippets.standardUploadCurl!, 'std_up')}
                  className="flex items-center space-x-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  {copiedKey === 'std_up' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'std_up' ? '已复制' : '复制 cURL'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
                {snippets.standardUploadCurl}
              </pre>
            </div>

            {/* Standard Media Message Send */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>发送媒体消息给用户（POST /messages）</span>
                </span>
                <button
                  onClick={() => copyToClipboard(snippets.sendMessageCurl!, 'std_msg')}
                  className="flex items-center space-x-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  {copiedKey === 'std_msg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'std_msg' ? '已复制' : '复制 cURL'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
                {snippets.sendMessageCurl}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
