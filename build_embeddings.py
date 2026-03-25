import os
import numpy as np
from feature_extractor import extract_features

dataset_path = "dataset/Stanford_Online_Products"

os.makedirs("embeddings", exist_ok=True)

features_list = []
paths_list = []

batch_size = 2000        # save every 2000 images
log_interval = 500       # print every 500 images

count = 0
file_index = 0

print("🚀 Starting full dataset processing...\n")

for root, dirs, files in os.walk(dataset_path):
    for file in files:
        if file.lower().endswith((".jpg", ".png", ".jpeg")):

            path = os.path.join(root, file)

            try:
                features = extract_features(path)

                features_list.append(features)
                paths_list.append(path)

                count += 1

                # 🔹 Controlled logging
                if count % log_interval == 0:
                    print(f"Processed {count} images...")

                # 🔹 Save batch
                if count % batch_size == 0:
                    np.save(f"embeddings/features_part_{file_index}.npy", np.array(features_list))
                    np.save(f"embeddings/paths_part_{file_index}.npy", np.array(paths_list))

                    print(f"💾 Saved batch {file_index} (Total processed: {count})\n")

                    features_list = []
                    paths_list = []
                    file_index += 1

            except Exception as e:
                print(f"Error: {path}")

# 🔹 Save remaining data
if features_list:
    np.save(f"embeddings/features_part_{file_index}.npy", np.array(features_list))
    np.save(f"embeddings/paths_part_{file_index}.npy", np.array(paths_list))

print("\n✅ Full dataset processing completed!")
print(f"Total images processed: {count}")