import os
# Cấu hình tối ưu bộ nhớ RAM cho TensorFlow trên Server 512MB
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import numpy as np
import cv2

app = FastAPI(
    title="Face Recognition AI Microservice",
    description="Trich xuat Face Embedding 512D tu anh khuon mat dung DeepFace ArcFace",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "AI Service is running", "model": "ArcFace (512D)"}

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract-embedding")
async def extract_embedding(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File phai la anh (image/jpeg, image/png, ...)")

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Khong the doc file anh.")

    try:
        embedding_objs = DeepFace.represent(
            img_path=img,
            model_name="ArcFace",
            enforce_detection=False,
            detector_backend="skip"
        )

        embedding = embedding_objs[0]["embedding"]
        return {
            "embedding": embedding,
            "model": "ArcFace",
            "dimensions": len(embedding)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Loi trich xuat embedding: {str(e)}")
