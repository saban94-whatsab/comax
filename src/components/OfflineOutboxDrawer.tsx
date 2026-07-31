import React from 'react';
import { DocumentScan } from '../types';
import { CloudUpload, RefreshCw, Trash2, CheckCircle2, AlertTriangle, FileText, ExternalLink } from 'lucide-react';

interface OfflineOutboxDrawerProps {
  outboxQueue: DocumentScan[];
  isOnline: boolean;
  isSyncing: boolean;
  onSyncAll: () => void;
  onRemoveItem: (scanId: string) => void;
  onClose: () => void;
}

export const OfflineOutboxDrawer: React.FC<OfflineOutboxDrawerProps> = ({
  outboxQueue,
  isOnline,
  isSyncing,
  onSyncAll,
  onRemoveItem,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-slate-900 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">תור תעודות לסנכרון אופליין</h3>
              <p className="text-xs text-slate-500 font-medium">
                {outboxQueue.length} תעודות שמורות במכשיר וממתינות לחיבור רשת
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-sm font-bold p-1">
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="py-4 space-y-3 overflow-y-auto flex-1 pr-1 dir-rtl">
          {outboxQueue.length === 0 ? (
            <div className="text-center py-10 space-y-2 text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm text-slate-900">אין תעודות ממתינות לסנכרון</div>
              <p className="text-xs text-slate-500 font-medium">כל הסריקות סונכרנו בהצלחה לענן!</p>
            </div>
          ) : (
            outboxQueue.map((scan) => (
              <div
                key={scan.id}
                className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
              >
                {/* Thumbnail */}
                <img
                  src={scan.processedImageBase64 || scan.originalImageBase64}
                  alt={scan.orderNumber}
                  className="w-14 h-16 object-cover rounded-xl border border-slate-200 bg-white shrink-0 shadow-xs"
                />

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="font-mono text-blue-600">{scan.orderNumber}</span>
                    <span className="text-slate-600 text-xs truncate">• {scan.driverName}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {new Date(scan.timestamp).toLocaleString('he-IL')}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>שמור בממתינה (Offline)</span>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => onRemoveItem(scan.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition"
                  title="מחק מהתור"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-200 shrink-0 flex gap-3">
          <button
            onClick={onSyncAll}
            disabled={!isOnline || isSyncing || outboxQueue.length === 0}
            className={`flex-1 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition ${
              isOnline && outboxQueue.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>מסנכרן תעודות כעת...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>{isOnline ? 'סנכרן את כל התעודות כעת' : 'נדרש חיבור אינטרנט לסנכרון'}</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
