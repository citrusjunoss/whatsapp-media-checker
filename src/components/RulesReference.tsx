import React from 'react';
import { X, ExternalLink, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FORMAT_DOC_LINKS } from '../core/rules';

interface RulesReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesReference: React.FC<RulesReferenceProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Meta 官方 WhatsApp 媒体规范速查表
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Overview Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href={FORMAT_DOC_LINKS.STANDARD_MEDIA}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-emerald-900 text-sm">标准媒体规范文档</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  developers.facebook.com/.../business-phone-numbers/media
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-600" />
            </a>

            <a
              href={FORMAT_DOC_LINKS.RESUMABLE_UPLOAD}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-teal-900 text-sm">Resumable Upload 规范文档</div>
                <div className="text-[11px] text-teal-700 mt-0.5">
                  developers.facebook.com/docs/graph-api/guides/upload
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-teal-600" />
            </a>
          </div>

          {/* Detailed Matrix Table */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-2.5">
              双模式规格对比与限制一览
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">媒体类型</th>
                    <th className="py-2.5 px-3">标准媒体模式 (/media)</th>
                    <th className="py-2.5 px-3 bg-teal-50/60 text-teal-950">模板 Header 模式 (/uploads)</th>
                    <th className="py-2.5 px-3">大小限制与编码要求</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Image (图片)</td>
                    <td className="py-2.5 px-3">JPEG, PNG</td>
                    <td className="py-2.5 px-3 bg-teal-50/20 font-medium text-teal-900">
                      仅限 JPEG, PNG
                    </td>
                    <td className="py-2.5 px-3">≤ 5 MB，推荐 8-bit RGB/RGBA</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Video (视频)</td>
                    <td className="py-2.5 px-3">MP4, 3GP</td>
                    <td className="py-2.5 px-3 bg-teal-50/20 font-bold text-rose-700">
                      仅限 MP4（严禁 3GP）
                    </td>
                    <td className="py-2.5 px-3">
                      ≤ 16 MB，H.264 视频 + AAC 音频，moov 在前 (FastStart)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Audio (音频)</td>
                    <td className="py-2.5 px-3">AAC, MP4, AMR, MP3, OGG</td>
                    <td className="py-2.5 px-3 bg-teal-50/20 font-bold text-rose-700">
                      ❌ 不支持（Header 无音频）
                    </td>
                    <td className="py-2.5 px-3">≤ 16 MB，OGG 需采用 Opus 编码</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Document (文档)</td>
                    <td className="py-2.5 px-3">PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT</td>
                    <td className="py-2.5 px-3 bg-teal-50/20 font-bold text-rose-700">
                      仅限 PDF（严禁 Office/TXT）
                    </td>
                    <td className="py-2.5 px-3">≤ 100 MB</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Sticker (贴纸)</td>
                    <td className="py-2.5 px-3">WebP (严格 512×512)</td>
                    <td className="py-2.5 px-3 bg-teal-50/20 font-bold text-rose-700">
                      ❌ 不支持（Header 无贴纸）
                    </td>
                    <td className="py-2.5 px-3">
                      静态 ≤ 100 KB，动态 ≤ 500 KB，必须严格 512x512
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Important Notices */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center space-x-1.5 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>特别注意：模板 Header Resumable Upload 的特殊限制</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Meta Graph API 的 <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">/uploads</code> 端点在初始化时，
              <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">file_type</code> 字段仅合法接受：
              <code className="bg-white/80 px-1 rounded font-bold">image/jpeg</code>、
              <code className="bg-white/80 px-1 rounded font-bold">image/png</code>、
              <code className="bg-white/80 px-1 rounded font-bold">video/mp4</code>、
              <code className="bg-white/80 px-1 rounded font-bold">application/pdf</code>。
              若传入其他 MIME 类型（如 Word 文档或音频），接口将直接返回 400 Bad Request 阻断创建。
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-xs transition-colors"
          >
            我已知晓
          </button>
        </div>
      </div>
    </div>
  );
};
