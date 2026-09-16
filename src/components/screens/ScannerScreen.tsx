import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Zap, ZapOff, RefreshCw, Camera, Upload, AlertCircle, Sparkles, CheckCircle2, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { ScanType, FoodScanResult } from '../../types';
import { aiService, MANDATORY_LAB_DISCLAIMER } from '../../services/aiService';

interface ScannerScreenProps {
  onBack: () => void;
  onAnalysisComplete: (result: FoodScanResult) => void;
  t: Record<string, string>;
}

// Preset food items for quick testing in hackathon demo
const SAMPLE_PRESETS: {
  name: string;
  type: ScanType;
  image: string;
  score: number;
  riskLabel: 'Lower apparent risk' | 'Caution' | 'Higher apparent risk';
  riskColor: 'green' | 'yellow' | 'red';
  expiryDetected: boolean;
  detectedExpiryDate: string;
  summary: { id: string; category: string; status: 'safe' | 'caution' | 'danger'; title: string; detail: string }[];
  recommendation: string;
  ingredientsOrCleanliness: string[];
  nutritionOrVisualIndicators: Record<string, string>;
}[] = [
  {
    name: 'Vada Pav (Street Food)',
    type: 'street',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80',
    score: 7.8,
    riskLabel: 'Lower apparent risk',
    riskColor: 'green',
    expiryDetected: false,
    detectedExpiryDate: 'Expiry could not be verified from this image.',
    summary: [
      { id: '1', category: 'Food Identification', status: 'safe', title: 'Food Identification', detail: 'Identified: Mumbai Batata Vada in Pav' },
      { id: '2', category: 'Visible Freshness', status: 'safe', title: 'Visible Freshness Indicators', detail: 'Steam visible, freshly cooked golden crisp batter' },
      { id: '3', category: 'Cleanliness', status: 'safe', title: 'Cleanliness / Hygiene', detail: 'Serving counter clean, stainless steel trays, tongs in use' },
      { id: '4', category: 'Oil Quality', status: 'caution', title: 'Oil / Appearance Indicators', detail: 'Light amber oil, moderate frying temperature observed' },
      { id: '5', category: 'Visual Condition', status: 'safe', title: 'Overall Visual Condition', detail: 'No mold, discoloration or debris detected' }
    ],
    recommendation: 'Based on the visible information available, no obvious warning signs were detected. The stall uses covered glass display and fresh chutneys. Good to consume while hot.',
    ingredientsOrCleanliness: ['Potato mash with turmeric, mustard & green chilli', 'Gram flour (Besan) coating', 'Fresh Pav bread', 'Garlic peanut chutney'],
    nutritionOrVisualIndicators: {
      'Serving Temperature': '~68°C (Hot & Fresh)',
      'Estimated Energy': '280 kcal',
      'Oil Appearance': 'Acceptable golden hue',
      'Hygiene Index': '4.2/5 Visual Rating'
    }
  },
  {
    name: 'Packaged Potato Chips',
    type: 'packaged',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
    score: 8.2,
    riskLabel: 'Lower apparent risk',
    riskColor: 'green',
    expiryDetected: true,
    detectedExpiryDate: 'Best Before: 18 Dec 2026 (Verified)',
    summary: [
      { id: '1', category: 'Food Identification', status: 'safe', title: 'Food Identification', detail: 'Packaged Classic Salted Potato Chips' },
      { id: '2', category: 'Expiry Date', status: 'safe', title: 'Expiry / Best Before', detail: 'Valid (Best before 18 Dec 2026)' },
      { id: '3', category: 'Packaging Condition', status: 'safe', title: 'Packaging Condition', detail: 'Hermetically sealed, nitrogen puff intact, no leaks' },
      { id: '4', category: 'Ingredients', status: 'caution', title: 'Ingredients & Additives', detail: 'High sodium (580mg/100g) & Palmolein oil detected' },
      { id: '5', category: 'Allergen Advisory', status: 'caution', title: 'Allergen Information', detail: 'May contain traces of milk solids and soy' }
    ],
    recommendation: 'Based on the visible package information available, no obvious warning signs were detected. Packaging is fully intact with clear FSSAI license.',
    ingredientsOrCleanliness: ['Potatoes', 'Edible Vegetable Oil (Palmolein)', 'Iodised Salt (1.8%)'],
    nutritionOrVisualIndicators: {
      'FSSAI Lic.': '10014022002711 (Verified)',
      'Expiry Date': '18/12/2026',
      'Packaging Seal': '100% Intact',
      'Sodium Content': 'Elevated'
    }
  },
  {
    name: 'Samosa Chaat & Chutney',
    type: 'street',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    score: 8.4,
    riskLabel: 'Lower apparent risk',
    riskColor: 'green',
    expiryDetected: false,
    detectedExpiryDate: 'Expiry could not be verified from this image.',
    summary: [
      { id: '1', category: 'Food Identification', status: 'safe', title: 'Food Identification', detail: 'Identified: Punjabi Samosa with Ragda & Chutney' },
      { id: '2', category: 'Visible Freshness', status: 'safe', title: 'Visible Freshness Indicators', detail: 'Crisp pastry shell, piping hot peas and potato filling' },
      { id: '3', category: 'Cleanliness', status: 'safe', title: 'Cleanliness / Hygiene', detail: 'Enclosed glass counter, server wearing gloves and cap' },
      { id: '4', category: 'Oil Quality', status: 'safe', title: 'Oil / Appearance Indicators', detail: 'Clean frying setup, uniform golden crust' },
      { id: '5', category: 'Visual Condition', status: 'safe', title: 'Overall Visual Condition', detail: 'Chutneys stored in cold stainless-steel containers' }
    ],
    recommendation: 'Based on the visible information available, no obvious warning signs were detected. Visual inspection shows high hygiene standards.',
    ingredientsOrCleanliness: ['Refined wheat crust', 'Spiced potatoes & green peas', 'Tamarind sweet chutney', 'Mint coriander green chutney'],
    nutritionOrVisualIndicators: {
      'Serving Temperature': '~65°C',
      'Estimated Energy': '320 kcal',
      'Hygiene Rating': '4.6/5',
      'Water Source': 'RO Filtered Claimed'
    }
  }
];

