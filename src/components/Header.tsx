import React from 'react';
import { Driver, AppsScriptConfig } from '../types';
import { Truck, Wifi, WifiOff, CloudUpload, Settings, UserCheck, RefreshCw, History, Database } from 'lucide-react';

interface HeaderProps {
  currentDriver: Driver | null;
  isOnline: boolean;
  offlineCount: number;
  config: AppsScriptConfig;
  onOpenDriverModal: () => void;
  onOpenConfigModal: () => void;
  onOpenOutboxModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenDatabaseModal: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentDriver,
  isOnline,
  offlineCount,
  config,
  onOpenDriverModal,
  onOpenConfigModal,
  onOpenOutboxModal,
  onOpenHistoryModal,
  onOpenDatabaseModal,
  onSyncNow,
  isSyncing,
}) => {
  return (
    <header className="bg-white text-slate-900 sticky top-0 z-30 shadow-xs border-b border-slate-200 dir-rtl">
      <div className="max-w-4xl mx-auto px-5 py-3.5 flex items-center justify-between gap-3">
        {/* App Title & Driver Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-200">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-tight text-slate-900 flex items-center gap-1.5">
              SabanOS DeliveryMaster
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block font-medium">
              סריקת תעודות משלוח, ניתוח מנוף ובקרת החזרות (חכמת & עלי)
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-2">
          {/* Driver Badge */}
          {currentDriver && (
            <button
              onClick={onOpenDriverModal}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full text-xs font-bold text-blue-900 border border-blue-200 transition"
              title="לחץ להחלפת נהג"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="max-w-[90px] truncate">{currentDriver.name}</span>
            </button>
          )}

          {/* Database Viewer Button */}
          <button
            onClick={onOpenDatabaseModal}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1 text-xs font-bold"
            title="פתח בסיס נתונים וטאבים לנהגים"
          >
            <Database className="w-4 h-4 text-blue-600" />
            <span className="hidden md:inline">מרכז שליטה</span>
          </button>

          {/* Connection Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isOnline ? (
              <>
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="hidden xs:inline">מחובר (Online)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">אופליין</span>
              </>
            )}
          </div>

          {/* Offline Outbox Sync Badge */}
          {offlineCount > 0 && (
            <button
              onClick={onOpenOutboxModal}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1 rounded-full text-xs transition shadow-xs animate-pulse"
              title="תעודות בממתינה לסנכרון"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{offlineCount} להעלאה</span>
              {isOnline && (
                <RefreshCw
                  onClick={(e) => {
                    e.stopPropagation();
                    onSyncNow();
                  }}
                  className={`w-3 h-3 me-0.5 ${isSyncing ? 'animate-spin' : ''}`}
                />
              )}
            </button>
          )}

          {/* Scans History */}
          <button
            onClick={onOpenHistoryModal}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
            title="היסטוריית סריקות"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Apps Script Settings */}
          <button
            onClick={onOpenConfigModal}
            className={`p-2 rounded-xl transition border ${
              config.webhookUrl
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title="הגדרת חיבור ל-Google Apps Script / Sheets"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
