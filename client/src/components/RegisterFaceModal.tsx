import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { registerFace } from "../api/faceApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Props {
  onClose: () => void;
  onSuccess: (name: string) => void;
}

type Mode = "camera" | "upload";

export default function RegisterFaceModal({ onClose, onSuccess }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("camera");
  const [preview, setPreview] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(() => {
    const src = webcamRef.current?.getScreenshot();
    if (!src) return;
    setPreview(src);
    fetch(src).then((r) => r.blob()).then(setPreviewBlob);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewBlob(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setPreview(null);
    setPreviewBlob(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Vui lòng nhập tên"); return; }
    if (!previewBlob) { setError("Vui lòng chụp ảnh hoặc upload ảnh khuôn mặt"); return; }
    setError(null);
    setIsLoading(true);
    try {
      await registerFace(name.trim(), previewBlob);
      onSuccess(name.trim());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">➕ Đăng ký khuôn mặt</DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Chụp ảnh hoặc upload ảnh để đăng ký vào hệ thống nhận diện
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-[var(--text-secondary)]">Họ và tên *</Label>
            <Input
              className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              placeholder="Nhập tên người dùng..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>

          {/* Mode selector */}
          <div className="flex gap-2">
            {(["camera", "upload"] as Mode[]).map((m) => (
              <Button
                key={m}
                variant={mode === m ? "default" : "outline"}
                className={`flex-1 ${mode === m
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                onClick={() => switchMode(m)}
              >
                {m === "camera" ? "📷 Camera" : "📁 Upload"}
              </Button>
            ))}
          </div>

          {/* Camera mode */}
          {mode === "camera" && (
            !preview ? (
              <div className="space-y-2">
                <div className="webcam-wrapper rounded-xl" style={{ height: 200 }}>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.95}
                    videoConstraints={{ facingMode: "user" }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    mirrored
                  />
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleCapture}>
                  📸 Chụp ảnh
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <img src={preview} className="w-full rounded-xl object-cover" style={{ maxHeight: 200 }} alt="preview" />
                <Button variant="outline" className="w-full border-[var(--border)] text-[var(--text-secondary)]" onClick={() => { setPreview(null); setPreviewBlob(null); }}>
                  🔄 Chụp lại
                </Button>
              </div>
            )
          )}

          {/* Upload mode */}
          {mode === "upload" && (
            !preview ? (
              <div>
                <div
                  className="upload-zone"
                  onClick={() => fileRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) { setPreviewBlob(f); const r = new FileReader(); r.onload = (ev) => setPreview(ev.target?.result as string); r.readAsDataURL(f); }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="upload-icon">🖼️</div>
                  <p><strong>Nhấn để chọn ảnh</strong> hoặc kéo thả vào đây</p>
                  <p style={{ marginTop: 4, fontSize: 12 }}>JPG, PNG, WEBP</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
              </div>
            ) : (
              <div className="space-y-2">
                <img src={preview} className="w-full rounded-xl object-cover" style={{ maxHeight: 200 }} alt="preview" />
                <Button variant="outline" className="w-full border-[var(--border)] text-[var(--text-secondary)]" onClick={() => { setPreview(null); setPreviewBlob(null); fileRef.current && (fileRef.current.value = ""); }}>
                  🔄 Đổi ảnh
                </Button>
              </div>
            )
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 border-[var(--border)] text-[var(--text-secondary)]" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button
              className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSubmit}
              disabled={isLoading || !previewBlob}
            >
              {isLoading ? <><span className="spinner mr-2" />Đang đăng ký...</> : "✅ Đăng ký khuôn mặt"}
            </Button>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