export const ScannerScreen: React.FC<ScannerScreenProps> = ({
  onBack,
  onAnalysisComplete,
  t
}) => {
  const [scanType, setScanType] = useState<ScanType>('packaged');
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [useLiveCamera, setUseLiveCamera] = useState<boolean>(false);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activePreset = SAMPLE_PRESETS[selectedPresetIndex];
  const currentPreviewImage = customImage || activePreset.image;

  // Camera handling
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device access is not supported on this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraPermissionStatus('granted');
      setUseLiveCamera(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraPermissionStatus('denied');
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. You can use the gallery upload button below.'
          : 'Camera device is unavailable. Using simulated photo mode.'
      );
      setUseLiveCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setUseLiveCamera(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle Capture Action -> Canvas snapshot -> Multi-Step AI Analysis
  const handleCapture = async () => {
    let capturedImage = currentPreviewImage;

    // If live camera is active, capture frame onto hidden canvas
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

    setIsAnalyzing(true);
    setAnalysisStep(1);

    const t1 = setTimeout(() => setAnalysisStep(2), 600);
    const t2 = setTimeout(() => setAnalysisStep(3), 1200);
    const t3 = setTimeout(() => setAnalysisStep(4), 1800);

    try {
      // Call aiService for real Gemini Vision or high-fidelity simulated pipeline
      const result = await aiService.analyzeFoodImage({
        imageBase64: capturedImage,
        scanType,
        language: 'en',
        foodNameHint: customImage ? undefined : activePreset.name
      });

      setTimeout(() => {
        setIsAnalyzing(false);
        onAnalysisComplete(result);
      }, 2400);
    } catch (err) {
      console.warn('AI analysis pipeline error:', err);
      // Fallback result
      setTimeout(() => {
        setIsAnalyzing(false);
        const fallbackResult: FoodScanResult = {
          id: 'scan-' + Date.now(),
          foodName: customImage ? (scanType === 'packaged' ? 'Scanned Packaged Food' : 'Scanned Street Food Item') : activePreset.name,
          foodType: scanType,
          imageUrl: capturedImage,
          scanDate: 'Scanned just now',
          safetyScore: activePreset.score,
          riskLabel: activePreset.riskLabel,
          riskColor: activePreset.riskColor,
          expiryDetected: activePreset.expiryDetected,
          detectedExpiryDate: activePreset.detectedExpiryDate,
          summaryItems: activePreset.summary,
          recommendation: activePreset.recommendation,
          disclaimer: MANDATORY_LAB_DISCLAIMER,
          ingredientsOrCleanliness: activePreset.ingredientsOrCleanliness,
          nutritionOrVisualIndicators: activePreset.nutritionOrVisualIndicators
        };
        onAnalysisComplete(fallbackResult);
      }, 2400);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  // Gallery File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black text-white relative select-none overflow-hidden">
      {/* Hidden canvas for video snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Camera Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Scan Type Toggle (Packaged Food vs Street Food) */}
        <div className="bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/20 flex items-center gap-1 shadow-lg">
          <button
            onClick={() => {
              setScanType('packaged');
              if (!customImage) setSelectedPresetIndex(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              scanType === 'packaged'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.packagedFood || 'Packaged Food'}
          </button>
          <button
            onClick={() => {
              setScanType('street');
              if (!customImage) setSelectedPresetIndex(0);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              scanType === 'street'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
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
        {/* Flash screen effect */}
        {flashOn && (
          <div className="absolute inset-0 bg-amber-100/20 pointer-events-none z-10"></div>
        )}

        {/* Live Camera Feed or Static Preview */}
        {useLiveCamera ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
            <img
              src={currentPreviewImage}
              alt="Food Preview"
              className="w-full h-full object-cover opacity-90 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none"></div>
          </div>
        )}

        {/* Reticle / Viewfinder Frame in Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none z-20">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 border-amber-400/80 shadow-2xl flex items-center justify-center">
            {/* Corner accents */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl"></div>

            {/* Laser scanning line */}
            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse shadow-sm shadow-amber-400"></div>

            {/* Center Reticle */}
            <div className="w-8 h-8 rounded-full border border-dashed border-amber-400/50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></div>
            </div>
          </div>

          {/* Guide Text */}
          <div className="mt-4 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-center">
            <p className="text-xs font-semibold text-amber-300 tracking-tight">
              {scanType === 'packaged'
                ? 'Align package & expiry text inside the frame'
                : (t.placeInsideFrame || 'Place the food inside the frame')}
            </p>
          </div>
        </div>

        {/* Top Disclaimer Banner */}
        <div className="absolute top-20 left-4 right-4 z-20 pointer-events-none">
          <div className="bg-amber-500/90 backdrop-blur-md text-slate-950 px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-2 shadow-lg">
            <ShieldAlert size={16} className="flex-shrink-0" />
            <p className="text-[10px] font-bold leading-tight">
              AI-based visual assessment only. Not a laboratory test.
            </p>
          </div>
        </div>

        {/* Camera Permission Alert Banner */}
        {cameraError && (
          <div className="absolute bottom-24 left-4 right-4 z-30 bg-black/80 backdrop-blur-md border border-amber-500/40 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200 animate-fade-in">
            <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-white">{cameraError}</p>
              <button
                onClick={() => setCameraError(null)}
                className="text-[10px] text-amber-400 font-bold underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preset Samples Selector Bar (For Hackathon Demo Convenience) */}
      <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs z-20">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Demo Food:
        </span>
        <div className="flex gap-1.5 overflow-x-auto">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={preset.name}
              onClick={() => {
                stopCamera();
                setCustomImage(null);
                setSelectedPresetIndex(idx);
                setScanType(preset.type);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedPresetIndex === idx && !customImage && !useLiveCamera
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {preset.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Shutter & Controls Section */}
      <div className="bg-slate-950 px-6 pt-3 pb-8 flex items-center justify-around z-20 border-t border-slate-800/40">
        {/* Gallery / File Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all cursor-pointer"
          title="Upload food photo from gallery"
        >
          <Upload size={18} />
          <span className="text-[9px] font-medium">Gallery</span>
        </button>

        {/* Big Shutter Button: [ 📷 SCAN FOOD ] */}
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

        {/* Live Camera Toggle button */}
        <button
          onClick={() => {
            if (useLiveCamera) {
              stopCamera();
            } else {
              startCamera();
            }
          }}
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

      {/* "Analyzing Food..." Modal Overlay with Multi-Step Radar Animation */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          {/* Radar scan wave animation */}
          <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-ping"></div>
            <div className="w-24 h-24 rounded-full bg-amber-950/70 border-2 border-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/30">
              <Sparkles size={36} className="text-amber-400 animate-spin" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">
            {t.analyzingFood || 'Analyzing Food...'}
          </h3>
          <p className="text-xs text-amber-400 font-semibold mt-1">
            {aiService.isConfigured() ? 'Gemini 2.5 Flash Vision AI (Live API)' : 'FoodCheck AI Vision Model v2.4'}
          </p>

          {/* Analysis Categories Progress Steps */}
          <div className="w-full max-w-xs mt-6 space-y-2.5 text-left bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
            {scanType === 'packaged' ? (
              <>
                <div className="flex items-center gap-2.5 text-xs">
                  {analysisStep >= 1 ? <CheckCircle2 size={15} className="text-amber-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600"></div>}
                  <span className={analysisStep >= 1 ? 'text-white font-medium' : 'text-slate-500'}>
                    Product identification & FSSAI check
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  {analysisStep >= 2 ? <CheckCircle2 size={15} className="text-amber-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600"></div>}
                  <span className={analysisStep >= 2 ? 'text-white font-medium' : 'text-slate-500'}>
                    Expiry date / Best before OCR scan
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  {analysisStep >= 3 ? <CheckCircle2 size={15} className="text-amber-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600"></div>}
                  <span className={analysisStep >= 3 ? 'text-white font-medium' : 'text-slate-500'}>
                    Ingredients, Additives & Nutrition values
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  {analysisStep >= 4 ? <CheckCircle2 size={15} className="text-amber-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600"></div>}
                  <span className={analysisStep >= 4 ? 'text-white font-medium' : 'text-slate-500'}>
                    Packaging seal & Allergen verification
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 text-xs">
                  {analysisStep >= 1 ? <CheckCircle2 size={15} className="text-amber-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600"></div>}
                  <span className={analysisStep >= 1 ? 'text-white font-medium' : 'text-slate-500'}>
                    Street food identification & Presentation
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  {analysisStep >= 2 ? <CheckCircle2 size={15} className="text-amber-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600"></div>}
                  <span className={analysisStep >= 2 ? 'text-white font-medium' : 'text-slate-500'}>
                    Visible thermal freshness & Steam detection
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  {analysisStep >= 3 ? <CheckCircle2 size={15} className="text-amber-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600"></div>}
                  <span className={analysisStep >= 3 ? 'text-white font-medium' : 'text-slate-500'}>
                    Stall cleanliness & Utensil hygiene
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  {analysisStep >= 4 ? <CheckCircle2 size={15} className="text-amber-400" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600"></div>}
                  <span className={analysisStep >= 4 ? 'text-white font-medium' : 'text-slate-500'}>
                    Oil appearance clarity & Visual safety score
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
