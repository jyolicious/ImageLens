# 📌 Content-Based Image Retrieval (CBIR) System using Machine Vision

An AI-powered visual similarity search system that retrieves images based on
visual content using multi-stage machine vision preprocessing, deep learning
embeddings, and fast vector search.

---

## 🚀 Project Overview

This project implements a Content-Based Image Retrieval (CBIR) system where:

- A user uploads an image via a React frontend
- A multi-stage MV preprocessing pipeline runs for visualization
- The backend extracts CNN features using ResNet50 on the original RGB image
- The image is converted into a 2048-dimensional embedding
- Similar images are retrieved using FAISS ANN search
- Optional threshold segmentation can be applied before feature extraction

---

## ⚙️ Tech Stack

**Frontend:** React (Vite), JavaScript, CSS  
**Backend:** FastAPI (Python)  
**AI/ML:** ResNet50, FAISS, NumPy, OpenCV, scikit-learn

---

## 🔥 Features

- **Multi-stage image preprocessing pipeline** — Grayscale → Gaussian Blur → Histogram Equalisation → Canny Edge Detection (visualization only)
- **CNN-based feature extraction (ResNet50)** — always operates on the original RGB image, never on preprocessed output
- **Approximate Nearest Neighbor (ANN) search via FAISS** — cosine similarity with L2-normalized 2048-D vectors
- Optional **threshold segmentation** before feature extraction (user-selectable per query)
- Upload an image and find Top-K visually similar results
- Pinterest-style chaining — use any result as the next query
- t-SNE embedding visualization script for dataset analysis

---

## 🧠 Machine Vision Concepts Implemented

### 1. Multi-Stage Preprocessing Pipeline (Visualization Only)

- **Grayscale conversion** — extracts luminance channel
- **Gaussian Blur** — noise reduction using a 5×5 kernel before further processing
- **Histogram Equalisation** — enhances contrast on blurred image
- **Canny Edge Detection** — reveals structural features using Otsu-derived thresholds
- These steps are **display-only** and never fed into the search pipeline

### 2. Feature Extraction (Deep Learning)

- Uses ResNet50 (pretrained CNN) with the final classification layer removed
- Extracts high-level visual features — textures, shapes, objects
- Converts each image into a 2048-dimensional numerical representation
- **Always uses the original RGB image** (or optionally the segmented RGB image) as input

### 3. Image Embeddings

- Each image is represented as a 2048-dimensional feature vector
- Captures semantic meaning and visual structure of the image

### 4. Transfer Learning

- Uses pretrained ImageNet weights
- No training from scratch required

### 5. Optional Threshold Segmentation

- Applies Otsu binary thresholding to isolate foreground before feature extraction
- User chooses per-query whether to use the original or segmented image
- Useful for object-centric queries; can be toggled via the UI modal

### 6. Similarity Measurement

- L2-normalized vectors enable cosine similarity via inner product
- FAISS `IndexFlatIP` finds closest embeddings efficiently

### 7. Approximate Nearest Neighbor (ANN) Search

- FAISS is used for scalable, millisecond-speed similarity search
- Handles large-scale image datasets

### 8. Content-Based Image Retrieval (CBIR)

- Searches images based on visual content, not metadata or tags

---

## 🛠️ Setup Instructions

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Generate embeddings:

```bash
python build_embeddings.py
python merge_embeddings.py
```

Run server:

```bash
uvicorn main:app --reload
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔗 API Endpoints

**`POST /preprocess`**  
Returns 5-step MV pipeline visualization (Original → Grayscale → Gaussian Blur → Histogram EQ → Edge Detection). For display only — not used as search input.

**`POST /search?use_segmentation=false`**  
Accepts the original uploaded image. Extracts ResNet50 features and returns Top-K similar results via FAISS. Set `use_segmentation=true` to apply threshold segmentation before feature extraction.

```json
{
  "results": [
    { "rank": 1, "path": "path/to/image.jpg", "score": 0.92, "segmentation_used": false }
  ]
}
```

**`GET /health`**  
Returns index size and current segmentation flag status.

---

## 📊 Embedding Visualization

A t-SNE script is included to visualize the embedding space:

```bash
python visualize_embeddings.py
python visualize_embeddings.py --perplexity 50 --n_iter 1500
python visualize_embeddings.py --save tsne_plot.png
```

Loads `embeddings/features.npy`, runs t-SNE with cosine metric, and plots a scatter chart coloured by category (parent folder). Clusters of visually similar images should naturally group together.

---

## 🚀 Future Improvements

- Use CLIP for better semantic search
- Deploy with Docker
- Add active learning loop for relevance feedback

---

## 👩‍💻 Author

Jyotsna Kasibhotla