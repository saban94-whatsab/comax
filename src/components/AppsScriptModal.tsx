import React, { useState } from 'react';
import { AppsScriptConfig } from '../types';
import { saveAppsScriptConfig } from '../utils/storage';
import { Settings, Copy, Check, ExternalLink, Database, FileSpreadsheet, HardDrive } from 'lucide-react';

interface AppsScriptModalProps {
  config: AppsScriptConfig;
  onSaveConfig: (config: AppsScriptConfig) => void;
  onClose: () => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  config,
  onSaveConfig,
  onClose,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [folderId, setFolderId] = useState(config.folderId || '');
  const [copiedScript, setCopiedScript] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Ready-to-use Google Apps Script backend code snippet
  const appsScriptCode = `/**
 * Google Apps Script Webhook endpoint for Delivery Note PDF & Sheet auto-sync
 * 1. Open your Google Sheet
 * 2. Click Extensions > Apps Script
 * 3. Paste this code and replace FOLDER_ID if needed
 * 4. Click Deploy > New Deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 */

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var driverName = contents.driverName || "נהג לא ידוע";
    var orderNumber = contents.orderNumber || "ללא מספר";
    var clientName = contents.clientName || "";
    var fileName = contents.fileName || (orderNumber + "_" + driverName + ".pdf");
    var timestamp = contents.timestamp || new Date().toISOString();
    
    // 1. Save PDF file to Google Drive folder
    var folderId = "${folderId || "YOUR_GOOGLE_DRIVE_FOLDER_ID"}"; 
    var folder;
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch(err) {
      folder = DriveApp.getRootFolder();
    }
    
    // Clean base64 string
    var rawBase64 = contents.pdfBase64.replace(/^data:application\\/pdf;base64,/, '');
    var pdfBlob = Utilities.newBlob(Utilities.base64Decode(rawBase64), "application/pdf", fileName);
    var driveFile = folder.createFile(pdfBlob);
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var driveUrl = driveFile.getUrl();
    
    // 2. Log row in Google Sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      new Date(),
      orderNumber,
      driverName,
      clientName,
      fileName,
      driveUrl
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "התעודה נשמרה ב-Google Drive ועודכנה בגיליון!",
      driveLink: driveUrl
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSave = () => {
    const updated: AppsScriptConfig = {
      webhookUrl: webhookUrl.trim(),
      folderId: folderId.trim(),
      autoSync: true,
    };
    saveAppsScriptConfig(updated);
    onSaveConfig(updated);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!webhookUrl.trim()) {
      setTestResult('נא להזין כתובת Webhook לביצוע בדיקה');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/upload-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverName: 'בדיקה',
          orderNumber: 'TEST-001',
          pdfBase64: 'data:application/pdf;base64,JVBERi0xLjQK',
          webhookUrl: webhookUrl.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult(`✅ חיבור מוצלח! התקבל מענה מה-Webhook: ${data.message || 'תקין'}`);
      } else {
        setTestResult(`❌ השרת החזיר שגיאה: ${data.error || 'שגיאה'}`);
      }
    } catch (err: any) {
      setTestResult('❌ נכשלה התקשורת מול ה-Webhook');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl text-slate-900 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">חיבור ל-Google Drive & Sheets</h3>
              <p className="text-xs text-slate-500 font-medium">הגדרת Webhook לסנכרון אוטומטי של תעודות משלוח</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* Webhook Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>כתובת Webhook (Google Apps Script Web App URL):</span>
              <span className="text-blue-600 text-[11px] font-mono">https://script.google.com/macros/s/...</span>
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
            />
            <p className="text-[11px] text-slate-500 font-medium">
              אם תשאיר שדה זה ריק, האפליקציה תבצע סנכרון מקומי בתוספת מענה שרת מדומה (Simulated Backup).
            </p>
          </div>

          {/* Folder ID Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              <span>מזהה תיקיית Google Drive יעד (Folder ID - אופציונלי):</span>
            </label>
            <input
              type="text"
              placeholder="למשל: 1A2b3C4d5E6f7G8h9I0j"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono"
            />
          </div>

          {/* Test connection button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200 rounded-xl text-xs font-bold transition"
            >
              {isTesting ? 'בודק חיבור...' : '🧪 בדיקת חיבור ל-Webhook'}
            </button>
            {testResult && <span className="text-[11px] text-slate-700 font-bold">{testResult}</span>}
          </div>

          {/* Code Generator & Instructions */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>קוד Apps Script מוכן להעתקה (doPost):</span>
              </span>

              <button
                type="button"
                onClick={handleCopyScript}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-xs"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'הועתק!' : 'העתק קוד'}</span>
              </button>
            </div>

            <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-200 font-mono max-h-40 overflow-y-auto ltr text-left">
              {appsScriptCode}
            </pre>

            <div className="text-[11px] text-slate-600 space-y-1 dir-rtl pt-1.5 border-t border-slate-200">
              <div className="font-bold text-slate-800">צעדים להתקנה מהירה:</div>
              <ol className="list-decimal list-inside space-y-0.5 pr-1 font-medium">
                <li>פתח גיליון Google Sheets חדש או קיים.</li>
                <li>לחץ בתפריט העליון: <b>הרחבות (Extensions) &gt; Apps Script</b>.</li>
                <li>הדבק את הקוד לעיל, לחץ <b>פורס (Deploy) &gt; פריסה חדשה (New Deployment)</b>.</li>
                <li>בחר <b>אפליקציית אינטרנט (Web app)</b>, הגדר גישה ל-<b>"כולם" (Anyone)</b> והעתק את הקישור.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 pt-3 border-t border-slate-200">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition"
          >
            שמור הגדרות
          </button>
          <button
            onClick={onClose}
            className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
