import numpy as np
from feature_extractor import extract_features

# Load saved embeddings
features_db = np.load("embeddings/features.npy")
paths_db = np.load("embeddings/paths.npy")

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def search(query_image, top_k=5):
    query_feat = extract_features(query_image)

    similarities = []

    for i in range(len(features_db)):
        sim = cosine_similarity(query_feat, features_db[i])
        similarities.append((sim, paths_db[i]))

    # Sort by similarity
    similarities.sort(reverse=True, key=lambda x: x[0])

    return similarities[:top_k]