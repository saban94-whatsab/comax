import React, { useState, useEffect } from 'react';
import { FilterMode, CropRect } from '../types';
import { processDocumentImage, autoDetectEdges } from '../utils/imageProcessor';
import { Sparkles, Crop, RotateCw, CheckCircle, RefreshCw, Layers, FileCheck, Sliders, Eye } from 'lucide-react';

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
    ocrData?: any
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

  const handleConfirm = () => {
    onConfirmScan(processedPreview, filterMode, cropRect, rotation, ocrResult);
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

      {/* Main Image Viewport with Crop box overlay */}
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
        </div>
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
            <span className="text-[10px] text-slate-500 font-medium">ניקוי רקע למסמכים (Document Mode)</span>
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

      {/* Manual Crop Slider Controls if open */}
      {showCropControls && (
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="font-bold text-slate-700">כוונון חיתוך ידני (קצוות המסמך %):</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 block">שוליים מלמעלה:</label>
              <input
                type="range"
                min="0"
                max="30"
                value={cropRect.y}
                onChange={(e) =>
                  setCropRect((prev) => ({
                    ...prev,
                    y: Number(e.target.value),
                    height: Math.min(100 - Number(e.target.value), prev.height),
                  }))
                }
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block">גובה חיתוך:</label>
              <input
                type="range"
                min="50"
                max="100"
                value={cropRect.height}
                onChange={(e) =>
                  setCropRect((prev) => ({
                    ...prev,
                    height: Number(e.target.value),
                  }))
                }
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

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
              {ocrResult.deliveryDate && (
                <div>
                  <span className="text-slate-500">תאריך: </span>
                  <span className="text-slate-800 font-medium">{ocrResult.deliveryDate}</span>
                </div>
              )}
              {ocrResult.itemsSummary && (
                <div className="col-span-2">
                  <span className="text-slate-500">תכולה: </span>
                  <span className="text-slate-800 font-medium">{ocrResult.itemsSummary}</span>
                </div>
              )}
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
          className="w-full sm:w-2/3 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-base shadow-xl shadow-blue-200 transition flex items-center justify-center gap-2 transform active:scale-98 border border-blue-500"
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
    </div>
  );
};
