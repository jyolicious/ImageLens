import numpy as np
import os

features = []
paths = []

folder = "embeddings"

for file in sorted(os.listdir(folder)):
    if file.startswith("features_part"):
        features.append(np.load(os.path.join(folder, file)))

    if file.startswith("paths_part"):
        paths.append(np.load(os.path.join(folder, file)))

features = np.vstack(features)
paths = np.concatenate(paths)

np.save("embeddings/features.npy", features)
np.save("embeddings/paths.npy", paths)

print("✅ Merged all embeddings!")
print("Total:", len(features))