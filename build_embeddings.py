import os
import numpy as np
from feature_extractor import extract_features

# 👉 CHANGE THIS PATH if needed
dataset_path = "dataset/Stanford_Online_Products"

embeddings = []
image_paths = []

count = 0
limit = 500   # 🔥 keep small initially (increase later)

print("Starting embedding generation...\n")

for root, dirs, files in os.walk(dataset_path):
    for file in files:
        if file.lower().endswith((".jpg", ".png", ".jpeg")):

            if count >= limit:
                break

            path = os.path.join(root, file)

            try:
                features = extract_features(path)
                embeddings.append(features)
                image_paths.append(path)

                count += 1
                print(f"[{count}] Processed: {path}")

            except Exception as e:
                print(f"Error processing {path}: {e}")

    if count >= limit:
        break

# Convert to numpy arrays
embeddings = np.array(embeddings)
image_paths = np.array(image_paths)

# Create embeddings folder if not exists
os.makedirs("embeddings", exist_ok=True)

# Save files
np.save("embeddings/features.npy", embeddings)
np.save("embeddings/paths.npy", image_paths)

print("\n✅ Embedding generation completed!")
print(f"Total images processed: {len(embeddings)}")
print("Saved to 'embeddings/' folder.")