# 🔍 Visual Search Engine using Deep Learning

An AI-powered visual search system that retrieves similar images based on content using deep learning embeddings and similarity search.

---

## 🚀 Features

- Upload an image and find visually similar images
- Deep feature extraction using ResNet50
- Fast similarity search using FAISS
- Returns Top-K similar results with similarity scores

---

## 🧠 How It Works

1. Image → Feature Extraction (ResNet50)
2. Convert image into embedding vector (2048-d)
3. Compare with dataset embeddings
4. Retrieve Top-K similar images using FAISS

---

---

## ⚙️ Setup Instructions

1. Clone the repository
```bash
git clone <your-repo-link>
cd visual_search_project
2. Create virtual environment
python -m venv venv
venv\Scripts\activate
3. Install dependencies
pip install torch torchvision pillow numpy matplotlib faiss-cpu
4. Add Dataset
Download dataset manually (e.g., Stanford Online Products) and place inside:
dataset/Stanford_Online_Products/
5. Build embeddings
python build_embeddings.py
6. Run search
python main.py

📊 Output
Displays top similar images with similarity scores
Based on cosine similarity in embedding space