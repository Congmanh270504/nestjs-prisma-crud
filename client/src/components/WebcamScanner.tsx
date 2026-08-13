import { useRef, useEffect, useCallback, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "@vladmandic/face-api";
import { identifyFace, type IdentifyResponse } from "../api/faceApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const MODEL_URL = "/models";

interface Props {
  onRegisterClick: () => void;
}

export default function WebcamScanner({ onRegisterClick }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [result, setResult] = useState<IdentifyResponse | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const autoModeRef = useRef(false);
  const identifyingRef = useRef(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      } catch {
        console.warn("face-api models not found at /public/models — bounding box disabled");
      } finally {
        setModelsLoaded(true);
      }
    };
    loadModels();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;
    intervalRef.current = setInterval(async () => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) return;

      const { videoWidth: w, videoHeight: h } = video;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
          .withFaceLandmarks();

        const hasFace = detections.length > 0;
        setFaceDetected(hasFace);

        detections.forEach(({ detection }) => {
          const { x, y, width, height } = detection.box;
          const color = autoModeRef.current ? "#10b981" : "#6366f1";
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x, y, width, height);
          const cs = 16;
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 3;
          [[x, y], [x + width, y], [x, y + height], [x + width, y + height]].forEach(([cx, cy]) => {
            const dx = cx === x ? 1 : -1;
            const dy = cy === y ? 1 : -1;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * cs, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + dy * cs); ctx.stroke();
          });
        });

        if (autoModeRef.current && hasFace && !identifyingRef.current) {
          doIdentify();
        }
      } catch { /* model not loaded */ }
    }, 200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [modelsLoaded]);

  const captureBlob = useCallback(async (): Promise<Blob | null> => {
    const src = webcamRef.current?.getScreenshot();
    if (!src) return null;
    const res = await fetch(src);
    return res.blob();
  }, []);

  const doIdentify = useCallback(async () => {
    if (identifyingRef.current) return;
    identifyingRef.current = true;
    setIsIdentifying(true);
    setResult(null);
    try {
      const blob = await captureBlob();
      if (!blob) throw new Error("Không chụp được ảnh");
      const data = await identifyFace(blob);
      setResult(data);
    } catch (err: any) {
      setResult({ match: false, message: err?.response?.data?.message ?? "Lỗi kết nối server" });
    } finally {
      identifyingRef.current = false;
      setIsIdentifying(false);
    }
  }, [captureBlob]);

  const toggleAuto = () => {
    const next = !autoMode;
    setAutoMode(next);
    autoModeRef.current = next;
    if (!next) setResult(null);
  };

  return (
    <div className="grid-2">
      {/* Camera card */}
      <Card className="bg-[var(--bg-card)] border-[var(--border)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-[var(--text-primary)]">📷 Camera nhận diện</CardTitle>
            <Badge
              variant={faceDetected ? "default" : "secondary"}
              className={faceDetected
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-zinc-800 text-zinc-400"}
            >
              {modelsLoaded
                ? (faceDetected ? "✓ Phát hiện mặt" : "Chưa thấy mặt")
                : "⏳ Đang tải..."}
            </Badge>
          </div>
          <CardDescription className="text-[var(--text-secondary)]">
            Đưa khuôn mặt vào khung hình, sau đó bấm nhận diện
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="webcam-wrapper rounded-xl">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.9}
              videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              mirrored
            />
            <canvas
              ref={canvasRef}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={doIdentify}
              disabled={isIdentifying || !modelsLoaded}
            >
              {isIdentifying ? <><span className="spinner mr-2" />Đang nhận diện...</> : "🔍 Nhận diện ngay"}
            </Button>
            <Button
              variant={autoMode ? "default" : "outline"}
              onClick={toggleAuto}
              className={autoMode
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}
            >
              {autoMode ? "🟢 Auto" : "⏸ Auto"}
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            onClick={onRegisterClick}
          >
            ➕ Đăng ký khuôn mặt mới
          </Button>
        </CardContent>
      </Card>

      {/* Result card */}
      <Card className="bg-[var(--bg-card)] border-[var(--border)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[var(--text-primary)]">🎯 Kết quả nhận diện</CardTitle>
          <CardDescription className="text-[var(--text-secondary)]">
            Hệ thống trả về người khớp nhất trong database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Loading */}
          {isIdentifying && (
            <div className="flex flex-col items-center gap-3 py-10">
              <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              <p className="text-sm text-[var(--text-secondary)]">Đang phân tích khuôn mặt...</p>
            </div>
          )}

          {/* Empty */}
          {!isIdentifying && result === null && (
            <div className="result-panel idle">
              <div className="result-icon" style={{ background: "rgba(255,255,255,0.05)", fontSize: 22 }}>🤖</div>
              <div className="result-info">
                <h3 className="text-[var(--text-secondary)]">Chưa có kết quả</h3>
                <p>Bấm "Nhận diện ngay" hoặc bật Auto Mode</p>
              </div>
            </div>
          )}

          {/* Result */}
          {!isIdentifying && result !== null && (
            <>
              <div className={`result-panel ${result.match ? "success" : "error"}`}>
                <div className={`result-icon ${result.match ? "success" : "error"}`}>
                  {result.match ? "✅" : "❌"}
                </div>
                <div className="result-info">
                  <h3 style={{ color: result.match ? "var(--success)" : "var(--error)" }}>
                    {result.match ? result.user?.name : "Không nhận diện được"}
                  </h3>
                  <p>
                    {result.match
                      ? `ID: ${result.user?.id?.slice(0, 8)}...`
                      : (result.message || "Khuôn mặt chưa có trong hệ thống")}
                  </p>
                </div>
                {result.match && result.confidence !== undefined && (
                  <div className="confidence-badge">{result.confidence}%</div>
                )}
              </div>

              {result.match && result.confidence !== undefined && (
                <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-[var(--text-secondary)]">Độ tin cậy</span>
                    <span className="font-semibold">{result.confidence}%</span>
                  </div>
                  <Progress
                    value={result.confidence}
                    className="h-2 bg-zinc-800"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    {result.confidence >= 85 ? "🟢 Rất chắc chắn" : result.confidence >= 70 ? "🟡 Tạm ổn" : "🔴 Không chắc chắn"}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              💡 <span className="text-indigo-400 font-medium">Mẹo:</span> Ngưỡng mặc định là <strong>68%</strong>. Đảm bảo ánh sáng tốt và nhìn thẳng vào camera.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
