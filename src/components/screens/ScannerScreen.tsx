import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Zap, ZapOff, RefreshCw, Camera, Upload, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { ScanType, FoodScanResult } from '../../types';
import { aiService, MANDATORY_LAB_DISCLAIMER } from '../../services/aiService';
import { LogoPlaceholder } from '../common/Logo';

interface ScannerScreenProps {
  onBack: () => void;
  onAnalysisComplete: (result: FoodScanResult) => void;
  t: Record<string, string>;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({
  onBack,
  onAnalysisComplete,
  t
}) => {
  const [scanType, setScanType] = useState<ScanType>('packaged');
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [useLiveCamera, setUseLiveCamera] = useState<boolean>(false);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const timersRef = useRef<any[]>([]);

  const isNative = Capacitor.isNativePlatform();
  // Placeholder preview when no image is selected and camera is off
  const currentPreviewImage = customImage || null;

  // Native Android / Capacitor Camera Capture flow
  const handleNativeCameraTrigger = async () => {
    setCameraError(null);
    try {
      if (Capacitor.isNativePlatform()) {
        // Step 1: Check whether Android camera permission is already granted
        const perm = await CapCamera.checkPermissions();
        if (perm.camera !== 'granted') {
          // Step 1a: Request Android camera permission
          const req = await CapCamera.requestPermissions({ permissions: ['camera'] });
          if (req.camera !== 'granted') {
            // Step 1b: Show clear user message
            setCameraError('Please allow camera access to scan food.');
            return;
          }
        }
      }

      // Step 2: Open real native Android camera using @capacitor/camera with native image dimension constraints
      const photo = await CapCamera.getPhoto({
        quality: 80,
        width: 1024,
        height: 1024,
        correctOrientation: true,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      const photoUrl = photo?.dataUrl || (photo?.base64String ? `data:image/jpeg;base64,${photo.base64String}` : null);
      if (photoUrl) {
        setCustomImage(photoUrl);
        setCameraError(null);
      }
    } catch (err: any) {
      const message = String(err?.message || '');
      if (message.toLowerCase().includes('cancel') || message.toLowerCase().includes('dismiss') || message.toLowerCase().includes('user cancelled')) {
        console.info('[FoodCheck] User dismissed native camera.');
      } else if (message.toLowerCase().includes('denied') || message.toLowerCase().includes('permission')) {
        setCameraError('Please allow camera access to scan food.');
      } else {
        console.warn('[FoodCheck] Native camera capture error:', err);
      }
    }
  };

  const handleScannerSectionTap = async () => {
    if (isNative) {
      await handleNativeCameraTrigger();
    } else {
      // Desktop browser fallback: open file chooser or start web cam
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleNativeGalleryPick = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const photo = await CapCamera.getPhoto({
          quality: 80,
          width: 1024,
          height: 1024,
          correctOrientation: true,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos
        });
        const photoUrl = photo?.dataUrl || (photo?.base64String ? `data:image/jpeg;base64,${photo.base64String}` : null);
        if (photoUrl) {
          setCustomImage(photoUrl);
          setCameraError(null);
          return;
        }
      }
    } catch (err: any) {
      console.info('[FoodCheck] Native gallery picker fallback:', err);
    }
    fileInputRef.current?.click();
  };

  // Browser-only camera handling for desktop testing
  const startWebCamera = async () => {
    if (Capacitor.isNativePlatform()) {
      await handleNativeCameraTrigger();
      return;
    }
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device access is not supported on this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraPermissionStatus('granted');
      setUseLiveCamera(true);
    } catch (err: any) {
      console.warn('[FoodCheck] Browser camera access error:', err);
      setCameraPermissionStatus('denied');
      setCameraError('Camera access is unavailable on this browser. Please use the gallery upload button.');
      setUseLiveCamera(false);
    }
  };

  const stopWebCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setUseLiveCamera(false);
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopWebCamera();
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  // Capture & Analyse
  const handleCapture = async () => {
    let capturedImage = currentPreviewImage;

    // Desktop browser live preview snapshot
    if (!isNative && useLiveCamera && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        capturedImage = canvas.toDataURL('image/jpeg', 0.85);
        setCustomImage(capturedImage);
      }
      stopWebCamera();
    }

    if (!capturedImage) {
      if (isNative) {
        await handleNativeCameraTrigger();
        return;
      }
      fileInputRef.current?.click();
      return;
    }

    // Dev Logging for Scanner Flow
    console.info('[FoodCheck Scanner] Analysis button clicked for scanType:', scanType);
    console.info('[FoodCheck Scanner] Image captured. Size / format info:', {
      length: capturedImage.length,
      isDataUrl: capturedImage.startsWith('data:'),
      type: capturedImage.startsWith('data:') ? capturedImage.split(';')[0] : 'image/jpeg'
    });

    // Clear existing timers
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];

