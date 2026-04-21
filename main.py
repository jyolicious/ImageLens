from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
import faiss
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import io
import os
import cv2
import base64
from contextlib import asynccontextmanager

# ── Model & index globals ──────────────────────────────────────────────────────
model_global     = None
transform_global = None
index_global     = None
paths_db_global  = None

# ── [NEW] Segmentation flag ────────────────────────────────────────────────────
# Set to True to apply threshold segmentation before ResNet50 feature extraction.
# When False (default), the original RGB image is always used for search.
USE_SEGMENTATION = False


def load_model():
    m = models.resnet50(pretrained=True)
    m = torch.nn.Sequential(*list(m.children())[:-1])
    m.eval()
    t = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225])
    ])
    return m, t


def load_faiss_index():
    features_db = np.load("embeddings/features.npy").astype("float32")
    paths_db    = np.load("embeddings/paths.npy")
    faiss.normalize_L2(features_db)
    dim   = features_db.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(features_db)
    return index, paths_db


# ── [FIXED] Always converts to RGB — never uses edge/grayscale for features ───
def extract_features_from_pil(image: Image.Image):
    """
    Extract 2048-D ResNet50 features from an RGB image.
    Input must already be the correct image (original or segmented).
    Always converts to RGB to handle any PIL mode safely.
    """
    image = image.convert("RGB")
    img_t = transform_global(image).unsqueeze(0)
    with torch.no_grad():
        feat = model_global(img_t)
    return feat.squeeze().numpy()


