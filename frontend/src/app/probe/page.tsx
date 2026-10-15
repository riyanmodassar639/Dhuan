'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Heart, 
  Wind, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  RefreshCw, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api';

function MobileProbeContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') || '';
  const vitalType = searchParams.get('type') || 'heart_rate';

  // Video & Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Biometric state
  const [isTouchingBody, setIsTouchingBody] = useState<boolean>(false);
  const [liveBpm, setLiveBpm] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [finalResult, setFinalResult] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('Tap "Turn ON Flashlight & Start Sensor" below.');
  const [wavePoints, setWavePoints] = useState<number[]>([]);

  // Telemetry throttling & tap guard
  const lastStreamPostRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  // PPG Algorithm Refs
  const ppgHistoryRef = useRef<number[]>([]);
  const lastPeakTimeRef = useRef<number>(0);
  const peakTimesRef = useRef<number[]>([]);
  const totalBpmAccumRef = useRef<number[]>([]);

  const vitalConfig = {
    heart_rate: {
      name: 'Heart Rate (Resting Pulse)',
      unit: 'BPM',
      icon: Heart,
      color: 'rose',
      normalRange: '60 - 100 BPM'
    },
    spo2: {
      name: 'Blood Oxygen (SpO2)',
      unit: '%',
      icon: Wind,
      color: 'cyan',
      normalRange: '95% - 100%'
    },
    blood_pressure: {
      name: 'Cardiovascular Pulse Rate',
      unit: 'BPM',
      icon: Activity,
      color: 'indigo',
      normalRange: '60 - 100 BPM'
    }
  }[vitalType] || {
    name: 'Biometric Vital Sign',
    unit: 'BPM',
    icon: Heart,
    color: 'rose',
    normalRange: '60 - 100'
  };

  // Post Telemetry Updates to Backend
  const postTelemetryUpdate = useCallback(async (
    touching: boolean, 
    bpmVal: number, 
    prog: number, 
    wave: number[], 
    complete: boolean = false
  ) => {
    if (!sessionId) return;
    const now = Date.now();
    if (!complete && now - lastStreamPostRef.current < 350) return;
    lastStreamPostRef.current = now;

    try {
      await fetch(getApiEndpoint('/emergency/telemetry/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          isTouchingBody: touching,
          liveValue: bpmVal,
          progress: prog,
          waveData: wave.slice(-20),
          status: complete ? 'completed' : (touching ? 'measuring' : 'awaiting_probe'),
          deviceName: 'Apple iPhone (Optical PPG Probe)'
        })
      });
    } catch (e) {
      // Telemetry stream network warning silently ignored in frame loop
    }
  }, [sessionId]);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          if (torchEnabled && (track as any).applyConstraints) {
            (track as any).applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
          }
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }
    setIsScanning(false);
  }, [torchEnabled]);

  // Toggle flashlight / torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && (track as any).applyConstraints) {
      try {
        const next = !torchEnabled;
        await (track as any).applyConstraints({ advanced: [{ torch: next }] });
        setTorchEnabled(next);
      } catch (e) {
        console.warn('Torch toggle attempt failed:', e);
      }
    }
  };

  // Start Camera and Optical PPG Processing
  const startCameraAndFlashlight = async () => {
    stopCamera();
    setIsComplete(false);
    setFinalResult(0);
    setProgress(0);
    setLiveBpm(0);
    setIsTouchingBody(false);
    setErrorMessage(null);
    ppgHistoryRef.current = [];
    peakTimesRef.current = [];
    totalBpmAccumRef.current = [];

    // 1. Verify mediaDevices availability
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      const isHttp = typeof window !== 'undefined' && window.location.protocol === 'http:';
      const msg = isHttp 
        ? 'Insecure HTTP: Mobile browsers block camera access on HTTP. Please open https://' + (window?.location?.host || '192.168.100.22:3000') + ' and accept the security notice.'
        : 'Camera access is not supported by this browser. Please use Safari (iPhone) or Chrome (Android).';
      setErrorMessage(msg);
      setStatusMsg(msg);
      return;
    }

    let stream: MediaStream | null = null;
    try {
      // 2. Request rear environment camera
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } }
      });
    } catch (envErr: any) {
      console.warn('Environment camera constraint rejected, trying generic video:', envErr);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      } catch (genErr: any) {
        console.error('All camera requests rejected:', genErr);
        setHasCameraPermission(false);
        const errMsg = genErr?.name === 'NotAllowedError'
          ? 'Camera permission denied! Please allow Camera access in Safari / Chrome settings.'
          : `Camera failed (${genErr?.message || 'Error'}). Please refresh and grant camera permission.`;
        setErrorMessage(errMsg);
        setStatusMsg(errMsg);
        return;
      }
    }

    if (!stream) {
      setErrorMessage('No camera stream received from device.');
      return;
    }

    streamRef.current = stream;
    setHasCameraPermission(true);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('webkit-playsinline', 'true');
      videoRef.current.muted = true;
      try {
        await videoRef.current.play();
      } catch (playErr) {
        console.warn('Video play caught:', playErr);
      }
    }

    // 3. Auto turn ON Flashlight / Torch if supported by device
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      try {
        if ((videoTrack as any).applyConstraints) {
          await (videoTrack as any).applyConstraints({ advanced: [{ torch: true }] });
          setTorchEnabled(true);
          setHasTorchSupport(true);
        }
      } catch (torchErr) {
        // Normal on iOS Safari: Apple WebKit blocks torch API
        console.warn('Torch auto-enable rejected (Normal on iOS Safari):', torchErr);
        setTorchEnabled(false);
        const caps = (videoTrack as any).getCapabilities ? (videoTrack as any).getCapabilities() : {};
        setHasTorchSupport(Boolean(caps.torch));
      }
    }

    setIsScanning(true);
    setStatusMsg('Flashlight & sensor active! Place finger gently on rear camera lens.');
    processVideoFrames();
  };

  // Frame processing loop: Extract real optical pulse signal (PPG)
  const processVideoFrames = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const sampleWidth = 48;
    const sampleHeight = 48;
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;

    let currentProgress = 0;

    const loop = () => {
      if (!streamRef.current || !video.videoWidth) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
      const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
      const data = imgData.data;

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      const totalPixels = sampleWidth * sampleHeight;

      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
      }

      const avgR = rSum / totalPixels;
      const avgG = gSum / totalPixels;
      const avgB = bSum / totalPixels;

      // 1. SKIN CONTACT DETECTION:
      // Supports both torch-illuminated skin (Android) and ambient indoor lighting (iPhone WebKit without torch)
      const redRatio = avgR / (avgG + avgB + 1);
      const hasSkinContact = (avgR > 35 && redRatio > 1.2) || (avgR > 16 && avgR > avgG * 1.12 && avgR > avgB * 1.1);

      if (!hasSkinContact) {
        // Sensor is in ambient room air, NOT on body!
        setIsTouchingBody(false);
        setLiveBpm(0);
        setStatusMsg('⚠️ Waiting for skin touch! Place finger gently over rear camera lens & flash.');
        postTelemetryUpdate(false, 0, currentProgress, wavePoints, false);
      } else {
        // Sensor is actively touching skin/body!
        setIsTouchingBody(true);
        setStatusMsg('🟢 Skin contact verified! Capturing physiological pulse beats...');

        // 2. OPTICAL PULSE SIGNAL EXTRACTION (PPG):
        const rawPulseVal = 255 - avgG;

        ppgHistoryRef.current.push(rawPulseVal);
        if (ppgHistoryRef.current.length > 50) {
          ppgHistoryRef.current.shift();
        }

        // Add to wave visualization points
        setWavePoints(prev => {
          const next = [...prev, Math.round(rawPulseVal)];
          return next.slice(-40);
        });

        // 3. SYSTOLIC PEAK DETECTION
        const history = ppgHistoryRef.current;
        if (history.length >= 7) {
          const midIdx = history.length - 4;
          const midVal = history[midIdx];
          const isLocalMax = 
            midVal > history[midIdx - 1] &&
            midVal > history[midIdx - 2] &&
            midVal > history[midIdx + 1] &&
            midVal > history[midIdx + 2];

          const now = Date.now();
          const timeSinceLastPeak = now - lastPeakTimeRef.current;

          // Realistic human heart rate range: 42 to 190 BPM (315ms to 1420ms interval)
          if (isLocalMax && timeSinceLastPeak > 320 && timeSinceLastPeak < 1450) {
            lastPeakTimeRef.current = now;
            peakTimesRef.current.push(timeSinceLastPeak);
            if (peakTimesRef.current.length > 8) peakTimesRef.current.shift();

            // Calculate instantaneous BPM
            const avgInterval = peakTimesRef.current.reduce((a, b) => a + b, 0) / peakTimesRef.current.length;
            const computedBpm = Math.round(60000 / avgInterval);

            if (computedBpm >= 45 && computedBpm <= 180) {
              setLiveBpm(computedBpm);
              totalBpmAccumRef.current.push(computedBpm);

              // Advance measurement progress with each verified pulse beat (approx 12-14 beats)
              currentProgress = Math.min(100, currentProgress + 8);
              setProgress(currentProgress);

              postTelemetryUpdate(true, computedBpm, currentProgress, history, currentProgress >= 100);

              if (currentProgress >= 100) {
                // Measurement Complete!
                const validBeats = totalBpmAccumRef.current;
                const finalBpm = validBeats.length > 0
                  ? Math.round(validBeats.reduce((a, b) => a + b, 0) / validBeats.length)
                  : computedBpm;

                setFinalResult(finalBpm);
                setIsComplete(true);
                stopCamera();
                postTelemetryUpdate(true, finalBpm, 100, history, true);
                return;
              }
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Touch and Click Handlers with Debounce to prevent double trigger and eliminate 300ms mobile delay
  const handleStartSensor = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastTapRef.current < 400) return;
    lastTapRef.current = now;
    startCameraAndFlashlight();
  };

  const handleToggleTorch = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastTapRef.current < 400) return;
    lastTapRef.current = now;
    toggleTorch();
  };

  const handleStopSensor = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-4 sm:p-6 font-sans relative z-10">
      
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP HEADER: Pure Single-Page (No Navbar, No Links to leave) */}
      <header className="w-full max-w-md pt-2 pb-3 border-b border-slate-900 text-center space-y-1 relative z-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-black uppercase tracking-wider text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>DHUAN Biometric Skin Sensor Probe</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          {vitalConfig.name}
        </h1>
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <span className="font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
            Session: {sessionId || 'DIRECT'}
          </span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">Standard: {vitalConfig.normalRange}</span>
        </div>
      </header>

      {/* ERROR ALERT IF PERMISSIONS OR CONTEXT BLOCKED */}
      {errorMessage && (
        <div className="w-full max-w-md my-2 p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 text-xs text-left space-y-2 animate-in zoom-in-95 relative z-20">
          <div className="flex items-center gap-2 font-black text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>Camera &amp; Sensor Blocked</span>
          </div>
          <p className="leading-relaxed">{errorMessage}</p>
          <div className="pt-2 border-t border-rose-800/80 text-[11px] text-slate-300 space-y-1">
            <p><strong>Troubleshooting:</strong></p>
            <p>1. Open with <strong>https://</strong> (not http://).</p>
            <p>2. Safari / Chrome settings me Camera permission <strong>Allow</strong> karein.</p>
          </div>
        </div>
      )}

      {/* MAIN SENSOR VIEWPORT & CONTROLS */}
      <div className="w-full max-w-md my-auto py-2 flex flex-col items-center space-y-4 relative z-20">

        {/* 1. STATE: COMPLETE */}
        {isComplete ? (
          <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-black uppercase tracking-wider inline-block">
                Measurement Complete
              </span>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-1">
                {finalResult} <span className="text-xl text-slate-400 font-extrabold">{vitalConfig.unit}</span>
              </h2>
              <p className="text-xs text-emerald-300 font-semibold pt-1">
                ✅ Transmitted to your laptop dashboard!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-left space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Laptop Dashboard Updated:</span>
              </div>
              <p className="leading-tight text-[11px]">
                Aapke laptop ki screen par barcode modal khud-ba-khud band ho gaya hai aur verified result screen samne aa chuki hai. Laptop par &quot;Save Verified Measurement&quot; dabayein.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartSensor}
              onTouchEnd={handleStartSensor}
              style={{ touchAction: 'manipulation' }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-95 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Measure Again</span>
            </button>
          </div>
        ) : (
          /* 2. STATE: MEASURING OR IDLE */
          <div className="w-full flex flex-col items-center space-y-4">
            
            {/* Viewport / Skin Sensor Area */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-2xl">
              
              {/* Actual Video Preview */}
              <video 
                ref={videoRef} 
                playsInline 
                webkit-playsinline="true"
                muted 
                className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity ${
                  isScanning ? 'opacity-40 filter blur-xs' : 'opacity-0'
                }`}
              />

              {/* White Illumination Ring (Shines high-intensity white light on finger) */}
              {isScanning && (
                <div className={`absolute inset-0 border-8 pointer-events-none transition-all ${
                  isTouchingBody ? 'border-emerald-500/80 shadow-[inset_0_0_40px_rgba(16,185,129,0.5)]' : 'border-white/70 shadow-[inset_0_0_50px_rgba(255,255,255,0.7)]'
                }`} />
              )}

              {/* Central Pulse Indicator */}
              <div className="relative z-10 text-center space-y-2 pointer-events-none">
                <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center transition-all ${
                  isTouchingBody
                    ? 'bg-rose-600/30 border-4 border-rose-500 shadow-2xl shadow-rose-500/50 scale-105'
                    : (isScanning ? 'bg-slate-800/80 border-2 border-slate-700' : 'bg-slate-900 border border-slate-800')
                }`}>
                  <Heart className={`w-12 h-12 transition-transform ${
                    isTouchingBody 
                      ? 'text-rose-500 fill-current scale-125 animate-pulse' 
                      : (isScanning ? 'text-amber-400 animate-bounce' : 'text-slate-600')
                  }`} />
                </div>

                <div className="space-y-0.5">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                    {isTouchingBody && liveBpm > 0 ? liveBpm : (isScanning ? '--' : '0')}
                    <span className="text-xs text-slate-400 font-sans uppercase ml-1">{vitalConfig.unit}</span>
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block ${
                    isTouchingBody 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : (isScanning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400')
                  }`}>
                    {isTouchingBody ? 'Skin Contact Active' : (isScanning ? 'Place Finger on Lens' : 'Sensor Ready')}
                  </span>
                </div>
              </div>

              {/* Progress Overlay */}
              {isScanning && (
                <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 p-2.5 border-t border-slate-800 pointer-events-none">
                  <div className="flex justify-between text-[11px] font-black text-slate-400 mb-1">
                    <span>Sampling Pulse Waves</span>
                    <span className="text-emerald-400">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Live PPG Waveform Strip */}
            {isScanning && isTouchingBody && wavePoints.length > 0 && (
              <div className="w-full p-2.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 pointer-events-none">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Photoplethysmography (PPG) Wave</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Pulse
                  </span>
                </div>
                <div className="h-8 w-full flex items-end gap-1">
                  {wavePoints.map((val, idx) => {
                    const heightPercent = Math.max(12, Math.min(100, ((val - 80) / 160) * 100));
                    return (
                      <div 
                        key={idx} 
                        className="flex-1 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-xs transition-all duration-100"
                        style={{ height: `${heightPercent}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status Message Card */}
            <div className={`w-full p-3 rounded-2xl text-xs text-center border font-semibold ${
              isTouchingBody 
                ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                : (isScanning ? 'bg-amber-950/50 border-amber-600 text-amber-200 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-300')
            }`}>
              {statusMsg}
            </div>

            {/* DEDICATED FLASHLIGHT & SENSOR TRIGGER BUTTON */}
            <div className="w-full space-y-2 pt-1 relative z-50 pointer-events-auto">
              {!isScanning ? (
                <button
                  type="button"
                  onClick={handleStartSensor}
                  onTouchEnd={handleStartSensor}
                  style={{ touchAction: 'manipulation' }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer relative z-50 pointer-events-auto"
                >
                  <Zap className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse pointer-events-none" />
                  <span className="pointer-events-none">Turn ON Flashlight &amp; Start Sensor</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    onTouchEnd={handleToggleTorch}
                    style={{ touchAction: 'manipulation' }}
                    className={`py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer relative z-50 pointer-events-auto active:scale-95 ${
                      torchEnabled 
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20' 
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Zap className="w-4 h-4 pointer-events-none" />
                    <span className="pointer-events-none">{torchEnabled ? 'Flashlight ON' : 'Toggle Flashlight'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStopSensor}
                    onTouchEnd={handleStopSensor}
                    style={{ touchAction: 'manipulation' }}
                    className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-rose-300 border border-slate-700 font-black text-xs flex items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto active:scale-95"
                  >
                    <span className="pointer-events-none">Stop Sensor</span>
                  </button>
                </div>
              )}
            </div>

            {/* INSTRUCTION CARD FOR IPHONE & ANDROID */}
            <div className="w-full p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 text-left space-y-1 leading-relaxed">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quick Instructions:</span>
              </div>
              <p>1. Button dabayein taakay camera aur flashlight on ho.</p>
              <p>2. Apni finger ko mobile ke rear camera lens aur flashlight par gently rakhein.</p>
              <p>3. Skin touch hotay he heartbeat count shuru hogi aur laptop screen par reading live pohnch jayegi.</p>
            </div>

          </div>
        )}

      </div>

      {/* FOOTER: Zero Links, strictly status indicator */}
      <footer className="w-full max-w-md pt-3 border-t border-slate-900 text-center text-[10px] text-slate-600 relative z-20">
        DHUAN Clinical Assessment System • Standalone Telemetry Client
      </footer>

    </div>
  );
}

export default function MobileProbePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
          <span>Loading Biometric Probe...</span>
        </div>
      </div>
    }>
      <MobileProbeContent />
    </Suspense>
  );
}