    setAnalysisError(null);
    setIsAnalyzing(true);
    setAnalysisStep(1);

    const t1 = setTimeout(() => { if (isMountedRef.current) setAnalysisStep(2); }, 600);
    const t2 = setTimeout(() => { if (isMountedRef.current) setAnalysisStep(3); }, 1400);
    const t3 = setTimeout(() => { if (isMountedRef.current) setAnalysisStep(4); }, 2200);
    timersRef.current.push(t1, t2, t3);

    try {
      const result = await aiService.analyzeFoodImage({
        imageBase64: capturedImage,
        scanType,
        language: 'en',
      });

      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];

      if (isMountedRef.current) {
        setIsAnalyzing(false);
      }
      onAnalysisComplete(result);
    } catch (err: any) {
      console.error('[FoodCheck Scanner] AI analysis pipeline error:', err);

      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];

      if (isMountedRef.current) {
        setIsAnalyzing(false);
        setAnalysisError(
          err?.message ||
          'AI Food analysis failed. Please verify your Gemini API key and ensure the food image is clear.'
        );
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopWebCamera();
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setCustomImage(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-white relative select-none overflow-hidden">
      {/* Hidden canvas for video snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Camera Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          onClick={() => { stopWebCamera(); onBack(); }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Scan Type Toggle — Packaged Food vs Street Food */}
        <div className="bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/20 flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setScanType('packaged')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              scanType === 'packaged' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.packagedFood || 'Packaged Food'}
          </button>
          <button
            onClick={() => setScanType('street')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              scanType === 'street' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.streetFood || 'Street Food'}
          </button>
        </div>

        {/* Flash toggle */}
        <button
          onClick={() => setFlashOn(!flashOn)}
          className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors cursor-pointer ${
            flashOn ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-black/40 text-white'
          }`}
          aria-label="Flash"
        >
          {flashOn ? <Zap size={19} className="fill-slate-950" /> : <ZapOff size={19} />}
        </button>
      </div>

      {/* Main Viewfinder Area — Large top scanner section */}
      <div
        onClick={handleScannerSectionTap}
        role="button"
        tabIndex={0}
        aria-label="Tap to open camera to scan food"
        className="flex-1 relative flex items-center justify-center overflow-hidden cursor-pointer select-none group"
      >
        {flashOn && <div className="absolute inset-0 bg-amber-100/20 pointer-events-none z-10" />}

        {/* Live Camera Feed (browser testing only) or Captured Preview */}
        {!isNative && useLiveCamera ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : currentPreviewImage ? (
          <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
            <img
              src={currentPreviewImage}
              alt="Food Preview"
              className="w-full h-full object-cover opacity-90 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[11px] font-medium text-amber-300 shadow-md flex items-center gap-1.5 pointer-events-none">
              <Camera size={13} />
              <span>Tap to retake photo</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 transition-colors group-hover:bg-slate-900/60 p-6">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-dashed border-amber-400/40 flex items-center justify-center text-amber-400 mb-3 shadow-inner group-active:scale-95 transition-transform">
              <Camera size={38} strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-white tracking-tight">Tap to open camera</p>
            <p className="text-xs text-slate-400 mt-1 text-center max-w-[220px]">
              Tap anywhere in this area to take a photo with your device camera
            </p>
          </div>
        )}

        {/* Reticle / Viewfinder Frame */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none z-20">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 border-amber-400/80 shadow-2xl flex items-center justify-center">
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse shadow-sm shadow-amber-400" />
            <div className="w-8 h-8 rounded-full border border-dashed border-amber-400/50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </div>
          </div>
          <div className="mt-4 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-center">
            <p className="text-xs font-semibold text-amber-300 tracking-tight">
              {scanType === 'packaged'
                ? 'Align package & expiry text inside the frame'
                : (t.placeInsideFrame || 'Place the food inside the frame')}
            </p>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="absolute top-20 left-4 right-4 z-20 pointer-events-none">
          <div className="bg-amber-500/90 backdrop-blur-md text-slate-950 px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-2 shadow-lg">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <p className="text-[10px] font-bold leading-tight">
              AI-based visual assessment only. Not a laboratory test.
            </p>
          </div>
        </div>

        {/* Camera Error / Permission Banner */}
        {cameraError && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 left-4 right-4 z-30 bg-black/90 backdrop-blur-md border border-amber-500/60 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200 shadow-xl animate-fade-in"
          >
            <AlertCircle size={17} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-white leading-snug">{cameraError}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCameraError(null);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white font-medium cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCameraError(null);
                    handleScannerSectionTap();
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  Grant & Open Camera
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Shutter & Controls */}
      <div className="bg-slate-950 px-6 pt-3 pb-8 flex items-center justify-around z-20 border-t border-slate-800/40">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        
        {/* Gallery button */}
        <button
          onClick={handleNativeGalleryPick}
          className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
          title="Upload food photo from gallery"
        >
          <Upload size={18} />
          <span className="text-[9px] font-medium">Gallery</span>
        </button>

        {/* Big Shutter / Action Button */}
        <button
          onClick={handleCapture}
          className="w-20 h-20 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/40 active:scale-95 transition-all group cursor-pointer"
          aria-label={currentPreviewImage ? "Analyze Food Image" : "Open Camera"}
        >
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center group-hover:scale-95 transition-transform">
            <div className={`w-13 h-13 rounded-full flex items-center justify-center text-white ${
              currentPreviewImage ? 'bg-amber-600' : 'bg-orange-500'
            }`}>
              {currentPreviewImage ? (
                <Zap size={24} className="fill-white" />
              ) : (
                <Camera size={24} strokeWidth={2.4} />
              )}
            </div>
          </div>
        </button>

        {/* Right Action: Camera / Retake on native Android, or Live Cam toggle on desktop web */}
        {isNative ? (
          <button
            onClick={handleNativeCameraTrigger}
            className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
            title={currentPreviewImage ? "Retake photo" : "Open camera"}
          >
            {currentPreviewImage ? <RefreshCw size={18} /> : <Camera size={18} />}
            <span className="text-[9px] font-medium">{currentPreviewImage ? 'Retake' : 'Camera'}</span>
          </button>
        ) : (
          <button
            onClick={() => { if (useLiveCamera) stopWebCamera(); else startWebCamera(); }}
            className={`w-12 h-12 rounded-2xl border flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer ${
              useLiveCamera
                ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle live camera preview"
          >
            <RefreshCw size={18} />
            <span className="text-[9px] font-medium">{useLiveCamera ? 'Live ON' : 'Live Cam'}</span>
          </button>
        )}
      </div>

      {/* Analysis Error Modal */}
      {analysisError && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 max-w-sm w-full text-center shadow-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-base font-bold text-red-400 tracking-tight">AI Food Scan Failed</h4>
            <p className="text-xs text-slate-300 leading-relaxed text-left bg-slate-950/80 p-3 rounded-xl border border-red-500/30 break-words whitespace-pre-line font-mono">
              {analysisError}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setAnalysisError(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 active:scale-95 transition-all cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setAnalysisError(null);
                  handleCapture();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-slate-950 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysing Food Overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          {/* Logo container showing real FoodPulse brand logo */}
          <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-ping" />
            <div className="w-24 h-24 rounded-3xl bg-white border-2 border-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/30 p-2">
              <LogoPlaceholder size="lg" className="border-none shadow-none" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">
            {t.analyzingFood || 'Analyzing Food with Gemini AI...'}
          </h3>
          <p className="text-xs text-amber-400 font-semibold mt-1">
            Google Gemini 3.6 Flash Vision Engine
          </p>

          <div className="w-full max-w-xs mt-6 space-y-2.5 text-left bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
            {scanType === 'packaged' ? (
              <>
                {[
                  'Real image transmitted to Gemini Vision API',
                  'Product identification & Packaging condition',
                  'Expiry date OCR & Allergen text inspection',
                  'Computing evidence-based food safety score'
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs">
                    {analysisStep >= i + 1 ? (
                      <CheckCircle2 size={15} className="text-amber-400" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                    )}
                    <span className={analysisStep >= i + 1 ? 'text-white font-medium' : 'text-slate-500'}>
                      {step}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  'Real image transmitted to Gemini Vision API',
                  'Street food dish identification & Presentation',
                  'Visible thermal freshness & Stall cleanliness',
                  'Computing evidence-based visual safety score'
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs">
                    {analysisStep >= i + 1 ? (
                      <CheckCircle2 size={15} className="text-amber-400" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                    )}
                    <span className={analysisStep >= i + 1 ? 'text-white font-medium' : 'text-slate-500'}>
                      {step}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