# ── [NEW] Optional segmentation: threshold → RGB ──────────────────────────────
def apply_segmentation(image: Image.Image) -> Image.Image:
    """
    Simple threshold segmentation.
    Converts image → grayscale → Otsu threshold → back to RGB PIL image.
    Used only when USE_SEGMENTATION = True.
    Returns a PIL Image in RGB mode.
    """
    img_cv = np.array(image.convert("RGB"))
    img_cv = cv2.cvtColor(img_cv, cv2.COLOR_RGB2BGR)
    gray   = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # Apply mask to all 3 channels
    mask_3ch = cv2.merge([mask, mask, mask])
    segmented_bgr = cv2.bitwise_and(img_cv, mask_3ch)
    segmented_rgb = cv2.cvtColor(segmented_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(segmented_rgb)


def encode_img(img) -> str:
    _, buf = cv2.imencode(".png", img)
    return base64.b64encode(buf).decode("utf-8")


def image_to_base64(path: str):
    try:
        with Image.open(path) as img:
            img = img.convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            return base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_global, transform_global, index_global, paths_db_global
    print("Loading ResNet50...")
    model_global, transform_global = load_model()
    print("Loading FAISS index...")
    index_global, paths_db_global  = load_faiss_index()
    print(f"Ready | Segmentation: {'ON' if USE_SEGMENTATION else 'OFF'}")
    yield


app = FastAPI(title="Visual Search Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

KEYWORD_SUGGESTIONS = {
    "cycle":    {"label": "Cycling",         "emoji": "🚴", "tip": "Great for cardio health! Cycling reduces cardiovascular risk and builds leg strength."},
    "bicycle":  {"label": "Cycling",         "emoji": "🚴", "tip": "Eco-friendly commuting and excellent low-impact exercise for all ages."},
    "bike":     {"label": "Cycling",         "emoji": "🚴", "tip": "Two-wheeled freedom! Perfect for weekend trails or daily commutes."},
    "chair":    {"label": "Ergonomics",      "emoji": "🪑", "tip": "Good posture matters. Take a 5-minute walk every 45 minutes of sitting."},
    "table":    {"label": "Interior Design", "emoji": "🛋️", "tip": "A well-chosen table anchors your living or dining space."},
    "shoe":     {"label": "Running / Sport", "emoji": "👟", "tip": "Proper footwear prevents injuries. Replace running shoes every 500 km."},
    "shoes":    {"label": "Running / Sport", "emoji": "👟", "tip": "Match your shoe type to your activity — trail, road, or gym."},
    "bag":      {"label": "Travel / Fashion","emoji": "👜", "tip": "The right bag combines style with ergonomic weight distribution."},
    "mug":      {"label": "Coffee Culture",  "emoji": "☕", "tip": "Coffee in moderation (1-3 cups/day) is linked to improved focus and longevity."},
    "cup":      {"label": "Hydration",       "emoji": "🥤", "tip": "Stay hydrated! Aim for 8 glasses of water daily."},
    "lamp":     {"label": "Lighting",        "emoji": "💡", "tip": "Good lighting reduces eye strain and boosts productivity."},
    "sofa":     {"label": "Relaxation",      "emoji": "🛋️", "tip": "Quality rest is as important as exercise for overall well-being."},
    "watch":    {"label": "Time Management", "emoji": "⌚", "tip": "A good watch keeps you on track - punctuality is a superpower."},
    "camera":   {"label": "Photography",     "emoji": "📷", "tip": "Photography sharpens your eye for detail and trains mindfulness."},
    "guitar":   {"label": "Music",           "emoji": "🎸", "tip": "Playing an instrument reduces stress and enhances cognitive skills."},
    "plant":    {"label": "Wellness",        "emoji": "🌿", "tip": "Indoor plants improve air quality and reduce anxiety levels."},
    "book":     {"label": "Learning",        "emoji": "📚", "tip": "Reading 20 minutes daily expands vocabulary and reduces mental decline."},
    "laptop":   {"label": "Productivity",    "emoji": "💻", "tip": "Use the 20-20-20 rule: every 20 min, look 20 ft away for 20 seconds."},
    "phone":    {"label": "Connectivity",    "emoji": "📱", "tip": "Digital detox for 1 hour before bed improves sleep quality significantly."},
}


def get_suggestion(path: str) -> dict:
    name = os.path.basename(path).lower().replace("_", " ").replace("-", " ")
    for kw, info in KEYWORD_SUGGESTIONS.items():
        if kw in name:
            return info
    parts = path.replace("\\", "/").split("/")
    if len(parts) >= 2:
        folder = parts[-2].lower().replace("_", " ")
        return {"label": folder.title(), "emoji": "🖼️",
                "tip": f"This item belongs to the '{folder}' category. Explore more like it!"}
    return {"label": "Visual Match", "emoji": "🔍",
            "tip": "Visually similar image found using deep learning embeddings."}


# ── [FIXED] /search — always uses original RGB image for feature extraction ───
@app.post("/search")
async def search_endpoint(
    file: UploadFile = File(...),
    top_k: int = 5,
    use_segmentation: bool = False,   # [NEW] frontend can override per-request
):
    """
    Accepts the ORIGINAL uploaded image (RGB).
    Feature extraction always uses the original (or segmented) image.
    Edge/grayscale images are NEVER used here — preprocessing is UI-only.

    Query params:
      top_k            — number of results (default 5)
      use_segmentation — if True, applies threshold segmentation before ResNet50
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    contents    = await file.read()
    query_image = Image.open(io.BytesIO(contents)).convert("RGB")  # always RGB

    # [NEW] Apply segmentation if requested (either global flag or per-request param)
    apply_seg = USE_SEGMENTATION or use_segmentation
    if apply_seg:
        query_image_for_features = apply_segmentation(query_image)
    else:
        query_image_for_features = query_image  # original RGB — correct default

    # Feature extraction on original (or segmented) RGB image
    query_feat = extract_features_from_pil(query_image_for_features).astype("float32")
    query_feat = np.expand_dims(query_feat, axis=0)
    faiss.normalize_L2(query_feat)

    scores, indices = index_global.search(query_feat, top_k)

    results = []
    for i in range(top_k):
        score      = float(scores[0][i])
        path       = str(paths_db_global[indices[0][i]])
        b64        = image_to_base64(path)
        suggestion = get_suggestion(path)
        results.append({
            "score":      round(score, 4),
            "path":       path,
            "image_b64":  b64,
            "suggestion": suggestion,
            "rank":       i + 1,
        })

    # Return the actual query image used (segmented or original)
    buf = io.BytesIO()
    query_image_for_features.save(buf, format="JPEG", quality=85)
    query_b64 = base64.b64encode(buf.getvalue()).decode()

    return {
        "query_image_b64":   query_b64,
        "results":           results,
        "total":             len(results),
        "segmentation_used": apply_seg,   # [NEW] inform frontend
    }


@app.get("/health")
def health():
    return {
        "status":       "ok",
        "index_size":   index_global.ntotal if index_global else 0,
        "segmentation": USE_SEGMENTATION,
    }


# ── [UPDATED] /preprocess — visualization only, adds Gaussian blur step ──────
@app.post("/preprocess")
async def run_preprocess(file: UploadFile = File(...)):
    """
    4-step (now 5-step) MV preprocessing pipeline — FOR VISUALIZATION ONLY.
    Output is NEVER used as input to /search or ResNet50.

    Steps:
      1. Original
      2. Grayscale
      3. Gaussian Blur        [NEW]
      4. Histogram Equalisation
      5. Edge Detection (Canny)
    """
    data = await file.read()
    arr  = np.frombuffer(data, dtype=np.uint8)
    img  = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    if img is None:
        return JSONResponse({"error": "bad image"}, status_code=400)

    img  = cv2.resize(img, (400, 400))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # [NEW] Gaussian blur step
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Histogram equalisation applied to blurred image for better edge detection
    eq   = cv2.equalizeHist(blurred)
    otsu, _ = cv2.threshold(eq, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    edges   = cv2.Canny(eq, otsu * 0.5, otsu)

    return {
        "steps": [
            {"label": "Original",               "desc": "Your uploaded image (400×400)",            "data": encode_img(img)},
            {"label": "Grayscale",               "desc": "Luminance channel extracted",              "data": encode_img(gray)},
            {"label": "Gaussian Blur",           "desc": "Noise reduction (5×5 kernel)",             "data": encode_img(blurred)},   # [NEW]
            {"label": "Histogram Equalisation",  "desc": "Contrast enhanced on blurred image",       "data": encode_img(eq)},
            {"label": "Edge Detection",          "desc": "Canny edges — visualization only",         "data": encode_img(edges)},
        ]
    }