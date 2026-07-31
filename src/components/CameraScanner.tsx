import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RotateCw, Flashlight, AlertCircle, FileText, CheckCircle } from 'lucide-react';

interface CameraScannerProps {
  onImageCaptured: (imageBase64: string) => void;
  orderNumber: string;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onImageCaptured,
  orderNumber,
}) => {
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera stream on unmount or close
  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Start live WebRTC camera stream
  const startLiveCamera = async () => {
    setCameraError(null);
    setIsLiveCameraOpen(true);

    try {
      stopCameraStream();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Live WebRTC camera unavailable or permission denied:', err);
      setCameraError('לא ניתן לגשת למצלמת הוידאו. ניתן להשתמש בכפתור הצילום הישיר להלן.');
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isLiveCameraOpen) {
      startLiveCamera();
    }
  };

  const toggleFlashlight = async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          const nextState = !isTorchOn;
          await (track as any).applyConstraints({
            advanced: [{ torch: nextState }],
          });
          setIsTorchOn(nextState);
        }
      } catch (e) {
        console.warn('Flashlight not supported', e);
      }
    }
  };

  // Capture frame from live video canvas
  const captureVideoFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      stopCameraStream();
      setIsLiveCameraOpen(false);
      onImageCaptured(dataUrl);
    }
  };

  // Handle native camera capture file input (capture="environment")
  const handleNativeFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onImageCaptured(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs dir-rtl">
      {/* Hidden Native Camera Input with capture="environment" */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleNativeFileInput}
        className="hidden"
      />

      {/* Main Scan Camera Launch Interface */}
      {!isLiveCameraOpen ? (
        <div className="text-center py-4 space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <FileText className="w-3.5 h-3.5" />
              <span>מסמך משויך: {orderNumber || 'ללא מספר'}</span>
            </span>
            <h3 className="text-2xl font-black text-slate-900">סריקת תעודת משלוח</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              כיוון את מצלמת הסמארטפון אל תעודת המשלוח. המערכת תבצע חיתוך, המרה ל-PDF וזיהוי נתונים.
            </p>
          </div>

          {/* Central Prominent Scan Button (Matching Clean Minimalism Mockup) */}
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                  startLiveCamera();
                } else if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              className="w-full h-24 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center gap-4 shadow-xl shadow-blue-200 transition-all transform active:scale-98 cursor-pointer border border-blue-500"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-black leading-none">סרוק תעודת משלוח</div>
                <div className="text-xs font-semibold text-blue-100 mt-1">פתיחת מצלמת יישור וצילום מהיר</div>
              </div>
            </button>
          </div>

          {/* Alternative Direct Camera Input / File Selection */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>צילום ישיר במצלמת המכשיר (Native)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute('capture');
                  fileInputRef.current.click();
                  setTimeout(() => {
                    fileInputRef.current?.setAttribute('capture', 'environment');
                  }, 1000);
                }
              }}
              className="w-full sm:w-auto px-5 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              <span>בחר תמונה מהגלריה</span>
            </button>
          </div>
        </div>
      ) : (
        /* Live WebRTC Camera Stream Modal / Viewport with Corner Guides */
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-4 border-white shadow-2xl">
          {/* Top Camera Controls Bar */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
            <div className="text-white text-xs font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span>מצלמת יישור מסמכים</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFlashlight}
                className={`p-2 rounded-full backdrop-blur-md transition ${
                  isTorchOn ? 'bg-amber-400 text-black' : 'bg-black/50 text-white'
                }`}
                title="תאורת פלאש"
              >
                <Flashlight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition"
                title="החלף מצלמה"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Video Feed */}
          <div className="relative aspect-[3/4] max-h-[70vh] bg-slate-950 flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            ></video>

            {/* Dedicated Document Alignment Frame Overlay (Theme corners) */}
            <div className="absolute inset-6 border-2 border-dashed border-blue-400/50 rounded-lg pointer-events-none flex flex-col justify-between p-4 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]">
              {/* Corner Guides */}
              <div className="flex justify-between">
                <div className="w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                <div className="w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              </div>

              {/* Center Guidance Text */}
              <div className="text-center bg-white/90 backdrop-blur-md py-2 px-4 rounded-full text-slate-900 text-xs font-bold mx-auto border border-blue-200 shadow-md">
                יישר את התעודה למרכז הפריים
              </div>

              <div className="flex justify-between">
                <div className="w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                <div className="w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              </div>
            </div>

            {/* Camera Error overlay if stream fails */}
            {cameraError && (
              <div className="absolute inset-0 z-30 bg-slate-900/90 p-6 flex flex-col items-center justify-center text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-amber-400" />
                <p className="text-xs text-slate-300">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    setIsLiveCameraOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                >
                  עבור לצילום במצלמת המכשיר
                </button>
              </div>
            )}
          </div>

          {/* Bottom Snapshot & Cancel Bar */}
          <div className="bg-slate-900 p-4 flex items-center justify-between gap-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setIsLiveCameraOpen(false);
              }}
              className="px-4 py-2.5 text-xs text-slate-400 hover:text-white font-bold"
            >
              ביטול
            </button>

            {/* Shutter Trigger Button */}
            <button
              type="button"
              onClick={captureVideoFrame}
              className="bg-white px-8 py-3 rounded-full text-slate-900 font-bold shadow-lg hover:scale-105 transition-transform text-sm"
            >
              צילום ידני
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-xs text-blue-400 font-semibold hover:underline"
            >
              בחר קובץ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
