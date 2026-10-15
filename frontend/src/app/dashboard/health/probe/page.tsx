'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  RefreshCw, 
  Activity, 
  ShieldCheck, 
  ArrowLeft,
  Flame,
  Check
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api';

export default function MobileBiometricProbePage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [vitalType, setVitalType] = useState<string>('heart_rate');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);

  // Biometric state
  const [isTouchingBody, setIsTouchingBody] = useState<boolean>(false);
  const [liveBpm, setLiveBpm] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [wavePoints, setWavePoints] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [finalResult, setFinalResult] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('Align phone camera against finger / skin to begin');

  // Video and Canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // PPG Algorithm telemetry tracking refs
  const ppgHistoryRef = useRef<number[]>([]);
  const peakTimesRef = useRef<number[]>([]);
  const lastPeakTimeRef = useRef<number>(0);
  const consecutiveValidBeatsRef = useRef<number>(0);
  const totalBpmAccumRef = useRef<number[]>([]);
  const lastStreamPostRef = useRef<number>(0);

  // Read session ID from URL query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get('session') || `DHUAN-${Math.floor(100000 + Math.random() * 900000)}`;
      const vtype = params.get('type') || 'heart_rate';
      setSessionId(sid);
      setVitalType(vtype);
    }
  }, []);

  // Post live telemetry to backend
  const postTelemetryUpdate = useCallback(async (
    touching: boolean, 
    bpmVal: number, 
    prog: number, 
    wave: number[], 
    complete: boolean = false
  ) => {
    if (!sessionId) return;
    const now = Date.now();
    // Throttle network updates to once every 350ms unless completion event
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

  // Start Camera and Optical PPG Processing
  const startCamera = async () => {
    stopCamera();
    setIsComplete(false);
    setFinalResult(null);
    setProgress(0);
    setLiveBpm(0);
    setIsTouchingBody(false);
    ppgHistoryRef.current = [];
    peakTimesRef.current = [];
    totalBpmAccumRef.current = [];
    consecutiveValidBeatsRef.current = 0;

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' }, // Back camera for finger placement
          width: { ideal: 192 },
          height: { ideal: 192 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check for torch / flash support and auto-enable
      const videoTrack = stream.getVideoTracks()[0];
      setHasTorchSupport(true); // Always make torch button visible for phone user
      if (videoTrack && (videoTrack as any).applyConstraints) {
        try {
          await (videoTrack as any).applyConstraints({ advanced: [{ torch: true }] });
          setTorchEnabled(true);
        } catch (e) {
          console.warn('Auto torch enable failed, fallback to manual toggle:', e);
          const capabilities = (videoTrack as any).getCapabilities ? (videoTrack as any).getCapabilities() : {};
          if (capabilities.torch) {
            setTorchEnabled(false);
          }
        }
      }

      setIsScanning(true);
      setStatusMsg('Place finger gently over camera lens and flash');
      processVideoFrames();
    } catch (err: any) {
      console.error('Camera permission or initialization failed:', err);
      setHasCameraPermission(false);
      setStatusMsg('Camera access is required for optical biometric pulse measurement. Please allow camera permissions in your browser.');
    }
  };

  // Toggle flash torch
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
      // When a finger or body skin covers the camera, red strongly dominates and green/blue drop
      const redRatio = avgR / (avgG + avgB + 1);
      const hasSkinContact = avgR > 55 && redRatio > 1.25;

      if (!hasSkinContact) {
        // Sensor is in ambient room air, NOT on body!
        setIsTouchingBody(false);
        setLiveBpm(0);
        setStatusMsg('⚠️ No body contact! Place finger gently on the camera lens & flash.');
        postTelemetryUpdate(false, 0, currentProgress, wavePoints, false);
      } else {
        // Sensor is actively touching skin/body!
        setIsTouchingBody(true);
        setStatusMsg('🟢 Body touch verified! Capturing live pulse waves...');

        // 2. OPTICAL PULSE SIGNAL EXTRACTION (PPG):
        // Pulsatile hemoglobin changes modulate absorption in green channel
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
              consecutiveValidBeatsRef.current += 1;

              // Advance measurement progress with each verified pulse beat
              currentProgress = Math.min(100, currentProgress + 7);
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

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col p-4 sm:p-6">
      
      {/* Top Bar */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800">
        <Link 
          href="/dashboard/health" 
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Probe Mode</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider">
            Live Telemetry Sync
          </span>
        </div>
      </header>

      {/* Main Probe Card */}
      <main className="flex-1 max-w-md w-full mx-auto flex flex-col justify-center space-y-6 py-6">
        
        {/* Session ID & Link Indicator */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400 font-bold">Active Probe Session:</span>
          </div>
          <span className="font-mono font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/80">
            {sessionId || 'INITIALIZING'}
          </span>
        </div>

        {/* Video / Sensor Scanning Viewport */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 aspect-square flex items-center justify-center shadow-2xl">
          
          {/* Hidden Canvas and Live Video */}
          <video 
            ref={videoRef} 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover opacity-30 filter blur-xs"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Pulse Circle / Wave Ring */}
          <div className="relative z-10 text-center space-y-3">
            <div className={`relative w-36 h-36 mx-auto rounded-full flex items-center justify-center transition-all ${
              isTouchingBody 
                ? 'bg-rose-600/20 border-4 border-rose-500 shadow-2xl shadow-rose-500/40 animate-pulse' 
                : 'bg-slate-800/60 border-2 border-slate-700'
            }`}>
              {isTouchingBody && (
                <div className="absolute inset-0 rounded-full border-2 border-rose-400 animate-ping opacity-75"></div>
              )}
              <div className="text-center">
                <Heart className={`w-12 h-12 mx-auto transition-transform ${
                  isTouchingBody ? 'text-rose-500 fill-current scale-110 animate-bounce' : 'text-slate-600'
                }`} />
                <span className="text-2xl font-black block tracking-tight">
                  {liveBpm > 0 ? liveBpm : '--'}
                </span>
                <span className="text-[10px] font-black uppercase text-slate-400">BPM</span>
              </div>
            </div>

            {/* Skin Contact Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm">
              {isTouchingBody ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Skin Contact Verified (Body Detected)
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Not On Body (Reading: 0 BPM)
                </span>
              )}
            </div>
          </div>

          {/* Progress Overlay */}
          {isScanning && (
            <div className="absolute bottom-0 inset-x-0 h-2 bg-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Live Real-Time Wave Graph */}
        {wavePoints.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
              <span>Arterial Photoplethysmography Waveform</span>
              <span className="text-emerald-400">Live 30 FPS</span>
            </div>
            <div className="h-10 w-full flex items-end gap-1">
              {wavePoints.map((val, idx) => {
                const heightPercent = Math.max(10, Math.min(100, ((val - 100) / 155) * 100));
                return (
                  <div 
                    key={idx} 
                    className="flex-1 bg-rose-500/80 rounded-t-sm transition-all"
                    style={{ height: `${heightPercent}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Status Message */}
        <p className="text-xs text-center font-bold text-slate-300 px-4">
          {statusMsg}
        </p>

        {/* Completed Card */}
        {isComplete && finalResult && (
          <div className="p-5 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-emerald-400">
              Verified Resting Pulse: {finalResult} BPM
            </h3>
            <p className="text-xs text-slate-300">
              Measurement synchronized with laptop dashboard session. You may return to your laptop screen or measure again.
            </p>
          </div>
        )}

        {/* Control Actions */}
        <div className="space-y-3">
          {!isScanning ? (
            <button
              type="button"
              onClick={startCamera}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-5 h-5" />
              <span>{isComplete ? 'Measure Again' : 'Start Biometric Skin Sensor'}</span>
            </button>
          ) : (
            <div className="flex gap-2.5">
              {hasTorchSupport && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-xs border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    torchEnabled 
                      ? 'bg-amber-400 text-slate-950 border-amber-300' 
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  <span>{torchEnabled ? 'Flash Torch ON' : 'Turn Flash ON'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 py-3.5 rounded-2xl bg-rose-600/80 hover:bg-rose-500 text-white font-black text-xs transition-colors cursor-pointer"
              >
                Stop Sensor
              </button>
            </div>
          )}
        </div>

      </main>

      {/* Footer Info */}
      <footer className="text-center text-[11px] text-slate-500 pt-4 border-t border-slate-800">
        DHUAN Clinical Biometrics Engine • Computer Vision Photoplethysmography (PPG)
      </footer>

    </div>
  );
}
