import React from 'react';
import { CheckCircle, ExternalLink, HardDrive, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface SuccessStatusNotificationProps {
  status: 'syncing' | 'success' | 'offline_saved' | 'error';
  message: string;
  driveLink?: string;
  orderNumber: string;
  driverName: string;
  onClose: () => void;
}

export const SuccessStatusNotification: React.FC<SuccessStatusNotificationProps> = ({
  status,
  message,
  driveLink,
  orderNumber,
  driverName,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl text-slate-900 space-y-5">
        {status === 'syncing' && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-black text-slate-900">ממיר ל-PDF ומעלה לענן...</h3>
            <p className="text-xs text-slate-500 font-medium">
              התעודה מעובדת, קובץ ה-PDF נבנה ונשלח אל Google Drive ו-Google Sheets
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            {/* Animated green success icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-100">
              <CheckCircle className="w-12 h-12 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900">העלאה הושלמה בהצלחה!</h3>
              <p className="text-sm font-bold text-emerald-700">{message}</p>
            </div>

            {/* Integration Details Badges */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700 text-right dir-rtl font-medium">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>קובץ ה-PDF נשמר ב-Google Drive בשם:</span>
              </div>
              <div className="font-mono text-[11px] text-blue-700 bg-white p-2 rounded-xl border border-slate-200 truncate font-semibold">
                {orderNumber}_{driverName}_{Date.now().toString().slice(-4)}.pdf
              </div>

              <div className="flex items-center gap-2 text-emerald-800 font-bold pt-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>שורת המעקב עודכנה בגיליון Google Sheets</span>
              </div>
            </div>

            {/* Action Links */}
            <div className="flex flex-col gap-2.5">
              {driveLink && (
                <a
                  href={driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md border border-blue-500 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>פתח תעודה ב-Google Drive</span>
                </a>
              )}

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition border border-slate-200"
              >
                סרוק תעודה נוספת
              </button>
            </div>
          </div>
        )}

        {status === 'offline_saved' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border-2 border-amber-500 flex items-center justify-center text-amber-600">
              <HardDrive className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">נשמר בתור האופליין (Offline)</h3>
              <p className="text-xs text-slate-600 font-medium">{message}</p>
            </div>

            <p className="text-[11px] text-amber-900 bg-amber-50 p-3.5 rounded-2xl border border-amber-200 font-medium">
              התעודה וה-PDF נשמרו בבטחה במכשיר הנהג. ברגע שהחיבור לרשת יתחדש, הסנכרון לענן יבוצע אוטומטית.
            </p>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
            >
              הבנתי, המשך בסריקות
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 border-2 border-red-500 flex items-center justify-center text-red-600">
              <AlertCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">שגיאה בהעלאת המסמך</h3>
              <p className="text-xs text-red-600 font-bold">{message}</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-200"
            >
              חזור ונסה שוב
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
