import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Zap, ZapOff, RefreshCw, Camera, Upload, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
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

  // Placeholder preview when no image is selected and camera is off
  const currentPreviewImage = customImage || null;

  // Camera handling
  const startCamera = async () => {
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
      console.warn('[FoodCheck] Camera access denied or unavailable:', err);
      setCameraPermissionStatus('denied');
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. You can use the gallery upload button below.'
          : 'Camera device is unavailable. Please use the gallery upload button.'
      );
      setUseLiveCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setUseLiveCamera(false);
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  // Capture & Analyse
  const handleCapture = async () => {
    let capturedImage = currentPreviewImage;

    if (useLiveCamera && videoRef.current && canvasRef.current) {
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
      stopCamera();
    }

    if (!capturedImage) {
      setCameraError('Please take a photo or upload an image before scanning.');
      return;
    }

    // Dev Logging for Scanner Flow
    console.info('[FoodCheck Scanner] Analysis button clicked for scanType:', scanType);
    console.info('[FoodCheck Scanner] Image captured. Size / format info:', {
      length: capturedImage.length,
      isDataUrl: capturedImage.startsWith('data:'),
      type: capturedImage.startsWith('data:') ? capturedImage.split(';')[0] : 'image/jpeg'
    });

    setAnalysisError(null);
    setIsAnalyzing(true);
    setAnalysisStep(1);
    const t1 = setTimeout(() => setAnalysisStep(2), 500);
    const t2 = setTimeout(() => setAnalysisStep(3), 1000);
    const t3 = setTimeout(() => setAnalysisStep(4), 1500);

    try {
      const result = await aiService.analyzeFoodImage({
        imageBase64: capturedImage,
        scanType,
        language: 'en',
      });
      setIsAnalyzing(false);
      onAnalysisComplete(result);
    } catch (err: any) {
      console.error('[FoodCheck Scanner] AI analysis pipeline error:', err);
      setIsAnalyzing(false);
      setAnalysisError(
        err?.message ||
        'AI Food analysis failed. Please verify your Gemini API key and ensure the food image is clear.'
      );
    }

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
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
          onClick={() => { stopCamera(); onBack(); }}
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

      {/* Main Viewfinder Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {flashOn && <div className="absolute inset-0 bg-amber-100/20 pointer-events-none z-10" />}

        {/* Live Camera Feed or Upload Preview */}
        {useLiveCamera ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : currentPreviewImage ? (
          <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
            <img
              src={currentPreviewImage}
              alt="Food Preview"
              className="w-full h-full object-cover opacity-90 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-4 text-slate-400">
              <Camera size={48} strokeWidth={1.5} className="opacity-30" />
              <p className="text-sm font-medium opacity-60">Open camera or upload a photo</p>
            </div>
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

        {/* Camera Error Banner */}
        {cameraError && (
          <div className="absolute bottom-24 left-4 right-4 z-30 bg-black/80 backdrop-blur-md border border-amber-500/40 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200 animate-fade-in">
            <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-white">{cameraError}</p>
              <button onClick={() => setCameraError(null)} className="text-[10px] text-amber-400 font-bold underline mt-1">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Shutter & Controls */}
      <div className="bg-slate-950 px-6 pt-3 pb-8 flex items-center justify-around z-20 border-t border-slate-800/40">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
          title="Upload food photo from gallery"
        >
          <Upload size={18} />
          <span className="text-[9px] font-medium">Gallery</span>
        </button>

        {/* Big Shutter Button */}
        <button
          onClick={handleCapture}
          className="w-20 h-20 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/40 active:scale-95 transition-all group cursor-pointer"
          aria-label="Capture Food Image"
        >
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center group-hover:scale-95 transition-transform">
            <div className="w-13 h-13 rounded-full bg-orange-500 flex items-center justify-center text-white">
              <Camera size={24} strokeWidth={2.4} />
            </div>
          </div>
        </button>

        {/* Live Camera Toggle */}
        <button
          onClick={() => { if (useLiveCamera) stopCamera(); else startCamera(); }}
          className={`w-12 h-12 rounded-2xl border flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer ${
            useLiveCamera
              ? 'bg-amber-500/30 border-amber-400 text-amber-300'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
          title="Toggle live device camera"
        >
          <RefreshCw size={18} />
          <span className="text-[9px] font-medium">{useLiveCamera ? 'Live ON' : 'Live Cam'}</span>
        </button>
      </div>

      {/* Analysis Error Modal */}
      {analysisError && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 max-w-sm w-full text-center shadow-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">AI Food Scan Notice</h4>
            <p className="text-xs text-slate-300 leading-relaxed text-left bg-slate-950/80 p-3 rounded-xl border border-slate-800 break-words">
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
            Google Gemini 2.5 Flash Vision Engine
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
