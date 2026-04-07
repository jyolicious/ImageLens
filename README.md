# 📌 Visual Search Engine using Deep Learning

An AI-powered visual similarity search system that retrieves images
based on content using deep learning embeddings and fast vector search.

------------------------------------------------------------------------

## 🚀 Project Overview

This project implements a reverse image search engine where: - A user
uploads an image via a React frontend - The backend extracts features
using ResNet50 - The image is converted into a 2048-dimensional
embedding - Similar images are retrieved using FAISS

------------------------------------------------------------------------

## 🏗️ Project Structure

mv/ ├── backend/ │ ├── dataset/ │ ├── embeddings/ │ ├──
build_embeddings.py │ ├── feature_extractor.py │ ├── merge_embeddings.py
│ ├── search.py │ ├── main.py │ ├── requirements.txt │ ├── frontend/ │
├── public/ │ ├── src/ │ │ ├── App.jsx │ │ ├── main.jsx │ │ ├── App.css
│ │ ├── index.css │ ├── package.json │ ├── vite.config.js │ ├──
test_images/ ├── venv/ └── README.md

------------------------------------------------------------------------

## ⚙️ Tech Stack

Frontend: React (Vite), JavaScript, CSS\
Backend: FastAPI (Python)\
AI/ML: ResNet50, FAISS, NumPy, OpenCV

------------------------------------------------------------------------

## 🔥 Features

-   Upload an image and find visually similar images
-   Deep feature extraction using pretrained CNN
-   Fast similarity search using FAISS
-   Returns Top-K similar results

------------------------------------------------------------------------

## 🧠 Computer Vision Concepts Implemented

### 1. Feature Extraction (Deep Learning)

-   Uses ResNet50 (pretrained CNN)
-   Extracts high-level visual features (edges, textures, objects)
-   Converts image into numerical representation

### 2. Image Embeddings

-   Each image is represented as a 2048-dimensional vector
-   Captures semantic meaning of the image

### 3. Transfer Learning

-   Uses pretrained weights from ImageNet
-   Avoids training model from scratch

### 4. Similarity Measurement

-   Uses distance metrics like cosine similarity / L2 distance
-   Finds closest matching embeddings

### 5. Approximate Nearest Neighbor (ANN Search)

-   FAISS is used for efficient similarity search
-   Handles large-scale image datasets

### 6. Content-Based Image Retrieval (CBIR)

-   Searches images based on visual content instead of metadata

------------------------------------------------------------------------

## 🛠️ Setup Instructions

### Backend

cd backend\
python -m venv venv\
venv`\Scripts`{=tex}`\activate  `{=tex} pip install -r requirements.txt

Generate embeddings: python build_embeddings.py\
python merge_embeddings.py

Run server: uvicorn main:app --reload

------------------------------------------------------------------------

### Frontend

cd frontend\
npm install\
npm run dev

------------------------------------------------------------------------

## 🔗 API Endpoint

POST /search

Response: { "results": \[ { "image": "path/to/image.jpg", "score": 0.92
} \] }

------------------------------------------------------------------------

## 🚀 Future Improvements

-   Use CLIP for better semantic search
-   Add UI improvements
-   Deploy with Docker

------------------------------------------------------------------------

## 👩‍💻 Author

Jyotsna Kasibhotla
