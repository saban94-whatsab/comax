import React, { useState } from 'react';
import { Database, FileSpreadsheet, User, Truck, CheckCircle2, Clock, AlertTriangle, ExternalLink, HardDrive } from 'lucide-react';
import { DocumentScan } from '../types';

interface DriverDatabaseModalProps {
  scans: DocumentScan[];
  spreadsheetId: string;
  onClose: () => void;
}

export const DriverDatabaseModal: React.FC<DriverDatabaseModalProps> = ({
  scans,
  spreadsheetId,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'hokmat' | 'ali'>('main');

  const hokmatScans = scans.filter((s) => s.driverName.includes('חכמת') || s.driverName.includes('Hokmat'));
  const aliScans = scans.filter((s) => s.driverName.includes('עלי') || s.driverName.includes('Ali'));

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-6 shadow-2xl text-slate-900 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl text-slate-900">בסיס נתונים SabanOS / DeliveryMaster</h3>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  ID: {spreadsheetId.substring(0, 10)}...
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                מרכז שליטה פקודות וטאבים מופרדים עבור נהגים: חכמת ו-עלי
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">פתח ב-Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-base font-bold p-1">
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-100 shrink-0">
          <button
            onClick={() => setActiveTab('main')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'main'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>מרכז שליטה פקודות (ראשי)</span>
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px]">
              {scans.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hokmat')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'hokmat'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <span className="text-lg">👨‍✈️</span>
            <span>טאב נהג: חכמת</span>
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {hokmatScans.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ali')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'ali'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <span className="text-lg">🚛</span>
            <span>טאב נהג: עלי</span>
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {aliScans.length}
            </span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {activeTab === 'main' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">סיכום מרכז שליטה ופעילויות:</div>
                  <div className="text-slate-500 font-medium mt-0.5">
                    סריקות שבוצעו: {scans.length} | תעודות חתומות: {scans.filter(s => s.signatureAnalysis?.hasSignature !== false).length} | החזרות מתועדות: {scans.filter(s => (s.returnItems?.length || 0) > 0).length}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full font-bold text-[11px]">
                    Comax Mail Listener: פעיל 🟢
                  </span>
                </div>
              </div>

              {scans.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Database className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-700">אין עדיין נתונים מתועדים בגיליון</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    סרוק תעודות משלוח במצלמה כדי לאכלס את בסיס הנתונים
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-white font-bold">
                      <tr>
                        <th className="p-3">תאריך</th>
                        <th className="p-3">תעודה #</th>
                        <th className="p-3">נהג</th>
                        <th className="p-3">לקוח</th>
                        <th className="p-3">חתימה (נועה AI)</th>
                        <th className="p-3">זמני מנוף</th>
                        <th className="p-3">החזרות</th>
                        <th className="p-3">דרייב</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {scans.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500">{new Date(s.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="p-3 font-mono font-bold text-blue-600">{s.orderNumber}</td>
                          <td className="p-3 font-bold text-slate-900">{s.driverName}</td>
                          <td className="p-3 text-slate-700">{s.clientName || 'לקוח'}</td>
                          <td className="p-3">
                            {s.signatureAnalysis?.hasSignature === false ? (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold text-[11px]">
                                ⚠️ חסרת חתימה
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[11px]">
                                ✅ חתומה
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600">
                            {s.craneLog?.openTime ? `${s.craneLog.openTime}-${s.craneLog.closeTime || 'פתוח'}` : '-'}
                          </td>
                          <td className="p-3 text-slate-800">
                            {s.returnItems && s.returnItems.length > 0
                              ? s.returnItems.map(r => `${r.count} ${r.type}`).join(', ')
                              : 'אין'}
                          </td>
                          <td className="p-3">
                            {s.driveLink && (
                              <a
                                href={s.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
                              >
                                <HardDrive className="w-3.5 h-3.5" />
                                <span>פתח</span>
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hokmat' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center gap-4">
                <div className="text-4xl">👨‍✈️</div>
                <div>
                  <h4 className="font-black text-lg text-slate-900">כרטיס עבודה יומי: חכמת (Hokmat)</h4>
                  <p className="text-xs text-slate-600 font-medium">
                    תפקיד: נהג מנוף בכיר | טלפון: 050-7654321 | תיקיית Google Drive ייעודית מוגדרת
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-700">תעודות שנסרקו על ידי חכמת:</h5>
                {hokmatScans.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-medium">
                    טרם נרשמו תעודות משלוח עבור חכמת היום
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hokmatScans.map((scan) => (
                      <div key={scan.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-blue-600 font-mono text-sm me-2">#{scan.orderNumber}</span>
                          <span className="text-slate-700 font-medium">{scan.clientName || 'לקוח general'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-medium">{new Date(scan.timestamp).toLocaleString('he-IL')}</span>
                          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[11px]">
                            סונכרן לגיליון
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ali' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center gap-4">
                <div className="text-4xl">🚛</div>
                <div>
                  <h4 className="font-black text-lg text-slate-900">כרטיס עבודה יומי: עלי (Ali)</h4>
                  <p className="text-xs text-slate-600 font-medium">
                    תפקיד: נהג חלוקה | טלפון: 050-1234567 | תיקיית Google Drive ייעודית מוגדרת
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-700">תעודות שנסרקו על ידי עלי:</h5>
                {aliScans.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-medium">
                    טרם נרשמו תעודות משלוח עבור עלי היום
                  </div>
                ) : (
                  <div className="space-y-2">
                    {aliScans.map((scan) => (
                      <div key={scan.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-blue-600 font-mono text-sm me-2">#{scan.orderNumber}</span>
                          <span className="text-slate-700 font-medium">{scan.clientName || 'לקוח general'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-medium">{new Date(scan.timestamp).toLocaleString('he-IL')}</span>
                          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[11px]">
                            סונכרן לגיליון
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 shrink-0 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs">
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
