import React from 'react';
import { DocumentScan } from '../types';
import { History, ExternalLink, Download, FileText, CheckCircle2 } from 'lucide-react';

interface ScansHistoryModalProps {
  scans: DocumentScan[];
  onClose: () => void;
}

export const ScansHistoryModal: React.FC<ScansHistoryModalProps> = ({ scans, onClose }) => {
  const downloadPdf = (scan: DocumentScan) => {
    if (!scan.pdfBase64) return;
    const link = document.createElement('a');
    link.href = scan.pdfBase64;
    link.download = `${scan.orderNumber}_${scan.driverName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl text-slate-900 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">היסטוריית תעודות משלוח שנסרקו</h3>
              <p className="text-xs text-slate-500 font-medium">רשימת הסריקות והתעודות שהועלו לענן</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-sm font-bold p-1">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-3 overflow-y-auto flex-1 pr-1 dir-rtl">
          {scans.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-sm text-slate-700">טרם נסרקו תעודות משלוח</div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                סריקות שתאשר יופיעו כאן לצפייה והורדה
              </p>
            </div>
          ) : (
            scans.map((scan) => (
              <div
                key={scan.id}
                className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
              >
                <img
                  src={scan.processedImageBase64 || scan.originalImageBase64}
                  alt={scan.orderNumber}
                  className="w-14 h-16 object-cover rounded-xl border border-slate-200 bg-white shrink-0 shadow-xs"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="font-mono text-blue-600">{scan.orderNumber}</span>
                    <span className="text-slate-600 text-xs truncate">• {scan.driverName}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {new Date(scan.timestamp).toLocaleString('he-IL')}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>הועלה בהצלחה לדרייב</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {scan.pdfBase64 && (
                    <button
                      onClick={() => downloadPdf(scan)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200 transition shadow-xs"
                      title="הורד קובץ PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>PDF</span>
                    </button>
                  )}

                  {scan.driveLink && (
                    <a
                      href={scan.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-blue-200 transition shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>דרייב</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
