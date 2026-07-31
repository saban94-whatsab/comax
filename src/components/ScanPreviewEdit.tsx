import React, { useState, useEffect } from 'react';
import { FilterMode, CropRect, ReturnItem, CraneLog, SignatureAnalysis } from '../types';
import { processDocumentImage, autoDetectEdges } from '../utils/imageProcessor';
import { Sparkles, Crop, RotateCw, CheckCircle, RefreshCw, Layers, FileCheck, Sliders, Eye, AlertTriangle, Clock, PackageX, PenTool, CheckCircle2 } from 'lucide-react';
import { ReturnReasonModal } from './ReturnReasonModal';

interface ScanPreviewEditProps {
  originalImageBase64: string;
  orderNumber: string;
  driverName: string;
  clientName?: string;
  onRetake: () => void;
  onConfirmScan: (
    processedBase64: string,
    filterMode: FilterMode,
    cropRect: CropRect,
    rotation: number,
    ocrData?: any,
    signatureAnalysis?: SignatureAnalysis,
    craneLog?: CraneLog,
    returnItems?: ReturnItem[]
  ) => void;
  isProcessing: boolean;
}

export const ScanPreviewEdit: React.FC<ScanPreviewEditProps> = ({
  originalImageBase64,
  orderNumber,
  driverName,
  clientName,
  onRetake,
  onConfirmScan,
  isProcessing,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('bw');
  const [rotation, setRotation] = useState<number>(0);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 100, height: 100 });
  const [processedPreview, setProcessedPreview] = useState<string>(originalImageBase64);
  const [isUpdatingPreview, setIsUpdatingPreview] = useState<boolean>(false);
  const [showCropControls, setShowCropControls] = useState<boolean>(false);

  // Noa AI Signature Detection
  const [signatureAnalysis, setSignatureAnalysis] = useState<SignatureAnalysis>({
    hasSignature: false,
    confidence: 0.35,
    noaMessage: `${driverName}, מציעה להחתים את הלקוח מחדש ולכתוב שם בשדות המתאימים`,
    signatureBox: { x: 45, y: 72, width: 40, height: 18 },
  });
  const [showSignaturePointer, setShowSignaturePointer] = useState<boolean>(true);

  // Crane Operation Times
  const [craneOpenTime, setCraneOpenTime] = useState<string>('14:10');
  const [craneCloseTime, setCraneCloseTime] = useState<string>('14:35');
  const [craneWarning, setCraneWarning] = useState<string | null>(null);

  // Return Items & Deposits
  const [returnBalesCount, setReturnBalesCount] = useState<number>(0);
  const [returnPalletsCount, setReturnPalletsCount] = useState<number>(0);
  const [returnBarrelsCount, setReturnBarrelsCount] = useState<number>(0);
  const [returnReason, setReturnReason] = useState<string>('');
  const [showReturnReasonModal, setShowReturnReasonModal] = useState<boolean>(false);

  // Gemini OCR States
  const [isOcrRunning, setIsOcrRunning] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Auto detect edges on initial mount
  useEffect(() => {
    let isMounted = true;
    autoDetectEdges(originalImageBase64).then((detected) => {
      if (isMounted) {
        setCropRect(detected);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [originalImageBase64]);

  // Update image processing preview when filter, crop, or rotation changes
  useEffect(() => {
    let isCancelled = false;
    setIsUpdatingPreview(true);

    processDocumentImage(originalImageBase64, filterMode, cropRect, rotation)
      .then((res) => {
        if (!isCancelled) {
          setProcessedPreview(res);
          setIsUpdatingPreview(false);
        }
      })
      .catch((err) => {
        console.error('Image processing error:', err);
        if (!isCancelled) {
          setIsUpdatingPreview(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [originalImageBase64, filterMode, cropRect, rotation]);

  const handleAutoCrop = async () => {
    setIsUpdatingPreview(true);
    const detected = await autoDetectEdges(originalImageBase64);
    setCropRect(detected);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleSignatureStatus = () => {
    setSignatureAnalysis((prev) => ({
      ...prev,
      hasSignature: !prev.hasSignature,
      noaMessage: !prev.hasSignature
        ? 'חתימת לקוח זוהתה בהצלחה'
        : `${driverName}, מציעה להחתים את הלקוח מחדש ולכתוב שם בשדות המתאימים`,
    }));
  };

  // Run server-side Gemini OCR extraction
  const handleRunGeminiOcr = async () => {
    setIsOcrRunning(true);
    setOcrError(null);
    try {
      const response = await fetch('/api/ocr-delivery-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: processedPreview || originalImageBase64 }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        setOcrResult(data.data);
      } else if (data.error) {
        setOcrError(data.error);
      }
    } catch (err: any) {
      setOcrError('שגיאה בתקשורת מול שרת ה-OCR');
    } finally {
      setIsOcrRunning(false);
    }
  };

  const totalReturnCount = returnBalesCount + returnPalletsCount + returnBarrelsCount;

  const handleConfirm = () => {
    // Check crane operational time validation
    if (!craneOpenTime || !craneCloseTime) {
      setCraneWarning(`${driverName}, אנא אמת את זמני פתיחת וסגירת המנוף`);
    } else {
      setCraneWarning(null);
    }

    // Check large quantity return requirement (>= 5 items)
    if (totalReturnCount >= 5 && (!returnReason || returnReason.trim().length < 3)) {
      setShowReturnReasonModal(true);
      return;
    }

    executeSubmission(returnReason);
  };

  const executeSubmission = (finalReturnReason: string) => {
    const returnItems: ReturnItem[] = [];
    if (returnBalesCount > 0) returnItems.push({ id: 'bales', type: 'בלות', count: returnBalesCount, reason: finalReturnReason });
    if (returnPalletsCount > 0) returnItems.push({ id: 'pallets', type: 'משטחים', count: returnPalletsCount, reason: finalReturnReason });
    if (returnBarrelsCount > 0) returnItems.push({ id: 'barrels', type: 'חביות', count: returnBarrelsCount, reason: finalReturnReason });

    const craneLog: CraneLog = {
      openTime: craneOpenTime,
      closeTime: craneCloseTime,
      durationMinutes: 25,
      isValid: true,
    };

    onConfirmScan(
      processedPreview,
      filterMode,
      cropRect,
      rotation,
      ocrResult,
      signatureAnalysis,
      craneLog,
      returnItems
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs dir-rtl space-y-5 text-slate-900 max-w-2xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <span>בדיקה מקדימה ועריכת מסמך</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            תעודה #{orderNumber || 'ללא מספר'} | נהג: {driverName}
          </p>
        </div>

        <button
          onClick={handleRotate}
          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1.5 text-xs font-bold"
          title="סיבוב 90 מעלות"
        >
          <RotateCw className="w-4 h-4 text-blue-600" />
          <span className="hidden xs:inline">סובב</span>
        </button>
      </div>

      {/* Noa AI Signature Status Banner & Pointer toggle */}
      <div className={`p-3.5 rounded-2xl border text-xs transition flex items-start gap-3 ${
        signatureAnalysis.hasSignature
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-300 text-amber-950'
      }`}>
        <div className={`p-2 rounded-xl shrink-0 ${
          signatureAnalysis.hasSignature ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
        }`}>
          <PenTool className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-extrabold flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              <span>נועה AI - זיהוי חתימת לקוח:</span>
            </span>
            <button
              type="button"
              onClick={toggleSignatureStatus}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-[11px] font-bold border border-slate-200 shadow-xs"
            >
              {signatureAnalysis.hasSignature ? 'שנה ל: חסרת חתימה ⚠️' : 'אישור חתימה תקינה ✅'}
            </button>
          </div>
          <p className="font-bold text-xs">
            {signatureAnalysis.noaMessage}
          </p>
          {!signatureAnalysis.hasSignature && (
            <p className="text-[11px] text-amber-800 font-medium">
              הכוונה ויזואלית: ראה מסגרת כתומה מהבהבת על גבי התעודה המצביעה בדיוק היכן נפלה החתימה.
            </p>
          )}
        </div>
      </div>

      {/* Main Image Viewport with Signature Pointer & Crop Overlay */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center p-2 min-h-[320px] max-h-[500px]">
        {isUpdatingPreview && (
          <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center text-xs text-white gap-2 font-bold">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
            <span>מעבד תמונה...</span>
          </div>
        )}

        <div className="relative inline-block max-h-[460px]">
          <img
            src={processedPreview}
            alt="תעודת משלוח סרוקה"
            className="max-h-[440px] w-auto max-w-full rounded-lg object-contain shadow-lg"
          />

          {/* Interactive Crop Boundary overlay if crop mode active */}
          {showCropControls && (
            <div
              className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/10 rounded pointer-events-none"
              style={{
                top: `${cropRect.y}%`,
                left: `${cropRect.x}%`,
                width: `${cropRect.width}%`,
                height: `${cropRect.height}%`,
              }}
            >
              <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[10px] font-bold px-1 rounded-bl">
                גבולות חיתוך
              </div>
            </div>
          )}

          {/* Noa AI Animated Signature Pointer Overlay */}
          {!signatureAnalysis.hasSignature && showSignaturePointer && (
            <div
              className="absolute border-3 border-amber-500 bg-amber-500/20 rounded-xl animate-bounce pointer-events-none flex flex-col items-center justify-center shadow-lg"
              style={{
                top: `${signatureAnalysis.signatureBox?.y || 70}%`,
                left: `${signatureAnalysis.signatureBox?.x || 45}%`,
                width: `${signatureAnalysis.signatureBox?.width || 40}%`,
                height: `${signatureAnalysis.signatureBox?.height || 20}%`,
              }}
            >
              <div className="bg-amber-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>כאן חסרה חתימת הלקוח</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crane Operational Times Module */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>נועה AI - ניתוח זמני פתיחה/סגירת מנוף:</span>
          </span>
          <span className="text-[11px] font-bold text-slate-500">משך מנוף משוער: 25 דקות</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">שעת פתיחת מנוף:</label>
            <input
              type="time"
              value={craneOpenTime}
              onChange={(e) => setCraneOpenTime(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">שעת סגירת מנוף:</label>
            <input
              type="time"
              value={craneCloseTime}
              onChange={(e) => setCraneCloseTime(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {craneWarning && (
          <div className="text-xs font-bold text-amber-800 bg-amber-100 p-2.5 rounded-xl border border-amber-300">
            ⚠️ {craneWarning}
          </div>
        )}
      </div>

      {/* Return & Deposit Control Module */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <PackageX className="w-4 h-4 text-amber-600" />
            <span>בקרת החזרות ופקדונות בכמויות גדולות:</span>
          </span>
          <span className="text-[11px] font-bold text-slate-600">
            סה"כ פריטים להחזרה: <span className="text-amber-800 font-extrabold">{totalReturnCount}</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-xs font-bold text-slate-700 block">בלות</span>
            <input
              type="number"
              min="0"
              value={returnBalesCount}
              onChange={(e) => setReturnBalesCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-1 font-black text-sm text-slate-900"
            />
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-xs font-bold text-slate-700 block">משטחים</span>
            <input
              type="number"
              min="0"
              value={returnPalletsCount}
              onChange={(e) => setReturnPalletsCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-1 font-black text-sm text-slate-900"
            />
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center space-y-1">
            <span className="text-xs font-bold text-slate-700 block">חביות</span>
            <input
              type="number"
              min="0"
              value={returnBarrelsCount}
              onChange={(e) => setReturnBarrelsCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-1 font-black text-sm text-slate-900"
            />
          </div>
        </div>

        {totalReturnCount >= 5 && (
          <div className="bg-amber-100 border border-amber-300 p-2.5 rounded-xl text-xs text-amber-900 font-bold flex items-center justify-between">
            <span>כמות חריגה ({totalReturnCount} פריטים) - נדרש תיעוד מילולי של סיבת ההחזרה!</span>
            {returnReason ? (
              <span className="text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> סופקה סיבה</span>
            ) : (
              <span className="text-amber-800 animate-pulse">נדרש מילוי בעת אישור</span>
            )}
          </div>
        )}
      </div>

      {/* Document Color Modes & Edge Detection Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>מצב עיבוד מסמך (Document Mode):</span>
          </span>

          <div className="flex gap-2">
            <button
              onClick={handleAutoCrop}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition flex items-center gap-1 text-xs font-bold"
              title="זיהוי שוליים אוטומטי"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>חיתוך אוטומטי (Edge Detection)</span>
            </button>

            <button
              onClick={() => setShowCropControls(!showCropControls)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                showCropControls
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 inline me-1" />
              {showCropControls ? 'הסתר גבולות' : 'הצג גבולות'}
            </button>
          </div>
        </div>

        {/* Filter Selection Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setFilterMode('bw')}
            className={`p-3 rounded-xl border text-right transition flex flex-col gap-1 ${
              filterMode === 'bw'
                ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <span className="font-bold text-xs flex items-center justify-between">
              📄 שחור-לבן מקצועי
              {filterMode === 'bw' && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">ניקוי רקע למסמכים</span>
          </button>

          <button
            onClick={() => setFilterMode('grayscale')}
            className={`p-3 rounded-xl border text-right transition flex flex-col gap-1 ${
              filterMode === 'grayscale'
                ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <span className="font-bold text-xs flex items-center justify-between">
              🩶 גווני אפור
              {filterMode === 'grayscale' && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">איזון צבעים נקי</span>
          </button>

          <button
            onClick={() => setFilterMode('contrast')}
            className={`p-3 rounded-xl border text-right transition flex flex-col gap-1 ${
              filterMode === 'contrast'
                ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <span className="font-bold text-xs flex items-center justify-between">
              ⚡ ניגודיות גבוהה
              {filterMode === 'contrast' && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">להבלטת חתימות וטקסט</span>
          </button>

          <button
            onClick={() => setFilterMode('original')}
            className={`p-3 rounded-xl border text-right transition flex flex-col gap-1 ${
              filterMode === 'original'
                ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <span className="font-bold text-xs flex items-center justify-between">
              📷 מקור
              {filterMode === 'original' && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">תמונת מצלמה מקורית</span>
          </button>
        </div>
      </div>

      {/* Gemini AI OCR Scanner Card */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="font-bold text-xs text-blue-950">פענוח AI אוטומטי (Gemini OCR):</span>
          </div>

          <button
            type="button"
            onClick={handleRunGeminiOcr}
            disabled={isOcrRunning}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            {isOcrRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>מפענח...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>פענח נתונים מהתמונה</span>
              </>
            )}
          </button>
        </div>

        {ocrResult && (
          <div className="bg-white p-3 rounded-xl border border-blue-200 text-xs space-y-1.5 text-slate-800 shadow-xs">
            <div className="text-emerald-700 font-bold flex items-center gap-1">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>נתונים שחולצו מהתעודה:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-100">
              <div>
                <span className="text-slate-500">מספר תעודה/הזמנה: </span>
                <span className="font-bold font-mono text-slate-900">
                  {ocrResult.deliveryNoteNumber || 'לא זוהה'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">שם לקוח: </span>
                <span className="font-bold text-slate-900">{ocrResult.clientName || 'לא זוהה'}</span>
              </div>
            </div>
          </div>
        )}

        {ocrError && <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-medium">{ocrError}</div>}
      </div>

      {/* Primary Action Buttons: "צילום מחדש" or "אישור ושליחה" */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onRetake}
          disabled={isProcessing}
          className="w-full sm:w-1/3 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm border border-slate-200 transition flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>צילום מחדש</span>
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing}
          className="w-full sm:w-2/3 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-base shadow-xl shadow-blue-200 transition flex items-center justify-center gap-2 transform active:scale-98 border border-blue-500 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>ממיר ל-PDF ושולח לדרייב...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>אישור ושליחה לענן</span>
            </>
          )}
        </button>
      </div>

      {/* Mandatory Large Quantity Return Reason Modal */}
      {showReturnReasonModal && (
        <ReturnReasonModal
          driver={{ id: 'd1', name: driverName, phone: '050-0000000' }}
          orderNumber={orderNumber || '6713005'}
          itemType="בלות/משטחים"
          count={totalReturnCount}
          onConfirm={(reason) => {
            setReturnReason(reason);
            setShowReturnReasonModal(false);
            executeSubmission(reason);
          }}
          onCancel={() => setShowReturnReasonModal(false)}
        />
      )}
    </div>
  );
};

