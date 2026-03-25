import numpy as np
import faiss
from feature_extractor import extract_features

# Load embeddings
features_db = np.load("embeddings/features.npy").astype("float32")
paths_db = np.load("embeddings/paths.npy")

# Normalize vectors (important for cosine similarity)
faiss.normalize_L2(features_db)

# Build FAISS index
dimension = features_db.shape[1]
index = faiss.IndexFlatIP(dimension)  # Inner Product = cosine similarity after normalization
index.add(features_db)

print("FAISS index built successfully.")

def search(query_image, top_k=5):
    query_feat = extract_features(query_image).astype("float32")
    query_feat = np.expand_dims(query_feat, axis=0)

    # Normalize query
    faiss.normalize_L2(query_feat)

    # Search
    scores, indices = index.search(query_feat, top_k)

    results = []
    for i in range(top_k):
        score = scores[0][i]
        path = paths_db[indices[0][i]]
        results.append((score, path))

    return results