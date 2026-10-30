import React from 'react';
import { X, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { FORMAT_DOC_LINKS } from '../core/rules';

interface RulesReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesReference: React.FC<RulesReferenceProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="app-surface rounded-lg max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border app-border font-mono transition-colors">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b app-border flex items-center justify-between app-surface-subtle">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold app-text-main">
              META_WHATSAPP_SPECIFICATION_MATRIX
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded app-text-dim hover:app-text-main hover:app-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs app-text-muted leading-relaxed">
          {/* Docs Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <a
              href={FORMAT_DOC_LINKS.STANDARD_MEDIA}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded border app-border app-surface-subtle hover:app-border transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-bold app-text-main text-xs">Standard Media API (/media)</div>
                <div className="text-[10px] app-text-dim mt-0.5">
                  developers.facebook.com/.../media
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 app-text-dim" />
            </a>

            <a
              href={FORMAT_DOC_LINKS.RESUMABLE_UPLOAD}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded border app-border app-surface-subtle hover:app-border transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-bold app-text-main text-xs">Resumable Upload API (/uploads)</div>
                <div className="text-[10px] app-text-dim mt-0.5">
                  developers.facebook.com/docs/graph-api/guides/upload
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 app-text-dim" />
            </a>
          </div>

          {/* Matrix Table */}
          <div className="border app-border rounded overflow-hidden">
            <table className="min-w-full divide-y app-border text-left">
              <thead className="app-surface-subtle font-semibold text-[10px] app-text-dim uppercase">
                <tr>
                  <th className="py-2 px-3">CATEGORY</th>
                  <th className="py-2 px-3">STANDARD (/media)</th>
                  <th className="py-2 px-3 text-emerald-500">HEADER (/uploads)</th>
                  <th className="py-2 px-3">SPECIFICATIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y app-border app-surface text-[11px]">
                <tr>
                  <td className="py-2 px-3 font-semibold app-text-main">Image (图片)</td>
                  <td className="py-2 px-3">JPEG, PNG</td>
                  <td className="py-2 px-3 font-bold text-emerald-500">JPEG, PNG</td>
                  <td className="py-2 px-3 app-text-dim">≤ 5 MB, 8-bit RGB/RGBA</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold app-text-main">Video (视频)</td>
                  <td className="py-2 px-3">MP4, 3GP</td>
                  <td className="py-2 px-3 font-bold text-rose-500">MP4 ONLY (No 3GP)</td>
                  <td className="py-2 px-3 app-text-dim">≤ 16 MB, H.264 + AAC, moov first</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold app-text-main">Audio (音频)</td>
                  <td className="py-2 px-3">AAC, MP4, AMR, MP3, OGG</td>
                  <td className="py-2 px-3 font-bold text-rose-500">UNSUPPORTED</td>
                  <td className="py-2 px-3 app-text-dim">≤ 16 MB, Ogg Opus codec</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold app-text-main">Document (文档)</td>
                  <td className="py-2 px-3">PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT</td>
                  <td className="py-2 px-3 font-bold text-rose-500">PDF ONLY (No Office/TXT)</td>
                  <td className="py-2 px-3 app-text-dim">≤ 100 MB</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold app-text-main">Sticker (贴纸)</td>
                  <td className="py-2 px-3">WebP (512×512)</td>
                  <td className="py-2 px-3 font-bold text-rose-500">UNSUPPORTED</td>
                  <td className="py-2 px-3 app-text-dim">Static ≤ 100KB, Anim ≤ 500KB</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded border app-border app-surface-subtle text-[11px] space-y-1">
            <div className="font-bold app-text-main flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>GRAPH_API_UPLOADS_NOTICE:</span>
            </div>
            <p className="app-text-dim font-sans">
              Graph API <code>/uploads</code> 端点只允许合法传入：
              <code>image/jpeg</code>、<code>image/png</code>、<code>video/mp4</code>、<code>application/pdf</code>。
              传入其他 MIME 类型（如 Word 或音频）将直接返回 400 Bad Request。
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 border-t app-border app-surface-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
