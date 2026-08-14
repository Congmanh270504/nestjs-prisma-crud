from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import insightface
from insightface.app import FaceAnalysis

app = FastAPI(
    title="Face Recognition AI Microservice",
    description="Trích xuất Face Embedding 512D dùng InsightFace ArcFace ONNX Runtime",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo InsightFace với ONNX Runtime CPU (RAM ~140MB)
face_app = None

@app.on_event("startup")
def startup_event():
    global face_app
    print("⏳ Initializing InsightFace ArcFace ONNX model...")
    face_app = FaceAnalysis(name='buffalo_s', providers=['CPUExecutionProvider'])
    face_app.prepare(ctx_id=0, det_size=(320, 320))
    print("✅ InsightFace ArcFace ONNX model loaded! RAM < 180MB.")

@app.get("/")
def home():
    return {"status": "AI Service is running", "engine": "InsightFace ArcFace (ONNX 512D)"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/extract-embedding")
async def extract_embedding(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File phải là ảnh (image/jpeg, image/png, ...)")

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Không thể đọc file ảnh.")

    try:
        faces = face_app.get(img)
        
        # Nếu chưa detect được góc nghiêng, thử resize ảnh về 320x320 để detect
        if not faces or len(faces) == 0:
            h, w = img.shape[:2]
            resized = cv2.resize(img, (320, 320))
            faces = face_app.get(resized)

        if not faces or len(faces) == 0:
            raise HTTPException(status_code=400, detail="Không phát hiện thấy khuôn mặt trong ảnh.")

        # Lấy mảng vector đặc trưng 512 chiều của khuôn mặt
        embedding = faces[0].embedding.tolist()
        return {
            "embedding": embedding,
            "model": "ArcFace (InsightFace ONNX)",
            "dimensions": len(embedding)
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi trích xuất embedding: {str(e)}")

