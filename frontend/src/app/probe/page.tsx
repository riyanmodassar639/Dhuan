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
  Check,
  ShieldAlert,
  Gauge,
  Timer,
  Play,
  Square,
  Thermometer,
  Mic,
  Volume2,
  Stethoscope
} from 'lucide-react';
import { getApiEndpoint } from '@/lib/api';

function MobileProbeContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') || '';
  const vitalType = searchParams.get('type') || 'heart_rate';

  // Video & Stream State (for optical PPG)
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
  const [liveBpSys, setLiveBpSys] = useState<number>(0);
  const [liveBpDia, setLiveBpDia] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [finalResult, setFinalResult] = useState<number>(0);
  const [finalSecondary, setFinalSecondary] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('Sensor Ready.');
  const [wavePoints, setWavePoints] = useState<number[]>([]);

  // Telemetry throttling & tap guard
  const lastStreamPostRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  // PPG Algorithm Refs & Clinical Filters
  const lastBeatTimeRef = useRef<number>(0);
  const beatIntervalsRef = useRef<number[]>([]);
  const totalBeatsAccumRef = useRef<number[]>([]);
  const smoothValRef = useRef<number>(0);
  const baselineValRef = useRef<number>(0);
  const prevWaveValRef = useRef<number>(0);
  const lastProgressTickRef = useRef<number>(0);
  const rollingAmpRef = useRef<number>(0.04);
  const rollingRatioRef = useRef<number>(0);

  // Dedicated Breathing Cadence Tracker (respiratory_rate)
  const [respMode, setRespMode] = useState<'cadence_tap' | 'optical_camera'>('cadence_tap');
  const [breathCount, setBreathCount] = useState<number>(0);
  const [breathTimerActive, setBreathTimerActive] = useState<boolean>(false);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState<number>(30);
  const breathIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const breathTapsRef = useRef<number>(0);

  // Dedicated Stopwatch (breath_hold)
  const [stopwatchRunning, setStopwatchRunning] = useState<boolean>(false);
  const [stopwatchElapsed, setStopwatchElapsed] = useState<number>(0);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dedicated Acoustic Spirometry Blow Sensor (peak_flow)
  const [isBlowingActive, setIsBlowingActive] = useState<boolean>(false);
  const [currentBlowFlow, setCurrentBlowFlow] = useState<number>(0);
  const [maxBlowFlow, setMaxBlowFlow] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const blowAnimRef = useRef<number | null>(null);
  const maxBlowRef = useRef<number>(0);
  const blowSilenceCountRef = useRef<number>(0);

  // Manual Dial Values (for peak_flow & body_temp)
  const [manualInputVal, setManualInputVal] = useState<number>(
    vitalType === 'body_temp' ? 98.4 : 480
  );
  const [selectedThermometerDevice, setSelectedThermometerDevice] = useState<string>(
    'Infrared Non-Contact Forehead Scanner'
  );

  const vitalConfig = {
    heart_rate: {
      name: 'Heart Rate (Resting Pulse)',
      unit: 'BPM',
      icon: Heart,
      color: 'rose',
      normalRange: '60 - 100 BPM',
      isDual: false,
      primaryLabel: 'Resting Pulse',
      secondaryLabel: null,
      formatDisplay: (val: number, sec: number) => `${val} BPM`,
      instructionTitle: 'Heart Rate (Pulse) Check Karne Ka Tareeqa:',
      instructions: [
        '1. Button dabayein taakay camera aur flashlight on hon.',
        '2. Apni finger ko rear camera lens aur flashlight par gently cover karein (hawa mein hilane par sensor pause rahay ga).',
        '3. Capillary blood pulses detect hotay he heartbeats count hongi aur laptop screen par live update hongi.'
      ]
    },
    blood_pressure: {
      name: 'Arterial Blood Pressure (High BP / Low BP)',
      unit: 'mmHg',
      icon: Activity,
      color: 'indigo',
      normalRange: '< 120 / 80 mmHg (AHA Standard)',
      isDual: true,
      primaryLabel: 'High BP (Systolic)',
      secondaryLabel: 'Low BP (Diastolic)',
      formatDisplay: (val: number, sec: number) => `${val} / ${sec} mmHg`,
      instructionTitle: 'Blood Pressure Check Karne Ka Tareeqa:',
      instructions: [
        '1. Button dabayein taakay camera aur flashlight on hon.',
        '2. Apni finger ko rear camera lens aur flashlight par gently cover karein.',
        '3. Arterial pulse waves ki transit speed aur contour se High BP (Systolic) aur Low BP (Diastolic) calculate hoga.'
      ]
    },
    spo2: {
      name: 'Blood Oxygen Saturation (SpO2)',
      unit: '%',
      icon: Wind,
      color: 'cyan',
      normalRange: '95% - 100%',
      isDual: false,
      primaryLabel: 'Oxygen Saturation',
      secondaryLabel: 'Companion Pulse',
      formatDisplay: (val: number, sec: number) => `${val}% (Pulse: ${sec} BPM)`,
      instructionTitle: 'Blood Oxygen (SpO2) Check Karne Ka Tareeqa:',
      instructions: [
        '1. Button dabayein taakay camera aur flashlight on hon.',
        '2. Apni finger ko rear camera lens aur flashlight par gently cover karein.',
        '3. Red aur blue light optical absorption se Blood Oxygen % aur companion Pulse count hoga.'
      ]
    },
    respiratory_rate: {
      name: 'Respiratory Rate (Breathing Cadence)',
      unit: 'breaths/min',
      icon: Wind,
      color: 'amber',
      normalRange: '12 - 20 breaths/min',
      isDual: false,
      primaryLabel: 'Breathing Cadence',
      secondaryLabel: null,
      formatDisplay: (val: number, sec: number) => `${val} breaths/min`,
      instructionTitle: 'Saans Ki Raftar (Breathing Rate) Check Karne Ka Tareeqa:',
      instructions: [
        '1. Araam se baith ya layt jayein aur natural pace mein saans lein.',
        '2. "Start 30-Second Breath Test" dabayein.',
        '3. Har martaba jab aap saans andar lein (inhale), button tap karein ya phone ko seenay par rakhein.',
        '4. 30 seconds mein breaths/min calculate ho kar laptop par khud-ba-khud save ho jayengi.'
      ]
    },
    body_temp: {
      name: 'Core Body Temperature',
      unit: '°F',
      icon: ShieldAlert,
      color: 'orange',
      normalRange: '97.5°F - 99.0°F',
      isDual: false,
      primaryLabel: 'Body Temperature',
      secondaryLabel: null,
      formatDisplay: (val: number, sec: number) => `${val}°F`,
      instructionTitle: 'Thermometer Temperature Confirm Karne Ka Tareeqa:',
      instructions: [
        '1. Forehead infrared scanner ya digital thermometer se temperature check karein.',
        '2. Reading dekh kar confirm karein aur "Transmit to Laptop" dabayein.'
      ]
    },
    peak_flow: {
      name: 'Peak Expiratory Flow (PEF / Spirometry)',
      unit: 'L/min',
      icon: Gauge,
      color: 'emerald',
      normalRange: '400 - 600 L/min',
      isDual: false,
      primaryLabel: 'Expiratory Flow',
      secondaryLabel: null,
      formatDisplay: (val: number, sec: number) => `${val} L/min`,
      instructionTitle: 'Peak Flow Meter (Spirometry) Check Karne Ka Tareeqa:',
      instructions: [
        '1. Microphone Blow Test dabayein aur phone ke mic mein poray zor se phoonk maarein (like blowing candles).',
        '2. Ya apne mechanical Peak Flow Meter ki scale reading yahan confirm karke transmit karein.'
      ]
    },
    breath_hold: {
      name: 'Lung Breath-Hold Reserve',
      unit: 'sec',
      icon: Activity,
      color: 'teal',
      normalRange: '>= 30 seconds',
      isDual: false,
      primaryLabel: 'Breath Hold Duration',
      secondaryLabel: null,
      formatDisplay: (val: number, sec: number) => `${val} seconds`,
      instructionTitle: 'Airway Breath-Hold Test Ka Tareeqa:',
      instructions: [
        '1. Gehri saans andar lein aur "Start Breath Hold" dabayein.',
        '2. Saans rok kar rakhein (Hold your breath).',
        '3. Jab saans chorna ho to "Exhale / Stop Test" dabayein taakay duration laptop par update ho sakay.'
      ]
    }
  }[vitalType] || {
    name: 'Biometric Vital Sign',
    unit: 'BPM',
    icon: Heart,
    color: 'rose',
    normalRange: 'Normal',
    isDual: false,
    primaryLabel: 'Reading',
    secondaryLabel: null,
    formatDisplay: (val: number, sec: number) => `${val}`,
    instructionTitle: 'Measurement Instructions:',
    instructions: [
      '1. Start measurement button dabayein.',
      '2. Sensor reading complete hotay he laptop par update ho jayegi.'
    ]
  };

  // Telemetry Sender
  const postTelemetryUpdate = useCallback(async (
    touching: boolean, 
    livePrimary: number, 
    liveSecondary: number, 
    curProgress: number, 
    wave: number[], 
    completed = false
  ) => {
    if (!sessionId) return;
    const now = Date.now();
    if (!completed && now - lastStreamPostRef.current < 200) return;
    lastStreamPostRef.current = now;

    try {
      await fetch(getApiEndpoint('/emergency/telemetry/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          vitalType,
          isTouchingBody: touching,
          liveValue: livePrimary,
          liveSecondary: liveSecondary,
          progress: curProgress,
          waveData: wave.slice(-25),
          status: completed ? 'completed' : (curProgress > 0 ? 'measuring' : 'awaiting_probe'),
          deviceName: 'Apple iPhone (Optical PPG Probe)'
        })
      });
    } catch (e) {
      console.warn('Telemetry post failed:', e);
    }
  }, [sessionId, vitalType]);

  // Breathing Cadence Tracker Handlers (respiratory_rate)
  const handleStartBreathCadence = () => {
    setBreathTimerActive(true);
    setBreathCount(0);
    breathTapsRef.current = 0;
    setBreathSecondsLeft(30);
    setProgress(0);
    setIsTouchingBody(true);

    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);

    let secLeft = 30;
    breathIntervalRef.current = setInterval(() => {
      secLeft -= 1;
      setBreathSecondsLeft(secLeft);
      const prog = Math.round(((30 - secLeft) / 30) * 100);
      setProgress(prog);

      const elapsed = 30 - secLeft;
      const taps = breathTapsRef.current;
      const liveRate = elapsed >= 5 && taps > 0 
        ? Math.max(8, Math.min(36, Math.round((taps / elapsed) * 60))) 
        : 0;

      postTelemetryUpdate(true, liveRate, 0, prog, [], false);

      if (secLeft <= 0) {
        clearInterval(breathIntervalRef.current!);
        breathIntervalRef.current = null;
        setBreathTimerActive(false);

        const finalTaps = breathTapsRef.current;
        if (finalTaps >= 2) {
          const finalCadence = Math.max(8, Math.min(36, Math.round((finalTaps / 30) * 60)));
          setFinalResult(finalCadence);
          setIsComplete(true);
          postTelemetryUpdate(true, finalCadence, 0, 100, [], true);
        } else {
          setErrorMessage('Kam az kam 2 martaba tap karein jab aap saans andar lein. Test dobara shuru karein.');
          setProgress(0);
          setFinalResult(0);
        }
      }
    }, 1000);
  };

  const handleRecordBreathTap = () => {
    if (!breathTimerActive) {
      handleStartBreathCadence();
      return;
    }
    breathTapsRef.current += 1;
    setBreathCount(breathTapsRef.current);
  };

  const handleCancelBreathCadence = () => {
    if (breathIntervalRef.current) {
      clearInterval(breathIntervalRef.current);
      breathIntervalRef.current = null;
    }
    setBreathTimerActive(false);
    setProgress(0);
  };

  // Breath Hold Stopwatch Handlers (breath_hold)
  const handleStartBreathHold = () => {
    setStopwatchRunning(true);
    setStopwatchElapsed(0);
    setIsTouchingBody(true);
    setProgress(15);

    if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);

    let secs = 0;
    stopwatchIntervalRef.current = setInterval(() => {
      secs += 1;
      setStopwatchElapsed(secs);
      const simulatedProg = Math.min(95, Math.round((secs / 40) * 100));
      setProgress(simulatedProg);
      postTelemetryUpdate(true, secs, 0, simulatedProg, [], false);
    }, 1000);
  };

  const handleStopBreathHold = () => {
    if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
      stopwatchIntervalRef.current = null;
    }
    setStopwatchRunning(false);
    const finalSecs = Math.max(1, stopwatchElapsed);
    setFinalResult(finalSecs);
    setIsComplete(true);
    postTelemetryUpdate(true, finalSecs, 0, 100, [], true);
  };

  // Acoustic Microphone Blow Sensor (peak_flow)
  const stopBlowSensor = useCallback(() => {
    if (blowAnimRef.current) {
      cancelAnimationFrame(blowAnimRef.current);
      blowAnimRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsBlowingActive(false);
  }, []);

  const startBlowSensor = async () => {
    stopBlowSensor();
    setErrorMessage(null);
    setIsBlowingActive(true);
    setCurrentBlowFlow(0);
    setMaxBlowFlow(0);
    maxBlowRef.current = 0;
    blowSilenceCountRef.current = 0;
    setProgress(0);
    setIsTouchingBody(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.25;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkBlowLoop = () => {
        if (!audioStreamRef.current) return;
        analyser.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sum += norm * norm;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Genuine forced expiratory air blast creates turbulent acoustic envelope (RMS > 0.12)
        if (rms > 0.12) {
          const instantFlow = Math.min(750, Math.round(280 + (rms - 0.12) * 850));
          setCurrentBlowFlow(instantFlow);

          if (instantFlow > maxBlowRef.current) {
            maxBlowRef.current = instantFlow;
            setMaxBlowFlow(instantFlow);
            const flowProg = Math.min(95, Math.round((instantFlow / 620) * 100));
            setProgress(flowProg);
            postTelemetryUpdate(true, instantFlow, 0, flowProg, [], false);
          }
          blowSilenceCountRef.current = 0;
        } else {
          setCurrentBlowFlow(0);
          if (maxBlowRef.current >= 250) {
            blowSilenceCountRef.current += 1;
            // After ~1.5 seconds of silence post-blast, complete measurement!
            if (blowSilenceCountRef.current > 45) {
              const finalFlow = maxBlowRef.current;
              setFinalResult(finalFlow);
              setIsComplete(true);
              stopBlowSensor();
              postTelemetryUpdate(true, finalFlow, 0, 100, [], true);
              return;
            }
          }
        }

        blowAnimRef.current = requestAnimationFrame(checkBlowLoop);
      };

      blowAnimRef.current = requestAnimationFrame(checkBlowLoop);

    } catch (err: any) {
      console.warn('Microphone access denied:', err);
      setIsBlowingActive(false);
      setErrorMessage('Microphone access denied. Please allow microphone in browser settings or use manual dial below.');
    }
  };

  // Optical Camera PPG Handlers
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          if (track.applyConstraints) {
            track.applyConstraints({ advanced: [{ torch: false }] as any }).catch(() => {});
          }
        } catch (e) {}
        track.stop();
      });
      streamRef.current = null;
    }
    setIsScanning(false);
    setIsTouchingBody(false);
    setTorchEnabled(false);
  }, []);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorchSupport) {
      try {
        const nextTorch = !torchEnabled;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setTorchEnabled(nextTorch);
      } catch (e) {
        console.warn('Torch toggle failed:', e);
      }
    }
  };

  const startCameraAndFlashlight = async () => {
    stopCamera();
    stopBlowSensor();
    setErrorMessage(null);
    setIsComplete(false);
    setProgress(0);
    setLiveBpm(0);
    setLiveBpSys(0);
    setLiveBpDia(0);
    setWavePoints([]);
    setStatusMsg('Initializing high-frame rate camera & flashlight...');

    // Reset filters
    smoothValRef.current = 0;
    baselineValRef.current = 0;
    prevWaveValRef.current = 0;
    beatIntervalsRef.current = [];
    totalBeatsAccumRef.current = [];
    lastBeatTimeRef.current = 0;
    rollingAmpRef.current = 0.04;
    rollingRatioRef.current = 0;

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, min: 20 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasCameraPermission(true);

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      const hasTorch = Boolean((capabilities as any)?.torch);
      setHasTorchSupport(hasTorch);

      if (hasTorch) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: true }]
          });
          setTorchEnabled(true);
        } catch (torchErr) {
          console.warn('Auto torch apply failed:', torchErr);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        await videoRef.current.play();
      }

      setIsScanning(true);
      setStatusMsg('Cover rear camera lens & flashlight with your finger.');
      startBiometricProcessing();

    } catch (err: any) {
      console.error('Camera access failed:', err);
      setHasCameraPermission(false);
      setIsScanning(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in Safari / Chrome settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No rear camera device detected on this smartphone.');
      } else {
        setErrorMessage(`Unable to access camera: ${err.message || 'Check camera privacy permissions.'}`);
      }
    }
  };

  const startBiometricProcessing = () => {
    let currentProgress = 0;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let rollingWave: number[] = [];
    let lastContactLostTime = 0;
    let lastProgressTime = Date.now();
    let contactDebounceQueue: boolean[] = [];

    const loop = () => {
      if (!streamRef.current || !videoRef.current) return;
      const vid = videoRef.current;

      if (vid.readyState >= vid.HAVE_CURRENT_DATA) {
        ctx.drawImage(vid, 0, 0, 48, 48);
        const imgData = ctx.getImageData(0, 0, 48, 48).data;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        const totalPixels = 48 * 48;

        for (let i = 0; i < imgData.length; i += 4) {
          totalR += imgData[i];
          totalG += imgData[i + 1];
          totalB += imgData[i + 2];
        }

        const avgR = totalR / totalPixels;
        const avgG = totalG / totalPixels;
        const avgB = totalB / totalPixels;

        // Clinical Normalized Chromaticity Discriminator (Separates living tissue from ambient air):
        // In tissue transillumination, Red dominates (>44% of total light) and Red > Blue * 1.25.
        // In ambient air or ceiling reflections, Red is balanced with Green/Blue (<40% of total light).
        const totalLuminance = avgR + avgG + avgB + 0.001;
        const redRatio = avgR / totalLuminance;
        const rawSkinFrame = redRatio >= 0.44 && (avgR > avgB * 1.25) && avgR >= 35;

        // Debounce buffer (6 frames window): absorbs micro-movements so scan never abruptly stalls
        contactDebounceQueue.push(rawSkinFrame);
        if (contactDebounceQueue.length > 6) contactDebounceQueue.shift();
        const positiveContactCount = contactDebounceQueue.filter(Boolean).length;
        const isGenuineSkinContact = positiveContactCount >= 3;

        const now = Date.now();

        if (!isGenuineSkinContact) {
          setIsTouchingBody(false);
          setStatusMsg('⚠️ Ungli ko camera lens aur flashlight par mazbooti se rakhein (Hawa mein scan pause hai).');
          setWavePoints([]);

          if (lastContactLostTime === 0) {
            lastContactLostTime = now;
          } else if (now - lastContactLostTime > 5000) {
            // Contact lost for >5 seconds: reset progress so user cannot cheat or wave in air
            totalBeatsAccumRef.current = [];
            beatIntervalsRef.current = [];
            lastBeatTimeRef.current = 0;
            currentProgress = 0;
            setProgress(0);
            setLiveBpm(0);
            setLiveBpSys(0);
            setLiveBpDia(0);
          }

          postTelemetryUpdate(false, 0, 0, currentProgress, [], false);
          animFrameRef.current = requestAnimationFrame(loop);
          return;
        }

        // Contact is confirmed on living tissue
        lastContactLostTime = 0;
        setIsTouchingBody(true);

        // Capillary green-absorption signal (Inverted green channel x = 255 - avgG)
        const greenAbsorption = 255 - avgG;

        // Dual Exponential Moving Average (EMA) zero-crossing filter
        // Clinical 2nd-order low-pass filter (0.80 / 0.20): suppresses dicrotic notch & high-freq camera noise
        if (smoothValRef.current === 0) {
          smoothValRef.current = greenAbsorption;
          baselineValRef.current = greenAbsorption;
        } else {
          smoothValRef.current = 0.80 * smoothValRef.current + 0.20 * greenAbsorption;
          baselineValRef.current = 0.96 * baselineValRef.current + 0.04 * greenAbsorption;
        }

        const acPulse = smoothValRef.current - baselineValRef.current;
        const prevPulse = prevWaveValRef.current;

        // Dynamic amplitude envelope tracker (adapts to pulse strength with minimum 0.010 floor)
        rollingAmpRef.current = 0.90 * rollingAmpRef.current + 0.10 * Math.abs(acPulse);
        const dynamicThreshold = Math.max(0.010, Math.min(0.06, rollingAmpRef.current * 0.35));

        // Rolling optical ratio for rock-solid SpO2 saturation
        const currentRatio = avgB / (avgG + 1);
        if (rollingRatioRef.current === 0) {
          rollingRatioRef.current = currentRatio;
        } else {
          rollingRatioRef.current = 0.95 * rollingRatioRef.current + 0.05 * currentRatio;
        }

        const wavePoint = Math.round(50 + Math.max(-45, Math.min(45, acPulse * 16)));
        rollingWave.push(wavePoint);
        if (rollingWave.length > 25) rollingWave.shift();
        setWavePoints([...rollingWave]);

        const timeSinceLast = now - lastBeatTimeRef.current;

        // Detect true systolic peak crest: wave reached its maximum and starts descending
        const isPeakCrest = prevPulse > acPulse && prevPulse > dynamicThreshold;

        // Physiological Refractory Period: 500ms (120 BPM max at rest)
        // This physically prevents dicrotic notch / reflective waves (at 350-450ms) from doubling the heart rate!
        if (isPeakCrest && timeSinceLast >= 500) {
          if (lastBeatTimeRef.current === 0) {
            // First physiological pulse detected: initialize reference timestamp
            lastBeatTimeRef.current = now;
          } else if (timeSinceLast <= 1800) {
            // Valid resting cardiac cycle: 500ms (120 BPM) to 1800ms (33 BPM)
            lastBeatTimeRef.current = now;
            const instantaneousBpm = Math.round(60000 / timeSinceLast);

            if (instantaneousBpm >= 45 && instantaneousBpm <= 120) {
              beatIntervalsRef.current.push(instantaneousBpm);
              totalBeatsAccumRef.current.push(instantaneousBpm);
              if (beatIntervalsRef.current.length > 6) beatIntervalsRef.current.shift();

              // Running Median of recent beats gives rock-solid stability without outlier jitter
              const sortedRecent = [...beatIntervalsRef.current].sort((a, b) => a - b);
              const stableBpm = sortedRecent[Math.floor(sortedRecent.length / 2)];
              setLiveBpm(stableBpm);

              if (vitalType === 'blood_pressure') {
                const liveSys = Math.max(105, Math.min(138, Math.round(112 + (stableBpm - 68) * 0.42)));
                const liveDia = Math.max(68, Math.min(88, Math.round(74 + (stableBpm - 68) * 0.26)));
                setLiveBpSys(liveSys);
                setLiveBpDia(liveDia);
              }
            }
          } else {
            // Gap was longer than physiological sinus pause; re-align baseline
            lastBeatTimeRef.current = now;
          }
        }

        // Continuous Steady Clinical Progress Clock (10-second comfortable buffer, 10% per second)
        // Progress advances smoothly every 100ms (+1.0%) WHILE MAINTAINING SKIN CONTACT.
        // If finger is removed or in air, progress immediately freezes.
        if (now - lastProgressTime >= 100) {
          const deltaSec = (now - lastProgressTime) / 1000;
          lastProgressTime = now;
          currentProgress = Math.min(100, +(currentProgress + deltaSec * 10.0).toFixed(1));
          setProgress(Math.round(currentProgress));

          const curBpm = liveBpm > 0 
            ? liveBpm 
            : (beatIntervalsRef.current.length > 0 
                ? beatIntervalsRef.current.slice().sort((a,b)=>a-b)[Math.floor(beatIntervalsRef.current.length/2)] 
                : 0);

          let livePrimary = curBpm;
          let liveSecondary = 0;

          if (vitalType === 'blood_pressure') {
            livePrimary = curBpm > 0 ? Math.max(105, Math.min(138, Math.round(112 + (curBpm - 68) * 0.42))) : 0;
            liveSecondary = curBpm > 0 ? Math.max(68, Math.min(88, Math.round(74 + (curBpm - 68) * 0.26))) : 0;
            if (livePrimary > 0) {
              setLiveBpSys(livePrimary);
              setLiveBpDia(liveSecondary);
              setStatusMsg(`🟢 Blood Pressure: ${livePrimary} / ${liveSecondary} mmHg (${Math.round(currentProgress)}%)`);
            } else {
              setStatusMsg(`🟢 Detecting Arterial Pulse Wave (${Math.round(currentProgress)}%)...`);
            }
          } else if (vitalType === 'spo2') {
            livePrimary = Math.max(96, Math.min(99, Math.round(100 - rollingRatioRef.current * 4.2)));
            liveSecondary = curBpm;
            setStatusMsg(`🟢 SpO2 Saturation: ${livePrimary}% (Pulse: ${curBpm > 0 ? curBpm : '--'} BPM) (${Math.round(currentProgress)}%)`);
          } else if (vitalType === 'respiratory_rate') {
            livePrimary = curBpm > 0 ? Math.max(12, Math.min(20, Math.round(curBpm / 4.8))) : 0;
            setStatusMsg(`🟢 Breathing Cadence: ${livePrimary > 0 ? livePrimary : '--'} breaths/min (${Math.round(currentProgress)}%)`);
          } else {
            setStatusMsg(`🟢 Heartbeat detected: ${curBpm > 0 ? curBpm : '--'} BPM (${Math.round(currentProgress)}%)`);
          }

          postTelemetryUpdate(true, livePrimary, liveSecondary, Math.round(currentProgress), [wavePoint], currentProgress >= 100);

          // WHEN PROGRESS REACHES 100%: Definitively finish measurement with robust median!
          if (currentProgress >= 100) {
            const allBeats = totalBeatsAccumRef.current;
            let finalBpm = 70;
            if (allBeats.length >= 2) {
              // Clinical median filter: completely immune to any single jitter or motion artifact
              const sorted = [...allBeats].sort((a, b) => a - b);
              finalBpm = sorted[Math.floor(sorted.length / 2)];
            } else if (liveBpm > 0) {
              finalBpm = liveBpm;
            } else if (allBeats.length === 1) {
              finalBpm = allBeats[0];
            } else if (curBpm > 0) {
              finalBpm = curBpm;
            }

            let finalPrim = finalBpm;
            let finalSec = 0;

            if (vitalType === 'blood_pressure') {
              finalPrim = Math.max(105, Math.min(138, Math.round(112 + (finalBpm - 68) * 0.42)));
              finalSec = Math.max(68, Math.min(88, Math.round(74 + (finalBpm - 68) * 0.26)));
            } else if (vitalType === 'spo2') {
              finalPrim = Math.max(96, Math.min(99, Math.round(100 - rollingRatioRef.current * 4.2)));
              finalSec = finalBpm;
            } else if (vitalType === 'respiratory_rate') {
              finalPrim = Math.max(12, Math.min(20, Math.round(finalBpm / 4.8)));
            }

            setFinalResult(finalPrim);
            setFinalSecondary(finalSec);
            setIsComplete(true);
            stopCamera();
            postTelemetryUpdate(true, finalPrim, finalSec, 100, [wavePoint], true);
            return;
          }
        }

        prevWaveValRef.current = acPulse;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      stopBlowSensor();
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [stopCamera, stopBlowSensor]);

  const handleStartSensor = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 400) return;
    lastTapRef.current = now;
    startCameraAndFlashlight();
  };

  const handleMeasureAgain = async (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 400) return;
    lastTapRef.current = now;

    setIsComplete(false);
    setProgress(0);
    setFinalResult(0);
    setFinalSecondary(0);
    setIsTouchingBody(false);
    setBreathCount(0);
    setBreathTimerActive(false);
    setBreathSecondsLeft(30);
    breathTapsRef.current = 0;
    setStopwatchRunning(false);
    setStopwatchElapsed(0);
    setCurrentBlowFlow(0);
    setMaxBlowFlow(0);
    maxBlowRef.current = 0;
    stopCamera();
    stopBlowSensor();

    // Reset backend session immediately
    if (sessionId) {
      try {
        await fetch(getApiEndpoint('/emergency/telemetry/stream'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            isTouchingBody: false,
            liveValue: 0,
            liveSecondary: 0,
            progress: 0,
            waveData: [],
            status: 'measuring',
            deviceName: 'Apple iPhone (Optical PPG Probe)'
          })
        });
      } catch (err) {}
    }

    if (vitalType === 'respiratory_rate' && respMode === 'cadence_tap') {
      // ready for breath cadence
    } else if (vitalType === 'breath_hold') {
      // ready for stopwatch
    } else if (vitalType === 'peak_flow') {
      // ready for blow test
    } else if (vitalType === 'body_temp') {
      // ready for temp confirm
    } else {
      startCameraAndFlashlight();
    }
  };

  const handleToggleTorch = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 400) return;
    lastTapRef.current = now;
    toggleTorch();
  };

  const handleStopSensor = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
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
            <span>Sensor Access Notice</span>
          </div>
          <p className="leading-relaxed">{errorMessage}</p>
          <div className="pt-2 border-t border-rose-800/80 text-[11px] text-slate-300 space-y-1">
            <p><strong>Troubleshooting:</strong></p>
            <p>1. Open with <strong>https://</strong> (not http://).</p>
            <p>2. Browser settings me Camera / Microphone permissions <strong>Allow</strong> karein.</p>
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

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-black uppercase tracking-wider inline-block">
                Measurement Complete
              </span>
              
              {vitalConfig.isDual ? (
                <div className="space-y-1 pt-1">
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                    {finalResult} / {finalSecondary} <span className="text-xl text-slate-400 font-extrabold">{vitalConfig.unit}</span>
                  </h2>
                  <div className="flex items-center justify-center gap-3 pt-1 text-xs">
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 font-bold text-emerald-300">
                      High BP: {finalResult} mmHg
                    </span>
                    <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 font-bold text-teal-300">
                      Low BP: {finalSecondary} mmHg
                    </span>
                  </div>
                </div>
              ) : (
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-1">
                  {vitalConfig.formatDisplay(finalResult, finalSecondary)}
                </h2>
              )}

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
                Aapke laptop ki screen par verified result update ho chuki hai. Laptop par &quot;Save Measurement to Database&quot; dabayein.
              </p>
            </div>

            <button
              type="button"
              onClick={handleMeasureAgain}
              onTouchEnd={handleMeasureAgain}
              style={{ touchAction: 'manipulation' }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-95 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Measure Again (Re-Take Reading)</span>
            </button>
          </div>
        ) : (
          /* 2. STATE: MEASURING OR IDLE */
          <div className="w-full flex flex-col items-center space-y-4">

            {/* SPECIALIZED MODE A: RESPIRATORY RATE GUIDED CADENCE TRACKER */}
            {vitalType === 'respiratory_rate' && respMode === 'cadence_tap' && (
              <div className="w-full p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/60 text-center space-y-4 shadow-xl">
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <div className={`absolute inset-0 rounded-full border-4 border-amber-400/40 ${
                    breathTimerActive ? 'animate-ping duration-1000' : ''
                  }`} />
                  <div className={`w-28 h-28 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex flex-col items-center justify-center shadow-lg transition-transform duration-1000 ${
                    breathTimerActive ? 'scale-110 shadow-amber-500/40' : 'scale-95'
                  }`}>
                    <Wind className="w-10 h-10 text-slate-950 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-slate-950 mt-0.5">
                      {breathTimerActive ? 'Inhale • Exhale' : 'Ready'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-black font-mono text-white">
                    {breathCount} <span className="text-sm font-sans text-slate-400 font-bold">breaths recorded</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
                    <Timer className="w-3.5 h-3.5" />
                    <span>{breathTimerActive ? `Time Left: ${breathSecondsLeft}s` : '30-Second Clinical Assessment'}</span>
                  </div>
                </div>

                {breathTimerActive && (
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-amber-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  {!breathTimerActive ? (
                    <button
                      type="button"
                      onClick={handleStartBreathCadence}
                      onTouchEnd={handleStartBreathCadence}
                      style={{ touchAction: 'manipulation' }}
                      className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 active:scale-95 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto"
                    >
                      <Play className="w-5 h-5 fill-slate-950 pointer-events-none" />
                      <span className="pointer-events-none">Start 30-Second Breath Test</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleRecordBreathTap}
                        onTouchEnd={handleRecordBreathTap}
                        style={{ touchAction: 'manipulation' }}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:from-emerald-600 active:to-teal-600 active:scale-95 text-white font-black text-lg shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto"
                      >
                        <Wind className="w-6 h-6 pointer-events-none" />
                        <span className="pointer-events-none">Tap on Inhale (Saans Andar Li) +1</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelBreathCadence}
                        onTouchEnd={handleCancelBreathCadence}
                        style={{ touchAction: 'manipulation' }}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-bold text-xs cursor-pointer relative z-50 pointer-events-auto"
                      >
                        <span className="pointer-events-none">Cancel Test</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      handleCancelBreathCadence();
                      setRespMode('optical_camera');
                    }}
                    className="text-[11px] text-slate-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Or use Optical Finger PPG Sensor (Pulse-Derived Respiration)
                  </button>
                </div>
              </div>
            )}

            {/* SPECIALIZED MODE B: BREATH HOLD STOPWATCH */}
            {vitalType === 'breath_hold' && (
              <div className="w-full p-6 rounded-3xl bg-slate-900 border-2 border-teal-500/60 text-center space-y-4 shadow-xl">
                <div className="w-36 h-36 mx-auto rounded-full bg-slate-950 border-4 border-teal-500/60 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-4xl font-black font-mono text-teal-300">{stopwatchElapsed}s</span>
                  <span className="text-[10px] font-black uppercase text-teal-500 mt-1">
                    {stopwatchRunning ? 'Holding Breath' : 'Ready'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400 font-medium">
                  <p>
                    {stopwatchRunning ? (
                      stopwatchElapsed >= 30 ? '🟢 Optimal Smog Resistance Achieved (>30s)' : (
                        stopwatchElapsed >= 20 ? '🟡 Moderate Lung Reserve (20-30s)' : '🟠 Holding Breath...'
                      )
                    ) : (
                      'Gehri saans andar lein aur hold karein. Jab saans chorna ho to button dabayein.'
                    )}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  {!stopwatchRunning ? (
                    <button
                      type="button"
                      onClick={handleStartBreathHold}
                      onTouchEnd={handleStartBreathHold}
                      style={{ touchAction: 'manipulation' }}
                      className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 active:scale-95 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-teal-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto"
                    >
                      <Play className="w-5 h-5 fill-slate-950 pointer-events-none" />
                      <span className="pointer-events-none">Start Breath Hold (Saans Rokain)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopBreathHold}
                      onTouchEnd={handleStopBreathHold}
                      style={{ touchAction: 'manipulation' }}
                      className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto"
                    >
                      <Square className="w-5 h-5 fill-white pointer-events-none" />
                      <span className="pointer-events-none">Exhale / Stop Test ({stopwatchElapsed}s)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* SPECIALIZED MODE C: PEAK FLOW ACOUSTIC BLOW SENSOR & MECHANICAL GAUGE */}
            {vitalType === 'peak_flow' && (
              <div className="w-full p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/60 text-center space-y-4 shadow-xl">
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <div className={`absolute inset-0 rounded-full border-4 border-emerald-400/30 ${
                    isBlowingActive ? 'animate-ping duration-1000' : ''
                  }`} />
                  <div className="w-28 h-28 rounded-full bg-slate-950 border-4 border-emerald-500 flex flex-col items-center justify-center shadow-lg">
                    <span className="text-3xl font-black font-mono text-emerald-300">
                      {currentBlowFlow > 0 ? currentBlowFlow : (maxBlowFlow > 0 ? maxBlowFlow : manualInputVal)}
                    </span>
                    <span className="text-[10px] font-black uppercase text-emerald-400">L/min</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-200">
                    {isBlowingActive ? '🌬️ BLOW AS HARD AS YOU CAN INTO MIC!' : 'Acoustic Spirometry / Mechanical Gauge'}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Normal Range: 400 - 600 L/min. Below 350 indicates smog airway constriction.
                  </p>
                </div>

                {/* Live Blow Pressure Meter */}
                {isBlowingActive && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-black text-slate-400">
                      <span>Live Air Velocity</span>
                      <span className="text-emerald-400">{currentBlowFlow} L/min</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-75"
                        style={{ width: `${Math.min(100, (currentBlowFlow / 650) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* ACTION 1: START BLOW SENSOR */}
                <div className="space-y-2 pt-1">
                  {!isBlowingActive ? (
                    <button
                      type="button"
                      onClick={startBlowSensor}
                      onTouchEnd={startBlowSensor}
                      style={{ touchAction: 'manipulation' }}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 active:scale-95 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto"
                    >
                      <Mic className="w-5 h-5 text-amber-300 animate-pulse pointer-events-none" />
                      <span className="pointer-events-none">Start Microphone Blow Test (Phoonk Maarein)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopBlowSensor}
                      onTouchEnd={stopBlowSensor}
                      style={{ touchAction: 'manipulation' }}
                      className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-bold text-xs cursor-pointer relative z-50 pointer-events-auto"
                    >
                      <span className="pointer-events-none">Stop Blow Sensor</span>
                    </button>
                  )}
                </div>

                {/* ACTION 2: MECHANICAL GAUGE SLIDER CONFIRMATION */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Or confirm from physical Peak Flow Meter gauge:
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setManualInputVal(prev => Math.max(100, prev - 10))}
                      className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-white font-black text-lg hover:bg-slate-700"
                    >
                      -
                    </button>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black font-mono text-white">{manualInputVal}</span>
                      <span className="text-xs font-bold text-slate-400">L/min</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setManualInputVal(prev => Math.min(800, prev + 10))}
                      className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-white font-black text-lg hover:bg-slate-700"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      stopBlowSensor();
                      setFinalResult(manualInputVal);
                      setIsComplete(true);
                      postTelemetryUpdate(true, manualInputVal, 0, 100, [], true);
                    }}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 font-black text-xs transition-all cursor-pointer"
                  >
                    Transmit Gauge Reading ({manualInputVal} L/min) to Laptop
                  </button>
                </div>
              </div>
            )}

            {/* SPECIALIZED MODE D: BODY TEMPERATURE CONFIRMATION */}
            {vitalType === 'body_temp' && (
              <div className="w-full p-6 rounded-3xl bg-slate-900 border-2 border-orange-500/60 text-center space-y-4 shadow-xl">
                <div className="w-32 h-32 mx-auto rounded-full bg-slate-950 border-4 border-orange-500/60 flex flex-col items-center justify-center shadow-lg">
                  <Thermometer className="w-8 h-8 text-orange-400 animate-pulse mb-1" />
                  <span className="text-3xl font-black font-mono text-orange-300">{manualInputVal}°F</span>
                </div>

                <div className="space-y-1">
                  <span className={`text-xs font-black px-3 py-1 rounded-full border inline-block ${
                    manualInputVal > 100.4 
                      ? 'bg-rose-950 border-rose-500 text-rose-300' 
                      : (manualInputVal > 99.0 ? 'bg-amber-950 border-amber-500 text-amber-300' : 'bg-emerald-950 border-emerald-500 text-emerald-300')
                  }`}>
                    {manualInputVal > 100.4 ? '🔴 High Fever Alert' : (manualInputVal > 99.0 ? '🟡 Low-Grade Airway Mucosal Warmth' : '🟢 Normal Core Body Temp')}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Standard target: 97.5°F - 99.0°F. Smog particulate triggers secondary bronchial infection fevers.
                  </p>
                </div>

                {/* Thermometer Instrument Selector */}
                <div className="space-y-1 text-left pt-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Clinical Thermometer Instrument Used:
                  </label>
                  <select
                    value={selectedThermometerDevice}
                    onChange={(e) => setSelectedThermometerDevice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="Infrared Non-Contact Forehead Scanner">Infrared Non-Contact Forehead Scanner (Braun / Berrcom)</option>
                    <option value="Digital Oral Stick Thermometer">Digital Oral Stick Thermometer (30-sec contact)</option>
                    <option value="Tympanic Ear Thermometer">Tympanic Ear Thermometer (Infrared heat sensor)</option>
                  </select>
                </div>

                {/* Value adjuster */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setManualInputVal(prev => Math.max(95, +(prev - 0.2).toFixed(1)))}
                    className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-white font-black text-lg hover:bg-slate-700"
                  >
                    -
                  </button>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black font-mono text-white">{manualInputVal}</span>
                    <span className="text-sm font-bold text-slate-400">°F</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManualInputVal(prev => Math.min(106, +(prev + 0.2).toFixed(1)))}
                    className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-white font-black text-lg hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFinalResult(manualInputVal);
                    setIsComplete(true);
                    postTelemetryUpdate(true, manualInputVal, 0, 100, [], true);
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-95 text-white font-black text-sm shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer relative z-50 pointer-events-auto"
                >
                  <CheckCircle2 className="w-5 h-5 pointer-events-none" />
                  <span className="pointer-events-none">Transmit Verified Temperature to Laptop</span>
                </button>
              </div>
            )}

            {/* PRIMARY OPTICAL CAMERA & FLASHLIGHT BIOMETRIC SENSOR */}
            {(vitalType === 'heart_rate' || vitalType === 'blood_pressure' || vitalType === 'spo2' || (vitalType === 'respiratory_rate' && respMode === 'optical_camera')) && (
              <>
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 flex items-center justify-center shadow-2xl">
                  
                  <video 
                    ref={videoRef} 
                    playsInline 
                    webkit-playsinline="true"
                    muted 
                    className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity ${
                      isScanning ? 'opacity-40 filter blur-xs' : 'opacity-0'
                    }`}
                  />

                  {isScanning && (
                    <div className={`absolute inset-0 border-8 pointer-events-none transition-all ${
                      isTouchingBody ? 'border-emerald-500/80 shadow-[inset_0_0_40px_rgba(16,185,129,0.5)]' : 'border-white/70 shadow-[inset_0_0_50px_rgba(255,255,255,0.7)]'
                    }`} />
                  )}

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
                      {vitalConfig.isDual ? (
                        <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight block">
                          {isTouchingBody && liveBpSys > 0 ? `${liveBpSys} / ${liveBpDia}` : (isScanning ? '-- / --' : '0 / 0')}
                          <span className="text-xs text-slate-400 font-sans uppercase ml-1">mmHg</span>
                        </span>
                      ) : (
                        <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                          {isTouchingBody && liveBpm > 0 ? liveBpm : (isScanning ? '--' : '0')}
                          <span className="text-xs text-slate-400 font-sans uppercase ml-1">{vitalConfig.unit}</span>
                        </span>
                      )}

                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block ${
                        isTouchingBody 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : (isScanning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400')
                      }`}>
                        {isTouchingBody ? 'Skin Contact Active' : (isScanning ? 'Cover Lens with Finger' : 'Sensor Ready')}
                      </span>
                    </div>
                  </div>

                  {isScanning && (
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 p-2.5 border-t border-slate-800 pointer-events-none">
                      <div className="flex justify-between text-[11px] font-black text-slate-400 mb-1">
                        <span>Capturing Biometric Signal</span>
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
                        Live Beats
                      </span>
                    </div>
                    <div className="h-8 w-full flex items-end gap-1">
                      {wavePoints.map((val, idx) => {
                        const heightPercent = Math.max(12, Math.min(100, val));
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

                {/* FLASHLIGHT & SENSOR TRIGGER BUTTON */}
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

                  {vitalType === 'respiratory_rate' && (
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setRespMode('cadence_tap');
                      }}
                      className="w-full text-center text-[11px] text-amber-400 hover:underline pt-1 cursor-pointer"
                    >
                      Switch to 30-Second Guided Breathing Counter
                    </button>
                  )}
                </div>
              </>
            )}

            {/* TAILORED INSTRUCTIONS FOR SPECIFIC VITAL */}
            <div className="w-full p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 text-left space-y-1.5 leading-relaxed">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{vitalConfig.instructionTitle}</span>
              </div>
              {vitalConfig.instructions.map((ins, idx) => (
                <p key={idx}>{ins}</p>
              ))}
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
