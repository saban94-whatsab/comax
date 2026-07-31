import React, { useState } from 'react';
import { PackageX, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { Driver } from '../types';

interface ReturnReasonModalProps {
  driver: Driver;
  orderNumber: string;
  itemType: string;
  count: number;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export const ReturnReasonModal: React.FC<ReturnReasonModalProps> = ({
  driver,
  orderNumber,
  itemType,
  count,
  onConfirm,
  onCancel,
}) => {
  const [reasonText, setReasonText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonText.trim() || reasonText.trim().length < 4) {
      setErrorMsg(`אנא ${driver.name} ציין במשפט קצר את סיבת ההחזרה (לפחות 4 תווים)`);
      return;
    }
    onConfirm(reasonText.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl animate-fade-in">
      <div className="bg-white border-2 border-amber-300 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-slate-900 space-y-5">
        {/* Top Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <PackageX className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>התראת כמות פקדונות גדולה ({count} {itemType})</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">בקרת החזרות ופקדונות</h3>
            <p className="text-xs text-slate-500 font-medium">
              תעודה #{orderNumber} | נהג: {driver.name}
            </p>
          </div>
        </div>

        {/* Prompt Banner */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
          <p className="text-sm font-black text-amber-950 flex items-center gap-2">
            <span>אנא {driver.name} ציין במשפט את סיבת ההחזרה</span>
          </p>
          <p className="text-xs text-amber-800 font-medium">
            נרשמה כמות חריגה של {count} יחידות {itemType}. המערכת דורשת תיעוד מילולי של סיבת ההחזרה לדיווח ב-Google Sheets.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>פירוט סיבת ההחזרה (חובה):</span>
            </label>
            <textarea
              rows={3}
              value={reasonText}
              onChange={(e) => {
                setReasonText(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder={`לדוגמה: ${driver.name} - הבלות פגומות / הלקוח החזיר משטחים עודפים מרכישה קודמת`}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
            />
            {errorMsg && (
              <div className="text-xs font-bold text-red-600 mt-1.5 bg-red-50 p-2 rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3.5 rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>אישור ושמירת סיבה</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl text-xs transition cursor-pointer border border-slate-200"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
